import { SheetSetup } from '../data/datasets';
import { literal, SheetModel } from '../engine/engine';
import { isErrorValue } from '../engine/format';
import { addr, findRefs, functionsUsed, parseAddr, shiftFormula, translateFormula } from '../engine/formula';
import { explainError } from '../engine/errors';
import { Lang } from '../engine/lang';
import { FormulaExercise, Rich, SelectExercise, Target } from './types';

export interface CheckResult {
  ok: boolean;
  messages: Rich[];
  /** Résultat cellule par cellule (pour colorer la grille) */
  cells: Record<string, boolean>;
}

export function expandTarget(t: Target): string[] {
  const a = parseAddr(t.cell);
  if (!t.fillTo) return [t.cell];
  const b = parseAddr(t.fillTo);
  const out: string[] = [];
  for (let r = a.row; r <= b.row; r++) for (let c = a.col; c <= b.col; c++) out.push(addr(r, c));
  return out;
}

/** Crée la feuille d'un exercice. Les formules du jeu de données sont écrites en anglais et traduites. */
export function modelFromSetup(setup: SheetSetup, lang: Lang): SheetModel {
  const cells: SheetSetup['cells'] = {};
  for (const [k, v] of Object.entries(setup.cells)) cells[k] = typeof v === 'string' && v.startsWith('=') ? translateFormula(v, 'en', lang) : v;
  return new SheetModel(lang, cells, setup.fmts);
}

/** Pose des formules (anglais) dans les cibles, recopiées si besoin, et renvoie les valeurs obtenues. */
export function computeFormulas(ex: FormulaExercise, formulas: (string | undefined)[], setup = ex.setup()): Map<string, unknown> {
  const m = modelFromSetup(setup, 'en');
  const cells: { row: number; col: number; raw: string }[] = [];
  ex.targets.forEach((t, i) => {
    const f = formulas[i] ?? (t.value !== undefined ? literal(t.value, 'en') : undefined);
    if (f === undefined) return;
    const a = parseAddr(t.cell);
    for (const x of expandTarget(t)) {
      const p = parseAddr(x);
      cells.push({ ...p, raw: shiftFormula(f, p.row - a.row, p.col - a.col, 'en') });
    }
  });
  m.setMany(cells);
  const out = new Map<string, unknown>();
  for (const t of ex.targets) for (const x of expandTarget(t)) out.set(x, m.valueAt(x));
  m.destroy();
  return out;
}

export function sameValue(a: unknown, b: unknown): boolean {
  const empty = (v: unknown) => v === null || v === undefined || v === '';
  if (empty(a) && empty(b)) return true;
  if (isErrorValue(a) || isErrorValue(b)) return isErrorValue(a) && isErrorValue(b) && a.type === b.type;
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
  if (typeof a === 'string' && typeof b === 'string') return a.trim() === b.trim();
  return a === b;
}

const valuesMatch = (user: Map<string, unknown>, ref: Map<string, unknown>) => [...ref.keys()].every((k) => sameValue(user.get(k), ref.get(k)));

export function expectedValues(ex: FormulaExercise): Map<string, unknown> {
  return computeFormulas(
    ex,
    ex.targets.map((t) => t.solution),
  );
}

/** Correction d'un exercice de formule. */
export function checkFormula(ex: FormulaExercise, user: SheetModel, expected = expectedValues(ex)): CheckResult {
  const lang = user.lang;
  const cells: Record<string, boolean> = {};
  const userVals = new Map<string, unknown>();
  for (const k of expected.keys()) {
    const v = user.valueAt(k);
    userVals.set(k, v);
    cells[k] = sameValue(v, expected.get(k));
  }
  const fail = (messages: Rich[]): CheckResult => ({ ok: false, messages, cells });

  // 1. Cellules vides / valeurs tapées à la main
  for (const t of ex.targets) {
    const first = parseAddr(t.cell);
    const raw = user.getRaw(first.row, first.col);
    if (raw === '') return fail([`La cellule **${t.cell}** est vide : c’est là que tu dois écrire ta réponse.`]);
    if (t.requireFormula !== false && !raw.startsWith('=')) {
      return fail([
        `En **${t.cell}**, tu as tapé une valeur à la main (\`${raw}\`). Ici, on veut une **formule** qui commence par \`=\` : en entretien, une valeur tapée est comptée fausse, même si le nombre est juste.`,
      ]);
    }
    if (t.fillTo) {
      const missing = expandTarget(t).filter((x) => {
        const p = parseAddr(x);
        return user.getRaw(p.row, p.col) === '';
      });
      if (missing.length)
        return fail([
          `Ta formule doit être recopiée de **${t.cell}** jusqu’à **${t.fillTo}** (il manque ${missing.length} cellule${missing.length > 1 ? 's' : ''}). Sélectionne ${t.cell}, puis fais glisser la poignée de recopie (le petit carré en bas à droite) ou double-clique dessus.`,
        ]);
      const typed = expandTarget(t).filter((x) => {
        const p = parseAddr(x);
        return t.requireFormula !== false && !user.getRaw(p.row, p.col).startsWith('=');
      });
      if (typed.length) return fail([`La cellule **${typed[0]}** contient une valeur tapée à la main, pas une formule : recopie la formule de ${t.cell} au lieu de taper les résultats.`]);
    }
  }

  const userFormula = (t: Target) => {
    const p = parseAddr(t.cell);
    return user.getRaw(p.row, p.col);
  };

  if (Object.values(cells).every(Boolean)) {
    // 2. Fonction imposée
    const req = ex.requiredFunctions ?? [];
    const used = new Set(ex.targets.flatMap((t) => functionsUsed(userFormula(t), lang)));
    const missing = req.filter((f) => !used.has(f));
    if (missing.length)
      return fail([`Le résultat est juste, mais l’exercice demande d’utiliser {{${missing[0]}}}. En test, c’est la méthode qui est évaluée : refais-le avec cette fonction.`]);
    return { ok: true, messages: [], cells };
  }

  // 3. Diagnostic précis
  const msgs: Rich[] = [];
  // a) même formule (au texte près) qu'une erreur typique, b) mêmes valeurs qu'une erreur typique
  const normF = (f: string | undefined) => (f ?? '').replace(/\s/g, '').toUpperCase();
  const mineEn = ex.targets.map((t) => normF(translateFormula(userFormula(t), lang, 'en')));
  const byText = ex.mistakes.find((m) => m.formulas.every((f, i) => f === undefined || normF(f) === mineEn[i]));
  const byValue = byText ?? ex.mistakes.find((m) => valuesMatch(userVals, computeFormulas(ex, m.formulas)));
  if (byValue) msgs.push(byValue.message);

  const wrongTarget = ex.targets.find((t) => expandTarget(t).some((x) => !cells[x]))!;
  const firstWrong = expandTarget(wrongTarget).find((x) => !cells[x])!;
  const uf = userFormula(wrongTarget);
  const ufEn = translateFormula(uf, lang, 'en');
  const vWrong = userVals.get(firstWrong);

  if (!msgs.length && isErrorValue(vWrong)) {
    const p = parseAddr(firstWrong);
    msgs.push(`En **${firstWrong}**, ta formule renvoie l’erreur ${user.info(p.row, p.col).display} : ${explainError(vWrong.type, user.getRaw(p.row, p.col), lang, (vWrong as { message?: string }).message)}`);
  }

  if (!msgs.length && wrongTarget.fillTo && cells[wrongTarget.cell]) {
    msgs.push(
      `Ta première cellule (**${wrongTarget.cell}**) est juste, mais la recopie casse à partir de **${firstWrong}**. Clique sur ${firstWrong} et regarde sa formule : une référence qui aurait dû rester fixe a bougé. Il manque sûrement un \`$\` (touche F4).`,
    );
  }

  if (!msgs.length && wrongTarget.solution) {
    const sol = findRefs(wrongTarget.solution, 'en').filter((s) => s.from !== s.to);
    const mine = findRefs(ufEn, 'en').filter((s) => s.from !== s.to);
    if (sol.length && sol.length === mine.length) {
      for (let i = 0; i < sol.length; i++) {
        const a = sol[i];
        const b = mine[i];
        const txt = uf.slice(findRefs(uf, lang).filter((s) => s.from !== s.to)[i]?.start ?? 0, findRefs(uf, lang).filter((s) => s.from !== s.to)[i]?.end ?? 0);
        if (a.from.col === b.from.col && a.to.col === b.to.col) {
          if (b.from.row !== a.from.row) {
            msgs.push(`Ta plage \`${txt}\` ne commence pas à la bonne ligne : les données commencent en ligne ${a.from.row + 1} (la ligne 1 contient les titres).`);
            break;
          }
          if (b.to.row !== a.to.row) {
            msgs.push(`Ta plage \`${txt}\` ne s’arrête pas à la bonne ligne : les données vont jusqu’à la ligne ${a.to.row + 1}. Astuce : Cmd+Maj+↓ sélectionne jusqu’au bout des données.`);
            break;
          }
        } else if (a.from.row === b.from.row && a.to.row === b.to.row && (a.from.col !== b.from.col || a.to.col !== b.to.col)) {
          msgs.push(`Ta plage \`${txt}\` n’est pas dans la bonne colonne : relis le titre en ligne 1 de la colonne que tu as prise.`);
          break;
        }
      }
    }
  }

  if (!msgs.length) {
    const fns = functionsUsed(uf, lang);
    if (fns.includes('VLOOKUP')) {
      const t = ufEn.replace(/\s/g, '').toUpperCase();
      const m = /VLOOKUP\(([^()]*)\)/.exec(t);
      const args = m ? m[1].split(',') : [];
      if (args.length === 3 || /,(TRUE|1)\)/.test(t))
        msgs.push(`{{VLOOKUP}} sans {{FALSE}} en dernier argument fait une recherche **approchée** : elle renvoie une valeur voisine au lieu de la valeur exacte. Ajoute \`${lang === 'fr' ? ';FAUX' : ',FALSE'}\` à la fin.`);
    }
  }

  const e = expected.get(firstWrong);
  if (!msgs.length && typeof e === 'number' && typeof vWrong === 'number') {
    if (e !== 0 && Math.abs(vWrong / e - 100) < 1e-6)
      msgs.push('Ton résultat est 100 fois trop grand : dans Excel, un pourcentage se calcule sans « ×100 ». On obtient 0,25 et on l’affiche en 25 % avec le format pourcentage.');
    else if (Math.abs(vWrong - e) < 0.01 * Math.max(1, Math.abs(e)) && Math.abs(vWrong - e) > 1e-9)
      msgs.push('Tu y es presque : ton résultat est très proche. Vérifie l’arrondi demandé (nombre de décimales) ou une parenthèse.');
  }

  if (!msgs.length) {
    const req = ex.requiredFunctions ?? [];
    const used = new Set(functionsUsed(uf, lang));
    const miss = req.find((f) => !used.has(f));
    if (miss) msgs.push(`Ce n’est pas le bon résultat. Indice : cet exercice se fait avec {{${miss}}}.`);
    else msgs.push(`Ce n’est pas le bon résultat en **${firstWrong}**. Relis la consigne, clique sur la cellule et vérifie chaque référence colorée de ta formule. Tu peux aussi demander un indice.`);
  }
  return fail(msgs);
}

export function checkSelect(ex: SelectExercise, selection: string): CheckResult {
  const norm = (s: string) => s.toUpperCase().replace(/\$/g, '');
  if (norm(selection) === norm(ex.expected)) return { ok: true, messages: [], cells: {} };
  const m = ex.mistakes.find((x) => norm(x.selection) === norm(selection));
  return {
    ok: false,
    messages: [m ? m.message : `Ta sélection est **${selection}**, ce n’est pas ce qui est demandé. Regarde la case de nom (à gauche de la barre de formule) pendant que tu sélectionnes.`],
    cells: {},
  };
}

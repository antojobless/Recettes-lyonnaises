import { ALL_EXERCISES, MODULES } from '../exercises';
import { Exercise } from '../exercises/types';
import { rng } from '../data/random';
import { DailySession, Progress } from '../state/progress';
import { isUnlocked, nextModule } from '../state/stats';

/** Minutes estimées pour un exercice. */
export function minutesOf(e: Exercise): number {
  if (e.minutes) return e.minutes;
  switch (e.kind) {
    case 'quiz':
      return 1.5;
    case 'select':
      return 1.5;
    case 'pivot':
      return 4;
    default:
      return 3;
  }
}

const unlockedModules = (p: Progress) => MODULES.filter((_, i) => isUnlocked(p, i)).map((m) => m.id);

/**
 * Compose la séance du jour (~30 à 45 min) :
 *  - un peu de nouveau (le prochain module, ~10 min),
 *  - beaucoup de révision : les notions à revoir aujourd'hui (ratées d'abord, puis les plus anciennes),
 *  - un mini-test chronométré de 3 exercices déjà vus, sans indice.
 */
export function buildSession(p: Progress, day: string): DailySession {
  const seed = Number(day.replace(/-/g, ''));
  const r = rng(seed);
  const open = new Set(unlockedModules(p));
  const pool = ALL_EXERCISES.filter((e) => open.has(e.module));
  const used = new Set<string>();
  const items: DailySession['items'] = [];
  let minutes = 0;
  const add = (e: Exercise, kind: 'new' | 'review') => {
    used.add(e.id);
    items.push({ id: e.id, kind });
    minutes += minutesOf(e);
  };

  // 1. Révisions : notions dues, ratées d'abord puis les plus anciennes
  const due = Object.entries(p.notions)
    .filter(([, n]) => n.due <= day)
    .sort((a, b) => a[1].box - b[1].box || a[1].due.localeCompare(b[1].due));
  for (const [notion] of due) {
    if (minutes >= 22) break;
    const cands = pool.filter((e) => e.notions.includes(notion) && !used.has(e.id));
    if (!cands.length) continue;
    // de préférence un exercice raté ou pas encore réussi, sinon le moins récemment fait
    cands.sort((a, b) => Number(!!p.ex[a.id]?.solved) - Number(!!p.ex[b.id]?.solved) || (p.ex[a.id]?.last ?? '').localeCompare(p.ex[b.id]?.last ?? ''));
    add(cands[0], 'review');
  }

  // 2. Nouveau : les prochains exercices non réussis du module en cours
  const nm = nextModule(p);
  const fresh = nm.exercises.filter((e) => !p.ex[e.id]?.solved && !used.has(e.id));
  let newMin = 0;
  for (const e of fresh) {
    if (newMin >= 10 && items.length > 0) break;
    add(e, 'new');
    newMin += minutesOf(e);
  }

  // 3. Compléter avec des révisions d'exercices anciens si la séance est courte
  const old = pool.filter((e) => p.ex[e.id]?.solved && !used.has(e.id)).sort((a, b) => (p.ex[a.id]!.last ?? '').localeCompare(p.ex[b.id]!.last ?? ''));
  for (const e of old) {
    if (minutes >= 27) break;
    add(e, 'review');
  }
  // Toujours pas assez (débutant) : la suite du module, puis le début du module suivant
  const after = MODULES.filter((m) => m.id >= nm.id).flatMap((m) => m.exercises);
  for (const e of after) {
    if (minutes >= 27) break;
    if (!used.has(e.id) && !p.ex[e.id]?.solved) add(e, 'new');
  }

  // 4. Mini-test : 3 exercices de grille déjà vus (sinon du module en cours), sans indice
  const seen = pool.filter((e) => (e.kind === 'formula' || e.kind === 'quiz') && (p.ex[e.id]?.solved || used.has(e.id)));
  const test: string[] = [];
  const bag = [...seen];
  while (test.length < 3 && bag.length) test.push(bag.splice(Math.floor(r.next() * bag.length), 1)[0].id);
  const testSeconds = Math.max(5, Math.round(test.map((id) => minutesOf(ALL_EXERCISES.find((e) => e.id === id)!)).reduce((s, x) => s + x, 0) * 0.8)) * 60;
  return { date: day, items, test, testSeconds, done: {} };
}

export function sessionMinutes(s: DailySession): number {
  const m = (id: string) => minutesOf(ALL_EXERCISES.find((e) => e.id === id)!);
  return Math.round(s.items.reduce((t, x) => t + m(x.id), 0) + s.testSeconds / 60);
}

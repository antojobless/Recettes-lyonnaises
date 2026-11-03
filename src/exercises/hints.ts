import { Exercise, Rich } from './types';

/** Les trois niveaux d'indice : 1) quelle fonction, 2) la structure, 3) la réponse complète. */
export function hintsOf(ex: Exercise): [Rich, Rich, Rich] {
  let h1 = ex.hint1;
  let h3 = ex.hint3;
  if (ex.kind === 'formula') {
    const req = ex.requiredFunctions ?? [];
    if (!h1) h1 = req.length ? `Utilise ${req.map((f) => `{{${f}}}`).join(' et ')}.` : 'Commence par `=` et clique sur les cellules dont tu as besoin.';
    if (!h3)
      h3 = ex.targets
        .filter((t) => t.solution)
        .map((t) => `En **${t.cell}** : {{${t.solution}}}${t.fillTo ? `, puis recopie jusqu’en **${t.fillTo}**` : ''}.`)
        .join(' ');
  }
  return [h1 ?? '', ex.hint2, h3 ?? ''];
}

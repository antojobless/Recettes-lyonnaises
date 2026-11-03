import { bilingual, Lang } from '../engine/lang';

const LABELS: Record<string, string> = {
  INTERFACE: 'Interface et saisie',
  ARITH: 'Calculs (+ - * /)',
  PCT: 'Pourcentages',
  FILL: 'Recopie',
  ABS_REF: 'Références absolues ($)',
  DATES: 'Calculs de dates',
  SORT_FILTER: 'Trier et filtrer',
  CF: 'Mise en forme conditionnelle',
  PIVOT: 'Tableaux croisés dynamiques',
  CHARTS: 'Graphiques',
};

/** Libellé d'une notion : nom de fonction bilingue, ou libellé en clair. */
export function notionLabel(n: string, lang: Lang): string {
  return LABELS[n] ?? bilingual(n, lang);
}

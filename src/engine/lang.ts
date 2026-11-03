import frFRBase from 'hyperformula/i18n/languages/frFR';

export type Lang = 'fr' | 'en';

/**
 * Noms de fonctions français.
 * Base : pack frFR d'HyperFormula. On corrige les quelques noms qui diffèrent
 * du vrai Excel français, et on ajoute nos fonctions personnalisées.
 */
export const FR_OVERRIDES: Record<string, string> = {
  FILTER: 'FILTRE',
  MAXIFS: 'MAX.SI.ENS',
  MINIFS: 'MIN.SI.ENS',
};

/** Fonctions absentes d'HyperFormula, implémentées dans customFunctions.ts */
export const CUSTOM_FUNCTIONS: Record<string, string> = {
  AVERAGEIFS: 'MOYENNE.SI.ENS',
  CONCAT: 'CONCAT',
};

export const frFR = {
  ...frFRBase,
  functions: { ...frFRBase.functions, ...FR_OVERRIDES },
};

const EN_TO_FR: Record<string, string> = { ...frFR.functions, ...CUSTOM_FUNCTIONS };
const FR_TO_EN: Record<string, string> = {};
for (const [en, fr] of Object.entries(EN_TO_FR)) FR_TO_EN[fr.toUpperCase()] = en;

/** Nom canonique (anglais) d'une fonction écrite dans la langue donnée. */
export function canonicalName(name: string, lang: Lang): string {
  const up = name.toUpperCase();
  if (lang === 'en') return up;
  return FR_TO_EN[up] ?? up;
}

/** Nom d'une fonction canonique (anglais) dans la langue donnée. */
export function localName(en: string, lang: Lang): string {
  return lang === 'fr' ? EN_TO_FR[en] ?? en : en;
}

/** « SOMME (SUM) » en français, « SUM (SOMME) » en anglais. */
export function bilingual(en: string, lang: Lang): string {
  const fr = EN_TO_FR[en] ?? en;
  if (fr === en) return en;
  return lang === 'fr' ? `${fr} (${en})` : `${en} (${fr})`;
}

export const ERRORS_FR: Record<string, string> = {
  CYCLE: '#CYCLE!',
  DIV_BY_ZERO: '#DIV/0!',
  ERROR: '#ERREUR',
  NA: '#N/A',
  NAME: '#NOM?',
  NUM: '#NOMBRE!',
  REF: '#REF!',
  SPILL: '#EPARS!',
  VALUE: '#VALEUR!',
};
export const ERRORS_EN: Record<string, string> = {
  CYCLE: '#CYCLE!',
  DIV_BY_ZERO: '#DIV/0!',
  ERROR: '#ERROR',
  NA: '#N/A',
  NAME: '#NAME?',
  NUM: '#NUM!',
  REF: '#REF!',
  SPILL: '#SPILL!',
  VALUE: '#VALUE!',
};

export const BOOL = {
  fr: { true: 'VRAI', false: 'FAUX' },
  en: { true: 'TRUE', false: 'FALSE' },
};

export const SEP = { fr: ';', en: ',' } as const;
export const DEC = { fr: ',', en: '.' } as const;

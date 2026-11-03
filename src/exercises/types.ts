import { SheetSetup } from '../data/datasets';
import { Fmt } from '../engine/format';

/**
 * Les textes peuvent contenir :
 *  - {{SUMIFS}}            → nom de la fonction dans la langue choisie + équivalent dans l'autre langue
 *  - {{=SUM(A2:A10)}}      → formule écrite en anglais, affichée traduite dans la langue choisie
 *  - `code`                → texte en police code
 *  - **gras**
 */
export type Rich = string;

export interface Target {
  /** Première cellule à remplir, ex. « F2 » */
  cell: string;
  /** Si la formule doit être recopiée vers le bas jusqu'à cette cellule (ex. « F40 ») */
  fillTo?: string;
  /** Formule de la solution, en anglais, pour la première cellule */
  solution?: string;
  /** Valeur attendue tapée à la main (seulement pour le module 0) */
  value?: string | number;
  /** false : une valeur tapée est acceptée (module 0) */
  requireFormula?: boolean;
  fmt?: Fmt;
}

export interface Mistake {
  /** Formule fautive typique (anglais), pour la première cellule de chaque cible */
  formulas: string[];
  message: Rich;
}

interface Base {
  id: string;
  module: number;
  title: string;
  instruction: Rich;
  notions: string[];
  /** Indice 1 (quelle fonction) — généré automatiquement si absent */
  hint1?: Rich;
  /** Indice 2 : la structure avec ses arguments nommés */
  hint2: Rich;
  /** Indice 3 : la réponse complète — générée à partir de la solution si absente */
  hint3?: Rich;
  /** Minutes estimées (pour composer la séance du jour) */
  minutes?: number;
}

export interface FormulaExercise extends Base {
  kind: 'formula';
  setup: () => SheetSetup;
  targets: Target[];
  requiredFunctions?: string[];
  mistakes: Mistake[];
  /** Explication montrée après réussite */
  after?: Rich;
}

export interface SelectExercise extends Base {
  kind: 'select';
  setup: () => SheetSetup;
  /** Plage à sélectionner, ex. « A2:A10 » ou cellule « D7 » */
  expected: string;
  mistakes: { selection: string; message: Rich }[];
}

export interface QuizExercise extends Base {
  kind: 'quiz';
  choices: Rich[];
  answer: number;
  /** Explication par mauvaise réponse (même index que choices) */
  why: Rich[];
  /** Petit graphique d'illustration */
  illustration?: { type: 'bars' | 'hbars' | 'line' | 'pie'; labels: string[]; values: number[]; title?: string; min?: number };
  excel?: ExcelTask;
}

export type CfOp = '>' | '<' | '>=' | '<=' | '=' | 'contains';
export interface CfRule {
  range: string;
  op: CfOp;
  value: string;
  color: 'red' | 'green' | 'yellow';
}
export interface SortSpec {
  col: number;
  dir: 'asc' | 'desc';
}
export interface FilterSpec {
  col: number;
  /** valeurs gardées (texte affiché), ou condition numérique */
  values?: string[];
  op?: '>' | '<' | '>=' | '<=';
  num?: number;
}

export interface ToolsExercise extends Base {
  kind: 'tools';
  setup: () => SheetSetup;
  /** Ce qui est vérifié */
  goal:
    | { type: 'sort'; sort: SortSpec }
    | { type: 'filter'; filter: FilterSpec; answerCell?: undefined }
    | { type: 'cf'; rule: CfRule };
  mistakes: { message: Rich; when: 'wrong-dir' | 'wrong-col' | 'wrong-range' | 'wrong-op' | 'wrong-value' }[];
}

export type Agg = 'sum' | 'count' | 'avg';
export interface PivotSpec {
  rows: string[];
  cols: string[];
  values: { field: string; agg: Agg }[];
  filters: { field: string; values: string[] }[];
}

export interface ExcelTask {
  /** Jeu de données exporté en .xlsx */
  dataset: () => SheetSetup;
  fileName: string;
  steps: Rich[];
  expected: Rich;
}

export interface PivotExercise extends Base {
  kind: 'pivot';
  dataset: () => import('../data/datasets').Dataset;
  goal: PivotSpec;
  /** Question à laquelle on répond en lisant le TCD (optionnel) */
  question?: { text: Rich; answer: string };
  excel: ExcelTask;
  mistakes: { message: Rich; when: 'wrong-agg' | 'rows-cols-swapped' | 'missing-filter' | 'wrong-field' }[];
}

export type Exercise = FormulaExercise | SelectExercise | QuizExercise | ToolsExercise | PivotExercise;

export interface LessonScreen {
  title: string;
  body: Rich[];
  /** Exemple concret affiché sous le texte */
  example?: { formula?: string; table?: (string | number)[][]; caption?: Rich };
}

export interface WorkedStep {
  text: Rich;
  /** Cellule remplie à cette étape, avec une formule en anglais (traduite à l'affichage) */
  cell?: string;
  input?: string;
  fillTo?: string;
}

export interface Module {
  id: number;
  title: string;
  short: string;
  /** Fonctions (noms anglais) ou notions travaillées, pour la maîtrise */
  functions: string[];
  lesson: LessonScreen[];
  worked: { intro: Rich; setup: () => SheetSetup; steps: WorkedStep[] };
  exercises: Exercise[];
}

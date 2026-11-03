import { Fmt } from '../engine/format';
import { colName } from '../engine/formula';
import { SheetInit } from '../engine/engine';
import { randomDate, rng } from './random';

export interface Column {
  name: string;
  fmt?: Fmt;
  width?: number;
}
export type Value = string | number;
export interface Dataset {
  name: string;
  columns: Column[];
  rows: Value[][];
}

export const CLIENTS = [
  'Groupe Valmont', 'Nexalis', 'Batimat SA', 'Orféa Banque', 'Kerlys Industrie', 'Altima Santé', 'Logivia', 'Sofraport',
  'Helvane Énergie', 'Maison Delorme', 'Cybelis', 'Transalpes', 'Novamed', 'Ardent Conseil', 'Pragma Retail', 'Ostral Assurances',
];
export const REGIONS = ['Nord', 'Sud', 'Est', 'Ouest', 'Île-de-France'];
export const PRODUITS = ['Ordinateur portable', 'Écran 27 pouces', 'Licence logicielle', 'Imprimante', 'Serveur', 'Casque audio'];
const PRIX: Record<string, number> = {
  'Ordinateur portable': 1150, 'Écran 27 pouces': 320, 'Licence logicielle': 480, Imprimante: 260, Serveur: 4200, 'Casque audio': 95,
};

/** Commandes de grands comptes */
export function commandes(n = 120, seed = 42): Dataset {
  const r = rng(seed);
  const rows: Value[][] = [];
  for (let i = 0; i < n; i++) {
    const produit = r.weighted(PRODUITS, [5, 4, 4, 3, 1, 3]);
    rows.push([
      `CMD-${String(1001 + i)}`,
      randomDate(r, 2024, 2025),
      r.pick(CLIENTS),
      r.weighted(REGIONS, [3, 3, 2, 2, 4]),
      produit,
      produit === 'Serveur' ? r.int(1, 4) : r.int(1, 40),
      PRIX[produit],
    ]);
  }
  return {
    name: 'Commandes',
    columns: [
      { name: 'N° commande', width: 96 },
      { name: 'Date', fmt: 'date', width: 90 },
      { name: 'Client', width: 130 },
      { name: 'Région', width: 100 },
      { name: 'Produit', width: 150 },
      { name: 'Quantité', width: 76 },
      { name: 'Prix unitaire', fmt: 'eur', width: 100 },
    ],
    rows,
  };
}

export const TYPES_CONTRAT = ['Auto', 'Habitation', 'Santé', 'Prévoyance', 'Emprunteur'];
export const CONSEILLERS = ['Martin', 'Bernard', 'Dubois', 'Leroy', 'Moreau', 'Garnier'];
const NOMS = ['Durand', 'Lefèvre', 'Mercier', 'Blanc', 'Guérin', 'Faure', 'Rousseau', 'Fontaine', 'Chevalier', 'Robin', 'Masson', 'Henry', 'Gauthier', 'Perrin', 'Morel', 'Girard', 'André', 'Lambert', 'Bonnet', 'François', 'Martinez', 'Legrand', 'Garcia', 'Roux', 'Vincent', 'Muller', 'Lemaire', 'Noël', 'Meyer', 'Dufour'];
const PRENOMS = ['Camille', 'Léa', 'Hugo', 'Lucas', 'Chloé', 'Manon', 'Louis', 'Inès', 'Jules', 'Emma', 'Nathan', 'Sarah', 'Thomas', 'Julie', 'Antoine', 'Clara'];
const PRIME: Record<string, [number, number]> = {
  Auto: [380, 1400], Habitation: [180, 650], Santé: [600, 2200], Prévoyance: [240, 900], Emprunteur: [300, 1600],
};

/** Portefeuille de contrats d'assurance */
export function contrats(n = 150, seed = 7): Dataset {
  const r = rng(seed);
  const rows: Value[][] = [];
  for (let i = 0; i < n; i++) {
    const type = r.weighted(TYPES_CONTRAT, [4, 4, 3, 2, 2]);
    const [a, b] = PRIME[type];
    rows.push([
      `CT-${String(20001 + i)}`,
      `${r.pick(PRENOMS)} ${r.pick(NOMS)}`,
      type,
      Math.round(r.int(a, b) / 5) * 5,
      randomDate(r, 2018, 2025),
      r.pick(CONSEILLERS),
      r.weighted(['Actif', 'Résilié'], [5, 1]),
    ]);
  }
  return {
    name: 'Contrats',
    columns: [
      { name: 'N° contrat', width: 90 },
      { name: 'Client', width: 140 },
      { name: 'Type de contrat', width: 116 },
      { name: 'Prime annuelle', fmt: 'eur', width: 110 },
      { name: 'Date de souscription', fmt: 'date', width: 140 },
      { name: 'Conseiller', width: 90 },
      { name: 'Statut', width: 76 },
    ],
    rows,
  };
}

export const ETAPES = ['Prospection', 'Qualification', 'Proposition', 'Négociation', 'Gagné', 'Perdu'];
export const COMMERCIAUX = ['Alice', 'Karim', 'Sophie', 'Yanis', 'Marion'];
const PROBA: Record<string, number> = { Prospection: 0.1, Qualification: 0.25, Proposition: 0.5, Négociation: 0.75, Gagné: 1, Perdu: 0 };

/** Pipeline commercial */
export function pipeline(n = 80, seed = 99): Dataset {
  const r = rng(seed);
  const rows: Value[][] = [];
  for (let i = 0; i < n; i++) {
    const etape = r.weighted(ETAPES, [3, 3, 3, 2, 2, 2]);
    rows.push([
      `OPP-${String(301 + i)}`,
      r.pick(CLIENTS),
      r.pick(COMMERCIAUX),
      etape,
      r.int(8, 240) * 500,
      PROBA[etape],
      randomDate(r, 2025, 2026),
    ]);
  }
  return {
    name: 'Pipeline',
    columns: [
      { name: 'Opportunité', width: 90 },
      { name: 'Client', width: 130 },
      { name: 'Commercial', width: 90 },
      { name: 'Étape', width: 100 },
      { name: 'Montant', fmt: 'eur', width: 110 },
      { name: 'Probabilité', fmt: 'pct', width: 90 },
      { name: 'Clôture prévue', fmt: 'date', width: 110 },
    ],
    rows,
  };
}

export const MAGASINS = ['Lyon', 'Paris', 'Lille', 'Marseille', 'Bordeaux', 'Nantes'];
export const RAYONS = ['Alimentaire', 'Textile', 'Maison', 'High-tech'];
export const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'];

/** Ventes mensuelles par magasin et par rayon */
export function ventesMagasins(seed = 2024): Dataset {
  const r = rng(seed);
  const rows: Value[][] = [];
  for (const m of MAGASINS)
    for (const mois of MOIS)
      for (const ray of RAYONS) {
        const base = { Alimentaire: 52000, Textile: 18000, Maison: 15000, 'High-tech': 24000 }[ray]!;
        const ca = Math.round((base * (0.7 + r.next() * 0.6)) / 10) * 10;
        rows.push([m, mois, ray, ca, Math.round((base * 0.95) / 100) * 100, r.int(400, 3200)]);
      }
  return {
    name: 'Ventes magasins',
    columns: [
      { name: 'Magasin', width: 90 },
      { name: 'Mois', width: 80 },
      { name: 'Rayon', width: 96 },
      { name: 'CA', fmt: 'eur', width: 110 },
      { name: 'Objectif', fmt: 'eur', width: 110 },
      { name: 'Nb clients', width: 80 },
    ],
    rows,
  };
}

export interface SheetSetup {
  cells: SheetInit;
  fmts: Record<string, Fmt>;
  colWidths: Record<number, number>;
  rows: number;
  cols: number;
}

/** Pose un jeu de données en A1 (en-têtes en ligne 1), avec des colonnes en option. */
export function layout(ds: Dataset, opts: { startCol?: number; extraCols?: Column[] } = {}): SheetSetup {
  const start = opts.startCol ?? 0;
  const cells: SheetInit = {};
  const fmts: Record<string, Fmt> = {};
  const colWidths: Record<number, number> = {};
  const cols = [...ds.columns, ...(opts.extraCols ?? [])];
  cols.forEach((c, j) => {
    cells[`${colName(start + j)}1`] = c.name;
    if (c.width) colWidths[start + j] = c.width;
    if (c.fmt) for (let i = 0; i < Math.max(ds.rows.length, 1); i++) fmts[`${colName(start + j)}${i + 2}`] = c.fmt;
  });
  ds.rows.forEach((row, i) =>
    row.forEach((v, j) => {
      cells[`${colName(start + j)}${i + 2}`] = v;
    }),
  );
  return { cells, fmts, colWidths, rows: Math.max(ds.rows.length + 8, 25), cols: Math.max(start + cols.length + 4, 10) };
}

/** Agrandit la grille pour que toutes les cellules utilisées soient visibles (avec de la marge). */
export function fit(s: SheetSetup): SheetSetup {
  let rows = s.rows;
  let cols = s.cols;
  for (const a of [...Object.keys(s.cells), ...Object.keys(s.fmts)]) {
    const m = /^([A-Z]+)(\d+)$/.exec(a);
    if (!m) continue;
    let c = 0;
    for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64;
    rows = Math.max(rows, Number(m[2]) + 5);
    cols = Math.max(cols, c + 2);
  }
  return { ...s, rows, cols };
}

/** Ajoute des cellules (libellés, paramètres) à une feuille. */
export function withCells(s: SheetSetup, cells: SheetInit, fmts: Record<string, Fmt> = {}, widths: Record<number, number> = {}): SheetSetup {
  return fit({ ...s, cells: { ...s.cells, ...cells }, fmts: { ...s.fmts, ...fmts }, colWidths: { ...s.colWidths, ...widths } });
}

/** Petit tableau fait main. */
export function table(columns: Column[], rows: Value[][]): Dataset {
  return { name: 'Tableau', columns, rows };
}

/** Commandes avec une colonne Montant HT déjà calculée (valeurs). */
export function commandesMontant(n = 120, seed = 42): Dataset {
  const d = commandes(n, seed);
  return {
    ...d,
    columns: [...d.columns, { name: 'Montant HT', fmt: 'eur', width: 110 }],
    rows: d.rows.map((r) => [...r, (r[5] as number) * (r[6] as number)]),
  };
}

export const SEGMENTS = ['Grand compte', 'ETI', 'PME'];
export const VILLES = ['Lyon', 'Paris', 'Lille', 'Marseille', 'Bordeaux', 'Nantes', 'Toulouse', 'Strasbourg'];

/** Fiche clients (pour les recherches). `exclude` retire des clients pour provoquer des #N/A. */
export function clientsTable(seed = 5, exclude: string[] = []): Dataset {
  const r = rng(seed);
  const rows = CLIENTS.filter((c) => !exclude.includes(c)).map((c) => [c, r.weighted(SEGMENTS, [2, 3, 3]), r.pick(COMMERCIAUX), r.pick(VILLES)] as Value[]);
  return {
    name: 'Clients',
    columns: [{ name: 'Client', width: 130 }, { name: 'Segment', width: 100 }, { name: 'Commercial', width: 90 }, { name: 'Ville', width: 90 }],
    rows,
  };
}

/** Place un second tableau à partir d'une colonne donnée (ex. une table de référence à droite). */
export function besides(s: SheetSetup, ds: Dataset, startCol: number): SheetSetup {
  const t = layout(ds, { startCol });
  return fit({
    cells: { ...s.cells, ...t.cells },
    fmts: { ...s.fmts, ...t.fmts },
    colWidths: { ...s.colWidths, ...t.colWidths },
    rows: Math.max(s.rows, t.rows),
    cols: Math.max(s.cols, t.cols),
  });
}

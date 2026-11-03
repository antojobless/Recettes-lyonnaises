import { besides, clientsTable, commandesMontant, contrats, Dataset, frais, layout, pipeline, SheetSetup, table, ventesMagasins, withCells } from '../data/datasets';
import { Fmt } from '../engine/format';
import { computePivot, topRow } from '../pivot/pivot';
import { PivotSpec } from '../exercises/types';

export interface ExamQuestion {
  id: string;
  /** Thème (pour la correction détaillée) */
  topic: string;
  text: string;
  /** Question de formule : cellule de réponse + solution (anglais) */
  cell?: string;
  solution?: string;
  fmt?: Fmt;
  /** Question de TCD : on construit le TCD puis on répond */
  pivot?: { goal: PivotSpec; answer: string };
}

export interface ExamSubject {
  id: string;
  title: string;
  company: string;
  context: string;
  dataset: () => Dataset;
  setup: () => SheetSetup;
  questions: ExamQuestion[];
}

const ANSWER_COL = 'K';

/** Fabrique un sujet : les questions de formule sont posées en J (libellé court) / K (réponse). */
function subject(o: Omit<ExamSubject, 'setup'> & { extra?: (s: SheetSetup) => SheetSetup; labels: string[] }): ExamSubject {
  let row = 1;
  const qs = o.questions.map((q) => (q.pivot ? q : { ...q, cell: `${ANSWER_COL}${row++}` }));
  const setup = () => {
    const base = layout(o.dataset());
    const cells: Record<string, string> = {};
    const fmts: Record<string, Fmt> = {};
    let k = 0;
    qs.forEach((q, i) => {
      if (!q.cell) return;
      cells[`J${q.cell.slice(1)}`] = `Q${i + 1}. ${o.labels[k++]}`;
      if (q.fmt) fmts[q.cell] = q.fmt;
    });
    const s = withCells(base, cells, fmts, { 9: 250, 10: 120 });
    return o.extra ? o.extra(s) : s;
  };
  return { id: o.id, title: o.title, company: o.company, context: o.context, dataset: o.dataset, setup, questions: qs };
}

const pivotQ = (id: string, ds: () => Dataset, goal: PivotSpec, ask: string, topic = 'TCD'): ExamQuestion => ({
  id,
  topic,
  text: `${ask} Réponds à l’aide d’un **tableau croisé dynamique** (onglet « TCD »).`,
  pivot: { goal, answer: topRow(computePivot(ds(), goal)) },
});
const P = (s: Partial<PivotSpec>): PivotSpec => ({ rows: [], cols: [], values: [], filters: [], ...s });

// ---------- 1. Assurance ----------
const ctr = () => contrats(180, 31);
const C = (c: string) => `${c}2:${c}181`;
const assurance = subject({
  id: 'assurance',
  title: 'Portefeuille IARD',
  company: 'Assureur (stage chargé d’études)',
  context: 'Tu reçois l’extraction du portefeuille de contrats d’une agence (180 contrats). Ton manager veut quelques indicateurs avant sa réunion.',
  dataset: ctr,
  labels: ['Total des primes', 'Nb contrats Auto', 'Primes des contrats actifs', 'Prime moy. Santé actifs', 'Taux de résiliation', 'Nb Habitation · Martin', 'Conseiller du CT-20057', 'Prévoyance > 15 000 € ?', 'Prime moyenne arrondie', 'Primes depuis 2023'],
  questions: [
    { id: 'q1', topic: 'SOMME', text: 'Quel est le total des primes annuelles du portefeuille ?', solution: `=SUM(${C('D')})`, fmt: 'eur' },
    { id: 'q2', topic: 'NB.SI', text: 'Combien y a-t-il de contrats **Auto** ?', solution: `=COUNTIF(${C('C')},"Auto")` },
    { id: 'q3', topic: 'SOMME.SI', text: 'Quel est le total des primes des contrats **actifs** ?', solution: `=SUMIF(${C('G')},"Actif",${C('D')})`, fmt: 'eur' },
    { id: 'q4', topic: 'MOYENNE.SI.ENS', text: 'Quelle est la prime moyenne des contrats **Santé actifs** ?', solution: `=AVERAGEIFS(${C('D')},${C('C')},"Santé",${C('G')},"Actif")`, fmt: 'eur' },
    { id: 'q5', topic: 'Pourcentage', text: 'Quel est le **taux de résiliation** (part des contrats résiliés dans le total des contrats), en % ?', solution: `=COUNTIF(${C('G')},"Résilié")/COUNTA(${C('A')})`, fmt: 'pct' },
    { id: 'q6', topic: 'NB.SI.ENS', text: 'Combien de contrats **Habitation** sont gérés par le conseiller **Martin** ?', solution: `=COUNTIFS(${C('C')},"Habitation",${C('F')},"Martin")` },
    { id: 'q7', topic: 'RECHERCHEV', text: 'Quel conseiller gère le contrat **CT-20057** ?', solution: `=VLOOKUP("CT-20057",A2:G181,6,FALSE)` },
    { id: 'q8', topic: 'SI', text: 'Le total des primes **Prévoyance** dépasse-t-il 15 000 € ? Réponds « Oui » ou « Non » **avec une formule**.', solution: `=IF(SUMIF(${C('C')},"Prévoyance",${C('D')})>15000,"Oui","Non")` },
    { id: 'q9', topic: 'ARRONDI', text: 'Quelle est la prime moyenne du portefeuille, **arrondie à l’euro** ?', solution: `=ROUND(AVERAGE(${C('D')}),0)`, fmt: 'eur' },
    { id: 'q10', topic: 'SOMME.SI.ENS (dates)', text: 'Quel est le total des primes des contrats souscrits **depuis le 01/01/2023** (inclus) ?', solution: `=SUMIFS(${C('D')},${C('E')},">=01/01/2023")`, fmt: 'eur' },
    pivotQ('q11', ctr, P({ rows: ['Conseiller'], values: [{ field: 'Prime annuelle', agg: 'sum' }] }), 'Quel conseiller a le **plus gros total de primes** ?'),
  ],
});

// ---------- 2. Banque ----------
const pip = () => pipeline(120, 57);
const B = (c: string) => `${c}2:${c}121`;
const banque = subject({
  id: 'banque',
  title: 'Pipeline commercial PME',
  company: 'Banque (stage chargé d’affaires entreprises)',
  context: 'Voici le pipeline des opportunités de financement de l’équipe (120 opportunités). Prépare la synthèse pour le directeur d’agence.',
  dataset: pip,
  labels: ['Montant gagné', 'Nb en négociation', 'Montant moyen perdu', 'Taux de transformation', 'Montant gagné · Sophie', 'Plus grosse opportunité', 'Client de OPP-345', 'Ouvertes > 100 k€', 'Objectif 1 M€ ?'],
  questions: [
    { id: 'q1', topic: 'SOMME.SI', text: 'Quel est le montant total des affaires **gagnées** ?', solution: `=SUMIF(${B('D')},"Gagné",${B('E')})`, fmt: 'eur' },
    { id: 'q2', topic: 'NB.SI', text: 'Combien d’opportunités sont en **Négociation** ?', solution: `=COUNTIF(${B('D')},"Négociation")` },
    { id: 'q3', topic: 'MOYENNE.SI.ENS', text: 'Quel est le montant moyen des affaires **perdues** ?', solution: `=AVERAGEIFS(${B('E')},${B('D')},"Perdu")`, fmt: 'eur' },
    { id: 'q4', topic: 'Pourcentage', text: 'Quel est le **taux de transformation** : nombre d’affaires gagnées / (gagnées + perdues), en % ?', solution: `=COUNTIF(${B('D')},"Gagné")/(COUNTIF(${B('D')},"Gagné")+COUNTIF(${B('D')},"Perdu"))`, fmt: 'pct' },
    { id: 'q5', topic: 'SOMME.SI.ENS', text: 'Quel montant **Sophie** a-t-elle **gagné** ?', solution: `=SUMIFS(${B('E')},${B('C')},"Sophie",${B('D')},"Gagné")`, fmt: 'eur' },
    { id: 'q6', topic: 'MAX', text: 'Quel est le montant de la **plus grosse** opportunité du pipeline ?', solution: `=MAX(${B('E')})`, fmt: 'eur' },
    { id: 'q7', topic: 'RECHERCHEV', text: 'Quel est le **client** de l’opportunité **OPP-345** ?', solution: '=VLOOKUP("OPP-345",A2:G121,2,FALSE)' },
    { id: 'q8', topic: 'NB.SI.ENS', text: 'Combien d’opportunités de **plus de 100 000 €** sont encore **ouvertes** (ni « Gagné » ni « Perdu ») ?', solution: `=COUNTIFS(${B('E')},">100000",${B('D')},"<>Gagné",${B('D')},"<>Perdu")` },
    { id: 'q9', topic: 'SI', text: 'L’objectif est de **1 000 000 €** gagnés. Affiche « Atteint » ou « Non atteint » **avec une formule**.', solution: `=IF(SUMIF(${B('D')},"Gagné",${B('E')})>=1000000,"Atteint","Non atteint")` },
    pivotQ('q10', pip, P({ rows: ['Étape'], values: [{ field: 'Montant', agg: 'sum' }] }), 'Quelle **étape** du pipeline concentre le plus gros montant total ?'),
  ],
});

// ---------- 3. Distribution ----------
const mag = () => ventesMagasins(2031);
const D = (c: string) => `${c}2:${c}145`;
const distribution = subject({
  id: 'distribution',
  title: 'Ventes du réseau de magasins',
  company: 'Grande distribution (stage contrôle de gestion)',
  context: 'Le contrôleur de gestion te confie les ventes du semestre (6 magasins × 6 mois × 4 rayons). Calcule les indicateurs du reporting.',
  dataset: mag,
  extra: (s) =>
    besides(
      s,
      table(
        [{ name: 'Magasin', width: 90 }, { name: 'Directeur', width: 100 }, { name: 'Surface (m²)', width: 100 }],
        [['Lyon', 'A. Perrin', 4200], ['Paris', 'K. Benali', 5600], ['Lille', 'S. Lefort', 3100], ['Marseille', 'M. Costa', 3900], ['Bordeaux', 'J. Hamel', 2800], ['Nantes', 'L. Tessier', 2600]],
      ),
      12,
    ),
  labels: ['CA de Lyon', 'CA Textile · Paris', 'CA moyen High-tech', 'Taux d’atteinte objectif', 'CA Lille · Mars · Maison', 'Clients en juin', 'Panier moyen Bordeaux', 'Lignes CA > 60 000 €', 'Écart CA − objectif', 'Surface de Lille', 'Nantes à l’objectif ?'],
  questions: [
    { id: 'q1', topic: 'SOMME.SI', text: 'Quel est le CA total du magasin de **Lyon** ?', solution: `=SUMIF(${D('A')},"Lyon",${D('D')})`, fmt: 'eur' },
    { id: 'q2', topic: 'SOMME.SI.ENS', text: 'Quel est le CA du rayon **Textile** à **Paris** ?', solution: `=SUMIFS(${D('D')},${D('A')},"Paris",${D('C')},"Textile")`, fmt: 'eur' },
    { id: 'q3', topic: 'MOYENNE.SI.ENS', text: 'Quel est le CA moyen d’une ligne du rayon **High-tech** ?', solution: `=AVERAGEIFS(${D('D')},${D('C')},"High-tech")`, fmt: 'eur' },
    { id: 'q4', topic: 'Pourcentage', text: 'Quel est le **taux d’atteinte de l’objectif** du réseau (CA total / objectif total), en % ?', solution: `=SUM(${D('D')})/SUM(${D('E')})`, fmt: 'pct' },
    { id: 'q5', topic: 'SOMME.SI.ENS', text: 'Quel est le CA de **Lille** en **Mars** pour le rayon **Maison** ?', solution: `=SUMIFS(${D('D')},${D('A')},"Lille",${D('B')},"Mars",${D('C')},"Maison")`, fmt: 'eur' },
    { id: 'q6', topic: 'SOMME.SI', text: 'Combien de **clients** au total le réseau a-t-il accueillis en **Juin** ?', solution: `=SUMIF(${D('B')},"Juin",${D('F')})` },
    { id: 'q7', topic: 'ARRONDI', text: 'Quel est le **panier moyen** de **Bordeaux** (CA / nombre de clients), arrondi à 2 décimales ?', solution: `=ROUND(SUMIF(${D('A')},"Bordeaux",${D('D')})/SUMIF(${D('A')},"Bordeaux",${D('F')}),2)`, fmt: 'eur' },
    { id: 'q8', topic: 'NB.SI', text: 'Combien de lignes ont un CA **supérieur à 60 000 €** ?', solution: `=COUNTIF(${D('D')},">60000")` },
    { id: 'q9', topic: 'SOMME', text: 'Quel est l’**écart** entre le CA total et l’objectif total (CA − objectif) ?', solution: `=SUM(${D('D')})-SUM(${D('E')})`, fmt: 'eur' },
    { id: 'q10', topic: 'RECHERCHEV', text: 'Quelle est la **surface** du magasin de **Lille** (fiche magasins en M:O) ?', solution: '=VLOOKUP("Lille",M2:O7,3,FALSE)' },
    { id: 'q11', topic: 'SI', text: 'Le magasin de **Nantes** a-t-il atteint son objectif sur le semestre (CA ≥ objectif) ? Affiche « Oui » ou « Non » **avec une formule**.', solution: `=IF(SUMIF(${D('A')},"Nantes",${D('D')})>=SUMIF(${D('A')},"Nantes",${D('E')}),"Oui","Non")` },
    pivotQ('q12', mag, P({ rows: ['Mois'], values: [{ field: 'CA', agg: 'sum' }], filters: [{ field: 'Magasin', values: ['Marseille'] }] }), 'Pour le magasin de **Marseille** uniquement, quel **mois** a fait le plus gros CA ?'),
  ],
});

// ---------- 4. Industrie / B2B ----------
const cmd = () => commandesMontant(150, 88);
const I = (c: string) => `${c}2:${c}151`;
const b2b = subject({
  id: 'b2b',
  title: 'Commandes grands comptes',
  company: 'Grand groupe industriel (stage business analyst)',
  context: 'L’équipe commerciale t’envoie les 150 dernières commandes de ses grands comptes, et la fiche clients (colonnes M à P).',
  dataset: cmd,
  extra: (s) => besides(s, clientsTable(5), 12),
  labels: ['CA HT total', 'CA Île-de-France', 'Nb commandes Serveur', 'CA HT 2025', 'Qté moy. Écran 27"', 'CA de Nexalis', 'Segment d’Orféa Banque', 'Part du Nord', 'Plus grosse commande', 'CMD-1010 > 10 000 € ?'],
  questions: [
    { id: 'q1', topic: 'SOMME', text: 'Quel est le **CA HT total** ?', solution: `=SUM(${I('H')})`, fmt: 'eur' },
    { id: 'q2', topic: 'SOMME.SI', text: 'Quel est le CA HT de la région **Île-de-France** ?', solution: `=SUMIF(${I('D')},"Île-de-France",${I('H')})`, fmt: 'eur' },
    { id: 'q3', topic: 'NB.SI', text: 'Combien de commandes portent sur des **Serveurs** ?', solution: `=COUNTIF(${I('E')},"Serveur")` },
    { id: 'q4', topic: 'SOMME.SI.ENS (dates)', text: 'Quel est le CA HT des commandes passées en **2025** ?', solution: `=SUMIFS(${I('H')},${I('B')},">=01/01/2025",${I('B')},"<=31/12/2025")`, fmt: 'eur' },
    { id: 'q5', topic: 'MOYENNE.SI.ENS', text: 'Quelle est la **quantité moyenne** commandée pour le produit **Écran 27 pouces** ?', solution: `=AVERAGEIFS(${I('F')},${I('E')},"Écran 27 pouces")`, fmt: 'dec2' },
    { id: 'q6', topic: 'SOMME.SI', text: 'Quel est le CA HT réalisé avec le client **Nexalis** ?', solution: `=SUMIF(${I('C')},"Nexalis",${I('H')})`, fmt: 'eur' },
    { id: 'q7', topic: 'RECHERCHEV', text: 'Quel est le **segment** du client **Orféa Banque** (fiche clients en M:P) ?', solution: '=VLOOKUP("Orféa Banque",M2:P17,2,FALSE)' },
    { id: 'q8', topic: 'Pourcentage', text: 'Quelle est la **part** de la région **Nord** dans le CA HT total, en % ?', solution: `=SUMIF(${I('D')},"Nord",${I('H')})/SUM(${I('H')})`, fmt: 'pct' },
    { id: 'q9', topic: 'MAX', text: 'Quel est le montant HT de la **plus grosse commande** ?', solution: `=MAX(${I('H')})`, fmt: 'eur' },
    { id: 'q10', topic: 'SI + RECHERCHEV', text: 'La commande **CMD-1010** dépasse-t-elle 10 000 € HT ? Affiche « Oui » ou « Non » **avec une formule**.', solution: '=IF(VLOOKUP("CMD-1010",A2:H151,8,FALSE)>10000,"Oui","Non")' },
    pivotQ('q11', cmd, P({ rows: ['Produit'], values: [{ field: 'Montant HT', agg: 'sum' }] }), 'Quel **produit** génère le plus gros CA HT ?'),
  ],
});

// ---------- 5. Conseil ----------
const nf = () => frais(160, 13);
const F = (c: string) => `${c}2:${c}161`;
const conseil = subject({
  id: 'conseil',
  title: 'Notes de frais',
  company: 'Cabinet d’audit et de conseil (stage auditeur)',
  context: 'Le service comptable te demande d’analyser les 160 notes de frais du dernier exercice avant le contrôle.',
  dataset: nf,
  labels: ['Total des notes validées', 'Nb notes en attente', 'Montant moyen Hôtel', 'Transport · Audit', 'Part des notes refusées', 'Service de NF-1042', 'NF-1042 hors plafond ?', 'Montant moyen (2 déc.)', 'Frais de 2025'],
  questions: [
    { id: 'q1', topic: 'SOMME.SI', text: 'Quel est le total des notes **validées** ?', solution: `=SUMIF(${F('G')},"Validée",${F('F')})`, fmt: 'eur' },
    { id: 'q2', topic: 'NB.SI', text: 'Combien de notes sont **en attente** ?', solution: `=COUNTIF(${F('G')},"En attente")` },
    { id: 'q3', topic: 'MOYENNE.SI.ENS', text: 'Quel est le montant moyen d’une note **Hôtel** ?', solution: `=AVERAGEIFS(${F('F')},${F('E')},"Hôtel")`, fmt: 'eur' },
    { id: 'q4', topic: 'SOMME.SI.ENS', text: 'Quel est le total des frais de **Transport** du service **Audit** ?', solution: `=SUMIFS(${F('F')},${F('E')},"Transport",${F('D')},"Audit")`, fmt: 'eur' },
    { id: 'q5', topic: 'Pourcentage', text: 'Quelle est la **part des notes refusées** (en nombre de notes), en % ?', solution: `=COUNTIF(${F('G')},"Refusée")/COUNTA(${F('A')})`, fmt: 'pct' },
    { id: 'q6', topic: 'RECHERCHEV', text: 'À quel **service** appartient la note **NF-1042** ?', solution: '=VLOOKUP("NF-1042",A2:G161,4,FALSE)' },
    { id: 'q7', topic: 'SI + RECHERCHEV', text: 'Le plafond par note est de 150 €. Affiche « Hors plafond » si la note **NF-1042** le dépasse, sinon « OK », **avec une formule**.', solution: '=IF(VLOOKUP("NF-1042",A2:G161,6,FALSE)>150,"Hors plafond","OK")' },
    { id: 'q8', topic: 'ARRONDI', text: 'Quel est le montant moyen d’une note, **arrondi à 2 décimales** ?', solution: `=ROUND(AVERAGE(${F('F')}),2)`, fmt: 'eur' },
    { id: 'q9', topic: 'SOMME.SI.ENS (dates)', text: 'Quel est le total des frais datés de **2025** ?', solution: `=SUMIFS(${F('F')},${F('B')},">=01/01/2025",${F('B')},"<=31/12/2025")`, fmt: 'eur' },
    pivotQ('q10', nf, P({ rows: ['Service'], values: [{ field: 'Montant', agg: 'sum' }], filters: [{ field: 'Statut', values: ['Validée'] }] }), 'En ne gardant que les notes **validées**, quel **service** a le plus gros total de frais ?'),
  ],
});

export const SUBJECTS: ExamSubject[] = [assurance, banque, distribution, b2b, conseil];

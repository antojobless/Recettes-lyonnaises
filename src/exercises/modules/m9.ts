import { commandesMontant, contrats, Dataset, layout, pipeline, ventesMagasins } from '../../data/datasets';
import { excelPivotSteps } from '../../pivot/excelSteps';
import { computePivot, PivotResult, rowTotal, topRow } from '../../pivot/pivot';
import { Module, PivotExercise, PivotSpec } from '../types';

const spec = (s: Partial<PivotSpec>): PivotSpec => ({ rows: [], cols: [], values: [], filters: [], ...s });

const num = (n: number | null) => String(Math.round((n ?? 0) * 100) / 100);

function pex(o: {
  id: string;
  title: string;
  instruction: string;
  dataset: () => Dataset;
  goal: PivotSpec;
  question?: (r: PivotResult) => { text: string; answer: string };
  hint2: string;
  mistakes: PivotExercise['mistakes'];
  file: string;
}): PivotExercise {
  const ds = o.dataset();
  const r = computePivot(ds, o.goal);
  const q = o.question?.(r);
  return {
    id: o.id,
    module: 9,
    kind: 'pivot',
    title: o.title,
    instruction: o.instruction,
    notions: ['PIVOT'],
    dataset: o.dataset,
    goal: o.goal,
    question: q,
    hint1: 'Pense « par quoi je regroupe ? » → zone Lignes ; « qu’est-ce que je calcule ? » → zone Valeurs.',
    hint2: o.hint2,
    hint3: [
      o.goal.filters.length ? `Filtres : ${o.goal.filters.map((f) => `**${f.field}** = ${f.values.join(', ')}`).join(' ; ')}.` : '',
      o.goal.rows.length ? `Lignes : **${o.goal.rows.join(', ')}**.` : '',
      o.goal.cols.length ? `Colonnes : **${o.goal.cols.join(', ')}**.` : '',
      `Valeurs : ${o.goal.values.map((v) => `**${{ sum: 'Somme', count: 'Nombre', avg: 'Moyenne' }[v.agg]} de ${v.field}**`).join(', ')}.`,
      q ? `Réponse à la question : **${q.answer}**.` : '',
    ]
      .filter(Boolean)
      .join(' '),
    mistakes: o.mistakes,
    minutes: 4,
    excel: {
      dataset: () => layout(o.dataset()),
      fileName: o.file,
      steps: excelPivotSteps(ds, o.goal),
      expected: q ? `le tableau ci-dessous. Et la réponse à la question : **${q.answer}**.` : 'le tableau ci-dessous.',
    },
  };
}

const cmd = () => commandesMontant(120, 42);
const ctr = () => contrats(150, 7);
const pip = () => pipeline(80, 99);
const mag = () => ventesMagasins(2024);

const AGG = { message: 'Tes champs sont bons, mais pas le calcul : regarde le menu déroulant du champ dans **Valeurs** (Somme, Nombre ou Moyenne ?).', when: 'wrong-agg' as const };

export const m9: Module = {
  id: 9,
  title: 'Tableaux croisés dynamiques',
  short: 'TCD',
  functions: ['PIVOT'],
  lesson: [
    {
      title: 'Un TCD, c’est quoi ?',
      body: [
        'Un **tableau croisé dynamique** (TCD) résume un gros tableau en quelques clics : « le CA par région », « le nombre de contrats par type ».',
        'Pas de formule à écrire : tu choisis les colonnes, Excel calcule. Et si tu changes d’avis, tu glisses un autre champ, le tableau se met à jour.',
        'C’est ce qu’on attend de toi quand on te donne 200 lignes et qu’on te demande « une synthèse ».',
      ],
      example: { table: [['Région', 'Somme de Montant HT'], ['Est', '…'], ['Nord', '…'], ['Total général', '…']], caption: '120 commandes résumées en 6 lignes.' },
    },
    {
      title: 'Les 4 zones',
      body: [
        '**Lignes** : ce par quoi tu regroupes (une ligne par région). **Colonnes** : un 2e regroupement, en travers (une colonne par produit).',
        '**Valeurs** : ce que tu calcules (somme des montants, nombre de contrats…). **Filtres** : pour ne garder qu’une partie des données (seulement 2025, seulement « Gagné »).',
        'Astuce : lis la question à voix haute. « Le CA **par région** » → CA dans Valeurs, Région dans Lignes.',
      ],
      example: { caption: '« Le nombre de contrats par conseiller, pour les contrats actifs » → Lignes : Conseiller · Valeurs : Nombre de N° contrat · Filtres : Statut = Actif.' },
    },
    {
      title: 'Somme, Nombre ou Moyenne',
      body: [
        'Un champ de nombres dans Valeurs donne une **Somme** par défaut. Un champ de texte donne un **Nombre** (on compte les lignes).',
        'Pour une moyenne (prime moyenne, panier moyen), il faut changer le calcul : (i) ou clic droit › **Paramètres des champs de valeurs** › Moyenne.',
        'Piège classique : Excel affiche « Nombre de Montant » parce qu’une cellule de la colonne contient du texte. Change-le en Somme.',
      ],
      example: { caption: '« Somme de Prime » = total des primes ; « Nombre de Prime » = combien de contrats ; « Moyenne de Prime » = prime moyenne.' },
    },
    {
      title: 'Quand utiliser un TCD plutôt que SOMME.SI.ENS ?',
      body: [
        '**TCD** : pour explorer et résumer vite, avec beaucoup de catégories. Il ne se met pas à jour tout seul si les données changent : clic droit › **Actualiser**.',
        '**SOMME.SI.ENS** : pour un tableau de bord fixe, qui se recalcule automatiquement, ou pour une seule valeur précise.',
        'En test, si on te dit « à l’aide d’un TCD », fais un TCD. Sinon, les deux sont acceptés : choisis le plus rapide pour toi.',
      ],
      example: { caption: 'Les deux donnent les mêmes nombres : c’est un bon moyen de vérifier ton travail.' },
    },
    {
      title: 'Les étapes dans Excel pour Mac',
      body: [
        'Clique dans le tableau › onglet **Insertion** › **Tableau croisé dynamique** › vérifie la plage › **Nouvelle feuille de calcul** › **OK**.',
        'Dans le volet **Champs de tableau croisé dynamique**, fais glisser les champs dans les zones.',
        'Chaque exercice a un bouton **Faire dans Excel** : il télécharge les données en .xlsx et te donne les étapes exactes, avec le résultat à obtenir.',
      ],
      example: { caption: 'Le simulateur ci-dessous fonctionne comme le volet d’Excel : glisse les champs dans les zones.' },
    },
  ],
  worked: {
    intro: 'Exemple résolu : le CA par région, sur les 120 commandes. Lis les étapes, puis entraîne-toi dans les exercices avec le simulateur.',
    setup: () => layout(cmd()),
    steps: [
      { text: 'La question : « le CA **par région** ». Le CA est la colonne **Montant HT**, le regroupement est **Région**.' },
      { text: 'On glisse **Région** dans **Lignes** : une ligne par région apparaît (Est, Île-de-France, Nord, Ouest, Sud).' },
      { text: 'On glisse **Montant HT** dans **Valeurs** : Excel affiche « Somme de Montant HT » pour chaque région, et le Total général en bas.' },
      { text: 'Pour le détail par produit, on ajoute **Produit** dans **Colonnes** : le tableau se croise.' },
    ],
  },
  exercises: [
    pex({
      id: 'm9-1',
      title: 'CA par région',
      instruction: 'Construis un TCD qui donne le **CA HT (Montant HT) par région**, puis réponds à la question.',
      dataset: cmd,
      goal: spec({ rows: ['Région'], values: [{ field: 'Montant HT', agg: 'sum' }] }),
      question: (r) => ({ text: 'Quelle région a le CA le plus élevé ?', answer: topRow(r) }),
      hint2: 'Lignes : la région. Valeurs : le montant (Somme).',
      mistakes: [AGG, { when: 'rows-cols-swapped', message: 'Tu as mis Région en Colonnes : ça marche, mais on veut une **ligne** par région.' }],
      file: 'commandes-tcd.xlsx',
    }),
    pex({
      id: 'm9-2',
      title: 'Nombre de contrats par type',
      instruction: 'Construis un TCD qui donne le **nombre de contrats par type de contrat** (compte les N° contrat).',
      dataset: ctr,
      goal: spec({ rows: ['Type de contrat'], values: [{ field: 'N° contrat', agg: 'count' }] }),
      question: (r) => ({ text: 'Combien y a-t-il de contrats Santé ?', answer: num(rowTotal(r, 'Santé')) }),
      hint2: 'Lignes : Type de contrat. Valeurs : N° contrat (Nombre).',
      mistakes: [{ when: 'wrong-field', message: 'Pour compter des contrats, mets un champ qui identifie chaque contrat (N° contrat) dans Valeurs, en **Nombre**.' }, AGG],
      file: 'contrats-tcd.xlsx',
    }),
    pex({
      id: 'm9-3',
      title: 'Prime moyenne par conseiller',
      instruction: 'Construis un TCD qui donne la **prime annuelle moyenne par conseiller**.',
      dataset: ctr,
      goal: spec({ rows: ['Conseiller'], values: [{ field: 'Prime annuelle', agg: 'avg' }] }),
      question: (r) => ({ text: 'Quel conseiller a la prime moyenne la plus élevée ?', answer: topRow(r) }),
      hint2: 'Lignes : Conseiller. Valeurs : Prime annuelle, en **Moyenne** (pas en Somme).',
      mistakes: [{ when: 'wrong-agg', message: 'Excel met « Somme » par défaut. Ici on veut la **moyenne** : change le calcul du champ dans Valeurs.' }],
      file: 'contrats-moyenne.xlsx',
    }),
    pex({
      id: 'm9-4',
      title: 'CA par région et par produit',
      instruction: 'Construis un TCD avec les **régions en lignes**, les **produits en colonnes**, et le **CA HT** au croisement.',
      dataset: cmd,
      goal: spec({ rows: ['Région'], cols: ['Produit'], values: [{ field: 'Montant HT', agg: 'sum' }] }),
      hint2: 'Lignes : Région. Colonnes : Produit. Valeurs : Montant HT (Somme).',
      mistakes: [{ when: 'rows-cols-swapped', message: 'Tes lignes et colonnes sont inversées : les **régions** vont en Lignes, les **produits** en Colonnes.' }, AGG],
      file: 'commandes-croise.xlsx',
    }),
    pex({
      id: 'm9-5',
      title: 'Affaires gagnées par commercial',
      instruction: 'Construis un TCD qui donne le **montant des opportunités gagnées** (Étape = « Gagné ») **par commercial**.',
      dataset: pip,
      goal: spec({ rows: ['Commercial'], values: [{ field: 'Montant', agg: 'sum' }], filters: [{ field: 'Étape', values: ['Gagné'] }] }),
      question: (r) => ({ text: 'Quel commercial a gagné le plus gros montant ?', answer: topRow(r) }),
      hint2: 'Filtres : Étape (ne garder que « Gagné »). Lignes : Commercial. Valeurs : Montant (Somme).',
      mistakes: [{ when: 'missing-filter', message: 'Tu as additionné **toutes** les opportunités. Ajoute Étape dans **Filtres** et ne garde que « Gagné ».' }, AGG],
      file: 'pipeline-tcd.xlsx',
    }),
    pex({
      id: 'm9-6',
      title: 'Ventes de janvier par magasin et rayon',
      instruction: 'Construis un TCD du **CA par magasin (lignes) et par rayon (colonnes)**, pour le mois de **Janvier** uniquement.',
      dataset: mag,
      goal: spec({ rows: ['Magasin'], cols: ['Rayon'], values: [{ field: 'CA', agg: 'sum' }], filters: [{ field: 'Mois', values: ['Janvier'] }] }),
      hint2: 'Filtres : Mois = Janvier. Lignes : Magasin. Colonnes : Rayon. Valeurs : CA (Somme).',
      mistakes: [{ when: 'missing-filter', message: 'Il manque le filtre sur le mois : mets **Mois** dans Filtres et ne garde que Janvier.' }, { when: 'rows-cols-swapped', message: 'Inversé : magasins en Lignes, rayons en Colonnes.' }, AGG],
      file: 'magasins-janvier.xlsx',
    }),
    pex({
      id: 'm9-7',
      title: 'Quantités par produit',
      instruction: 'Construis un TCD qui donne la **quantité totale commandée par produit**.',
      dataset: cmd,
      goal: spec({ rows: ['Produit'], values: [{ field: 'Quantité', agg: 'sum' }] }),
      question: (r) => ({ text: 'Quel produit a été commandé en plus grande quantité ?', answer: topRow(r) }),
      hint2: 'Lignes : Produit. Valeurs : Quantité (Somme).',
      mistakes: [{ when: 'wrong-agg', message: '« Nombre de Quantité » compte les **commandes**. On veut le total des **unités** : Somme de Quantité.' }],
      file: 'commandes-quantites.xlsx',
    }),
  ],
};

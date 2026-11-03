import { contrats, layout, MAGASINS, table, TYPES_CONTRAT, ventesMagasins, CLIENTS } from '../../data/datasets';
import { rng } from '../../data/random';
import { OPEN_STEP } from '../../pivot/excelSteps';
import { ExcelTask, Module, QuizExercise } from '../types';

// --- données des graphiques (graine fixe) ---
const MOIS24 = (() => {
  const noms = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  return [...noms.map((m) => `${m} 24`), ...noms.map((m) => `${m} 25`)];
})();
const CA24 = (() => {
  const r = rng(77);
  return MOIS24.map((_, i) => Math.round((150000 + i * 2500 + (i % 12 === 11 ? 40000 : 0) + r.int(-12000, 12000)) / 100) * 100);
})();
const caMagasins = (() => {
  const d = ventesMagasins(2024);
  return MAGASINS.map((m) => d.rows.filter((r) => r[0] === m).reduce((s, r) => s + (r[3] as number), 0));
})();
const objMagasins = (() => {
  const d = ventesMagasins(2024);
  return MAGASINS.map((m) => d.rows.filter((r) => r[0] === m).reduce((s, r) => s + (r[4] as number), 0));
})();
const parType = (() => {
  const d = contrats(150, 7);
  return TYPES_CONTRAT.map((t) => d.rows.filter((r) => r[2] === t).length);
})();
const caClients = CLIENTS.map((_, i) => 40000 + ((i * 7919) % 90) * 1500);

const fmtE = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n)} €`;

const chartTask = (o: { file: string; range: string; data: () => ReturnType<typeof layout>; insert: string; expected: string }): ExcelTask => ({
  dataset: o.data,
  fileName: o.file,
  steps: [
    OPEN_STEP,
    `Sélectionne la plage **${o.range}** (titres compris) : clique sur la première cellule, puis Maj + clic sur la dernière.`,
    `Dans le ruban, onglet **Insertion** › ${o.insert}.`,
    'Clique sur le titre du graphique (« Titre du graphique ») et tape un titre qui dit ce qu’on lit, par exemple « CA mensuel 2024-2025 ».',
    'Pour afficher les valeurs : clique sur le graphique › onglet **Création de graphique** › **Ajouter un élément graphique** › **Étiquettes de données**.',
    'Vérifie que l’axe vertical commence bien à 0 (clic droit sur l’axe › **Mise en forme de l’axe** › Minimum : 0).',
  ],
  expected: o.expected,
});

const moisData = () => layout(table([{ name: 'Mois', width: 90 }, { name: 'CA', fmt: 'eur', width: 110 }], MOIS24.map((m, i) => [m, CA24[i]])));
const magData = () => layout(table([{ name: 'Magasin', width: 100 }, { name: 'CA', fmt: 'eur', width: 120 }, { name: 'Objectif', fmt: 'eur', width: 120 }], MAGASINS.map((m, i) => [m, caMagasins[i], objMagasins[i]])));
const typeData = () => layout(table([{ name: 'Type de contrat', width: 130 }, { name: 'Nombre', width: 80 }], TYPES_CONTRAT.map((t, i) => [t, parType[i]])));

const q = (o: Omit<QuizExercise, 'module' | 'kind' | 'notions' | 'hint2'> & { hint2?: string }): QuizExercise => ({
  module: 10,
  kind: 'quiz',
  notions: ['CHARTS'],
  hint1: 'Pose-toi la question : est-ce que je compare des catégories, je montre une évolution dans le temps, ou des parts d’un tout ?',
  hint2: o.hint2 ?? 'Temps → courbe. Catégories → barres. Parts d’un total (peu de parts) → secteurs.',
  hint3: `La bonne réponse : ${o.choices[o.answer]}.`,
  ...o,
});

const maxMag = MAGASINS[caMagasins.indexOf(Math.max(...caMagasins))];

export const m10: Module = {
  id: 10,
  title: 'Graphiques',
  short: 'Graphiques',
  functions: ['CHARTS'],
  lesson: [
    {
      title: 'Un graphique répond à une question',
      body: [
        'Avant de choisir un graphique, écris la question : « Quel magasin vend le plus ? », « Le CA monte-t-il ? », « Quelle part pèse l’Auto dans le portefeuille ? ».',
        'Chaque type de graphique répond bien à un type de question. Le recruteur regarde surtout si ton choix est logique.',
      ],
      example: { caption: 'Comparer → barres · Évoluer dans le temps → courbe · Répartir un total → secteurs.' },
    },
    {
      title: 'Barres (histogramme) : comparer',
      body: [
        'Pour comparer des **catégories** entre elles : magasins, régions, commerciaux.',
        'Dans Excel français, les barres verticales s’appellent **Histogramme**, les barres horizontales **Barres**. Les barres horizontales sont pratiques quand les noms sont longs.',
        'Trie les barres du plus grand au plus petit : le classement saute aux yeux.',
      ],
      example: { caption: 'Insertion › Histogramme › Histogramme groupé.' },
    },
    {
      title: 'Courbe : une évolution dans le temps',
      body: [
        'Pour montrer comment une valeur **évolue** : mois, trimestres, années. L’axe horizontal, c’est le temps, dans l’ordre.',
        'Ne relie jamais par une courbe des catégories sans ordre (Lyon, Paris, Lille) : la ligne entre deux villes ne veut rien dire.',
      ],
      example: { caption: 'Insertion › Courbe › Courbe (ou « Courbe avec marques »).' },
    },
    {
      title: 'Secteurs : les parts d’un tout',
      body: [
        'Le « camembert » montre comment un **total se répartit** : la part de chaque type de contrat dans le portefeuille.',
        'Seulement avec **peu de parts** (5 ou 6 maximum) et quand le total a un sens (100 %). Au-delà, on ne lit plus rien : prends des barres.',
      ],
      example: { caption: 'Insertion › Secteurs › Secteurs.' },
    },
    {
      title: 'Les pièges qui coûtent des points',
      body: [
        'Un axe vertical qui ne commence pas à 0 **exagère** les écarts : 98 000 et 102 000 ont l’air de varier du simple au double.',
        'Pas de 3D, pas de titre vide (« Titre du graphique »), pas de légende inutile quand il n’y a qu’une série.',
        'Pour comparer réel et objectif : un histogramme **groupé** (deux barres côte à côte par magasin).',
      ],
      example: { caption: 'Titre clair + axe à 0 + bon type = graphique professionnel.' },
    },
  ],
  worked: {
    intro: 'On choisit le graphique pour « le CA par magasin sur le semestre » : ce sont des catégories (des magasins) à comparer, donc un histogramme.',
    setup: magData,
    steps: [
      { text: 'Les données : une ligne par magasin (A2:A7), le CA en colonne B.' },
      { text: 'La question compare des **catégories** → histogramme. Dans Excel : on sélectionne A1:B7, puis Insertion › Histogramme › Histogramme groupé.' },
      { text: `On lit tout de suite que ${maxMag} a le plus gros CA. Pour l’écart à l’objectif, on sélectionne A1:C7 : deux barres par magasin.` },
    ],
  },
  exercises: [
    q({
      id: 'm10-1',
      title: 'Évolution mensuelle',
      instruction: 'Ton manager veut voir **l’évolution du CA mois par mois** sur 2024 et 2025. Quel graphique choisis-tu ?',
      choices: ['Un histogramme', 'Une courbe', 'Des secteurs'],
      answer: 1,
      why: ['Un histogramme marche, mais pour une évolution dans le temps sur 24 mois, la **courbe** montre mieux la tendance.', 'Oui : le temps en abscisse, la courbe montre la tendance et le pic de décembre.', 'Des secteurs avec 24 parts sont illisibles, et ils ne montrent pas une évolution.'],
      illustration: { type: 'line', labels: MOIS24, values: CA24, title: 'CA mensuel 2024-2025' },
      excel: chartTask({ file: 'ca-mensuel.xlsx', range: 'A1:B25', data: moisData, insert: 'bouton **Courbe** (icône de lignes) › **Courbe avec marques**', expected: `une courbe de janvier 2024 à décembre 2025, qui monte doucement, avec un pic chaque mois de décembre (${fmtE(Math.max(...CA24))} au plus haut).` }),
    }),
    q({
      id: 'm10-2',
      title: 'Comparer des magasins',
      instruction: 'Tu dois montrer **quel magasin a fait le plus gros CA** sur le semestre. Quel graphique ?',
      choices: ['Un histogramme (barres verticales)', 'Une courbe', 'Un nuage de points'],
      answer: 0,
      why: ['Oui : des catégories à comparer → des barres. Trie-les du plus grand au plus petit.', 'Une courbe relierait Lyon à Paris à Lille : ça laisse croire à une évolution qui n’existe pas.', 'Un nuage de points sert à croiser deux mesures (ex. prix et quantité), pas à comparer des catégories.'],
      illustration: { type: 'bars', labels: MAGASINS, values: caMagasins, title: 'CA par magasin (S1)' },
      excel: chartTask({ file: 'ca-magasins.xlsx', range: 'A1:B7', data: magData, insert: 'bouton **Histogramme** (icône de barres verticales) › **Histogramme groupé**', expected: `6 barres, la plus haute est ${maxMag} (${fmtE(Math.max(...caMagasins))}).` }),
    }),
    q({
      id: 'm10-3',
      title: 'Répartition du portefeuille',
      instruction: 'Tu veux montrer **la part de chaque type de contrat** dans le portefeuille (5 types). Quel graphique est le plus parlant ?',
      choices: ['Une courbe', 'Des secteurs', 'Un graphique en aires'],
      answer: 1,
      why: ['Une courbe montre une évolution dans le temps, pas une répartition.', 'Oui : 5 parts d’un total (100 % des contrats) → secteurs. Des barres seraient acceptables aussi.', 'Les aires servent pour des évolutions cumulées dans le temps.'],
      illustration: { type: 'pie', labels: TYPES_CONTRAT, values: parType, title: 'Contrats par type' },
      excel: chartTask({ file: 'repartition-contrats.xlsx', range: 'A1:B6', data: typeData, insert: 'bouton **Secteurs** (icône de camembert) › **Secteurs**', expected: `5 parts ; la plus grosse est « ${TYPES_CONTRAT[parType.indexOf(Math.max(...parType))]} » (${Math.max(...parType)} contrats sur 150). Ajoute les étiquettes en pourcentage.` }),
    }),
    q({
      id: 'm10-4',
      title: 'Un camembert de 16 clients',
      instruction: 'Un collègue présente le **CA de nos 16 clients** dans un camembert. Ton avis ?',
      choices: ['Parfait, c’est très visuel', 'Trop de parts : un graphique en barres horizontales, trié, serait plus lisible', 'Il faudrait une courbe'],
      answer: 1,
      why: ['Avec 16 parts de tailles proches, on ne voit plus qui est devant : les secteurs deviennent illisibles au-delà de 5-6 parts.', 'Oui : des barres horizontales triées, avec les noms de clients lisibles à gauche.', 'Les clients ne sont pas dans un ordre de temps : une courbe n’a pas de sens.'],
      illustration: { type: 'pie', labels: CLIENTS, values: caClients, title: 'CA par client' },
    }),
    q({
      id: 'm10-5',
      title: 'L’axe qui ment',
      instruction: 'Sur ce graphique, l’axe vertical commence à **95 % du plus petit CA**. Quel est le problème ?',
      choices: ['Aucun, c’est plus précis', 'Les écarts paraissent beaucoup plus grands qu’en réalité', 'Les magasins ne sont pas dans l’ordre alphabétique'],
      answer: 1,
      why: ['Plus « zoomé », oui, mais trompeur : le lecteur compare la hauteur des barres.', 'Oui : un écart de quelques % ressemble à un écart du simple au double. Fais commencer l’axe à 0.', 'L’ordre alphabétique n’est pas important ; trier par valeur est même mieux.'],
      illustration: { type: 'bars', labels: MAGASINS, values: caMagasins, title: 'CA par magasin (axe tronqué)', min: Math.round(Math.min(...caMagasins) * 0.95) },
      hint2: 'Regarde la valeur en bas de l’axe vertical.',
    }),
    q({
      id: 'm10-6',
      title: 'Réel contre objectif',
      instruction: 'Tu veux comparer, **pour chaque magasin, le CA réel et l’objectif**. Quel graphique ?',
      choices: ['Des secteurs pour chaque magasin', 'Un histogramme groupé (2 barres par magasin)', 'Une courbe du CA et une courbe de l’objectif'],
      answer: 1,
      why: ['Six camemberts ne permettent pas de comparer réel et objectif.', 'Oui : sélectionne Magasin, CA et Objectif (A1:C7) puis Histogramme groupé : deux barres côte à côte par magasin.', 'Les magasins ne sont pas une suite dans le temps : des barres sont plus justes.'],
      illustration: { type: 'bars', labels: MAGASINS, values: objMagasins, title: 'Objectifs par magasin' },
    }),
    q({
      id: 'm10-7',
      title: 'Des noms très longs',
      instruction: 'Tu dois classer **les 16 clients** par CA, et leurs noms sont longs (« Helvane Énergie », « Kerlys Industrie »…). Quel graphique ?',
      choices: ['Un histogramme (barres verticales)', 'Des barres horizontales', 'Des secteurs'],
      answer: 1,
      why: ['Avec des barres verticales, les noms longs se chevauchent ou s’écrivent en biais : illisible.', 'Oui : les noms se lisent à gauche, et le classement de haut en bas est naturel.', 'Seize parts, c’est beaucoup trop pour des secteurs.'],
      illustration: { type: 'hbars', labels: CLIENTS.slice(0, 8), values: caClients.slice(0, 8), title: 'CA par client (extrait)' },
    }),
  ],
};

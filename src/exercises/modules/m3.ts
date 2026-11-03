import { contrats, layout, withCells } from '../../data/datasets';
import { Module } from '../types';

const N = 150;
const L = N + 1; // dernière ligne de données
const portefeuille = (labels: Record<string, string>, fmts: Record<string, 'eur' | 'int' | 'dec2'> = {}) => () =>
  withCells(layout(contrats(N, 7)), labels, fmts, { 8: 210, 9: 110 });

/** Variante avec des primes « en attente » (texte) et des cellules vides. */
const portefeuilleIncomplet = () => {
  const s = withCells(layout(contrats(N, 7)), { I1: 'Primes renseignées (nombres)', I2: 'Contrats (N° saisis)' }, {}, { 8: 210, 9: 110 });
  for (let i = 0; i < N; i += 9) s.cells[`D${i + 2}`] = 'en attente';
  for (let i = 4; i < N; i += 13) s.cells[`D${i + 2}`] = '';
  return s;
};

export const m3: Module = {
  id: 3,
  title: 'Fonctions de base',
  short: 'SOMME & co',
  functions: ['SUM', 'AVERAGE', 'MIN', 'MAX', 'COUNT', 'COUNTA', 'ROUND'],
  lesson: [
    {
      title: 'Une fonction, c’est quoi ?',
      body: [
        'Une **fonction** est un calcul tout prêt. On écrit son nom, puis ses **arguments** entre parenthèses.',
        'En Excel français, les arguments sont séparés par un **point-virgule** `;` (en anglais, par une virgule).',
        'Excel te propose les fonctions dès que tu tapes `=SOM` : double-clique sur la bonne ou appuie sur Tab.',
      ],
      example: { formula: '=SUM(D2:D151)', caption: 'Additionne toutes les primes, de D2 à D151.' },
    },
    {
      title: '{{SUM}} et {{AVERAGE}}',
      body: [
        '{{SUM}} additionne une plage. {{AVERAGE}} calcule la moyenne (somme ÷ nombre de valeurs).',
        'Les cellules qui contiennent du texte ou qui sont vides sont ignorées.',
        'On peut mettre plusieurs plages : {{=SUM(B2:B10,D2:D10)}}.',
      ],
      example: { table: [['Formule', 'Résultat'], ['=SOMME(10;20;30)', '60'], ['=MOYENNE(10;20;30)', '20']] },
    },
    {
      title: '{{MIN}} et {{MAX}}',
      body: [
        '{{MIN}} renvoie la plus petite valeur, {{MAX}} la plus grande.',
        'Pratique pour un écart : {{=MAX(D2:D151)-MIN(D2:D151)}}.',
      ],
      example: { formula: '=MAX(D2:D151)', caption: 'La prime la plus élevée du portefeuille.' },
    },
    {
      title: '{{COUNT}} ou {{COUNTA}} ?',
      body: [
        '{{COUNT}} compte les cellules qui contiennent des **nombres**. {{COUNTA}} compte les cellules **non vides** (texte compris).',
        'Pour compter des clients ou des numéros de contrat (du texte), c’est {{COUNTA}}. {{COUNT}} renverrait 0.',
        'Piège de test : une colonne où certaines valeurs sont « en attente » (texte). {{COUNT}} ne les compte pas, {{COUNTA}} si.',
      ],
      example: { table: [['Plage', 'NB', 'NBVAL'], ['12 ; « en attente » ; 30 ; (vide)', '2', '3']] },
    },
    {
      title: '{{ROUND}}',
      body: [
        '{{=ROUND(number,num_digits)}} arrondit vraiment la valeur. `2` = 2 décimales, `0` = à l’unité.',
        'Attention : les boutons « ajouter/réduire les décimales » changent seulement l’**affichage**. La valeur reste la même dans les calculs.',
        'On peut arrondir le résultat d’une autre fonction : {{=ROUND(AVERAGE(D2:D151),0)}}.',
      ],
      example: { table: [['Formule', 'Résultat'], ['=ARRONDI(12,345;2)', '12,35'], ['=ARRONDI(12,345;0)', '12']] },
    },
  ],
  worked: {
    intro: 'Le portefeuille compte 150 contrats d’assurance. On calcule le total et la moyenne des primes.',
    setup: portefeuille({ I1: 'Total des primes', I2: 'Prime moyenne', I3: 'Nombre de contrats' }, { J1: 'eur', J2: 'eur' }),
    steps: [
      { text: 'Les primes sont en colonne D, de D2 à D151 (la ligne 1 contient les titres).' },
      { text: 'En **J1**, on tape `=SOMME(`, on clique sur D2 puis **Cmd + Maj + ↓** pour aller au bout, on ferme la parenthèse.', cell: 'J1', input: `=SUM(D2:D${L})` },
      { text: 'En **J2**, la moyenne : même plage, autre fonction.', cell: 'J2', input: `=AVERAGE(D2:D${L})` },
      { text: 'En **J3**, on compte les N° de contrat (du texte) avec NBVAL.', cell: 'J3', input: `=COUNTA(A2:A${L})` },
    ],
  },
  exercises: [
    {
      id: 'm3-1',
      module: 3,
      kind: 'formula',
      title: 'Total des primes',
      instruction: 'En **J1**, calcule le total des primes annuelles du portefeuille.',
      notions: ['SUM'],
      setup: portefeuille({ I1: 'Total des primes' }, { J1: 'eur' }),
      targets: [{ cell: 'J1', solution: `=SUM(D2:D${L})`, fmt: 'eur' }],
      requiredFunctions: ['SUM'],
      hint2: '{{=SUM(plage_des_primes)}}',
      mistakes: [{ formulas: [`=SUM(D2:D${L - 1})`], message: `Il manque la dernière ligne : les primes vont jusqu’en D${L}.` }],
    },
    {
      id: 'm3-2',
      module: 3,
      kind: 'formula',
      title: 'Prime moyenne',
      instruction: 'En **J2**, calcule la prime moyenne.',
      notions: ['AVERAGE'],
      setup: portefeuille({ I2: 'Prime moyenne' }, { J2: 'eur' }),
      targets: [{ cell: 'J2', solution: `=AVERAGE(D2:D${L})`, fmt: 'eur' }],
      requiredFunctions: ['AVERAGE'],
      hint2: '{{=AVERAGE(plage)}}',
      mistakes: [{ formulas: [`=SUM(D2:D${L})`], message: 'Tu as calculé la **somme**. La moyenne se fait avec {{AVERAGE}}.' }],
    },
    {
      id: 'm3-3',
      module: 3,
      kind: 'formula',
      title: 'Plus grosse et plus petite prime',
      instruction: 'En **J1**, la prime la plus élevée. En **J2**, la prime la plus faible.',
      notions: ['MIN', 'MAX'],
      setup: portefeuille({ I1: 'Prime maximale', I2: 'Prime minimale' }, { J1: 'eur', J2: 'eur' }),
      targets: [
        { cell: 'J1', solution: `=MAX(D2:D${L})`, fmt: 'eur' },
        { cell: 'J2', solution: `=MIN(D2:D${L})`, fmt: 'eur' },
      ],
      requiredFunctions: ['MAX', 'MIN'],
      hint2: '{{=MAX(plage)}} et {{=MIN(plage)}}',
      mistakes: [{ formulas: [`=MIN(D2:D${L})`, `=MAX(D2:D${L})`], message: 'Tu as inversé : {{MAX}} donne la plus grande valeur, {{MIN}} la plus petite.' }],
    },
    {
      id: 'm3-4',
      module: 3,
      kind: 'formula',
      title: 'Compter les contrats',
      instruction: 'En **J1**, compte le nombre de contrats du portefeuille à partir des N° de contrat (colonne A).',
      notions: ['COUNTA'],
      setup: portefeuille({ I1: 'Nombre de contrats' }),
      targets: [{ cell: 'J1', solution: `=COUNTA(A2:A${L})` }],
      requiredFunctions: ['COUNTA'],
      hint2: '{{=COUNTA(plage)}}',
      mistakes: [
        { formulas: [`=COUNT(A2:A${L})`], message: '{{COUNT}} ne compte que les **nombres**. « CT-20001 » est du texte : utilise {{COUNTA}}.' },
        { formulas: [`=COUNTA(A1:A${L})`], message: 'Tu as compté le titre « N° contrat » : commence en A2.' },
      ],
    },
    {
      id: 'm3-5',
      module: 3,
      kind: 'formula',
      title: 'NB ou NBVAL ?',
      instruction: 'Certaines primes sont « en attente », d’autres pas encore saisies. En **J1**, compte les primes **renseignées par un nombre**. En **J2**, compte les contrats (N° en colonne A).',
      notions: ['COUNT', 'COUNTA'],
      setup: portefeuilleIncomplet,
      targets: [
        { cell: 'J1', solution: `=COUNT(D2:D${L})` },
        { cell: 'J2', solution: `=COUNTA(A2:A${L})` },
      ],
      requiredFunctions: ['COUNT', 'COUNTA'],
      hint1: '{{COUNT}} compte les nombres, {{COUNTA}} compte tout ce qui n’est pas vide.',
      hint2: 'J1 : {{=COUNT(primes)}} ; J2 : {{=COUNTA(numéros)}}',
      mistakes: [{ formulas: [`=COUNTA(D2:D${L})`, `=COUNTA(A2:A${L})`], message: 'En J1, {{COUNTA}} compte aussi les « en attente » (du texte). Pour ne compter que les nombres : {{COUNT}}.' }],
    },
    {
      id: 'm3-6',
      module: 3,
      kind: 'formula',
      title: 'Moyenne arrondie',
      instruction: 'En **J1**, calcule la prime moyenne **arrondie à l’euro près** (0 décimale).',
      notions: ['ROUND', 'AVERAGE'],
      setup: portefeuille({ I1: 'Prime moyenne arrondie' }, { J1: 'eur' }),
      targets: [{ cell: 'J1', solution: `=ROUND(AVERAGE(D2:D${L}),0)`, fmt: 'eur' }],
      requiredFunctions: ['ROUND', 'AVERAGE'],
      hint1: 'Une fonction dans une fonction : {{ROUND}} autour de {{AVERAGE}}.',
      hint2: '{{=ROUND(AVERAGE(plage),0)}}',
      mistakes: [
        { formulas: [`=AVERAGE(D2:D${L})`], message: 'La moyenne est juste mais pas arrondie. Entoure-la avec {{ROUND}}, 0 décimale.' },
        { formulas: [`=ROUND(AVERAGE(D2:D${L}),2)`], message: 'Tu as arrondi à 2 décimales. « À l’euro près », c’est 0 décimale.' },
      ],
    },
    {
      id: 'm3-7',
      module: 3,
      kind: 'formula',
      title: 'Prime mensuelle',
      instruction: 'En **H2**, calcule la prime mensuelle (prime annuelle / 12) **arrondie à 2 décimales**, puis recopie jusqu’en **H151**.',
      notions: ['ROUND', 'FILL'],
      setup: () => withCells(layout(contrats(N, 7), { extraCols: [{ name: 'Prime mensuelle', fmt: 'eur', width: 120 }] }), {}),
      targets: [{ cell: 'H2', fillTo: `H${L}`, solution: '=ROUND(D2/12,2)', fmt: 'eur' }],
      requiredFunctions: ['ROUND'],
      hint2: '{{=ROUND(prime/12,2)}} puis double-clic sur la poignée de recopie.',
      mistakes: [{ formulas: ['=D2/12'], message: 'Le calcul est bon mais il n’est pas arrondi : utilise {{ROUND}} avec 2 décimales.' }],
    },
    {
      id: 'm3-8',
      module: 3,
      kind: 'formula',
      title: 'Écart de primes',
      instruction: 'En **J1**, calcule l’écart entre la prime la plus élevée et la plus faible, en une seule formule.',
      notions: ['MIN', 'MAX'],
      setup: portefeuille({ I1: 'Écart max − min' }, { J1: 'eur' }),
      targets: [{ cell: 'J1', solution: `=MAX(D2:D${L})-MIN(D2:D${L})`, fmt: 'eur' }],
      requiredFunctions: ['MAX', 'MIN'],
      hint2: '{{=MAX(plage)-MIN(plage)}}',
      mistakes: [{ formulas: [`=MIN(D2:D${L})-MAX(D2:D${L})`], message: 'Ton écart est négatif : c’est le max moins le min, pas l’inverse.' }],
    },
    {
      id: 'm3-9',
      module: 3,
      kind: 'formula',
      title: 'Total en milliers d’euros',
      instruction: 'En **J1**, calcule le total des primes **en milliers d’euros**, arrondi à 1 décimale (ex. 123,4).',
      notions: ['ROUND', 'SUM'],
      setup: portefeuille({ I1: 'Total (k€)' }),
      targets: [{ cell: 'J1', solution: `=ROUND(SUM(D2:D${L})/1000,1)` }],
      requiredFunctions: ['ROUND', 'SUM'],
      hint1: 'Somme, puis division par 1 000, puis arrondi.',
      hint2: '{{=ROUND(SUM(plage)/1000,1)}}',
      mistakes: [
        { formulas: [`=SUM(D2:D${L})/1000`], message: 'Il manque l’arrondi à 1 décimale : {{ROUND}}(… ; 1).' },
        { formulas: [`=ROUND(SUM(D2:D${L}),1)`], message: 'Tu as oublié de diviser par 1 000 pour passer en milliers.' },
      ],
    },
  ],
};

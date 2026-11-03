import { commandesMontant, contrats, fit, layout, pipeline, REGIONS, withCells } from '../../data/datasets';
import { Module } from '../types';

const N = 120;
const L = N + 1;
const R = (c: string) => `${c}2:${c}${L}`;
const AR = (c: string) => `$${c}$2:$${c}$${L}`;
const cmd = (labels: Record<string, string | number> = {}, fmts: Record<string, 'eur' | 'int'> = {}) => () =>
  withCells(layout(commandesMontant(N, 42)), labels, fmts, { 9: 190, 10: 120, 11: 120, 12: 120 });
const ctr = (labels: Record<string, string>, fmts: Record<string, 'eur'> = {}) => () => withCells(layout(contrats(150, 7)), labels, fmts, { 8: 260, 9: 110 });

const regionsList = () => {
  const cells: Record<string, string> = { J1: 'Région', K1: 'CA HT' };
  REGIONS.forEach((r, i) => (cells[`J${i + 2}`] = r));
  const fmts: Record<string, 'eur'> = {};
  REGIONS.forEach((_, i) => (fmts[`K${i + 2}`] = 'eur'));
  return cmd(cells, fmts)();
};

const PRODS = ['Ordinateur portable', 'Écran 27 pouces', 'Licence logicielle'];
const croise = () => {
  const s = regionsList();
  s.cells.J1 = 'Région \\ Produit';
  delete s.cells.K1;
  PRODS.forEach((p, j) => (s.cells[`${'KLM'[j]}1`] = p));
  REGIONS.forEach((_, i) => PRODS.forEach((__, j) => (s.fmts[`${'KLM'[j]}${i + 2}`] = 'eur')));
  s.colWidths[10] = 150;
  s.colWidths[11] = 130;
  s.colWidths[12] = 140;
  return fit(s);
};

export const m5: Module = {
  id: 5,
  title: 'Agréger sous condition',
  short: 'SOMME.SI.ENS',
  functions: ['SUMIF', 'COUNTIF', 'SUMIFS', 'COUNTIFS', 'AVERAGEIFS'],
  lesson: [
    {
      title: '{{SUMIF}} : additionner seulement certaines lignes',
      body: [
        '« Quel est le CA de la région Nord ? » : on additionne la colonne Montant, mais seulement pour les lignes où la région vaut « Nord ».',
        'Structure : {{=SUMIF(plage_critère,critère,plage_somme)}}.',
        'Les deux plages doivent avoir **la même taille** et commencer à la même ligne.',
      ],
      example: { formula: '=SUMIF(D2:D121,"Nord",H2:H121)', caption: 'Additionne H (montant) quand D (région) vaut Nord.' },
    },
    {
      title: '{{COUNTIF}} : compter',
      body: [
        '{{=COUNTIF(plage,critère)}} compte les lignes qui respectent le critère.',
        'Le critère peut être un texte (`"Serveur"`), une comparaison entre guillemets (`">20"`, `"<>Nord"`) ou une cellule (`J2`).',
        'Pour comparer à une cellule : `">"&J1` (le & colle le signe et la valeur).',
      ],
      example: { table: [['Critère', 'Sens'], ['"Nord"', 'égal à Nord'], ['">20"', 'plus de 20'], ['"<>Nord"', 'tout sauf Nord']] },
    },
    {
      title: '{{SUMIFS}} : plusieurs conditions',
      body: [
        '{{=SUMIFS(plage_somme,plage_critère1,critère1,plage_critère2,critère2)}}',
        'Attention : avec la version .ENS, la **plage à additionner vient en premier** (alors qu’elle est en dernier dans SOMME.SI).',
        'C’est la fonction la plus demandée en test : « CA de la région Nord pour le produit X en 2025 ».',
      ],
      example: { formula: '=SUMIFS(H2:H121,D2:D121,"Nord",E2:E121,"Serveur")' },
    },
    {
      title: '{{COUNTIFS}} et {{AVERAGEIFS}}',
      body: [
        '{{=COUNTIFS(plage1,critère1,plage2,critère2)}} compte les lignes qui respectent **toutes** les conditions.',
        '{{=AVERAGEIFS(plage_moyenne,plage1,critère1,…)}} fait la moyenne sous conditions, même ordre que SOMME.SI.ENS.',
        'Pour une période : deux critères sur la même colonne de dates, `">=01/01/2025"` et `"<=31/12/2025"`.',
      ],
      example: { formula: '=COUNTIFS(C2:C151,"Auto",G2:G151,"Actif")' },
    },
    {
      title: 'Le tableau de synthèse',
      body: [
        'En test, on te demande souvent un tableau : une ligne par région, une colonne par produit.',
        'On écrit **une seule formule** et on la recopie. Les critères pointent vers les titres : la région en colonne J (`$J2`), le produit en ligne 1 (`K$1`).',
        'Les plages de données sont bloquées avec `$` partout. C’est là que les $ deviennent indispensables.',
      ],
      example: { formula: '=SUMIFS($H$2:$H$121,$D$2:$D$121,$J2,$E$2:$E$121,K$1)' },
    },
  ],
  worked: {
    intro: '120 commandes de grands comptes. On calcule le CA de la région Nord, puis celui du Nord pour les ordinateurs portables.',
    setup: cmd({ J1: 'CA Nord', J2: 'CA Nord · Ordinateurs', J3: 'Nb de commandes Nord' }, { K1: 'eur', K2: 'eur' }),
    steps: [
      { text: 'Les régions sont en colonne D, les montants en colonne H (lignes 2 à 121).' },
      { text: 'En **K1** : plage où chercher (D), ce qu’on cherche ("Nord"), plage à additionner (H).', cell: 'K1', input: `=SUMIF(${R('D')},"Nord",${R('H')})` },
      { text: 'En **K2**, deux conditions : SOMME.SI.ENS, avec la plage à additionner **en premier**.', cell: 'K2', input: `=SUMIFS(${R('H')},${R('D')},"Nord",${R('E')},"Ordinateur portable")` },
      { text: 'En **K3**, on compte les commandes du Nord.', cell: 'K3', input: `=COUNTIF(${R('D')},"Nord")` },
    ],
  },
  exercises: [
    {
      id: 'm5-1',
      module: 5,
      kind: 'formula',
      title: 'CA d’une région',
      instruction: 'En **K1**, calcule le CA HT total de la région « Nord ».',
      notions: ['SUMIF'],
      setup: cmd({ J1: 'CA Nord' }, { K1: 'eur' }),
      targets: [{ cell: 'K1', solution: `=SUMIF(${R('D')},"Nord",${R('H')})`, fmt: 'eur' }],
      requiredFunctions: ['SUMIF'],
      hint2: '{{=SUMIF(plage_régions,"Nord",plage_montants)}}',
      mistakes: [
        { formulas: [`=SUMIF(${R('D')},"Nord")`], message: 'Il manque le 3e argument : la plage à **additionner** (les montants, colonne H). Sans elle, Excel additionne la colonne des régions… qui contient du texte.' },
        { formulas: [`=SUMIF(${R('D')},"Nord",H1:H${L - 1})`], message: 'Ta plage à additionner est décalée d’une ligne (elle commence en H1). Les deux plages doivent commencer à la même ligne : D2 et H2.' },
      ],
    },
    {
      id: 'm5-2',
      module: 5,
      kind: 'formula',
      title: 'Compter un produit',
      instruction: 'En **K1**, compte le nombre de commandes de « Serveur ».',
      notions: ['COUNTIF'],
      setup: cmd({ J1: 'Commandes de serveurs' }),
      targets: [{ cell: 'K1', solution: `=COUNTIF(${R('E')},"Serveur")` }],
      requiredFunctions: ['COUNTIF'],
      hint2: '{{=COUNTIF(plage_produits,"Serveur")}}',
      mistakes: [
        { formulas: [`=COUNTIF(${R('E')},Serveur)`], message: 'Le critère texte doit être entre guillemets : `"Serveur"`.' },
        { formulas: [`=SUMIF(${R('E')},"Serveur",${R('F')})`], message: 'Tu as additionné les quantités. On demande le **nombre de commandes** : {{COUNTIF}}.' },
      ],
    },
    {
      id: 'm5-3',
      module: 5,
      kind: 'formula',
      title: 'Compter avec une comparaison',
      instruction: 'En **K1**, compte les commandes de **plus de 20** unités (strictement).',
      notions: ['COUNTIF'],
      setup: cmd({ J1: 'Commandes > 20 unités' }),
      targets: [{ cell: 'K1', solution: `=COUNTIF(${R('F')},">20")` }],
      requiredFunctions: ['COUNTIF'],
      hint2: '{{=COUNTIF(plage_quantités,">20")}} (la comparaison entre guillemets)',
      mistakes: [{ formulas: [`=COUNTIF(${R('F')},">=20")`], message: '« Plus de 20 » veut dire strictement supérieur : `">20"`. Avec `">=20"`, tu comptes aussi les commandes de 20 pile.' }],
    },
    {
      id: 'm5-4',
      module: 5,
      kind: 'formula',
      title: 'CA par région (à recopier)',
      instruction: 'En **K2**, calcule le CA de la région écrite en J2, puis recopie jusqu’en **K6** pour avoir toutes les régions.',
      notions: ['SUMIF', 'ABS_REF'],
      setup: regionsList,
      targets: [{ cell: 'K2', fillTo: 'K6', solution: `=SUMIF(${AR('D')},J2,${AR('H')})`, fmt: 'eur' }],
      requiredFunctions: ['SUMIF'],
      hint1: '{{SUMIF}} avec la cellule J2 comme critère. Les plages de données doivent rester fixes.',
      hint2: '{{=SUMIF($D$2:$D$121,J2,$H$2:$H$121)}}',
      mistakes: [
        { formulas: [`=SUMIF(${R('D')},J2,${R('H')})`], message: 'Sans `$`, tes plages descendent d’une ligne à chaque recopie (D3:D122, D4:D123…) et perdent les premières commandes. Bloque les plages avec F4.' },
        { formulas: [`=SUMIF(${AR('D')},$J$2,${AR('H')})`], message: 'Le critère `$J$2` est bloqué : toutes les lignes calculent le CA du Nord. Le critère doit descendre : `J2` sans $.' },
      ],
    },
    {
      id: 'm5-5',
      module: 5,
      kind: 'formula',
      title: 'Deux critères',
      instruction: 'En **K1**, calcule le CA HT de la région « Île-de-France » pour le produit « Ordinateur portable ».',
      notions: ['SUMIFS'],
      setup: cmd({ J1: 'CA IDF · Ordinateurs' }, { K1: 'eur' }),
      targets: [{ cell: 'K1', solution: `=SUMIFS(${R('H')},${R('D')},"Île-de-France",${R('E')},"Ordinateur portable")`, fmt: 'eur' }],
      requiredFunctions: ['SUMIFS'],
      hint2: '{{=SUMIFS(plage_somme,plage_régions,"Île-de-France",plage_produits,"Ordinateur portable")}}',
      mistakes: [
        { formulas: [`=SUMIFS(${R('H')},${R('D')},"Île-de-France")`], message: 'Tu n’as mis qu’un critère (la région). Ajoute le produit : `;plage_produits;"Ordinateur portable"`.' },
        { formulas: [`=SUMIFS(${R('H')},${R('E')},"Ordinateur portable")`], message: 'Tu n’as filtré que le produit. Il faut aussi la région « Île-de-France ».' },
      ],
    },
    {
      id: 'm5-6',
      module: 5,
      kind: 'formula',
      title: 'Compter avec deux critères',
      instruction: 'En **J1**, compte les contrats de type « Auto » qui sont « Actif ».',
      notions: ['COUNTIFS'],
      setup: ctr({ I1: 'Contrats Auto actifs' }),
      targets: [{ cell: 'J1', solution: '=COUNTIFS(C2:C151,"Auto",G2:G151,"Actif")' }],
      requiredFunctions: ['COUNTIFS'],
      hint2: '{{=COUNTIFS(plage_types,"Auto",plage_statuts,"Actif")}}',
      mistakes: [{ formulas: ['=COUNTIF(C2:C151,"Auto")'], message: 'Tu as compté tous les contrats Auto, y compris les résiliés. Ajoute le critère sur le statut avec {{COUNTIFS}}.' }],
    },
    {
      id: 'm5-7',
      module: 5,
      kind: 'formula',
      title: 'Moyenne sous conditions',
      instruction: 'En **J1**, calcule la prime moyenne des contrats « Habitation » **actifs**.',
      notions: ['AVERAGEIFS'],
      setup: ctr({ I1: 'Prime moyenne Habitation actifs' }, { J1: 'eur' }),
      targets: [{ cell: 'J1', solution: '=AVERAGEIFS(D2:D151,C2:C151,"Habitation",G2:G151,"Actif")', fmt: 'eur' }],
      requiredFunctions: ['AVERAGEIFS'],
      hint2: '{{=AVERAGEIFS(plage_primes,plage_types,"Habitation",plage_statuts,"Actif")}}',
      mistakes: [
        { formulas: ['=AVERAGEIF(C2:C151,"Habitation",D2:D151)'], message: 'Il manque la condition « Actif » : utilise {{AVERAGEIFS}}, qui accepte plusieurs critères.' },
        { formulas: ['=SUMIFS(D2:D151,C2:C151,"Habitation",G2:G151,"Actif")'], message: 'Tu as la **somme** des primes. On demande la **moyenne** : {{AVERAGEIFS}}.' },
      ],
    },
    {
      id: 'm5-8',
      module: 5,
      kind: 'formula',
      title: 'CA sur une période',
      instruction: 'En **K1**, calcule le CA HT des commandes passées en **2025** (du 01/01/2025 au 31/12/2025 inclus).',
      notions: ['SUMIFS'],
      setup: cmd({ J1: 'CA 2025' }, { K1: 'eur' }),
      targets: [{ cell: 'K1', solution: `=SUMIFS(${R('H')},${R('B')},">=01/01/2025",${R('B')},"<=31/12/2025")`, fmt: 'eur' }],
      requiredFunctions: ['SUMIFS'],
      hint1: '{{SUMIFS}} avec deux critères sur la même colonne de dates.',
      hint2: '{{=SUMIFS(plage_montants,plage_dates,">=01/01/2025",plage_dates,"<=31/12/2025")}}',
      mistakes: [
        { formulas: [`=SUMIFS(${R('H')},${R('B')},">=2025")`], message: 'Le critère `">=2025"` compare les dates au **nombre** 2025 (une date est un nombre d’environ 45 000), donc toutes les commandes passent. Écris la date complète : `">=01/01/2025"`.' },
        { formulas: [`=SUMIFS(${R('H')},${R('B')},"<=01/01/2025",${R('B')},">=31/12/2025")`], message: 'Tes signes sont inversés : on veut les dates **après** le 01/01/2025 (`>=`) et **avant** le 31/12/2025 (`<=`).' },
      ],
    },
    {
      id: 'm5-9',
      module: 5,
      kind: 'formula',
      title: 'Tableau croisé avec SOMME.SI.ENS',
      instruction: 'En **K2**, calcule le CA de la région en J2 pour le produit en K1. Recopie la formule sur tout le tableau **K2:M6**.',
      notions: ['SUMIFS', 'ABS_REF'],
      minutes: 6,
      setup: croise,
      targets: [{ cell: 'K2', fillTo: 'M6', solution: `=SUMIFS(${AR('H')},${AR('D')},$J2,${AR('E')},K$1)`, fmt: 'eur' }],
      requiredFunctions: ['SUMIFS'],
      hint1: '{{SUMIFS}}, plages bloquées, critères en références mixtes.',
      hint2: '{{=SUMIFS($H$2:$H$121,$D$2:$D$121,$J2,$E$2:$E$121,K$1)}} : recopie à droite, puis vers le bas.',
      mistakes: [
        { formulas: [`=SUMIFS(${AR('H')},${AR('D')},J2,${AR('E')},K1)`], message: 'Tes critères ne sont pas bloqués : en recopiant à droite, la région glisse vers K2, L2…, et vers le bas le produit glisse vers K2, K3…. Écris `$J2` (colonne bloquée) et `K$1` (ligne bloquée).' },
        { formulas: [`=SUMIFS(H2:H${L},D2:D${L},$J2,E2:E${L},K$1)`], message: 'Les critères sont bien bloqués, mais pas les plages de données : elles glissent en recopiant. Mets des `$` partout sur les plages.' },
      ],
    },
    {
      id: 'm5-10',
      module: 5,
      kind: 'formula',
      title: 'Trois critères',
      instruction: 'En **J1**, compte les opportunités d’**Alice** en « Négociation » d’un montant **supérieur à 50 000 €**.',
      notions: ['COUNTIFS'],
      setup: () => withCells(layout(pipeline(80, 99)), { I1: 'Négociations d’Alice > 50 k€' }, {}, { 8: 220 }),
      targets: [{ cell: 'J1', solution: '=COUNTIFS(C2:C81,"Alice",D2:D81,"Négociation",E2:E81,">50000")' }],
      requiredFunctions: ['COUNTIFS'],
      hint2: '{{=COUNTIFS(commerciaux,"Alice",étapes,"Négociation",montants,">50000")}}',
      mistakes: [
        { formulas: ['=COUNTIFS(C2:C81,"Alice",E2:E81,">50000")'], message: 'Il manque le critère sur l’étape : `D2:D81` doit valoir « Négociation ».' },
        { formulas: ['=COUNTIFS(C2:C81,"Alice",D2:D81,"Négociation",E2:E81,"<50000")'], message: 'Le signe est inversé : on veut les montants **supérieurs** à 50 000 € (`">50000"`).' },
      ],
    },
  ],
};

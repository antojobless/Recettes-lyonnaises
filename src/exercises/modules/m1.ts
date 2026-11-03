import { layout, table, withCells } from '../../data/datasets';
import { Module } from '../types';

const produits = () =>
  layout(
    table(
      [{ name: 'Produit', width: 150 }, { name: 'Prix HT', fmt: 'eur', width: 96 }, { name: 'Quantité', width: 80 }, { name: 'Montant HT', fmt: 'eur', width: 110 }, { name: 'Prix TTC', fmt: 'eur', width: 100 }],
      [
        ['Ordinateur portable', 1150, 12],
        ['Écran 27 pouces', 320, 25],
        ['Licence logicielle', 480, 40],
        ['Imprimante', 260, 6],
        ['Serveur', 4200, 2],
        ['Casque audio', 95, 30],
        ['Station d’accueil', 180, 18],
        ['Clavier sans fil', 65, 50],
      ],
    ),
  );

const evolution = () =>
  layout(
    table(
      [{ name: 'Magasin', width: 100 }, { name: 'CA 2024', fmt: 'eur', width: 120 }, { name: 'CA 2025', fmt: 'eur', width: 120 }, { name: 'Évolution', fmt: 'pct', width: 96 }, { name: 'Part 2025', fmt: 'pct', width: 96 }],
      [
        ['Lyon', 812000, 865400],
        ['Paris', 1450000, 1392000],
        ['Lille', 534000, 571200],
        ['Marseille', 698000, 744500],
        ['Bordeaux', 455000, 448900],
        ['Nantes', 389000, 421300],
        ['Total', 4338000, 4443300],
      ],
    ),
  );

const marges = () =>
  layout(
    table(
      [{ name: 'Article', width: 130 }, { name: 'Prix de vente', fmt: 'eur', width: 110 }, { name: 'Coût d’achat', fmt: 'eur', width: 110 }, { name: 'Taux de marge', fmt: 'pct', width: 110 }],
      [
        ['Veste', 129, 54],
        ['Chemise', 59, 21],
        ['Pantalon', 79, 33],
        ['Pull', 69, 26],
      ],
    ),
  );

export const m1: Module = {
  id: 1,
  title: 'Calculs simples',
  short: 'Calculs',
  functions: ['ARITH', 'PCT'],
  lesson: [
    {
      title: 'Une formule commence par =',
      body: [
        'Pour qu’Excel calcule, la cellule doit commencer par **=**. Sans le =, Excel affiche juste ce que tu as tapé.',
        'Le résultat s’affiche dans la cellule, la formule reste visible dans la barre de formule.',
      ],
      example: { table: [['Tu tapes', 'La cellule affiche'], ['12*3', '12*3'], ['=12*3', '36']] },
    },
    {
      title: 'Les 4 opérations',
      body: [
        '**+** addition, **-** soustraction, ***** multiplication (l’étoile), **/** division. **^** met à la puissance.',
        'Excel fait d’abord les multiplications et divisions, puis les additions et soustractions, comme en maths.',
      ],
      example: { table: [['Formule', 'Résultat'], ['=100+50*2', '200'], ['=(100+50)*2', '300']], caption: 'Les **parenthèses** changent l’ordre du calcul.' },
    },
    {
      title: 'Utiliser les cellules, pas les nombres',
      body: [
        'Au lieu de taper `=1150*12`, écris `=B2*C2` : Excel va chercher le prix en B2 et la quantité en C2.',
        'Si le prix change, le résultat se met à jour tout seul. C’est tout l’intérêt d’Excel, et c’est ce que le recruteur regarde.',
        'Astuce : tape `=`, puis **clique** sur B2, tape `*`, clique sur C2, Entrée. Les références se colorent.',
      ],
      example: { formula: '=B2*C2', caption: 'Montant = prix × quantité.' },
    },
    {
      title: 'Les pourcentages',
      body: [
        '**20 %** vaut **0,2** pour Excel. `=B2*20%` donne 20 % de B2.',
        'Augmenter de 20 % : `=B2*(1+20%)`. Baisser de 15 % : `=B2*(1-15%)`.',
        'Une **évolution** se calcule par (nouveau − ancien) / ancien. Une **part** : morceau / total. Puis on affiche en format %.',
      ],
      example: { table: [['', 'Formule', 'Résultat'], ['Prix TTC (TVA 20 %)', '=100*(1+20%)', '120'], ['Évolution 80 → 100', '=(100-80)/80', '25 %']] },
    },
    {
      title: 'Les pièges classiques',
      body: [
        '`=B2+20%` n’ajoute pas 20 % : ça ajoute 0,2 ! Il faut `=B2*(1+20%)`.',
        'Pas de « ×100 » pour un pourcentage : Excel garde 0,25 et l’affiche 25 % grâce au format.',
        'Une moyenne à la main : `=(B2+B3+B4)/3`, avec des parenthèses. Sans elles, seule B4 est divisée par 3.',
      ],
      example: { formula: '=(B2+B3+B4)/3' },
    },
  ],
  worked: {
    intro: 'On calcule le montant HT puis le prix TTC du premier produit.',
    setup: produits,
    steps: [
      { text: 'Le montant HT = prix × quantité. On clique sur **D2** et on tape `=`.' },
      { text: 'On clique sur **B2** (le prix), on tape `*`, on clique sur **C2** (la quantité), puis Entrée.', cell: 'D2', input: '=B2*C2' },
      { text: 'D2 affiche 13 800 €. Dans la barre de formule, on lit `=B2*C2` : c’est une vraie formule.' },
      { text: 'Prix TTC avec 20 % de TVA : en **E2**, `=B2*(1+20%)`. Les parenthèses font d’abord 1 + 20 % = 1,2.', cell: 'E2', input: '=B2*(1+20%)' },
    ],
  },
  exercises: [
    {
      id: 'm1-1',
      module: 1,
      kind: 'formula',
      title: 'Montant d’une ligne',
      instruction: 'En **D2**, calcule le montant HT du premier produit : prix HT × quantité.',
      notions: ['ARITH'],
      setup: produits,
      targets: [{ cell: 'D2', solution: '=B2*C2', fmt: 'eur' }],
      hint1: 'Une multiplication, avec l’étoile `*`.',
      hint2: '`=prix*quantité` en cliquant sur les cellules.',
      mistakes: [{ formulas: ['=B2+C2'], message: 'Tu as **additionné** le prix et la quantité. Le montant, c’est une multiplication : `*`.' }],
    },
    {
      id: 'm1-2',
      module: 1,
      kind: 'formula',
      title: 'Prix TTC',
      instruction: 'En **E2**, calcule le prix TTC du premier produit, avec une TVA de 20 %.',
      notions: ['PCT'],
      setup: produits,
      targets: [{ cell: 'E2', solution: '=B2*(1+20%)', fmt: 'eur' }],
      hint1: 'TTC = HT augmenté de 20 %.',
      hint2: '`=prix*(1+20%)` (ou `*1,2`).',
      mistakes: [
        { formulas: ['=B2+20%'], message: '`+20%` ajoute 0,2 € au prix, pas 20 % ! Il faut multiplier : `*(1+20%)`.' },
        { formulas: ['=B2*20%'], message: 'Tu as calculé le **montant de la TVA** (20 % du prix), pas le prix TTC. Ajoute le prix HT : `*(1+20%)`.' },
      ],
    },
    {
      id: 'm1-3',
      module: 1,
      kind: 'formula',
      title: 'Prix remisé',
      instruction: 'Le client a une remise de 15 %. En **G2**, calcule le prix HT remisé du premier produit.',
      notions: ['PCT'],
      setup: () => withCells(produits(), { G1: 'Prix remisé' }, { G2: 'eur' }, { 6: 110 }),
      targets: [{ cell: 'G2', solution: '=B2*(1-15%)', fmt: 'eur' }],
      hint1: 'Une baisse de 15 %, c’est garder 85 % du prix.',
      hint2: '`=prix*(1-15%)`',
      mistakes: [
        { formulas: ['=B2-15%'], message: '`-15%` retire 0,15 €, pas 15 % ! Il faut multiplier : `*(1-15%)`.' },
        { formulas: ['=B2*15%'], message: 'Tu as calculé le **montant de la remise**, pas le prix après remise.' },
      ],
    },
    {
      id: 'm1-4',
      module: 1,
      kind: 'formula',
      title: 'Taux de marge',
      instruction: 'En **D2**, calcule le taux de marge de la veste : (prix de vente − coût) / prix de vente.',
      notions: ['ARITH', 'PCT'],
      setup: marges,
      targets: [{ cell: 'D2', solution: '=(B2-C2)/B2', fmt: 'pct' }],
      hint1: 'Une soustraction puis une division. Attention à l’ordre des opérations.',
      hint2: '`=(prix_vente-coût)/prix_vente` avec des parenthèses.',
      mistakes: [{ formulas: ['=B2-C2/B2'], message: 'Il manque des **parenthèses** : Excel divise C2 par B2 avant de soustraire. Écris `(B2-C2)/B2`.' }],
    },
    {
      id: 'm1-5',
      module: 1,
      kind: 'formula',
      title: 'Évolution en %',
      instruction: 'En **D2**, calcule l’évolution du CA de Lyon entre 2024 et 2025, en pourcentage.',
      notions: ['PCT'],
      setup: evolution,
      targets: [{ cell: 'D2', solution: '=(C2-B2)/B2', fmt: 'pct' }],
      hint1: 'Évolution = (nouveau − ancien) / ancien.',
      hint2: '`=(CA_2025-CA_2024)/CA_2024`',
      mistakes: [
        { formulas: ['=(C2-B2)/C2'], message: 'On divise par l’**ancienne** valeur (2024, en B2), pas par la nouvelle.' },
        { formulas: ['=C2-B2'], message: 'Tu as l’écart en euros. Pour l’avoir en %, divise-le par le CA 2024.' },
        { formulas: ['=(C2-B2)/B2*100'], message: 'Pas de ×100 : Excel affiche 0,066 en 6,6 % grâce au format pourcentage.' },
      ],
    },
    {
      id: 'm1-6',
      module: 1,
      kind: 'formula',
      title: 'Part dans le total',
      instruction: 'En **E2**, calcule la part de Lyon dans le CA total 2025 (le total est en C8).',
      notions: ['PCT'],
      setup: evolution,
      targets: [{ cell: 'E2', solution: '=C2/C8', fmt: 'pct' }],
      hint1: 'Une part = le morceau divisé par le total.',
      hint2: '`=CA_Lyon/CA_total`',
      mistakes: [{ formulas: ['=C8/C2'], message: 'C’est à l’envers : on divise le CA de Lyon **par** le total, pas l’inverse.' }],
    },
    {
      id: 'm1-7',
      module: 1,
      kind: 'formula',
      title: 'Moyenne à la main',
      instruction: 'En **G2**, calcule à la main (sans fonction) le prix moyen des 3 premiers produits (B2, B3, B4).',
      notions: ['ARITH'],
      setup: () => withCells(produits(), { G1: 'Prix moyen' }, { G2: 'eur' }, { 6: 110 }),
      targets: [{ cell: 'G2', solution: '=(B2+B3+B4)/3', fmt: 'eur' }],
      hint1: 'On additionne, puis on divise par le nombre de valeurs.',
      hint2: '`=(valeur1+valeur2+valeur3)/3`',
      mistakes: [{ formulas: ['=B2+B3+B4/3'], message: 'Sans parenthèses, Excel divise seulement B4 par 3. Entoure l’addition : `(B2+B3+B4)/3`.' }],
    },
    {
      id: 'm1-8',
      module: 1,
      kind: 'formula',
      title: 'Total d’une commande avec frais',
      instruction: 'En **G2**, calcule le total TTC de la ligne 2 : montant HT (prix × quantité) + 20 % de TVA + 15 € de frais de port.',
      notions: ['ARITH', 'PCT'],
      setup: () => withCells(produits(), { G1: 'Total TTC' }, { G2: 'eur' }, { 6: 110 }),
      targets: [{ cell: 'G2', solution: '=B2*C2*(1+20%)+15', fmt: 'eur' }],
      hint1: 'Montant HT, puis ×(1+20 %), puis + 15.',
      hint2: '`=prix*quantité*(1+20%)+frais`',
      mistakes: [{ formulas: ['=B2*C2*(1+20%+15)'], message: 'Les 15 € de port se rajoutent **après** la TVA, en dehors des parenthèses.' }],
    },
  ],
};

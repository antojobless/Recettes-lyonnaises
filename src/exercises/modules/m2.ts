import { commandes, layout, table, withCells } from '../../data/datasets';
import { colName } from '../../engine/formula';
import { Module } from '../types';

const commandes40 = () => withCells(layout(commandes(40, 11), { extraCols: [{ name: 'Montant HT', fmt: 'eur', width: 110 }] }), {});

const tva = () =>
  withCells(
    layout(
      table(
        [{ name: 'Produit', width: 150 }, { name: 'Prix HT', fmt: 'eur', width: 96 }, { name: 'TVA', fmt: 'eur', width: 96 }, { name: 'Prix TTC', fmt: 'eur', width: 100 }],
        [
          ['Ordinateur portable', 1150],
          ['Écran 27 pouces', 320],
          ['Licence logicielle', 480],
          ['Imprimante', 260],
          ['Serveur', 4200],
          ['Casque audio', 95],
          ['Station d’accueil', 180],
          ['Clavier sans fil', 65],
          ['Souris', 29],
          ['Webcam', 79],
        ],
      ),
    ),
    { F1: 'Taux de TVA', G1: '20%' },
    { G1: 'pct' },
    { 5: 100 },
  );

const devises = () =>
  withCells(
    layout(
      table(
        [{ name: 'Article', width: 130 }, { name: 'Prix (€)', fmt: 'eur', width: 96 }, { name: 'Prix ($)', fmt: 'dec2', width: 96 }],
        [['Veste', 129], ['Chemise', 59], ['Pantalon', 79], ['Pull', 69], ['Manteau', 219], ['Écharpe', 35], ['Ceinture', 45], ['Bonnet', 25]],
      ),
    ),
    { E1: '1 € =', F1: 1.08, G1: '$' },
  );

const parts = () =>
  withCells(
    layout(
      table(
        [{ name: 'Magasin', width: 100 }, { name: 'CA', fmt: 'eur', width: 120 }, { name: 'Part du total', fmt: 'pct', width: 110 }],
        [['Lyon', 865400], ['Paris', 1392000], ['Lille', 571200], ['Marseille', 744500], ['Bordeaux', 448900], ['Nantes', 421300]],
      ),
    ),
    { A8: 'Total', B8: '=SUM(B2:B7)' },
    { B8: 'eur' },
  );

const commissions = () =>
  withCells(
    layout(
      table(
        [{ name: 'Commercial', width: 100 }, { name: 'CA signé', fmt: 'eur', width: 120 }, { name: 'Rémunération variable', fmt: 'eur', width: 170 }],
        [['Alice', 182000], ['Karim', 134500], ['Sophie', 221300], ['Yanis', 98700], ['Marion', 160250], ['Hugo', 143800]],
      ),
    ),
    { E1: 'Taux de commission', F1: '3%', E2: 'Prime fixe', F2: 500 },
    { F1: 'pct', F2: 'eur' },
    { 4: 150 },
  );

const remises = [0, 0.05, 0.1, 0.15, 0.2];
const grille = () => {
  const cells: Record<string, string | number> = { A1: 'Prix unitaire', B1: 480, A2: 'Qté \\ Remise' };
  remises.forEach((r, j) => (cells[`${colName(1 + j)}2`] = `${r * 100}%`));
  [1, 5, 10, 20, 50, 100].forEach((q, i) => (cells[`A${3 + i}`] = q));
  const fmts: Record<string, 'eur' | 'pct'> = { B1: 'eur' };
  for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) fmts[`${colName(1 + j)}${3 + i}`] = 'eur';
  return { cells, fmts, colWidths: { 0: 110 }, rows: 20, cols: 9 };
};

const mensuel = () =>
  withCells(
    layout(
      table(
        [{ name: 'Mois', width: 90 }, { name: 'Ventes', fmt: 'eur', width: 110 }, { name: 'Cumul', fmt: 'eur', width: 110 }, { name: 'Indice (base 100 janvier)', width: 180 }],
        [['Janvier', 15200], ['Février', 16850], ['Mars', 17950], ['Avril', 17400], ['Mai', 18950], ['Juin', 21300], ['Juillet', 19800], ['Août', 12100], ['Septembre', 18200], ['Octobre', 19050], ['Novembre', 22400], ['Décembre', 27900]],
      ),
    ),
    { C2: '=B2' },
  );

export const m2: Module = {
  id: 2,
  title: 'Références relatives et absolues',
  short: 'Le $',
  functions: ['FILL', 'ABS_REF'],
  lesson: [
    {
      title: 'Recopier une formule',
      body: [
        'Tu as écrit `=B2*C2` en D2 et tu veux la même chose pour 100 lignes ? Pas question de tout retaper.',
        'Sélectionne D2 et fais glisser la **poignée de recopie** (le petit carré vert en bas à droite) vers le bas. Ou double-clique dessus : Excel recopie jusqu’au bout des données.',
        'Autre méthode : sélectionne D2 jusqu’à D101, puis **Cmd + D**.',
      ],
      example: { table: [['', 'D'], ['2', '=B2*C2'], ['3', '=B3*C3'], ['4', '=B4*C4']], caption: 'En recopiant, Excel décale les références d’une ligne à chaque fois.' },
    },
    {
      title: 'Références relatives',
      body: [
        'Pour Excel, `=B2*C2` écrit en D2 veut dire : « la cellule 2 colonnes à gauche × la cellule 1 colonne à gauche, sur ma ligne ».',
        'C’est pour ça que la formule s’adapte quand tu la recopies : c’est une **référence relative**. Le plus souvent, c’est exactement ce qu’on veut.',
      ],
      example: { formula: '=B2*C2', caption: 'Recopiée en D3, elle devient =B3*C3.' },
    },
    {
      title: 'Le piège du taux fixe',
      body: [
        'Le taux de TVA est dans une seule cellule, **G1**. En C2 tu écris `=B2*G1`. Juste !',
        'Mais en recopiant, C3 devient `=B3*G2`… et G2 est vide. Résultat : 0 partout sauf la première ligne.',
        'C’est l’erreur n°1 des tests Excel. Le recruteur clique sur la 2e ligne et voit tout de suite le problème.',
      ],
      example: { table: [['', 'C', 'résultat'], ['2', '=B2*G1', '230 €'], ['3', '=B3*G2', '0 €  ✗']] },
    },
    {
      title: 'Le $ bloque une référence',
      body: [
        'Un **$** devant la lettre bloque la colonne, un $ devant le chiffre bloque la ligne. **$G$1** ne bouge jamais quand tu recopies.',
        'Pour ajouter les $ : mets le curseur sur la référence et appuie sur **Cmd + T** dans Excel pour Mac (ou **F4** / fn + F4). Ici, dans le navigateur, utilise F4 ou le bouton **$**.',
        'Chaque appui fait tourner : `G1` → `$G$1` → `G$1` → `$G1` → `G1`.',
      ],
      example: { formula: '=B2*$G$1', caption: 'Recopiée en C3 : =B3*$G$1. Le taux reste en G1.' },
    },
    {
      title: 'Quand mettre un $ ?',
      body: [
        'Pose-toi la question : « Quand je recopie, cette cellule doit-elle bouger ? » Si non, mets des $.',
        'Typiquement : un taux, un prix unitaire, un total, un paramètre posé à part dans une cellule.',
        'Les $ « mixtes » (`G$1` ou `$A3`) servent quand on recopie à la fois vers le bas et vers la droite, comme dans une grille de prix.',
      ],
      example: { formula: '=$A3*B$2', caption: 'La colonne A et la ligne 2 restent fixes.' },
    },
  ],
  worked: {
    intro: 'On calcule la TVA de 10 produits avec un taux posé en G1.',
    setup: tva,
    steps: [
      { text: 'Le taux de TVA (20 %) est en **G1**. En C2, on écrit `=B2*G1` : la TVA de l’ordinateur.', cell: 'C2', input: '=B2*G1' },
      { text: 'On recopie C2 jusqu’en C11… et c’est faux : à partir de C3, tout est à 0. Clique sur C3 : la formule est devenue `=B3*G2`.', cell: 'C2', input: '=B2*G1', fillTo: 'C11' },
      { text: 'On corrige C2 : curseur sur G1, **F4** (Cmd + T dans Excel). La formule devient `=B2*$G$1`.', cell: 'C2', input: '=B2*$G$1' },
      { text: 'On recopie à nouveau jusqu’en C11 : cette fois, chaque ligne utilise bien G1.', cell: 'C2', input: '=B2*$G$1', fillTo: 'C11' },
    ],
  },
  exercises: [
    {
      id: 'm2-1',
      module: 2,
      kind: 'formula',
      title: 'Recopier vers le bas',
      instruction: 'En **H2**, calcule le montant HT de la commande (quantité × prix unitaire), puis recopie la formule jusqu’en **H41**.',
      notions: ['FILL'],
      setup: commandes40,
      targets: [{ cell: 'H2', fillTo: 'H41', solution: '=F2*G2', fmt: 'eur' }],
      hint1: 'Écris la formule une fois en H2, puis utilise la poignée de recopie (double-clic).',
      hint2: '`=quantité*prix_unitaire` puis double-clic sur le petit carré en bas à droite de H2.',
      mistakes: [{ formulas: ['=$F$2*$G$2'], message: 'Avec des $ partout, chaque ligne recalcule la commande de la ligne 2. Ici, on veut que les références bougent : enlève les $.' }],
    },
    {
      id: 'm2-2',
      module: 2,
      kind: 'formula',
      title: 'Le piège du taux fixe',
      instruction: 'En **C2**, calcule la TVA du premier produit avec le taux en **G1**, puis recopie jusqu’en **C11**.',
      notions: ['ABS_REF', 'FILL'],
      setup: tva,
      targets: [{ cell: 'C2', fillTo: 'C11', solution: '=B2*$G$1', fmt: 'eur' }],
      hint1: 'Le taux doit rester en G1 quand tu recopies : il faut le bloquer.',
      hint2: '`=prix*$G$1` (F4 sur la référence du taux).',
      mistakes: [
        { formulas: ['=B2*G1'], message: 'Tu as oublié le `$` : en recopiant, G1 devient G2, G3… qui sont vides. Bloque le taux : `$G$1`.' },
        { formulas: ['=B2*$G1'], message: 'Tu as oublié le `$` devant la **ligne** du taux : `$G1` bloque la colonne mais la ligne descend quand tu recopies. Écris `$G$1` ou `G$1`.' },
      ],
    },
    {
      id: 'm2-3',
      module: 2,
      kind: 'formula',
      title: 'Prix TTC avec le taux',
      instruction: 'En **D2**, calcule le prix TTC avec le taux de G1, puis recopie jusqu’en **D11**.',
      notions: ['ABS_REF', 'PCT'],
      setup: tva,
      targets: [{ cell: 'D2', fillTo: 'D11', solution: '=B2*(1+$G$1)', fmt: 'eur' }],
      hint1: 'TTC = HT × (1 + taux), et le taux doit rester bloqué.',
      hint2: '`=prix*(1+$G$1)`',
      mistakes: [
        { formulas: ['=B2*(1+G1)'], message: 'Il manque le `$` sur le taux : à partir de la ligne 3, la formule pointe vers une cellule vide.' },
        { formulas: ['=B2+$G$1'], message: '`+$G$1` ajoute 0,2 €. Il faut multiplier : `*(1+$G$1)`.' },
      ],
    },
    {
      id: 'm2-4',
      module: 2,
      kind: 'formula',
      title: 'Conversion en dollars',
      instruction: 'En **C2**, convertis le prix en dollars avec le cours de **F1**, puis recopie jusqu’en **C9**.',
      notions: ['ABS_REF'],
      setup: devises,
      targets: [{ cell: 'C2', fillTo: 'C9', solution: '=B2*$F$1', fmt: 'dec2' }],
      hint1: 'Prix en $ = prix en € × cours. Le cours ne doit pas bouger.',
      hint2: '`=prix_euros*$F$1`',
      mistakes: [{ formulas: ['=B2*F1'], message: 'Sans `$`, le cours F1 devient F2, F3… en recopiant. Bloque-le avec F4.' }],
    },
    {
      id: 'm2-5',
      module: 2,
      kind: 'formula',
      title: 'Part de chaque magasin',
      instruction: 'En **C2**, calcule la part de Lyon dans le total (B8), puis recopie jusqu’en **C7**.',
      notions: ['ABS_REF', 'PCT'],
      setup: parts,
      targets: [{ cell: 'C2', fillTo: 'C7', solution: '=B2/$B$8', fmt: 'pct' }],
      hint1: 'Part = CA du magasin / total. Le total est toujours en B8.',
      hint2: '`=CA/$B$8`',
      mistakes: [{ formulas: ['=B2/B8'], message: 'Le total doit rester en B8 : en recopiant sans `$`, tu divises par B9, B10… (vides) et tu obtiens #DIV/0!.' }],
    },
    {
      id: 'm2-6',
      module: 2,
      kind: 'formula',
      title: 'Rémunération variable',
      instruction: 'En **C2**, calcule la rémunération variable : CA × taux de commission (F1) + prime fixe (F2). Recopie jusqu’en **C7**.',
      notions: ['ABS_REF'],
      setup: commissions,
      targets: [{ cell: 'C2', fillTo: 'C7', solution: '=B2*$F$1+$F$2', fmt: 'eur' }],
      hint1: 'Deux paramètres fixes : le taux et la prime. Les deux ont besoin de $.',
      hint2: '`=CA*$F$1+$F$2`',
      mistakes: [
        { formulas: ['=B2*$F$1+F2'], message: 'Le taux est bien bloqué, mais pas la prime fixe : F2 devient F3, F4… en recopiant.' },
        { formulas: ['=B2*F1+$F$2'], message: 'La prime est bloquée, mais pas le taux : F1 devient F2 (la prime !) à la ligne suivante.' },
      ],
    },
    {
      id: 'm2-7',
      module: 2,
      kind: 'formula',
      title: 'Cumul des ventes',
      instruction: 'C2 contient déjà les ventes de janvier. En **C3**, calcule le cumul (cumul du mois précédent + ventes du mois), puis recopie jusqu’en **C13**.',
      notions: ['FILL'],
      setup: mensuel,
      targets: [{ cell: 'C3', fillTo: 'C13', solution: '=C2+B3', fmt: 'eur' }],
      hint1: 'Le cumul de mars = cumul de février + ventes de mars. Tout est relatif ici.',
      hint2: '`=cumul_au_dessus+ventes_du_mois`',
      mistakes: [{ formulas: ['=$C$2+B3'], message: 'Avec `$C$2`, tu ajoutes toujours le cumul de janvier. Ici, la cellule du dessus doit bouger : pas de $.' }],
    },
    {
      id: 'm2-8',
      module: 2,
      kind: 'formula',
      title: 'Indice base 100',
      instruction: 'En **D2**, calcule l’indice des ventes base 100 en janvier (ventes du mois / ventes de janvier × 100), puis recopie jusqu’en **D13**.',
      notions: ['ABS_REF'],
      setup: mensuel,
      targets: [{ cell: 'D2', fillTo: 'D13', solution: '=B2/$B$2*100' }],
      hint1: 'Janvier (B2) est la référence fixe.',
      hint2: '`=ventes/$B$2*100`',
      mistakes: [{ formulas: ['=B2/B2*100'], message: 'Sans `$`, chaque mois est divisé par lui-même (toujours 100). Bloque janvier : `$B$2`.' }],
    },
    {
      id: 'm2-9',
      module: 2,
      kind: 'formula',
      title: 'Grille de prix (références mixtes)',
      instruction: 'En **B3**, calcule le prix total : prix unitaire (B1) × quantité (colonne A) × (1 − remise de la ligne 2). Recopie sur toute la grille **B3:F8**.',
      notions: ['ABS_REF'],
      setup: grille,
      minutes: 5,
      targets: [{ cell: 'B3', fillTo: 'F8', solution: '=$B$1*$A3*(1-B$2)', fmt: 'eur' }],
      hint1: 'La quantité est toujours en colonne A, la remise toujours en ligne 2, le prix toujours en B1.',
      hint2: '`=$B$1*$A3*(1-B$2)` : recopie d’abord vers la droite (B3:F3), puis sélectionne B3:F3 et recopie vers le bas.',
      mistakes: [
        { formulas: ['=$B$1*A3*(1-B2)'], message: 'Sans $ mixtes, la quantité et la remise glissent quand tu recopies. Bloque la colonne A (`$A3`) et la ligne 2 (`B$2`).' },
        { formulas: ['=$B$1*$A3*(1-B2)'], message: 'La quantité est bien bloquée sur la colonne A. Mais la remise doit rester en ligne 2 : écris `B$2`.' },
      ],
    },
  ],
};

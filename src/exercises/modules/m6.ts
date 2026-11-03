import { besides, clientsTable, commandes, contrats, layout, MAGASINS, MOIS, table, ventesMagasins, withCells } from '../../data/datasets';
import { Module } from '../types';

const N = 60;
/** Un client qui existe vraiment dans le portefeuille (graine fixe). */
const CIBLE = contrats(150, 7).rows[40][1] as string;
const L = N + 1;
const CL = '$J$2:$M$17'; // table clients complète (16 clients)
const withClients = (extra: string, exclude: string[] = []) => () =>
  besides(layout(commandes(N, 21), { extraCols: [{ name: extra, width: 120 }] }), clientsTable(5, exclude), 9);

const catalogue = () =>
  besides(
    layout(commandes(N, 33), { extraCols: [{ name: 'Montant catalogue', fmt: 'eur', width: 140 }] }),
    table(
      [{ name: 'Produit', width: 150 }, { name: 'Prix catalogue', fmt: 'eur', width: 110 }],
      [['Ordinateur portable', 1099], ['Écran 27 pouces', 299], ['Licence logicielle', 450], ['Imprimante', 245], ['Serveur', 3990], ['Casque audio', 89]],
    ),
    9,
  );

/** Matrice CA par magasin (lignes) × mois (colonnes) */
const matrice = () => {
  const d = ventesMagasins(2024);
  const sum: Record<string, number> = {};
  for (const r of d.rows) sum[`${r[0]}|${r[1]}`] = (sum[`${r[0]}|${r[1]}`] ?? 0) + (r[3] as number);
  const rows = MAGASINS.map((m) => [m, ...MOIS.map((mo) => sum[`${m}|${mo}`])]);
  return withCells(
    layout(table([{ name: 'Magasin', width: 100 }, ...MOIS.map((m) => ({ name: m, fmt: 'eur' as const, width: 105 }))], rows)),
    { I1: 'Magasin', J1: 'Bordeaux', I2: 'Mois', J2: 'Avril', I3: 'CA' },
    { J3: 'eur' },
    { 8: 80, 9: 120 },
  );
};

const bareme = () =>
  besides(
    layout(table([{ name: 'Commercial', width: 100 }, { name: 'CA signé', fmt: 'eur', width: 120 }, { name: 'Taux de commission', fmt: 'pct', width: 150 }], [['Alice', 182000], ['Karim', 34500], ['Sophie', 221300], ['Yanis', 98700], ['Marion', 60250], ['Hugo', 143800], ['Léa', 12000]])),
    table([{ name: 'CA à partir de', fmt: 'eur', width: 120 }, { name: 'Taux', fmt: 'pct', width: 70 }], [[0, '1%'], [50000, '2%'], [100000, '3%'], [150000, '4%'], [200000, '5%']]),
    4,
  );

export const m6: Module = {
  id: 6,
  title: 'Rechercher une valeur',
  short: 'RECHERCHEV',
  functions: ['VLOOKUP', 'INDEX', 'MATCH', 'XLOOKUP'],
  lesson: [
    {
      title: '{{VLOOKUP}} : aller chercher une info',
      body: [
        'Tu as le nom du client dans tes commandes, et son segment est dans une autre table. {{VLOOKUP}} va le chercher pour toi.',
        'Structure : {{=VLOOKUP(valeur_cherchée,table,n°_colonne,FALSE)}}.',
        'Excel cherche la valeur dans la **1re colonne** de la table, puis renvoie ce qu’il y a dans la colonne n° 2, 3… de la même ligne.',
      ],
      example: { formula: '=VLOOKUP(C2,$J$2:$M$17,2,FALSE)', caption: 'Cherche le client de C2 dans la colonne J et renvoie la 2e colonne (le segment).' },
    },
    {
      title: 'Pourquoi {{FALSE}} à la fin ?',
      body: [
        '{{FALSE}} (ou 0) = correspondance **exacte**. Sans lui, Excel fait une recherche **approchée** : sur une table non triée, il renvoie une valeur voisine, fausse, sans aucun message d’erreur.',
        'C’est le piège le plus vicieux des tests : le résultat a l’air normal. Mets toujours {{FALSE}}, sauf pour un barème par tranches.',
        'Et bloque la table avec `$` : sinon elle glisse quand tu recopies, et les derniers clients donnent #N/A.',
      ],
      example: { table: [['Formule', 'Résultat'], ['…;2;FAUX)', 'le bon segment'], ['…;2)', 'parfois un autre segment !']] },
    },
    {
      title: '#N/A et {{IFERROR}}',
      body: [
        '#N/A veut dire : « je n’ai pas trouvé ». Le client n’est pas dans la table, ou il est écrit différemment (espace en trop, faute de frappe).',
        'Pour afficher un message à la place : {{=IFERROR(VLOOKUP(C2,$J$2:$M$15,2,FALSE),"Inconnu")}}.',
      ],
      example: { formula: '=IFERROR(VLOOKUP(C2,$J$2:$M$15,2,FALSE),"Inconnu")' },
    },
    {
      title: '{{INDEX}} + {{MATCH}}',
      body: [
        '{{VLOOKUP}} ne sait chercher que vers la **droite**. Pour chercher à gauche, on combine deux fonctions.',
        '{{=MATCH(valeur,plage,0)}} donne la **position** de la valeur (3e ligne, par ex.). {{=INDEX(plage,n°)}} renvoie l’élément à cette position.',
        'Ensemble : {{=INDEX(A2:A151,MATCH(J1,B2:B151,0))}} = « le N° de contrat (colonne A) du client écrit en J1 (cherché en colonne B) ».',
      ],
      example: { formula: '=INDEX(A2:A151,MATCH(J1,B2:B151,0))' },
    },
    {
      title: '{{XLOOKUP}}, la version moderne',
      body: [
        '{{=XLOOKUP(valeur,plage_cherchée,plage_renvoyée,"si_absent")}} : plus simple, cherche dans tous les sens, exacte par défaut.',
        'Elle existe dans Excel pour Mac 2021 et Microsoft 365, **pas** dans Excel 2019 ou avant. En entretien, sache faire les deux : beaucoup d’entreprises attendent encore RECHERCHEV.',
      ],
      example: { formula: '=XLOOKUP(C2,$J$2:$J$17,$K$2:$K$17,"Inconnu")' },
    },
  ],
  worked: {
    intro: 'Les commandes (à gauche) ne disent pas à quel segment appartient chaque client. La fiche clients (à droite, J:M) le dit.',
    setup: withClients('Segment'),
    steps: [
      { text: 'Le client de la ligne 2 est en **C2**. On le cherche dans la 1re colonne de la fiche clients, **J2:M17**.' },
      { text: 'Le segment est la **2e** colonne de la fiche. On termine par FAUX pour une correspondance exacte, et on bloque la table avec F4.', cell: 'H2', input: `=VLOOKUP(C2,${CL},2,FALSE)` },
      { text: 'On recopie jusqu’en H61 : chaque commande récupère le segment de son client.', cell: 'H2', input: `=VLOOKUP(C2,${CL},2,FALSE)`, fillTo: `H${L}` },
    ],
  },
  exercises: [
    {
      id: 'm6-1',
      module: 6,
      kind: 'formula',
      title: 'Le segment du client',
      instruction: 'En **H2**, va chercher le segment du client (fiche clients en J:M), puis recopie jusqu’en **H61**.',
      notions: ['VLOOKUP', 'ABS_REF'],
      setup: withClients('Segment'),
      targets: [{ cell: 'H2', fillTo: `H${L}`, solution: `=VLOOKUP(C2,${CL},2,FALSE)` }],
      requiredFunctions: ['VLOOKUP'],
      hint2: '{{=VLOOKUP(client,$J$2:$M$17,2,FALSE)}}',
      mistakes: [
        { formulas: [`=VLOOKUP(C2,${CL},2)`], message: '{{VLOOKUP}} sans {{FALSE}} renvoie une valeur **approchée** : comme la fiche clients n’est pas triée, certains segments sont faux. Ajoute FAUX en dernier argument.' },
        { formulas: ['=VLOOKUP(C2,J2:M17,2,FALSE)'], message: 'Ta table n’est pas bloquée : en recopiant, J2:M17 devient J3:M18, J4:M19… et les premiers clients disparaissent (d’où les #N/A). Écris `$J$2:$M$17`.' },
      ],
    },
    {
      id: 'm6-2',
      module: 6,
      kind: 'formula',
      title: 'Le commercial attitré',
      instruction: 'En **H2**, affiche le commercial attitré du client, puis recopie jusqu’en **H61**.',
      notions: ['VLOOKUP'],
      setup: withClients('Commercial'),
      targets: [{ cell: 'H2', fillTo: `H${L}`, solution: `=VLOOKUP(C2,${CL},3,FALSE)` }],
      requiredFunctions: ['VLOOKUP'],
      hint1: '{{VLOOKUP}} : compte bien les colonnes de la fiche (J = 1).',
      hint2: '{{=VLOOKUP(client,$J$2:$M$17,n°_colonne,FALSE)}} : Client = 1, Segment = 2, Commercial = 3.',
      mistakes: [{ formulas: [`=VLOOKUP(C2,${CL},2,FALSE)`], message: 'Tu renvoies la colonne 2 (le segment). Le commercial est dans la **3e** colonne de la fiche.' }],
    },
    {
      id: 'm6-3',
      module: 6,
      kind: 'formula',
      title: 'Montant au prix catalogue',
      instruction: 'En **H2**, calcule le montant de la commande au **prix catalogue** : quantité × prix trouvé dans le catalogue (J:K). Recopie jusqu’en **H61**.',
      notions: ['VLOOKUP', 'ABS_REF'],
      setup: catalogue,
      targets: [{ cell: 'H2', fillTo: `H${L}`, solution: '=F2*VLOOKUP(E2,$J$2:$K$7,2,FALSE)', fmt: 'eur' }],
      requiredFunctions: ['VLOOKUP'],
      hint2: '{{=quantité*VLOOKUP(produit,$J$2:$K$7,2,FALSE)}}',
      mistakes: [{ formulas: ['=F2*G2'], message: 'Tu as utilisé le prix unitaire de la commande (colonne G). On veut le prix **catalogue**, à chercher dans la table J:K avec {{VLOOKUP}}.' }],
    },
    {
      id: 'm6-4',
      module: 6,
      kind: 'formula',
      title: 'Client inconnu',
      instruction: 'Deux clients manquent dans la fiche. En **H2**, affiche le segment du client, ou « Inconnu » s’il n’est pas trouvé. Recopie jusqu’en **H61**.',
      notions: ['VLOOKUP', 'IFERROR'],
      setup: withClients('Segment', ['Logivia', 'Novamed']),
      targets: [{ cell: 'H2', fillTo: `H${L}`, solution: '=IFERROR(VLOOKUP(C2,$J$2:$M$15,2,FALSE),"Inconnu")' }],
      requiredFunctions: ['VLOOKUP', 'IFERROR'],
      hint1: '{{VLOOKUP}} entouré de {{IFERROR}}. La fiche fait maintenant 14 clients (J2:M15).',
      hint2: '{{=IFERROR(VLOOKUP(client,$J$2:$M$15,2,FALSE),"Inconnu")}}',
      mistakes: [{ formulas: ['=VLOOKUP(C2,$J$2:$M$15,2,FALSE)'], message: 'Les clients absents de la fiche donnent #N/A. Entoure ta recherche avec {{IFERROR}} pour afficher « Inconnu ».' }],
    },
    {
      id: 'm6-5',
      module: 6,
      kind: 'formula',
      title: 'Position avec EQUIV',
      instruction: 'En **J2**, donne la **position** du mois écrit en J1 dans la liste des mois (B1:G1).',
      notions: ['MATCH'],
      setup: () => withCells(matrice(), { I1: '', J1: 'Avril', I2: '', J2: '', I3: '' }, {}, {}),
      targets: [{ cell: 'J2', solution: '=MATCH(J1,B1:G1,0)' }],
      requiredFunctions: ['MATCH'],
      hint2: '{{=MATCH(valeur,plage,0)}} (0 = correspondance exacte)',
      mistakes: [{ formulas: ['=MATCH(J1,A1:G1,0)'], message: 'Ta plage commence en A1 (la case « Magasin ») : la position est décalée de 1. Prends seulement les mois, B1:G1.' }],
    },
    {
      id: 'm6-6',
      module: 6,
      kind: 'formula',
      title: 'Chercher à gauche : INDEX + EQUIV',
      instruction: `En **J1**, retrouve le **N° de contrat** du client écrit en J2 (${CIBLE}). Le nom est en colonne B, le N° en colonne A (à gauche) : RECHERCHEV ne peut pas le faire.`,
      notions: ['INDEX', 'MATCH'],
      setup: () => withCells(layout(contrats(150, 7)), { I1: 'N° du contrat', I2: 'Client cherché', J2: CIBLE }, {}, { 8: 120, 9: 120 }),
      targets: [{ cell: 'J1', solution: '=INDEX(A2:A151,MATCH(J2,B2:B151,0))' }],
      requiredFunctions: ['INDEX', 'MATCH'],
      hint1: '{{MATCH}} trouve la ligne du client, {{INDEX}} renvoie le N° sur cette ligne.',
      hint2: '{{=INDEX(plage_numéros,MATCH(client,plage_clients,0))}}',
      mistakes: [{ formulas: ['=INDEX(A1:A151,MATCH(J2,B2:B151,0))'], message: 'Tes deux plages ne commencent pas à la même ligne (A1 et B2) : tu obtiens le N° du contrat juste au-dessus. Prends A2:A151.' }],
    },
    {
      id: 'm6-7',
      module: 6,
      kind: 'formula',
      title: 'Croiser ligne et colonne',
      instruction: 'En **J3**, affiche le CA du magasin écrit en J1 pour le mois écrit en J2, avec {{INDEX}} et deux {{MATCH}}.',
      notions: ['INDEX', 'MATCH'],
      minutes: 5,
      setup: matrice,
      targets: [{ cell: 'J3', solution: '=INDEX(B2:G7,MATCH(J1,A2:A7,0),MATCH(J2,B1:G1,0))', fmt: 'eur' }],
      requiredFunctions: ['INDEX', 'MATCH'],
      hint1: '{{INDEX}} accepte un n° de ligne **et** un n° de colonne.',
      hint2: '{{=INDEX(tableau_des_CA,MATCH(magasin,liste_magasins,0),MATCH(mois,liste_mois,0))}}',
      mistakes: [{ formulas: ['=INDEX(B2:G7,MATCH(J2,B1:G1,0),MATCH(J1,A2:A7,0))'], message: 'Tu as inversé ligne et colonne : dans {{INDEX}}, le 2e argument est la **ligne** (le magasin), le 3e la **colonne** (le mois).' }],
    },
    {
      id: 'm6-8',
      module: 6,
      kind: 'formula',
      title: 'RECHERCHEX',
      instruction: 'Avec {{XLOOKUP}}, affiche en **H2** la ville du client (fiche J:M), ou « Inconnu » s’il n’y est pas. Recopie jusqu’en **H61**.',
      notions: ['XLOOKUP'],
      setup: withClients('Ville', ['Logivia', 'Novamed']),
      targets: [{ cell: 'H2', fillTo: `H${L}`, solution: '=XLOOKUP(C2,$J$2:$J$15,$M$2:$M$15,"Inconnu")' }],
      requiredFunctions: ['XLOOKUP'],
      hint2: '{{=XLOOKUP(client,$J$2:$J$15,$M$2:$M$15,"Inconnu")}}',
      after: 'Dans le vrai Excel, RECHERCHEX n’existe que depuis Excel 2021 / Microsoft 365. Si ton Excel ne la propose pas quand tu tapes `=RECHERCHEX`, utilise RECHERCHEV.',
      mistakes: [{ formulas: ['=XLOOKUP(C2,$J$2:$J$15,$M$2:$M$15)'], message: 'Les clients absents donnent #N/A : ajoute un 4e argument, `"Inconnu"`, ce qu’on affiche si rien n’est trouvé.' }],
    },
    {
      id: 'm6-9',
      module: 6,
      kind: 'formula',
      title: 'Barème par tranches (le seul cas pour VRAI)',
      instruction: 'En **C2**, trouve le taux de commission du commercial selon le barème (E:F, trié par CA croissant), puis recopie jusqu’en **C8**. Ici, la recherche doit être **approchée**.',
      notions: ['VLOOKUP'],
      minutes: 5,
      setup: bareme,
      targets: [{ cell: 'C2', fillTo: 'C8', solution: '=VLOOKUP(B2,$E$2:$F$6,2,TRUE)', fmt: 'pct' }],
      requiredFunctions: ['VLOOKUP'],
      hint1: '{{VLOOKUP}} avec {{TRUE}} : Excel prend la dernière tranche inférieure ou égale au CA.',
      hint2: '{{=VLOOKUP(CA,$E$2:$F$6,2,TRUE)}}',
      after: 'Avec VRAI, Excel s’arrête sur la plus grande valeur ≤ au CA : 182 000 € tombe dans la tranche « à partir de 150 000 ». Ça ne marche que si la table est **triée par ordre croissant**.',
      mistakes: [{ formulas: ['=VLOOKUP(B2,$E$2:$F$6,2,FALSE)'], message: 'Avec FAUX, Excel cherche exactement 182 000 € dans le barème et ne le trouve pas (#N/A). Pour des tranches, il faut une recherche approchée : VRAI.' }],
    },
  ],
};

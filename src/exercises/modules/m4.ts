import { contrats, layout, pipeline, table, withCells } from '../../data/datasets';
import { Module } from '../types';

const NC = 150;
const LC = NC + 1;
const NP = 80;
const LP = NP + 1;
const ctr = (extra: string, fmt?: 'eur' | 'pct') => () => layout(contrats(NC, 7), { extraCols: [{ name: extra, fmt, width: 120 }] });
const pip = (extra: string, fmt?: 'eur' | 'pct') => () => layout(pipeline(NP, 99), { extraCols: [{ name: extra, fmt, width: 130 }] });

const conversion = () =>
  layout(
    table(
      [{ name: 'Commercial', width: 100 }, { name: 'Propositions', width: 100 }, { name: 'Signées', width: 80 }, { name: 'Taux de signature', fmt: 'pct', width: 140 }],
      [['Alice', 24, 9], ['Karim', 18, 5], ['Sophie', 0, 0], ['Yanis', 31, 12], ['Marion', 12, 7], ['Hugo', 0, 0], ['Léa', 20, 4]],
    ),
  );

export const m4: Module = {
  id: 4,
  title: 'Conditions',
  short: 'SI',
  functions: ['IF', 'AND', 'OR', 'IFERROR'],
  lesson: [
    {
      title: '{{IF}} : faire un choix',
      body: [
        '{{IF}} pose une question et renvoie une chose si la réponse est oui, une autre si c’est non.',
        'Structure : {{=IF(test,valeur_si_vrai,valeur_si_faux)}}.',
        'Le test compare deux choses : `>` `<` `>=` `<=` `=` et `<>` (différent de).',
      ],
      example: { formula: '=IF(D2>=1000,"Gros contrat","Standard")', caption: 'Si la prime en D2 est d’au moins 1 000 €, on affiche « Gros contrat ».' },
    },
    {
      title: 'Du texte ou un calcul',
      body: [
        'Un texte se met **entre guillemets** : `"Oui"`. Sans guillemets, Excel cherche un nom qu’il ne connaît pas et affiche #NOM?.',
        'Les valeurs peuvent être des calculs : {{=IF(D2="Gagné",E2*5%,0)}} donne une prime de 5 % seulement pour les affaires gagnées.',
        'Pour laisser la cellule vide : `""` (deux guillemets collés).',
      ],
      example: { formula: '=IF(G2="Résilié",0,D2)' },
    },
    {
      title: '{{AND}} et {{OR}}',
      body: [
        '{{AND}} est vrai si **toutes** les conditions sont vraies. {{OR}} est vrai si **au moins une** l’est.',
        'On les met dans le test du SI : {{=IF(AND(C2="Auto",D2>800),"Éligible","")}}.',
        'Piège : « Santé ou Prévoyance » s’écrit {{=OR(C2="Santé",C2="Prévoyance")}}. On répète la cellule à chaque fois.',
      ],
      example: { table: [['Type', 'Prime', 'ET(Auto ; >800)', 'OU(Auto ; >800)'], ['Auto', '900', 'VRAI', 'VRAI'], ['Santé', '900', 'FAUX', 'VRAI'], ['Santé', '500', 'FAUX', 'FAUX']] },
    },
    {
      title: 'Des SI imbriqués',
      body: [
        'Pour 3 cas ou plus, on met un SI dans le « sinon » du premier.',
        '{{=IF(E2>=100000,"Grand",IF(E2>=30000,"Moyen","Petit"))}}',
        'L’ordre compte : teste d’abord le seuil le plus haut. Sinon, 150 000 € serait classé « Moyen » parce qu’il est aussi ≥ 30 000.',
      ],
      example: { table: [['Montant', 'Résultat'], ['150 000', 'Grand'], ['45 000', 'Moyen'], ['8 000', 'Petit']] },
    },
    {
      title: '{{IFERROR}} : remplacer une erreur',
      body: [
        '{{=IFERROR(calcul,valeur_si_erreur)}} affiche le calcul, ou une valeur de secours s’il y a une erreur.',
        'Exemple : un taux de signature avec 0 proposition donne #DIV/0!. Avec {{=IFERROR(C2/B2,0)}}, on affiche 0 %.',
        'Utilise-le quand l’erreur est normale (pas de donnée), pas pour cacher une formule fausse.',
      ],
      example: { formula: '=IFERROR(C2/B2,0)' },
    },
  ],
  worked: {
    intro: 'Dans le portefeuille de contrats, on repère les gros contrats (prime d’au moins 1 000 €).',
    setup: ctr('Catégorie'),
    steps: [
      { text: 'La prime est en colonne D. En **H2**, on écrit le test `D2>=1000`, puis ce qu’on affiche si c’est vrai, puis si c’est faux.', cell: 'H2', input: '=IF(D2>=1000,"Gros contrat","Standard")' },
      { text: 'On recopie jusqu’en H151 (double-clic sur la poignée). Chaque ligne teste sa propre prime.', cell: 'H2', input: '=IF(D2>=1000,"Gros contrat","Standard")', fillTo: `H${LC}` },
      { text: 'Clique sur H3 : la formule est devenue `D3>=1000`. Les guillemets autour des textes sont obligatoires.' },
    ],
  },
  exercises: [
    {
      id: 'm4-1',
      module: 4,
      kind: 'formula',
      title: 'Gros contrat ou pas',
      instruction: 'En **H2**, affiche « Oui » si la prime est d’au moins 1 000 €, sinon « Non ». Recopie jusqu’en **H151**.',
      notions: ['IF'],
      setup: ctr('Gros contrat'),
      targets: [{ cell: 'H2', fillTo: `H${LC}`, solution: '=IF(D2>=1000,"Oui","Non")' }],
      requiredFunctions: ['IF'],
      hint2: '{{=IF(prime>=1000,"Oui","Non")}}',
      mistakes: [
        { formulas: ['=IF(D2>=1000,"Non","Oui")'], message: 'Tu as inversé : la 2e valeur est affichée quand le test est **vrai**, la 3e quand il est faux.' },
        { formulas: ['=IF(D2>=1000,Oui,Non)'], message: 'Les textes doivent être **entre guillemets** : `"Oui"`. Sinon Excel affiche #NOM?.' },
      ],
    },
    {
      id: 'm4-2',
      module: 4,
      kind: 'formula',
      title: 'Prime sur affaires gagnées',
      instruction: 'En **H2**, calcule une prime de 5 % du montant si l’opportunité est « Gagné », sinon 0. Recopie jusqu’en **H81**.',
      notions: ['IF', 'PCT'],
      setup: pip('Prime', 'eur'),
      targets: [{ cell: 'H2', fillTo: `H${LP}`, solution: '=IF(D2="Gagné",E2*5%,0)', fmt: 'eur' }],
      requiredFunctions: ['IF'],
      hint2: '{{=IF(étape="Gagné",montant*5%,0)}}',
      mistakes: [
        { formulas: ['=IF(D2="Gagné",E2*5%)'], message: 'Sans 3e argument, {{IF}} affiche {{FALSE}} quand le test est faux. Ajoute `0` comme valeur si faux.' },
        { formulas: ['=IF(D2="Gagne",E2*5%,0)'], message: 'Le texte doit être écrit exactement comme dans le tableau : « Gagné » avec l’accent.' },
      ],
    },
    {
      id: 'm4-3',
      module: 4,
      kind: 'formula',
      title: 'Prime nette des résiliés',
      instruction: 'En **H2**, affiche la prime si le contrat est actif, et 0 s’il est « Résilié ». Recopie jusqu’en **H151**.',
      notions: ['IF'],
      setup: ctr('Prime active', 'eur'),
      targets: [{ cell: 'H2', fillTo: `H${LC}`, solution: '=IF(G2="Résilié",0,D2)', fmt: 'eur' }],
      requiredFunctions: ['IF'],
      hint2: '{{=IF(statut="Résilié",0,prime)}}',
      mistakes: [{ formulas: ['=IF(G2="Résilié",D2,0)'], message: 'C’est l’inverse : un contrat **résilié** ne rapporte plus rien, donc 0.' }],
    },
    {
      id: 'm4-4',
      module: 4,
      kind: 'formula',
      title: 'Deux conditions avec ET',
      instruction: 'En **H2**, affiche « Éligible » si le contrat est de type « Auto » **et** que la prime dépasse 800 € (strictement), sinon laisse vide (""). Recopie jusqu’en **H151**.',
      notions: ['AND', 'IF'],
      setup: ctr('Offre fidélité'),
      targets: [{ cell: 'H2', fillTo: `H${LC}`, solution: '=IF(AND(C2="Auto",D2>800),"Éligible","")' }],
      requiredFunctions: ['IF', 'AND'],
      hint2: '{{=IF(AND(condition1,condition2),"Éligible","")}}',
      mistakes: [{ formulas: ['=IF(OR(C2="Auto",D2>800),"Éligible","")'], message: 'Avec {{OR}}, une seule condition suffit. Ici les **deux** doivent être vraies : {{AND}}.' }],
    },
    {
      id: 'm4-5',
      module: 4,
      kind: 'formula',
      title: 'Une condition parmi deux avec OU',
      instruction: 'En **H2**, affiche « Oui » si le contrat est de type « Santé » **ou** « Prévoyance », sinon « Non ». Recopie jusqu’en **H151**.',
      notions: ['OR', 'IF'],
      setup: ctr('Pôle santé'),
      targets: [{ cell: 'H2', fillTo: `H${LC}`, solution: '=IF(OR(C2="Santé",C2="Prévoyance"),"Oui","Non")' }],
      requiredFunctions: ['IF', 'OR'],
      hint2: '{{=IF(OR(type="Santé",type="Prévoyance"),"Oui","Non")}}',
      mistakes: [{ formulas: ['=IF(AND(C2="Santé",C2="Prévoyance"),"Oui","Non")'], message: 'Avec {{AND}}, il faudrait que le type soit Santé et Prévoyance à la fois : impossible, donc toujours « Non ». Utilise {{OR}}.' }],
    },
    {
      id: 'm4-6',
      module: 4,
      kind: 'formula',
      title: 'Trois catégories',
      instruction: 'En **H2**, classe l’opportunité : « Grand » si le montant est ≥ 100 000 €, « Moyen » s’il est ≥ 30 000 €, sinon « Petit ». Recopie jusqu’en **H81**.',
      notions: ['IF'],
      setup: pip('Taille'),
      targets: [{ cell: 'H2', fillTo: `H${LP}`, solution: '=IF(E2>=100000,"Grand",IF(E2>=30000,"Moyen","Petit"))' }],
      requiredFunctions: ['IF'],
      hint1: 'Deux {{IF}} l’un dans l’autre.',
      hint2: '{{=IF(montant>=100000,"Grand",IF(montant>=30000,"Moyen","Petit"))}}',
      mistakes: [
        { formulas: ['=IF(E2>=30000,"Moyen",IF(E2>=100000,"Grand","Petit"))'], message: 'L’ordre des tests est inversé : un montant de 150 000 € est aussi ≥ 30 000, il est donc classé « Moyen ». Teste d’abord le seuil le plus haut.' },
        { formulas: ['=IF(E2>100000,"Grand",IF(E2>30000,"Moyen","Petit"))'], message: '« Au moins 100 000 » s’écrit `>=` : avec `>`, un montant pile de 100 000 € n’est pas classé « Grand ».' },
      ],
    },
    {
      id: 'm4-7',
      module: 4,
      kind: 'formula',
      title: 'Éviter le #DIV/0!',
      instruction: 'En **D2**, calcule le taux de signature (signées / propositions). Si le calcul est impossible, affiche 0. Recopie jusqu’en **D8**.',
      notions: ['IFERROR'],
      setup: conversion,
      targets: [{ cell: 'D2', fillTo: 'D8', solution: '=IFERROR(C2/B2,0)', fmt: 'pct' }],
      requiredFunctions: ['IFERROR'],
      hint2: '{{=IFERROR(signées/propositions,0)}}',
      mistakes: [
        { formulas: ['=C2/B2'], message: 'Sophie et Hugo n’ont fait aucune proposition : la division par 0 donne #DIV/0!. Entoure ton calcul avec {{IFERROR}}.' },
        { formulas: ['=IFERROR(B2/C2,0)'], message: 'C’est à l’envers : le taux, c’est **signées / propositions**.' },
      ],
    },
    {
      id: 'm4-8',
      module: 4,
      kind: 'formula',
      title: 'Opportunités en retard',
      instruction: 'La date du jour est en **J1**. En **H2**, affiche « En retard » si la date de clôture prévue est passée **et** que l’opportunité n’est ni « Gagné » ni « Perdu », sinon « OK ». Recopie jusqu’en **H81**.',
      notions: ['IF', 'AND', 'ABS_REF'],
      minutes: 5,
      setup: () => withCells(pip('Alerte')(), { I1: 'Date du jour', J1: '01/03/2026' }, { J1: 'date' }, { 8: 100, 9: 100 }),
      targets: [{ cell: 'H2', fillTo: `H${LP}`, solution: '=IF(AND(G2<$J$1,D2<>"Gagné",D2<>"Perdu"),"En retard","OK")' }],
      requiredFunctions: ['IF', 'AND'],
      hint1: '{{IF}} avec {{AND}} et trois conditions. La date du jour doit rester fixe.',
      hint2: '{{=IF(AND(clôture<$J$1,étape<>"Gagné",étape<>"Perdu"),"En retard","OK")}}',
      mistakes: [
        { formulas: ['=IF(AND(G2<J1,D2<>"Gagné",D2<>"Perdu"),"En retard","OK")'], message: 'La date du jour (J1) doit être bloquée avec des `$` : en recopiant, J1 devient J2, J3… qui sont vides.' },
        { formulas: ['=IF(G2<$J$1,"En retard","OK")'], message: 'Il manque les conditions sur l’étape : une affaire déjà gagnée ou perdue n’est pas « en retard ».' },
      ],
    },
  ],
};

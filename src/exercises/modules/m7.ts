import { CLIENTS, contrats, Dataset, layout, Value, VILLES, withCells } from '../../data/datasets';
import { rng } from '../../data/random';
import { Module } from '../types';

const NC = 150;
const LC = NC + 1;
const ctr = (extra: string, fmt?: 'date' | 'int') => () => layout(contrats(NC, 7), { extraCols: [{ name: extra, fmt, width: 170 }] });

const CP: Record<string, string> = { Lyon: '69003', Paris: '75011', Lille: '59000', Marseille: '13008', Bordeaux: '33000', Nantes: '44000', Toulouse: '31000', Strasbourg: '67000' };

/** Fiche prospects : noms mal saisis (espaces en trop), codes postaux en texte. */
function prospects(seed = 12): Dataset {
  const r = rng(seed);
  const rows: Value[][] = [];
  for (let i = 0; i < 40; i++) {
    const c = CLIENTS[i % CLIENTS.length];
    const v = r.pick(VILLES);
    const messy = r.next() < 0.5 ? `  ${c.replace(' ', '  ')} ` : c;
    rows.push([messy, v, `'${CP[v]}`, `${r.pick(['Durand', 'Mercier', 'Blanc', 'Faure', 'Roux', 'Morel'])}`, r.pick(['camille', 'hugo', 'léa', 'lucas', 'inès', 'jules'])]);
  }
  return {
    name: 'Prospects',
    columns: [{ name: 'Société (saisie)', width: 170 }, { name: 'Ville', width: 90 }, { name: 'Code postal', width: 90 }, { name: 'Nom contact', width: 100 }, { name: 'Prénom contact', width: 110 }],
    rows,
  };
}
const pros = (extra: string) => () => layout(prospects(), { extraCols: [{ name: extra, width: 180 }] });

export const m7: Module = {
  id: 7,
  title: 'Texte et dates',
  short: 'Texte & dates',
  functions: ['CONCAT', 'LEFT', 'RIGHT', 'UPPER', 'TRIM', 'TODAY', 'YEAR', 'MONTH', 'DATES'],
  lesson: [
    {
      title: 'Coller des textes : & et {{CONCAT}}',
      body: [
        'Le **&** colle deux morceaux : {{=A2&" - "&C2}} donne « CT-20001 - Auto ».',
        '{{=CONCAT(A2," - ",C2)}} fait la même chose. Les espaces et tirets se mettent entre guillemets.',
        'L’ancienne fonction CONCATENER marche aussi, mais CONCAT est la version actuelle.',
      ],
      example: { formula: '=E2&" "&D2', caption: '« camille » et « Durand » → « camille Durand ».' },
    },
    {
      title: '{{LEFT}} et {{RIGHT}}',
      body: [
        '{{=LEFT(texte,nb_caractères)}} garde les premiers caractères, {{=RIGHT(texte,nb_caractères)}} les derniers.',
        'Exemple : le département = les 2 premiers chiffres du code postal : {{=LEFT(C2,2)}}.',
        'Le résultat est du **texte**, même s’il ressemble à un nombre.',
      ],
      example: { table: [['Formule', 'Résultat'], ['=GAUCHE("69003";2)', '69'], ['=DROITE("CT-20001";5)', '20001']] },
    },
    {
      title: '{{UPPER}} et {{TRIM}}',
      body: [
        '{{UPPER}} met tout en majuscules (MINUSCULE et NOMPROPRE existent aussi).',
        '{{TRIM}} supprime les espaces en trop : au début, à la fin, et les doubles espaces au milieu.',
        'Très utile avant une RECHERCHEV : « Nexalis » et « Nexalis » avec un espace à la fin ne sont pas égaux pour Excel → #N/A.',
      ],
      example: { formula: '=TRIM(A2)' },
    },
    {
      title: 'Les dates sont des nombres',
      body: [
        'Pour Excel, le 01/01/2025 est le nombre 45 658 (jours depuis 1900). On peut donc soustraire deux dates : le résultat est un **nombre de jours**.',
        '{{TODAY}} donne la date du jour (elle change chaque jour). {{YEAR}} et {{MONTH}} extraient l’année et le mois d’une date.',
      ],
      example: { table: [['Formule', 'Résultat'], ['=ANNEE("15/03/2025")', '2025'], ['=MOIS("15/03/2025")', '3'], ['="31/12/2025"-"01/12/2025"', '30']] },
    },
    {
      title: 'Ancienneté : {{DATEDIF}}',
      body: [
        '{{=DATEDIF(date_début,date_fin,"Y")}} donne le nombre d’**années complètes** entre deux dates. "M" pour les mois, "D" pour les jours.',
        'DATEDIF ne s’affiche pas dans la liste des suggestions d’Excel, mais elle marche : tape-la en entier.',
        'Si le résultat s’affiche comme une date (« 05/01/1900 »), c’est juste le format : passe la cellule en format Nombre.',
      ],
      example: { formula: '=DATEDIF(E2,TODAY(),"Y")' },
    },
  ],
  worked: {
    intro: 'On fabrique un libellé de contrat et on calcule l’année de souscription.',
    setup: ctr('Libellé'),
    steps: [
      { text: 'En **H2**, on colle le N° de contrat, un tiret et le type, avec le & et le séparateur entre guillemets.', cell: 'H2', input: '=A2&" - "&C2' },
      { text: 'L’année de souscription : la date est en E2.', cell: 'I2', input: '=YEAR(E2)' },
      { text: 'Le mois : même chose avec MOIS.', cell: 'J2', input: '=MONTH(E2)' },
    ],
  },
  exercises: [
    {
      id: 'm7-1',
      module: 7,
      kind: 'formula',
      title: 'Libellé avec &',
      instruction: 'En **H2**, crée le libellé « N° de contrat - Type » (ex. « CT-20001 - Auto ») avec le **&**. Recopie jusqu’en **H151**.',
      notions: ['CONCAT'],
      setup: ctr('Libellé'),
      targets: [{ cell: 'H2', fillTo: `H${LC}`, solution: '=A2&" - "&C2' }],
      hint1: 'Le & colle des morceaux de texte. Le séparateur « - » s’écrit entre guillemets, avec ses espaces.',
      hint2: '`=N°&" - "&type`',
      mistakes: [{ formulas: ['=A2&"-"&C2'], message: 'Presque : il manque les **espaces** autour du tiret. Écris `" - "` (espace, tiret, espace).' }],
    },
    {
      id: 'm7-2',
      module: 7,
      kind: 'formula',
      title: 'Nom complet avec CONCAT',
      instruction: 'En **F2**, écris le contact « Prénom Nom » avec {{CONCAT}} (un espace entre les deux). Recopie jusqu’en **F41**.',
      notions: ['CONCAT'],
      setup: pros('Contact'),
      targets: [{ cell: 'F2', fillTo: 'F41', solution: '=CONCAT(E2," ",D2)' }],
      requiredFunctions: ['CONCAT'],
      hint2: '{{=CONCAT(prénom," ",nom)}}',
      mistakes: [{ formulas: ['=CONCAT(E2,D2)'], message: 'Il manque l’espace entre le prénom et le nom : ajoute `" "` comme argument du milieu.' }],
    },
    {
      id: 'm7-3',
      module: 7,
      kind: 'formula',
      title: 'Département avec GAUCHE',
      instruction: 'En **F2**, extrais le département (les **2 premiers** caractères du code postal). Recopie jusqu’en **F41**.',
      notions: ['LEFT'],
      setup: pros('Département'),
      targets: [{ cell: 'F2', fillTo: 'F41', solution: '=LEFT(C2,2)' }],
      requiredFunctions: ['LEFT'],
      hint2: '{{=LEFT(code_postal,2)}}',
      mistakes: [{ formulas: ['=RIGHT(C2,2)'], message: '{{RIGHT}} prend la fin du texte. Le département, c’est le **début** : {{LEFT}}.' }],
    },
    {
      id: 'm7-4',
      module: 7,
      kind: 'formula',
      title: 'Numéro avec DROITE',
      instruction: 'En **H2**, extrais le numéro du contrat sans le « CT- » (les **5 derniers** caractères). Recopie jusqu’en **H151**.',
      notions: ['RIGHT'],
      setup: ctr('Numéro seul'),
      targets: [{ cell: 'H2', fillTo: `H${LC}`, solution: '=RIGHT(A2,5)' }],
      requiredFunctions: ['RIGHT'],
      hint2: '{{=RIGHT(n°_contrat,5)}}',
      mistakes: [{ formulas: ['=RIGHT(A2,6)'], message: 'Avec 6 caractères, tu récupères aussi le tiret. Il en faut 5.' }],
    },
    {
      id: 'm7-5',
      module: 7,
      kind: 'formula',
      title: 'Nom en majuscules',
      instruction: 'En **F2**, écris le nom du contact (colonne D) en **majuscules**. Recopie jusqu’en **F41**.',
      notions: ['UPPER'],
      setup: pros('NOM'),
      targets: [{ cell: 'F2', fillTo: 'F41', solution: '=UPPER(D2)' }],
      requiredFunctions: ['UPPER'],
      hint2: '{{=UPPER(nom)}}',
      mistakes: [{ formulas: ['=UPPER(E2)'], message: 'Tu as pris le prénom (colonne E). Le nom est en colonne D.' }],
    },
    {
      id: 'm7-6',
      module: 7,
      kind: 'formula',
      title: 'Nettoyer les espaces',
      instruction: 'Les noms de société ont été mal saisis (espaces en trop). En **F2**, écris le nom nettoyé, puis recopie jusqu’en **F41**.',
      notions: ['TRIM'],
      setup: pros('Société propre'),
      targets: [{ cell: 'F2', fillTo: 'F41', solution: '=TRIM(A2)' }],
      requiredFunctions: ['TRIM'],
      hint2: '{{=TRIM(texte)}}',
      mistakes: [{ formulas: ['=A2'], message: 'Tu as recopié le texte tel quel : les espaces en trop sont toujours là. Utilise {{TRIM}}.' }],
    },
    {
      id: 'm7-7',
      module: 7,
      kind: 'formula',
      title: 'Année et mois de souscription',
      instruction: 'En **H2**, l’année de souscription ; en **I2**, le mois (1 à 12). Recopie les deux jusqu’à la ligne **151**.',
      notions: ['YEAR', 'MONTH'],
      setup: () => withCells(ctr('Année')(), { I1: 'Mois' }, {}, { 8: 80 }),
      targets: [
        { cell: 'H2', fillTo: `H${LC}`, solution: '=YEAR(E2)' },
        { cell: 'I2', fillTo: `I${LC}`, solution: '=MONTH(E2)' },
      ],
      requiredFunctions: ['YEAR', 'MONTH'],
      hint2: '{{=YEAR(date)}} et {{=MONTH(date)}}',
      mistakes: [{ formulas: ['=MONTH(E2)', '=YEAR(E2)'], message: 'Tu as inversé : l’année va en H, le mois en I.' }],
    },
    {
      id: 'm7-8',
      module: 7,
      kind: 'formula',
      title: 'Nombre de jours entre deux dates',
      instruction: 'La date de clôture de l’exercice est en **J1**. En **H2**, calcule le nombre de jours entre la souscription et cette date. Recopie jusqu’en **H151**.',
      notions: ['DATES', 'ABS_REF'],
      setup: () => withCells(ctr('Jours d’ancienneté', 'int')(), { I1: 'Clôture', J1: '31/12/2025' }, { J1: 'date' }, { 8: 80, 9: 100 }),
      targets: [{ cell: 'H2', fillTo: `H${LC}`, solution: '=$J$1-E2', fmt: 'int' }],
      hint1: 'Deux dates se soustraient : le résultat est en jours. La date de clôture ne doit pas bouger.',
      hint2: '`=$J$1-date_souscription`',
      mistakes: [
        { formulas: ['=E2-$J$1'], message: 'Ton résultat est négatif : c’est la date la plus récente moins la plus ancienne (clôture − souscription).' },
        { formulas: ['=J1-E2'], message: 'La date de clôture n’est pas bloquée : en recopiant, J1 devient J2 (vide). Écris `$J$1`.' },
      ],
    },
    {
      id: 'm7-9',
      module: 7,
      kind: 'formula',
      title: 'Ancienneté en années à aujourd’hui',
      instruction: 'En **H2**, calcule l’ancienneté du contrat en **années complètes** à la date d’aujourd’hui. Recopie jusqu’en **H151**.',
      notions: ['TODAY', 'DATES'],
      setup: ctr('Ancienneté (ans)', 'int'),
      targets: [{ cell: 'H2', fillTo: `H${LC}`, solution: '=DATEDIF(E2,TODAY(),"Y")', fmt: 'int' }],
      requiredFunctions: ['DATEDIF', 'TODAY'],
      hint1: '{{DATEDIF}} entre la date de souscription et {{TODAY}}.',
      hint2: '{{=DATEDIF(date_souscription,TODAY(),"Y")}}',
      mistakes: [{ formulas: ['=(TODAY()-E2)/365'], message: 'Diviser par 365 donne des années **à virgule** (et ignore les années bissextiles). Pour des années complètes : {{DATEDIF}} avec "Y".' }],
    },
  ],
};

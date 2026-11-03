import { translateFormula } from '../engine/formula';
import { localName } from '../engine/lang';
import { useStore } from '../state/store';
import { Rich } from './Rich';

interface Entry {
  fn: string;
  /** Arguments en français, puis en anglais */
  fr: string;
  en: string;
  what: string;
  /** Exemple, écrit en anglais (traduit à l'affichage) */
  ex: string;
  trap: string;
}

const GROUPS: { title: string; items: Entry[] }[] = [
  {
    title: 'Fonctions de base',
    items: [
      { fn: 'SUM', fr: 'nombre1; [nombre2]; …', en: 'number1, [number2], …', what: 'Additionne.', ex: '=SUM(D2:D151)', trap: 'Vérifie que la plage va jusqu’à la dernière ligne (Cmd + Maj + ↓).' },
      { fn: 'AVERAGE', fr: 'nombre1; [nombre2]; …', en: 'number1, [number2], …', what: 'Moyenne.', ex: '=AVERAGE(D2:D151)', trap: 'Les cellules vides sont ignorées, mais les 0 comptent.' },
      { fn: 'MIN', fr: 'nombre1; …', en: 'number1, …', what: 'Plus petite valeur.', ex: '=MIN(D2:D151)', trap: 'Écart = MAX − MIN, pas l’inverse.' },
      { fn: 'MAX', fr: 'nombre1; …', en: 'number1, …', what: 'Plus grande valeur.', ex: '=MAX(D2:D151)', trap: '—' },
      { fn: 'COUNT', fr: 'valeur1; …', en: 'value1, …', what: 'Compte les cellules contenant des **nombres**.', ex: '=COUNT(D2:D151)', trap: 'Sur une colonne de texte (noms, N° « CT-… »), renvoie 0 : utilise NBVAL.' },
      { fn: 'COUNTA', fr: 'valeur1; …', en: 'value1, …', what: 'Compte les cellules **non vides**.', ex: '=COUNTA(A2:A151)', trap: 'N’inclus pas la ligne de titre.' },
      { fn: 'ROUND', fr: 'nombre; no_chiffres', en: 'number, num_digits', what: 'Arrondit vraiment la valeur.', ex: '=ROUND(AVERAGE(D2:D151),2)', trap: 'Réduire les décimales avec le bouton ne change que l’affichage.' },
    ],
  },
  {
    title: 'Conditions',
    items: [
      { fn: 'IF', fr: 'test_logique; valeur_si_vrai; valeur_si_faux', en: 'logical_test, value_if_true, value_if_false', what: 'Renvoie une valeur ou une autre selon un test.', ex: '=IF(D2>=1000,"Oui","Non")', trap: 'Le texte entre guillemets. SI imbriqués : teste le seuil le plus haut d’abord.' },
      { fn: 'AND', fr: 'logique1; logique2; …', en: 'logical1, logical2, …', what: 'Vrai si **toutes** les conditions sont vraies.', ex: '=IF(AND(C2="Auto",D2>800),"Éligible","")', trap: 'Répète la cellule dans chaque condition.' },
      { fn: 'OR', fr: 'logique1; logique2; …', en: 'logical1, logical2, …', what: 'Vrai si **au moins une** condition est vraie.', ex: '=IF(OR(C2="Santé",C2="Prévoyance"),"Oui","Non")', trap: '`C2="Santé";"Prévoyance"` ne marche pas : écris C2= deux fois.' },
      { fn: 'IFERROR', fr: 'valeur; valeur_si_erreur', en: 'value, value_if_error', what: 'Remplace une erreur par une valeur.', ex: '=IFERROR(C2/B2,0)', trap: 'Ne l’utilise pas pour cacher une formule fausse.' },
    ],
  },
  {
    title: 'Agréger sous condition',
    items: [
      { fn: 'SUMIF', fr: 'plage; critère; [somme_plage]', en: 'range, criteria, [sum_range]', what: 'Somme des lignes qui respectent **un** critère.', ex: '=SUMIF(D2:D121,"Nord",H2:H121)', trap: 'Les deux plages doivent commencer à la même ligne.' },
      { fn: 'COUNTIF', fr: 'plage; critère', en: 'range, criteria', what: 'Compte les lignes qui respectent un critère.', ex: '=COUNTIF(F2:F121,">20")', trap: 'Comparaison entre guillemets : ">20". Avec une cellule : ">"&J1.' },
      { fn: 'SUMIFS', fr: 'somme_plage; plage_critères1; critère1; …', en: 'sum_range, criteria_range1, criteria1, …', what: 'Somme avec **plusieurs** critères.', ex: '=SUMIFS(H2:H121,D2:D121,"Nord",E2:E121,"Serveur")', trap: 'La plage à additionner vient **en premier** (l’inverse de SOMME.SI).' },
      { fn: 'COUNTIFS', fr: 'plage_critères1; critère1; …', en: 'criteria_range1, criteria1, …', what: 'Compte avec plusieurs critères.', ex: '=COUNTIFS(C2:C151,"Auto",G2:G151,"Actif")', trap: 'Une période = 2 critères sur la même colonne de dates.' },
      { fn: 'AVERAGEIFS', fr: 'plage_moyenne; plage_critères1; critère1; …', en: 'average_range, criteria_range1, criteria1, …', what: 'Moyenne avec plusieurs critères.', ex: '=AVERAGEIFS(D2:D151,C2:C151,"Habitation")', trap: '#DIV/0! si aucune ligne ne correspond.' },
    ],
  },
  {
    title: 'Rechercher',
    items: [
      { fn: 'VLOOKUP', fr: 'valeur_cherchée; table_matrice; no_index_col; FAUX', en: 'lookup_value, table_array, col_index_num, FALSE', what: 'Cherche dans la 1re colonne et renvoie la colonne n°.', ex: '=VLOOKUP(C2,$J$2:$M$17,2,FALSE)', trap: 'Sans FAUX : valeur approchée fausse. Table bloquée avec $. Ne cherche que vers la droite.' },
      { fn: 'MATCH', fr: 'valeur_cherchée; tableau_recherche; 0', en: 'lookup_value, lookup_array, 0', what: 'Position d’une valeur dans une plage.', ex: '=MATCH("Avril",B1:G1,0)', trap: 'Le 0 final = correspondance exacte.' },
      { fn: 'INDEX', fr: 'tableau; no_lig; [no_col]', en: 'array, row_num, [column_num]', what: 'Valeur à une position donnée.', ex: '=INDEX(A2:A151,MATCH(J2,B2:B151,0))', trap: 'Les deux plages doivent commencer à la même ligne.' },
      { fn: 'XLOOKUP', fr: 'valeur; plage_recherche; plage_renvoi; [si_absent]', en: 'lookup_value, lookup_array, return_array, [if_not_found]', what: 'Recherche moderne, dans tous les sens, exacte par défaut.', ex: '=XLOOKUP(C2,$J$2:$J$17,$K$2:$K$17,"Inconnu")', trap: 'Absente d’Excel 2019 et avant.' },
    ],
  },
  {
    title: 'Texte et dates',
    items: [
      { fn: 'CONCAT', fr: 'texte1; texte2; …', en: 'text1, text2, …', what: 'Colle des textes (comme &).', ex: '=CONCAT(E2," ",D2)', trap: 'Pense aux espaces entre guillemets : " ".' },
      { fn: 'LEFT', fr: 'texte; no_car', en: 'text, num_chars', what: 'Premiers caractères.', ex: '=LEFT(C2,2)', trap: 'Le résultat est du texte.' },
      { fn: 'RIGHT', fr: 'texte; no_car', en: 'text, num_chars', what: 'Derniers caractères.', ex: '=RIGHT(A2,5)', trap: 'Compte bien les caractères (le tiret compte).' },
      { fn: 'UPPER', fr: 'texte', en: 'text', what: 'Majuscules.', ex: '=UPPER(D2)', trap: 'MINUSCULE / LOWER et NOMPROPRE / PROPER existent aussi.' },
      { fn: 'TRIM', fr: 'texte', en: 'text', what: 'Supprime les espaces en trop.', ex: '=TRIM(A2)', trap: 'Un espace en trop fait échouer RECHERCHEV (#N/A).' },
      { fn: 'TODAY', fr: '', en: '', what: 'Date du jour.', ex: '=TODAY()', trap: 'Change chaque jour : le résultat d’hier n’est plus celui d’aujourd’hui.' },
      { fn: 'YEAR', fr: 'date', en: 'serial_number', what: 'Année d’une date.', ex: '=YEAR(E2)', trap: 'MOIS / MONTH pour le mois (1 à 12).' },
      { fn: 'MONTH', fr: 'date', en: 'serial_number', what: 'Mois d’une date (1 à 12).', ex: '=MONTH(E2)', trap: '—' },
      { fn: 'DATEDIF', fr: 'date_début; date_fin; "Y"', en: 'start_date, end_date, "Y"', what: 'Années ("Y"), mois ("M") ou jours ("D") entre deux dates.', ex: '=DATEDIF(E2,TODAY(),"Y")', trap: 'Absente des suggestions d’Excel : tape-la en entier. Date de début d’abord.' },
    ],
  },
];

const SHORTCUTS: [string, string][] = [
  ['Cmd + T (ou F4)', 'Ajouter / faire tourner les $ : A1 → $A$1 → A$1 → $A1'],
  ['Cmd + D', 'Recopier vers le bas'],
  ['Double-clic sur la poignée', 'Recopier jusqu’au bout des données'],
  ['Cmd + Maj + ↓', 'Sélectionner jusqu’au bout de la colonne'],
  ['Cmd + flèche', 'Aller au bout des données'],
  ['Cmd + Z / Cmd + Y', 'Annuler / rétablir'],
  ['F2 (fn + F2)', 'Modifier la cellule'],
  ['Échap', 'Annuler la saisie en cours'],
];

const ERRORS: [string, string, string][] = [
  ['#N/A', '#N/A', 'Valeur cherchée introuvable (RECHERCHEV) : faute de frappe, espace, table qui a glissé.'],
  ['#VALEUR!', '#VALUE!', 'Calcul avec du texte.'],
  ['#REF!', '#REF!', 'Référence vers une cellule qui n’existe pas (n° de colonne trop grand, recopie hors feuille).'],
  ['#NOM?', '#NAME?', 'Fonction mal écrite, ou texte sans guillemets.'],
  ['#DIV/0!', '#DIV/0!', 'Division par zéro ou par une cellule vide.'],
];

export function Cheatsheet() {
  const lang = useStore().progress.lang;
  return (
    <div className="cheatsheet" data-testid="cheatsheet">
      <div className="row-between no-print">
        <h1>Antisèche</h1>
        <button className="btn primary" onClick={() => window.print()}>
          🖨 Imprimer
        </button>
      </div>
      <h1 className="print-only">Antisèche Excel</h1>
      <p className="muted">
        Excel français : arguments séparés par <code>;</code> et virgule décimale. Excel anglais : <code>,</code> et point décimal.
      </p>
      {GROUPS.map((g) => (
        <section key={g.title}>
          <h2>{g.title}</h2>
          <table className="cheat">
            <thead>
              <tr>
                <th>Français</th>
                <th>Anglais</th>
                <th>Exemple</th>
                <th>Piège classique</th>
              </tr>
            </thead>
            <tbody>
              {g.items.map((e) => (
                <tr key={e.fn}>
                  <td>
                    <code>
                      {localName(e.fn, 'fr')}({e.fr})
                    </code>
                    <div className="small">
                      <Rich text={e.what} lang={lang} />
                    </div>
                  </td>
                  <td>
                    <code>
                      {e.fn}({e.en})
                    </code>
                  </td>
                  <td>
                    <code>{translateFormula(e.ex, 'en', lang)}</code>
                  </td>
                  <td className="small">
                    <Rich text={e.trap} lang={lang} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <section>
        <h2>Références et raccourcis Mac</h2>
        <table className="cheat">
          <tbody>
            {SHORTCUTS.map(([k, v]) => (
              <tr key={k}>
                <td>
                  <strong>{k}</strong>
                </td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2>Les erreurs</h2>
        <table className="cheat">
          <tbody>
            {ERRORS.map(([fr, en, why]) => (
              <tr key={fr}>
                <td>
                  <code>{fr}</code> / <code>{en}</code>
                </td>
                <td>{why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2>Tableau croisé dynamique (Excel pour Mac)</h2>
        <p>
          Clic dans le tableau › <strong>Insertion › Tableau croisé dynamique</strong> › Nouvelle feuille › OK. Glisse les champs : <strong>Lignes</strong> (regrouper par), <strong>Valeurs</strong> (calculer),{' '}
          <strong>Colonnes</strong> (2e regroupement), <strong>Filtres</strong> (garder une partie). Changer Somme/Nombre/Moyenne : (i) ou clic droit › Paramètres des champs de valeurs. Données modifiées : clic droit › Actualiser.
        </p>
      </section>
    </div>
  );
}

import { Dataset } from '../data/datasets';
import { colName } from '../engine/formula';
import { PivotSpec } from '../exercises/types';
import { AGG_LABEL } from './pivot';

export const OPEN_STEP = 'Ouvre le fichier téléchargé (double-clic) : il s’ouvre dans Excel. Si Excel affiche « Activer la modification », clique dessus.';

/** Étapes exactes pour refaire le TCD dans Excel pour Mac (version française). */
export function excelPivotSteps(ds: Dataset, spec: PivotSpec): string[] {
  const range = `Données!$A$1:$${colName(ds.columns.length - 1)}$${ds.rows.length + 1}`;
  const steps = [
    OPEN_STEP,
    'Clique sur n’importe quelle cellule du tableau, par exemple **A2**.',
    'Dans le ruban, onglet **Insertion** › bouton **Tableau croisé dynamique**.',
    `Dans la fenêtre « Créer un tableau croisé dynamique », vérifie la plage (\`${range}\`), choisis **Nouvelle feuille de calcul**, puis **OK**.`,
    'À droite s’ouvre le volet **Champs de tableau croisé dynamique** : la liste des colonnes en haut, les 4 zones en bas.',
  ];
  for (const f of spec.filters)
    steps.push(
      `Fais glisser **${f.field}** dans la zone **Filtres**. Au-dessus du tableau, clique sur la flèche à côté de « (Tous) », coche **Sélectionner plusieurs éléments** si besoin, et garde seulement : ${f.values.map((v) => `« ${v} »`).join(', ')}. Puis **OK**.`,
    );
  for (const r of spec.rows) steps.push(`Fais glisser **${r}** dans la zone **Lignes**.`);
  for (const c of spec.cols) steps.push(`Fais glisser **${c}** dans la zone **Colonnes**.`);
  for (const v of spec.values) {
    steps.push(`Fais glisser **${v.field}** dans la zone **Valeurs**.`);
    steps.push(
      `Vérifie qu’Excel affiche « ${AGG_LABEL[v.agg]} de ${v.field} ». Sinon : clique sur le petit **(i)** à droite de « ${v.field} » dans la zone Valeurs (ou clic droit sur un nombre du TCD › **Paramètres des champs de valeurs**) et choisis **${AGG_LABEL[v.agg]}**.`,
    );
  }
  steps.push('Compare ton tableau avec la réponse attendue ci-dessous (les totaux doivent être identiques).');
  return steps;
}

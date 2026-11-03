import { functionsUsed } from './formula';
import { Lang } from './lang';

/** Une phrase qui explique la cause probable d'une erreur Excel. */
export function explainError(type: string, formula: string, lang: Lang, hfMessage = ''): string {
  const fns = formula.startsWith('=') ? functionsUsed(formula, lang) : [];
  const lookup = fns.some((f) => ['VLOOKUP', 'HLOOKUP', 'MATCH', 'XLOOKUP', 'INDEX'].includes(f));
  const sep = lang === 'fr' ? ';' : ',';
  switch (type) {
    case 'NA':
      return lookup
        ? 'La valeur cherchée n’existe pas dans la première colonne de ta plage (faute de frappe, espace en trop, ou plage qui ne commence pas à la bonne colonne).'
        : 'Valeur « non disponible » : une recherche n’a rien trouvé.';
    case 'VALUE':
      return 'Tu fais un calcul avec du texte : une des cellules utilisées contient des lettres (ou un nombre stocké comme texte).';
    case 'REF':
      return 'La formule pointe vers une cellule qui n’existe pas (souvent après une recopie qui sort de la feuille, ou un numéro de colonne trop grand dans RECHERCHEV).';
    case 'NAME': {
      const m = /Function name (\S+) not recognized/.exec(hfMessage);
      if (m) return `Excel ne connaît pas la fonction « ${m[1]} » : vérifie l’orthographe${lang === 'fr' ? ' (en français : SOMME, pas SUM)' : ' (in English: SUM, not SOMME)'}.`;
      const n = /Named expression (\S+) not recognized/.exec(hfMessage);
      if (n) return `Excel ne connaît pas le nom « ${n[1]} » : as-tu oublié les guillemets autour d’un texte ("Nord") ?`;
      return 'Excel ne reconnaît pas un nom : faute de frappe dans la fonction, ou texte sans guillemets.';
    }
    case 'DIV_BY_ZERO':
      return 'Tu divises par zéro ou par une cellule vide.';
    case 'NUM':
      return 'Le calcul est impossible avec ces nombres (ou un argument texte comme "M" mal écrit dans DATEDIF).';
    case 'CYCLE':
      return 'Référence circulaire : la formule utilise sa propre cellule (directement ou indirectement).';
    case 'ERROR':
      return `Formule mal écrite : parenthèse non fermée, guillemet oublié, ou mauvais séparateur (ici on sépare les arguments par « ${sep} »).`;
    case 'SPILL':
      return 'Le résultat déborde sur des cellules déjà remplies.';
    default:
      return 'Erreur dans la formule.';
  }
}

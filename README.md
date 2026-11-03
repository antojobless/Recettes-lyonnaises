# Excel Coach : apprendre Excel de zéro jusqu'au test d'entretien

Une application web qui t'apprend Excel pas à pas, avec une vraie mini-feuille de calcul,
des exercices corrigés automatiquement, une séance du jour et des tests d'entreprise chronométrés.
Tout est en français, et l'équivalent anglais des fonctions est toujours affiché.

## Où est l'appli ?

- **En ligne :** https://antojobless.github.io/Recettes-lyonnaises/
  (elle se met à jour toute seule à chaque modification de la branche `main`).
- **En secours, un seul fichier :** télécharge [`dist-single/index.html`](dist-single/index.html)
  (sur GitHub : ouvre le fichier puis clique sur l'icône « Download raw file »), puis double-clique dessus.
  Il s'ouvre dans ton navigateur et marche sans connexion internet.

Ta progression est enregistrée dans ton navigateur. La version en ligne et la version fichier
ne partagent pas la même mémoire : utilise le bouton d'export/import de la progression pour passer de l'une à l'autre.

### Si l'adresse en ligne affiche une erreur 404

GitHub Pages doit être activé une fois, à la main :
**Settings** du dépôt → **Pages** (menu de gauche) → **Build and deployment** → **Source : GitHub Actions**.
Ensuite, onglet **Actions** → « Déployer sur GitHub Pages » → **Run workflow**.

## Pour les développeurs

```bash
npm install
npm run dev          # serveur local
npm test             # tests Vitest (logique, moteur, correcteur, chaque exercice)
npm run e2e          # parcours Playwright
npm run build        # version GitHub Pages dans dist/
npm run build:single # version fichier unique dans dist-single/index.html
```

Stack : Vite + React + TypeScript, moteur de formules [HyperFormula](https://hyperformula.handsontable.com/)
(licence GPL v3, clé `gpl-v3`, usage personnel), export .xlsx avec ExcelJS. Pas de serveur, pas de compte.

## Choix faits (et pourquoi)

- **`base: './'` dans Vite** au lieu de `'/Recettes-lyonnaises/'` : des chemins relatifs marchent à la fois
  sur GitHub Pages et dans le fichier unique ouvert par double-clic. Une seule configuration, moins de risques.
- **Dépôt :** l'appli vit dans le dépôt `Recettes-lyonnaises` (le seul disponible dans la session),
  à côté du PDF de recettes, qui n'est pas modifié.
- **Formules stockées dans la langue choisie** ; la bascule FR/EN traduit toutes les formules
  (noms de fonctions, `;` ↔ `,`, virgule ↔ point décimal, VRAI/FAUX ↔ TRUE/FALSE). La bascule intégrée
  d'HyperFormula ne traduit pas les séparateurs : on utilise donc notre propre traducteur (testé).
- **`VRAI` et `FAUX` tapés seuls** (sans parenthèses, comme dans Excel) : HyperFormula ne les reconnaît
  qu'en `FAUX()`. On les déclare comme noms pour que `=RECHERCHEV(...;FAUX)` marche comme dans Excel.

## Fonctions : ce qu'HyperFormula sait faire (vérifié dans le paquet 3.5.0)

Toutes les fonctions du programme ont été vérifiées dans la liste des fonctions enregistrées d'HyperFormula
et dans son pack de langue `frFR`.

| Fonction du programme | État |
|---|---|
| SOMME, MOYENNE, MIN, MAX, NB, NBVAL, ARRONDI | natives |
| SI, ET, OU, SIERREUR | natives |
| SOMME.SI, NB.SI, SOMME.SI.ENS, NB.SI.ENS | natives |
| **MOYENNE.SI.ENS (AVERAGEIFS)** | **absente d'HyperFormula → ajoutée comme fonction personnalisée** (même logique de critères que SOMME.SI.ENS) |
| RECHERCHEV, INDEX, EQUIV, **RECHERCHEX (XLOOKUP)** | natives (RECHERCHEX existe bien dans HyperFormula 3.5) |
| **CONCAT** | **absente → ajoutée comme fonction personnalisée** ; `&` et CONCATENER sont natifs |
| GAUCHE, DROITE, MAJUSCULE, SUPPRESPACE, AUJOURDHUI, ANNEE, MOIS, DATEDIF | natives |

Noms français corrigés par rapport au pack `frFR` d'HyperFormula, pour coller au vrai Excel :
`FILTER → FILTRE`, `MAXIFS → MAX.SI.ENS`, `MINIFS → MIN.SI.ENS`.

## Limites connues (à savoir avant l'entretien)

- **Cmd+T** : dans Excel pour Mac, Cmd+T fait tourner les `$`. Mais dans un navigateur, Cmd+T ouvre un nouvel
  onglet et la page ne peut pas l'empêcher. Dans l'appli, utilise **F4** (sur Mac : **fn + F4**) ou le bouton **$**
  de la barre de formule. Dans le vrai Excel, Cmd+T marche.

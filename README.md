# Excel Coach : apprendre Excel de zéro jusqu'au test d'entretien

Une application web qui t'apprend Excel pas à pas, avec une vraie mini-feuille de calcul,
des exercices corrigés automatiquement, une séance du jour et des tests d'entreprise chronométrés.
Tout est en français, et l'équivalent anglais de chaque fonction est toujours affiché à côté.

## Où est l'appli ?

- **En ligne :** https://antojobless.github.io/Recettes-lyonnaises/
  Elle se met à jour toute seule à chaque modification de la branche `main`.
- **En secours, un seul fichier :** [`dist-single/index.html`](dist-single/index.html).
  Sur GitHub, ouvre ce fichier, clique sur l'icône **Download raw file** (la flèche vers le bas, en haut à droite du fichier),
  puis double-clique sur le fichier téléchargé : il s'ouvre dans ton navigateur et marche sans internet.

Ta progression est enregistrée dans ton navigateur. La version en ligne et la version fichier n'ont pas la même mémoire :
pour passer de l'une à l'autre, va dans **Réglages › Exporter ma progression**, puis **Importer** de l'autre côté.

### Si l'adresse en ligne affiche une erreur 404

GitHub Pages doit être activé une fois, à la main (impossible depuis la session de Claude) :

1. Ouvre https://github.com/antojobless/Recettes-lyonnaises/settings/pages
2. Dans **Build and deployment**, choisis **Source : GitHub Actions**.
3. Onglet **Actions** du dépôt › « Déployer sur GitHub Pages » › **Run workflow** (ou attends la prochaine modification).

## Comment t'en servir (30 à 45 minutes par jour)

1. **Premier jour :** l'appli te demande si ton Excel est en français. Pour le savoir, tape `=SOM` dans une cellule d'Excel :
   s'il propose **SOMME**, il est en français ; s'il propose **SUM** quand tu tapes `=SU`, il est en anglais.
   Tu peux changer plus tard avec le bouton **FR / EN** en haut.
2. **Chaque jour :** clique sur **Commencer** dans la *Séance du jour*. Elle mélange un peu de nouveau, beaucoup de révision
   (une notion ratée revient le lendemain, une notion réussie revient dans 3 jours, puis 7, puis 14) et un mini-test chronométré.
3. **Le Parcours** suit les modules dans l'ordre ; le module suivant s'ouvre à 80 % de réussite.
4. **Une ou deux fois par semaine :** un **Test d'entreprise** de 20 ou 30 minutes, sans indice, comme en entretien.
5. **La veille de l'entretien :** imprime l'**Antisèche** (syntaxe FR/EN, exemple et piège pour chaque fonction).

## Le contenu

| Module | Thème | Exercices |
|---|---|---|
| 0 | Découvrir l'interface (cellules, plages, raccourcis Mac) | 7 |
| 1 | Calculs simples, parenthèses, pourcentages | 8 |
| 2 | Références relatives et absolues, recopie, le piège du taux fixe | 9 |
| 3 | SOMME, MOYENNE, MIN, MAX, NB, NBVAL, ARRONDI | 9 |
| 4 | SI, ET, OU, SI imbriqués, SIERREUR | 8 |
| 5 | SOMME.SI, NB.SI, SOMME.SI.ENS, NB.SI.ENS, MOYENNE.SI.ENS | 10 |
| 6 | RECHERCHEV (avec FAUX), INDEX + EQUIV, RECHERCHEX | 9 |
| 7 | &, CONCAT, GAUCHE, DROITE, MAJUSCULE, SUPPRESPACE, AUJOURDHUI, ANNEE, MOIS, dates | 9 |
| 8 | Trier, filtrer, mise en forme conditionnelle (simulés) | 8 |
| 9 | Tableaux croisés dynamiques (simulateur + « Faire dans Excel ») | 7 |
| 10 | Graphiques : lequel pour quelle question (+ « Faire dans Excel ») | 7 |

Soit 91 exercices. Chaque module comprend une leçon courte (4 ou 5 écrans) et un exemple résolu pas à pas.

**Tests d'entreprise :** 5 sujets (assurance, banque, grande distribution, industrie B2B, cabinet d'audit), de 10 à 12 questions
sur 120 à 180 lignes de données, avec à chaque fois SOMME.SI.ENS, RECHERCHEV, SI, un pourcentage et une question de TCD.

**Jeux de données :** commandes de grands comptes, portefeuille de contrats d'assurance, pipeline commercial, ventes par magasin,
notes de frais. Ils sont fictifs (noms d'entreprises inventés) et générés avec une graine fixe : ce sont toujours les mêmes.

## Choix faits (et pourquoi)

- **`base: './'` dans Vite** au lieu de `'/Recettes-lyonnaises/'` : avec des chemins relatifs, la même version marche à la fois
  sur GitHub Pages et dans le fichier unique ouvert par double-clic. Le résultat en ligne est le même.
- **Dépôt :** l'appli vit dans le dépôt `Recettes-lyonnaises` (le seul disponible dans la session), à côté du PDF de recettes, qui n'est pas modifié.
  Le déploiement se fait depuis `main` (accord donné pendant la session).
- **Navigation par `#`** (ex. `#/ex/m3-1`) : pas besoin de serveur, marche aussi en fichier local.
- **Formules stockées dans la langue choisie.** La bascule FR/EN traduit toutes les formules déjà tapées
  (noms de fonctions, `;` ↔ `,`, virgule ↔ point décimal, VRAI/FAUX ↔ TRUE/FALSE, erreurs). La bascule intégrée d'HyperFormula
  ne traduit pas les séparateurs : on utilise donc notre propre traducteur (testé).
- **`VRAI` et `FAUX` tapés seuls**, comme dans Excel : HyperFormula ne les comprend qu'avec des parenthèses ; on les déclare comme noms.
- **Comparaisons sensibles aux accents** (`"Gagne"` ≠ `"Gagné"`), comme Excel. HyperFormula les ignore par défaut.
- **Correction :** la valeur doit être juste, la cellule doit contenir une formule, et la fonction demandée doit être utilisée.
  Quand une recopie est demandée, toutes les cellules recopiées sont vérifiées. Les valeurs attendues ne sont jamais écrites à la main :
  elles sont calculées en passant la solution dans le moteur.
- **Score :** un exercice réussi sans indice compte 100 %, avec 1 indice 75 %, 2 indices 50 %, avec la réponse affichée 25 %.
  Avoir besoin de la réponse complète compte comme une notion ratée pour la répétition espacée.
- **Séance du jour :** composée automatiquement (environ 30 à 40 min selon ton avancement), recalculée chaque jour.
- **Test d'entreprise :** une question « Oui/Non » doit être répondue avec une formule SI (une valeur tapée est refusée, comme pour les autres questions).
  La question de TCD se répond dans l'onglet TCD.

## Fonctions : ce qu'HyperFormula sait faire (vérifié dans le paquet 3.5.0)

Toutes les fonctions du programme ont été vérifiées dans la liste des fonctions enregistrées d'HyperFormula et dans son pack `frFR`.

| Fonction du programme | État |
|---|---|
| SOMME, MOYENNE, MIN, MAX, NB, NBVAL, ARRONDI | natives |
| SI, ET, OU, SIERREUR | natives |
| SOMME.SI, NB.SI, SOMME.SI.ENS, NB.SI.ENS | natives |
| **MOYENNE.SI.ENS (AVERAGEIFS)** | **absente d'HyperFormula → ajoutée comme fonction personnalisée** (même logique de critères que SOMME.SI.ENS) |
| RECHERCHEV, INDEX, EQUIV, **RECHERCHEX (XLOOKUP)** | natives (RECHERCHEX existe bien dans HyperFormula 3.5) |
| **CONCAT** | **absente → ajoutée comme fonction personnalisée** ; `&` et CONCATENER sont natifs |
| GAUCHE, DROITE, MAJUSCULE, SUPPRESPACE, AUJOURDHUI, ANNEE, MOIS | natives |
| DATEDIF | native, mais n'acceptait que `"Y"`, `"M"`, `"D"` en majuscules → **corrigée** pour accepter `"y"` comme Excel |

Noms français corrigés par rapport au pack `frFR` d'HyperFormula, pour coller au vrai Excel :
`FILTER → FILTRE`, `MAXIFS → MAX.SI.ENS`, `MINIFS → MIN.SI.ENS` (ces fonctions ne sont pas au programme).

## Limites connues (à savoir avant l'entretien)

- **Cmd+T** : dans Excel pour Mac, Cmd+T fait tourner les `$`. Mais dans un navigateur, Cmd+T ouvre un nouvel onglet et la page
  ne peut pas l'empêcher. Dans l'appli, utilise **F4** (sur Mac : **fn + F4**) ou le bouton **$** à droite de la barre de formule.
  Dans le vrai Excel, Cmd+T marche.
- **Tri, filtre et mise en forme conditionnelle** sont simulés avec des panneaux simples (une colonne de tri, un filtre à la fois,
  règles « supérieur à », « inférieur à », « égal à », « contient »). Les leçons donnent les vrais menus d'Excel pour Mac.
- **Le simulateur de TCD** gère Lignes, Colonnes, Valeurs (Somme, Nombre, Moyenne) et Filtres, avec les totaux généraux.
  Il ne fait pas le regroupement automatique des dates par mois/année ni l'affichage « % du total ». D'où le bouton **Faire dans Excel**
  (fichier .xlsx + étapes exactes + résultat attendu) sur chaque exercice de TCD et de graphique.
- **Graphiques** : l'appli t'apprend à choisir le bon graphique (quiz illustrés) ; leur construction se fait dans le vrai Excel via **Faire dans Excel**.
- **Export .xlsx** : les formules sont enregistrées en anglais dans le fichier, comme le veut le format ; Excel les affiche dans sa propre langue à l'ouverture.
- **RECHERCHEX** n'existe que dans Excel 2021 et Microsoft 365 (pas Excel 2019) : le module 6 apprend aussi RECHERCHEV et INDEX + EQUIV.
- Excel corrige parfois tout seul une parenthèse oubliée ; l'appli, elle, affiche « #ERREUR » avec une explication.

## Pour les développeurs

```bash
npm install
npm run dev          # serveur local
npm test             # Vitest : moteur, traducteur, correcteur, chaque exercice, séance, tests d'entreprise
npm run e2e          # Playwright : parcours complet (build + preview)
npm run build        # version GitHub Pages dans dist/
npm run build:single # version fichier unique dans dist-single/index.html
```

Stack : Vite + React + TypeScript, moteur de formules [HyperFormula](https://hyperformula.handsontable.com/)
(licence GPL v3, clé `gpl-v3`, usage personnel), export .xlsx avec ExcelJS. Pas de serveur, pas de compte, pas de réseau une fois chargée.

Organisation : `src/engine` (moteur, traduction, références), `src/grid` (la feuille), `src/exercises` (modules, correcteur),
`src/pivot` (TCD, export .xlsx), `src/session` (séance du jour), `src/exams` (tests d'entreprise), `src/ui` (écrans).

Chaque exercice a ses tests Vitest (générés à partir de la liste des exercices) : la solution est passée dans le moteur
en français et en anglais et doit être acceptée ; chaque erreur typique déclarée doit être refusée avec son message ;
une valeur tapée à la main doit être refusée.

# Révisions d'espagnol

Site en trois parties, choisies au menu d'accueil :
- **Pays hispanophones** : quiz sur les 20 pays où l'espagnol est langue officielle,
  et un onglet Révision avec une carte à explorer ;
- **Communautés autonomes** : situer sur la carte les communautés d'Espagne, Ceuta, Melilla
  et 20 grandes villes (au moins une par communauté), avec aussi un onglet Révision ;
- **Conjugaison** : évaluations sur le modèle des contrôles du cours, liste des verbes avec leur fiche
  et tableaux des terminaisons (présent, prétérit,
  imparfait de l'indicatif, futur, conditionnel, imparfait du subjonctif).

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | La page (menu, écrans des pays, écrans de conjugaison) |
| `css/style.css` | L'apparence (couleurs, tailles, version téléphone) |
| `js/pays.js` | **Les données des pays (à modifier)** |
| `js/verbes.js` | **La banque de verbes (à modifier)** |
| `js/espagne.js` | **Les communautés autonomes et les 20 villes (à modifier)** |
| `js/carte-espagne.js` | La carte de l'Espagne (générée automatiquement, ne pas toucher) |
| `js/communautes.js` | La logique du quiz des communautés autonomes |
| `js/revision.js` | Les onglets Révision (cartes à explorer) des pays et des communautés |
| `js/carte.js` | Les contours des pays (généré automatiquement, ne pas toucher) |
| `js/app.js` | La logique du quiz des pays |
| `js/conjugaison.js` | Le moteur de conjugaison et l'écran d'évaluation |
| `js/memo.js` | Les onglets Verbes (liste et fiches) et Terminaisons |
| `js/accueil.js` | Le menu d'accueil |
| `photos/` | Les photos des dirigeants, une par pays (`AR.jpg`, `BO.jpg`...) |
| `.claude/` | Réglages de test pour Claude, inutile en ligne |

## Ajouter des verbes

Chaque évaluation de conjugaison est tirée au hasard dans la banque de verbes.

Ouvre `js/verbes.js`. Le mode d'emploi est en haut du fichier. Un verbe régulier
tient en une ligne : `{ inf: "nadar", fr: "nager" },`. Pour un verbe particulier,
on indique seulement ce qui change (diphtongue, radical du prétérit, du futur...).
En bas du fichier, deux listes indiquent quels verbes peuvent sortir avec un pronom
(`alabarlo`, `elegirse`).

## Changer une ville

Ouvre `js/espagne.js`. Chaque ville tient en une ligne (nom, latitude, longitude, code de la
communauté, population). Le mode d'emploi est en haut du fichier.

## Tester sur ton ordinateur

Double-clique sur `index.html` : le site s'ouvre dans ton navigateur. Aucun serveur n'est nécessaire.

## Mettre à jour un dirigeant

Ouvre `js/pays.js`, trouve le pays, puis modifie `dirigente`, `apellidos` et `cargo`.
Garde les guillemets et les virgules. Exemple :

```js
dirigente: "Javier Milei",
apellidos: ["Milei"],
cargo: "presidente",
```

Pour la photo : cherche le nouveau dirigeant sur commons.wikimedia.org, télécharge une
version réduite (environ 330 pixels de large) et enregistre-la dans `photos/` avec un
**nouveau nom** (par exemple `AR-nom.jpg`). Avec le même nom que l'ancienne, les navigateurs
continueraient d'afficher l'ancienne photo gardée en mémoire. Mets ensuite à jour `archivo`,
`autor`, `licencia` et `fuente` dans `foto` : la licence oblige à citer l'auteur.

Sur GitHub : ouvre le fichier, clique sur l'icône crayon, modifie, puis « Commit changes ».
Le site en ligne se met à jour en une minute environ.

## Publier sur GitHub Pages

1. Crée un compte sur github.com.
2. Bouton « New repository », nom par exemple `quiz-hispano`, coche « Public », puis « Create repository ».
3. Clique sur « uploading an existing file » et glisse `index.html` ainsi que les dossiers `css`, `js` et `photos`.
   Puis « Commit changes ».
4. Va dans « Settings », puis « Pages ». Dans « Branch », choisis `main` et `/ (root)`, puis « Save ».
5. Après une ou deux minutes, l'adresse apparaît en haut de cette page :
   `https://ton-pseudo.github.io/quiz-hispano/`

## Crédits

Contours des pays : Natural Earth (domaine public), via le paquet world-atlas.
Carte de l'Espagne : paquet es-atlas, d'après l'Instituto Geográfico Nacional (licence CC BY 4.0).
Population des villes : INE, au 1er janvier 2025.
Photos des dirigeants : Wikimedia Commons. L'auteur et la licence de chaque photo sont
dans `js/pays.js` et s'affichent en bas du site, dans « Crédits des photos ».

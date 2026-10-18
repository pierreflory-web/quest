# Quest — L'enquête du robot volé

Jeu d'enquête sur téléphone (web / PWA). Le prototype **NOVA-7**, un robot humanoïde
d'une valeur inestimable, a été volé cette nuit dans l'usine RoboCorp de **Quest**,
une petite ville futuriste. Le joueur incarne un détective qui explore la ville en
vue de dessus, interroge les habitants, collecte des indices dans son carnet et
accuse un suspect auprès de l'agent Pixel.

## La ville de Quest

- **Nord** — Le Grand Jardin : balançoires, fleurs colorées, bambous, arbres et
  allées ombragées ; étang aux nénuphars traversé d'un pont de bois, kiosque à
  musique, labyrinthe de haies (avec une topiaire-robot au centre), statues,
  Bosquet le robot jardinier, et une faune animée — papillons, oiseaux qui
  s'envolent à l'approche, écureuil et chat de gouttière.
- **Sud** — Quartier des Sables : quartier abîmé, partiellement recouvert de sable, cocotiers.
- **Ouest** — Parc d'attractions, ceint d'une clôture festive avec son portail
  « PARC DE QUEST » sur la route et une entrée sud : la Comète hurlante, la
  Chute Libre (tour de chute animée), la Grande Roue qui tourne au cœur du parc,
  autos tamponneuses, carrousel, pêche aux canards, stands de marrons chauds et
  de tir à l'arc tenus par des robots humanoïdes, et maison hantée.
- **Est** — Le Grand Centre : grand centre commercial.
- **Centre** — Place de l'Usine : l'usine RoboCorp, scène du crime ; écran géant
  d'informations à texte défilant (les nouvelles suivent l'enquête), horloge
  holographique à l'heure réelle, café-terrasse « Le Circuit Court » avec Moka le
  robot serveur, food-truck « Wok-È-Watt », Balayette le robot balayeur et des
  pigeons mécaniques qui s'envolent à l'approche.

## Lancer le jeu

Aucune compilation, aucun paquet : c'est du HTML/JS/CSS statique.

- **Avec Laravel Herd (sur ce Mac)** : le dossier étant dans `~/Herd/`, le jeu est
  servi automatiquement sur [http://quest.test](http://quest.test).
- **Sur n'importe quelle machine** :

  ```bash
  python3 -m http.server 8000
  ```

  puis ouvrir <http://localhost:8000>. N'importe quel serveur statique convient.

Pour tester sur téléphone : ouvrir l'URL du serveur depuis le téléphone (même réseau
Wi-Fi), ou déployer les fichiers sur n'importe quel hébergement statique. En HTTPS,
le jeu est installable comme une app (PWA) via « Ajouter à l'écran d'accueil ».

## Contrôles

- **Mobile** : joystick virtuel (moitié gauche de l'écran) pour se déplacer, bouton
  **A** pour parler / examiner.
- **Clavier** : flèches ou ZQSD/WASD pour se déplacer, `E`, `Espace` ou `Entrée` pour agir.

Au début d'une nouvelle enquête, on choisit son personnage — **Léa** ou **Théo** —
puis une page « Comment jouer » explique les commandes. Le carnet permet de
recommencer l'enquête à tout moment. Une mini-carte en bas à gauche montre en
permanence votre position (point blanc) et les personnages qui ont du nouveau
(points jaunes) ; un toucher l'agrandit en plein écran.
La progression est sauvegardée automatiquement (localStorage).

La ville est vivante et futuriste : drones de livraison en vol, hologrammes
publicitaires, robots humanoïdes (unités B-12, C-3, Z-9, K-7) en promenade, et un
réseau de chemins qui relie tous les lieux au carrefour central.
Des dizaines d'objets sont examinables — bancs, statue des fondateurs, panneau
« RECHERCHÉ », distributeurs, château de sable, barque échouée, feu de camp…
Le Grand Centre abrite Gustave le vigile (qui peut confirmer l'alibi de Nadia),
un food court avec Vanille le robot glacier, une boutique de jouets, un photomaton,
un plan holographique, un magasin au rideau de fer, une fontaine à vœux et une
mosaïque monumentale. Dans la maison hantée, fantômes et squelettes s'animent.

**Musique d'ambiance** : générée en Web Audio (aucun fichier son) — nappe rêveuse
dans la ville, drone inquiétant dans la maison hantée ; bouton 🔊/🔇 dans
l'interface, préférence mémorisée. Un chat de gouttière se balade dans le grand
jardin — inutile d'essayer de lui parler, c'est un chat.

**Lisibilité des indices** : un « ! » jaune flotte au-dessus des personnages qui
ont du nouveau à dire, une loupe cyan pulse sur les objets-indices pas encore
examinés, et la bulle d'action affiche « Indice ! » devant eux.

## Structure du code

| Fichier | Rôle |
|---|---|
| `index.html` | Page unique, overlays d'interface (dialogue, carnet, accusation…) |
| `css/style.css` | Styles de l'interface |
| `js/main.js` | Boucle de jeu, caméra, collisions, portails, marqueurs, mini-carte, interactions, hook de debug `window.__quest` |
| `js/world.js` | Génération des cartes (ville, usine, maison hantée) et rendu canvas |
| `js/data.js` | Scénario : indices, suspects, dialogues, conseils, résolution de l'accusation, actualités, couleurs de manteau |
| `js/state.js` | État de la partie + sauvegarde localStorage |
| `js/input.js` | Joystick tactile + clavier |
| `js/ui.js` | Overlays DOM (dialogues, carnet, choix, toasts, écrans) |
| `js/audio.js` | Musique d'ambiance procédurale (Web Audio) |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA (cache hors-ligne, installation, icônes 192/512 px) |

## Publication

Le jeu est publié sur GitHub Pages : <https://pierreflory-web.github.io/quest/>.
Un `git push` sur `master` redéploie le site en une minute environ.

**À chaque publication, incrémenter la constante `CACHE` dans `sw.js`**
(actuellement `quest-v4`). Le service worker répond d'abord depuis le cache : sans
changement de version, les joueurs déjà passés gardent l'ancienne version hors ligne.

Autres pièges connus :

- **iOS fige l'icône** à l'installation du raccourci : pour la changer, supprimer puis
  réinstaller « Sur l'écran d'accueil ».
- **Onglet masqué** : `requestAnimationFrame` est suspendu, le jeu semble figé.

## Tests et débogage

Il n'existe pas de suite de tests automatisée. Les vérifications se font en rejouant
des scripts dans la console du navigateur grâce au hook `window.__quest` :
`warp(carte, x, y)`, `tick()`, `action()`, `state`, `world`. Il permet de piloter la
simulation image par image et de scripter un parcours complet de l'enquête.
Ce hook est livré en production (inoffensif, mais visible en console).

La vitesse de marche est la constante `SPEED` de `js/main.js` (6,2 cases/s).

## Intégration « Mes Jeux »

`index.html` charge un script externe, `https://pierreflory-web.github.io/jeux/points.js`,
qui expose `window.MesJeux`. À la victoire, `js/main.js` appelle
`window.MesJeux.award('quest', lignes)` avec :

| Points | Condition |
|---|---|
| 50 | Victoire : NOVA-7 retrouvé |
| 20 | Coupable trouvé du premier coup (aucune fausse accusation) |
| 10 | Tous les indices découverts |

Le compteur `state.accusations` (dans `js/state.js`) compte les fausses accusations,
uniquement à partir de 3 indices collectés. Si `points.js` est indisponible, le jeu
fonctionne normalement : l'appel est protégé par `if (window.MesJeux)`.

## Le scénario (spoiler !)

Le coupable est **Victor**, le forain de la maison hantée. Piste : sable au pied du
socle → témoignage de Marcus (quartier sud) → traces de roulettes et ticket de manège
→ témoignage de Grillon, le robot à marrons → facture de la bâche chez Nadia.
Confronté aux deux preuves (témoignage + facture), **Victor avoue** et déverrouille
la maison hantée : on ne peut donc pas trouver NOVA-7 sans avoir d'abord confondu
le coupable. L'accusation finale ne réussit que si le robot a été retrouvé.
Victoire couronnée de confettis.

## Pistes d'évolution

Déjà réalisé : musique d'ambiance, mini-carte, conseils (« Un conseil ? » dans le carnet).

- Bruitages (la musique existe, pas encore les effets sonores).
- Plusieurs affaires / chapitres.
- Sprites dessinés (remplacer le rendu vectoriel canvas).
- Une animation ou un ajout pour la place principale (idée évoquée, à préciser).
- Suite de tests automatisée.

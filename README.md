# Quest — L'enquête du robot volé

Jeu d'enquête sur téléphone (web / PWA). Le prototype **NOVA-7**, un robot humanoïde
d'une valeur inestimable, a été volé cette nuit dans l'usine RoboCorp de **Quest**,
une petite ville futuriste. Le joueur incarne un détective qui explore la ville en
vue de dessus, interroge les habitants, collecte des indices dans son carnet et
accuse un suspect auprès de l'agent Pixel.

## La ville de Quest

- **Nord** — Le Grand Jardin : balançoires, fleurs colorées, bambous, arbres et allées ombragées.
- **Sud** — Quartier des Sables : quartier abîmé, partiellement recouvert de sable, cocotiers.
- **Ouest** — Parc d'attractions : la Comète hurlante, la Chute Libre (tour de
  chute animée), la Grande Roue qui tourne, carrousel, pêche aux canards,
  stand de marrons chauds et stand de tir à l'arc tenus par des robots humanoïdes,
  et maison hantée.
- **Est** — Le Grand Centre : grand centre commercial.
- **Centre** — Place de l'Usine : l'usine RoboCorp, scène du crime.

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
recommencer l'enquête à tout moment.
La progression est sauvegardée automatiquement (localStorage).

La ville est vivante et futuriste : routes à guidage lumineux, drones de livraison
en vol, hologrammes publicitaires, robots humanoïdes (unités B-12, C-3, Z-9, K-7)
en promenade, et un réseau d'allées qui relie tous les lieux au carrefour central.
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
| `js/main.js` | Boucle de jeu, caméra, collisions, portails, interactions |
| `js/world.js` | Génération des cartes (ville, usine, maison hantée) et rendu canvas |
| `js/data.js` | Scénario : indices, suspects, dialogues, résolution de l'accusation |
| `js/state.js` | État de la partie + sauvegarde localStorage |
| `js/input.js` | Joystick tactile + clavier |
| `js/ui.js` | Overlays DOM (dialogues, carnet, choix, toasts, écrans) |
| `sw.js`, `manifest.webmanifest` | PWA (cache hors-ligne, installation) |

## Le scénario (spoiler !)

Le coupable est **Victor**, le forain de la maison hantée. Piste : sable au pied du
socle → témoignage de Marcus (quartier sud) → traces de roulettes et ticket de manège
→ témoignage de Grillon, le robot à marrons → facture de la bâche chez Nadia.
Confronté aux deux preuves (témoignage + facture), **Victor avoue** et déverrouille
la maison hantée : on ne peut donc pas trouver NOVA-7 sans avoir d'abord confondu
le coupable. L'accusation finale ne réussit que si le robot a été retrouvé.
Victoire couronnée de confettis.

## Pistes d'évolution

- Sons et musique d'ambiance.
- Plusieurs affaires / chapitres.
- Sprites dessinés (remplacer le rendu vectoriel canvas).
- Minicarte et journal de quêtes.

import { state, hasClue, flag } from './state.js';

export const CLUES = {
  ticket: {
    title: 'Ticket de manège',
    desc: "Un ticket froissé du parc d'attractions : « La Comète hurlante ». Trouvé au pied du socle de NOVA-7.",
  },
  sable: {
    title: 'Sable fin',
    desc: 'Du sable fin éparpillé au pied du socle. Tout le quartier sud de Quest en est recouvert…',
  },
  roulettes: {
    title: 'Traces de roulettes',
    desc: "Des traces de roulettes partent du socle et filent vers la sortie de l'usine, cap à l'ouest.",
  },
  ray: {
    title: 'Témoignage de Ray',
    desc: "Le gardien de nuit a entendu une roue grincer vers 2 h du matin, qui s'éloignait vers l'ouest.",
  },
  marcus: {
    title: 'Témoignage de Marcus',
    desc: "Marcus a vu une silhouette pousser une grosse caisse à roulettes à travers les dunes vers 3 h, en direction du parc. Puis de la lumière dans la maison hantée, pourtant fermée.",
  },
  grillon: {
    title: 'Témoignage de Grillon',
    desc: "Le robot à marrons a enregistré Victor poussant une grande caisse dans la maison hantée à 3 h 04. « Un nouvel animatronique », disait-il.",
  },
  bache: {
    title: 'Facture de bâche',
    desc: "Nadia a vendu une immense bâche grise à Victor la semaine dernière. « Pour l'humidité », prétendait-il.",
  },
  robot: {
    title: 'NOVA-7 retrouvé',
    desc: 'Le robot volé est caché sous une bâche dans la maison hantée de Victor. Ses diodes clignotent doucement : il est intact.',
  },
};

export const SUSPECTS = [
  { id: 'victor', name: 'Victor', role: 'Forain, propriétaire de la maison hantée' },
  { id: 'marcus', name: 'Marcus', role: 'Habitant du quartier des sables' },
  { id: 'nadia', name: 'Nadia', role: 'Vendeuse du centre commercial, ex-employée RoboCorp' },
  { id: 'ray', name: 'Ray', role: "Gardien de nuit de l'usine" },
  { id: 'mercier', name: 'Directeur Mercier', role: "Patron de l'usine RoboCorp" },
];

function p(who, text) {
  return { who, text };
}

/**
 * Dialogue d'un PNJ selon l'avancement de l'enquête.
 * @returns {{lines: {who:string,text:string}[], clue?: string, flagSet?: string, accuse?: boolean}}
 */
export function npcDialogue(id) {
  switch (id) {
    case 'pixel': {
      if (!flag('mission')) {
        return {
          lines: [
            p('Agent Pixel', "Détective ! Enfin, vous voilà. Cette nuit, le prototype NOVA-7 a été volé dans l'usine RoboCorp, juste derrière moi."),
            p('Agent Pixel', "Un robot humanoïde d'une valeur inestimable. Le maire exige un coupable avant ce soir."),
            p('Agent Pixel', "Commencez par la scène du crime, dans l'usine. Examinez tout, parlez à tout le monde… et notez chaque indice dans votre carnet !"),
          ],
          flagSet: 'mission',
        };
      }
      if (state.solved) {
        return { lines: [p('Agent Pixel', 'Beau travail, détective. Victor est sous les verrous et NOVA-7 a retrouvé son socle. Quest peut dormir tranquille.')] };
      }
      return {
        lines: [p('Agent Pixel', 'Alors, cette enquête ? Revenez me voir avec des preuves solides… et un nom.')],
        accuse: true,
      };
    }

    case 'mercier': {
      if (state.solved) {
        return { lines: [p('Directeur Mercier', 'NOVA-7 est de retour ! RoboCorp vous doit une fière chandelle, détective.')] };
      }
      return {
        lines: [
          p('Directeur Mercier', 'NOVA-7… dix ans de recherche, envolés en une nuit ! Ce robot vaut plus que toute la ville.'),
          p('Directeur Mercier', 'Le voleur a aussi emporté sa caisse de transport, la grande, celle à roulettes. Il savait exactement où chercher.'),
          p('Directeur Mercier', "Fouillez l'usine, détective. Et interrogez Ray, le gardien de nuit… il était censé veiller."),
        ],
      };
    }

    case 'ray': {
      if (!hasClue('ray')) {
        return {
          lines: [
            p('Ray', "Je… bon, d'accord. Je me suis assoupi vers 1 h. Ça arrive, non ?"),
            p('Ray', "Mais vers 2 h, un bruit m'a réveillé à moitié : une roue qui grince. Une roue mal huilée, qui s'éloignait vers l'ouest."),
            p('Ray', "Le temps de me lever, plus rien. Et le socle était vide…"),
          ],
          clue: 'ray',
        };
      }
      return { lines: [p('Ray', "Une roue qui grince, vers 2 h, direction l'ouest. C'est tout ce que je sais, promis.")] };
    }

    case 'lila': {
      const lines = [
        p('Lila', 'Bienvenue au grand jardin ! Les bambous ont encore poussé cette nuit, et les balançoires viennent d’être repeintes.'),
        p('Lila', "Le vol à l'usine ? Quelle histoire… Moi, la nuit, je ne croise que Marcus, du quartier sud. Il traverse parfois la ville à des heures impossibles."),
      ];
      if (hasClue('sable')) {
        lines.push(p('Lila', "Du sable dans l'usine, dites-vous ? Tout le quartier sud en est couvert. Quiconque y passe en ramène plein ses semelles."));
      }
      return { lines };
    }

    case 'marcus': {
      if (!hasClue('marcus')) {
        return {
          lines: [
            p('Marcus', "Le sable, c'est chez moi. Personne ne fait attention à moi, alors moi, j'observe tout."),
            p('Marcus', 'Cette nuit, vers 3 h, une silhouette a traversé les dunes en poussant une grosse caisse à roulettes. Elle évitait les rues éclairées.'),
            p('Marcus', "Elle filait vers le parc d'attractions. Et un peu plus tard, il y avait de la lumière dans la maison hantée. Elle est censée être fermée, non ?"),
          ],
          clue: 'marcus',
        };
      }
      return { lines: [p('Marcus', "La caisse est partie vers le parc, et la maison hantée était éclairée à 3 h. Je sais ce que j'ai vu.")] };
    }

    case 'grillon': {
      const aUnePiste = hasClue('roulettes') || hasClue('ray') || hasClue('marcus');
      if (aUnePiste && !hasClue('grillon')) {
        return {
          lines: [
            p('Grillon', 'Bip. Marrons chauds, marrons chauds ! … Une enquête ? Mes capteurs tournent jour et nuit, bip.'),
            p('Grillon', "Journal de bord, 3 h 04 : Victor a poussé une grande caisse à roulettes dans la maison hantée. La roue avant droite grinçait. Bip."),
            p('Grillon', "Il a déclaré : « nouvel animatronique ». Probabilité que ce soit vrai : 12 %. Bip-bip."),
          ],
          clue: 'grillon',
        };
      }
      if (hasClue('grillon')) {
        return { lines: [p('Grillon', 'Bip. Enregistrement transmis au détective : Victor, caisse, 3 h 04, maison hantée. Un marron chaud pour la route ?')] };
      }
      return {
        lines: [
          p('Grillon', 'Bip. Marrons chauds ! Deux crédits le cornet. Je suis en poste 24 h/24, mes capteurs voient tout, bip.'),
          p('Grillon', "Revenez me voir si vous cherchez quelque chose de précis. Ma mémoire est infaillible. Bip."),
        ],
      };
    }

    case 'victor': {
      if (state.solved) {
        return { lines: [p('Victor', "NOVA-7 aurait fait une attraction du tonnerre… Tant pis. La prison a-t-elle une maison hantée ?")] };
      }
      if (hasClue('robot')) {
        return {
          lines: [
            p('Victor', "D'accord, d'accord ! C'est moi. Je voulais la plus grande attraction de Quest, un vrai robot dans ma maison hantée !"),
            p('Victor', 'Il est intact, je le jure ! Je… je comptais le rendre. Un jour. Peut-être.'),
          ],
        };
      }
      if (hasClue('grillon')) {
        return {
          lines: [
            p('Victor', 'Un animatronique ! Ce robot à marrons raconte n’importe quoi, ses circuits ont pris l’humidité !'),
            p('Victor', "Bon… la porte n'est plus verrouillée, mais il n'y a RIEN à voir là-dedans. RIEN, vous m'entendez ?"),
          ],
        };
      }
      return {
        lines: [
          p('Victor', 'La maison hantée est fermée pour travaux ! Rien à voir, circulez.'),
          p('Victor', 'Allez donc pêcher les canards, ou tenter la Comète hurlante. Sensations garanties !'),
        ],
      };
    }

    case 'nadia': {
      const pisteVictor = hasClue('roulettes') || hasClue('ray') || hasClue('marcus') || hasClue('grillon');
      if (pisteVictor && !hasClue('bache')) {
        return {
          lines: [
            p('Nadia', 'Bienvenue au Grand Centre ! … Une enquête ? Oui, j’ai travaillé à RoboCorp avant qu’ils me remercient. Mais mes nuits, je les passe ici, à l’inventaire.'),
            p('Nadia', "Quelque chose de louche ? Maintenant que vous le dites… Victor, le forain, m'a acheté une bâche immense la semaine dernière. Grise, taille industrielle."),
            p('Nadia', '« Pour l’humidité », il disait. Pour cacher un manège entier, oui !'),
          ],
          clue: 'bache',
        };
      }
      return {
        lines: [
          p('Nadia', 'Bienvenue au Grand Centre ! Soldes sur les parapluies anti-drones et les chaussettes chauffantes.'),
          p('Nadia', "Le vol de l'usine ? J'y ai travaillé, vous savez, avant d'être licenciée. Mais je passe toutes mes nuits ici, à l'inventaire. Demandez au vigile."),
        ],
      };
    }

    default:
      return { lines: [p('???', '…')] };
  }
}

/**
 * Dialogue d'un objet examinable.
 * @returns {{lines: {who:string,text:string}[], clue?: string}|null}
 */
export function objectDialogue(id) {
  const n = (text) => ({ lines: [p('Vous', text)] });
  switch (id) {
    case 'socle':
      return n("Le socle de NOVA-7. Vide. La vitrine a été ouverte avec le bon code : le voleur connaissait les lieux… ou a bien préparé son coup.");
    case 'sable':
      return { ...n('Du sable fin est éparpillé au pied du socle. Curieux : il n’y a pas de sable dans ce quartier de la ville.'), clue: 'sable' };
    case 'ticket':
      return { ...n('Un ticket de manège froissé traîne par terre : « Parc de Quest — La Comète hurlante ». Il n’était sûrement pas là avant cette nuit.'), clue: 'ticket' };
    case 'roulettes':
      return { ...n('Des traces de roulettes partent du socle et filent vers la porte. Dehors, elles tournent vers l’ouest.'), clue: 'roulettes' };
    case 'bacheRobot':
      return {
        lines: [
          p('Vous', 'Une grande forme est dissimulée sous une bâche grise, entre deux squelettes en plastique…'),
          p('Vous', 'Vous soulevez la bâche… NOVA-7 ! Le robot volé ! Ses diodes clignotent doucement, il est intact.'),
          p('Vous', "Il est temps d'aller dire deux mots à l'agent Pixel."),
        ],
        clue: 'robot',
      };
    case 'balancoires':
      return n('Des balançoires fraîchement repeintes se balancent doucement dans la brise. Le jardin est paisible.');
    case 'bambous':
      return n('Une bambouseraie dense et odorante. On dit que les bambous de Quest poussent d’un mètre par nuit.');
    case 'canards':
      return n('La pêche aux canards. Les canards en plastique tournent en rond, imperturbables. L’un d’eux vous fixe.');
    case 'comete':
      return n('« La Comète hurlante » — le manège à sensations fortes du parc. Les tickets sont rouge vif… comme celui trouvé dans l’usine.');
    case 'carrousel':
      return n('Le vieux carrousel du parc. Ses chevaux mécaniques hennissent un air électronique.');
    case 'tir':
      return n('Le stand de tir à l’arc. Trois flèches plantées à côté de la cible. Quelqu’un manque d’entraînement.');
    case 'ruines':
      return n('Des pans de murs effondrés, à moitié ensevelis sous le sable. Le sud de Quest a connu des jours meilleurs.');
    case 'fontaine':
      return n('La fontaine de la place. L’eau y coule en spirales impossibles : technologie de Quest oblige.');
    case 'machines':
      return n('Les chaînes d’assemblage de RoboCorp. Des bras articulés assemblent des robots humanoïdes en silence.');
    case 'vitrine':
      return n('Des vitrines du centre commercial : hologrammes de mode, gadgets lumineux et parapluies anti-drones.');
    case 'fantome':
      return n('Un faux fantôme pendu au plafond. Il fait moins peur de près.');
    case 'caisse':
      return n('Une grande caisse de transport à roulettes, estampillée « RoboCorp ». La roue avant droite grince.');
    default:
      return null;
  }
}

export const LOCKED_DOOR_MSG = 'La porte de la maison hantée est verrouillée. Victor la surveille de près…';

export function accusationResult(id) {
  switch (id) {
    case 'victor':
      if (hasClue('robot')) {
        return { win: true };
      }
      return { lines: [p('Agent Pixel', 'Victor ? Possible… mais sans NOVA-7, il niera tout en bloc. Retrouvez d’abord le robot, détective !')] };
    case 'marcus':
      return { lines: [p('Agent Pixel', 'Marcus ? Il traînait dehors cette nuit, c’est vrai… mais observer n’est pas voler. Et il n’aurait jamais pu ouvrir la vitrine.')] };
    case 'nadia':
      return { lines: [p('Agent Pixel', 'Nadia ? Licenciée de RoboCorp, certes… mais elle a passé la nuit à l’inventaire du Grand Centre, le vigile le confirme.')] };
    case 'ray':
      return { lines: [p('Agent Pixel', 'Ray ? S’endormir pendant sa garde n’est pas un crime… enfin, pas celui-là. Il n’a rien à gagner à voler ce qu’il protège.')] };
    case 'mercier':
      return { lines: [p('Agent Pixel', 'Le directeur Mercier ? Voler son propre robot ? C’est lui qui nous a alertés à l’aube, en larmes. Cherchez encore.')] };
    default:
      return { lines: [p('Agent Pixel', 'Hmm. Il me faut un nom, détective.')] };
  }
}

export const WIN_TEXT = 'Confondu par le témoignage de Grillon et la découverte de NOVA-7 sous sa bâche, Victor avoue : il rêvait de faire du robot la plus grande attraction de Quest. NOVA-7 retrouve son socle, la ville retrouve son calme… et vous, votre réputation de fin limier. FIN';

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
  alibi: {
    title: 'Alibi de Nadia',
    desc: 'Gustave, le vigile du Grand Centre, confirme : Nadia a passé toute la nuit du vol à l’inventaire, badge pointé de 22 h à 6 h. Elle est hors de cause.',
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
        flagSet: 'vuMercier',
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
            p('Victor', "Vous l'avez vu, hein ? Il est magnifique… Je voulais la plus grande attraction de Quest, un vrai robot dans ma maison hantée !"),
            p('Victor', 'Il est intact, je le jure ! Je… je comptais le rendre. Un jour. Peut-être.'),
          ],
        };
      }
      if (flag('aveux')) {
        return { lines: [p('Victor', "Allez-y, entrez… Il est au fond, sous la bâche. Intact, je le jure. Soyez doux avec lui.")] };
      }
      if (hasClue('grillon') && hasClue('bache')) {
        return {
          lines: [
            p('Victor', "L'enregistrement de Grillon ET la facture de la bâche ?… Vous ne me laissez aucune sortie."),
            p('Victor', "D'accord, d'accord ! C'est moi qui suis entré dans l'usine. Mais je n'ai rien VOLÉ, j'ai… emprunté. Pour l'art !"),
            p('Victor', 'Tenez, je déverrouille la maison hantée. Vous verrez par vous-même : il est intact.'),
          ],
          flagSet: 'aveux',
        };
      }
      if (hasClue('grillon')) {
        return {
          lines: [
            p('Victor', 'Un animatronique ! Ce robot à marrons raconte n’importe quoi, ses circuits ont pris l’humidité !'),
            p('Victor', "Sans preuve solide, personne n'entrera chez moi. PERSONNE, vous m'entendez ?"),
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

    case 'gustave': {
      if (hasClue('bache') && !hasClue('alibi')) {
        return {
          lines: [
            p('Gustave', 'Vigile du Grand Centre, pour vous servir. Trente-deux caméras, et moi.'),
            p('Gustave', "Nadia ? La nuit du vol, elle était à l'inventaire. Badge pointé à 22 h, ressortie à 6 h. Personne ne quitte le centre sans que je le sache."),
            p('Gustave', 'Si vous cherchez votre voleur, il n’est pas ici, détective.'),
          ],
          clue: 'alibi',
        };
      }
      if (hasClue('alibi')) {
        return { lines: [p('Gustave', 'L’alibi de Nadia est en béton, je vous le confirme. Bonne chasse, détective.')] };
      }
      return {
        lines: [
          p('Gustave', 'Vigile du Grand Centre, pour vous servir. Trente-deux caméras, et moi. Rien ne m’échappe.'),
          p('Gustave', 'Le vol de l’usine ? Triste affaire. Ici en tout cas, la nuit a été calme.'),
        ],
      };
    }

    case 'vanille': {
      return {
        lines: [
          p('Vanille', 'Bip. Glaces ! Vanille-nébuleuse, chocolat-comète ou sorbet plasma. Servies à −18,000 degrés précisément.'),
          p('Vanille', 'Les affaires sont calmes depuis le vol… les clients ont peur. Retrouvez le coupable, détective, bip.'),
        ],
      };
    }

    case 'bosquet': {
      const lines = [
        p('Bosquet', 'Bip. Jardinier en chef du Grand Jardin. Trois mille deux cent quatre fleurs, et je les connais toutes par leur petit nom.'),
        p('Bosquet', 'Les bambous poussent d’un mètre par nuit, il faut bien quelqu’un pour les surveiller. Bip.'),
      ];
      if (hasClue('marcus') || hasClue('grillon')) {
        lines.push(p('Bosquet', 'Curieux, tout de même : le mois dernier, Victor m’a demandé un devis pour une haie « très opaque » autour de sa maison hantée. Bip.'));
      }
      return { lines };
    }

    case 'faucon': {
      const lines = [
        p('Faucon', 'Bip. Tir à l’arc ! Trois flèches pour un crédit. Mes capteurs mesurent le vent au millimètre près.'),
        p('Faucon', 'Le gros lot ? L’ours en peluche géant. Victor le gagne à chaque fois… il ne rate jamais sa cible, celui-là.'),
      ];
      if (hasClue('grillon')) {
        lines.push(p('Faucon', 'Grillon voit tout, moi je ne vois que les cibles. Chacun son objectif, bip.'));
      }
      return { lines };
    }

    case 'praline': {
      const lines = [
        p('Praline', 'Bip. Barbe à papa ! Un nuage rose pour deux crédits. Filée à la perfection par mes trois cent tours-minute.'),
        p('Praline', 'Mon secret ? Un soupçon de sucre de bambou du grand jardin. Chut, bip.'),
      ];
      if (hasClue('marcus') || hasClue('grillon')) {
        lines.push(p('Praline', 'Victor dit que mes nuages roses cacheraient n’importe quoi… Il adore cacher des choses, celui-là. Bip.'));
      }
      return { lines };
    }

    case 'b12': case 'c3': case 'z9': case 'k7': {
      const nom = { b12: 'Unité B-12', c3: 'Unité C-3', z9: 'Unité Z-9', k7: 'Unité K-7' }[id];
      const phrases = [
        'Bip. Belle journée pour patrouiller dans Quest, non ?',
        'Bip-bip. Mes pas sont comptés : 8 412 aujourd’hui. Un record.',
        'Bip. NOVA-7 est notre grand frère à tous. Retrouvez-le, détective.',
        'Bip. J’ai été assemblé à l’usine RoboCorp, comme tous les robots de la ville.',
        'Bip. Rien à signaler dans mon secteur. Enfin… je crois.',
        'Bip. Les humains marchent d’une drôle de façon. Sans vous vexer.',
      ];
      const i = (Math.floor(Date.now() / 8000) + id.length) % phrases.length;
      return { lines: [p(nom, phrases[i])] };
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
    case 'tamponneuses':
      return n('La piste d’autos tamponneuses. Les voitures se rechargent sur leurs bornes… et semblent piaffer d’impatience.');
    case 'chute':
      return n('« La Chute Libre » : la nacelle grimpe leeeentement… puis tombe d’un coup. Les hurlements font partie de l’expérience.');
    case 'roue':
      return n('La Grande Roue de Quest. De là-haut, on voit toute la ville — et même le toit de l’usine RoboCorp, paraît-il.');
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
    case 'banc':
      return n('Un banc public fraîchement repeint. Parfait pour s’asseoir et réfléchir aux indices.');
    case 'etang':
      return n('L’étang aux nénuphars. Des poissons bioluminescents tracent des spirales bleutées sous le pont de bois. Une grenouille vous fixe, imperturbable.');
    case 'kiosque':
      return n('Le kiosque à musique du jardin. Ses haut-parleurs diffusent la mélodie de la ville en sourdine, pour les fleurs.');
    case 'labyrinthe':
      return n('L’entrée du labyrinthe de haies. Les buissons sont taillés au laser chaque matin, paraît-il. Quelque chose se cache au centre…');
    case 'topiaire':
      return n('Au cœur du labyrinthe : une topiaire en forme de robot, taillée à la perfection. On jurerait qu’elle vous salue.');
    case 'statuerobot':
      return n('Une statue de pierre : un robot ouvrier tenant une fleur. L’inscription : « À ceux qui ont construit Quest. »');
    case 'statuechat':
      return n('Une statue de chat, patte levée. L’inscription dit simplement : « Miaou. » Rien d’autre.');
    case 'oiseaux':
      return n('Une fontaine à oiseaux. Deux moineaux mécaniques s’y baignent en pépiant des notes électroniques.');
    case 'statue':
      return n('La statue des fondateurs de Quest : un humain et un robot, main dans la main. « Ensemble, nous avons bâti demain. »');
    case 'affiche':
      return n('Un panneau holographique : « RECHERCHÉ : NOVA-7. Récompense offerte par la mairie. » Le maire a l’air furieux.');
    case 'distributeur':
      return n('Un distributeur lumineux. Il vous propose un « Cola Quantique » à un prix indécent. Vous déclinez poliment.');
    case 'poubelle':
      return n('Une poubelle de tri à lévitation. Vous fouillez… rien d’intéressant. Vous vous essuyez discrètement les mains.');
    case 'chateau':
      return n('Un château de sable étonnamment détaillé : donjon, remparts, pont-levis. Un artiste hante le quartier sud.');
    case 'barque':
      return n('Une vieille barque échouée, à moitié ensevelie sous le sable. Le sud de Quest n’a pas toujours été un désert…');
    case 'feu':
      return n('Le campement de Marcus : un feu de camp bien entretenu et une théière cabossée. Tout est propre et ordonné.');
    case 'caddie':
      return n('Un caddie abandonné au milieu de l’allée. Ses roues grincent… mais pas comme celles de la caisse volée.');
    case 'confiserie':
      return n('Le stand de barbe à papa. Des nuages roses tournent doucement derrière la vitre. Ça sent le sucre chaud.');
    case 'glaces':
      return n('Le stand de glaces du food court. Le congélateur chantonne une berceuse en binaire.');
    case 'table':
      return n('Une table du food court. Quelqu’un a gravé « R + N » dans le plastique. Tiens, tiens.');
    case 'jouets':
      return n('La vitrine du magasin de jouets : des mini-robots dansent en boucle. L’un d’eux ressemble beaucoup à NOVA-7.');
    case 'photomaton':
      return n('Un photomaton. L’écran propose un filtre « détective ». Vous résistez héroïquement.');
    case 'plan':
      return n('Le plan holographique du centre : boutiques, food court, fontaine à vœux… et une sortie de service côté ouest.');
    case 'rideau':
      return n('Un magasin fermé par un rideau de fer poussiéreux. « Réouverture bientôt », promet l’affiche. Depuis longtemps, visiblement.');
    case 'mosaique':
      return n('Une grande mosaïque incrustée dans le sol : des tesselles cyan et or dessinent la ville de Quest, ses robots et son usine. Magnifique.');
    case 'voeux':
      return n('La fontaine à vœux du Grand Centre. Vous lancez une pièce : « Que l’enquête aboutisse. » Ploc.');
    case 'fantome':
      return n('Un faux fantôme pendu au plafond. Il fait moins peur de près.');
    case 'caisse':
      return n('Une grande caisse de transport à roulettes, estampillée « RoboCorp ». La roue avant droite grince.');
    default:
      return null;
  }
}

export const LOCKED_DOOR_MSG = 'La maison hantée est verrouillée. Victor n’ouvrira que si vous le confondez avec des preuves solides…';

/** Objets examinables qui rapportent un indice (pour les marqueurs à l'écran). */
export const POI_CLUES = {
  sable: 'sable',
  ticket: 'ticket',
  roulettes: 'roulettes',
  bacheRobot: 'robot',
};

/** Conseil à la demande : la prochaine étape logique de l'enquête. */
export function nextHint() {
  if (state.solved) {
    return 'L’affaire est classée ! Promenez-vous, Quest regorge de recoins à explorer.';
  }
  if (!flag('mission')) {
    return 'Commencez par parler à l’agent Pixel, devant l’usine RoboCorp, au centre de la ville.';
  }
  if (!hasClue('sable') || !hasClue('ticket') || !hasClue('roulettes')) {
    return 'Fouillez la scène du crime dans l’usine : examinez tout ce qui entoure le socle vide (une loupe cyan signale les indices).';
  }
  if (!hasClue('ray')) {
    return 'Le gardien de nuit de l’usine était de service. Il a bien dû entendre quelque chose…';
  }
  if (!hasClue('marcus')) {
    return 'Du sable au pied du socle… Quelqu’un vit dans le quartier des sables, au sud, et rôde la nuit. Allez lui parler.';
  }
  if (!hasClue('grillon')) {
    return 'Au parc d’attractions, le robot à marrons chauds enregistre tout, jour et nuit. Ses capteurs valent tous les témoins.';
  }
  if (!hasClue('bache')) {
    return 'Une grande caisse, ça se cache sous une grande bâche. Qui vend ce genre de choses à Quest ? Faites un tour au Grand Centre.';
  }
  if (!flag('aveux')) {
    return 'Témoignage de Grillon plus facture de la bâche : vous avez de quoi confondre Victor, devant la maison hantée.';
  }
  if (!hasClue('robot')) {
    return 'Victor a déverrouillé la maison hantée. Entrez, et regardez sous la bâche…';
  }
  return 'Vous avez tout en main : retournez voir l’agent Pixel et accusez le coupable.';
}

/** Un personnage a-t-il du nouveau à dire (marqueur « ! » au-dessus de la tête) ? */
export function npcHasNews(id) {
  const piste = hasClue('roulettes') || hasClue('ray') || hasClue('marcus');
  switch (id) {
    case 'pixel':
      return !flag('mission') || (hasClue('robot') && !state.solved);
    case 'mercier':
      return flag('mission') && !flag('vuMercier');
    case 'ray':
      return flag('mission') && !hasClue('ray');
    case 'marcus':
      return flag('mission') && !hasClue('marcus');
    case 'grillon':
      return piste && !hasClue('grillon');
    case 'nadia':
      return (piste || hasClue('grillon')) && !hasClue('bache');
    case 'victor':
      return hasClue('grillon') && hasClue('bache') && !flag('aveux');
    case 'gustave':
      return hasClue('bache') && !hasClue('alibi');
    default:
      return false;
  }
}

export function accusationResult(id) {
  if (state.clues.length < 3) {
    return { lines: [p('Agent Pixel', 'Doucement, détective ! Votre carnet est presque vide. Enquêtez d’abord : la scène du crime vous attend dans l’usine. On accuse ensuite.')] };
  }
  switch (id) {
    case 'victor':
      if (hasClue('robot')) {
        return { win: true };
      }
      if (flag('aveux')) {
        return { lines: [p('Agent Pixel', 'Victor a avoué ?! Alors il ne manque que le corps du délit. Entrez dans la maison hantée et retrouvez NOVA-7 : avec le robot, son compte est bon.')] };
      }
      if (hasClue('grillon')) {
        return { lines: [p('Agent Pixel', 'Le témoignage de Grillon l’accable… mais Victor niera tout en bloc. Trouvez de quoi le confondre en face, puis revenez me voir.')] };
      }
      return { lines: [p('Agent Pixel', 'Victor, le forain ? Peut-être… mais rien dans votre carnet ne le relie au vol pour l’instant. Continuez à creuser.')] };
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

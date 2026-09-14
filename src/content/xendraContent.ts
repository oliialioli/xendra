import type { XendraContent } from '../types/content';
import { LANDMARK_INTERACTION_RADIUS, LANDMARK_POSITIONS } from './mapGeometry';

/**
 * Single source of truth for every editable string in the experience.
 * Content is in Euskera (Basque) throughout. See docs/CONTENT.md for the
 * full list of TODO_CONTENT items to replace.
 *
 * TODO_CONFIRM_ALBUM_TITLE: source material is inconsistent between "Bia" and
 * "Bihia". "Bihia" is used provisionally everywhere via `album.albumTitle`.
 * Update this single field once confirmed -- never duplicate the title in components.
 */
const albumTitle = 'Bihia'; // TODO_CONFIRM_ALBUM_TITLE

export const xendraContent: XendraContent = {
  band: {
    name: 'Xendra',
    originText:
      'Xendra hitza nafar euskara zaharreko hitz batetik dator, bide, senda edo bidezidor bat adierazteko.', // TODO_CONTENT: etimologia zehatza taldearekin berretsi
    tagline: 'Aurkitzeko bidea.', // TODO_CONTENT: sarrerako esaldi definitiboa
    entrySubtitle: 'Zeharkatu uhartea, aurkitu musika.', // TODO_CONTENT
  },

  members: [
    { id: 'member-1', name: 'TODO_CONTENT: izena', pronouns: 'TODO_CONTENT', instrument: 'Biolina', bio: 'TODO_CONTENT: biografia laburra.', photoPath: null },
    { id: 'member-2', name: 'TODO_CONTENT: izena', pronouns: 'TODO_CONTENT', instrument: 'Biolontxeloa', bio: 'TODO_CONTENT: biografia laburra.', photoPath: null },
    { id: 'member-3', name: 'TODO_CONTENT: izena', pronouns: 'TODO_CONTENT', instrument: 'Bateria', bio: 'TODO_CONTENT: biografia laburra.', photoPath: null },
    { id: 'member-4', name: 'TODO_CONTENT: izena', pronouns: 'TODO_CONTENT', instrument: 'Gitarra akustikoa', bio: 'TODO_CONTENT: biografia laburra.', photoPath: null },
    { id: 'member-5', name: 'TODO_CONTENT: izena', pronouns: 'TODO_CONTENT', instrument: 'Gitarra elektrikoa', bio: 'TODO_CONTENT: biografia laburra.', photoPath: null },
    { id: 'member-6', name: 'TODO_CONTENT: izena', pronouns: 'TODO_CONTENT', instrument: 'Baxua', bio: 'TODO_CONTENT: biografia laburra.', photoPath: null },
    { id: 'member-7', name: 'TODO_CONTENT: izena', pronouns: 'TODO_CONTENT', instrument: 'Pianoa', bio: 'TODO_CONTENT: biografia laburra.', photoPath: null },
  ],

  album: {
    albumTitle,
    albumTitleTodo: 'TODO_CONFIRM_ALBUM_TITLE: berretsi "Bia" ala "Bihia"',
    coverPath: null,
    credits: 'TODO_CONTENT: diskoaren kredituak.',
    externalLinks: [],
    tracks: Array.from({ length: 8 }, (_, index) => ({
      id: `track-${index + 1}`,
      index: index + 1,
      title: `TODO_CONTENT: ${index + 1}. abestia`,
      durationLabel: '--:--',
      previewUrl: null,
      fullTrackUrl: null,
    })),
  },

  concerts: [],

  merch: [
    { id: 'merch-1', name: 'TODO_CONTENT: kamiseta', imagePath: null, priceLabel: null, available: false, ctaMode: 'comingSoon', ctaUrl: null },
    { id: 'merch-2', name: 'TODO_CONTENT: disko fisikoa', imagePath: null, priceLabel: null, available: false, ctaMode: 'comingSoon', ctaUrl: null },
    { id: 'merch-3', name: 'TODO_CONTENT: posterra', imagePath: null, priceLabel: null, available: false, ctaMode: 'comingSoon', ctaUrl: null },
  ],

  history: [
    { id: 'history-1', year: 'TODO_CONTENT', title: 'TODO_CONTENT: taldearen jatorria', description: 'TODO_CONTENT: Xendra nola sortu zen.' },
    { id: 'history-2', year: 'TODO_CONTENT', title: 'TODO_CONTENT: lehen abestiak', description: 'TODO_CONTENT.' },
    { id: 'history-3', year: 'TODO_CONTENT', title: `TODO_CONTENT: diskoaren grabaketa`, description: 'TODO_CONTENT.' },
  ],

  media: [],

  contact: {
    email: null, // TODO_CONTENT: kontaktu/kontratazio emaila
    contactMode: 'mailtoLink',
    reasons: [
      { id: 'booking', label: 'Kontratazioa / kontzertuak' },
      { id: 'press', label: 'Prentsa' },
      { id: 'general', label: 'Beste bat' },
    ],
    socialLinks: [], // TODO_CONTENT: benetako sare sozialen estekak
  },

  kiosk: {
    greetingTodo: 'TODO_CONTENT: testu zehatza berretsi («Aupa, egun on!» behin-behinekoa)',
  },

  landmarks: [
    {
      id: 'kiosk',
      route: '/merch',
      title: 'Kioskoa',
      shortLabel: 'Salgaiak',
      description: 'Xendraren kioskoa, taldearen berritasunekin.',
      position: LANDMARK_POSITIONS.kiosk,
      interactionRadius: LANDMARK_INTERACTION_RADIUS,
    },
    {
      id: 'stage',
      route: '/conciertos',
      title: 'Eszenatoki txikia',
      shortLabel: 'Kontzertuak',
      description: 'Xendrak eszenatokira igotzen den lekua. Hurrengo kontzertuak.',
      position: LANDMARK_POSITIONS.stage,
      interactionRadius: LANDMARK_INTERACTION_RADIUS,
    },
    {
      id: 'school',
      route: '/musica',
      title: 'Musika eskola',
      shortLabel: 'Musika',
      description: `${albumTitle} diskoa eta bere zortzi abestiak.`,
      position: LANDMARK_POSITIONS.school,
      interactionRadius: LANDMARK_INTERACTION_RADIUS,
    },
    {
      id: 'fountain',
      route: '/grupo',
      title: 'Iturri zirkularra',
      shortLabel: 'Taldea',
      description: 'Xendraren zazpi kideak, plazan bilduta.',
      position: LANDMARK_POSITIONS.fountain,
      interactionRadius: LANDMARK_INTERACTION_RADIUS,
    },
    {
      id: 'trainHistory',
      route: '/historia',
      title: 'Trenbideak, Irati trena eta sua',
      shortLabel: 'Historia',
      description: 'Xendraren ibilbidea, suaren ondoan kontatua.',
      position: LANDMARK_POSITIONS.trainHistory,
      interactionRadius: LANDMARK_INTERACTION_RADIUS,
    },
    {
      id: 'bulletinBoard',
      route: '/archivo',
      title: 'Iragarki-taula',
      shortLabel: 'Argazkiak eta bideoak',
      description: 'Xendraren artxibo bisuala.',
      position: LANDMARK_POSITIONS.bulletinBoard,
      interactionRadius: LANDMARK_INTERACTION_RADIUS,
    },
    {
      id: 'fronton',
      route: '/notas',
      title: 'Frontoiaren atea',
      shortLabel: 'Oharrak',
      description: 'Uhartea bisitatzen dutenek utzitako ohar laburrak.',
      position: LANDMARK_POSITIONS.fronton,
      interactionRadius: LANDMARK_INTERACTION_RADIUS,
    },
    {
      id: 'postbox',
      route: '/contacto',
      title: 'Postontzi horia',
      shortLabel: 'Kontaktua',
      description: 'Kontaktu orokorra eta kontratazioa.',
      position: LANDMARK_POSITIONS.postbox,
      interactionRadius: LANDMARK_INTERACTION_RADIUS,
    },
  ],
};

export const landmarkById = new Map(xendraContent.landmarks.map((l) => [l.id, l]));

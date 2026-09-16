import type { XendraContent } from '../types/content';
import { FOUNTAIN_INTERACTION_RADIUS, LANDMARK_INTERACTION_RADIUS, LANDMARK_POSITIONS } from './mapGeometry';
import { dockConfig } from './dockConfig';

/**
 * Single source of truth for every editable string in the experience.
 * Content is in Euskera (Basque) throughout. See docs/CONTENT.md for the
 * full list of TODO_CONTENT items to replace.
 */
const albumTitle = 'Bihia'; // confirmed via badok.eus and Apple Music

export const xendraContent: XendraContent = {
  band: {
    name: 'Xendra',
    originText:
      'Xendra hitza nafar euskara zaharreko hitz batetik dator, bide, senda edo bidezidor bat adierazteko.', // TODO_CONTENT: etimologia zehatza taldearekin berretsi
    bio:
      'Xendra Uharten (Nafarroa) sortutako sorkuntza proiektu bat da, pixkanaka osatzen joan den zazpi gazteren taldea: egunerokoan elkarrekin musika sortu eta jotzen dute. Folk, pop eta rock estiloak nahasten dituzte euren kantuetan. Bakoitzaren bizipenetatik abiatuta, taldeak euskarazko kantuak proposatzen ditu, ahal den heinean gai unibertsalak jorratuz.',
    tagline: 'Aurkitzeko bidea.', // TODO_CONTENT: sarrerako esaldi definitiboa
    entrySubtitle: 'Zeharkatu uhartea, aurkitu musika.', // TODO_CONTENT
  },

  members: [
    { id: 'member-1', name: 'Leire Diges Izco', pronouns: 'TODO_CONTENT', instrument: 'Ahotsa eta gitarra', bio: 'TODO_CONTENT: biografia laburra.', photoPath: '/assets/members/leire-diges.jpg' },
    { id: 'member-2', name: 'Iratxo Gorostiza Etxeberria', pronouns: 'TODO_CONTENT', instrument: 'Gitarra eta ahotsa', bio: 'TODO_CONTENT: biografia laburra.', photoPath: '/assets/members/iratxo.jpg' },
    { id: 'member-3', name: 'Leire Gorostiza Etxeberria', pronouns: 'TODO_CONTENT', instrument: 'Biolina', bio: 'TODO_CONTENT: biografia laburra.', photoPath: '/assets/members/leire-gorostiza.jpg' },
    { id: 'member-4', name: 'Ainhoa Bandres Abadía', pronouns: 'TODO_CONTENT', instrument: 'Txeloa', bio: 'TODO_CONTENT: biografia laburra.', photoPath: '/assets/members/ainhoa.jpg' },
    { id: 'member-5', name: 'Iker Andueza Gil', pronouns: 'TODO_CONTENT', instrument: 'Baxua', bio: 'TODO_CONTENT: biografia laburra.', photoPath: '/assets/members/iker.jpg' },
    { id: 'member-6', name: 'Laida Beltzunegi Landa', pronouns: 'TODO_CONTENT', instrument: 'Teklatua', bio: 'TODO_CONTENT: biografia laburra.', photoPath: '/assets/members/laida.jpg' },
    { id: 'member-7', name: 'Ion Galbete Labiano', pronouns: 'TODO_CONTENT', instrument: 'Bateria eta koroak', bio: 'TODO_CONTENT: biografia laburra.', photoPath: '/assets/members/ion.jpg' },
  ],

  album: {
    albumTitle,
    coverPath: '/assets/music/bihia-azala.jpg',
    credits:
      'SIMA estudioan grabatua eta nahastua (Irunberri, Nafarroa), Ibai Osinagaren laguntzaz. Masterizazioa: Martxel Arkarazo (Garate estudioak, Andoain). 2025eko urtarrilaren 9an atera zen.',
    externalLinks: [{ label: 'Apple Music', url: 'https://music.apple.com/es/album/bihia/1785223280' }],
    tracks: [
      'Amilena',
      'Belar txarrak',
      'Lurrazala',
      'Hor',
      'Errauts eskuak',
      'Erregai',
      'Hura',
      'Bakoitzari berea',
    ].map((title, index) => ({
      id: `track-${index + 1}`,
      index: index + 1,
      title,
      durationLabel: '--:--', // TODO_CONTENT: iraupen zehatzak (ez daude ez badok.eus ez Apple Music-en agerian)
      previewUrl: null,
      fullTrackUrl: null,
    })),
  },

  concerts: [
    { id: 'concert-2026-09-24', city: 'Uharte', venue: 'Berdintasuna', date: '2026-09-24', time: null, status: 'upcoming', ticketsUrl: null },
    { id: 'concert-2026-09-26', city: 'Barakaldo', venue: '', date: '2026-09-26', time: null, status: 'upcoming', ticketsUrl: null },
    { id: 'concert-2026-08-16', city: 'Tafalla', venue: '', date: '2026-08-16', time: null, status: 'past', ticketsUrl: null },
    { id: 'concert-2026-08-14', city: 'Erronkari', venue: '', date: '2026-08-14', time: null, status: 'past', ticketsUrl: null },
    { id: 'concert-2026-08-13', city: 'Amurrio', venue: '', date: '2026-08-13', time: null, status: 'past', ticketsUrl: null },
    { id: 'concert-2026-05-16', city: 'Artzibar', venue: '', date: '2026-05-16', time: null, status: 'past', ticketsUrl: null },
    { id: 'concert-2026-03-28', city: 'Laudio', venue: '', date: '2026-03-28', time: null, status: 'past', ticketsUrl: null },
    { id: 'concert-2026-03-25', city: 'Iruñea', venue: 'Herriko Taberna', date: '2026-03-25', time: null, status: 'past', ticketsUrl: null },
    { id: 'concert-2026-02-06', city: 'Geltoki', venue: '', date: '2026-02-06', time: null, status: 'past', ticketsUrl: null },
    { id: 'concert-2025-08-22', city: 'Hiriberri', venue: '', date: '2025-08-22', time: null, status: 'past', ticketsUrl: null },
    { id: 'concert-2025-06-27', city: 'Lekeitio', venue: '', date: '2025-06-27', time: null, status: 'past', ticketsUrl: null },
    { id: 'concert-2025-06-26', city: 'Oñati', venue: '', date: '2025-06-26', time: null, status: 'past', ticketsUrl: null },
    { id: 'concert-2025-06-19', city: 'Erraldoien txokoa', venue: '', date: '2025-06-19', time: null, status: 'past', ticketsUrl: null },
    { id: 'concert-2025-05-25', city: 'Arrosadia', venue: '', date: '2025-05-25', time: null, status: 'past', ticketsUrl: null },
    { id: 'concert-2025-05-04', city: 'Zuia', venue: '', date: '2025-05-04', time: null, status: 'past', ticketsUrl: null },
    { id: 'concert-2025-04-25', city: 'Akelarre Kultur Elkartea', venue: '', date: '2025-04-25', time: null, status: 'past', ticketsUrl: null },
    { id: 'concert-2025-04-05', city: 'Uharteko kultur etxea', venue: '', date: '2025-04-05', time: null, status: 'past', ticketsUrl: null },
  ],

  merch: [
    { id: 'merch-1', name: 'Kamiseta naturala', imagePath: '/assets/merch/kamiseta-naturala.jpg', priceLabel: null, available: false, ctaMode: 'comingSoon', ctaUrl: null },
    { id: 'merch-2', name: 'Kamiseta urdin iluna', imagePath: '/assets/merch/kamiseta-urdina.jpg', priceLabel: null, available: false, ctaMode: 'comingSoon', ctaUrl: null },
  ],

  history: [
    { id: 'history-1', year: 'TODO_CONTENT', title: 'Xendraren sorrera', description: 'Bikote moduan hasitako proiektua da Xendra, pixkanaka handituz joan dena harik eta Uharten (Nafarroa) egoitza duen gaur egungo zazpikotea osatu arte.' },
    { id: 'history-2', year: 'TODO_CONTENT', title: 'Abestiak prestatzen', description: 'Urtebete inguru eman zuten elkarrekin kantuak sortzen eta lantzen, diskoa grabatu aurretik.' },
    { id: 'history-3', year: '2024', title: `"${albumTitle}" diskoaren grabaketa`, description: `2024ko uztailean grabatu zuten beraien lehen diskoa, "${albumTitle}" izenpean, SIMA estudioan, Ibai Osinagaren laguntzaz.` },
    { id: 'history-4', year: '2025', title: `"${albumTitle}" diskoaren argitalpena`, description: `2025eko urtarrilaren 9an atera zuten "${albumTitle}" diskoa.` },
    { id: 'history-5', year: '2026', title: 'Bira', description: '"Bihia" diskoa aurkezten, kontzertu bira eskaintzen dabiltza; besteak beste, Artziko Jauregian jo zuten 2026ko maiatzaren 16an.' },
  ],

  media: [
    { id: 'photo-01', kind: 'photo', thumbnailPath: '/assets/media/photo-01.jpg', fullPath: '/assets/media/photo-01.jpg', altText: 'Bi taldekide oholtzan, kontzertu baten ondoren' },
    { id: 'photo-02', kind: 'photo', thumbnailPath: '/assets/media/photo-02.jpg', fullPath: '/assets/media/photo-02.jpg', altText: 'Taldea barrezka, kontzertu baten aurretik' },
    { id: 'photo-03', kind: 'photo', thumbnailPath: '/assets/media/photo-03.jpg', fullPath: '/assets/media/photo-03.jpg', altText: 'Xendra zuzenean, gitarra eta ahotsa' },
    { id: 'photo-04', kind: 'photo', thumbnailPath: '/assets/media/photo-04.jpg', fullPath: '/assets/media/photo-04.jpg', altText: 'Zazpikotea osorik oholtzan' },
    { id: 'photo-05', kind: 'photo', thumbnailPath: '/assets/media/photo-05.jpg', fullPath: '/assets/media/photo-05.jpg', altText: 'Jendea kontzertu baten aurretik, zuri-beltzean' },
    { id: 'photo-06', kind: 'photo', thumbnailPath: '/assets/media/photo-06.jpg', fullPath: '/assets/media/photo-06.jpg', altText: 'Xendra zuzenean, zuri-beltzean' },
    { id: 'photo-07', kind: 'photo', thumbnailPath: '/assets/media/photo-07.jpg', fullPath: '/assets/media/photo-07.jpg', altText: 'Taldekideak, kontzertu baten aurretik' },
    { id: 'photo-08', kind: 'photo', thumbnailPath: '/assets/media/photo-08.jpg', fullPath: '/assets/media/photo-08.jpg', altText: 'Xendra zuzenean, aire zabalean' },
    { id: 'photo-09', kind: 'photo', thumbnailPath: '/assets/media/photo-09.jpg', fullPath: '/assets/media/photo-09.jpg', altText: 'Gitarra-jolea zuzenean, zuri-beltzean' },
    { id: 'photo-10', kind: 'photo', thumbnailPath: '/assets/media/photo-10.jpg', fullPath: '/assets/media/photo-10.jpg', altText: 'Xendra zuzenean, argi gorriekin' },
    { id: 'photo-11', kind: 'photo', thumbnailPath: '/assets/media/photo-11.jpg', fullPath: '/assets/media/photo-11.jpg', altText: 'Kontzertu baten girotik' },
    { id: 'photo-12', kind: 'photo', thumbnailPath: '/assets/media/photo-12.jpg', fullPath: '/assets/media/photo-12.jpg', altText: 'Xendra zuzenean, kalean gauean' },
    { id: 'photo-13', kind: 'photo', thumbnailPath: '/assets/media/photo-13.jpg', fullPath: '/assets/media/photo-13.jpg', altText: 'Gitarra eta biolontxeloa, kontzertu batean' },
    { id: 'photo-14', kind: 'photo', thumbnailPath: '/assets/media/photo-14.jpg', fullPath: '/assets/media/photo-14.jpg', altText: 'Biolina eta biolontxeloa, kontzertu batean' },
    { id: 'photo-15', kind: 'photo', thumbnailPath: '/assets/media/photo-15.jpg', fullPath: '/assets/media/photo-15.jpg', altText: 'Xendra kalean, jendartearekin' },
    { id: 'photo-16', kind: 'photo', thumbnailPath: '/assets/media/photo-16.jpg', fullPath: '/assets/media/photo-16.jpg', altText: 'Xendra zuzenean, landareen artean' },
    { id: 'photo-17', kind: 'photo', thumbnailPath: '/assets/media/photo-17.jpg', fullPath: '/assets/media/photo-17.jpg', altText: 'Xendra zuzenean, jendartearen aurrean' },
    { id: 'photo-18', kind: 'photo', thumbnailPath: '/assets/media/photo-18.jpg', fullPath: '/assets/media/photo-18.jpg', altText: 'Xendra zuzenean, jendartea aurrean duela' },
    { id: 'photo-19', kind: 'photo', thumbnailPath: '/assets/media/photo-19.jpg', fullPath: '/assets/media/photo-19.jpg', altText: 'Bateria-jolea zuzenean, zuri-beltzean' },
    { id: 'video-01', kind: 'video', thumbnailPath: '/assets/media/video-01-poster.jpg', fullPath: '/assets/media/video-01.mp4', altText: 'Xendra zuzenean, oholtza gainean' },
    { id: 'video-02', kind: 'video', thumbnailPath: '/assets/media/video-02-poster.jpg', fullPath: '/assets/media/video-02.mp4', altText: 'Xendra zuzenean, biolinarekin' },
    { id: 'video-03', kind: 'video', thumbnailPath: '/assets/media/video-03-poster.jpg', fullPath: '/assets/media/video-03.mp4', altText: 'Xendra kalean, kontzertu ttiki batean' },
  ],

  press: [
    {
      id: 'press-1',
      label: 'Xendra taldeko pop-rock doinuek jantziko dute larunbatean Artziko jauregia (Irati Irratia, 2026-05-12)',
      url: 'https://iratiirratia.eus/index.php/2026/05/12/xendra-taldeko-pop-rock-doinuek-jantziko-dute-larunbatean-artziko-jauregia/',
    },
  ],

  contact: {
    email: null, // TODO_CONTENT: kontaktu/kontratazio emaila
    contactMode: 'mailtoLink',
    reasons: [
      { id: 'booking', label: 'Kontratazioa / kontzertuak' },
      { id: 'press', label: 'Prentsa' },
      { id: 'general', label: 'Beste bat' },
    ],
    socialLinks: [
      { label: 'Instagram', url: 'https://www.instagram.com/_xendra_/' },
      { label: 'YouTube', url: 'https://www.youtube.com/channel/UCjGkN3mEifFsobvw9fztmaQ' },
    ],
  },

  kiosk: {
    greetingTodo: 'TODO_CONTENT: testu zehatza berretsi («Aupa, egun on!» behin-behinekoa)',
  },

  landmarks: [
    {
      id: 'kiosk',
      route: '/merch',
      title: 'Kioskoa',
      shortLabel: 'Denda',
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
      interactionRadius: FOUNTAIN_INTERACTION_RADIUS,
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
      id: 'dockMessages',
      route: '/mezuak',
      title: 'Mezuen kaia',
      shortLabel: 'Mezuak',
      description: 'Idatzi mezu bat, marraztu zure ontzia eta bota ibaira.',
      position: LANDMARK_POSITIONS.dockMessages,
      interactionRadius: dockConfig.interactionRadius,
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

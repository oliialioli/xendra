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
    entrySubtitle: 'Zeharkatu uhartea, aurkitu musika.', // TODO_CONTENT
  },

  // Member bios are left empty for now; a card only shows a bio once one is written here.
  members: [
    // Display order: the four on top, then the three below (see GroupPanel).
    { id: 'member-3', name: 'Leire Gorostiza Etxeberria', pronouns: 'TODO_CONTENT', instrument: 'Biolina', bio: '', photoPath: '/assets/members/leire-gorostiza.jpg' },
    { id: 'member-4', name: 'Ainhoa Bandres Abadía', pronouns: 'TODO_CONTENT', instrument: 'Txeloa', bio: '', photoPath: '/assets/members/ainhoa.jpg' },
    { id: 'member-1', name: 'Leire Diges Izco', pronouns: 'TODO_CONTENT', instrument: 'Ahotsa eta gitarra', bio: '', photoPath: '/assets/members/leire-diges.jpg' },
    { id: 'member-2', name: 'Iratxo Gorostiza Etxeberria', pronouns: 'TODO_CONTENT', instrument: 'Gitarra eta ahotsa', bio: '', photoPath: '/assets/members/iratxo.jpg' },
    { id: 'member-6', name: 'Laida Beltzunegi Landa', pronouns: 'TODO_CONTENT', instrument: 'Teklatua', bio: '', photoPath: '/assets/members/laida.jpg' },
    { id: 'member-5', name: 'Iker Andueza Gil', pronouns: 'TODO_CONTENT', instrument: 'Baxua', bio: '', photoPath: '/assets/members/iker.jpg' },
    { id: 'member-7', name: 'Ion Galbete Labiano', pronouns: 'TODO_CONTENT', instrument: 'Bateria eta koroak', bio: '', photoPath: '/assets/members/ion.jpg' },
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
    { id: 'history-2020', year: '2020', description: 'Uharteko 4 lagun entsaio gelan elkartzen hasi ginen inongo helburu zehatzik gabe. Bizpairu kantu sortu eta beste batzuk bertsionatu genituen lehen urteetan. Ondoren ordea, 2 lagunek entsaiatzeari utzi eta pixkanaka taldekide eta instrumentu berriak sartzen joan ziren.' },
    { id: 'history-2024', year: '2024', description: '6 taldekide ginen eta 8 abestiko disko bat grabatzea erabaki genuen. Grabaketa Irunberriko SIMA estudioan egin genuen udan, Ibai Osinagaren laguntzaz.' },
    { id: 'history-2025', year: '2025', description: `Urtarrilean atera genuen “${albumTitle}” deituriko diska. Horrela, lehen kontzertuak ematen hasi ginen, esperientzia oso politak biziz. Urte bukaeran, 7. taldekide bat batu zen gure proiektura.` },
    { id: 'history-2026', year: '2026', description: 'Kontzertu gehiago eman genituen, Euskal Herriko txoko ezberdinak ezagutuz, eta abestei berriak sortzen ere aritu ginen.' },
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
    // Gig posters, oldest first (board thumbnails are 640px; the lightbox loads the full one).
    { id: 'poster-01', kind: 'poster', thumbnailPath: '/assets/media/poster-01-thumb.jpg', fullPath: '/assets/media/poster-01.jpg', altText: '«Physis versus nomos» kartela, Xendra' },
    { id: 'poster-02', kind: 'poster', thumbnailPath: '/assets/media/poster-02-thumb.jpg', fullPath: '/assets/media/poster-02.jpg', altText: 'Xendraren 2025eko biraren kartela, data guztiekin' },
    { id: 'poster-03', kind: 'poster', thumbnailPath: '/assets/media/poster-03-thumb.jpg', fullPath: '/assets/media/poster-03.jpg', altText: 'Xendra Uharten, Kultur Etxean, apirilaren 5ean' },
    { id: 'poster-04', kind: 'poster', thumbnailPath: '/assets/media/poster-04-thumb.jpg', fullPath: '/assets/media/poster-04.jpg', altText: 'Arrosadiako jaiak 2025: kontzertuen kartela' },
    { id: 'poster-05', kind: 'poster', thumbnailPath: '/assets/media/poster-05-thumb.jpg', fullPath: '/assets/media/poster-05.jpg', altText: '«Kantu eta hitza» zikloaren kartela, Iruñean' },
    { id: 'poster-06', kind: 'poster', thumbnailPath: '/assets/media/poster-06-thumb.jpg', fullPath: '/assets/media/poster-06.jpg', altText: 'Xendra Akelarre Kultur Elkartean, apirilaren 25ean' },
    { id: 'poster-07', kind: 'poster', thumbnailPath: '/assets/media/poster-07-thumb.jpg', fullPath: '/assets/media/poster-07.jpg', altText: 'Xendraren aurkezpena, kartel urdinean' },
    { id: 'poster-08', kind: 'poster', thumbnailPath: '/assets/media/poster-08-thumb.jpg', fullPath: '/assets/media/poster-08.jpg', altText: 'Pintxo-potea Gaztetxean, ekainaren 26an' },
    { id: 'poster-09', kind: 'poster', thumbnailPath: '/assets/media/poster-09-thumb.jpg', fullPath: '/assets/media/poster-09.jpg', altText: 'Pintxo pote akustikoa Hiriberri Arakilen, 2025eko abuztuaren 22an' },
    { id: 'poster-10', kind: 'poster', thumbnailPath: '/assets/media/poster-10-thumb.jpg', fullPath: '/assets/media/poster-10.jpg', altText: '«Arrakaletan loratuz» jardunaldien kartela' },
    { id: 'poster-11', kind: 'poster', thumbnailPath: '/assets/media/poster-11-thumb.jpg', fullPath: '/assets/media/poster-11.jpg', altText: 'Herriko Tabernako asteazken akustikoak, martxoan' },
    { id: 'poster-12', kind: 'poster', thumbnailPath: '/assets/media/poster-12-thumb.jpg', fullPath: '/assets/media/poster-12.jpg', altText: 'Udaberriko kontzertua Artziko jauregian, maiatzaren 16an' },
    { id: 'poster-13', kind: 'poster', thumbnailPath: '/assets/media/poster-13-thumb.jpg', fullPath: '/assets/media/poster-13.jpg', altText: 'Tafallako jai herrikoien kartela' },
    { id: 'poster-14', kind: 'poster', thumbnailPath: '/assets/media/poster-14-thumb.jpg', fullPath: '/assets/media/poster-14.jpg', altText: 'Berdintasuna elkartearen jaiak 2026' },
    { id: 'poster-15', kind: 'poster', thumbnailPath: '/assets/media/poster-15-thumb.jpg', fullPath: '/assets/media/poster-15.jpg', altText: 'Rock & Roll 26, abuztuaren 14an' },
    // Keepsakes, kept last so adding one doesn't shift how the other prints hang (see ArchivePanel's hangingFor).
    { id: 'ticket-first-concert', kind: 'keepsake', thumbnailPath: '/assets/media/entrada-thumb.webp', fullPath: '/assets/media/entrada-full.webp', altText: 'Xendraren lehen kontzerturako sarrera, Uharteko Kultur Etxean, 2025eko apirilaren 5ean' },
    { id: 'setlist', kind: 'keepsake', thumbnailPath: '/assets/media/setlist-thumb.webp', fullPath: '/assets/media/setlist-full.webp', altText: 'Kontzertu bateko abesti-zerrenda, eskuz idatzia' },
  ],

  press: [
    {
      id: 'press-1',
      label: 'Xendra taldeko pop-rock doinuek jantziko dute larunbatean Artziko jauregia (Irati Irratia, 2026-05-12)',
      url: 'https://iratiirratia.eus/index.php/2026/05/12/xendra-taldeko-pop-rock-doinuek-jantziko-dute-larunbatean-artziko-jauregia/',
    },
  ],

  contact: {
    email: 'xendra.taldea@gmail.com',
    phone: '616 04 08 06',
    phoneHref: '+34616040806',
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
      shortLabel: 'Galeria',
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

/**
 * Shared content types for the Xendra experience.
 * Every editable string lives behind these types inside src/content — never inline in components.
 */

export type LandmarkId =
  | 'kiosk'
  | 'stage'
  | 'school'
  | 'fountain'
  | 'trainHistory'
  | 'bulletinBoard'
  /**
   * Community message-boats dock. Reuses the exact spot/interaction radius
   * the old `fronton` (frontoi/notes) landmark used -- see dockConfig.ts.
   * Its real artwork is a small house (see LANDMARK_ASSET_OVERRIDES.dockMessages
   * in mapGeometry.ts); its badge and menu icon are a paper boat (see
   * landmarkIndicatorConfig.tsx).
   */
  | 'dockMessages'
  | 'postbox'
  /** The ruined castle on the hill: opens the platform minigame (features/castleGame). */
  | 'castle';

export type Vector2Like = { x: number; y: number };

/** Minimum contract for a map point-of-interest, per prompt maestro §6. */
export type Landmark = {
  id: LandmarkId;
  route: string;
  title: string;
  shortLabel: string;
  description: string;
  position: Vector2Like;
  interactionRadius: number;
};

export type BandInfo = {
  name: string;
  originText: string;
  bio: string;
  entrySubtitle: string;
};

export type Pronouns = string;

export type BandMember = {
  id: string;
  name: string;
  pronouns: Pronouns;
  instrument: string;
  bio: string;
  photoPath: string | null;
};

export type Track = {
  id: string;
  index: number;
  title: string;
  durationLabel: string;
  previewUrl: string | null;
  fullTrackUrl: string | null;
};

export type Album = {
  albumTitle: string;
  coverPath: string | null;
  credits: string;
  /** Bandcamp's numeric album id, for its embedded player (null hides the player). */
  bandcampAlbumId: string | null;
  externalLinks: { label: string; url: string }[];
  tracks: Track[];
};

export type ConcertStatus = 'upcoming' | 'soldOut' | 'cancelled' | 'past';

export type Concert = {
  id: string;
  city: string;
  venue: string;
  date: string | null;
  time: string | null;
  status: ConcertStatus;
  ticketsUrl: string | null;
};

export type MerchProduct = {
  id: string;
  name: string;
  imagePath: string | null;
  /** A close-up (e.g. of the print), shown over the photo on hover, or on tap on touch screens. */
  detailImagePath: string | null;
  priceLabel: string | null;
  available: boolean;
  ctaMode: 'externalLink' | 'comingSoon';
  ctaUrl: string | null;
};

export type HistoryMilestone = {
  id: string;
  year: string;
  description: string;
  /** A YouTube video shown under the text (`title` names it for screen readers). */
  video?: { youtubeId: string; title: string };
};

/** keepsake: a cut-out memento (a concert ticket, a setlist) stuck on top of the board rather than hung in its columns. */
export type MediaKind = 'photo' | 'video' | 'poster' | 'keepsake';

export type MediaItem = {
  id: string;
  kind: MediaKind;
  thumbnailPath: string | null;
  fullPath: string | null;
  altText: string;
};

export type ContactInfo = {
  email: string | null;
  /** Shown as written; `phoneHref` is the same number for a tel: link (international format). */
  phone: string | null;
  phoneHref: string | null;
  socialLinks: { label: string; url: string }[];
};

export type KioskGreeting = {
  /** The shop's opening note, above the products. */
  intro: string;
  /** The order form: the main way to buy. */
  orderUrl: string | null;
  /** Under the order button: the other way, writing to the band (Instagram or email). */
  orAskUs: string;
};

export type PressLink = {
  id: string;
  label: string;
  url: string;
};

export type XendraContent = {
  band: BandInfo;
  members: BandMember[];
  album: Album;
  concerts: Concert[];
  merch: MerchProduct[];
  history: HistoryMilestone[];
  media: MediaItem[];
  press: PressLink[];
  contact: ContactInfo;
  kiosk: KioskGreeting;
  landmarks: Landmark[];
};

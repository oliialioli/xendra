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
  | 'fronton'
  | 'postbox';

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
  tagline: string;
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
  albumTitleTodo: string;
  coverPath: string | null;
  credits: string;
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
  priceLabel: string | null;
  available: boolean;
  ctaMode: 'externalLink' | 'comingSoon';
  ctaUrl: string | null;
};

export type HistoryMilestone = {
  id: string;
  year: string;
  title: string;
  description: string;
};

export type MediaKind = 'photo' | 'video';

export type MediaItem = {
  id: string;
  kind: MediaKind;
  thumbnailPath: string | null;
  fullPath: string | null;
  altText: string;
};

export type ContactReasonOption = {
  id: string;
  label: string;
};

export type ContactMode = 'mailtoLink' | 'futureEndpoint';

export type ContactInfo = {
  email: string | null;
  contactMode: ContactMode;
  reasons: ContactReasonOption[];
  socialLinks: { label: string; url: string }[];
};

export type KioskGreeting = {
  greetingTodo: string;
};

export type XendraContent = {
  band: BandInfo;
  members: BandMember[];
  album: Album;
  concerts: Concert[];
  merch: MerchProduct[];
  history: HistoryMilestone[];
  media: MediaItem[];
  contact: ContactInfo;
  kiosk: KioskGreeting;
  landmarks: Landmark[];
};

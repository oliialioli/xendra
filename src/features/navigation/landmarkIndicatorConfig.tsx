import {
  EnvelopeSimple,
  ImagesSquare,
  MicrophoneStage,
  Pencil,
  Train,
  TShirt,
  UsersThree,
  VinylRecord,
  type Icon,
} from '@phosphor-icons/react';
import type { LandmarkId } from '../../types/content';
import { LANDMARK_REVEAL_RADIUS } from '../../content/mapGeometry';

export type LandmarkIndicatorConfig = {
  /** Phosphor icon shown inside the closed circle / expanded pill. */
  icon: Icon;
  /**
   * Short indicator label -- deliberately its own copy, not `Landmark.shortLabel`
   * (used by the bottom Hud proximity bar): this badge needs to stay compact
   * enough to never compete visually with the building it points at.
   */
  label: string;
  /**
   * World-unit distance at which the badge auto-expands to show its label
   * (before the snail is close enough to interact) -- always larger than the
   * landmark's own `interactionRadius`, so the label anticipates what the
   * player is about to reach rather than only confirming it once they're
   * already there.
   */
  revealRadius: number;
  /**
   * Approximate world-unit height of the landmark's visual structure, used
   * to lift the badge above its roofline rather than off the bare ground
   * point. For landmarks with real overlay artwork (see
   * LANDMARK_ASSET_OVERRIDES in mapGeometry.ts -- currently `kiosk` and
   * `stage`) this roughly matches that sprite's own display height. The rest
   * have no building art yet, so this is a modest placeholder clearance,
   * easy to raise once real artwork lands for them.
   */
  visualHeight: number;
};

export const LANDMARK_INDICATOR_CONFIG: Record<LandmarkId, LandmarkIndicatorConfig> = {
  kiosk: {
    icon: TShirt,
    label: 'Denda',
    revealRadius: LANDMARK_REVEAL_RADIUS,
    visualHeight: 118,
  },
  stage: {
    icon: MicrophoneStage,
    label: 'Kontzertuak',
    revealRadius: LANDMARK_REVEAL_RADIUS,
    // Matches escenario-xendra.png's own analyzed height (roof to anchor),
    // so the badge clears the roofline -- and the lamps/spiral below it --
    // entirely, rather than sitting over them.
    visualHeight: 228,
  },
  school: {
    icon: VinylRecord,
    label: 'Musika',
    revealRadius: LANDMARK_REVEAL_RADIUS,
    // Slightly less than escuela-musica-xendra-default.png's own analyzed
    // height (roof to anchor, 260) -- clearing the roofline entirely left
    // the badge looking disconnected, floating well above the building;
    // this sits it right at/just over the roofline instead, per visual review.
    visualHeight: 205,
  },
  fountain: {
    icon: UsersThree,
    label: 'Taldea',
    revealRadius: LANDMARK_REVEAL_RADIUS,
    // The fountain's own anchor is its analyzed *center* (see
    // LANDMARK_ASSET_OVERRIDES.fountain's anchorMode), not a ground-contact
    // point -- so this is half fuente-xendra.png's own analyzed height (to
    // clear the top of its central column) plus a small margin, rather than
    // a full building height measured from the ground up.
    visualHeight: 85,
  },
  trainHistory: {
    icon: Train,
    label: 'Historia',
    revealRadius: LANDMARK_REVEAL_RADIUS,
    visualHeight: 55,
  },
  bulletinBoard: {
    icon: ImagesSquare,
    label: 'Galeria',
    revealRadius: LANDMARK_REVEAL_RADIUS,
    visualHeight: 45,
  },
  // Provisional pencil badge icon until a definitive one exists -- the
  // landmark's real artwork (a house) is set up separately, see
  // LANDMARK_ASSET_OVERRIDES.dockMessages in content/mapGeometry.ts.
  dockMessages: {
    icon: Pencil,
    label: 'Mezuak',
    revealRadius: LANDMARK_REVEAL_RADIUS,
    visualHeight: 65,
  },
  postbox: {
    icon: EnvelopeSimple,
    label: 'Kontaktua',
    revealRadius: LANDMARK_REVEAL_RADIUS,
    visualHeight: 40,
  },
};

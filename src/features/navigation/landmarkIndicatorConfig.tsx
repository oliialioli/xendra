import {
  EnvelopeSimple,
  ImagesSquare,
  MicrophoneStage,
  TShirt,
  UsersThree,
  VinylRecord,
  type Icon,
} from '@phosphor-icons/react';
import type { LandmarkId } from '../../types/content';
import { CastleRuinIcon, PaperBoatIcon, SteamTrainIcon } from './landmarkIcons';

export type LandmarkIndicatorConfig = {
  /** Phosphor icon shown inside the closed circle / expanded pill. */
  icon: Icon;
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
    visualHeight: 118,
  },
  stage: {
    icon: MicrophoneStage,
    // Matches escenario-xendra.png's own analyzed height (roof to anchor),
    // so the badge clears the roofline -- and the lamps/spiral below it --
    // entirely, rather than sitting over them.
    visualHeight: 228,
  },
  school: {
    icon: VinylRecord,
    // Slightly less than escuela-musica-xendra-default.png's own analyzed
    // height (roof to anchor, 260) -- clearing the roofline entirely left
    // the badge looking disconnected, floating well above the building;
    // this sits it right at/just over the roofline instead, per visual review.
    visualHeight: 205,
  },
  fountain: {
    icon: UsersThree,
    // The fountain's own anchor is its analyzed *center* (see
    // LANDMARK_ASSET_OVERRIDES.fountain's anchorMode), not a ground-contact
    // point -- so this is half fuente-xendra.png's own analyzed height (to
    // clear the top of its central column) plus a small margin, rather than
    // a full building height measured from the ground up.
    visualHeight: 85,
  },
  trainHistory: {
    icon: SteamTrainIcon,
    // Clears the middle carriage's roof above tren.png's anchor.
    visualHeight: 150,
  },
  bulletinBoard: {
    icon: ImagesSquare,
    // Roughly tablon-anuncios.png's own height (roof to anchor) at
    // BULLETIN_BOARD_WIDTH_PERCENT, so the badge sits just over the roof.
    visualHeight: 100,
  },
  // A paper boat, like the ones sent from here -- the landmark's real
  // artwork (a house) is set up separately, see
  // LANDMARK_ASSET_OVERRIDES.dockMessages in content/mapGeometry.ts.
  dockMessages: {
    icon: PaperBoatIcon,
    visualHeight: 65,
  },
  postbox: {
    icon: EnvelopeSimple,
    // Roughly buzon.png's own analyzed height (cap to anchor) at
    // POSTBOX_WIDTH_PERCENT, so the badge sits just over the cap.
    visualHeight: 88,
  },
  castle: {
    icon: CastleRuinIcon,
    // Just over the tall corner tower of castillo.png (its anchor sits near
    // the top of the map, so a higher badge would be cut off by the edge).
    visualHeight: 120,
  },
};

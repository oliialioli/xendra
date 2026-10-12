import type { ComponentType } from 'react';
import type { LandmarkId } from '../types/content';
import { MusicPanel } from '../features/panels/MusicPanel';
import { ConcertsPanel } from '../features/panels/ConcertsPanel';
import { GroupPanel } from '../features/panels/GroupPanel';
import { HistoryPanel } from '../features/panels/HistoryPanel';
import { MerchPanel } from '../features/panels/MerchPanel';
import { ArchivePanel } from '../features/panels/ArchivePanel';
import { BoatCreator } from '../features/boats/BoatCreator';
import { ContactPanel } from '../features/panels/ContactPanel';
import { CastleGame } from '../features/castleGame/CastleGame';

import { MAP_PATH, SECTION_PATHS, SECTION_TITLES } from '../content/sectionPaths';

export const MAP_ROUTE = MAP_PATH;

export type PanelRouteConfig = {
  route: string;
  landmarkId: LandmarkId;
  title: string;
  Component: ComponentType;
  variant?: 'side' | 'wide';
  /** Simple glyph shown in the panel header's icon stamp -- kept intentionally plain. */
  icon: string;
};

/**
 * Single source of truth tying a landmark, its route, and the panel component
 * it opens -- the map and the conventional menu both resolve through this list,
 * so they can never point at different content for the same destination.
 */
export const PANEL_ROUTES: PanelRouteConfig[] = [
  {
    route: SECTION_PATHS.school,
    landmarkId: 'school',
    title: SECTION_TITLES.school,
    Component: MusicPanel,
    variant: 'wide',
    icon: '♪',
  },
  {
    route: SECTION_PATHS.stage,
    landmarkId: 'stage',
    title: SECTION_TITLES.stage,
    Component: ConcertsPanel,
    variant: 'wide',
    icon: '☾',
  },
  {
    route: SECTION_PATHS.fountain,
    landmarkId: 'fountain',
    title: SECTION_TITLES.fountain,
    Component: GroupPanel,
    variant: 'wide',
    icon: '◔',
  },
  {
    route: SECTION_PATHS.trainHistory,
    landmarkId: 'trainHistory',
    title: SECTION_TITLES.trainHistory,
    Component: HistoryPanel,
    variant: 'wide',
    icon: '☖',
  },
  {
    route: SECTION_PATHS.kiosk,
    landmarkId: 'kiosk',
    title: SECTION_TITLES.kiosk,
    Component: MerchPanel,
    variant: 'wide',
    icon: '✦',
  },
  {
    route: SECTION_PATHS.bulletinBoard,
    landmarkId: 'bulletinBoard',
    title: SECTION_TITLES.bulletinBoard,
    Component: ArchivePanel,
    variant: 'wide',
    icon: '▣',
  },
  {
    // Rendered directly by MapLayout as a centered/fullscreen modal instead
    // of the generic right-anchored <Panel> shell every other entry here
    // uses (see MapLayout's own special case for landmarkId === 'dockMessages') --
    // Component/icon/title below stay only so this entry still type-checks
    // and still lists correctly in the menu drawer.
    route: SECTION_PATHS.dockMessages,
    landmarkId: 'dockMessages',
    title: SECTION_TITLES.dockMessages,
    Component: BoatCreator,
    icon: '✎',
  },
  {
    // Like the boat creator, rendered by MapLayout as its own full-screen modal
    // (the minigame) instead of the generic <Panel> shell.
    route: SECTION_PATHS.castle,
    landmarkId: 'castle',
    title: SECTION_TITLES.castle,
    Component: CastleGame,
    icon: '♜',
  },
  {
    route: SECTION_PATHS.postbox,
    landmarkId: 'postbox',
    title: SECTION_TITLES.postbox,
    Component: ContactPanel,
    icon: '✉',
  },
];

export const panelRouteByPath = new Map(PANEL_ROUTES.map((entry) => [entry.route, entry]));
export const panelRouteByLandmarkId = new Map(
  PANEL_ROUTES.map((entry) => [entry.landmarkId, entry]),
);

export const MENU_ENTRIES: { route: string; label: string; landmarkId: PanelRouteConfig['landmarkId'] }[] = PANEL_ROUTES.map(
  (entry) => ({ route: entry.route, label: entry.title, landmarkId: entry.landmarkId }),
);

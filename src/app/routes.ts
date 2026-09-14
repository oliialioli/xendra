import type { ComponentType } from 'react';
import type { LandmarkId } from '../types/content';
import { MusicPanel } from '../features/panels/MusicPanel';
import { ConcertsPanel } from '../features/panels/ConcertsPanel';
import { GroupPanel } from '../features/panels/GroupPanel';
import { HistoryPanel } from '../features/panels/HistoryPanel';
import { MerchPanel } from '../features/panels/MerchPanel';
import { ArchivePanel } from '../features/panels/ArchivePanel';
import { NotesPanel } from '../features/publicNotes/NotesPanel';
import { ContactPanel } from '../features/panels/ContactPanel';

export const MAP_ROUTE = '/mapa';

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
    route: '/musica',
    landmarkId: 'school',
    title: 'Musika',
    Component: MusicPanel,
    variant: 'wide',
    icon: '♪',
  },
  {
    route: '/conciertos',
    landmarkId: 'stage',
    title: 'Kontzertuak',
    Component: ConcertsPanel,
    variant: 'wide',
    icon: '☾',
  },
  {
    route: '/grupo',
    landmarkId: 'fountain',
    title: 'Taldea',
    Component: GroupPanel,
    variant: 'wide',
    icon: '◔',
  },
  {
    route: '/historia',
    landmarkId: 'trainHistory',
    title: 'Xendraren historia',
    Component: HistoryPanel,
    variant: 'wide',
    icon: '☖',
  },
  {
    route: '/merch',
    landmarkId: 'kiosk',
    title: 'Denda',
    Component: MerchPanel,
    variant: 'wide',
    icon: '✦',
  },
  {
    route: '/archivo',
    landmarkId: 'bulletinBoard',
    title: 'Argazkiak eta bideoak',
    Component: ArchivePanel,
    variant: 'wide',
    icon: '▣',
  },
  {
    route: '/notas',
    landmarkId: 'fronton',
    title: 'Jendearen oharrak',
    Component: NotesPanel,
    icon: '✎',
  },
  {
    route: '/contacto',
    landmarkId: 'postbox',
    title: 'Kontaktua',
    Component: ContactPanel,
    icon: '✉',
  },
];

export const panelRouteByPath = new Map(PANEL_ROUTES.map((entry) => [entry.route, entry]));
export const panelRouteByLandmarkId = new Map(
  PANEL_ROUTES.map((entry) => [entry.landmarkId, entry]),
);

export const MENU_ENTRIES: { route: string; label: string }[] = [
  { route: MAP_ROUTE, label: 'Hasiera / Mapa' },
  ...PANEL_ROUTES.map((entry) => ({ route: entry.route, label: entry.title })),
];

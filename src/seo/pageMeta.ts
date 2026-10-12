import { MAP_PATH, SECTION_PATHS } from '../content/sectionPaths';

/**
 * Each page's title and description: what a search result shows for it, and
 * the tab's title while that section is open. One entry per address
 * (sectionPaths.ts); anything else gets the home page's.
 */
export type PageMeta = { path: string; title: string; description: string };

export const HOME_META: PageMeta = {
  path: MAP_PATH,
  title: 'Xendra, Uharteko (Nafarroa) musika taldea',
  description:
    'Xendra, Uharteko (Nafarroa) musika taldea: folk, pop eta rock euskaraz. Entzun «Bihia» diskoa, ikusi kontzertuak eta ezagutu taldea uharte interaktibo batean.',
};

export const SECTION_META: PageMeta[] = [
  {
    path: SECTION_PATHS.school,
    title: 'Xendraren musika: «Bihia» diskoa',
    description:
      'Entzun Xendraren «Bihia» diskoa (2025): zortzi abesti, «Errauts eskuak» bideoklipa eta Bandcamp, Badok, YouTube eta Apple Musiceko estekak.',
  },
  {
    path: SECTION_PATHS.stage,
    title: 'Xendraren kontzertuak',
    description: 'Xendraren hurrengo kontzertuak eta orain arte emandakoak: datak, herriak eta aretoak.',
  },
  {
    path: SECTION_PATHS.fountain,
    title: 'Xendra taldea: kideak',
    description: 'Ezagutu Xendra osatzen duten zazpi kideak eta bakoitzak jotzen duen instrumentua.',
  },
  {
    path: SECTION_PATHS.trainHistory,
    title: 'Gure Xendra: taldearen historia',
    description:
      'Xendraren historia: 2020an Uharteko entsegu gelan hasi zenetik «Bihia» diskora eta lehen kontzertuetara.',
  },
  {
    path: SECTION_PATHS.kiosk,
    title: 'Xendraren denda: kamisetak eta diskoa',
    description: 'Xendraren kamisetak (BEGIRA eta SUA) eta «Bihia» diskoa: prezioak eta eskaera-orria.',
  },
  {
    path: SECTION_PATHS.bulletinBoard,
    title: 'Xendraren galeria: argazkiak, bideoak eta kartelak',
    description: 'Xendraren argazkiak, bideoak eta kontzertuetako kartelak.',
  },
  {
    path: SECTION_PATHS.dockMessages,
    title: 'Bidali zure ontzia Xendraren uhartean',
    description: 'Marraztu paperezko ontzi bat, idatzi mezu bat eta bidali Xendraren uharteko ibaian behera.',
  },
  {
    path: SECTION_PATHS.castle,
    title: 'Gaztelu magikoa: Xendraren jokoa',
    description:
      'Jolastu Gaztelu magikoan: bildu notak, gainditu etsaiak eta iritsi bukaerara ahalik eta azkarren.',
  },
  {
    path: SECTION_PATHS.postbox,
    title: 'Xendra: kontaktua',
    description: 'Jarri harremanetan Xendrarekin: kontzertuak, elkarlanak eta bestelakoak.',
  },
];

const META_BY_PATH = new Map(SECTION_META.map((meta) => [meta.path, meta]));

export function pageMetaFor(path: string): PageMeta {
  return META_BY_PATH.get(path) ?? HOME_META;
}

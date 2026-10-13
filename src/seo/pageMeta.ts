import { MAP_PATH, SECTION_PATHS } from '../content/sectionPaths';
import { LYRICS_PATH, SONGS } from '../content/lyricsPaths';
import { xendraContent } from '../content/xendraContent';
import { DEFAULT_LANG, type Lang } from '../i18n/languages';
import { msg, translate } from '../i18n/translate';

/**
 * Each page's title and description: what a search result shows for it, and
 * the tab's title while that section is open. One entry per address
 * (sectionPaths.ts); anything else gets the home page's.
 *
 * Written here in Basque; `pageMetaFor(path, lang)` gives them in each of
 * the site's languages (i18n/). `path` never carries the language.
 */
export type PageMeta = { path: string; title: string; description: string };

export const HOME_META: PageMeta = {
  path: MAP_PATH,
  title: msg('Xendra, Uharteko (Nafarroa) musika taldea'),
  description: msg('Xendra, Uharteko (Nafarroa) musika taldea: folk, pop eta rock euskaraz. Entzun «Bihia» diskoa, ikusi kontzertuak eta ezagutu taldea uharte interaktibo batean.'),
};

export const SECTION_META: PageMeta[] = [
  {
    path: SECTION_PATHS.school,
    title: msg('Xendraren musika: «Bihia» diskoa'),
    description: msg('Entzun Xendraren «Bihia» diskoa (2025): zortzi abesti, «Errauts eskuak» bideoklipa eta Bandcamp, Badok, YouTube eta Apple Musiceko estekak.'),
  },
  {
    path: SECTION_PATHS.stage,
    title: msg('Xendraren kontzertuak'),
    description: msg('Xendraren hurrengo kontzertuak eta orain arte emandakoak: datak, herriak eta aretoak.'),
  },
  {
    path: SECTION_PATHS.fountain,
    title: msg('Xendra taldea: kideak'),
    description: msg('Ezagutu Xendra osatzen duten zazpi kideak eta bakoitzak jotzen duen instrumentua.'),
  },
  {
    path: SECTION_PATHS.trainHistory,
    title: msg('Gure Xendra: taldearen historia'),
    description: msg('Xendraren historia: 2020an Uharteko entsegu gelan hasi zenetik «Bihia» diskora eta lehen kontzertuetara.'),
  },
  {
    path: SECTION_PATHS.kiosk,
    title: msg('Xendraren denda: kamisetak eta diskoa'),
    description: msg('Xendraren kamisetak (BEGIRA eta SUA) eta «Bihia» diskoa: prezioak eta eskaera-orria.'),
  },
  {
    path: SECTION_PATHS.bulletinBoard,
    title: msg('Xendraren galeria: argazkiak, bideoak eta kartelak'),
    description: msg('Xendraren argazkiak, bideoak eta kontzertuetako kartelak.'),
  },
  {
    path: SECTION_PATHS.dockMessages,
    title: msg('Bidali zure ontzia Xendraren uhartean'),
    description: msg('Marraztu paperezko ontzi bat, idatzi mezu bat eta bidali Xendraren uharteko ibaian behera.'),
  },
  {
    path: SECTION_PATHS.castle,
    title: msg('Gaztelu magikoa: Xendraren jokoa'),
    description: msg('Jolastu Gaztelu magikoan: bildu notak, gainditu etsaiak eta iritsi bukaerara ahalik eta azkarren.'),
  },
  {
    path: SECTION_PATHS.postbox,
    title: msg('Xendra: kontaktua'),
    description: msg('Jarri harremanetan Xendrarekin: kontzertuak, elkarlanak eta bestelakoak.'),
  },
];

/** The songs' words: the list, then one page per song. */
function lyricsMeta(lang: Lang): PageMeta[] {
  const album = xendraContent.album.albumTitle;
  return [
    {
      path: LYRICS_PATH,
      title: translate(lang, 'Xendraren abestien hitzak'),
      description: translate(lang, 'Xendraren «{album}» diskoko abestien hitzak.', { album }),
    },
    ...SONGS.map((song) => ({
      path: song.path,
      title: translate(lang, '{song}: hitzak (Xendra)', { song: song.title }),
      description: translate(lang, 'Xendraren «{song}» abestiaren hitzak, «{album}» diskokoa.', { song: song.title, album }),
    })),
  ];
}

const inLang = (lang: Lang, meta: PageMeta): PageMeta => ({
  path: meta.path,
  title: translate(lang, meta.title),
  description: translate(lang, meta.description),
});

export function homeMeta(lang: Lang = DEFAULT_LANG): PageMeta {
  return inLang(lang, HOME_META);
}

/** Every page's title and description in a language: the map, each section, then the songs' words. */
export function allPageMeta(lang: Lang = DEFAULT_LANG): PageMeta[] {
  return [homeMeta(lang), ...SECTION_META.map((meta) => inLang(lang, meta)), ...lyricsMeta(lang)];
}

const metaByLang = new Map<Lang, Map<string, PageMeta>>();

export function pageMetaFor(path: string, lang: Lang = DEFAULT_LANG): PageMeta {
  let byPath = metaByLang.get(lang);
  if (!byPath) {
    byPath = new Map(allPageMeta(lang).map((meta) => [meta.path, meta]));
    metaByLang.set(lang, byPath);
  }
  return byPath.get(path) ?? byPath.get(MAP_PATH)!;
}

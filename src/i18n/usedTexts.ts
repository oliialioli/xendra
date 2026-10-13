import { xendraContent } from '../content/xendraContent';
import { SECTION_TITLES } from '../content/sectionPaths';
import { COPY } from '../features/castleGame/config';

/**
 * The Basque texts that live in the content files rather than in a `t()` or
 * `msg()` call, and that the site shows translated: the band's own texts in
 * xendraContent, the sections' names and the castle game's texts. Names of
 * people, places, songs and the album are not here: they're the same in
 * every language. (Only the tests read this, to check nothing's missing.)
 */
export function contentTexts(): string[] {
  const { band, members, album, merch, history, media, kiosk, landmarks } = xendraContent;
  return [
    band.originText,
    band.bio,
    band.entrySubtitle,
    ...members.map((member) => member.instrument),
    album.summary,
    album.credits,
    ...(album.video ? [album.video.title, album.video.caption] : []),
    ...merch.flatMap((product) => [product.name, ...(product.views ?? []).map((view) => view.altText)]),
    ...history.map((stop) => stop.description),
    ...media.map((item) => item.altText),
    kiosk.intro,
    kiosk.orAskUs,
    ...landmarks.flatMap((landmark) => [landmark.title, landmark.shortLabel, landmark.description]),
    ...Object.values(SECTION_TITLES),
    ...Object.values(COPY),
  ].filter((text) => text !== '');
}

import { Link } from 'react-router-dom';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { LYRICS_PATH, SONGS, songBySlug } from '../../content/lyricsPaths';
import { SECTION_PATHS, SECTION_TITLES } from '../../content/sectionPaths';
import { xendraContent } from '../../content/xendraContent';
import shared from './panelShared.module.css';
import styles from './LyricsPanel.module.css';

/** Every song with its words written down, as links to them. */
export function SongList() {
  return (
    <ol className={styles.songs}>
      {SONGS.map((song) => (
        <li key={song.slug}>
          <Link className={styles.song} to={song.path}>
            <span className={styles.songNumber}>{song.index}.</span>
            <span className={styles.songTitle}>{song.title}</span>
            <span className={styles.songDuration}>{song.durationLabel}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

/**
 * The words of a song (`slug`), or the list of songs when there's none
 * (/hitzak) or it isn't a song's. Opens inside the Musika panel's place,
 * with the way back to it at the top.
 */
export function LyricsPanel({ slug }: { slug: string }) {
  const song = songBySlug(slug);
  const back = (
    <Link className={styles.back} to={song ? LYRICS_PATH : SECTION_PATHS.school}>
      <CaretLeft size={14} weight="bold" aria-hidden="true" />
      {song ? 'Abesti guztiak' : SECTION_TITLES.school}
    </Link>
  );

  if (!song) {
    return (
      <div>
        {back}
        {slug !== '' && <p className={shared.lead}>Ez dugu abesti hori aurkitu.</p>}
        <p className={shared.lead}>«{xendraContent.album.albumTitle}» diskoko abestien hitzak.</p>
        <SongList />
      </div>
    );
  }

  const position = SONGS.indexOf(song);
  const previous = SONGS[position - 1];
  const next = SONGS[position + 1];

  return (
    <article>
      {back}
      <h3 className={styles.title}>{song.title}</h3>
      <p className={styles.meta}>
        {xendraContent.album.albumTitle} · {song.index}. abestia · {song.durationLabel}
      </p>
      <div className={styles.lyrics} lang="eu">
        {song.stanzas.map((stanza, i) => (
          <p key={i} className={styles.stanza}>
            {stanza.map((line, j) => (
              <span key={j} className={line.startsWith('(') ? styles.note : styles.line}>
                {line}
              </span>
            ))}
          </p>
        ))}
      </div>
      <nav className={styles.neighbours} aria-label="Beste abestiak">
        {previous ? (
          <Link className={styles.neighbour} to={previous.path}>
            <CaretLeft size={14} weight="bold" aria-hidden="true" />
            {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link className={styles.neighbour} to={next.path}>
            {next.title}
            <CaretRight size={14} weight="bold" aria-hidden="true" />
          </Link>
        )}
      </nav>
    </article>
  );
}

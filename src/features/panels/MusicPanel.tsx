import { xendraContent } from '../../content/xendraContent';
import { useAudioPlayer } from '../audio/AudioContext';
import { assetPath } from '../../lib/assetPath';
import shared from './panelShared.module.css';
import styles from './MusicPanel.module.css';

/**
 * Bandcamp's embedded album player with its track list. Bandcamp only offers
 * a white or a dark background, so it's set transparent on the panel's well;
 * links take the shell's clay.
 */
function bandcampPlayerUrl(albumId: string): string {
  return `https://bandcamp.com/EmbeddedPlayer/album=${albumId}/size=large/bgcol=ffffff/linkcol=9a4f38/artwork=none/tracklist=true/transparent=true/`;
}

export function MusicPanel() {
  const { album } = xendraContent;
  const { playTrack, stopTrack, currentTrackId, isPlaying, soundEnabled } = useAudioPlayer();
  const hasPreviews = album.tracks.some((track) => track.previewUrl);

  return (
    <div>
      <section className={shared.section}>
        {album.coverPath && (
          <img
            src={assetPath(album.coverPath)}
            alt={`${album.albumTitle} diskoaren azala`}
            style={{
              width: '100%',
              maxWidth: 280,
              aspectRatio: '1 / 1',
              objectFit: 'cover',
              borderRadius: 'var(--radius-sm)',
              display: 'block',
              marginBottom: 'var(--space-3)',
            }}
          />
        )}
        <h3>{album.albumTitle}</h3>
        <p className={shared.lead}>{album.credits}</p>
        {album.bandcampAlbumId && (
          <iframe
            className={styles.player}
            title={`${album.albumTitle} Bandcamp-en entzun`}
            src={bandcampPlayerUrl(album.bandcampAlbumId)}
            loading="lazy"
            seamless
          />
        )}
        {album.externalLinks.length > 0 && (
          <>
            <p className={styles.linksLabel}>Entzun hemen ere:</p>
            <ul className={styles.links}>
              {album.externalLinks.map((link) => (
                <li key={link.url}>
                  <a className={shared.secondaryLink} href={link.url} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
        {hasPreviews && !soundEnabled && (
          <p className={shared.statusText}>
            Aktibatu soinua mapako menutik aurrebistak entzuteko.
          </p>
        )}
      </section>

      {hasPreviews && (
        <section className={shared.section}>
          <ol className={shared.list}>
            {album.tracks.map((track) => {
              const isCurrent = currentTrackId === track.id;
              return (
                <li key={track.id} className={shared.listItem}>
                  <strong>
                    {track.index}. {track.title}
                  </strong>
                  <div className={shared.statusText}>{track.durationLabel}</div>
                  <button
                    type="button"
                    className={shared.primaryButton}
                    disabled={!track.previewUrl || !soundEnabled}
                    onClick={() =>
                      isCurrent && isPlaying ? stopTrack() : playTrack(track.id, track.previewUrl)
                    }
                    aria-label={
                      track.previewUrl
                        ? `${isCurrent && isPlaying ? 'Pausatu' : 'Erreproduzitu'} ${track.title}`
                        : `Aurrebista ez dago erabilgarri: ${track.title}`
                    }
                  >
                    {track.previewUrl
                      ? isCurrent && isPlaying
                        ? 'Pausatu'
                        : 'Erreproduzitu'
                      : 'Aurrebista ez dago erabilgarri'}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}

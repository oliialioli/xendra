import { xendraContent } from '../../content/xendraContent';
import { useAudioPlayer } from '../audio/AudioContext';
import shared from './panelShared.module.css';

export function MusicPanel() {
  const { album } = xendraContent;
  const { playTrack, stopTrack, currentTrackId, isPlaying, soundEnabled } = useAudioPlayer();

  return (
    <div>
      <section className={shared.section}>
        {album.coverPath && (
          <img
            src={album.coverPath}
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
        {album.externalLinks.length > 0 && (
          <ul className={shared.list}>
            {album.externalLinks.map((link) => (
              <li key={link.url}>
                <a className={shared.secondaryLink} href={link.url} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}
        {!soundEnabled && (
          <p className={shared.statusText}>
            Aktibatu soinua mapako menutik aurrebistak entzuteko.
          </p>
        )}
      </section>

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
    </div>
  );
}

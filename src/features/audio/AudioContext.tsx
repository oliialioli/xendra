import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSettings } from '../../app/providers/SettingsContext';
import { sendAnalyticsEvent } from '../../lib/analytics';

type AudioContextValue = {
  soundEnabled: boolean;
  volume: number;
  currentTrackId: string | null;
  isPlaying: boolean;
  toggleSound: () => void;
  setVolume: (volume: number) => void;
  /** No-op (with a console notice) when `src` is null -- no file, no request, no error. */
  playTrack: (trackId: string, src: string | null) => void;
  stopTrack: () => void;
};

const AudioPlayerContext = createContext<AudioContextValue | null>(null);

/**
 * Single global <audio> element so tracks never overlap. Sound starts muted
 * (soundEnabled defaults to false) and only plays after an explicit user action.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  const { soundEnabled, setSoundEnabled, volume, setVolume } = useSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    const handleEnded = () => setIsPlaying(false);
    const handleError = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const value = useMemo<AudioContextValue>(
    () => ({
      soundEnabled,
      volume,
      currentTrackId,
      isPlaying,
      toggleSound: () => {
        const next = !soundEnabled;
        if (!next) {
          audioRef.current?.pause();
          setIsPlaying(false);
        }
        setSoundEnabled(next);
      },
      setVolume,
      playTrack: (trackId, src) => {
        const audio = audioRef.current;
        if (!audio || !soundEnabled) return;

        if (!src) {
          // No real audio file yet -- stay silent, never request a missing URL.
          setCurrentTrackId(trackId);
          setIsPlaying(false);
          return;
        }

        if (currentTrackId !== trackId || audio.src !== src) {
          audio.src = src;
          setCurrentTrackId(trackId);
        }
        audio
          .play()
          .then(() => {
            setIsPlaying(true);
            sendAnalyticsEvent({ type: 'audio_played', trackId });
          })
          .catch(() => setIsPlaying(false));
      },
      stopTrack: () => {
        audioRef.current?.pause();
        setIsPlaying(false);
      },
    }),
    [soundEnabled, volume, currentTrackId, isPlaying, setSoundEnabled, setVolume],
  );

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>;
}

export function useAudioPlayer(): AudioContextValue {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error('useAudioPlayer must be used within AudioProvider');
  return ctx;
}

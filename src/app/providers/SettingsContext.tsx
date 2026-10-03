import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readJSON, storageKey, writeJSON } from '../../lib/storage';
import { useSystemReducedMotion } from '../../lib/useReducedMotion';

type SettingsState = {
  soundEnabled: boolean;
  volume: number;
  extraReducedMotion: boolean;
  effectiveReducedMotion: boolean;
  hasSeenNavigationHint: boolean;
};

type SettingsActions = {
  setSoundEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setExtraReducedMotion: (enabled: boolean) => void;
  markNavigationHintSeen: () => void;
};

type SettingsContextValue = SettingsState & SettingsActions;

const SettingsContext = createContext<SettingsContextValue | null>(null);

// v2: sound now starts on. Under the old key everyone has `false` stored --
// written on their first visit, not chosen -- so a fresh key lets the new
// default reach them; whatever they pick from here on is remembered.
const SOUND_KEY = storageKey('sound-v2');
const VOLUME_KEY = storageKey('volume');
const MOTION_KEY = storageKey('reducedMotionExtra');
// v2: the guide became two steps (moving, then opening a place) -- shown once more to everyone.
const NAVIGATION_HINT_KEY = storageKey('seenNavigationHint-v2');

export function SettingsProvider({ children }: { children: ReactNode }) {
  const systemReducedMotion = useSystemReducedMotion();

  const [soundEnabled, setSoundEnabledState] = useState(() => readJSON(SOUND_KEY, true));
  const [volume, setVolumeState] = useState(() => readJSON(VOLUME_KEY, 0.6));
  const [extraReducedMotion, setExtraReducedMotionState] = useState(() =>
    readJSON(MOTION_KEY, false),
  );
  const [hasSeenNavigationHint, setHasSeenNavigationHint] = useState(() =>
    readJSON(NAVIGATION_HINT_KEY, false),
  );

  useEffect(() => {
    writeJSON(SOUND_KEY, soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    writeJSON(VOLUME_KEY, volume);
  }, [volume]);

  useEffect(() => {
    writeJSON(MOTION_KEY, extraReducedMotion);
  }, [extraReducedMotion]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      soundEnabled,
      volume,
      extraReducedMotion,
      effectiveReducedMotion: systemReducedMotion || extraReducedMotion,
      hasSeenNavigationHint,
      setSoundEnabled: setSoundEnabledState,
      setVolume: setVolumeState,
      setExtraReducedMotion: setExtraReducedMotionState,
      markNavigationHintSeen: () => {
        setHasSeenNavigationHint(true);
        writeJSON(NAVIGATION_HINT_KEY, true);
      },
    }),
    [soundEnabled, volume, extraReducedMotion, systemReducedMotion, hasSeenNavigationHint],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

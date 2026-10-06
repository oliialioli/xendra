import { useEffect, useRef, useState } from 'react';
import type { GameEventBus } from '../../../game/bridge/gameEvents';
import { useSettings } from '../../../app/providers/SettingsContext';
import { ISLAND_POLYGON, LANDMARK_FOOTPRINTS, LANDMARK_POSITIONS } from '../../../content/mapGeometry';
import { waterfallConfig } from '../../../content/dockConfig';
import { useAudioPlayer } from '../AudioContext';
import { ambienceEngine } from './AmbienceEngine';
import { SCHOOL_REHEARSAL_SRC, VENDOR_VOICE_SRC } from './ambienceConfig';
import { ambienceDuck, fireProximity, fountainProximity, panFor, schoolProximity, waterProximity } from './ambienceMath';
import { assetPath } from '../../../lib/assetPath';

/** How often the snail's position is turned into water levels (the levels themselves glide). */
const PROXIMITY_EVERY_MS = 120;

const WATERFALL = waterfallConfig.enabled ? { x: waterfallConfig.x, y: waterfallConfig.y } : null;

/** The middle of the music school's footprint: where the rehearsal comes from. */
const SCHOOL = (() => {
  const shape = LANDMARK_FOOTPRINTS.school?.[0];
  return shape && 'width' in shape
    ? { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 }
    : LANDMARK_POSITIONS.school;
})();

ambienceEngine.setSchoolSource(assetPath(SCHOOL_REHEARSAL_SRC));

/**
 * True while any <audio>/<video> on the page is playing (a gallery video,
 * say). Something taken off the page mid-play (its section closed)
 * never says it stopped, so those are dropped whenever the section changes.
 */
function useMediaPlaying(panelRoute: string | null): boolean {
  const [playing, setPlaying] = useState(false);
  const activeRef = useRef(new Set<EventTarget>());

  useEffect(() => {
    const active = activeRef.current;
    active.forEach((target) => {
      if (target instanceof Node && !target.isConnected) active.delete(target);
    });
    setPlaying(active.size > 0);
  }, [panelRoute]);

  useEffect(() => {
    const active = activeRef.current;
    const update = () => setPlaying(active.size > 0);
    const onPlay = (e: Event) => {
      active.add(e.target as EventTarget);
      update();
    };
    const onStop = (e: Event) => {
      active.delete(e.target as EventTarget);
      update();
    };
    // Media events don't bubble, but they do pass through the capture phase.
    document.addEventListener('play', onPlay, true);
    document.addEventListener('pause', onStop, true);
    document.addEventListener('ended', onStop, true);
    document.addEventListener('emptied', onStop, true);
    return () => {
      document.removeEventListener('play', onPlay, true);
      document.removeEventListener('pause', onStop, true);
      document.removeEventListener('ended', onStop, true);
      document.removeEventListener('emptied', onStop, true);
    };
  }, []);
  return playing;
}

/**
 * Feeds the world's state into the ambience: where the snail is (how near
 * the river and the falls), the weather, the kiosk vendor's greeting, the
 * sound setting, the tab being visible, and anything else that should be
 * heard over it (an open section, the band's music, a video).
 */
export function useWorldAmbience(bus: GameEventBus, panelRoute: string | null): void {
  const { soundEnabled, volume } = useSettings();
  const { isPlaying: musicPlaying } = useAudioPlayer();
  const mediaPlaying = useMediaPlaying(panelRoute);

  useEffect(() => {
    ambienceEngine.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    ambienceEngine.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    ambienceEngine.setDuck(ambienceDuck({ panelRoute, musicPlaying, mediaPlaying }));
  }, [panelRoute, musicPlaying, mediaPlaying]);

  // Audio can only start from a user gesture (mobile browsers insist): with
  // sound remembered as on, the first tap/click/key starts it.
  useEffect(() => {
    if (!soundEnabled) return undefined;
    const unlock = () => ambienceEngine.unlock();
    const events = ['pointerdown', 'keydown', 'touchend'] as const;
    events.forEach((e) => window.addEventListener(e, unlock, { capture: true, passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, unlock, { capture: true }));
  }, [soundEnabled]);

  useEffect(() => {
    const onVisibility = () => ambienceEngine.setVisible(!document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      ambienceEngine.setVisible(false);
    };
  }, []);

  useEffect(() => {
    let lastProximity = 0;
    let fire: { x: number; y: number; lit: boolean } | null = null;
    let view = { centerX: 0, halfWidth: 1 };
    // The rehearsal follows the school landmark's own state (see AmbienceEngine.setSchool).
    let schoolActive = false;
    let schoolNear = { level: 0, pan: 0 };
    const offFrame = bus.on('camera:frame', ({ worldViewX, zoom, viewportWidth, snailX, snailY }) => {
      const now = performance.now();
      if (now - lastProximity < PROXIMITY_EVERY_MS) return;
      lastProximity = now;
      const halfWidth = viewportWidth / zoom / 2;
      view = { centerX: worldViewX + halfWidth, halfWidth };
      const snail = { x: snailX, y: snailY };
      ambienceEngine.setProximity(waterProximity(snail, ISLAND_POLYGON, WATERFALL, worldViewX + halfWidth, halfWidth));
      const fireNear = fireProximity(snail, fire, worldViewX + halfWidth, halfWidth);
      ambienceEngine.setFire(fireNear.level, fireNear.pan);
      const fountainNear = fountainProximity(snail, LANDMARK_POSITIONS.fountain, worldViewX + halfWidth, halfWidth);
      ambienceEngine.setFountain(fountainNear.level, fountainNear.pan);
      schoolNear = schoolProximity(snail, SCHOOL, worldViewX + halfWidth, halfWidth);
      ambienceEngine.setSchool(schoolActive, schoolNear.level, schoolNear.pan);
    });
    const offFire = bus.on('campfire:lit', (state) => {
      fire = state;
      if (!state.lit) ambienceEngine.setFire(0, 0);
    });
    const offNearest = bus.on('landmark:proximityChanged', ({ nearestId }) => {
      schoolActive = nearestId === 'school';
      ambienceEngine.setSchool(schoolActive, schoolNear.level, schoolNear.pan);
    });
    const offSplash = bus.on('beaver:splash', ({ x, startled }) =>
      ambienceEngine.splash(panFor(x, view.centerX, view.halfWidth), startled),
    );
    const offSpray = bus.on('fountain:spray', ({ spraying }) => ambienceEngine.setFountainSpray(spraying));
    const offRain = bus.on('weather:rain', ({ intensity }) => ambienceEngine.setRain(intensity));
    const offGust = bus.on('weather:gust', ({ fromLeft }) => ambienceEngine.gust(fromLeft));
    const offGreet = bus.on('kiosk:greet', () => void ambienceEngine.playVoice(assetPath(VENDOR_VOICE_SRC)));
    return () => {
      offFrame();
      offFire();
      offSpray();
      offSplash();
      offNearest();
      offRain();
      offGust();
      offGreet();
    };
  }, [bus]);
}

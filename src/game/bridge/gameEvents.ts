import type { LandmarkId } from '../../types/content';

/** Events emitted by the Phaser world for React to react to. */
export type GameToAppEvents = {
  'game:ready': void;
  /** The map's assets loading, 0-1 (before 'game:ready'). */
  'map:loadProgress': { progress: number };
  'map:assetStatus': { usingFallback: boolean };
  'landmark:proximityChanged': { nearestId: LandmarkId | null };
  'landmark:discovered': { id: LandmarkId };
  'landmark:interact': { id: LandmarkId };
  /**
   * Emitted every frame so DOM overlays (see DiscoveryIndicators) can project
   * world-space landmark positions to screen pixels and stay glued to the
   * map through the camera's continuous follow-lerp and zoom. Consumers
   * should write straight to element styles (refs), not React state, to
   * avoid a 60fps re-render.
   */
  'camera:frame': {
    /**
     * World coordinate at the camera viewport's top-left corner -- i.e.
     * `camera.worldView.x/y`, NOT `camera.scrollX/scrollY`. Phaser's zoom is
     * applied around the camera's own center, so scrollX only equals
     * worldView.x when zoom is exactly 1; at any other zoom they diverge by
     * `(width/2) * (1 - 1/zoom)`, which silently pulled every badge sideways
     * off its landmark at any zoom level other than 1. worldView already
     * accounts for zoom (and rotation, were it ever used) correctly, so
     * consumers can do a plain `(worldX - worldViewX) * zoom` projection.
     */
    worldViewX: number;
    worldViewY: number;
    /** World units -> CSS pixels (the camera's own zoom divided by the canvas resolution). */
    zoom: number;
    /** The canvas's width in CSS pixels (Scale.gameSize.width / resolution) -- the same value the camera's own zoom math is built around, so DOM overlays never need a separate window.innerWidth read that could diverge from it. */
    viewportWidth: number;
    snailX: number;
    snailY: number;
  };
};

/** Events React sends down into the Phaser world. */
export type AppToGameEvents = {
  'controls:setEnabled': { enabled: boolean };
  /** How dark a rain shower has made the map (the veil's opacity, 0 when dry), so DOM layers over it can match. */
  'weather:gloom': { amount: number };
  /** How hard it's raining, 0 (dry) to 1 (a shower's peak) -- for the rain's sound. */
  'weather:rain': { intensity: number };
  /** A gust of wind starts, blowing from the left or the right side of the view. */
  'weather:gust': { fromLeft: boolean };
  /** The kiosk vendor has just leaned out to greet the snail (once per approach). */
  'kiosk:greet': void;
  /** The fountain's spray starting (the snail came near) or stopping. */
  'fountain:spray': { spraying: boolean };
  /** The beaver diving, where it went under -- `startled` when it was clicked. */
  'beaver:splash': { x: number; y: number; startled: boolean };
  /** The campfire lighting up (the snail came near) or going out, and where it is. */
  'campfire:lit': { lit: boolean; x: number; y: number };
  /** Puts the snail down at a world point (and the camera on it) -- e.g. back in front of the castle after its minigame. */
  'snail:placeAt': { x: number; y: number };
  'controls:joystick': { x: number; y: number };
  'controls:interactPressed': void;
  'motion:setReduced': { reduced: boolean };
  'visited:hydrate': { ids: LandmarkId[] };
};

export type BridgeEvents = GameToAppEvents & AppToGameEvents;

type Listener<T> = (payload: T) => void;

/**
 * Tiny typed pub/sub, independent from Phaser and React, used as the single
 * integration point between the two layers. Avoids ad-hoc globals.
 */
export class TypedEventBus<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<Listener<unknown>>>();

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    const set = this.listeners.get(event) ?? new Set();
    set.add(listener as Listener<unknown>);
    this.listeners.set(event, set);
    return () => this.off(event, listener);
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.listeners.get(event)?.forEach((listener) => listener(payload));
  }

  clear(): void {
    this.listeners.clear();
  }
}

export type GameEventBus = TypedEventBus<BridgeEvents>;

export function createGameEventBus(): GameEventBus {
  return new TypedEventBus<BridgeEvents>();
}

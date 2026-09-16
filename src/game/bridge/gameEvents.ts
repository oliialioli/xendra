import type { LandmarkId } from '../../types/content';

/** Events emitted by the Phaser world for React to react to. */
export type GameToAppEvents = {
  'game:ready': void;
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
    zoom: number;
    /** Phaser's own tracked game/canvas width (Scale.gameSize.width) -- the same value the camera's own zoom math is built around, so DOM overlays never need a separate window.innerWidth read that could diverge from it. */
    viewportWidth: number;
    snailX: number;
    snailY: number;
  };
};

/** Events React sends down into the Phaser world. */
export type AppToGameEvents = {
  'controls:setEnabled': { enabled: boolean };
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

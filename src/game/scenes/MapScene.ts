import Phaser from 'phaser';
import type { GameBootData } from '../config/gameConfig';
import type { Landmark, LandmarkId, Vector2Like } from '../../types/content';
import {
  ISLAND_EDGE_MARGIN,
  ISLAND_POLYGON,
  LANDMARK_ASSET_OVERRIDES,
  LANDMARK_REVEAL_RADIUS,
  OBSTACLE_CIRCLES,
  OBSTACLE_RECTS,
  SPAWN_POINT,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../../content/mapGeometry';
import {
  clampTargetToWalkable,
  isInsideWithMargin,
  normalizeVector,
} from '../utils/geometry';
import {
  generateLandmarkMarkerTextures,
  generateSnailTextures,
} from '../utils/placeholderTextures';
import { analyzeOpaqueBuildingBounds, type OpaqueBounds } from '../utils/spriteBounds';
import { Snail, SNAIL_SPEED } from '../entities/Snail';
import { findNearestLandmark } from '../systems/proximity';
import { AmbientEffectsSystem } from '../systems/ambient';
import type { GameEventBus } from '../bridge/gameEvents';
import { assetPath } from '../../lib/assetPath';

type LandmarkVisual = {
  marker: Phaser.GameObjects.Image;
};

/**
 * Where a landmark's real-artwork sprite actually ended up on screen, kept
 * around purely for the debug overlay (drawDebug()) to draw the analyzed
 * opaque bounding box and anchor cross in world space -- computed once in
 * setUpLandmarkAssetSprites(), never per frame.
 */
type LandmarkSpriteRenderInfo = {
  analysis: OpaqueBounds;
  renderX: number;
  renderY: number;
  displayWidth: number;
  displayHeight: number;
};

/**
 * Tracks a landmark's optional lights-overlay sprite (see
 * LandmarkAssetConfig.lightsPath) so updateLandmarkLights() can compare the
 * snail's distance against LANDMARK_REVEAL_RADIUS once per frame and only
 * react on an actual enter/exit transition, never mid-tween.
 */
type LandmarkLightState = {
  sprite: Phaser.GameObjects.Image;
  landmark: Landmark;
  isLit: boolean;
};

type WasdKeys = Record<'W' | 'A' | 'S' | 'D' | 'E' | 'ENTER', Phaser.Input.Keyboard.Key>;

const DEBUG_ISLAND_COLOR = 0x2b6e6b;
const DEBUG_OBSTACLE_COLOR = 0xc9483c;
const DEBUG_MARGIN_COLOR = 0xc99a3e;
const DEBUG_INTERACTION_COLOR = 0x4a90d9;
const DEBUG_SPRITE_BOUNDS_COLOR = 0xe040fb;
const DEBUG_ANCHOR_CROSS_COLOR = 0xffee00;
const DEBUG_WORLD_POINT_COLOR = 0xff3d00;

/**
 * Approximate footprint radius of the snail (world units). The boundary check
 * uses this on top of ISLAND_EDGE_MARGIN so the snail's *body*, not just its
 * center point, stays clear of the coastline -- a wide sprite whose center is
 * "inside" by a hair can still visually clip the shoreline otherwise.
 */
const SNAIL_COLLISION_RADIUS = 12;

/**
 * Per-frame movement is clamped to this many seconds of delta time before it's
 * turned into a distance. Without this, a single slow/backgrounded frame (tab
 * refocus, a GC pause, a dev-tools reload) can produce a huge `delta` and a
 * movement step long enough to jump clean over the boundary check for that
 * frame -- the classic "tunneling" gap. 50ms caps the worst-case step to
 * ~8.5 world units at SNAIL_SPEED, safely inside the collision buffer above.
 */
const MAX_STEP_SECONDS = 0.05;

const CAMPFIRE_POSITION = { x: 2159, y: 540 };
const STAGE_LIGHT_OFFSETS = [
  { x: 730, y: 285 },
  { x: 815, y: 285 },
];

export class MapScene extends Phaser.Scene {
  private bus!: GameEventBus;
  private landmarks: Landmark[] = [];
  private visited = new Set<LandmarkId>();
  private reducedMotion = false;
  private controlsEnabled = true;

  private snail!: Snail;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: WasdKeys;
  private clickTarget: Vector2Like | null = null;
  private isDragTargeting = false;
  private joystickVector: Vector2Like = { x: 0, y: 0 };
  private nearestId: LandmarkId | null = null;

  private obstacleGroup!: Phaser.Physics.Arcade.StaticGroup;
  private landmarkVisuals = new Map<LandmarkId, LandmarkVisual>();
  private landmarkSpriteRenderInfo = new Map<LandmarkId, LandmarkSpriteRenderInfo>();
  private landmarkLights = new Map<LandmarkId, LandmarkLightState>();
  private ambient!: AmbientEffectsSystem;

  private keyD!: Phaser.Input.Keyboard.Key;
  private debugGraphics: Phaser.GameObjects.Graphics | null = null;
  private debugVisible = false;

  private unsubscribers: Array<() => void> = [];

  constructor() {
    super('map');
  }

  preload(): void {
    this.load.image('xendra-map', assetPath('/assets/map/xendra-map-base@2x.png'));
    this.load.svg('xendra-map-fallback', assetPath('/assets/map/placeholder-map.svg'), {
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
    });

    Object.entries(LANDMARK_ASSET_OVERRIDES).forEach(([id, config]) => {
      this.load.image(MapScene.landmarkAssetKey(id as LandmarkId), assetPath(config.path));
      if (config.lightsPath) {
        this.load.image(MapScene.landmarkLightsAssetKey(id as LandmarkId), assetPath(config.lightsPath));
      }
    });
  }

  create(): void {
    const bootData = this.registry.get('bootData') as GameBootData;
    this.bus = bootData.bus;
    this.landmarks = bootData.landmarks;
    this.visited = new Set(bootData.visitedIds);
    this.reducedMotion = bootData.reducedMotion;

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.setUpMapImage();
    generateSnailTextures(this);
    generateLandmarkMarkerTextures(this);

    this.setUpObstacles();
    this.setUpSnail();
    this.setUpCamera();
    this.setUpInput();
    this.setUpLandmarkVisuals();
    this.setUpLandmarkAssetSprites();

    this.ambient = new AmbientEffectsSystem(this, {
      reducedMotion: this.reducedMotion,
      campfirePosition: CAMPFIRE_POSITION,
      stageLightPositions: STAGE_LIGHT_OFFSETS,
      riverSparklePoints: ISLAND_POLYGON.filter((_, i) => i % 3 === 0),
      windLeafSpawnPoints: [
        { x: 900, y: 300 },
        { x: 1900, y: 700 },
      ],
    });

    this.setUpBridgeListeners();
    // In RESIZE mode game.scale.gameSize tracks the real container size and
    // is kept correct by Phaser itself on window resize/orientation change;
    // we only need to react to its own 'resize' event to recompute zoom.
    this.scale.on(Phaser.Scale.Events.RESIZE, this.updateCameraZoom);
    this.updateCameraZoom();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());

    this.bus.emit('game:ready', undefined);
  }

  update(_time: number, delta: number): void {
    this.emitCameraFrame();
    this.updateLandmarkLights();

    if (!this.controlsEnabled) {
      this.snail.setVelocity(0, 0);
      return;
    }

    // Only live while the map itself has control (no panel/menu/form open),
    // so typing a literal "d" in a form field never toggles debug mode.
    if (Phaser.Input.Keyboard.JustDown(this.keyD)) {
      this.toggleDebug();
    }

    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;

    const joystickActive = Math.abs(this.joystickVector.x) > 0.08 || Math.abs(this.joystickVector.y) > 0.08;

    if (joystickActive) {
      vx = Phaser.Math.Clamp(this.joystickVector.x, -1, 1);
      vy = Phaser.Math.Clamp(this.joystickVector.y, -1, 1);
      this.clickTarget = null;
    } else if (vx !== 0 || vy !== 0) {
      this.clickTarget = null;
      const normalized = normalizeVector(vx, vy);
      vx = normalized.x;
      vy = normalized.y;
    } else if (this.clickTarget) {
      const dx = this.clickTarget.x - this.snail.position.x;
      const dy = this.clickTarget.y - this.snail.position.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 6) {
        this.clickTarget = null;
      } else {
        const normalized = normalizeVector(dx, dy);
        vx = normalized.x;
        vy = normalized.y;
      }
    }

    const dtSeconds = Math.min(delta / 1000, MAX_STEP_SECONDS);
    const safeVelocity = this.resolveSafeVelocity(vx, vy, dtSeconds);
    this.snail.setVelocity(safeVelocity.x * SNAIL_SPEED, safeVelocity.y * SNAIL_SPEED);

    if (
      Phaser.Input.Keyboard.JustDown(this.wasd.E) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.ENTER)
    ) {
      this.tryInteract();
    }

    this.updateProximity();
  }

  private setUpMapImage(): void {
    const usingFallback = !this.textures.exists('xendra-map');
    const mapKey = usingFallback ? 'xendra-map-fallback' : 'xendra-map';
    const mapImage = this.add.image(0, 0, mapKey).setOrigin(0, 0);
    mapImage.setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);
    mapImage.setDepth(-1000);
    this.bus.emit('map:assetStatus', { usingFallback });
  }

  private setUpObstacles(): void {
    this.obstacleGroup = this.physics.add.staticGroup();

    OBSTACLE_RECTS.forEach((rect) => {
      const zone = this.add.zone(
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
        rect.width,
        rect.height,
      );
      this.physics.add.existing(zone, true);
      this.obstacleGroup.add(zone);
    });

    OBSTACLE_CIRCLES.forEach((circle) => {
      const zone = this.add.zone(circle.x, circle.y, circle.radius * 2, circle.radius * 2);
      this.physics.add.existing(zone, true);
      const body = zone.body as Phaser.Physics.Arcade.StaticBody;
      body.setCircle(circle.radius, -circle.radius, -circle.radius);
      this.obstacleGroup.add(zone);
    });
  }

  private setUpSnail(): void {
    this.snail = new Snail(this, SPAWN_POINT.x, SPAWN_POINT.y);
    this.physics.add.collider(this.snail.sprite, this.obstacleGroup);
  }

  private setUpCamera(): void {
    this.cameras.main.startFollow(this.snail.sprite, true, 0.08, 0.08);
  }

  private setUpInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D,E,ENTER') as unknown as WasdKeys;
    this.keyD = this.input.keyboard!.addKey('D', false);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.controlsEnabled) return;
      this.isDragTargeting = true;
      const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.setClickTarget({ x: world.x, y: world.y });
    });

    // Lets a finger (or a held mouse button) drag across the map to steer
    // continuously, rather than only being able to set one target per tap --
    // the touch-equivalent of holding a direction key, and much more direct
    // than re-tapping a new point every time the snail should turn.
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.controlsEnabled || !this.isDragTargeting || !pointer.isDown) return;
      const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.setClickTarget({ x: world.x, y: world.y });
    });

    this.input.on('pointerup', () => {
      this.isDragTargeting = false;
    });
  }

  private setUpLandmarkVisuals(): void {
    this.landmarks.forEach((landmark) => {
      const markerKey = this.visited.has(landmark.id) ? 'landmark-marker-visited' : 'landmark-marker';
      // Debug-only anchor dot: hidden during normal play, toggled with `D`.
      const marker = this.add.image(landmark.position.x, landmark.position.y, markerKey);
      marker.setDepth(landmark.position.y + 1);
      marker.setVisible(this.debugVisible);

      this.landmarkVisuals.set(landmark.id, { marker });
    });
  }

  private static landmarkAssetKey(id: LandmarkId): string {
    return `landmark-asset-${id}`;
  }

  private static landmarkLightsAssetKey(id: LandmarkId): string {
    return `landmark-asset-${id}-lights`;
  }

  /**
   * Overlays real artwork (see LANDMARK_ASSET_OVERRIDES) on top of the base
   * map for the landmarks that have it, replacing the generic building baked
   * into the map image at that spot. Purely visual: position, interaction
   * radius and collision are untouched, so proximity/interaction behave
   * exactly as before.
   *
   * Each asset's own pixels are analyzed once here (never per frame -- see
   * analyzeOpaqueBuildingBounds) to find the building's real anchor point and
   * visible width, excluding any transparent padding and any baked shadow the
   * PNG ships with. The result is cached in landmarkSpriteRenderInfo purely
   * for the debug overlay; the sprite itself only needs it once at creation.
   */
  private setUpLandmarkAssetSprites(): void {
    this.landmarks.forEach((landmark) => {
      const config = LANDMARK_ASSET_OVERRIDES[landmark.id];
      if (!config) return;

      const key = MapScene.landmarkAssetKey(landmark.id);
      const source = this.textures.get(key).source[0];
      const analysis = analyzeOpaqueBuildingBounds(source.image as HTMLImageElement | HTMLCanvasElement);

      const buildingPixelWidth = analysis.bbox.x1 - analysis.bbox.x0 + 1;
      const displayWidth = config.approvedBuildingWidth * (analysis.imageWidth / buildingPixelWidth);
      const displayHeight = displayWidth / (analysis.imageWidth / analysis.imageHeight);

      const renderX = landmark.position.x + config.renderOffset.x;
      const renderY = landmark.position.y + config.renderOffset.y;

      const sprite = this.add.image(renderX, renderY, key);
      sprite.setOrigin(analysis.origin.x, analysis.origin.y);
      sprite.setDisplaySize(displayWidth, displayHeight);
      // Sorted by its ground-contact point, like the snail, so passing in
      // front of/behind it looks right instead of always drawing on top.
      sprite.setDepth(renderY);

      this.landmarkSpriteRenderInfo.set(landmark.id, { analysis, renderX, renderY, displayWidth, displayHeight });

      if (config.lightsPath) {
        // Deliberately reuses the exact same analysis/origin/position/size as
        // the base sprite above -- never recomputed independently -- so the
        // two images can never drift apart across zoom, viewport or
        // orientation changes. Starts fully off; updateLandmarkLights() owns
        // its opacity from here on.
        const lightsKey = MapScene.landmarkLightsAssetKey(landmark.id);
        const lightsSprite = this.add.image(renderX, renderY, lightsKey);
        lightsSprite.setOrigin(analysis.origin.x, analysis.origin.y);
        lightsSprite.setDisplaySize(displayWidth, displayHeight);
        lightsSprite.setDepth(renderY + 0.5);
        lightsSprite.setAlpha(0);

        this.landmarkLights.set(landmark.id, { sprite: lightsSprite, landmark, isLit: false });
      }
    });
  }

  private setUpBridgeListeners(): void {
    this.unsubscribers.push(
      this.bus.on('controls:setEnabled', ({ enabled }) => this.setControlsEnabled(enabled)),
      this.bus.on('controls:joystick', ({ x, y }) => {
        this.joystickVector = { x, y };
      }),
      this.bus.on('controls:interactPressed', () => this.tryInteract()),
      this.bus.on('motion:setReduced', ({ reduced }) => {
        this.reducedMotion = reduced;
        this.ambient.setReducedMotion(reduced);
      }),
      this.bus.on('visited:hydrate', ({ ids }) => {
        this.visited = new Set(ids);
        this.refreshVisitedMarkers();
      }),
    );
  }

  private updateProximity(): void {
    const nearest = findNearestLandmark(this.snail.position, this.landmarks);
    if (nearest === this.nearestId) return;

    this.nearestId = nearest;
    this.bus.emit('landmark:proximityChanged', { nearestId: nearest });
    this.ambient.setStageActive(nearest === 'stage');

    if (nearest && !this.visited.has(nearest)) {
      this.visited.add(nearest);
      this.bus.emit('landmark:discovered', { id: nearest });
      this.markVisited(nearest);
      this.snail.playDiscoveryPulse();
    }
  }

  /**
   * Drives each landmark's optional lights-overlay sprite (see
   * LandmarkAssetConfig.lightsPath) purely off distance to
   * LANDMARK_REVEAL_RADIUS -- independent of nearestId/interaction, so the
   * lights react before the player is close enough to open any panel. Runs
   * every frame but only starts a new tween on an actual enter/exit edge
   * (`withinRange !== state.isLit`), never while already lit/unlit, so the
   * ignite sequence can't restart mid-flight while the snail lingers inside.
   */
  private updateLandmarkLights(): void {
    this.landmarkLights.forEach((state) => {
      const distance = Math.hypot(
        this.snail.position.x - state.landmark.position.x,
        this.snail.position.y - state.landmark.position.y,
      );
      const withinRange = distance <= LANDMARK_REVEAL_RADIUS;
      if (withinRange === state.isLit) return;

      state.isLit = withinRange;
      this.tweens.killTweensOf(state.sprite);

      if (withinRange) {
        if (this.reducedMotion) {
          this.tweens.add({ targets: state.sprite, alpha: 1, duration: 220, ease: 'Sine.easeOut' });
        } else {
          this.tweens.chain({
            targets: state.sprite,
            tweens: [
              { alpha: 0.35, duration: 220, ease: 'Sine.easeOut' },
              { alpha: 0.2, duration: 160, ease: 'Sine.easeInOut' },
              { alpha: 1, duration: 320, ease: 'Sine.easeIn' },
            ],
          });
        }
      } else {
        this.tweens.add({ targets: state.sprite, alpha: 0, duration: 400, ease: 'Sine.easeOut' });
      }
    });
  }

  private tryInteract(): void {
    if (!this.controlsEnabled || !this.nearestId) return;
    this.bus.emit('landmark:interact', { id: this.nearestId });
  }

  private setControlsEnabled(enabled: boolean): void {
    this.controlsEnabled = enabled;
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    if (enabled) {
      keyboard.enableGlobalCapture();
    } else {
      keyboard.disableGlobalCapture();
      this.clickTarget = null;
      this.isDragTargeting = false;
    }
  }

  /**
   * True when `vx`/`vy` (a normalized -1..1 direction) is safe to apply this
   * frame -- i.e. the predicted next position stays on the walkable island.
   * If the diagonal step would cross the boundary, tries sliding along a
   * single axis instead (like sliding along a wall) before giving up and
   * holding position, so movement never tunnels through the coastline.
   */
  private resolveSafeVelocity(vx: number, vy: number, dtSeconds: number): Vector2Like {
    if (vx === 0 && vy === 0) return { x: 0, y: 0 };

    const pos = this.snail.position;
    const stepX = vx * SNAIL_SPEED * dtSeconds;
    const stepY = vy * SNAIL_SPEED * dtSeconds;

    if (this.isWalkable({ x: pos.x + stepX, y: pos.y + stepY })) {
      return { x: vx, y: vy };
    }

    const canSlideX = stepX !== 0 && this.isWalkable({ x: pos.x + stepX, y: pos.y });
    const canSlideY = stepY !== 0 && this.isWalkable({ x: pos.x, y: pos.y + stepY });

    if (canSlideX) return { x: vx, y: 0 };
    if (canSlideY) return { x: 0, y: vy };
    return { x: 0, y: 0 };
  }

  private setClickTarget(point: Vector2Like): void {
    const clamped = clampTargetToWalkable(this.snail.position, point, (candidate) =>
      this.isWalkable(candidate),
    );
    this.clickTarget = clamped;
  }

  private isWalkable(point: Vector2Like): boolean {
    // Island edge: margin + the snail's own footprint radius, so its body
    // (not just its center point) stays clear of the coastline. There is no
    // real physics body for "water", so this logical check is the only thing
    // keeping the snail out of it.
    if (!isInsideWithMargin(point, ISLAND_POLYGON, ISLAND_EDGE_MARGIN + SNAIL_COLLISION_RADIUS)) {
      return false;
    }

    // Obstacles (buildings, fountain, postbox) already have a real Arcade
    // static body colliding with the snail's own body -- checked at its raw
    // size here, deliberately NOT inflated by SNAIL_COLLISION_RADIUS. Doing
    // that would make this logical check stricter than the physical collider,
    // which can rest the sprite closer than the inflated radius and leave it
    // unable to find any "safe" direction out (stuck).
    for (const rect of OBSTACLE_RECTS) {
      if (
        point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height
      ) {
        return false;
      }
    }

    for (const circle of OBSTACLE_CIRCLES) {
      if (Math.hypot(point.x - circle.x, point.y - circle.y) < circle.radius) {
        return false;
      }
    }

    return true;
  }

  private markVisited(id: LandmarkId): void {
    const visual = this.landmarkVisuals.get(id);
    visual?.marker.setTexture('landmark-marker-visited');
  }

  private refreshVisitedMarkers(): void {
    this.landmarkVisuals.forEach((visual, id) => {
      visual.marker.setTexture(this.visited.has(id) ? 'landmark-marker-visited' : 'landmark-marker');
    });
  }

  private toggleDebug(): void {
    this.debugVisible = !this.debugVisible;

    // Landmark anchor dots are a developer aid only -- never shown in normal play.
    this.landmarkVisuals.forEach((visual) => visual.marker.setVisible(this.debugVisible));

    if (this.debugVisible) {
      this.drawDebug();
    } else {
      this.debugGraphics?.clear();
    }
  }

  /**
   * Draws the walkable island boundary, its edge margin, every obstacle, each
   * landmark's interaction radius, and -- for landmarks with real artwork --
   * the analyzed opaque bounding box and anchor cross used to place that
   * artwork. Toggled with `D`.
   */
  private drawDebug(): void {
    if (!this.debugGraphics) {
      this.debugGraphics = this.add.graphics();
      this.debugGraphics.setDepth(100000);
    }
    const g = this.debugGraphics;
    g.clear();

    const polygonPoints = ISLAND_POLYGON.map((p) => new Phaser.Math.Vector2(p.x, p.y));

    // Approximate margin buffer band (not a true offset polygon, just a visual guide) --
    // matches the actual walkable check, which is margin + the snail's own radius.
    g.lineStyle((ISLAND_EDGE_MARGIN + SNAIL_COLLISION_RADIUS) * 2, DEBUG_MARGIN_COLOR, 0.25);
    g.strokePoints(polygonPoints, true, true);

    // Actual walkable boundary (island coastline).
    g.lineStyle(4, DEBUG_ISLAND_COLOR, 0.9);
    g.strokePoints(polygonPoints, true, true);

    // Static obstacles (buildings, fountain, postbox...) at their real size --
    // these already have their own Arcade collider, unaffected by the snail's
    // logical collision radius (see the comment in isWalkable()).
    g.lineStyle(3, DEBUG_OBSTACLE_COLOR, 0.9);
    OBSTACLE_RECTS.forEach((rect) => g.strokeRect(rect.x, rect.y, rect.width, rect.height));
    OBSTACLE_CIRCLES.forEach((circle) => g.strokeCircle(circle.x, circle.y, circle.radius));

    // Each landmark's interactive area (proximity radius used to find the
    // "nearest" landmark and enable the interact button).
    g.lineStyle(2, DEBUG_INTERACTION_COLOR, 0.7);
    this.landmarks.forEach((landmark) => {
      g.strokeCircle(landmark.position.x, landmark.position.y, landmark.interactionRadius);
    });

    // Real-artwork landmarks: the analyzed opaque bounding box (excluding
    // padding/shadow) in world space, a cross at the exact point where the
    // sprite's origin lands, and a small ring at the landmark's own world
    // point -- these two are always the same spot by construction
    // (setOrigin() places the origin fraction exactly at renderX/renderY,
    // which is landmark.position + renderOffset), so the cross and the ring
    // should look perfectly concentric here.
    this.landmarks.forEach((landmark) => {
      const info = this.landmarkSpriteRenderInfo.get(landmark.id);
      if (!info) return;
      const { analysis, renderX, renderY, displayWidth, displayHeight } = info;

      const topLeftX = renderX - analysis.origin.x * displayWidth;
      const topLeftY = renderY - analysis.origin.y * displayHeight;
      const scaleX = displayWidth / analysis.imageWidth;
      const scaleY = displayHeight / analysis.imageHeight;

      const boxX = topLeftX + analysis.bbox.x0 * scaleX;
      const boxY = topLeftY + analysis.bbox.y0 * scaleY;
      const boxW = (analysis.bbox.x1 - analysis.bbox.x0 + 1) * scaleX;
      const boxH = (analysis.bbox.y1 - analysis.bbox.y0 + 1) * scaleY;

      g.lineStyle(2, DEBUG_SPRITE_BOUNDS_COLOR, 0.9);
      g.strokeRect(boxX, boxY, boxW, boxH);

      // World point: landmark.position + renderOffset (the placement point).
      g.lineStyle(2, DEBUG_WORLD_POINT_COLOR, 1);
      g.strokeCircle(renderX, renderY, 6);

      // Asset anchor: where the sprite's own origin fraction lands.
      const crossSize = 12;
      g.lineStyle(3, DEBUG_ANCHOR_CROSS_COLOR, 1);
      g.lineBetween(renderX - crossSize, renderY, renderX + crossSize, renderY);
      g.lineBetween(renderX, renderY - crossSize, renderX, renderY + crossSize);
    });
  }

  private updateCameraZoom = (): void => {
    const { width, height } = this.scale.gameSize;
    if (width === 0 || height === 0) return;

    // Smaller viewports get a *smaller* desired world-width so zoom ends up
    // higher (camera closer, snail stays legible); wide desktops get a large
    // desired world-width so zoom stays near 1 and shows an ample area of the island.
    const desiredVisibleWidth = width < 700 ? 550 : width < 1100 ? 1100 : 2000;
    let zoom = Phaser.Math.Clamp(width / desiredVisibleWidth, 0.5, 1.6);

    // Never zoom out far enough to reveal space beyond the world bounds --
    // the camera must always stay fully covered by the island's world image.
    const minZoomToCoverViewport = Math.max(width / WORLD_WIDTH, height / WORLD_HEIGHT);
    zoom = Math.max(zoom, minZoomToCoverViewport);

    this.cameras.main.setZoom(zoom);
  };

  /**
   * Reports the camera's current transform and the snail's world position
   * every frame so DOM overlays (DiscoveryIndicators) can project each
   * landmark's world position to screen pixels themselves and stay glued to
   * the map through the camera's continuous follow-lerp and any zoom change.
   */
  private emitCameraFrame(): void {
    const camera = this.cameras.main;
    this.bus.emit('camera:frame', {
      scrollX: camera.scrollX,
      scrollY: camera.scrollY,
      zoom: camera.zoom,
      snailX: this.snail.position.x,
      snailY: this.snail.position.y,
    });
  }

  private cleanup(): void {
    this.scale.off(Phaser.Scale.Events.RESIZE, this.updateCameraZoom);
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    this.ambient.destroy();
  }
}

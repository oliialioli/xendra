import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Question } from '@phosphor-icons/react';
import { LANDMARK_INDICATOR_CONFIG } from '../features/navigation/landmarkIndicatorConfig';
import { PhaserGame } from '../game/PhaserGame';
import { Hud } from '../features/navigation/Hud';
import { MenuDrawer } from '../features/navigation/MenuDrawer';
import { TouchControls } from '../features/navigation/TouchControls';
import { DiscoveryIndicators } from '../features/navigation/DiscoveryIndicators';
import { NavigationHint } from '../features/navigation/NavigationHint';
import { IntroScreen } from '../features/intro/IntroScreen';
import { Panel } from '../components/Panel';
import { LiveRegion } from '../components/LiveRegion';
import { DevWarningBanner } from '../components/DevWarningBanner';
import { WorldLoading } from '../components/WorldLoading';
import { Toast } from '../components/Toast';
import { BoatFleet } from '../features/boats/BoatFleet';
import { BoatCreator } from '../features/boats/BoatCreator';
import { useBoatFleet } from '../features/boats/useBoatFleet';
import { useWorldAmbience } from '../features/audio/ambience/useWorldAmbience';
import { CastleGame } from '../features/castleGame/CastleGame';
import { CASTLE_ENTRANCE, DOCK_FRONT } from '../content/mapGeometry';
import { useGameBridge } from './providers/GameBridgeContext';
import { useSettings } from './providers/SettingsContext';
import { useProgress } from './providers/ProgressContext';
import { xendraContent, landmarkById } from '../content/xendraContent';
import { MAP_ROUTE, panelRouteByLandmarkId, panelRouteByPath } from './routes';
import { sendAnalyticsEvent } from '../lib/analytics';
import type { LandmarkId } from '../types/content';

export function MapLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const bus = useGameBridge();
  const settings = useSettings();
  const progress = useProgress();

  const [menuOpen, setMenuOpen] = useState(false);
  const [nearestId, setNearestId] = useState<LandmarkId | null>(null);
  const [usingFallbackMap, setUsingFallbackMap] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');
  const [navigationHintOpen, setNavigationHintOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [boatCardOpen, setBoatCardOpen] = useState(false);
  const [gloom, setGloom] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loaderShown, setLoaderShown] = useState(false);

  const fleet = useBoatFleet();
  /** The last landmark opened from the map itself (not the menu or a link) -- so we know where the snail is standing. */
  const openedOnMapRef = useRef<LandmarkId | null>(null);

  // Captured once: the game reads later updates via the 'visited:hydrate' bridge event.
  const [initialVisitedIds] = useState<LandmarkId[]>(() => Array.from(progress.visited));

  const panelEntry = panelRouteByPath.get(location.pathname) ?? null;
  // Same line icon as the landmark's own map badge, so a panel reads as
  // "the thing you just opened".
  const PanelIcon = panelEntry ? LANDMARK_INDICATOR_CONFIG[panelEntry.landmarkId].icon : null;
  const isMapRoute = location.pathname === MAP_ROUTE;
  useWorldAmbience(bus, panelEntry ? panelEntry.route : null);
  const isUnknownRoute = !isMapRoute && !panelEntry;
  // The intro opens on every visit (every page load), not just the first --
  // it's the way into the island. Only leaving it dismisses it, for this load.
  // A visit that starts on a link straight to a panel (or the castle game)
  // skips it: closing that panel goes straight to the map.
  const [introDismissed, setIntroDismissed] = useState(() => location.pathname !== MAP_ROUTE);
  const showIntro = isMapRoute && !introDismissed && !menuOpen;
  const controlsBlocked = Boolean(panelEntry) || isUnknownRoute || menuOpen || showIntro;

  useEffect(() => {
    bus.emit('controls:setEnabled', { enabled: !controlsBlocked });
  }, [controlsBlocked, bus]);

  // The map scene starts after this layout, so on a direct visit to a panel
  // (or the castle game) the message above goes out before anything is
  // listening -- the map would keep its controls, and keep swallowing keys
  // (Enter, Space, WASD) typed into the panel. Tell it again once it's up.
  const controlsBlockedRef = useRef(controlsBlocked);
  useEffect(() => {
    controlsBlockedRef.current = controlsBlocked;
  }, [controlsBlocked]);
  useEffect(
    () => bus.on('game:ready', () => bus.emit('controls:setEnabled', { enabled: !controlsBlockedRef.current })),
    [bus],
  );

  useEffect(() => {
    bus.emit('motion:setReduced', { reduced: settings.effectiveReducedMotion });
  }, [settings.effectiveReducedMotion, bus]);

  // Auto-shows the instant the map first becomes interactive (whether that's
  // true from the very first render, e.g. the intro was already seen in an
  // earlier visit, or only becomes true later once the intro/menu/panel
  // clears) -- but only once per session, and only if the player has never
  // dismissed it before. See NavigationHint's own doc comment for how it
  // then gets dismissed (its close button, a first arrow key, or a first
  // real touch drag) and markNavigationHintSeen for why it won't reappear on
  // its own after that. Adjusts state directly during render -- React's own
  // documented pattern for this -- rather than in an effect, since an effect
  // calling setState here would just add an extra render round-trip.
  const [autoShown, setAutoShown] = useState(false);
  if (!autoShown && !controlsBlocked && !settings.hasSeenNavigationHint) {
    setAutoShown(true);
    setNavigationHintOpen(true);
  }

  // Memoized so NavigationHint's own effect (keyed on this identity) doesn't
  // tear down and re-attach its dismiss listeners on every unrelated
  // MapLayout re-render (e.g. nearestId changing) -- which would silently
  // drop an in-progress touch drag or reset its reopen-grace-period clock
  // mid-gesture.
  const dismissNavigationHint = useCallback(() => {
    setNavigationHintOpen(false);
    settings.markNavigationHintSeen();
  }, [settings]);

  useEffect(() => {
    const offInteract = bus.on('landmark:interact', ({ id }) => {
      const landmark = landmarkById.get(id);
      if (!landmark) return;
      sendAnalyticsEvent({ type: 'panel_opened', landmarkId: id, source: 'map' });
      openedOnMapRef.current = id;
      navigate(landmark.route);
    });

    const offDiscovered = bus.on('landmark:discovered', ({ id }) => {
      progress.markVisited(id);
      sendAnalyticsEvent({ type: 'landmark_discovered', landmarkId: id });
      const landmark = landmarkById.get(id);
      if (landmark) setLiveMessage(`Aurkitu duzu: ${landmark.title}.`);
    });

    const offProximity = bus.on('landmark:proximityChanged', ({ nearestId: id }) => {
      setNearestId(id);
      if (id) {
        const landmark = landmarkById.get(id);
        if (landmark) setLiveMessage(`${landmark.title} ondoan. Sakatu E elkarreragiteko.`);
      }
    });

    const offAsset = bus.on('map:assetStatus', ({ usingFallback }) => {
      setUsingFallbackMap(usingFallback);
    });

    const offGloom = bus.on('weather:gloom', ({ amount }) => setGloom(amount));
    const offProgress = bus.on('map:loadProgress', ({ progress }) => setLoadProgress(progress));
    const offReady = bus.on('game:ready', () => setMapReady(true));

    return () => {
      offInteract();
      offDiscovered();
      offProximity();
      offAsset();
      offGloom();
      offProgress();
      offReady();
    };
  }, [bus, navigate, progress]);

  // The loading screen, once the island would be on screen (past the intro)
  // but isn't ready yet -- after a short beat, so a quick (cached) load never
  // flashes it. Once shown it stays mounted to fade out.
  useEffect(() => {
    if (mapReady || showIntro) return undefined;
    const timer = window.setTimeout(() => setLoaderShown(true), 250);
    return () => window.clearTimeout(timer);
  }, [mapReady, showIntro]);

  // After typing on a phone (an alias, a boat's message), iOS can leave the
  // page scrolled where the keyboard pushed it; this layout never scrolls, so
  // put it back once the field loses focus.
  useEffect(() => {
    const onFocusOut = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      window.requestAnimationFrame(() => {
        if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0);
      });
    };
    document.addEventListener('focusout', onFocusOut);
    return () => document.removeEventListener('focusout', onFocusOut);
  }, []);

  useEffect(() => {
    bus.emit('visited:hydrate', { ids: Array.from(progress.visited) });
  }, [progress.visited, bus]);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeout = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  // Opening a panel from the menu or a direct URL counts as visiting it too,
  // not just proximity discovery on the map.
  useEffect(() => {
    if (panelEntry) progress.markVisited(panelEntry.landmarkId);
  }, [panelEntry, progress]);

  const nearestLandmark = nearestId ? landmarkById.get(nearestId) : null;

  return (
    <div
      // Rain dims the map canvas; the boats and badges laid over it in the DOM dim along with it (see their .root).
      data-gloomy={gloom > 0 || undefined}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100dvw',
        height: '100dvh',
        overflow: 'hidden',
        ['--weather-gloom' as string]: gloom,
      }}
    >
      <a className="skip-link" href="#main-content">
        Salto egin edukira
      </a>
      <h1 id="main-content" tabIndex={-1} className="visually-hidden">
        Xendra — mapa interaktiboa
      </h1>

      <PhaserGame
        bus={bus}
        landmarks={xendraContent.landmarks}
        visitedIds={initialVisitedIds}
        reducedMotion={settings.effectiveReducedMotion}
      />

      {usingFallbackMap && <DevWarningBanner />}

      {loaderShown && <WorldLoading progress={loadProgress} done={mapReady} />}

      <DiscoveryIndicators
        bus={bus}
        landmarks={xendraContent.landmarks}
        nearestId={nearestId}
        suppressed={controlsBlocked}
        reducedMotion={settings.effectiveReducedMotion}
        onInteract={(id) => bus.emit('landmark:interact', { id })}
      />

      <Hud
        // The section's own name, as the menu and the map badge call it.
        nearestLabel={nearestLandmark ? (panelRouteByLandmarkId.get(nearestLandmark.id)?.title ?? nearestLandmark.shortLabel) : null}
        onOpenMenu={() => setMenuOpen(true)}
        onInteract={() => bus.emit('controls:interactPressed', undefined)}
        onOpenNavigationHint={() => setNavigationHintOpen(true)}
        interactionHidden={controlsBlocked || boatCardOpen}
      />

      <TouchControls bus={bus} hidden={controlsBlocked} />

      <BoatFleet
        bus={bus}
        boats={fleet.boats}
        loaded={!fleet.loading}
        reducedMotion={settings.effectiveReducedMotion}
        suppressed={controlsBlocked}
        onBoatCardOpenChange={setBoatCardOpen}
      />

      {/*
        Also suppressed (not just controlled by navigationHintOpen) while a
        landmark's own interact prompt is showing (Hud's proximityBar) --
        both are bottom/bottom-center anchored, and the spawn point sits
        inside the fountain's own interaction radius, so on a first visit
        they'd otherwise overlap right from the very first frame. This never
        touches navigationHintOpen itself, so stepping away reveals it again
        rather than losing the one-time auto-show to a landmark that merely
        happened to be nearby.
      */}
      <NavigationHint open={navigationHintOpen && !nearestId} onDismiss={dismissNavigationHint} />

      <LiveRegion message={liveMessage} />
      <Toast message={toastMessage} />

      {showIntro && (
        <IntroScreen
          onEnter={() => setIntroDismissed(true)}
          onOpenMenu={() => {
            setIntroDismissed(true);
            setMenuOpen(true);
          }}
        />
      )}

      {menuOpen && <MenuDrawer onClose={() => setMenuOpen(false)} />}

      {panelEntry && panelEntry.landmarkId === 'castle' ? (
        <CastleGame
          onClose={() => {
            // Back out of the castle's door, wherever the game was opened from.
            bus.emit('snail:placeAt', CASTLE_ENTRANCE);
            navigate(MAP_ROUTE);
          }}
        />
      ) : panelEntry && panelEntry.landmarkId === 'dockMessages' ? (
        <BoatCreator
          onClose={() => navigate(MAP_ROUTE)}
          onBoatCreated={(boat) => {
            fleet.addBoat(boat);
            // The new boat sets off from the dock: if the creator was opened
            // from the menu or a link, take the snail there so it's seen.
            if (openedOnMapRef.current !== 'dockMessages') bus.emit('snail:placeAt', DOCK_FRONT);
            openedOnMapRef.current = null;
            setToastMessage('Zure mezua Argan barrena doa!');
          }}
        />
      ) : (
        panelEntry &&
        PanelIcon && (
          <Panel
            title={panelEntry.title}
            variant={panelEntry.variant}
            icon={<PanelIcon size={20} aria-hidden="true" />}
            onClose={() => navigate(MAP_ROUTE)}
          >
            <panelEntry.Component />
          </Panel>
        )
      )}

      {isUnknownRoute && (
        <Panel title="Orri ezezaguna" icon={<Question size={20} aria-hidden="true" />} onClose={() => navigate(MAP_ROUTE)}>
          <p>Helbide hau ez dagokio Xendraren atal bati ere.</p>
          <button type="button" className="xnd-btn-primary" onClick={() => navigate(MAP_ROUTE)}>
            Itzuli mapara
          </button>
        </Panel>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { useGameBridge } from './providers/GameBridgeContext';
import { useSettings } from './providers/SettingsContext';
import { useProgress } from './providers/ProgressContext';
import { xendraContent, landmarkById } from '../content/xendraContent';
import { MAP_ROUTE, panelRouteByPath } from './routes';
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

  // Captured once: the game reads later updates via the 'visited:hydrate' bridge event.
  const [initialVisitedIds] = useState<LandmarkId[]>(() => Array.from(progress.visited));

  const panelEntry = panelRouteByPath.get(location.pathname) ?? null;
  const isMapRoute = location.pathname === MAP_ROUTE;
  const isUnknownRoute = !isMapRoute && !panelEntry;
  const showIntro = isMapRoute && !settings.hasSeenIntro && !menuOpen;
  const controlsBlocked = Boolean(panelEntry) || isUnknownRoute || menuOpen || showIntro;

  useEffect(() => {
    bus.emit('controls:setEnabled', { enabled: !controlsBlocked });
  }, [controlsBlocked, bus]);

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

    return () => {
      offInteract();
      offDiscovered();
      offProximity();
      offAsset();
    };
  }, [bus, navigate, progress]);

  useEffect(() => {
    bus.emit('visited:hydrate', { ids: Array.from(progress.visited) });
  }, [progress.visited, bus]);

  // Opening a panel from the menu or a direct URL counts as visiting it too,
  // not just proximity discovery on the map.
  useEffect(() => {
    if (panelEntry) progress.markVisited(panelEntry.landmarkId);
  }, [panelEntry, progress]);

  const nearestLandmark = nearestId ? landmarkById.get(nearestId) : null;

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100dvw', height: '100dvh', overflow: 'hidden' }}>
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

      <DiscoveryIndicators
        bus={bus}
        landmarks={xendraContent.landmarks}
        nearestId={nearestId}
        suppressed={controlsBlocked}
        reducedMotion={settings.effectiveReducedMotion}
        onInteract={(id) => bus.emit('landmark:interact', { id })}
      />

      <Hud
        nearestLabel={nearestLandmark ? nearestLandmark.shortLabel : null}
        onOpenMenu={() => setMenuOpen(true)}
        onInteract={() => bus.emit('controls:interactPressed', undefined)}
        onOpenNavigationHint={() => setNavigationHintOpen(true)}
        interactionHidden={controlsBlocked}
      />

      <TouchControls bus={bus} hidden={controlsBlocked} />

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

      {showIntro && (
        <IntroScreen
          onEnter={() => settings.markIntroSeen()}
          onOpenMenu={() => {
            settings.markIntroSeen();
            setMenuOpen(true);
          }}
        />
      )}

      {menuOpen && <MenuDrawer onClose={() => setMenuOpen(false)} />}

      {panelEntry && (
        <Panel
          title={panelEntry.title}
          variant={panelEntry.variant}
          icon={panelEntry.icon}
          onClose={() => navigate(MAP_ROUTE)}
        >
          <panelEntry.Component />
        </Panel>
      )}

      {isUnknownRoute && (
        <Panel title="Orri ezezaguna" icon="?" onClose={() => navigate(MAP_ROUTE)}>
          <p>Helbide hau ez dagokio Xendraren atal bati ere.</p>
          <button type="button" className="xnd-btn-primary" onClick={() => navigate(MAP_ROUTE)}>
            Itzuli mapara
          </button>
        </Panel>
      )}
    </div>
  );
}

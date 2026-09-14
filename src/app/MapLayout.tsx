import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PhaserGame } from '../game/PhaserGame';
import { Hud } from '../features/navigation/Hud';
import { MenuDrawer } from '../features/navigation/MenuDrawer';
import { TouchControls } from '../features/navigation/TouchControls';
import { DiscoveryIndicators } from '../features/navigation/DiscoveryIndicators';
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
        onInteract={() => bus.emit('controls:interactPressed', undefined)}
      />

      <Hud
        nearestLabel={nearestLandmark ? nearestLandmark.shortLabel : null}
        onOpenMenu={() => setMenuOpen(true)}
        onInteract={() => bus.emit('controls:interactPressed', undefined)}
        interactionHidden={controlsBlocked}
      />

      <TouchControls bus={bus} hidden={controlsBlocked} />

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

import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GameBridgeProvider } from './providers/GameBridgeContext';
import { SettingsProvider } from './providers/SettingsContext';
import { ProgressProvider } from './providers/ProgressContext';
import { AudioProvider } from '../features/audio/AudioContext';
import { MapLayout } from './MapLayout';
import { MAP_ROUTE } from './routes';

export function App() {
  return (
    <SettingsProvider>
      <ProgressProvider>
        <GameBridgeProvider>
          <AudioProvider>
            <HashRouter>
              <Routes>
                <Route path="/" element={<Navigate to={MAP_ROUTE} replace />} />
                <Route path="*" element={<MapLayout />} />
              </Routes>
            </HashRouter>
          </AudioProvider>
        </GameBridgeProvider>
      </ProgressProvider>
    </SettingsProvider>
  );
}

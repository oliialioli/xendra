import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GameBridgeProvider } from './providers/GameBridgeContext';
import { SettingsProvider } from './providers/SettingsContext';
import { ProgressProvider } from './providers/ProgressContext';
import { AudioProvider } from '../features/audio/AudioContext';
import { MapLayout } from './MapLayout';

export function App() {
  return (
    <SettingsProvider>
      <ProgressProvider>
        <GameBridgeProvider>
          <AudioProvider>
            {/* Real paths (xendra.eus/musika...): every one is the map, with that section open on it. */}
            <BrowserRouter>
              <Routes>
                <Route path="*" element={<MapLayout />} />
              </Routes>
            </BrowserRouter>
          </AudioProvider>
        </GameBridgeProvider>
      </ProgressProvider>
    </SettingsProvider>
  );
}

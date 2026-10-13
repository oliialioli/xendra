import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GameBridgeProvider } from './providers/GameBridgeContext';
import { SettingsProvider } from './providers/SettingsContext';
import { ProgressProvider } from './providers/ProgressContext';
import { AudioProvider } from '../features/audio/AudioContext';
import { MapLayout } from './MapLayout';
import { LanguageProvider } from '../i18n/LanguageContext';

export function App() {
  return (
    <SettingsProvider>
      <ProgressProvider>
        <GameBridgeProvider>
          <AudioProvider>
            {/* Real paths (xendra.eus/musika, xendra.eus/es/musika...): every one is the map, with that section open on it. */}
            <BrowserRouter>
              <LanguageProvider>
                <Routes>
                  <Route path="*" element={<MapLayout />} />
                </Routes>
              </LanguageProvider>
            </BrowserRouter>
          </AudioProvider>
        </GameBridgeProvider>
      </ProgressProvider>
    </SettingsProvider>
  );
}

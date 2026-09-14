import { createContext, useContext, useState, type ReactNode } from 'react';
import { createGameEventBus, type GameEventBus } from '../../game/bridge/gameEvents';

const GameBridgeContext = createContext<GameEventBus | null>(null);

export function GameBridgeProvider({ children }: { children: ReactNode }) {
  const [bus] = useState<GameEventBus>(() => createGameEventBus());
  return <GameBridgeContext.Provider value={bus}>{children}</GameBridgeContext.Provider>;
}

export function useGameBridge(): GameEventBus {
  const ctx = useContext(GameBridgeContext);
  if (!ctx) throw new Error('useGameBridge must be used within GameBridgeProvider');
  return ctx;
}

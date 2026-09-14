import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { LandmarkId } from '../../types/content';
import { readJSON, storageKey, writeJSON } from '../../lib/storage';

const VISITED_KEY = storageKey('visited');

function readVisited(): LandmarkId[] {
  const value = readJSON<unknown>(VISITED_KEY, []);
  return Array.isArray(value) ? (value.filter((v) => typeof v === 'string') as LandmarkId[]) : [];
}

type ProgressContextValue = {
  visited: Set<LandmarkId>;
  markVisited: (id: LandmarkId) => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [visited, setVisited] = useState<Set<LandmarkId>>(() => new Set(readVisited()));

  const value = useMemo<ProgressContextValue>(
    () => ({
      visited,
      markVisited: (id: LandmarkId) => {
        setVisited((prev) => {
          if (prev.has(id)) return prev;
          const next = new Set(prev);
          next.add(id);
          writeJSON(VISITED_KEY, Array.from(next));
          return next;
        });
      },
    }),
    [visited],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}

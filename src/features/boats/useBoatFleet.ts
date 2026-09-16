import { useEffect, useRef, useState } from 'react';
import { getBoatRepository, type BoatRepositoryMode } from './boatRepository';
import type { Boat } from './boatTypes';

export type BoatFleetState = {
  boats: Boat[];
  loading: boolean;
  loadError: boolean;
  /** True when running on the localStorage adapter (no credentials configured) -- see boatRepository.ts. */
  isLocalMode: boolean;
  /** Inserts a boat if not already known (by id) -- used both for the realtime onInsert handler and BoatCreator's own optimistic local add right after a successful submit, so the two can never double-insert the same boat. */
  addBoat: (boat: Boat) => void;
  removeBoat: (id: string) => void;
};

/**
 * Owns the single shared list of published boats for the whole map: loads
 * the initial list once, subscribes to inserts/deletes from other visitors,
 * and de-duplicates by id so a boat this tab just published (added
 * optimistically by BoatCreator) is never rendered twice if/when the
 * realtime echo for that same insert arrives shortly after.
 */
export function useBoatFleet(): BoatFleetState {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // undefined until the effect below resolves the repository (impure -- may
  // construct a Supabase client -- so it's only ever called inside an
  // effect, never during render).
  const [repositoryMode, setRepositoryMode] = useState<BoatRepositoryMode | undefined>(undefined);
  const knownIds = useRef(new Set<string>());

  const addBoat = (boat: Boat) => {
    if (knownIds.current.has(boat.id)) return;
    knownIds.current.add(boat.id);
    setBoats((prev) => [boat, ...prev]);
  };

  const removeBoat = (id: string) => {
    if (!knownIds.current.has(id)) return;
    knownIds.current.delete(id);
    setBoats((prev) => prev.filter((boat) => boat.id !== id));
  };

  useEffect(() => {
    const repository = getBoatRepository();
    let cancelled = false;

    repository
      .list()
      .then((initial) => {
        if (cancelled) return;
        initial.forEach((boat) => knownIds.current.add(boat.id));
        setBoats(initial);
        setRepositoryMode(repository.mode);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setRepositoryMode(repository.mode);
        setLoadError(true);
        setLoading(false);
      });

    const unsubscribe = repository.subscribe({ onInsert: addBoat, onDelete: removeBoat });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { boats, loading, loadError, isLocalMode: repositoryMode === 'local', addBoat, removeBoat };
}

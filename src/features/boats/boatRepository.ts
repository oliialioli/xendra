import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readJSON, storageKey, writeJSON } from '../../lib/storage';
import { sanitizePlainText, validateBoatMessageInput, BOAT_MESSAGE_MAX_LENGTH } from './boatValidation';
import { validateDrawingSize, isDrawingEmpty } from './drawingUtils';
import type { Boat, NewBoatInput } from './boatTypes';

export type BoatRepositoryMode = 'supabase' | 'local';

export type BoatSubscriptionHandlers = {
  onInsert: (boat: Boat) => void;
  onDelete: (boatId: string) => void;
};

/**
 * Storage-agnostic boat persistence -- see docs/BOATS.md for the schema and
 * Supabase setup. The map/UI code only ever talks to this interface (via
 * getBoatRepository below), never to Supabase or localStorage directly, so
 * swapping the backend later needs no changes outside this file.
 */
export interface BoatRepository {
  readonly mode: BoatRepositoryMode;
  list(): Promise<Boat[]>;
  add(input: NewBoatInput): Promise<Boat>;
  /** Starts receiving inserts/deletes from other visitors; call the returned function to stop. */
  subscribe(handlers: BoatSubscriptionHandlers): () => void;
}

/** Re-checked here even though the UI already validates -- see boatRepository's own doc comment above. */
function assertPublishableBoat(input: NewBoatInput): void {
  const messageError = validateBoatMessageInput(input.message, input.displayName ?? '');
  if (messageError) throw new Error(messageError);
  if (isDrawingEmpty(input.drawing)) throw new Error('drawingEmpty');
  const sizeError = validateDrawingSize(input.drawing);
  if (sizeError) throw new Error(sizeError);
}

function isValidBoatShape(item: unknown): item is Boat {
  return (
    !!item &&
    typeof item === 'object' &&
    typeof (item as Boat).id === 'string' &&
    typeof (item as Boat).message === 'string' &&
    typeof (item as Boat).createdAtIso === 'string' &&
    !!(item as Boat).drawing
  );
}

// ---------------------------------------------------------------------------
// localStorage adapter -- development only. Boats never leave this browser,
// so two different visitors never see each other's boats here; two tabs of
// the *same* browser do (via the native `storage` event), which is a nice
// dev-time bonus, not a substitute for the real shared behavior Supabase
// mode provides.
// ---------------------------------------------------------------------------

const LOCAL_BOATS_KEY = storageKey('boats');
const MAX_LOCAL_BOATS = 200;

export class LocalStorageBoatRepository implements BoatRepository {
  readonly mode: BoatRepositoryMode = 'local';
  private listeners = new Set<BoatSubscriptionHandlers>();
  private storageListenerBound = false;
  private knownIds = new Set<string>();

  async list(): Promise<Boat[]> {
    const boats = this.readAll();
    this.knownIds = new Set(boats.map((b) => b.id));
    return boats;
  }

  async add(input: NewBoatInput): Promise<Boat> {
    assertPublishableBoat(input);
    const boat: Boat = {
      id: `boat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      displayName: sanitizePlainText(input.displayName ?? '') || null,
      message: sanitizePlainText(input.message).slice(0, BOAT_MESSAGE_MAX_LENGTH),
      drawing: input.drawing,
      createdAtIso: new Date().toISOString(),
    };
    const next = [boat, ...this.readAll()].slice(0, MAX_LOCAL_BOATS);
    writeJSON(LOCAL_BOATS_KEY, next);
    this.knownIds.add(boat.id);
    this.listeners.forEach((l) => l.onInsert(boat));
    return boat;
  }

  subscribe(handlers: BoatSubscriptionHandlers): () => void {
    this.listeners.add(handlers);
    this.ensureCrossTabListener();
    return () => {
      this.listeners.delete(handlers);
    };
  }

  private ensureCrossTabListener(): void {
    if (this.storageListenerBound || typeof window === 'undefined') return;
    this.storageListenerBound = true;
    window.addEventListener('storage', (event) => {
      if (event.key !== LOCAL_BOATS_KEY) return;
      const next = this.readAll();
      const nextIds = new Set(next.map((b) => b.id));
      next.forEach((boat) => {
        if (!this.knownIds.has(boat.id)) this.listeners.forEach((l) => l.onInsert(boat));
      });
      this.knownIds.forEach((id) => {
        if (!nextIds.has(id)) this.listeners.forEach((l) => l.onDelete(id));
      });
      this.knownIds = nextIds;
    });
  }

  private readAll(): Boat[] {
    const raw = readJSON<unknown>(LOCAL_BOATS_KEY, []);
    return Array.isArray(raw) ? raw.filter(isValidBoatShape) : [];
  }
}

// ---------------------------------------------------------------------------
// Supabase adapter -- see docs/BOATS.md for the table + RLS policies this expects.
// ---------------------------------------------------------------------------

type SupabaseBoatRow = {
  id: string;
  display_name: string | null;
  message: string;
  drawing: unknown;
  created_at: string;
};

function rowToBoat(row: SupabaseBoatRow): Boat {
  return {
    id: row.id,
    displayName: row.display_name,
    message: row.message,
    drawing: row.drawing as Boat['drawing'],
    createdAtIso: row.created_at,
  };
}

export class SupabaseBoatRepository implements BoatRepository {
  readonly mode: BoatRepositoryMode = 'supabase';
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async list(): Promise<Boat[]> {
    const { data, error } = await this.client
      .from('boats')
      .select('id, display_name, message, drawing, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return (data ?? []).map(rowToBoat);
  }

  async add(input: NewBoatInput): Promise<Boat> {
    assertPublishableBoat(input);
    const { data, error } = await this.client
      .from('boats')
      .insert({
        display_name: sanitizePlainText(input.displayName ?? '') || null,
        message: sanitizePlainText(input.message).slice(0, BOAT_MESSAGE_MAX_LENGTH),
        drawing: input.drawing,
      })
      .select('id, display_name, message, drawing, created_at')
      .single();
    if (error) throw error;
    return rowToBoat(data as SupabaseBoatRow);
  }

  subscribe(handlers: BoatSubscriptionHandlers): () => void {
    const channel = this.client
      .channel('boats-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'boats' },
        (payload) => handlers.onInsert(rowToBoat(payload.new as SupabaseBoatRow)),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'boats' },
        (payload) => {
          const old = payload.old as Partial<SupabaseBoatRow>;
          if (old.id) handlers.onDelete(old.id);
        },
      )
      .subscribe();

    return () => {
      void this.client.removeChannel(channel);
    };
  }
}

// ---------------------------------------------------------------------------
// Factory -- picks the adapter once, based on env vars. See src/vite-env.d.ts
// and .env.example for VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
// ---------------------------------------------------------------------------

let cachedRepository: BoatRepository | null = null;

export function getBoatRepository(): BoatRepository {
  if (cachedRepository) return cachedRepository;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  cachedRepository =
    url && anonKey ? new SupabaseBoatRepository(createClient(url, anonKey)) : new LocalStorageBoatRepository();
  return cachedRepository;
}

/** Test-only: forces the next getBoatRepository() call to construct a fresh instance. */
export function resetBoatRepositoryForTests(): void {
  cachedRepository = null;
}

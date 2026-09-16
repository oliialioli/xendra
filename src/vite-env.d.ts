/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Supabase project URL and public anon key, used by boatRepository's
   * Supabase adapter -- see docs/BOATS.md. Both optional: when either is
   * missing, boatRepository falls back to a localStorage-only adapter
   * (development mode, never shared between visitors).
   */
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

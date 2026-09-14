/** Moderate aria-live region for non-invasive proximity/status announcements. */
export function LiveRegion({ message }: { message: string }) {
  return (
    <div aria-live="polite" aria-atomic="true" className="visually-hidden">
      {message}
    </div>
  );
}

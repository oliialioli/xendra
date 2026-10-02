/**
 * A simple line drawing of a paper boat facing right -- shown beside the
 * drawing canvas as a reference for what to draw (and which way it faces,
 * since boats sail the river left to right in the drawing's own frame).
 */
export function PaperBoatSketch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 72 48" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
        {/* Hull */}
        <path d="M4 30 H68 L56 43 H16 Z" fill="var(--ui-surface)" />
        {/* Sail, with its centre fold */}
        <path d="M18 30 L36 6 L54 30" fill="var(--ui-surface)" />
        <path d="M36 6 V30" />
        {/* Side flaps */}
        <path d="M4 30 L18 24 L18 30" />
        <path d="M68 30 L54 24 L54 30" />
      </g>
      {/* A little water under it */}
      <path
        d="M10 46 q5 -3 10 0 t10 0 t10 0 t10 0 t10 0"
        fill="none"
        stroke="var(--ui-secondary)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

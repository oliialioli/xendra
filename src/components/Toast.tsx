import styles from './Toast.module.css';

/**
 * A brief, non-blocking confirmation banner -- top-center, auto-dismissed by
 * the caller (see MapLayout's own timer around boat submission). Never traps
 * focus or intercepts clicks outside its own small pill, so it can't get in
 * the way of anything else on screen.
 */
export function Toast({ message }: { message: string | null }) {
  return (
    <div className={styles.root} role="status" aria-live="polite">
      {message && <div className={styles.pill}>{message}</div>}
    </div>
  );
}

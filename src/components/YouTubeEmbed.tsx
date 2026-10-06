import { useEffect, useRef } from 'react';

const ORIGIN = 'https://www.youtube-nocookie.com';
/** YouTube's player states (see its IFrame API): 1 playing, 3 buffering. */
const PLAYING_STATES = new Set([1, 3]);

export type YouTubeEmbedProps = {
  videoId: string;
  title: string;
  className?: string;
};

/**
 * A YouTube video (privacy-enhanced domain: no cookies until it's played)
 * that tells the page when it plays. The player lives in a cross-origin
 * iframe, so its state arrives through YouTube's postMessage API; it's
 * re-announced as `play`/`pause` events on the iframe element itself, the
 * same events an <audio>/<video> fires -- so whatever already listens for
 * those (the map's ambience ducking under media, see useWorldAmbience)
 * treats it like any other video.
 */
export function YouTubeEmbed({ videoId, title, className }: YouTubeEmbedProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    let playing = false;

    const announce = (nowPlaying: boolean) => {
      if (nowPlaying === playing) return;
      playing = nowPlaying;
      frame.dispatchEvent(new Event(nowPlaying ? 'play' : 'pause'));
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== ORIGIN || event.source !== frame.contentWindow) return;
      let data: { event?: string; info?: unknown } | null;
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (!data) return;
      if (data.event === 'onStateChange' && typeof data.info === 'number') announce(PLAYING_STATES.has(data.info));
      if (data.event === 'infoDelivery' && data.info && typeof data.info === 'object') {
        const state = (data.info as { playerState?: unknown }).playerState;
        if (typeof state === 'number') announce(PLAYING_STATES.has(state));
      }
    };

    // Ask the player to start sending its state (YouTube's "listening" handshake).
    const listen = () => frame.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: videoId, channel: 'widget' }), ORIGIN);
    window.addEventListener('message', onMessage);
    frame.addEventListener('load', listen);
    return () => {
      window.removeEventListener('message', onMessage);
      frame.removeEventListener('load', listen);
    };
  }, [videoId]);

  const origin = typeof window === 'undefined' ? '' : `&origin=${encodeURIComponent(window.location.origin)}`;

  return (
    <iframe
      ref={frameRef}
      className={className}
      src={`${ORIGIN}/embed/${videoId}?enablejsapi=1${origin}`}
      title={title}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}

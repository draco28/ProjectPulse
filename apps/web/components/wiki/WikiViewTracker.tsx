'use client';

import { useEffect, useRef } from 'react';

interface WikiViewTrackerProps {
  slug: string;
}

export function WikiViewTracker({ slug }: WikiViewTrackerProps) {
  const hasSentRef = useRef(false);

  useEffect(() => {
    const startedAt = performance.now();

    const sendViewEvent = (durationMs: number) => {
      if (hasSentRef.current) {
        return;
      }
      hasSentRef.current = true;
      const payload = {
        type: 'VIEW',
        durationMs: Math.max(0, Math.round(durationMs)),
        metadata: { source: 'view-tracker' },
      };
      const url = `/api/wiki/${slug}/events`;
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch((error) => console.warn('Failed to record view event', error));
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        sendViewEvent(performance.now() - startedAt);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handleVisibility);
      sendViewEvent(performance.now() - startedAt);
    };
  }, [slug]);

  return null;
}

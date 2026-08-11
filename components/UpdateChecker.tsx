'use client';

import { useEffect, useState } from 'react';

const POLL_MS = 2 * 60 * 1000; // check every 2 minutes

export default function UpdateChecker() {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let current: string | null = null;
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const { version } = await res.json();
        if (cancelled || !version) return;

        if (current === null) {
          current = version;
          return;
        }
        if (version !== current) setStale(true);
      } catch {
        // offline or blocked — ignore, we'll try again later
      }
    }

    check();
    const timer = setInterval(check, POLL_MS);

    function onVisible() {
      if (document.visibilityState === 'visible') check();
    }
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  async function update() {
    // clear any cached assets the browser or service worker is holding
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.update()));
      }
    } catch {
      // best effort
    }
    window.location.reload();
  }

  if (!stale) return null;

  return (
    <div className="update-bar">
      <span className="update-dot" aria-hidden="true" />
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>New version available</span>
      <button onClick={update} className="btn btn-primary btn-sm">
        Update
      </button>
    </div>
  );
}

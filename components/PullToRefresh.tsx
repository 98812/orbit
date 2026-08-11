'use client';

import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 72;   // how far you must pull before it refreshes
const MAX_PULL = 110;   // how far the indicator can travel

export default function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const active = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function atTop() {
      return (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
    }

    function blocked(target: EventTarget | null) {
      const el = target as HTMLElement | null;
      if (!el || !el.closest) return false;
      return !!(
        el.closest('.chat-scroll') ||
        el.closest('.lightbox') ||
        el.closest('.camera-overlay') ||
        el.closest('.caption-overlay') ||
        el.closest('input') ||
        el.closest('textarea')
      );
    }

    function onStart(e: TouchEvent) {
      if (refreshing) return;
      if (e.touches.length !== 1) return;
      if (!atTop() || blocked(e.target)) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
      active.current = false;
    }

    function onMove(e: TouchEvent) {
      if (startY.current === null || refreshing) return;

      const dy = e.touches[0].clientY - startY.current;

      if (dy <= 0) {
        if (active.current) {
          active.current = false;
          setPull(0);
        }
        return;
      }

      if (!atTop()) {
        startY.current = null;
        setPull(0);
        return;
      }

      active.current = true;
      // resistance, so it feels like rubber rather than a slider
      const damped = Math.min(MAX_PULL, dy * 0.45);
      setPull(damped);

      if (damped > 4 && e.cancelable) e.preventDefault();
    }

    function onEnd() {
      if (startY.current === null) return;
      const reached = pullRef.current >= THRESHOLD;
      startY.current = null;
      active.current = false;

      if (reached && !refreshing) {
        setRefreshing(true);
        setPull(THRESHOLD);
        setTimeout(() => window.location.reload(), 260);
      } else {
        setPull(0);
      }
    }

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove as any);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [refreshing]);

  // keep a ref copy so the touchend handler sees the latest value
  const pullRef = useRef(0);
  useEffect(() => {
    pullRef.current = pull;
  }, [pull]);

  const ready = pull >= THRESHOLD;
  const progress = Math.min(1, pull / THRESHOLD);

  return (
    <div
      className={`ptr ${refreshing ? 'spinning' : ''}`}
      style={{
        transform: `translate(-50%, ${pull - 46}px)`,
        opacity: pull > 6 ? 1 : 0,
        transition: pull === 0 || refreshing ? 'transform 0.28s ease, opacity 0.28s ease' : 'none',
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" style={{ transform: `rotate(${progress * 300}deg)` }}>
        <circle
          cx="20"
          cy="20"
          r="15"
          fill="none"
          stroke="rgba(245,243,255,0.14)"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r="15"
          fill="none"
          stroke={ready ? 'var(--lime)' : 'var(--pink)'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${progress * 94} 94`}
          transform="rotate(-90 20 20)"
        />
      </svg>
    </div>
  );
}

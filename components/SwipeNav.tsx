'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const ORDER = ['/chat', '/snaps', '/messages', '/members', '/profile'];

export default function SwipeNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const [hint, setHint] = useState<'left' | 'right' | null>(null);

  const index = ORDER.indexOf(pathname || '');
  const enabled = index !== -1;

  useEffect(() => {
    if (!enabled) return;

    // preload neighbours so the swap feels instant
    if (index > 0) router.prefetch(ORDER[index - 1]);
    if (index < ORDER.length - 1) router.prefetch(ORDER[index + 1]);
  }, [index, enabled]);

  useEffect(() => {
    if (!enabled) return;

    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft' && index > 0) router.push(ORDER[index - 1]);
      if (e.key === 'ArrowRight' && index < ORDER.length - 1) router.push(ORDER[index + 1]);
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, enabled]);

  if (!enabled) return <>{children}</>;

  function onTouchStart(e: React.TouchEvent) {
    // ignore swipes that begin inside a scrollable image viewer or input
    const target = e.target as HTMLElement;
    if (target.closest('.lightbox') || target.closest('input') || target.closest('textarea') || target.closest('.chat-scroll')) {
      startX.current = null;
      return;
    }
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startX.current === null || startY.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) {
      setHint(null);
      return;
    }
    if (dx < 0 && index < ORDER.length - 1) setHint('left');
    else if (dx > 0 && index > 0) setHint('right');
    else setHint(null);
  }

  function onTouchEnd(e: React.TouchEvent) {
    setHint(null);
    if (startX.current === null || startY.current === null) return;

    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    startX.current = null;
    startY.current = null;

    // must be mostly horizontal and long enough
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.7) return;

    if (dx < 0 && index < ORDER.length - 1) router.push(ORDER[index + 1]);
    if (dx > 0 && index > 0) router.push(ORDER[index - 1]);
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ minHeight: 'calc(100vh - 62px)' }}
    >
      {hint && <div className={`swipe-hint ${hint}`}>{hint === 'left' ? '›' : '‹'}</div>}

      <div className="page-dots" aria-hidden="true">
        {ORDER.map((p, i) => (
          <span key={p} className={`dot ${i === index ? 'on' : ''}`} />
        ))}
      </div>

      {children}
    </div>
  );
}

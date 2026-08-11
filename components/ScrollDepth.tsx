'use client';

import { useEffect } from 'react';

// Elements that get the depth treatment, with how strongly each shrinks.
const TARGETS: { selector: string; scale: number; fade: number }[] = [
  { selector: '.snap-card', scale: 0.22, fade: 0.55 },
  { selector: '.status-card', scale: 0.18, fade: 0.5 },
  { selector: '.msg-row', scale: 0.12, fade: 0.45 },
];

export default function ScrollDepth() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame: number | null = null;
    let items: { el: HTMLElement; scale: number; fade: number }[] = [];

    function collect() {
      items = [];
      for (const t of TARGETS) {
        document.querySelectorAll<HTMLElement>(t.selector).forEach((el) => {
          items.push({ el, scale: t.scale, fade: t.fade });
        });
      }
    }

    function apply() {
      frame = null;
      const vh = window.innerHeight;
      const center = vh / 2;

      for (const { el, scale, fade } of items) {
        const rect = el.getBoundingClientRect();

        // skip anything well off screen
        if (rect.bottom < -200 || rect.top > vh + 200) continue;

        const elCenter = rect.top + rect.height / 2;
        // 0 when perfectly centred, 1 at the edge of the viewport
        const dist = Math.min(1, Math.abs(elCenter - center) / (vh * 0.62));
        const eased = dist * dist;

        el.style.setProperty('--depth-scale', String(1 - eased * scale));
        el.style.setProperty('--depth-opacity', String(1 - eased * fade));
      }
    }

    function schedule() {
      if (frame === null) frame = requestAnimationFrame(apply);
    }

    function refresh() {
      collect();
      schedule();
    }

    refresh();

    // capture phase catches scrolling inside nested containers too (e.g. chat)
    document.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', refresh);

    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true });

    // images/videos loading changes heights
    window.addEventListener('load', refresh);
    const settle = setTimeout(refresh, 600);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      document.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', refresh);
      window.removeEventListener('load', refresh);
      observer.disconnect();
      clearTimeout(settle);
    };
  }, []);

  return null;
}

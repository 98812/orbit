'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import GoogleSignInButton from '@/components/GoogleSignInButton';

const ROTATING = ['orbit', 'the loop', 'the group chat', 'touch'];

function useMouseParallax() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let raf: number;
    function onMove(e: MouseEvent) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        setPos({ x, y });
      });
    }
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return pos;
}

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);

    const COLORS = ['#FF2E93', '#C6FF3D', '#7B2FF7'];
    const count = Math.min(38, Math.floor(w / 32));
    const dots = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2.2 + 0.8,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
      a: Math.random() * 0.35 + 0.15,
    }));

    let raf: number;
    function draw() {
      ctx.clearRect(0, 0, w, h);

      // connecting lines
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(245,243,255,${(1 - dist / 120) * 0.07})`;
            ctx.lineWidth = 1;
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }

      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;

        ctx.beginPath();
        ctx.globalAlpha = d.a;
        ctx.fillStyle = d.c;
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    }
    draw();

    function onResize() {
      w = canvas!.width = canvas!.offsetWidth;
      h = canvas!.height = canvas!.offsetHeight;
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particles" aria-hidden="true" />;
}

function RotatingWord() {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setI((n) => (n + 1) % ROTATING.length);
        setVisible(true);
      }, 380);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <span className={`rotating ${visible ? 'in' : 'out'}`} style={{ color: 'var(--pink)' }}>
      {ROTATING[i]}
    </span>
  );
}

function SplitText({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <span aria-label={text}>
      {text.split('').map((ch, i) => (
        <span
          key={i}
          className="letter"
          aria-hidden="true"
          style={{ animationDelay: `${delay + i * 0.035}s` }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  );
}

export default function HomePage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [name, setName] = useState<string>('');
  const mouse = useMouseParallax();

  useEffect(() => {
    const supabase = createClient();
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      setSignedIn(!!user);
      if (user) {
        const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        setName(data?.full_name?.split(' ')[0] || '');
      }
    }
    check();
  }, []);

  return (
    <main className="hero">
      <Particles />

      <div
        aria-hidden="true"
        className="blob blob-pink"
        style={{ transform: `translate(${mouse.x * 26}px, ${mouse.y * 26}px)` }}
      />
      <div
        aria-hidden="true"
        className="blob blob-grape"
        style={{ transform: `translate(${mouse.x * -34}px, ${mouse.y * -34}px)` }}
      />
      <div
        aria-hidden="true"
        className="blob blob-lime"
        style={{ transform: `translate(${mouse.x * 18}px, ${mouse.y * -22}px)` }}
      />

      <div className="hero-inner">
        <p className="eyebrow rise" style={{ animationDelay: '0.05s' }}>
          for your actual friends, not your whole timeline
        </p>

        <h1 className="hero-title">
          {signedIn && name ? (
            <>
              <SplitText text="Welcome back," delay={0.15} />
              <br />
              <span style={{ color: 'var(--pink)' }}>
                <SplitText text={name + '.'} delay={0.55} />
              </span>
            </>
          ) : (
            <>
              <SplitText text="Never fall out of" delay={0.15} />
              <br />
              <RotatingWord />
              <span style={{ color: 'var(--pink)' }}>.</span>
            </>
          )}
        </h1>

        <p className="muted rise hero-sub" style={{ animationDelay: '0.7s' }}>
          Profiles, group chat, and Snaps with reactions — one private space, just for the group.
        </p>

        <div className="rise hero-cta" style={{ animationDelay: '0.85s' }}>
          {signedIn === null ? null : signedIn ? (
            <>
              <Link href="/chat" className="btn btn-primary glow">
                Open chat ↗
              </Link>
              <Link href="/snaps" className="btn btn-ghost">
                See Snaps
              </Link>
            </>
          ) : (
            <GoogleSignInButton />
          )}
        </div>

        {signedIn && (
          <div className="scroll-cue rise" style={{ animationDelay: '1.1s' }} aria-hidden="true">
            <span>swipe to explore</span>
            <span className="cue-arrow">›</span>
          </div>
        )}
      </div>
    </main>
  );
}

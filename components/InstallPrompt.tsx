'use client';

import { useEffect, useState } from 'react';

const DISMISS_KEY = 'genz-install-dismissed';

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // already installed?
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (standalone) return;

    // dismissed before?
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {}

    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);

    if (ios && safari) {
      setIsIos(true);
      const t = setTimeout(() => setShow(true), 2500);
      return () => clearTimeout(t);
    }

    function onPrompt(e: any) {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    }

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  function dismiss() {
    setShow(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {}
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setDeferred(null);
      dismiss();
    }
  }

  if (!show) return null;

  return (
    <div className="install-bar">
      <div className="install-icon">📱</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Add Gen-Z to your home screen</div>
        {isIos ? (
          <div className="muted" style={{ fontSize: 12.5, marginTop: 3, lineHeight: 1.45 }}>
            Tap <strong>Share</strong> at the bottom, then <strong>Add to Home Screen</strong>.
          </div>
        ) : (
          <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
            Opens fullscreen, like a real app.
          </div>
        )}
      </div>

      {!isIos && (
        <button onClick={install} className="btn btn-primary btn-sm">
          Install
        </button>
      )}
      <button onClick={dismiss} className="install-close" aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

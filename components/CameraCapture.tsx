'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [flash, setFlash] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setReady(false);
      setError(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Your browser does not support in-app camera.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1920 },
            height: { ideal: 1920 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch (err: any) {
        console.error('Camera error:', err);
        if (err?.name === 'NotAllowedError') {
          setError('Camera permission was denied. Allow it in your browser settings.');
        } else if (err?.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Could not start the camera.');
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [facing]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function shoot() {
    const video = videoRef.current;
    if (!video || !ready) return;

    setFlash(true);
    setTimeout(() => setFlash(false), 160);

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facing === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `snap-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
      },
      'image/jpeg',
      0.9
    );
  }

  if (!mounted) return null;

  return createPortal(
    <div className="camera-overlay">
      <button className="camera-close" onClick={onClose} aria-label="Close camera">
        ✕
      </button>

      <button
        className="camera-flip"
        onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
        aria-label="Switch camera"
      >
        ⟳
      </button>

      <div className="camera-stage">
        {error ? (
          <div className="camera-error">
            <div style={{ fontSize: 38, marginBottom: 12 }}>📷</div>
            <p>{error}</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="camera-video"
              style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }}
            />
            {!ready && <div className="camera-loading">Starting camera…</div>}
            {flash && <div className="camera-flash" />}
          </>
        )}
      </div>

      {!error && (
        <div className="camera-controls">
          <button
            className="shutter"
            onClick={shoot}
            disabled={!ready}
            aria-label="Take photo"
          >
            <span className="shutter-inner" />
          </button>
          <p className="camera-hint mono">tap to post instantly</p>
        </div>
      )}
    </div>,
    document.body
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MAX_SECONDS = 15;

export default function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (file: File, kind: 'image' | 'video') => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const holdTimer = useRef<any>(null);
  const stopTimer = useRef<any>(null);
  const tickTimer = useRef<any>(null);
  const didRecord = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [flash, setFlash] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [canRecord, setCanRecord] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && typeof MediaRecorder === 'undefined') {
      setCanRecord(false);
    }
  }, []);

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
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: {
            // phone-call processing muffles music and ambience — turn it off
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 2,
            sampleRate: 48000,
          },
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
      clearTimeout(holdTimer.current);
      clearTimeout(stopTimer.current);
      clearInterval(tickTimer.current);
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

  function takePhoto() {
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
        onCapture(new File([blob], `snap-${Date.now()}.jpg`, { type: 'image/jpeg' }), 'image');
      },
      'image/jpeg',
      0.9
    );
  }

  function pickMime() {
    const options = [
      'video/mp4;codecs=h264,aac',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    for (const m of options) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
    }
    return '';
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream || !ready || !canRecord) return;

    try {
      const mime = pickMime();
      const opts: MediaRecorderOptions = {
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000,
      };
      if (mime) opts.mimeType = mime;

      let rec: MediaRecorder;
      try {
        rec = new MediaRecorder(stream, opts);
      } catch {
        // some browsers reject the bitrate hints — fall back to defaults
        rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      }
      chunksRef.current = [];

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      rec.onstop = () => {
        clearInterval(tickTimer.current);
        const type = rec.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        setRecording(false);
        setElapsed(0);

        if (blob.size < 1000) return;

        const ext = type.includes('mp4') ? 'mp4' : 'webm';
        onCapture(new File([blob], `clip-${Date.now()}.${ext}`, { type }), 'video');
      };

      recorderRef.current = rec;
      rec.start(250);
      didRecord.current = true;
      setRecording(true);
      setElapsed(0);

      tickTimer.current = setInterval(() => {
        setElapsed((e) => e + 0.1);
      }, 100);

      stopTimer.current = setTimeout(() => stopRecording(), MAX_SECONDS * 1000);
    } catch (err) {
      console.error('Recording failed:', err);
      setRecording(false);
      setCanRecord(false);
    }
  }

  function stopRecording() {
    clearTimeout(stopTimer.current);
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
    }
    recorderRef.current = null;
  }

  function onPressStart() {
    if (!ready) return;
    didRecord.current = false;
    holdTimer.current = setTimeout(() => {
      startRecording();
    }, 320);
  }

  function onPressEnd() {
    clearTimeout(holdTimer.current);
    if (didRecord.current) {
      stopRecording();
    } else {
      takePhoto();
    }
  }

  if (!mounted) return null;

  const pct = Math.min(100, (elapsed / MAX_SECONDS) * 100);

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

      {recording && (
        <div className="rec-pill">
          <span className="rec-dot" />
          {elapsed.toFixed(1)}s
        </div>
      )}

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
            className={`shutter ${recording ? 'recording' : ''}`}
            onPointerDown={onPressStart}
            onPointerUp={onPressEnd}
            onPointerLeave={() => {
              clearTimeout(holdTimer.current);
              if (didRecord.current) stopRecording();
            }}
            onContextMenu={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            disabled={!ready}
            aria-label="Tap for photo, hold to record"
          >
            {recording && (
              <svg className="rec-ring" viewBox="0 0 100 100" aria-hidden="true">
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="var(--pink)"
                  strokeWidth="6"
                  strokeDasharray={`${pct * 2.89} 289`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
            )}
            <span className="shutter-inner" />
          </button>
          <p className="camera-hint mono">
            {recording
              ? 'release to post'
              : canRecord
              ? 'tap for photo · hold to record'
              : 'tap to post instantly'}
          </p>
        </div>
      )}
    </div>,
    document.body
  );
}

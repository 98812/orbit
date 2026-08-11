'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function CaptionPrompt({
  file,
  kind,
  onPost,
  onCancel,
}: {
  file: File;
  kind: 'image' | 'video';
  onPost: (caption: string) => void;
  onCancel: () => void;
}) {
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => {
      document.body.style.overflow = '';
      clearTimeout(t);
    };
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onPost(caption.trim());
  }

  if (!mounted) return null;

  return createPortal(
    <div className="caption-overlay">
      <button className="camera-close" onClick={onCancel} aria-label="Discard">
        ✕
      </button>

      <div className="caption-preview">
        {preview &&
          (kind === 'video' ? (
            <video src={preview} controls playsInline autoPlay loop muted />
          ) : (
            <img src={preview} alt="Your snap" />
          ))}
      </div>

      <form className="caption-bar" onSubmit={submit}>
        <input
          ref={inputRef}
          className="input caption-input"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What's going on?"
          maxLength={140}
          autoComplete="off"
        />
        <div className="caption-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onPost('')}>
            Skip
          </button>
          <button type="submit" className="btn btn-primary btn-sm">
            Post ↗
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

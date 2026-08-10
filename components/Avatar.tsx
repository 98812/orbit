'use client';

import { useState } from 'react';

const COLORS = [
  'linear-gradient(135deg, #FF2E93, #7B2FF7)',
  'linear-gradient(135deg, #7B2FF7, #3D2E8C)',
  'linear-gradient(135deg, #FF7A29, #FF2E93)',
  'linear-gradient(135deg, #C6FF3D, #4FA82E)',
  'linear-gradient(135deg, #2ED9FF, #7B2FF7)',
  'linear-gradient(135deg, #FF2E93, #FF7A29)',
];

function initials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorFor(name?: string) {
  if (!name) return COLORS[0];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return COLORS[sum % COLORS.length];
}

export default function Avatar({
  src,
  name,
  size = 36,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        background: showImage ? 'var(--ink-3)' : colorFor(name || undefined),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: size * 0.38,
        color: '#fff',
        fontFamily: "'Bricolage Grotesque', sans-serif",
        letterSpacing: '-0.02em',
        border: '1.5px solid rgba(245,243,255,0.12)',
      }}
      aria-hidden="true"
    >
      {showImage ? (
        <img
          src={src!}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        initials(name || undefined)
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';

function initials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileHero({ profile }: { profile: any }) {
  const [failed, setFailed] = useState(false);
  const hasPhoto = profile?.avatar_url && !failed;

  const details = [
    profile?.talent,
    profile?.bio,
    profile?.goal,
    profile?.qualification,
  ].filter(Boolean);

  return (
    <div className="phero">
      {hasPhoto ? (
        <img
          src={profile.avatar_url}
          alt=""
          className="phero-img"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="phero-fallback">{initials(profile?.full_name)}</div>
      )}

      <div className="phero-scrim" />

      <div className="phero-text">
        <h1 className="phero-name">{profile?.full_name || 'No name'}</h1>
        {details.map((d, i) => (
          <p key={i} className="phero-detail">
            {d}
          </p>
        ))}
      </div>
    </div>
  );
}

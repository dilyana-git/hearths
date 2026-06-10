import React from 'react';

// Renders artwork when imageUrl is set; until then, a quiet parchment
// placeholder carrying the image prompt. Renders nothing if neither exists.
export default function ImageSlot({ imageUrl, title, prompt, height }) {
  if (!imageUrl && !prompt) return null;

  return (
    <div
      className="w-full rounded overflow-hidden"
      style={{ position: 'relative', paddingBottom: height ? undefined : '56.25%', height }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title || ''}
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 35%, #2a2014 0%, #181106 55%, #0c0905 100%)',
            border: '1px solid #2a2018',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '14px 20px',
          }}
        >
          {title && (
            <span
              className="serif text-center text-parchment-400 uppercase"
              style={{ fontSize: 13, letterSpacing: '0.14em' }}
            >
              {title}
            </span>
          )}
          <span className="text-parchment-700" style={{ fontSize: 10, letterSpacing: '0.3em' }}>· · ·</span>
          {prompt && (
            <span
              className="text-center italic text-parchment-700 leading-snug"
              style={{ fontSize: 9, maxWidth: '85%', opacity: 0.65 }}
            >
              {prompt.length > 140 ? prompt.slice(0, 140) + '…' : prompt}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

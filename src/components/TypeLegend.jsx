import React from 'react';
import { TYPE_META, NODE_TIERS } from '../utils/constants';

// Renders the correct tier glyph — ring / filled / double — in any color.
function NodeGlyph({ tier, color }) {
  if (tier === 'ring') {
    return (
      <svg width="16" height="16" viewBox="-8 -8 16 16" aria-hidden="true" className="flex-shrink-0">
        <circle r="6" fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    );
  }
  if (tier === 'double') {
    return (
      <svg width="20" height="20" viewBox="-10 -10 20 20" aria-hidden="true" className="flex-shrink-0">
        <circle r="9"  fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.45" />
        <circle r="5"  fill={color} fillOpacity="0.35" stroke={color} strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="-8 -8 16 16" aria-hidden="true" className="flex-shrink-0">
      <circle r="6" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

const TIER_ORDER = ['ring', 'filled', 'double'];

export default function TypeLegend({ onClose }) {
  const byTier = { ring: [], filled: [], double: [] };
  Object.entries(TYPE_META).forEach(([type, meta]) => {
    byTier[meta.tier].push({ type, meta });
  });

  return (
    <div className="panel rounded-lg w-72 overflow-y-auto"
      style={{ boxShadow: '0 0 40px rgba(0,0,0,0.8)', maxHeight: 'calc(100vh - 6rem)' }}>

      <div className="panel-header flex items-center justify-between py-2.5 sticky top-0 bg-coal-800 z-10">
        <span className="text-xs font-medium text-parchment-300 tracking-wide uppercase">Legend</span>
        <button onClick={onClose}
          className="text-parchment-500 hover:text-parchment-300 text-sm leading-none"
          aria-label="Close legend">×</button>
      </div>

      <div className="px-3 py-2.5 space-y-3.5">

        {/* ── 1. Shape = complexity tier ─────────────────────────────── */}
        <section>
          <p className="text-[10px] uppercase tracking-widest text-parchment-500 mb-2 font-medium">
            Shape — complexity tier
          </p>
          <div className="space-y-2">
            {TIER_ORDER.map(tier => (
              <div key={tier} className="flex items-start gap-2.5">
                <div className="mt-0.5"><NodeGlyph tier={tier} color="#8a7d65" /></div>
                <div>
                  <span className="text-xs text-parchment-300 font-medium leading-none">
                    {NODE_TIERS[tier].label}
                  </span>
                  <p className="text-[10px] text-parchment-500 mt-0.5 leading-snug">
                    {NODE_TIERS[tier].description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-coal-600" />

        {/* ── 2. Color = milestone type, grouped by tier ─────────────── */}
        <section>
          <p className="text-[10px] uppercase tracking-widest text-parchment-500 mb-2 font-medium">
            Color — milestone type
          </p>
          <div className="space-y-3">
            {TIER_ORDER.map(tier => (
              <div key={tier}>
                <p className="text-[9px] uppercase tracking-widest text-parchment-500 mb-1.5">
                  {NODE_TIERS[tier].label}
                </p>
                <div className="space-y-1">
                  {byTier[tier].map(({ type, meta }) => (
                    <div key={type} className="flex items-center gap-2.5">
                      <NodeGlyph tier={tier} color={meta.color} />
                      <span className="text-xs text-parchment-400">{meta.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-coal-600" />

        {/* ── 3. Contested date marker ───────────────────────────────── */}
        <section className="flex items-center gap-2.5">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="flex-shrink-0">
            <circle cx="6" cy="6" r="3" fill="#b8960c" />
          </svg>
          <span className="text-xs text-parchment-400">Contested or approximate date</span>
        </section>

        <hr className="border-coal-600" />

        {/* ── 4. Usage hint ──────────────────────────────────────────── */}
        <p className="text-[10px] text-parchment-500 leading-snug pb-0.5">
          Hover any node or thread to illuminate its lineage.
          Time scale is compressed before 9,500 BCE.
        </p>

      </div>
    </div>
  );
}

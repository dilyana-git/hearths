import React, { useState } from 'react';
import { TECH_FAMILIES, STAGE_META } from '../utils/constants';

const SLIDES = [
  {
    title: 'Fifteen thousand years of human contact',
    body: 'Hearths maps cultural development from the last ice age to 1500 CE. Nine civilisations — Fertile Crescent, Nile Valley, Indus Valley, China, Mesoamerica, Andes, Sub-Saharan Africa, Aboriginal Australia, and Papua New Guinea — each taking a different path shaped by where they started.',
    visual: 'globe',
  },
  {
    title: 'Reading the map',
    body: 'Glowing regions show development stage — the brighter the glow, the more complex the society. Lines connect cultures, coloured and styled by the technology that made contact possible: foot paths, farming waves, bronze trade networks, monsoon sailing routes. Click any region, line, or dot for detail.',
    visual: 'legend',
  },
  {
    title: 'Navigate through time',
    body: 'Drag the scrubber at the bottom of the map, or press Play to watch civilisations develop. The right panel updates as you move — showing the era narrative, which connections are active, and the detail of whatever you have clicked.',
    visual: 'scrubber',
  },
];

function GlobeVisual() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <circle cx="36" cy="36" r="28" stroke="#2a3550" strokeWidth="1.2" fill="none" />
      <ellipse cx="36" cy="36" rx="14" ry="28" stroke="#2a3550" strokeWidth="0.8" fill="none" />
      <line x1="8" y1="36" x2="64" y2="36" stroke="#2a3550" strokeWidth="0.8" />
      <line x1="10" y1="22" x2="62" y2="22" stroke="#1e2840" strokeWidth="0.6" />
      <line x1="10" y1="50" x2="62" y2="50" stroke="#1e2840" strokeWidth="0.6" />
      {[
        { cx: 32, cy: 30, color: '#c4a840' },
        { cx: 42, cy: 38, color: '#7a9e5c' },
        { cx: 28, cy: 44, color: '#6b8e9f' },
        { cx: 46, cy: 26, color: '#8a7aad' },
      ].map((dot, i) => (
        <g key={i}>
          <circle cx={dot.cx} cy={dot.cy} r="6" fill={dot.color} fillOpacity="0.08" />
          <circle cx={dot.cx} cy={dot.cy} r="2.5" fill={dot.color} fillOpacity="0.7" />
        </g>
      ))}
      <line x1="32" y1="30" x2="42" y2="38" stroke="#c4a840" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="42" y1="38" x2="28" y2="44" stroke="#5a7fb5" strokeWidth="1" strokeOpacity="0.5"
        strokeDasharray="3,3" />
    </svg>
  );
}

function LegendVisual() {
  const stageSample = [
    STAGE_META['incipient-cultivation'],
    STAGE_META['towns-chiefdoms'],
    STAGE_META['cities-states'],
  ];
  const connSample = [
    TECH_FAMILIES['foot-river'],
    TECH_FAMILIES['bronze-trade'],
    TECH_FAMILIES['sail-monsoon'],
  ];
  return (
    <div className="flex gap-6 items-start">
      <div>
        <p className="text-[8px] uppercase tracking-widest text-parchment-700 mb-1.5">Stage glow</p>
        {stageSample.map(s => (
          <div key={s.label} className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color, opacity: 0.85 }} />
            <span className="text-[9px] text-parchment-500">{s.label}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[8px] uppercase tracking-widest text-parchment-700 mb-1.5">Connection type</p>
        {connSample.map(c => (
          <div key={c.label} className="flex items-center gap-2 mb-1">
            <svg width="20" height="8" aria-hidden="true" className="flex-shrink-0">
              <line x1="0" y1="4" x2="20" y2="4"
                stroke={c.color} strokeWidth="1.5"
                strokeDasharray={c.dash !== 'none' ? c.dash : undefined}
                strokeOpacity="0.9" />
            </svg>
            <span className="text-[9px] text-parchment-500">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScrubberVisual() {
  return (
    <div className="w-full max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full border border-coal-500 flex items-center justify-center">
          <svg width="8" height="10" viewBox="0 0 8 10" fill="#8a7d65" aria-hidden="true">
            <polygon points="0,0 8,5 0,10"/>
          </svg>
        </div>
        <div className="flex-1 h-1.5 rounded bg-coal-700 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-2/5 rounded" style={{ background: 'rgba(0,168,150,0.3)' }} />
        </div>
        <span className="text-[9px] text-parchment-600 tabular-nums">1500 CE</span>
      </div>
      <p className="text-[9px] text-parchment-600 italic">Drag left/right · click to jump · play at three speeds</p>
    </div>
  );
}

const VISUALS = { globe: GlobeVisual, legend: LegendVisual, scrubber: ScrubberVisual };

export default function OnboardingModal({ onClose }) {
  const [slide, setSlide] = useState(0);
  const current = SLIDES[slide];
  const Visual = VISUALS[current.visual];
  const isLast = slide === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(4,6,10,0.88)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded border border-coal-600 flex flex-col overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #12192a 0%, #080c12 70%)', maxHeight: '90vh' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-parchment-600 hover:text-parchment-400 transition-colors text-lg leading-none"
          aria-label="Skip introduction"
        >
          ×
        </button>

        {/* Slide counter */}
        <div className="flex gap-1.5 justify-center pt-5 pb-0">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-0.5 rounded-full transition-all duration-300"
              style={{
                width: i === slide ? 20 : 8,
                background: i === slide ? '#b8960c' : '#2a3550',
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 px-8 pt-6 pb-4 flex flex-col gap-5">
          {/* Visual */}
          <div className="flex justify-center py-2">
            <Visual />
          </div>

          {/* Text */}
          <div>
            <h2
              className="serif text-xl font-medium text-parchment-200 mb-3 leading-snug"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
            >
              {current.title}
            </h2>
            <p className="text-sm text-parchment-400 leading-relaxed">
              {current.body}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-8 pb-6 pt-2">
          <button
            onClick={() => setSlide(s => s - 1)}
            disabled={slide === 0}
            className="text-xs text-parchment-600 hover:text-parchment-400 disabled:opacity-0 transition-colors"
          >
            ← Previous
          </button>

          <span className="text-[9px] text-parchment-700 tabular-nums">
            {slide + 1} / {SLIDES.length}
          </span>

          {isLast ? (
            <button
              onClick={onClose}
              className="text-xs px-4 py-1.5 rounded border border-teal-800 text-teal-400 hover:bg-teal-900/20 transition-colors"
            >
              Explore the Atlas
            </button>
          ) : (
            <button
              onClick={() => setSlide(s => s + 1)}
              className="text-xs text-parchment-400 hover:text-parchment-200 transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

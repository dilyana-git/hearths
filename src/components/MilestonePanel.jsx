import React from 'react';
import { TYPE_META, AXIS_LABELS, AXIS_COLORS, formatYear } from '../utils/constants';

function ChainLink({ label, strength }) {
  const strengthColors = {
    strong: '#00a896', moderate: '#b8960c', weak: '#c0392b',
    absent: '#2a3550', 'context-specific': '#8a7aad',
  };
  const color = strengthColors[strength] || '#2a3550';
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs" style={{ color }}>{label}</span>
    </div>
  );
}

export default function MilestonePanel({ milestone, civilization, onClose, onSelectCiv }) {
  if (!milestone) return null;
  const meta = TYPE_META[milestone.type] || { color: '#888', label: milestone.type };

  const chainKeys = ['biogeography', 'domesticable-species', 'food-production', 'surplus',
    'specialization', 'writing', 'technology', 'political-complexity', 'epidemic-disease'];

  const chainLabels = {
    'biogeography': 'Biogeography',
    'domesticable-species': 'Domesticable Species',
    'food-production': 'Food Production',
    'surplus': 'Surplus',
    'specialization': 'Specialization',
    'writing': 'Writing',
    'technology': 'Technology',
    'political-complexity': 'Political Complexity',
    'epidemic-disease': 'Epidemic Disease',
  };

  return (
    <div className="flex flex-col h-full bg-coal-800 border-l border-coal-600 overflow-y-auto">
      {/* Panel header */}
      <div className="flex-shrink-0 flex items-start justify-between px-5 py-4 border-b border-coal-600 sticky top-0 bg-coal-800 z-10">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <circle cx="6" cy="6" r="5" fill={meta.color} fillOpacity="0.3" stroke={meta.color} strokeWidth="1.5" />
            </svg>
            <span className="text-xs font-medium tracking-wide uppercase" style={{ color: meta.color }}>
              {meta.label}
            </span>
          </div>
          <h2 className="serif text-xl text-parchment-100 font-semibold leading-snug">
            {milestone.title}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-parchment-500 hover:text-parchment-200 text-xl leading-none mt-0.5"
          aria-label="Close detail panel"
        >
          ×
        </button>
      </div>

      <div className="flex-1 px-5 py-4 space-y-5">
        {/* Who & When */}
        <section className="flex flex-wrap gap-3">
          {civilization && (
            <div className="flex items-center gap-1.5 bg-coal-700 rounded px-2.5 py-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: civilization.color }} />
              <span className="text-xs font-medium text-parchment-300">{civilization.name}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-coal-700 rounded px-2.5 py-1.5">
            <span className="text-xs text-parchment-400">
              <span className="text-parchment-200 font-medium">{formatYear(milestone.date)}</span>
              {milestone.contested && (
                <span className="ml-1.5 text-gold-500">⚠ contested</span>
              )}
            </span>
          </div>
          {civilization && (
            <div
              className="flex items-center gap-1.5 bg-coal-700 rounded px-2.5 py-1.5"
              style={{ borderLeft: `2px solid ${AXIS_COLORS[civilization.axisContext]}` }}
            >
              <span className="text-xs" style={{ color: AXIS_COLORS[civilization.axisContext] }}>
                {civilization.axisContext.replace(/-/g, '–')} axis
              </span>
            </div>
          )}
        </section>

        {/* Causal explanation */}
        <section>
          <h3 className="text-xs font-medium text-parchment-400 uppercase tracking-widest mb-2">
            Causal explanation
          </h3>
          <p className="text-sm text-parchment-300 leading-relaxed">
            {milestone.causalExplanation}
          </p>
        </section>

        {/* Caveat — if present */}
        {milestone.caveat && (
          <section className="bg-coal-700 rounded p-3 border-l-2 border-gold-600">
            <h3 className="text-xs font-medium text-gold-500 uppercase tracking-widest mb-1.5">
              Scholarly caveat
            </h3>
            <p className="text-xs text-parchment-400 leading-relaxed">
              {milestone.caveat}
            </p>
          </section>
        )}

        {/* Civilization context */}
        {civilization && (
          <section>
            <h3 className="text-xs font-medium text-parchment-400 uppercase tracking-widest mb-2">
              About {civilization.name}
            </h3>
            <p className="text-xs text-parchment-400 leading-relaxed">
              {civilization.summary}
            </p>
          </section>
        )}

        {/* Mini causal chain status */}
        {civilization && civilization.chainStrength && (
          <section>
            <h3 className="text-xs font-medium text-parchment-400 uppercase tracking-widest mb-2.5">
              Causal chain — {civilization.name}
            </h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              {chainKeys.map(key => (
                <ChainLink
                  key={key}
                  label={chainLabels[key]}
                  strength={civilization.chainStrength[key]}
                />
              ))}
            </div>
            <button
              className="mt-3 text-xs text-teal-500 hover:text-teal-400 underline underline-offset-2"
              onClick={() => onSelectCiv && onSelectCiv(civilization.id)}
            >
              Explore full chain for {civilization.name} →
            </button>
          </section>
        )}

        {/* Intellectual honesty footer */}
        <section className="pt-2 border-t border-coal-700">
          <p className="text-xs text-parchment-500 leading-relaxed">
            Dates and interpretations shown here follow Diamond's geographic-determinist framework as a heuristic model. They are not the only valid scholarly reading. Contested dates are marked ⚠.
          </p>
        </section>
      </div>
    </div>
  );
}

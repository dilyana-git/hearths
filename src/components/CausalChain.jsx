import React from 'react';
import ImageSlot from './ImageSlot';
import { CHAIN_STRENGTH_COLORS, CHAIN_STRENGTH_LABELS } from '../utils/constants';

// ── Diamond's causal chain, read top to bottom ──────────────────────────────
// Geographic endowment → agricultural transition → social complexity →
// branching into four civilizational outcomes. Each step is a card whose
// color and description reflect how strongly it applied to the selected
// civilization; a connector between cards carries that color downstream.

const SPINE = [
  'biogeography',
  'domesticable-species',
  'food-production',
  'surplus',
  'specialization',
];

const LEAVES = [
  'writing',
  'technology',
  'political-complexity',
  'epidemic-disease',
];

const GROUPS = [
  { label: 'Geographic endowment', ids: ['biogeography', 'domesticable-species'] },
  { label: 'Agricultural transition', ids: ['food-production', 'surplus'] },
  { label: 'Social complexity', ids: ['specialization'] },
];

const CHAIN_STRENGTH_DESCRIPTIONS = {
  'strong':           'Clear, well-evidenced causal contribution for this civilization.',
  'moderate':         'Present and meaningful — but not the primary driver.',
  'weak':             'Limited, indirect, or contested contribution.',
  'context-specific': 'Significant only under specific historical circumstances.',
  'absent':           'No evidence of this factor; the causal chain breaks here.',
};

// Slightly lightened "absent" tone — the raw chain color (#2a3550) reads as
// near-invisible against the dark background, so cards/badges use this
// instead while the legend keeps the true color.
const DISPLAY_COLORS = { ...CHAIN_STRENGTH_COLORS, absent: '#6b7488' };

function ChainCard({ link, strength, compact }) {
  const color = DISPLAY_COLORS[strength] || DISPLAY_COLORS.absent;
  const label = CHAIN_STRENGTH_LABELS[strength] || CHAIN_STRENGTH_LABELS.absent;
  const absent = strength === 'absent';

  return (
    <div
      className="w-full rounded-lg transition-colors duration-300"
      style={{
        border: `1px solid ${color}${absent ? '30' : '4d'}`,
        borderStyle: absent ? 'dashed' : 'solid',
        background: absent ? 'rgba(255,255,255,0.02)' : `${color}14`,
        padding: compact ? '12px 16px' : '18px 22px',
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <h3 className={`serif font-medium leading-snug ${compact ? 'text-base' : 'text-lg'}`} style={{ color: absent ? color : '#f0e9d2' }}>
          {link.label}
        </h3>
        <span
          className="text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ color, border: `1px solid ${color}55` }}
        >
          {label}
        </span>
      </div>
      <p className={`leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: absent ? '#5c5245' : '#b8a882' }}>
        {link.description}
      </p>
      {absent && (
        <p className="text-[11px] italic mt-2" style={{ color: '#5c5245' }}>
          No evidence of this for this civilization — the chain breaks here.
        </p>
      )}
    </div>
  );
}

function Connector({ color }) {
  return (
    <div className="flex justify-center py-1.5" aria-hidden="true">
      <div className="flex flex-col items-center">
        <div style={{ width: 2, height: 20, background: color }} />
        <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `5px solid ${color}` }} />
      </div>
    </div>
  );
}

function Stem({ color }) {
  return <div className="mx-auto" style={{ width: 2, height: 14, background: color }} aria-hidden="true" />;
}

function GroupLabel({ children }) {
  return (
    <div className="flex items-center gap-3 mt-1 mb-3">
      <div className="flex-1 h-px bg-coal-700" />
      <span className="text-[10px] uppercase tracking-[0.25em] flex-shrink-0" style={{ color: '#5c5245' }}>{children}</span>
      <div className="flex-1 h-px bg-coal-700" />
    </div>
  );
}

export default function CausalChain({ data, selectedCivId, onSelectCiv }) {
  const civ = data.civById[selectedCivId];
  const strength = civ?.chainStrength || {};

  const linkById = {};
  data.causalChain.links.forEach(l => { linkById[l.id] = l; });

  function linkStrength(id, fallback) {
    return strength[id] || fallback || 'absent';
  }

  // The connector between two steps carries the weaker of the two colors —
  // if either side is absent, the line itself goes dim and dashed-grey.
  function edgeColor(fromId, toId) {
    const s1 = linkStrength(fromId);
    const s2 = linkStrength(toId);
    if (s1 === 'absent' || s2 === 'absent') return DISPLAY_COLORS.absent;
    if (s1 === 'weak' || s2 === 'weak') return DISPLAY_COLORS.weak;
    if (s1 === 'strong' && s2 === 'strong') return DISPLAY_COLORS.strong;
    return DISPLAY_COLORS.moderate;
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left rail — framing + civ picker + strength key */}
      <div className="flex-shrink-0 w-52 border-r border-coal-700 overflow-y-auto py-5 px-3.5">
        <h2 className="serif text-lg text-parchment-200 font-medium mb-1.5 px-1">Diamond's Causal Chain</h2>
        <p className="text-[11px] leading-snug mb-4 px-1" style={{ color: '#8a7d65' }}>
          After <em>Guns, Germs, and Steel</em> (1997) — one influential framework, critiqued for environmental determinism and underweighting agency. Ratings are heuristic, not measurements.
        </p>

        <p className="text-[10px] uppercase tracking-widest px-1 mb-2" style={{ color: '#5c5245' }}>Civilization</p>
        <div className="flex flex-col gap-0.5 mb-5">
          {data.civilizations.map(c => (
            <button
              key={c.id}
              onClick={() => onSelectCiv(c.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded transition-colors duration-100 flex items-center gap-2 ${
                c.id === selectedCivId
                  ? 'bg-coal-700 text-parchment-200'
                  : 'text-parchment-400 hover:bg-coal-800 hover:text-parchment-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
              <span className="text-xs leading-tight">{c.name}</span>
            </button>
          ))}
        </div>

        <p className="text-[10px] uppercase tracking-widest px-1 mb-2" style={{ color: '#5c5245' }}>Strength key</p>
        <div className="flex flex-col gap-1.5 px-1">
          {Object.entries(DISPLAY_COLORS).map(([s, c]) => (
            <div key={s} className="flex items-center gap-2 cursor-default" title={CHAIN_STRENGTH_DESCRIPTIONS[s]}>
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c }} />
              <span className="text-[11px] text-parchment-400">{CHAIN_STRENGTH_LABELS[s]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reading column */}
      <div className="flex-1 overflow-y-auto bg-coal-900">
        {civ ? (
          <div className="max-w-2xl mx-auto px-6 sm:px-10 py-10">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: civ.color }} />
              <h1 className="serif text-3xl text-parchment-100 font-medium">{civ.name}</h1>
            </div>
            <p className="text-sm text-parchment-500 mb-6">{civ.region}</p>

            <div className="mb-8">
              <ImageSlot imageUrl={civ.imageUrl} title={civ.name} prompt={civ.imagePrompt} />
            </div>

            {civ.summary && (
              <p className="serif text-base text-parchment-300 leading-relaxed mb-10">{civ.summary}</p>
            )}

            {GROUPS.map((group, gi) => (
              <React.Fragment key={group.label}>
                <GroupLabel>{group.label}</GroupLabel>
                {group.ids.map((id, idx) => (
                  <React.Fragment key={id}>
                    <ChainCard link={linkById[id]} strength={linkStrength(id)} />
                    {idx < group.ids.length - 1 && (
                      <Connector color={edgeColor(id, group.ids[idx + 1])} />
                    )}
                  </React.Fragment>
                ))}
                {gi < GROUPS.length - 1 && (
                  <Connector color={edgeColor(group.ids[group.ids.length - 1], GROUPS[gi + 1].ids[0])} />
                )}
              </React.Fragment>
            ))}

            <GroupLabel>Civilizational outcomes</GroupLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LEAVES.map(id => (
                <div key={id}>
                  <Stem color={edgeColor('specialization', id)} />
                  <ChainCard link={linkById[id]} strength={linkStrength(id)} compact />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-parchment-500 text-sm">
            Select a civilization to trace its causal chain
          </div>
        )}
      </div>
    </div>
  );
}

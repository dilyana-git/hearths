import React, { useState } from 'react';
import ImageSlot from './ImageSlot';
import { CHAIN_STRENGTH_COLORS, CHAIN_STRENGTH_LABELS } from '../utils/constants';

// ── Diamond's causal chain as a living tree ──────────────────────────────────
// Roots   = geographic endowment (biogeography, domesticable species)
// Trunk   = the agricultural ladder (food production → surplus → specialization)
// Canopy  = four civilizational outcomes branching from specialization
//
// Each node's strength for the selected civilization controls how thick the
// limb is and how lush the foliage grows; an "absent" link withers to a
// dashed stub — the chain visibly breaks. Switching civilizations regrows
// the tree from the roots up. Click any part to read it in the side panel.

const DISPLAY_COLORS = { ...CHAIN_STRENGTH_COLORS, absent: '#5d6678' };

const STRENGTH_RANK = { strong: 3, 'context-specific': 2, moderate: 2, weak: 1, absent: 0 };

const STRENGTH_VIS = {
  strong:             { width: 1,    opacity: 0.95, foliage: 11 },
  'context-specific': { width: 0.7,  opacity: 0.8,  foliage: 7 },
  moderate:           { width: 0.7,  opacity: 0.8,  foliage: 6 },
  weak:               { width: 0.45, opacity: 0.6,  foliage: 3 },
  absent:             { width: 0.2,  opacity: 0.35, foliage: 0 },
};

const CHAIN_STRENGTH_DESCRIPTIONS = {
  'strong':           'Clear, well-evidenced causal contribution for this civilization.',
  'moderate':         'Present and meaningful — but not the primary driver.',
  'weak':             'Limited, indirect, or contested contribution.',
  'context-specific': 'Significant only under specific historical circumstances.',
  'absent':           'No evidence of this factor; the causal chain breaks here.',
};

// ── Geometry ─────────────────────────────────────────────────────────────────

const VW = 760;
const VH = 668;
const CX = 380;
const GROUND_Y = 540;

const NODES = {
  'biogeography':         { x: CX,  y: 606 },
  'domesticable-species': { x: CX,  y: GROUND_Y },
  'food-production':      { x: CX,  y: 452 },
  'surplus':              { x: CX,  y: 364 },
  'specialization':       { x: CX,  y: 276 },
  'writing':              { x: 122, y: 156 },
  'technology':           { x: 296, y: 100 },
  'political-complexity': { x: 466, y: 100 },
  'epidemic-disease':     { x: 640, y: 156 },
};

const LEAVES = ['writing', 'technology', 'political-complexity', 'epidemic-disease'];

const ZONES = {
  'biogeography':         'Roots · geographic endowment',
  'domesticable-species': 'Roots · geographic endowment',
  'food-production':      'Trunk · agricultural transition',
  'surplus':              'Trunk · agricultural transition',
  'specialization':       'Trunk · social complexity',
  'writing':              'Canopy · civilizational outcomes',
  'technology':           'Canopy · civilizational outcomes',
  'political-complexity': 'Canopy · civilizational outcomes',
  'epidemic-disease':     'Canopy · civilizational outcomes',
};

// Trunk segments, bottom-up, with alternating bow for an organic curve
const SEGMENTS = [
  { from: 'biogeography',         to: 'domesticable-species', w: 10, bow: 0,  delay: 0    },
  { from: 'domesticable-species', to: 'food-production',      w: 9,  bow: 7,  delay: 0.15 },
  { from: 'food-production',      to: 'surplus',              w: 8,  bow: -7, delay: 0.32 },
  { from: 'surplus',              to: 'specialization',       w: 7,  bow: 6,  delay: 0.48 },
];

function trunkPath(x1, y1, x2, y2, bow) {
  const my = (y1 + y2) / 2;
  return `M ${x1},${y1} C ${x1 - bow},${my} ${x2 + bow},${my} ${x2},${y2}`;
}

function branchPath(fx, fy, tx, ty) {
  return `M ${fx},${fy} C ${fx},${fy - 80} ${tx},${ty + 110} ${tx},${ty}`;
}

// Root strands spreading below the deepest node
const ROOT_STRANDS = [
  `M ${CX},606 C ${CX - 30},616 ${CX - 62},618 ${CX - 96},636`,
  `M ${CX},606 C ${CX - 10},622 ${CX - 26},634 ${CX - 32},650`,
  `M ${CX},606 C ${CX + 12},622 ${CX + 28},634 ${CX + 38},648`,
  `M ${CX},606 C ${CX + 32},614 ${CX + 66},616 ${CX + 100},634`,
];

function foliageDots(n) {
  const dots = [];
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996 + 0.7; // golden angle keeps clusters organic but stable
    const r = 9 + ((i * 13) % 17);
    dots.push({
      x: Math.cos(a) * r * 1.3,
      y: Math.sin(a) * r * 0.85 - 5,
      r: 6 + ((i * 7) % 8),
    });
  }
  return dots;
}

function edgeStrength(s1, s2) {
  return STRENGTH_RANK[s1] <= STRENGTH_RANK[s2] ? s1 : s2;
}

// ── Tree pieces ──────────────────────────────────────────────────────────────

function Limb({ d, baseWidth, strength, delay }) {
  const vis = STRENGTH_VIS[strength];
  const color = DISPLAY_COLORS[strength];
  const absent = strength === 'absent';

  if (absent) {
    return (
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={Math.max(1.2, baseWidth * vis.width)}
        strokeOpacity={vis.opacity}
        strokeDasharray="5,6"
        strokeLinecap="round"
        className="leaf-in"
        style={{ animationDelay: `${delay}s` }}
      />
    );
  }
  return (
    <path
      d={d}
      pathLength={1}
      fill="none"
      stroke={color}
      strokeWidth={baseWidth * vis.width}
      strokeOpacity={vis.opacity}
      strokeLinecap="round"
      className="tree-grow"
      style={{ animationDelay: `${delay}s`, transition: 'stroke 0.6s ease, stroke-width 0.6s ease' }}
    />
  );
}

function Foliage({ x, y, strength, delay }) {
  const vis = STRENGTH_VIS[strength];
  const color = DISPLAY_COLORS[strength];

  if (!vis.foliage) {
    // Withered branch: a bare dashed outline where the crown should be
    return (
      <circle
        cx={x} cy={y - 4} r={14}
        fill="none" stroke={color} strokeOpacity={0.4}
        strokeWidth={1} strokeDasharray="3,4"
        className="leaf-in" style={{ animationDelay: `${delay}s` }}
      />
    );
  }

  const dots = foliageDots(vis.foliage);
  return (
    <g transform={`translate(${x},${y})`}>
      <g className="foliage-sway" style={{ animationDelay: `${(x % 5) * 0.6}s` }}>
        <g className="leaf-in" style={{ animationDelay: `${delay}s` }}>
          <circle r={26 + vis.foliage * 1.6} cy={-5} fill={color} fillOpacity={0.08} />
          {dots.map((d, i) => (
            <circle
              key={i}
              cx={d.x} cy={d.y} r={d.r}
              fill={color}
              fillOpacity={i % 3 === 0 ? 0.42 : 0.26}
            />
          ))}
        </g>
      </g>
    </g>
  );
}

function TreeNode({ id, label, strength, selected, hovered, onClick, onHover, labelBelow }) {
  const { x, y } = NODES[id];
  const color = DISPLAY_COLORS[strength];
  const absent = strength === 'absent';
  const active = selected || hovered;

  return (
    <g
      onClick={e => { e.stopPropagation(); onClick(id); }}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: 'pointer' }}
    >
      {selected && (
        <circle cx={x} cy={y} r={13} fill="none" stroke="#d4c9a8" strokeOpacity={0.55} strokeWidth={1.2} />
      )}
      <circle
        cx={x} cy={y} r={active ? 8.5 : 7}
        fill={color} fillOpacity={absent ? 0.06 : 0.2}
        stroke={color} strokeWidth={2}
        strokeOpacity={absent ? 0.5 : 0.95}
        strokeDasharray={absent ? '3,3' : 'none'}
        style={{ transition: 'all 0.25s ease' }}
      />
      {!absent && <circle cx={x} cy={y} r={2.6} fill={color} />}

      {labelBelow ? (
        <text
          x={x} y={y + 46} textAnchor="middle"
          className="serif"
          fontSize={13} fill={active ? '#f0e9d2' : absent ? '#6b6152' : '#d4c9a8'}
          style={{ transition: 'fill 0.2s ease' }}
        >
          {label}
        </text>
      ) : (
        <text
          x={x + 20} y={y + 4.5}
          className="serif"
          fontSize={14} fill={active ? '#f0e9d2' : absent ? '#6b6152' : '#d4c9a8'}
          style={{ transition: 'fill 0.2s ease' }}
        >
          {label}
        </text>
      )}
      {/* generous invisible hit area */}
      <circle cx={x} cy={y} r={20} fill="transparent" />
    </g>
  );
}

// ── Root component ───────────────────────────────────────────────────────────

export default function CausalChain({ data, selectedCivId, onSelectCiv, onNavigate, onNavigateToMap }) {
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const civ = data.civById[selectedCivId];
  const strength = civ?.chainStrength || {};

  const linkById = {};
  data.causalChain.links.forEach(l => { linkById[l.id] = l; });

  const s = id => strength[id] || 'absent';
  const selectedLink = selectedId ? linkById[selectedId] : null;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left rail — framing + civ picker + strength key */}
      <div className="flex-shrink-0 w-52 border-r border-coal-700 overflow-y-auto py-5 px-3.5">
        <h2 className="serif text-lg text-parchment-200 font-medium mb-1.5 px-1">Diamond's Causal Chain</h2>
        <p className="text-[11px] leading-snug mb-4 px-1" style={{ color: '#8a7d65' }}>
          After <em>Guns, Germs, and Steel</em> (1997). The chain grows as a tree: roots are the
          geographic endowment, the trunk is food production and surplus, the canopy the outcomes.
          Click any part of the tree to read it.
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
        <div className="flex flex-col gap-1.5 px-1 mb-4">
          {Object.entries(DISPLAY_COLORS).map(([k, c]) => (
            <div key={k} className="flex items-center gap-2 cursor-default" title={CHAIN_STRENGTH_DESCRIPTIONS[k]}>
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c }} />
              <span className="text-[11px] text-parchment-400">{CHAIN_STRENGTH_LABELS[k]}</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] leading-snug px-1 italic" style={{ color: '#5c5245' }}>
          One influential framework — critiqued for environmental determinism and underweighting
          agency. Ratings are heuristic, not measurements.
        </p>
      </div>

      {/* Centre — the tree */}
      <div
        className="flex-1 overflow-y-auto flex flex-col items-center bg-coal-900"
        onClick={() => setSelectedId(null)}
      >
        {civ ? (
          <>
            <div key={civ.id} className="era-title-in flex-shrink-0 pt-5 pb-1 text-center px-4">
              <div className="flex items-center justify-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: civ.color }} />
                <span className="serif text-2xl text-parchment-100 font-medium">{civ.name}</span>
              </div>
              <p className="text-xs text-parchment-500 mt-0.5">{civ.region}</p>
            </div>

            <svg
              key={`tree-${civ.id}`}
              viewBox={`0 0 ${VW} ${VH}`}
              width={VW} height={VH}
              className="flex-shrink-0 max-w-full"
              style={{ display: 'block' }}
            >
              <defs>
                <linearGradient id="treeSky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#131a26" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#0a0d12" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="treeSoil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#171208" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#0c0a06" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              <rect x={0} y={0} width={VW} height={GROUND_Y} fill="url(#treeSky)" />
              <rect x={0} y={GROUND_Y} width={VW} height={VH - GROUND_Y} fill="url(#treeSoil)" />
              <path
                d={`M 56,${GROUND_Y} Q ${CX},${GROUND_Y - 10} ${VW - 56},${GROUND_Y}`}
                fill="none" stroke="#3a3022" strokeWidth={1.2} strokeOpacity={0.8}
              />

              {/* Zone captions */}
              {[
                { y: 92,  text: 'CANOPY · OUTCOMES' },
                { y: 370, text: 'TRUNK · SURPLUS & SPECIALIZATION' },
                { y: 598, text: 'ROOTS · ENDOWMENT' },
              ].map(z => (
                <text key={z.text} x={20} y={z.y} fontSize={8.5} letterSpacing={2} fill="#4a4538" opacity={0.9}>
                  {z.text}
                </text>
              ))}

              {/* Root strands below the deepest node */}
              {ROOT_STRANDS.map((d, i) => (
                <Limb key={i} d={d} baseWidth={3.5 - i * 0.3} strength={s('biogeography')} delay={0.05 * i} />
              ))}

              {/* Trunk segments */}
              {SEGMENTS.map(seg => (
                <Limb
                  key={seg.from}
                  d={trunkPath(NODES[seg.from].x, NODES[seg.from].y, NODES[seg.to].x, NODES[seg.to].y, seg.bow)}
                  baseWidth={seg.w}
                  strength={edgeStrength(s(seg.from), s(seg.to))}
                  delay={seg.delay}
                />
              ))}

              {/* Branches into the canopy */}
              {LEAVES.map((id, i) => (
                <Limb
                  key={id}
                  d={branchPath(NODES.specialization.x, NODES.specialization.y, NODES[id].x, NODES[id].y)}
                  baseWidth={4.5}
                  strength={edgeStrength(s('specialization'), s(id))}
                  delay={0.66 + i * 0.06}
                />
              ))}

              {/* Foliage crowns */}
              {LEAVES.map((id, i) => (
                <Foliage key={id} x={NODES[id].x} y={NODES[id].y} strength={s(id)} delay={1.0 + i * 0.1} />
              ))}

              {/* Nodes + labels */}
              {Object.keys(NODES).map(id => (
                <TreeNode
                  key={id}
                  id={id}
                  label={linkById[id]?.label || id}
                  strength={s(id)}
                  selected={selectedId === id}
                  hovered={hoveredId === id}
                  onClick={setSelectedId}
                  onHover={setHoveredId}
                  labelBelow={LEAVES.includes(id)}
                />
              ))}
            </svg>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-parchment-500 text-sm">
            Select a civilization to grow its tree
          </div>
        )}
      </div>

      {/* Right panel — reading pane */}
      <div className="flex-shrink-0 w-80 border-l border-coal-700 overflow-y-auto p-5 bg-coal-900">
        {selectedLink && civ ? (
          <div key={selectedLink.id} className="era-caption-in">
            <p className="text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: '#5c5245' }}>
              {ZONES[selectedLink.id]}
            </p>
            <h3 className="serif text-2xl text-parchment-100 font-medium leading-tight mb-3">
              {selectedLink.label}
            </h3>
            <span
              className="inline-block text-[10px] uppercase tracking-[0.15em] px-2.5 py-1 rounded-full mb-2"
              style={{
                color: DISPLAY_COLORS[s(selectedLink.id)],
                border: `1px solid ${DISPLAY_COLORS[s(selectedLink.id)]}55`,
              }}
            >
              {CHAIN_STRENGTH_LABELS[s(selectedLink.id)]} for {civ.name}
            </span>
            <p className="text-[11px] italic leading-snug mb-5" style={{ color: '#8a7d65' }}>
              {CHAIN_STRENGTH_DESCRIPTIONS[s(selectedLink.id)]}
            </p>
            <p className="text-sm text-parchment-300 leading-relaxed">{selectedLink.description}</p>
            <button
              onClick={() => setSelectedId(null)}
              className="mt-8 text-xs text-parchment-600 hover:text-parchment-400 transition-colors"
            >
              ← back to {civ.name}
            </button>
          </div>
        ) : civ ? (
          <div key={civ.id} className="era-caption-in">
            <ImageSlot imageUrl={civ.imageUrl} title={civ.name} prompt={civ.imagePrompt} />
            <p className="serif text-sm text-parchment-300 leading-relaxed mt-5">{civ.summary}</p>
            <div className="flex flex-wrap gap-3 mt-5">
              {onNavigate && (
                <button
                  onClick={() => onNavigate({ type: 'civ', item: civ })}
                  className="inline-flex items-center gap-1 text-[11px] text-teal-500 hover:text-teal-300 transition-colors"
                >
                  Read full profile →
                </button>
              )}
              {onNavigateToMap && (
                <button
                  onClick={() => onNavigateToMap(civ.id)}
                  className="inline-flex items-center gap-1 text-[11px] text-teal-500 hover:text-teal-300 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="7" r="3"/><path d="M8 14s5-4.5 5-7a5 5 0 1 0-10 0c0 2.5 5 7 5 7z"/>
                  </svg>
                  See on map
                </button>
              )}
            </div>
            <p className="text-[11px] italic leading-snug mt-6" style={{ color: '#5c5245' }}>
              Click any root, trunk ring, or branch of the tree to read that link in Diamond's chain.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

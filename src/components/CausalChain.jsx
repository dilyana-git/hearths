import React, { useState, useMemo, useEffect } from 'react';
import { CHAIN_STRENGTH_COLORS, CHAIN_STRENGTH_LABELS } from '../utils/constants';

// ── Tree layout ──────────────────────────────────────────────────────────────
// The chain is a vertical spine that branches at the bottom:
//
//   Biogeography
//       │
//   Domesticable Species
//       │
//   Food Production
//       │
//   Surplus
//       │
//   Specialization
//   ╱   ╱   ╲   ╲
//  W   T   PC   ED
//
// All coordinates are percentages of SVG width so it scales naturally.

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

const DESCRIPTIONS = {
  'biogeography':        'Axis orientation, landmass area, climate zones, and the native species pool.',
  'domesticable-species':'Wild plants and animals with traits compatible with human domestication.',
  'food-production':     'Agriculture and pastoralism as the primary caloric base.',
  'surplus':             'Food production exceeding immediate needs — the engine of everything else.',
  'specialization':      'Surplus frees people from farming: artisans, scribes, soldiers, priests.',
  'writing':             'Information storage enabling administration at scale and cumulative knowledge.',
  'technology':          'Metallurgy, the wheel, the plough, navigation — specialization made physical.',
  'political-complexity':'States, taxation, law, professional armies — coercive power organised.',
  'epidemic-disease':    'Crowd diseases from livestock. Millennia of exposure → immunity. Contact = catastrophe for those without it.',
};

const SHORT_LABELS = {
  'biogeography':        'Biogeography',
  'domesticable-species':'Domesticable\nSpecies',
  'food-production':     'Food\nProduction',
  'surplus':             'Food Surplus',
  'specialization':      'Specialization',
  'writing':             'Writing &\nRecords',
  'technology':          'Technology',
  'political-complexity':'Political\nComplexity',
  'epidemic-disease':    'Epidemic\nDisease',
};

// SVG dimensions — tree fits inside this viewport
const VW = 620;
const VH = 540;
const CX = VW / 2;       // centre x
const NODE_R = 34;        // spine node radius (pill half-width)
const NODE_H = 26;        // spine node height
const SPINE_GAP = 64;     // vertical gap between spine nodes (centre-to-centre)
const LEAF_R = 50;        // leaf pill half-width
const LEAF_H = 40;        // leaf pill height
const SPINE_TOP = 40;     // y of first spine node centre

// Precompute spine positions
const spineY = i => SPINE_TOP + i * SPINE_GAP;
const spineNodes = SPINE.map((id, i) => ({ id, x: CX, y: spineY(i) }));

// Leaf positions — fan below the last spine node
const leafBaseY = spineY(SPINE.length - 1) + 88;
const totalLeafW = LEAVES.length * LEAF_R * 2 + (LEAVES.length - 1) * 16;
const leafStartX = CX - totalLeafW / 2 + LEAF_R;
const leafNodes = LEAVES.map((id, i) => ({
  id,
  x: leafStartX + i * (LEAF_R * 2 + 16),
  y: leafBaseY,
}));

// Bezier branch from last spine node to each leaf
function branchPath(fromX, fromY, toX, toY) {
  const midY = (fromY + toY) / 2;
  return `M ${fromX},${fromY} C ${fromX},${midY} ${toX},${midY} ${toX},${toY}`;
}

function strengthOpacity(s) {
  if (s === 'strong') return 1;
  if (s === 'moderate') return 0.65;
  if (s === 'weak') return 0.35;
  return 0.15;
}

function SpineNode({ node, strength, isHovered, onEnter, onLeave }) {
  const color = CHAIN_STRENGTH_COLORS[strength] || '#2a3550';
  const op = strengthOpacity(strength);
  const lines = (SHORT_LABELS[node.id] || node.id).split('\n');
  const absent = strength === 'absent';

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ cursor: 'default' }}
    >
      {/* Outer glow ring when hovered */}
      {isHovered && (
        <ellipse rx={NODE_R + 6} ry={NODE_H / 2 + 6}
          fill={color} fillOpacity={0.07}
        />
      )}

      {/* Node pill */}
      <ellipse
        rx={NODE_R} ry={NODE_H / 2}
        fill={absent ? '#0a0d12' : color}
        fillOpacity={absent ? 1 : op * 0.18}
        stroke={color}
        strokeWidth={absent ? 0.6 : isHovered ? 2 : 1.5}
        strokeOpacity={absent ? 0.25 : op}
        strokeDasharray={absent ? '4,3' : 'none'}
      />

      {/* Label */}
      {lines.map((line, li) => (
        <text
          key={li}
          y={(li - (lines.length - 1) / 2) * 13}
          textAnchor="middle"
          fill={absent ? '#3a4560' : isHovered ? color : '#b8a882'}
          fontSize={10.5}
          fontWeight={isHovered ? 500 : 400}
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function LeafNode({ node, strength, isHovered, onEnter, onLeave }) {
  const color = CHAIN_STRENGTH_COLORS[strength] || '#2a3550';
  const op = strengthOpacity(strength);
  const lines = (SHORT_LABELS[node.id] || node.id).split('\n');
  const absent = strength === 'absent';

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ cursor: 'default' }}
    >
      {isHovered && (
        <rect x={-LEAF_R - 6} y={-LEAF_H / 2 - 6} width={(LEAF_R + 6) * 2} height={LEAF_H + 12}
          rx={8} fill={color} fillOpacity={0.07}
        />
      )}

      <rect
        x={-LEAF_R} y={-LEAF_H / 2} width={LEAF_R * 2} height={LEAF_H}
        rx={6}
        fill={absent ? '#0a0d12' : color}
        fillOpacity={absent ? 1 : op * 0.18}
        stroke={color}
        strokeWidth={absent ? 0.6 : isHovered ? 2 : 1.5}
        strokeOpacity={absent ? 0.25 : op}
        strokeDasharray={absent ? '4,3' : 'none'}
      />

      {lines.map((line, li) => (
        <text
          key={li}
          y={(li - (lines.length - 1) / 2) * 13 + 1}
          textAnchor="middle"
          fill={absent ? '#3a4560' : isHovered ? color : '#b8a882'}
          fontSize={10}
          fontWeight={isHovered ? 500 : 400}
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

// Animated trunk line between two spine nodes
function TrunkSegment({ y1, y2, color, opacity }) {
  return (
    <line
      x1={CX} y1={y1 + NODE_H / 2}
      x2={CX} y2={y2 - NODE_H / 2}
      stroke={color}
      strokeWidth={opacity > 0.4 ? 2 : 1}
      strokeOpacity={opacity * 0.8}
      strokeLinecap="round"
    />
  );
}

export default function CausalChain({ data, selectedCivId, onSelectCiv }) {
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    setHoveredId(null);
  }, [selectedCivId]);

  const civ = data.civById[selectedCivId];
  const strength = civ?.chainStrength || {};

  const linkById = useMemo(() => {
    const map = {};
    data.causalChain.links.forEach(l => { map[l.id] = l; });
    return map;
  }, [data.causalChain]);

  // Arrow color between two adjacent nodes in the chain
  function edgeColor(fromId, toId) {
    const s1 = strength[fromId] || 'absent';
    const s2 = strength[toId] || 'absent';
    if (s1 === 'absent' || s2 === 'absent') return '#1e2840';
    if (s1 === 'strong' && s2 === 'strong') return CHAIN_STRENGTH_COLORS.strong;
    if (s1 === 'weak' || s2 === 'weak') return CHAIN_STRENGTH_COLORS.weak;
    return CHAIN_STRENGTH_COLORS.moderate;
  }

  function edgeOpacity(fromId, toId) {
    const s1 = strength[fromId] || 'absent';
    const s2 = strength[toId] || 'absent';
    if (s1 === 'absent' || s2 === 'absent') return 0.15;
    return strengthOpacity(s1 === 'strong' && s2 === 'strong' ? 'strong' : s1 === 'weak' || s2 === 'weak' ? 'weak' : 'moderate') * 0.7;
  }

  const lastSpine = spineNodes[spineNodes.length - 1];
  const hoveredDescription = hoveredId
    ? (DESCRIPTIONS[hoveredId] || linkById[hoveredId]?.description || '')
    : null;
  const hoveredLabel = hoveredId ? (SHORT_LABELS[hoveredId] || '').replace('\n', ' ') : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top header */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-coal-700">
        <h2 className="serif text-xl text-parchment-200 font-semibold">The Causal Chain</h2>
        <p className="text-xs text-parchment-500 mt-0.5">
          Diamond's pathway from biogeography to civilizational complexity. Select a civilization to trace its chain; hover any node to read its role.
        </p>

        {/* Connection-strength key — color + dash pattern so it's not color-only */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5">
          {Object.entries(CHAIN_STRENGTH_COLORS).map(([s, c]) => (
            <span key={s} className="flex items-center gap-1.5">
              <svg width="18" height="8" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                <line x1="1" y1="4" x2="17" y2="4"
                  stroke={c} strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray={s === 'absent' ? '3,3' : s === 'context-specific' ? '1,2' : 'none'}
                />
              </svg>
              <span className="text-xs text-parchment-400">{CHAIN_STRENGTH_LABELS[s]}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Civ selector sidebar */}
        <div className="flex-shrink-0 w-44 border-r border-coal-700 overflow-y-auto py-2">
          {data.civilizations.map(c => (
            <button
              key={c.id}
              onClick={() => onSelectCiv(c.id)}
              className={`w-full text-left px-3 py-2 rounded-none transition-colors duration-100 flex items-center gap-2 ${
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

        {/* Tree visualization + description area */}
        <div className="flex-1 overflow-auto flex flex-col items-center">
          {civ ? (
            <>
              {/* Civ title */}
              <div className="flex-shrink-0 pt-5 pb-2 text-center px-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: civ.color }} />
                  <span className="serif text-xl text-parchment-200 font-medium">{civ.name}</span>
                </div>
                <p className="text-xs text-parchment-500">{civ.region}</p>
              </div>

              {/* SVG tree */}
              <div className="flex-shrink-0 overflow-x-auto w-full flex justify-center">
                <svg width={VW} height={VH} style={{ display: 'block' }}>
                  <defs>
                    <filter id="nodeGlow2">
                      <feGaussianBlur stdDeviation="5" result="b"/>
                      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>

                  {/* ── Category group headers ── */}
                  {[
                    { y: 18,  label: 'Geographic endowment' },
                    { y: 136, label: 'Agricultural transition' },
                    { y: 264, label: 'Social complexity' },
                    { y: 337, label: 'Civilizational outcomes' },
                  ].map(({ y, label }) => (
                    <g key={label} transform={`translate(${CX}, ${y})`}>
                      <line x1={-100} y1={0} x2={-(NODE_R + 12)} y2={0} stroke="#2a3550" strokeWidth={0.7} />
                      <line x1={NODE_R + 12} y1={0} x2={100} y2={0} stroke="#2a3550" strokeWidth={0.7} />
                      {/* Background rect so the trunk line doesn't bisect the text */}
                      <rect x={-58} y={-8} width={116} height={13} fill="#0a0d12" />
                      <text y={4} textAnchor="middle" fill="#4a5570" fontSize={8} letterSpacing={1.5}
                        style={{ fontFamily: 'Inter, system-ui, sans-serif', textTransform: 'uppercase' }}>
                        {label}
                      </text>
                    </g>
                  ))}

                  {/* ── Spine connectors ── */}
                  {SPINE.slice(0, -1).map((id, i) => (
                    <TrunkSegment
                      key={id}
                      y1={spineNodes[i].y}
                      y2={spineNodes[i + 1].y}
                      color={edgeColor(id, SPINE[i + 1])}
                      opacity={edgeOpacity(id, SPINE[i + 1])}
                    />
                  ))}

                  {/* ── Branch curves to leaves ── */}
                  {leafNodes.map(leaf => {
                    const color = edgeColor('specialization', leaf.id);
                    const op = edgeOpacity('specialization', leaf.id);
                    return (
                      <path
                        key={leaf.id}
                        d={branchPath(lastSpine.x, lastSpine.y + NODE_H / 2, leaf.x, leaf.y - LEAF_H / 2)}
                        fill="none"
                        stroke={color}
                        strokeWidth={op > 0.4 ? 1.5 : 1}
                        strokeOpacity={op * 0.85}
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* ── Spine nodes ── */}
                  {spineNodes.map(node => (
                    <SpineNode
                      key={node.id}
                      node={node}
                      strength={strength[node.id] || 'absent'}
                      isHovered={hoveredId === node.id}
                      onEnter={() => setHoveredId(node.id)}
                      onLeave={() => setHoveredId(null)}
                    />
                  ))}

                  {/* ── Leaf nodes ── */}
                  {leafNodes.map(node => (
                    <LeafNode
                      key={node.id}
                      node={node}
                      strength={strength[node.id] || 'absent'}
                      isHovered={hoveredId === node.id}
                      onEnter={() => setHoveredId(node.id)}
                      onLeave={() => setHoveredId(null)}
                    />
                  ))}

                </svg>
              </div>

              {/* Hovered node description */}
              <div className="flex-shrink-0 min-h-20 px-6 py-3 text-center max-w-lg">
                {hoveredDescription ? (
                  <div>
                    <p className="serif text-base text-parchment-200 mb-1.5">{hoveredLabel}</p>
                    <p className="text-xs text-parchment-400 leading-relaxed">{hoveredDescription}</p>
                  </div>
                ) : (
                  <p className="text-xs text-parchment-500 mt-4">
                    Hover a node to read its role in the chain
                  </p>
                )}
              </div>

              {/* Civ summary */}
              <div className="flex-shrink-0 mx-6 mb-5 px-4 py-3 rounded border border-coal-600 max-w-lg w-full">
                <p className="text-xs text-parchment-400 leading-relaxed">{civ.summary}</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-parchment-500 text-sm">
              Select a civilization to trace its causal chain
            </div>
          )}
        </div>
      </div>

      {/* Footer caveat */}
      <div className="flex-shrink-0 px-5 py-2.5 border-t border-coal-700">
        <p className="text-xs text-parchment-500">
          <strong className="text-parchment-400">Note:</strong> Strength ratings are analytical characterizations based on Diamond's framework — a heuristic, not a measurement. Real historical causation is always more complex.
        </p>
      </div>
    </div>
  );
}

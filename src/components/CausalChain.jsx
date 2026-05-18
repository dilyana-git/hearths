import React, { useState, useMemo } from 'react';
import { CHAIN_STRENGTH_COLORS, CHAIN_STRENGTH_LABELS } from '../utils/constants';

// Chain layout constants
const BOX_W = 110;
const BOX_H = 52;
const BOX_GAP = 18;
const ROW_H = 90;
const BRANCH_OFFSET = 80;

// The chain has two rows:
// Row 1: Biogeography → Domesticable Species → Food Production → Surplus → Specialization
// Row 2 (below, branching from Specialization): Writing → Technology → Political Complexity → Epidemic Disease
const ROW1 = ['biogeography', 'domesticable-species', 'food-production', 'surplus', 'specialization'];
const ROW2 = ['writing', 'technology', 'political-complexity', 'epidemic-disease'];

const LABELS = {
  'biogeography': 'Biogeography',
  'domesticable-species': 'Domesticable\nSpecies',
  'food-production': 'Food\nProduction',
  'surplus': 'Food\nSurplus',
  'specialization': 'Specialization',
  'writing': 'Writing &\nRecords',
  'technology': 'Technology',
  'political-complexity': 'Political\nComplexity',
  'epidemic-disease': 'Epidemic\nDisease',
};

const DESCRIPTIONS = {
  'biogeography': 'Axis orientation, area, climate, native species',
  'domesticable-species': 'Wild plants & animals amenable to domestication',
  'food-production': 'Agriculture and pastoralism as primary subsistence',
  'surplus': 'Excess production enabling non-farming specialists',
  'specialization': 'Full-time artisans, scribes, soldiers, administrators',
  'writing': 'Information storage, administration, accumulated knowledge',
  'technology': 'Metal, wheel, plough, navigation, military tools',
  'political-complexity': 'States, empires, professional armies',
  'epidemic-disease': 'Crowd diseases from livestock cohabitation, conferring immunity',
};

function ChainBox({ link, x, y, strength, isHovered, onHover, onLeave, svgW }) {
  const color = CHAIN_STRENGTH_COLORS[strength] || '#2a3550';
  const lines = (LABELS[link.id] || link.label).split('\n');
  const isMissing = strength === 'absent';

  return (
    <g
      transform={`translate(${x},${y})`}
      onMouseEnter={() => onHover(link.id)}
      onMouseLeave={onLeave}
      style={{ cursor: 'default' }}
    >
      {/* Box shadow/glow */}
      {isHovered && (
        <rect
          x={-2} y={-2}
          width={BOX_W + 4}
          height={BOX_H + 4}
          rx={6}
          fill={color}
          fillOpacity={0.08}
        />
      )}

      {/* Box body */}
      <rect
        x={0} y={0}
        width={BOX_W}
        height={BOX_H}
        rx={4}
        fill={isMissing ? '#0f1117' : '#161b26'}
        stroke={color}
        strokeWidth={isMissing ? 0.5 : 1.5}
        strokeOpacity={isMissing ? 0.3 : 0.8}
        strokeDasharray={isMissing ? '4,3' : 'none'}
      />

      {/* Strength indicator bar at top */}
      <rect
        x={0} y={0}
        width={BOX_W}
        height={3}
        rx={4}
        fill={color}
        fillOpacity={isMissing ? 0.1 : 0.6}
      />

      {/* Label text */}
      {lines.map((line, i) => (
        <text
          key={i}
          x={BOX_W / 2}
          y={16 + i * 16}
          textAnchor="middle"
          fill={isMissing ? '#5c5245' : '#d4c9a8'}
          fontSize={10}
          fontWeight={isHovered ? 500 : 400}
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {line}
        </text>
      ))}

      {/* Strength label */}
      <text
        x={BOX_W / 2}
        y={BOX_H - 8}
        textAnchor="middle"
        fill={color}
        fontSize={9}
        opacity={0.9}
        style={{ fontFamily: 'Inter, system-ui, sans-serif', textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {CHAIN_STRENGTH_LABELS[strength] || strength}
      </text>
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, color, opacity = 0.5 }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const arrowLen = 6;
  const arrowW = 3.5;
  const ex = x2 - ux * arrowLen;
  const ey = y2 - uy * arrowLen;

  return (
    <g>
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={1.2} strokeOpacity={opacity} />
      <polygon
        points={`
          ${x2},${y2}
          ${ex - uy * arrowW},${ey + ux * arrowW}
          ${ex + uy * arrowW},${ey - ux * arrowW}
        `}
        fill={color}
        opacity={opacity}
      />
    </g>
  );
}

export default function CausalChain({ data, selectedCivId, onSelectCiv }) {
  const [hoveredLink, setHoveredLink] = useState(null);

  const civ = data.civById[selectedCivId];
  const chain = data.causalChain;

  const linkById = useMemo(() => {
    const map = {};
    chain.links.forEach(l => { map[l.id] = l; });
    return map;
  }, [chain]);

  const strength = civ?.chainStrength || {};

  // SVG layout
  const row1TotalW = ROW1.length * BOX_W + (ROW1.length - 1) * BOX_GAP;
  const row2TotalW = ROW2.length * BOX_W + (ROW2.length - 1) * BOX_GAP;
  const svgW = Math.max(row1TotalW, row2TotalW) + 60;
  const svgH = ROW_H + BOX_H + BRANCH_OFFSET + BOX_H + 60;

  const row1Y = 40;
  const row1StartX = 30;
  const row2Y = row1Y + BOX_H + BRANCH_OFFSET;
  const row2StartX = (svgW - row2TotalW) / 2;

  // Compute arrow colour per link pair
  function arrowColor(fromId, toId) {
    const s1 = strength[fromId] || 'absent';
    const s2 = strength[toId] || 'absent';
    if (s1 === 'absent' || s2 === 'absent') return '#2a3550';
    if (s1 === 'strong' && s2 === 'strong') return '#00a896';
    if (s1 === 'weak' || s2 === 'weak') return '#c0392b';
    return '#b8960c';
  }

  function arrowOpacity(fromId, toId) {
    const s1 = strength[fromId] || 'absent';
    const s2 = strength[toId] || 'absent';
    if (s1 === 'absent' || s2 === 'absent') return 0.2;
    if (s1 === 'strong' && s2 === 'strong') return 0.7;
    return 0.45;
  }

  const hoveredLinkData = hoveredLink ? linkById[hoveredLink] : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-start justify-between px-5 py-4 border-b border-coal-700">
        <div>
          <h2 className="serif text-xl text-parchment-200 font-semibold">
            The Causal Chain
          </h2>
          <p className="text-xs text-parchment-500 mt-0.5">
            How biogeography cascades into civilizational complexity — select a civilization to trace its chain.
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — civ selector */}
        <div className="flex-shrink-0 w-48 border-r border-coal-700 overflow-y-auto">
          <div className="p-2">
            <p className="text-xs text-parchment-500 px-2 py-1.5 uppercase tracking-widest">Select</p>
            {data.civilizations.map(c => (
              <button
                key={c.id}
                onClick={() => onSelectCiv(c.id)}
                className={`w-full text-left px-3 py-2.5 rounded text-sm transition-colors duration-100 flex items-center gap-2 ${
                  c.id === selectedCivId
                    ? 'bg-coal-600 text-parchment-200'
                    : 'text-parchment-400 hover:bg-coal-700 hover:text-parchment-200'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: c.color }}
                />
                <span className="leading-tight text-xs">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main chain visualization */}
        <div className="flex-1 overflow-auto flex flex-col">
          {civ ? (
            <div className="p-4 flex flex-col items-center">
              {/* Civ header */}
              <div className="mb-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: civ.color }} />
                  <h3 className="serif text-xl text-parchment-200 font-semibold">{civ.name}</h3>
                </div>
                <p className="text-xs text-parchment-500 max-w-md">{civ.region}</p>
              </div>

              {/* Chain SVG */}
              <div className="overflow-x-auto w-full">
                <svg
                  width={Math.max(svgW, 680)}
                  height={svgH}
                  style={{ display: 'block', margin: '0 auto' }}
                >
                  {/* Connecting arrows — Row 1 */}
                  {ROW1.slice(0, -1).map((id, i) => {
                    const x1 = row1StartX + i * (BOX_W + BOX_GAP) + BOX_W;
                    const y1 = row1Y + BOX_H / 2;
                    const x2 = row1StartX + (i + 1) * (BOX_W + BOX_GAP);
                    const color = arrowColor(id, ROW1[i + 1]);
                    const op = arrowOpacity(id, ROW1[i + 1]);
                    return <Arrow key={id} x1={x1} y1={y1} x2={x2} y2={y1} color={color} opacity={op} />;
                  })}

                  {/* Vertical arrow from Specialization down to Row 2 */}
                  {(() => {
                    const lastR1x = row1StartX + (ROW1.length - 1) * (BOX_W + BOX_GAP) + BOX_W / 2;
                    const topY = row1Y + BOX_H;
                    const midY = row1Y + BOX_H + BRANCH_OFFSET / 2;
                    const row2MidX = row2StartX + (ROW2.length - 1) * (BOX_W + BOX_GAP) / 2 + BOX_W / 2;
                    const color = arrowColor('specialization', 'writing');
                    const op = arrowOpacity('specialization', 'writing');
                    return (
                      <g>
                        <line x1={lastR1x} y1={topY} x2={lastR1x} y2={midY} stroke={color} strokeWidth={1.2} strokeOpacity={op} />
                        <line x1={lastR1x} y1={midY} x2={row2MidX} y2={midY} stroke={color} strokeWidth={1.2} strokeOpacity={op} />
                        <Arrow
                          x1={row2MidX}
                          y1={midY}
                          x2={row2MidX}
                          y2={row2Y}
                          color={color}
                          opacity={op}
                        />
                      </g>
                    );
                  })()}

                  {/* Connecting arrows — Row 2 */}
                  {ROW2.slice(0, -1).map((id, i) => {
                    const x1 = row2StartX + i * (BOX_W + BOX_GAP) + BOX_W;
                    const y1 = row2Y + BOX_H / 2;
                    const x2 = row2StartX + (i + 1) * (BOX_W + BOX_GAP);
                    const color = arrowColor(id, ROW2[i + 1]);
                    const op = arrowOpacity(id, ROW2[i + 1]);
                    return <Arrow key={id} x1={x1} y1={y1} x2={x2} y2={y1} color={color} opacity={op} />;
                  })}

                  {/* Row 1 boxes */}
                  {ROW1.map((id, i) => (
                    <ChainBox
                      key={id}
                      link={linkById[id] || { id, label: id }}
                      x={row1StartX + i * (BOX_W + BOX_GAP)}
                      y={row1Y}
                      strength={strength[id] || 'absent'}
                      isHovered={hoveredLink === id}
                      onHover={setHoveredLink}
                      onLeave={() => setHoveredLink(null)}
                    />
                  ))}

                  {/* Row 2 boxes */}
                  {ROW2.map((id, i) => (
                    <ChainBox
                      key={id}
                      link={linkById[id] || { id, label: id }}
                      x={row2StartX + i * (BOX_W + BOX_GAP)}
                      y={row2Y}
                      strength={strength[id] || 'absent'}
                      isHovered={hoveredLink === id}
                      onHover={setHoveredLink}
                      onLeave={() => setHoveredLink(null)}
                    />
                  ))}

                  {/* "Outcomes" label */}
                  <text
                    x={svgW / 2}
                    y={row2Y + BOX_H + 22}
                    textAnchor="middle"
                    fill="#5c5245"
                    fontSize={9}
                    letterSpacing={1.5}
                    style={{ fontFamily: 'Inter, system-ui, sans-serif', textTransform: 'uppercase' }}
                  >
                    Outcomes of the full chain
                  </text>
                </svg>
              </div>

              {/* Hovered link description */}
              <div className="mt-2 h-16 flex items-center justify-center">
                {hoveredLinkData ? (
                  <div className="text-center max-w-lg">
                    <p className="text-sm text-parchment-200 font-medium mb-1">{hoveredLinkData.label}</p>
                    <p className="text-xs text-parchment-400">{DESCRIPTIONS[hoveredLinkData.id] || hoveredLinkData.description}</p>
                  </div>
                ) : (
                  <p className="text-xs text-parchment-500">Hover a chain link to read its description</p>
                )}
              </div>

              {/* Chain summary */}
              <div className="mt-4 max-w-lg w-full">
                <div className="panel rounded p-4">
                  <h4 className="text-xs font-medium text-parchment-400 uppercase tracking-widest mb-2">
                    Summary — {civ.name}
                  </h4>
                  <p className="text-xs text-parchment-400 leading-relaxed mb-3">{civ.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(civ.chainStrength || {}).map(([key, val]) => (
                      <span
                        key={key}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: CHAIN_STRENGTH_COLORS[val] + '18',
                          color: CHAIN_STRENGTH_COLORS[val],
                          border: `1px solid ${CHAIN_STRENGTH_COLORS[val]}30`,
                        }}
                      >
                        {CHAIN_STRENGTH_LABELS[val]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color legend */}
              <div className="mt-4 flex items-center gap-5 text-xs text-parchment-500">
                {Object.entries(CHAIN_STRENGTH_COLORS).map(([s, c]) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 rounded" style={{ backgroundColor: c }} />
                    <span style={{ color: c }}>{CHAIN_STRENGTH_LABELS[s]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-parchment-500 text-sm">
              Select a civilization to trace its causal chain
            </div>
          )}
        </div>
      </div>

      {/* Intellectual honesty note */}
      <div className="flex-shrink-0 px-5 py-3 border-t border-coal-700">
        <p className="text-xs text-parchment-500 leading-relaxed">
          <strong className="text-parchment-400">Note:</strong> This causal chain is Diamond's interpretive model — one influential framework among several. Strength ratings are analytical characterizations, not scientific measurements. Real historical causation is always more complex than any single schema.
        </p>
      </div>
    </div>
  );
}

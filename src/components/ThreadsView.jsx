import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { TIME_DOMAIN, TYPE_META, ERAS, AXIS_LABELS, AXIS_COLORS, formatYear, SORT_OPTIONS } from '../utils/constants';

const TRACK_H = 64;
const TRACK_GAP = 14;
const TOP_H = 72;
const NODE_R = 7;
const PX_PER_YEAR = 0.148;
const SVG_PAD_RIGHT = 40;

const SVG_W = Math.ceil((TIME_DOMAIN[1] - TIME_DOMAIN[0]) * PX_PER_YEAR) + SVG_PAD_RIGHT;

function xFromYear(year) {
  return (year - TIME_DOMAIN[0]) * PX_PER_YEAR;
}

function computeLayout(milestones) {
  const sorted = [...milestones].sort((a, b) => a.date - b.date);
  const center = TRACK_H / 2;
  const yOptions = [0, -20, +20, -38, +38];
  const placed = [];

  return sorted.map(m => {
    const x = xFromYear(m.date);
    let yOff = 0;
    for (const dy of yOptions) {
      const y = center + dy;
      if (y - NODE_R < 3 || y + NODE_R > TRACK_H - 3) continue;
      const overlaps = placed.some(p =>
        Math.abs(p.x - x) < NODE_R * 2 + 1 && Math.abs(p.dy - dy) < NODE_R * 2 + 1
      );
      if (!overlaps) { yOff = dy; break; }
    }
    placed.push({ x, dy: yOff, id: m.id });
    return { ...m, yOff };
  });
}

function sortCivs(civs, sortBy) {
  const copy = [...civs];
  if (sortBy === 'region') return copy.sort((a, b) => a.region.localeCompare(b.region));
  if (sortBy === 'axis') return copy.sort((a, b) => a.axisContext.localeCompare(b.axisContext));
  return copy.sort((a, b) => a.sortOrder - b.sortOrder);
}

// Time axis ticks
const MAJOR_TICKS = d3.range(-12000, 1501, 2000).filter(y => y >= TIME_DOMAIN[0] && y <= TIME_DOMAIN[1]);
const MINOR_TICKS = d3.range(-12500, 1501, 500).filter(y => y >= TIME_DOMAIN[0] && y <= TIME_DOMAIN[1] && !MAJOR_TICKS.includes(y));

export default function ThreadsView({ data, selectedMilestone, hoveredMilestone, onSelect, onHover, sortBy }) {
  const scrollRef = useRef(null);
  const leftRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const sortedCivs = useMemo(() => sortCivs(data.civilizations, sortBy), [data.civilizations, sortBy]);

  const layoutByCiv = useMemo(() => {
    const map = {};
    sortedCivs.forEach(civ => {
      map[civ.id] = computeLayout(data.milestonesByCiv[civ.id] || []);
    });
    return map;
  }, [sortedCivs, data.milestonesByCiv]);

  const totalH = TOP_H + sortedCivs.length * (TRACK_H + TRACK_GAP) + 16;

  const handleMouseMove = useCallback((e, milestone, civ, trackY) => {
    const rect = e.currentTarget.closest('svg').getBoundingClientRect();
    setTooltip({
      x: e.clientX - rect.left,
      y: trackY - 14,
      milestone,
      civ,
    });
    onHover(milestone);
  }, [onHover]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    onHover(null);
  }, [onHover]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Fixed left labels column */}
      <div
        ref={leftRef}
        className="flex-shrink-0 bg-coal-800 border-r border-coal-600 z-10"
        style={{ width: 200 }}
      >
        {/* Top spacer matching time axis */}
        <div
          className="border-b border-coal-700 flex items-end px-3 pb-2"
          style={{ height: TOP_H }}
        >
          <span className="text-xs text-parchment-500 tracking-widest uppercase">Civilization</span>
        </div>

        {/* Civ label rows */}
        <div
          className="overflow-y-hidden"
          style={{ height: totalH - TOP_H }}
        >
          {sortedCivs.map((civ, i) => {
            const trackTop = i * (TRACK_H + TRACK_GAP);
            return (
              <div
                key={civ.id}
                className="flex flex-col justify-center px-3 border-b border-coal-700"
                style={{ height: TRACK_H + TRACK_GAP }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: civ.color }}
                    aria-hidden="true"
                  />
                  <span
                    className="serif text-sm font-medium leading-tight text-parchment-200"
                    title={civ.name}
                  >
                    {civ.name}
                  </span>
                </div>
                <span
                  className="text-xs mt-0.5 pl-3.5 truncate"
                  style={{ color: AXIS_COLORS[civ.axisContext], opacity: 0.8 }}
                  title={AXIS_LABELS[civ.axisContext]}
                >
                  {civ.axisContext.replace('-', '–')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable timeline SVG */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-auto"
        style={{ cursor: 'default' }}
      >
        <svg
          width={SVG_W}
          height={totalH}
          style={{ display: 'block', userSelect: 'none' }}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Era background bands */}
          {ERAS.map((era, i) => {
            const x1 = xFromYear(era.start);
            const x2 = xFromYear(Math.min(era.end, TIME_DOMAIN[1]));
            return (
              <g key={era.label}>
                <rect
                  x={x1}
                  y={0}
                  width={x2 - x1}
                  height={totalH}
                  fill={i % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'rgba(0,0,0,0.06)'}
                />
              </g>
            );
          })}

          {/* Time axis */}
          <g>
            {/* Axis baseline */}
            <line
              x1={0} y1={TOP_H - 1}
              x2={SVG_W} y2={TOP_H - 1}
              stroke="#2a3550" strokeWidth={1}
            />

            {/* Era labels */}
            {ERAS.map(era => {
              const x1 = xFromYear(era.start);
              const x2 = xFromYear(Math.min(era.end, TIME_DOMAIN[1]));
              const midX = (x1 + x2) / 2;
              return (
                <text
                  key={era.label}
                  x={midX}
                  y={16}
                  textAnchor="middle"
                  fill="#5c5245"
                  fontSize={9}
                  letterSpacing={1}
                  style={{ textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  {era.label}
                </text>
              );
            })}

            {/* Major ticks */}
            {MAJOR_TICKS.map(year => {
              const x = xFromYear(year);
              return (
                <g key={year}>
                  <line x1={x} y1={TOP_H - 24} x2={x} y2={TOP_H} stroke="#2a3550" strokeWidth={1} />
                  <text
                    x={x}
                    y={TOP_H - 28}
                    textAnchor="middle"
                    fill="#8a7d65"
                    fontSize={10}
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  >
                    {formatYear(year)}
                  </text>
                </g>
              );
            })}

            {/* Minor ticks */}
            {MINOR_TICKS.map(year => {
              const x = xFromYear(year);
              return (
                <line key={year} x1={x} y1={TOP_H - 10} x2={x} y2={TOP_H} stroke="#1e2840" strokeWidth={1} />
              );
            })}
          </g>

          {/* Civilization tracks */}
          {sortedCivs.map((civ, i) => {
            const trackY = TOP_H + i * (TRACK_H + TRACK_GAP);
            const milestones = layoutByCiv[civ.id] || [];

            return (
              <g key={civ.id} className="timeline-track">
                {/* Track background */}
                <rect
                  className="track-bg"
                  x={0}
                  y={trackY}
                  width={SVG_W}
                  height={TRACK_H}
                  fill={civ.color}
                  fillOpacity={0.035}
                />

                {/* Track baseline */}
                <line
                  x1={0}
                  y1={trackY + TRACK_H / 2}
                  x2={SVG_W}
                  y2={trackY + TRACK_H / 2}
                  stroke={civ.color}
                  strokeOpacity={0.18}
                  strokeWidth={1}
                  strokeDasharray="3 6"
                />

                {/* Track bottom separator */}
                <line
                  x1={0}
                  y1={trackY + TRACK_H}
                  x2={SVG_W}
                  y2={trackY + TRACK_H}
                  stroke="#1e2840"
                  strokeWidth={1}
                />

                {/* Milestone nodes */}
                {milestones.map(m => {
                  const x = xFromYear(m.date);
                  const cy = trackY + TRACK_H / 2 + m.yOff;
                  const meta = TYPE_META[m.type] || { color: '#888', symbol: '·' };
                  const isSelected = selectedMilestone?.id === m.id;
                  const isHovered = hoveredMilestone?.id === m.id;
                  const isActive = isSelected || isHovered;

                  return (
                    <g
                      key={m.id}
                      className="milestone-node"
                      transform={`translate(${x},${cy})`}
                      onClick={() => onSelect(m)}
                      onMouseMove={e => handleMouseMove(e, m, civ, cy)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${m.title}, ${formatYear(m.date)}, ${civ.name}`}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(m); }}
                    >
                      {/* Selection ring */}
                      {isSelected && (
                        <circle
                          r={NODE_R + 4}
                          fill="none"
                          stroke={meta.color}
                          strokeWidth={1.5}
                          strokeOpacity={0.6}
                          filter="url(#glow)"
                        />
                      )}

                      {/* Glow for active */}
                      {isActive && (
                        <circle
                          r={NODE_R + 2}
                          fill={meta.color}
                          fillOpacity={0.15}
                        />
                      )}

                      {/* Node body */}
                      <circle
                        r={NODE_R}
                        fill={meta.color}
                        fillOpacity={isActive ? 0.5 : 0.22}
                        stroke={meta.color}
                        strokeWidth={isSelected ? 2 : 1.5}
                        strokeOpacity={isActive ? 1 : 0.7}
                      />

                      {/* Contested marker */}
                      {m.contested && (
                        <circle
                          r={2.5}
                          cx={NODE_R - 1}
                          cy={-NODE_R + 1}
                          fill="#b8960c"
                          stroke="#0a0d12"
                          strokeWidth={0.5}
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Tooltip */}
          {tooltip && (
            <g
              transform={`translate(${Math.min(tooltip.x, SVG_W - 200)},${tooltip.y})`}
              pointerEvents="none"
            >
              <rect
                x={-8}
                y={-28}
                width={Math.min(210, SVG_W - tooltip.x + 8)}
                height={42}
                rx={4}
                fill="#161b26"
                stroke="#2a3550"
                strokeWidth={1}
                opacity={0.97}
              />
              <text
                y={-12}
                fill="#d4c9a8"
                fontSize={11}
                fontWeight={500}
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {tooltip.milestone.title.length > 28
                  ? tooltip.milestone.title.slice(0, 28) + '…'
                  : tooltip.milestone.title}
              </text>
              <text
                y={4}
                fill="#8a7d65"
                fontSize={10}
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {tooltip.civ.name} · {formatYear(tooltip.milestone.date)}
                {tooltip.milestone.contested ? ' ⚠' : ''}
              </text>
            </g>
          )}
        </svg>

        {/* Legend strip at bottom */}
        <div className="flex items-center gap-x-4 gap-y-1 flex-wrap px-3 py-2 border-t border-coal-700 text-xs text-parchment-500">
          <span className="text-parchment-500 mr-1">Key:</span>
          {Object.entries(TYPE_META).slice(0, 8).map(([type, meta]) => (
            <span key={type} className="flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                <circle cx="5" cy="5" r="4" fill={meta.color} fillOpacity="0.3" stroke={meta.color} strokeWidth="1" />
              </svg>
              {meta.label}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <circle cx="5" cy="5" r="2.5" fill="#b8960c" />
            </svg>
            contested date
          </span>
        </div>
      </div>
    </div>
  );
}

import React, { useMemo, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { TIME_DOMAIN, TYPE_META, ERAS, AXIS_COLORS, formatYear } from '../utils/constants';

const TRACK_H = 62;
const TRACK_GAP = 10;
const TOP_H = 68;
const NODE_R = 7;
const PX_PER_YEAR = 0.150;
const SVG_PAD_RIGHT = 60;

const SVG_W = Math.ceil((TIME_DOMAIN[1] - TIME_DOMAIN[0]) * PX_PER_YEAR) + SVG_PAD_RIGHT;

function xFromYear(year) {
  return (year - TIME_DOMAIN[0]) * PX_PER_YEAR;
}

function computeLayout(milestones) {
  const sorted = [...milestones].sort((a, b) => a.date - b.date);
  const center = TRACK_H / 2;
  const yOptions = [0, -20, +20, -36, +36];
  const placed = [];

  return sorted.map(m => {
    const x = xFromYear(m.date);
    let yOff = 0;
    for (const dy of yOptions) {
      const y = center + dy;
      if (y - NODE_R < 3 || y + NODE_R > TRACK_H - 3) continue;
      const overlaps = placed.some(p =>
        Math.abs(p.x - x) < NODE_R * 2 + 2 && Math.abs(p.dy - dy) < NODE_R * 2 + 2
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

const MAJOR_TICKS = d3.range(-12000, 1501, 2000).filter(y => y >= TIME_DOMAIN[0] && y <= TIME_DOMAIN[1]);
const MINOR_TICKS = d3.range(-12500, 1501, 500)
  .filter(y => y >= TIME_DOMAIN[0] && y <= TIME_DOMAIN[1] && !MAJOR_TICKS.includes(y));

// Catmull-Rom spline through a set of {x,y} points
const catmullRomLine = d3.line().x(p => p.x).y(p => p.y).curve(d3.curveCatmullRom.alpha(0.5));

export default function ThreadsView({ data, selectedMilestone, hoveredMilestone, onSelect, onHover, sortBy }) {
  const scrollRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [hoveredType, setHoveredType] = useState(null);

  const sortedCivs = useMemo(() => sortCivs(data.civilizations, sortBy), [data.civilizations, sortBy]);

  const layoutByCiv = useMemo(() => {
    const map = {};
    sortedCivs.forEach(civ => {
      map[civ.id] = computeLayout(data.milestonesByCiv[civ.id] || []);
    });
    return map;
  }, [sortedCivs, data.milestonesByCiv]);

  // Compute per-type point sets for kinship threads
  const typeThreads = useMemo(() => {
    const map = {};
    sortedCivs.forEach((civ, i) => {
      const trackCenterY = TOP_H + i * (TRACK_H + TRACK_GAP) + TRACK_H / 2;
      (layoutByCiv[civ.id] || []).forEach(m => {
        if (!map[m.type]) map[m.type] = [];
        map[m.type].push({
          x: xFromYear(m.date),
          y: trackCenterY + m.yOff,
          date: m.date,
          milestoneId: m.id,
          civColor: civ.color,
        });
      });
    });
    // Sort each thread chronologically so the spline flows left-to-right
    Object.values(map).forEach(pts => pts.sort((a, b) => a.date - b.date));
    return map;
  }, [sortedCivs, layoutByCiv]);

  const totalH = TOP_H + sortedCivs.length * (TRACK_H + TRACK_GAP) + 24;

  const handleMouseMove = useCallback((e, milestone, civ) => {
    const rect = e.currentTarget.closest('svg').getBoundingClientRect();
    setTooltip({
      x: Math.min(e.clientX - rect.left, SVG_W - 210),
      y: e.clientY - rect.top - 50,
      milestone,
      civ,
    });
    onHover(milestone);
    setHoveredType(milestone.type);
  }, [onHover]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    onHover(null);
    setHoveredType(null);
  }, [onHover]);

  const activeType = hoveredType || (hoveredMilestone?.type) || (selectedMilestone?.type);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left civilization labels — styled as an organic legend, not a table column */}
      <div
        className="flex-shrink-0 relative"
        style={{ width: 188 }}
      >
        {/* Gradient mask on right edge to blend into SVG */}
        <div
          className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to right, transparent, #0a0d12)' }}
        />

        {/* Header spacer */}
        <div
          style={{ height: TOP_H }}
          className="flex items-end pb-2 pl-4"
        >
          <span className="text-xs tracking-widest uppercase text-parchment-500" style={{ fontSize: 9 }}>
            Cultural Hearth
          </span>
        </div>

        {/* Civ label rows */}
        {sortedCivs.map((civ, i) => (
          <div
            key={civ.id}
            className="flex flex-col justify-center pl-4 pr-6"
            style={{ height: TRACK_H + TRACK_GAP }}
          >
            {/* Colored accent line on left */}
            <div
              className="absolute left-0"
              style={{
                top: TOP_H + i * (TRACK_H + TRACK_GAP) + 12,
                height: TRACK_H - 24,
                width: 2,
                backgroundColor: civ.color,
                opacity: 0.6,
                borderRadius: 2,
              }}
            />
            <span
              className="serif leading-tight font-medium"
              style={{ color: civ.color, fontSize: 13, opacity: 0.9 }}
            >
              {civ.name}
            </span>
            <span
              className="text-parchment-500 mt-0.5 leading-none"
              style={{ fontSize: 9, letterSpacing: '0.03em' }}
            >
              {civ.region.split('(')[0].trim()}
            </span>
          </div>
        ))}
      </div>

      {/* Scrollable SVG */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden"
      >
        <svg
          width={SVG_W}
          height={totalH}
          style={{ display: 'block', userSelect: 'none' }}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Node glow */}
            <filter id="nodeGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {/* Thread glow */}
            <filter id="threadGlow" x="-5%" y="-30%" width="110%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* ── Layer 0: Era backgrounds ────────────────────── */}
          {ERAS.map((era, i) => {
            const x1 = xFromYear(era.start);
            const x2 = xFromYear(Math.min(era.end, TIME_DOMAIN[1]));
            return (
              <rect
                key={era.label}
                x={x1} y={0}
                width={x2 - x1} height={totalH}
                fill={i % 2 === 0 ? 'rgba(255,255,255,0.010)' : 'rgba(0,0,0,0.04)'}
              />
            );
          })}

          {/* ── Layer 1: Kinship threads (cross-civ type connections) ── */}
          {Object.entries(typeThreads).map(([type, points]) => {
            if (points.length < 2) return null;
            const meta = TYPE_META[type];
            if (!meta) return null;
            const isActive = activeType === type;
            const pathStr = catmullRomLine(points);
            if (!pathStr) return null;

            return (
              <g key={type}>
                {/* Wide glow for active threads */}
                {isActive && (
                  <path
                    d={pathStr}
                    fill="none"
                    stroke={meta.color}
                    strokeWidth={10}
                    strokeOpacity={0.06}
                    strokeLinecap="round"
                    filter="url(#threadGlow)"
                  />
                )}
                {/* The thread itself */}
                <path
                  d={pathStr}
                  fill="none"
                  stroke={meta.color}
                  strokeWidth={isActive ? 1.8 : 0.9}
                  strokeOpacity={isActive ? 0.60 : 0.085}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={isActive ? 'none' : '3,9'}
                  style={{ cursor: 'crosshair', transition: 'stroke-opacity 0.25s ease, stroke-width 0.25s ease' }}
                  onMouseEnter={() => setHoveredType(type)}
                  onMouseLeave={() => !hoveredMilestone && setHoveredType(null)}
                />
                {/* Endpoint dots for active threads */}
                {isActive && points.map((pt, pi) => (
                  <circle
                    key={pi}
                    cx={pt.x}
                    cy={pt.y}
                    r={2.5}
                    fill={meta.color}
                    fillOpacity={0.5}
                    pointerEvents="none"
                  />
                ))}
              </g>
            );
          })}

          {/* ── Layer 2: Time axis ────────────────────────────── */}
          <g>
            {/* Era labels */}
            {ERAS.map(era => {
              const x1 = xFromYear(era.start);
              const x2 = xFromYear(Math.min(era.end, TIME_DOMAIN[1]));
              const midX = (x1 + x2) / 2;
              return (
                <text key={era.label} x={midX} y={13}
                  textAnchor="middle" fill="#3a4560" fontSize={8.5} letterSpacing={1.2}
                  style={{ textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  {era.label}
                </text>
              );
            })}

            {/* Major ticks + labels */}
            {MAJOR_TICKS.map(year => {
              const x = xFromYear(year);
              return (
                <g key={year}>
                  <line x1={x} y1={TOP_H - 20} x2={x} y2={totalH}
                    stroke="#1e2840" strokeWidth={0.5} strokeDasharray="2,6" />
                  <text x={x} y={TOP_H - 24} textAnchor="middle"
                    fill="#5c5245" fontSize={9.5}
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  >
                    {formatYear(year)}
                  </text>
                </g>
              );
            })}

            {/* Minor ticks */}
            {MINOR_TICKS.map(year => (
              <line key={year} x1={xFromYear(year)} y1={TOP_H - 8} x2={xFromYear(year)} y2={TOP_H}
                stroke="#1e2840" strokeWidth={0.5} />
            ))}

            {/* Axis baseline */}
            <line x1={0} y1={TOP_H} x2={SVG_W} y2={TOP_H}
              stroke="#2a3550" strokeWidth={0.8} />
          </g>

          {/* ── Layer 3: Track backgrounds & organic baselines ── */}
          {sortedCivs.map((civ, i) => {
            const trackY = TOP_H + i * (TRACK_H + TRACK_GAP);
            const midY = trackY + TRACK_H / 2;

            return (
              <g key={civ.id}>
                {/* Very subtle track tint */}
                <rect
                  x={0} y={trackY} width={SVG_W} height={TRACK_H}
                  fill={civ.color}
                  fillOpacity={0.025}
                />
                {/* Organic dashed baseline — the "stem" of this civ's thread */}
                <line
                  x1={0} y1={midY} x2={SVG_W} y2={midY}
                  stroke={civ.color}
                  strokeOpacity={0.12}
                  strokeWidth={0.8}
                  strokeDasharray="1,10"
                />
              </g>
            );
          })}

          {/* ── Layer 4: Milestone nodes ─────────────────────── */}
          {sortedCivs.map((civ, i) => {
            const trackY = TOP_H + i * (TRACK_H + TRACK_GAP);
            const milestones = layoutByCiv[civ.id] || [];

            return (
              <g key={civ.id}>
                {milestones.map(m => {
                  const x = xFromYear(m.date);
                  const cy = trackY + TRACK_H / 2 + m.yOff;
                  const meta = TYPE_META[m.type] || { color: '#888' };
                  const isSelected = selectedMilestone?.id === m.id;
                  const isTypeActive = activeType === m.type;
                  const isHovered = hoveredMilestone?.id === m.id;
                  const isActive = isSelected || isHovered;

                  return (
                    <g
                      key={m.id}
                      transform={`translate(${x},${cy})`}
                      onClick={() => onSelect(m)}
                      onMouseMove={e => handleMouseMove(e, m, civ)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${m.title}, ${formatYear(m.date)}, ${civ.name}`}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(m); }}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Type-active outer ring — connects visually to the kinship thread */}
                      {isTypeActive && !isActive && (
                        <circle r={NODE_R + 5} fill="none"
                          stroke={meta.color} strokeWidth={0.8}
                          strokeOpacity={0.4} strokeDasharray="2,3"
                        />
                      )}

                      {/* Selection halo */}
                      {isSelected && (
                        <circle r={NODE_R + 5} fill={meta.color} fillOpacity={0.08}
                          stroke={meta.color} strokeWidth={1.5} strokeOpacity={0.7}
                          filter="url(#nodeGlow)"
                        />
                      )}

                      {/* Hover glow */}
                      {isHovered && (
                        <circle r={NODE_R + 3} fill={meta.color} fillOpacity={0.15} />
                      )}

                      {/* Node body */}
                      <circle
                        r={NODE_R}
                        fill={meta.color}
                        fillOpacity={isActive ? 0.55 : isTypeActive ? 0.35 : 0.20}
                        stroke={meta.color}
                        strokeWidth={isSelected ? 2 : 1.5}
                        strokeOpacity={isActive ? 1 : isTypeActive ? 0.8 : 0.65}
                        style={{ transition: 'fill-opacity 0.2s ease' }}
                      />

                      {/* Contested dot */}
                      {m.contested && (
                        <circle r={2.5} cx={NODE_R - 1} cy={-NODE_R + 1}
                          fill="#b8960c" stroke="#0a0d12" strokeWidth={0.5}
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* ── Layer 5: Tooltip ─────────────────────────────── */}
          {tooltip && (
            <g transform={`translate(${tooltip.x},${tooltip.y})`} pointerEvents="none">
              <rect x={0} y={0} width={200} height={50} rx={4}
                fill="#0f1117" stroke="#2a3550" strokeWidth={1} opacity={0.96}
              />
              <text x={10} y={18} fill="#d4c9a8" fontSize={11} fontWeight={500}
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {tooltip.milestone.title.length > 26
                  ? tooltip.milestone.title.slice(0, 26) + '…'
                  : tooltip.milestone.title}
              </text>
              <text x={10} y={34} fill="#8a7d65" fontSize={9.5}
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {tooltip.civ.name} · {formatYear(tooltip.milestone.date)}
                {tooltip.milestone.contested ? '  ⚠ contested' : ''}
              </text>
              {activeType && (
                <text x={10} y={46} fill={TYPE_META[activeType]?.color || '#888'} fontSize={8.5}
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  Thread: {TYPE_META[activeType]?.label}
                </text>
              )}
            </g>
          )}
        </svg>

        {/* Kinship thread legend strip */}
        <div className="flex items-center flex-wrap gap-x-5 gap-y-1 px-4 py-2.5 border-t border-coal-700 text-xs text-parchment-500">
          <span className="text-parchment-500 flex-shrink-0">
            Threads connect the same innovation across civilizations —
            hover any node or thread to illuminate its lineage.
          </span>
          <span className="flex items-center gap-1.5 flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="2.5" fill="#b8960c"/></svg>
            contested date
          </span>
        </div>
      </div>
    </div>
  );
}

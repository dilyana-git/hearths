import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import {
  TIME_DOMAIN, TYPE_META, ERAS, AXIS_COLORS,
  formatYear, getNodeTier,
} from '../utils/constants';

// ─── Layout constants ────────────────────────────────────────────────────────
const TRACK_H   = 48;
const TRACK_GAP = 5;
const ERA_H     = 30;   // colored era annotation band
const AXIS_H    = 38;   // tick-mark row
const TOP_H     = ERA_H + AXIS_H;   // 68 px total header
const NODE_R    = 7;
const SVG_W     = 2640;

// ─── Non-linear (piecewise-linear) time scale ────────────────────────────────
// Zone 1  –13 000 → –9 500  :  very compressed  (sparse prehistory)
// Zone 2  –9 500 → –1 000   :  expanded          (the divergence story)
// Zone 3  –1 000 → +1 500   :  moderate          (post-classical ramp-down)
const BREAKS = [
  { year: -13000, x: 36   },
  { year:  -9500, x: 208  },
  { year:  -1000, x: 2200 },
  { year:   1500, x: 2600 },
];

function xFromYear(year) {
  const y = Math.max(TIME_DOMAIN[0], Math.min(TIME_DOMAIN[1], year));
  for (let i = 0; i < BREAKS.length - 1; i++) {
    const a = BREAKS[i], b = BREAKS[i + 1];
    if (y >= a.year && y <= b.year) {
      return a.x + ((y - a.year) / (b.year - a.year)) * (b.x - a.x);
    }
  }
  return year < TIME_DOMAIN[0] ? BREAKS[0].x : BREAKS[BREAKS.length - 1].x;
}

function yearFromX(x) {
  const cx = Math.max(BREAKS[0].x, Math.min(BREAKS[BREAKS.length - 1].x, x));
  for (let i = 0; i < BREAKS.length - 1; i++) {
    const a = BREAKS[i], b = BREAKS[i + 1];
    if (cx >= a.x && cx <= b.x) {
      return Math.round(a.year + ((cx - a.x) / (b.x - a.x)) * (b.year - a.year));
    }
  }
  return x < BREAKS[0].x ? TIME_DOMAIN[0] : TIME_DOMAIN[1];
}

// Scrubber progress 0–1 in the control bar
const SCRUB_X0 = BREAKS[0].x;
const SCRUB_XN = BREAKS[BREAKS.length - 1].x;
function scrubPct(year) { return (xFromYear(year) - SCRUB_X0) / (SCRUB_XN - SCRUB_X0); }

// ─── Tick definitions ────────────────────────────────────────────────────────
const MAJOR_TICKS = [-12000, -10000, -9500, -8000, -6000, -4000, -2000, -1000, 0, 500, 1500];
const MINOR_TICKS = [-11000, -9000, -7000, -5000, -3000, -1500, 250, 1000];

// ─── Node rendering by tier ──────────────────────────────────────────────────
function NodeShape({ color, tier, active, typeActive, selected }) {
  const baseOpacity    = selected ? 0.70 : active ? 0.55 : typeActive ? 0.30 : 0.18;
  const strokeOpacity  = selected ? 1    : active ? 0.95 : typeActive ? 0.80 : 0.60;
  const strokeW        = selected ? 2    : 1.5;

  switch (tier) {
    case 'ring':
      return (
        <circle r={NODE_R}
          fill="none"
          stroke={color} strokeWidth={strokeW} strokeOpacity={strokeOpacity}
        />
      );
    case 'double':
      return (
        <>
          <circle r={NODE_R + 4}
            fill="none"
            stroke={color} strokeWidth={0.8}
            strokeOpacity={strokeOpacity * 0.45}
          />
          <circle r={NODE_R - 1}
            fill={color} fillOpacity={baseOpacity}
            stroke={color} strokeWidth={strokeW} strokeOpacity={strokeOpacity}
          />
        </>
      );
    default: // 'filled'
      return (
        <circle r={NODE_R}
          fill={color} fillOpacity={baseOpacity}
          stroke={color} strokeWidth={strokeW} strokeOpacity={strokeOpacity}
        />
      );
  }
}

// ─── Layout helpers ──────────────────────────────────────────────────────────
function sortCivs(civs, sortBy) {
  const c = [...civs];
  if (sortBy === 'region') return c.sort((a, b) => a.region.localeCompare(b.region));
  if (sortBy === 'axis')   return c.sort((a, b) => a.axisContext.localeCompare(b.axisContext));
  return c.sort((a, b) => a.sortOrder - b.sortOrder);
}

function computeLayout(milestones) {
  const sorted = [...milestones].sort((a, b) => a.date - b.date);
  const center = TRACK_H / 2;
  const yOpts  = [0, -9, +9, -14, +14];
  const placed = [];
  return sorted.map(m => {
    const x = xFromYear(m.date);
    let yOff = 0;
    for (const dy of yOpts) {
      const y = center + dy;
      if (y - NODE_R < 3 || y + NODE_R > TRACK_H - 3) continue;
      if (!placed.some(p => Math.abs(p.x - x) < NODE_R * 2 + 2 && Math.abs(p.dy - dy) < NODE_R * 2 + 2)) {
        yOff = dy; break;
      }
    }
    placed.push({ x, dy: yOff, id: m.id });
    return { ...m, yOff };
  });
}

const catmullRomLine = d3.line().x(p => p.x).y(p => p.y).curve(d3.curveCatmullRom.alpha(0.5));

// ─── Component ───────────────────────────────────────────────────────────────
export default function ThreadsView({ data, selectedMilestone, hoveredMilestone, onSelect, onHover, sortBy }) {
  const scrollRef    = useRef(null);
  const svgRef       = useRef(null);
  const playRef      = useRef(null);

  const [tooltip,      setTooltip]      = useState(null);
  const [hoveredType,  setHoveredType]  = useState(null);
  const [scrubberYear, setScrubberYear] = useState(TIME_DOMAIN[0]);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [isDragging,   setIsDragging]   = useState(false);

  const sortedCivs = useMemo(
    () => sortCivs(data.civilizations, sortBy),
    [data.civilizations, sortBy],
  );

  const layoutByCiv = useMemo(() => {
    const m = {};
    sortedCivs.forEach(c => { m[c.id] = computeLayout(data.milestonesByCiv[c.id] || []); });
    return m;
  }, [sortedCivs, data.milestonesByCiv]);

  // Per-type Catmull-Rom thread points (sorted chronologically)
  const typeThreads = useMemo(() => {
    const map = {};
    sortedCivs.forEach((civ, i) => {
      const cy = TOP_H + i * (TRACK_H + TRACK_GAP) + TRACK_H / 2;
      (layoutByCiv[civ.id] || []).forEach(m => {
        if (!map[m.type]) map[m.type] = [];
        map[m.type].push({ x: xFromYear(m.date), y: cy + m.yOff, date: m.date, id: m.id });
      });
    });
    Object.values(map).forEach(pts => pts.sort((a, b) => a.date - b.date));
    return map;
  }, [sortedCivs, layoutByCiv]);

  const totalH     = TOP_H + sortedCivs.length * (TRACK_H + TRACK_GAP) + 20;
  const activeType = hoveredType || hoveredMilestone?.type || selectedMilestone?.type;

  // ── Play animation (advances 4 SVG-px per 40 ms → visually uniform speed) ──
  useEffect(() => {
    if (!isPlaying) { clearInterval(playRef.current); return; }
    playRef.current = setInterval(() => {
      setScrubberYear(prev => {
        const nx = xFromYear(prev) + 4;
        if (nx >= SCRUB_XN) { setIsPlaying(false); return TIME_DOMAIN[1]; }
        return Math.round(yearFromX(nx));
      });
    }, 40);
    return () => clearInterval(playRef.current);
  }, [isPlaying]);

  // ── Auto-scroll to keep scrubber visible during play ─────────────────────
  useEffect(() => {
    if (!scrollRef.current) return;
    const sx  = xFromYear(scrubberYear);
    const el  = scrollRef.current;
    const W   = el.clientWidth;
    if (sx > el.scrollLeft + W * 0.72) el.scrollLeft = sx - W * 0.4;
  }, [scrubberYear]);

  // ── Scrubber drag ─────────────────────────────────────────────────────────
  const startScrubDrag = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    setIsPlaying(false);
    const move = (ev) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const rawX = (ev.clientX ?? ev.touches?.[0]?.clientX ?? 0) - rect.left;
      setScrubberYear(yearFromX(rawX));
    };
    const up = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
  }, []);

  // ── Click on SVG to jump scrubber ────────────────────────────────────────
  const handleSvgClick = useCallback((e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    if (rawX > BREAKS[0].x && rawX < BREAKS[BREAKS.length - 1].x) {
      setScrubberYear(yearFromX(rawX));
    }
  }, []);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const handleNodeEnter = useCallback((e, milestone, civ) => {
    const rect = e.currentTarget.closest('svg').getBoundingClientRect();
    setTooltip({
      x: Math.min(e.clientX - rect.left + 14, SVG_W - 218),
      y: e.clientY - rect.top  - 54,
      milestone, civ,
    });
    onHover(milestone);
    setHoveredType(milestone.type);
  }, [onHover]);

  const handleNodeLeave = useCallback(() => {
    setTooltip(null);
    onHover(null);
    setHoveredType(null);
  }, [onHover]);

  const scrubX = xFromYear(scrubberYear);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Left labels panel ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-shrink-0 relative bg-coal-900" style={{ width: 180 }}>
          {/* right-edge fade */}
          <div className="absolute right-0 top-0 bottom-0 w-6 pointer-events-none z-10"
            style={{ background: 'linear-gradient(to right, transparent, #0a0d12)' }} />

          {/* spacer matching SVG header */}
          <div style={{ height: TOP_H }}
            className="flex items-end pb-2 pl-4 border-b border-coal-800">
            <span className="uppercase tracking-widest text-parchment-500"
              style={{ fontSize: 8.5 }}>Cultural Hearth</span>
          </div>

          {sortedCivs.map((civ, i) => (
            <div key={civ.id}
              className="flex flex-col justify-center pl-4 pr-5"
              style={{ height: TRACK_H + TRACK_GAP }}>
              <div className="absolute left-0"
                style={{
                  top:    TOP_H + i * (TRACK_H + TRACK_GAP) + 14,
                  height: TRACK_H - 28,
                  width:  2.5,
                  backgroundColor: civ.color,
                  opacity: 0.55,
                  borderRadius: 2,
                }} />
              <span className="serif font-medium leading-tight"
                style={{ color: civ.color, fontSize: 12.5 }}>
                {civ.name}
              </span>
              <span className="mt-0.5"
                style={{ fontSize: 12, letterSpacing: '0.02em', color: '#8a7d65' }}>
                {civ.region.split('(')[0].trim()}
              </span>
            </div>
          ))}
        </div>

        {/* ── Scrollable SVG ────────────────────────────────────────────────── */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden">
          <svg
            ref={svgRef}
            width={SVG_W}
            height={totalH}
            style={{ display: 'block', userSelect: 'none' }}
            onClick={handleSvgClick}
            onMouseLeave={handleNodeLeave}
          >
            <defs>
              <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="threadGlow" x="-5%" y="-40%" width="110%" height="180%">
                <feGaussianBlur stdDeviation="3" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="originGlow" x="-150%" y="-150%" width="400%" height="400%">
                <feGaussianBlur stdDeviation="6" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              {/* Clip path for the era band */}
              <clipPath id="eraBandClip">
                <rect x={0} y={0} width={SVG_W} height={ERA_H} />
              </clipPath>
            </defs>

            {/* ── Layer 0: Era annotation band ─────────────────────────────── */}
            <g clipPath="url(#eraBandClip)">
              {ERAS.map((era, i) => {
                const x1  = xFromYear(era.start);
                const x2  = xFromYear(Math.min(era.end, TIME_DOMAIN[1]));
                const mid = (x1 + x2) / 2;
                const fills = ['#0f1620','#111a28','#0e1520','#111825','#0f1620'];
                return (
                  <g key={era.label}>
                    <rect x={x1} y={0} width={x2 - x1} height={ERA_H} fill={fills[i]} />
                    {/* separator */}
                    {i > 0 && (
                      <line x1={x1} y1={0} x2={x1} y2={ERA_H}
                        stroke="#1e2840" strokeWidth={0.8} />
                    )}
                    {/* era name */}
                    <text x={mid} y={13} textAnchor="middle"
                      fill="#7a8aaa" fontSize={9.5} letterSpacing={0.8} fontWeight={500}
                      style={{ fontFamily: 'Inter, system-ui, sans-serif', textTransform: 'uppercase' }}>
                      {era.label}
                    </text>
                    {/* sublabel (only if zone is wide enough) */}
                    {(x2 - x1) > 260 && (
                      <text x={mid} y={25} textAnchor="middle"
                        fill="#3a4560" fontSize={7.5} letterSpacing={0.2}
                        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                        {era.sublabel.length > 60 ? era.sublabel.slice(0, 58) + '…' : era.sublabel}
                      </text>
                    )}
                  </g>
                );
              })}
              {/* bottom border of era band */}
              <line x1={0} y1={ERA_H} x2={SVG_W} y2={ERA_H}
                stroke="#1e2840" strokeWidth={1} />
            </g>

            {/* ── Layer 1: Tick axis ────────────────────────────────────────── */}
            <g>
              {/* Vertical tick-grid lines (extend full height, very faint) */}
              {MAJOR_TICKS.map(yr => (
                <line key={yr}
                  x1={xFromYear(yr)} y1={TOP_H}
                  x2={xFromYear(yr)} y2={totalH}
                  stroke="#1a2235" strokeWidth={0.5} strokeDasharray="2,8"
                />
              ))}

              {/* Major ticks + labels */}
              {MAJOR_TICKS.map(yr => {
                const x = xFromYear(yr);
                return (
                  <g key={yr}>
                    <line x1={x} y1={ERA_H + 2} x2={x} y2={TOP_H}
                      stroke="#3a4560" strokeWidth={1} />
                    <text x={x} y={ERA_H + 14} textAnchor="middle"
                      fill="#6a7890" fontSize={9.5}
                      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {formatYear(yr)}
                    </text>
                  </g>
                );
              })}

              {/* Minor ticks */}
              {MINOR_TICKS.map(yr => (
                <line key={yr}
                  x1={xFromYear(yr)} y1={TOP_H - 7} x2={xFromYear(yr)} y2={TOP_H}
                  stroke="#2a3550" strokeWidth={0.8} />
              ))}

              {/* Scale compression boundary annotation at -9500 BCE */}
              {(() => {
                const bx = xFromYear(-9500);
                return (
                  <g>
                    <line x1={bx} y1={ERA_H + 2} x2={bx} y2={TOP_H}
                      stroke="#b8960c" strokeWidth={1.5} strokeOpacity={0.45}
                    />
                    <text x={bx - 8} y={ERA_H + AXIS_H - 4} textAnchor="end"
                      fill="#b8960c" fontSize={8.5} opacity={0.65}
                      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                      Pleistocene compressed
                    </text>
                    <text x={bx + 8} y={ERA_H + AXIS_H - 4} textAnchor="start"
                      fill="#b8960c" fontSize={8.5} opacity={0.65}
                      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                      Holocene expanded
                    </text>
                  </g>
                );
              })()}

              {/* Axis baseline */}
              <line x1={0} y1={TOP_H} x2={SVG_W} y2={TOP_H}
                stroke="#2a3550" strokeWidth={0.8} />
            </g>

            {/* ── Layer 2: Era background tints (track area) ───────────────── */}
            {ERAS.map((era, i) => {
              const x1 = xFromYear(era.start);
              const x2 = xFromYear(Math.min(era.end, TIME_DOMAIN[1]));
              return (
                <rect key={era.label}
                  x={x1} y={TOP_H} width={x2 - x1} height={totalH - TOP_H}
                  fill={i % 2 === 0 ? 'rgba(255,255,255,0.009)' : 'rgba(0,0,0,0.035)'}
                />
              );
            })}

            {/* ── Layer 3: Kinship threads ─────────────────────────────────── */}
            {Object.entries(typeThreads).map(([type, points]) => {
              if (points.length < 2) return null;
              const meta    = TYPE_META[type]; if (!meta) return null;
              const isActive = activeType === type;
              const path    = catmullRomLine(points);
              if (!path) return null;
              return (
                <g key={type}>
                  {isActive && (
                    <path d={path} fill="none"
                      stroke={meta.color} strokeWidth={10} strokeOpacity={0.055}
                      strokeLinecap="round" filter="url(#threadGlow)"
                    />
                  )}
                  <path d={path} fill="none"
                    stroke={meta.color}
                    strokeWidth={isActive ? 1.8 : 0.85}
                    strokeOpacity={isActive ? 0.62 : 0.09}
                    strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray={isActive ? 'none' : '3,10'}
                    style={{ cursor: 'crosshair', transition: 'stroke-opacity 0.2s, stroke-width 0.2s' }}
                    onMouseEnter={() => setHoveredType(type)}
                    onMouseLeave={() => !hoveredMilestone && setHoveredType(null)}
                  />
                  {isActive && points.map((pt, pi) => (
                    <circle key={pi} cx={pt.x} cy={pt.y} r={2.5}
                      fill={meta.color} fillOpacity={0.55} pointerEvents="none" />
                  ))}
                  {/* Thread identity label at start of active thread */}
                  {isActive && points.length > 0 && (
                    <g transform={`translate(${Math.max(48, points[0].x)},${TOP_H + 12})`} pointerEvents="none">
                      <rect x={-44} y={-11} width={88} height={16}
                        rx={3} fill="#0d1119" stroke={meta.color} strokeWidth={0.6} strokeOpacity={0.45}
                      />
                      <text textAnchor="middle" y={3}
                        fill={meta.color} fontSize={9.5} fontWeight={500}
                        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                        {meta.label} lineage
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* ── Layer 4: Track backgrounds & baselines ───────────────────── */}
            {sortedCivs.map((civ, i) => {
              const ty  = TOP_H + i * (TRACK_H + TRACK_GAP);
              const mid = ty + TRACK_H / 2;
              return (
                <g key={civ.id}>
                  <rect x={0} y={ty} width={SVG_W} height={TRACK_H}
                    fill={civ.color} fillOpacity={0.022} />
                  <line x1={0} y1={mid} x2={SVG_W} y2={mid}
                    stroke={civ.color} strokeOpacity={0.10}
                    strokeWidth={0.7} strokeDasharray="1,12" />
                </g>
              );
            })}

            {/* ── Layer 5: Origin cluster ───────────────────────────────────── */}
            {(() => {
              const ox  = BREAKS[0].x;
              const oy  = TOP_H + sortedCivs.length * (TRACK_H + TRACK_GAP) / 2;
              return (
                <g transform={`translate(${ox},${oy})`}>
                  {/* Radiating stubs toward each track */}
                  {sortedCivs.map((civ, i) => {
                    const dy = (i - (sortedCivs.length - 1) / 2) * (TRACK_H + TRACK_GAP);
                    return (
                      <line key={civ.id}
                        x1={0} y1={0} x2={14} y2={dy}
                        stroke={civ.color} strokeWidth={0.7} strokeOpacity={0.22}
                      />
                    );
                  })}
                  {/* Glow */}
                  <circle r={16} fill="#d4c9a8" fillOpacity={0.04} filter="url(#originGlow)" />
                  {/* Ring */}
                  <circle r={9} fill="#0a0d12"
                    stroke="#8a7d65" strokeWidth={1.5} strokeOpacity={0.7} />
                  {/* Core */}
                  <circle r={4} fill="#b8a882" fillOpacity={0.8} />
                  {/* Label — contrasted, slightly larger */}
                  <text x={-14} y={-16} textAnchor="end"
                    fill="#d4c9a8" fontSize={12} fontWeight={500}
                    filter="url(#originGlow)"
                    style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                    Common Origin
                  </text>
                  <text x={-14} y={-3} textAnchor="end"
                    fill="#8a7d65" fontSize={8.5}
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                    ~300 000 BP · anatomically modern humans
                  </text>
                </g>
              );
            })()}

            {/* ── Layer 6: Milestone nodes ──────────────────────────────────── */}
            {sortedCivs.map((civ, i) => {
              const ty = TOP_H + i * (TRACK_H + TRACK_GAP);
              return (
                <g key={civ.id}>
                  {(layoutByCiv[civ.id] || []).map(m => {
                    const x          = xFromYear(m.date);
                    const cy         = ty + TRACK_H / 2 + m.yOff;
                    const meta       = TYPE_META[m.type] || { color: '#888', tier: 'filled' };
                    const tier       = getNodeTier(m.type);
                    const isSelected = selectedMilestone?.id === m.id;
                    const isHovered  = hoveredMilestone?.id === m.id;
                    const isActive   = isSelected || isHovered;
                    const isTypeAct  = activeType === m.type;

                    return (
                      <g key={m.id}
                        transform={`translate(${x},${cy})`}
                        onClick={e => { e.stopPropagation(); onSelect(m); }}
                        onMouseEnter={e => handleNodeEnter(e, m, civ)}
                        tabIndex={0} role="button"
                        aria-label={`${m.title}, ${formatYear(m.date)}, ${civ.name}`}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(m); }}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Type-active dashed resonance ring */}
                        {isTypeAct && !isActive && (
                          <circle r={NODE_R + 5} fill="none"
                            stroke={meta.color} strokeWidth={0.7}
                            strokeOpacity={0.38} strokeDasharray="2,3"
                          />
                        )}
                        {/* Selection halo */}
                        {isSelected && (
                          <circle r={NODE_R + 6} fill={meta.color} fillOpacity={0.07}
                            stroke={meta.color} strokeWidth={1.5} strokeOpacity={0.65}
                            filter="url(#nodeGlow)"
                          />
                        )}
                        {/* Hover glow */}
                        {isHovered && (
                          <circle r={NODE_R + 4} fill={meta.color} fillOpacity={0.12} />
                        )}
                        {/* Tiered node shape */}
                        <NodeShape
                          color={meta.color} tier={tier}
                          active={isActive} typeActive={isTypeAct} selected={isSelected}
                        />
                        {/* Contested badge */}
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

            {/* ── Layer 7: Scrubber ─────────────────────────────────────────── */}
            {(() => {
              const sx = scrubX;
              const showLabels = scrubberYear > TIME_DOMAIN[0] + 300;
              return (
                <g>
                  {/* Scrubber full-height line */}
                  <line x1={sx} y1={ERA_H} x2={sx} y2={totalH}
                    stroke="#d4c9a8" strokeWidth={0.8} strokeOpacity={0.28}
                    strokeDasharray="3,5" pointerEvents="none"
                  />
                  {/* Draggable handle — visual only, no pointer events */}
                  <rect
                    x={sx - 7} y={ERA_H + 2}
                    width={14} height={AXIS_H - 4}
                    rx={4}
                    fill="#161b26"
                    stroke="#8a7d65" strokeWidth={1} strokeOpacity={0.7}
                    pointerEvents="none"
                  />
                  {/* Transparent 44×44 hit area centered on the visible thumb */}
                  <rect
                    x={sx - 22}
                    y={ERA_H + 2 + (AXIS_H - 4) / 2 - 22}
                    width={44} height={44}
                    fill="transparent"
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                    onMouseDown={startScrubDrag}
                    onTouchStart={startScrubDrag}
                  />
                  {/* Year label on handle */}
                  <text x={sx} y={ERA_H + AXIS_H / 2 + 4}
                    textAnchor="middle" fill="#d4c9a8" fontSize={7.5} pointerEvents="none"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {formatYear(scrubberYear).replace(' BCE','').replace(' CE','')}
                  </text>

                  {/* Floating civ labels at scrubber position */}
                  {showLabels && sortedCivs.map((civ, i) => {
                    const trackCY  = TOP_H + i * (TRACK_H + TRACK_GAP) + TRACK_H / 2;
                    const achieved = (layoutByCiv[civ.id] || [])
                      .filter(m => m.date <= scrubberYear).length;
                    const label    = civ.name.split(' ')[0];
                    return (
                      <g key={civ.id}
                        transform={`translate(${sx + 10},${trackCY})`}
                        pointerEvents="none">
                        {/* Connector dot */}
                        <circle r={2} cx={-4} cy={0}
                          fill={civ.color} fillOpacity={0.6} />
                        {/* Name + count */}
                        <text x={3} y={4}
                          fill={civ.color} fontSize={9} opacity={0.82}
                          fontWeight={500}
                          style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                          {label}
                          {achieved > 0 ? ` ·${achieved}` : ''}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}

            {/* ── Layer 8: Tooltip ─────────────────────────────────────────── */}
            {tooltip && (() => {
              const m    = tooltip.milestone;
              const meta = TYPE_META[m.type] || { color: '#888', label: m.type };
              return (
                <g transform={`translate(${tooltip.x},${tooltip.y})`} pointerEvents="none">
                  <rect x={0} y={0} width={210} height={56}
                    rx={4} fill="#0f1117" stroke="#2a3550" strokeWidth={1} opacity={0.97}
                  />
                  <text x={10} y={17} fill="#d4c9a8" fontSize={11} fontWeight={500}
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {m.title.length > 27 ? m.title.slice(0, 27) + '…' : m.title}
                  </text>
                  <text x={10} y={32} fill="#8a7d65" fontSize={9.5}
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {tooltip.civ.name} · {formatYear(m.date)}
                    {m.contested ? '  ⚠' : ''}
                  </text>
                  <text x={10} y={47} fontSize={9}
                    fill={meta.color} opacity={0.85}
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {meta.label}{activeType === m.type ? ' — thread active' : ''}
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* ── Scrubber control bar ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 border-t border-coal-700 bg-coal-950"
        style={{ height: 48 }}>

        {/* Play / Pause */}
        <button
          onClick={() => {
            if (scrubberYear >= TIME_DOMAIN[1]) setScrubberYear(TIME_DOMAIN[0]);
            setIsPlaying(p => !p);
          }}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded
            border border-teal-800 bg-coal-800 text-teal-400
            hover:bg-teal-900 hover:text-teal-200 transition-colors text-xs"
          aria-label={isPlaying ? 'Pause' : 'Play timeline animation'}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Year display */}
        <span className="flex-shrink-0 serif text-sm text-parchment-200 w-24 text-right">
          {formatYear(scrubberYear)}
        </span>

        {/* Scrubber track — outer div is 44px tall (touch target); inner strip is visual */}
        <div
          className="flex-1 relative flex items-center cursor-pointer"
          style={{ minHeight: 44 }}
          onClick={e => {
            const r   = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - r.left) / r.width;
            setScrubberYear(Math.round(yearFromX(SCRUB_X0 + pct * (SCRUB_XN - SCRUB_X0))));
          }}
        >
          {/* Visual track — thin strip centered within the touch target */}
          <div className="relative w-full h-4 rounded"
            style={{ background: '#0f1117', border: '1px solid #1e2840' }}>
            {/* Era segments */}
            {ERAS.map((era, i) => {
              const p0 = scrubPct(era.start);
              const p1 = scrubPct(Math.min(era.end, TIME_DOMAIN[1]));
              return (
                <div key={era.label}
                  className="absolute top-0 bottom-0 text-center overflow-hidden"
                  style={{
                    left:  `${p0 * 100}%`,
                    width: `${(p1 - p0) * 100}%`,
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.025)',
                    borderLeft: i > 0 ? '1px solid #1e2840' : 'none',
                  }}
                />
              );
            })}
            {/* Progress fill */}
            <div className="absolute top-0 left-0 bottom-0 rounded"
              style={{
                width: `${scrubPct(scrubberYear) * 100}%`,
                background: 'linear-gradient(to right, rgba(0,168,150,0.22), rgba(0,168,150,0.06))',
                transition: isPlaying ? 'none' : 'width 0.1s',
              }}
            />
            {/* Position needle */}
            <div className="absolute top-0 bottom-0 w-px"
              style={{
                left: `${scrubPct(scrubberYear) * 100}%`,
                background: '#d4c9a8',
                opacity: 0.55,
              }}
            />
          </div>
        </div>

        {/* End year */}
        <span className="flex-shrink-0 text-xs text-parchment-500 w-14">
          1500 CE
        </span>
      </div>

      {/* Reading hint */}
      <div className="flex-shrink-0 flex items-center justify-center px-4 py-1.5 border-t border-coal-800 bg-coal-950">
        <p className="text-[9px] text-parchment-700 italic text-center">
          Ring = foundational · Filled = emerging complexity · Double ring = peak complexity &nbsp;·&nbsp; Click any dot to inspect · Hover type labels to thread
        </p>
      </div>

    </div>
  );
}

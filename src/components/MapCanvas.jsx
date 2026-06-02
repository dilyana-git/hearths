import React, { useMemo, useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import worldTopology from 'world-atlas/countries-110m.json';
import { TECH_FAMILIES, STAGE_META, TYPE_META } from '../utils/constants';

const PROJ_SCALE = 155;
const MAP_W = 960;
const MAP_H = 500;

function useProjection(width, height) {
  return useMemo(() => {
    return d3.geoNaturalEarth1()
      .scale(PROJ_SCALE * (width / MAP_W))
      .translate([width / 2, height / 2]);
  }, [width, height]);
}

function useDimensions(ref) {
  const [dims, setDims] = useState({ width: MAP_W, height: MAP_H });
  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver(entries => {
      const e = entries[0];
      if (e) {
        const w = e.contentRect.width;
        setDims({ width: w, height: Math.round(w * (MAP_H / MAP_W)) });
      }
    });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return dims;
}

function makeArcPath(proj, from, to, numPoints = 64) {
  const interp = d3.geoInterpolate(from, to);
  const points = d3.range(numPoints + 1).map(i => interp(i / numPoints));
  const projected = points.map(p => proj(p)).filter(Boolean);
  if (projected.length < 2) return '';
  return 'M ' + projected.map(p => p.join(',')).join(' L ');
}

function approxPathLength(path) {
  const nums = path.match(/[\d.]+,[\d.]+/g) || [];
  let len = 0;
  for (let i = 1; i < nums.length; i++) {
    const [x1, y1] = nums[i - 1].split(',').map(Number);
    const [x2, y2] = nums[i].split(',').map(Number);
    len += Math.hypot(x2 - x1, y2 - y1);
  }
  return len;
}

function getCurrentStage(civ, year) {
  if (!civ.stages || !civ.stages.length) return 'foraging';
  let stage = civ.stages[0].stage;
  for (const s of civ.stages) {
    if (s.fromDate <= year) stage = s.stage;
    else break;
  }
  return stage;
}

const TECH_ORDER = ['foot-river', 'farming-wave', 'wheel-caravan', 'bronze-trade', 'iron-maritime', 'sail-monsoon'];
const STAGE_LEGEND = [
  { key: 'incipient-cultivation', label: 'Incipient Cultivation' },
  { key: 'established-farming',   label: 'Established Farming' },
  { key: 'towns-chiefdoms',       label: 'Towns / Chiefdoms' },
  { key: 'cities-states',         label: 'Cities / States' },
];

export default function MapCanvas({
  data, selectedYear, selectedCivId, selectedConnectionId, selectedMilestoneId,
  onCivSelect, onConnectionSelect, onMilestoneSelect, onBgClick,
}) {
  const containerRef = useRef(null);
  const dims = useDimensions(containerRef);
  const proj = useProjection(dims.width, dims.height);
  const pathGen = useMemo(() => d3.geoPath(proj), [proj]);
  const { land, borders } = useMemo(() => ({
    land: topojson.feature(worldTopology, worldTopology.objects.land),
    borders: topojson.mesh(worldTopology, worldTopology.objects.countries, (a, b) => a !== b),
  }), []);

  const landPath = useMemo(() => pathGen(land) || '', [pathGen, land]);
  const bordersPath = useMemo(() => pathGen(borders) || '', [pathGen, borders]);

  const hearths = useMemo(() => data.civilizations.map(civ => {
    const pt = proj([civ.hearth.lng, civ.hearth.lat]);
    return pt ? { ...civ, px: pt[0], py: pt[1] } : null;
  }).filter(Boolean), [data.civilizations, proj]);

  const allConnectionPaths = useMemo(() => {
    return data.diffusionEvents.map(ev => {
      const fromCiv = data.civById[ev.fromId];
      if (!fromCiv) return null;
      const from = [fromCiv.hearth.lng, fromCiv.hearth.lat];
      const to = [ev.toRegion.lng, ev.toRegion.lat];
      const dPath = makeArcPath(proj, from, to);
      const length = approxPathLength(dPath);
      const tech = TECH_FAMILIES[ev.enablingTech] || TECH_FAMILIES['foot-river'];
      return { ...ev, dPath, length, fromCiv, tech };
    }).filter(Boolean);
  }, [data, proj]);  // NOT selectedYear — paths don't change when year changes

  const activeConnections = useMemo(() => {
    return allConnectionPaths.filter(conn =>
      (conn.fromDate != null ? conn.fromDate <= selectedYear : conn.approxDate <= selectedYear) &&
      (conn.toDate == null || conn.toDate >= selectedYear)
    );
  }, [allConnectionPaths, selectedYear]);  // just filter, no path computation

  const visibleConnections = selectedCivId
    ? activeConnections.filter(c => c.fromId === selectedCivId)
    : activeConnections;

  const scale = dims.width / MAP_W;
  const glowR = 88 * scale;

  // Legend geometry
  const LEG_TOP = dims.height - 124;
  const LEG_W = 268;
  const LEG_H = 116;

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden" onClick={onBgClick}>
      <svg
        width={dims.width}
        height={dims.height}
        style={{ display: 'block' }}
        aria-label="World atlas showing cultural hearths and technology-typed connections"
      >
        <defs>
          <radialGradient id="mc-ocean" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0d1620" />
            <stop offset="100%" stopColor="#080c12" />
          </radialGradient>
          <radialGradient id="mc-vig" cx="50%" cy="50%" r="70%">
            <stop offset="55%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(7,10,15,0.7)" />
          </radialGradient>
          <filter id="mc-hearthGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="mc-arcGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="mc-stageBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          {hearths.map(h => {
            const stage = getCurrentStage(h, selectedYear);
            const meta = STAGE_META[stage];
            return (
              <radialGradient key={`sg-${h.id}`} id={`sg-${h.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={meta.color} stopOpacity={meta.glowOpacity * 2.5} />
                <stop offset="100%" stopColor={meta.color} stopOpacity="0" />
              </radialGradient>
            );
          })}
        </defs>

        {/* Ocean */}
        <rect width={dims.width} height={dims.height} fill="url(#mc-ocean)" />

        {/* Graticule */}
        <path
          d={pathGen(d3.geoGraticule()()) || ''}
          fill="none" stroke="#1a2235" strokeWidth={0.4} opacity={0.6}
        />

        {/* Land */}
        <path d={landPath} fill="#151e2d" stroke="#253045" strokeWidth={0.6} />

        {/* Country borders */}
        <path d={bordersPath} fill="none" stroke="#1a2840" strokeWidth={0.3} />

        {/* Stage tints */}
        {hearths.map(h => {
          const stage = getCurrentStage(h, selectedYear);
          const meta = STAGE_META[stage];
          if (meta.glowOpacity === 0) return null;
          return (
            <circle
              key={`st-${h.id}`}
              cx={h.px} cy={h.py}
              r={glowR}
              fill={`url(#sg-${h.id})`}
              filter="url(#mc-stageBlur)"
              pointerEvents="none"
            />
          );
        })}

        {/* Tech-typed connections */}
        {visibleConnections.map((conn, i) => {
          const isSelected = conn.id === selectedConnectionId;
          const { tech } = conn;
          const delay = i * 0.10;
          const duration = 1.5 + i * 0.08;
          const toPt = proj([conn.toRegion.lng, conn.toRegion.lat]);

          return (
            <g
              key={conn.id}
              onClick={e => { e.stopPropagation(); onConnectionSelect(conn.id); }}
              style={{ cursor: 'pointer' }}
            >
              {/* Glow + dash track */}
              <path
                d={conn.dPath}
                fill="none"
                stroke={tech.color}
                strokeWidth={isSelected ? 5 : 2.5}
                strokeOpacity={isSelected ? 0.28 : 0.13}
                strokeDasharray={tech.dash !== 'none' ? tech.dash : undefined}
                filter="url(#mc-arcGlow)"
              />
              {/* Animated draw arc */}
              <path
                d={conn.dPath}
                fill="none"
                stroke={tech.color}
                strokeWidth={isSelected ? 2.5 : 1.5}
                strokeOpacity={isSelected ? 0.9 : 0.6}
                strokeDasharray={`${conn.length} ${conn.length}`}
                strokeDashoffset={conn.length}
                strokeLinecap="round"
                style={{
                  animation: `arcDraw ${duration}s cubic-bezier(0.4,0,0.2,1) ${delay}s forwards`,
                  '--arc-length': conn.length,
                }}
              />
              {toPt && (
                <circle
                  cx={toPt[0]} cy={toPt[1]} r={isSelected ? 4 : 2.5}
                  fill={tech.color} fillOpacity={0.7}
                  stroke={tech.color} strokeWidth={0.5}
                  pointerEvents="none"
                />
              )}
            </g>
          );
        })}

        {/* Milestone markers */}
        {hearths.map(h => {
          const ms = (data.milestonesByCiv[h.id] || []).filter(m => m.date <= selectedYear);
          if (!ms.length) return null;
          const recent = ms.slice(-8);
          const mr = (18 * scale) + 8;
          return (
            <g key={`mm-${h.id}`}>
              {recent.map((m, idx) => {
                const angle = (idx / recent.length) * 2 * Math.PI - Math.PI / 2;
                const mx = h.px + mr * Math.cos(angle);
                const my = h.py + mr * Math.sin(angle);
                const meta = TYPE_META[m.type] || { color: '#8a7d65', tier: 'filled' };
                const isSel = m.id === selectedMilestoneId;
                const r = isSel ? 5 : 3.5;

                if (meta.tier === 'ring') {
                  return (
                    <circle key={m.id} cx={mx} cy={my} r={r}
                      fill="none" stroke={meta.color}
                      strokeWidth={1.2} strokeOpacity={0.75}
                      style={{ cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); onMilestoneSelect(m.id); }}
                    />
                  );
                }
                if (meta.tier === 'double') {
                  return (
                    <g key={m.id}
                      style={{ cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); onMilestoneSelect(m.id); }}
                    >
                      <circle cx={mx} cy={my} r={r + 2.5}
                        fill="none" stroke={meta.color}
                        strokeWidth={0.7} strokeOpacity={0.4} />
                      <circle cx={mx} cy={my} r={r}
                        fill={meta.color} fillOpacity={0.3}
                        stroke={meta.color} strokeWidth={1} />
                    </g>
                  );
                }
                return (
                  <circle key={m.id} cx={mx} cy={my} r={r}
                    fill={meta.color} fillOpacity={0.38}
                    stroke={meta.color} strokeWidth={1.2}
                    style={{ cursor: 'pointer' }}
                    onClick={e => { e.stopPropagation(); onMilestoneSelect(m.id); }}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Cultural hearths */}
        {hearths.map(h => {
          const isActive = h.id === selectedCivId;
          const color = h.color;
          return (
            <g
              key={h.id}
              onClick={e => { e.stopPropagation(); onCivSelect(h.id); }}
              style={{ cursor: 'pointer' }}
              role="button"
              aria-label={`Cultural hearth: ${h.name}`}
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onCivSelect(h.id); } }}
            >
              <circle cx={h.px} cy={h.py} r={isActive ? 20 : 14}
                fill={color} fillOpacity={isActive ? 0.13 : 0.07}
                filter="url(#mc-hearthGlow)" />
              <circle cx={h.px} cy={h.py} r={isActive ? 10 : 7}
                fill="none" stroke={color}
                strokeWidth={isActive ? 1.5 : 1}
                strokeOpacity={isActive ? 0.75 : 0.45} />
              <circle cx={h.px} cy={h.py} r={isActive ? 5 : 3.5}
                fill={color} fillOpacity={isActive ? 0.9 : 0.65} />
              <text
                x={h.px} y={h.py - (isActive ? 14 : 11)}
                textAnchor="middle"
                fill={color}
                fontSize={isActive ? 11 : 9}
                fontWeight={isActive ? 600 : 400}
                style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', pointerEvents: 'none' }}
                opacity={isActive ? 1 : 0.78}
              >
                {h.name}
              </text>
            </g>
          );
        })}

        {/* Vignette */}
        <rect width={dims.width} height={dims.height}
          fill="url(#mc-vig)" pointerEvents="none" />

        {/* On-canvas legend */}
        <g transform={`translate(12, ${LEG_TOP})`} pointerEvents="none">
          <rect x={0} y={0} width={LEG_W} height={LEG_H}
            fill="rgba(8,12,18,0.82)" rx={3} />

          {/* Connection type column */}
          <text x={10} y={13} fill="#5c5245" fontSize={7}
            fontFamily="sans-serif" fontWeight={600} letterSpacing="0.7">
            CONNECTION TYPE
          </text>
          {TECH_ORDER.map((key, i) => {
            const tech = TECH_FAMILIES[key];
            return (
              <g key={key} transform={`translate(10, ${22 + i * 14})`}>
                <line x1={0} y1={4} x2={22} y2={4}
                  stroke={tech.color} strokeWidth={1.5}
                  strokeDasharray={tech.dash !== 'none' ? tech.dash : undefined}
                  strokeOpacity={0.85} />
                <text x={28} y={8} fill="#8a7d65" fontSize={7} fontFamily="sans-serif">
                  {tech.label}
                </text>
              </g>
            );
          })}

          {/* Development stage column */}
          <text x={144} y={13} fill="#5c5245" fontSize={7}
            fontFamily="sans-serif" fontWeight={600} letterSpacing="0.7">
            DEVELOPMENT STAGE
          </text>
          {STAGE_LEGEND.map(({ key, label }, i) => {
            const meta = STAGE_META[key];
            return (
              <g key={key} transform={`translate(144, ${22 + i * 14})`}>
                <rect x={0} y={0} width={9} height={8}
                  fill={meta.color} rx={1}
                  stroke={meta.color} strokeWidth={0.5} strokeOpacity={0.6} />
                <text x={14} y={8} fill="#8a7d65" fontSize={7} fontFamily="sans-serif">
                  {label}
                </text>
              </g>
            );
          })}
        </g>

        {/* Helper text */}
        <text
          x={dims.width / 2}
          y={dims.height - 7}
          textAnchor="middle"
          fill="#3a3028"
          fontSize={9}
          fontFamily="Cormorant Garamond, Georgia, serif"
          fontStyle="italic"
          pointerEvents="none"
        >
          Each glow is a region of innovation; each line is contact between cultures, shaped by the technology of the age.
        </text>
      </svg>
    </div>
  );
}

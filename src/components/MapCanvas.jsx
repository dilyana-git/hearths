import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import worldTopology from 'world-atlas/countries-110m.json';
import { TECH_FAMILIES, STAGE_META, TYPE_META, ERA_PALETTES, DEFAULT_PALETTE, formatYear } from '../utils/constants';

// ── Inline map tooltip (Portal) ───────────────────────────────────────────────

const BOX = {
  position: 'fixed',
  width: 272,
  background: 'rgba(7,10,15,0.97)',
  border: '1px solid #2a3550',
  borderRadius: 6,
  backdropFilter: 'blur(8px)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.75)',
  zIndex: 60,
};
const DIVIDER = { borderTop: '1px solid #1a2235', marginTop: 7, paddingTop: 7 };
const TITLE_STYLE = {
  fontFamily: 'Cormorant Garamond, Georgia, serif',
  fontSize: 14, fontWeight: 500,
  color: '#c8b49a', margin: '4px 0 3px', lineHeight: 1.3,
};
const BODY_STYLE = { fontSize: 10, color: '#7a7060', lineHeight: 1.55, margin: 0 };
const META_STYLE = { fontSize: 9, color: '#4e4840', margin: '0 0 1px' };

function MapTooltip({ popup, data, selectedYear, onClose, onExpand }) {
  if (!popup) return null;

  // Smart flip: avoid viewport edges
  const W = 272, H_EST = 180;
  let left = popup.x + 16;
  let top  = popup.y - 12;
  if (left + W  > window.innerWidth  - 12) left = popup.x - W - 16;
  if (top  + H_EST > window.innerHeight - 12) top  = popup.y - H_EST - 12;
  if (top < 8) top = 8;

  return createPortal(
    <div style={{ ...BOX, left, top }} onClick={e => e.stopPropagation()}>
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute', top: 7, right: 9,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#5a5248', fontSize: 15, lineHeight: 1, padding: 0,
        }}
      >×</button>

      {popup.type === 'milestone' && (() => {
        const m = popup.item;
        const meta = TYPE_META[m.type] || {};
        const civ  = data.civById[m.civilizationId];
        return (
          <div style={{ padding: '10px 28px 13px 13px' }}>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 4 }}>
              <span style={{
                fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: meta.color || '#8a7d65',
                background: (meta.color || '#8a7d65') + '22',
                border: `1px solid ${(meta.color || '#8a7d65')}44`,
                padding: '1px 5px', borderRadius: 3,
              }}>{meta.label || m.type}</span>
              {m.contested && <span style={{ fontSize: 8, color: '#c4a840' }}>contested</span>}
            </div>
            <p style={TITLE_STYLE}>{m.title}</p>
            <p style={META_STYLE}>{formatYear(m.date)}{civ ? ` · ${civ.name}` : ''}</p>
            {m.causalExplanation && (
              <p style={{ ...BODY_STYLE, ...DIVIDER }}>
                {m.causalExplanation.length > 180
                  ? m.causalExplanation.slice(0, 180) + '…'
                  : m.causalExplanation}
              </p>
            )}
          </div>
        );
      })()}

      {popup.type === 'connection' && (() => {
        const conn = popup.item;
        const tech = TECH_FAMILIES[conn.enablingTech] || TECH_FAMILIES['foot-river'];
        const title = conn.innovation || conn.flows?.[0] || conn.id;
        const fromCiv = data.civById[conn.fromId];
        const fromLabel = fromCiv?.name || conn.fromRegion || '';
        const toLabel = typeof conn.toRegion === 'object' ? conn.toRegion?.name : (conn.toRegion || '');
        return (
          <div style={{ padding: '10px 28px 13px 13px' }}>
            <span style={{
              fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: tech.color, background: tech.color + '22',
              border: `1px solid ${tech.color}44`,
              padding: '1px 5px', borderRadius: 3,
            }}>{tech.label}</span>
            <p style={TITLE_STYLE}>{title}</p>
            <p style={META_STYLE}>{fromLabel} → {toLabel}</p>
            {(conn.fromDate || conn.toDate) && (
              <p style={{ ...META_STYLE, marginBottom: 2 }}>
                {conn.fromDate ? formatYear(conn.fromDate) : '?'}
                {' – '}
                {conn.toDate ? formatYear(conn.toDate) : 'ongoing'}
              </p>
            )}
            {conn.narrative && (
              <p style={{ ...BODY_STYLE, ...DIVIDER }}>
                {conn.narrative.length > 180
                  ? conn.narrative.slice(0, 180) + '…'
                  : conn.narrative}
              </p>
            )}
          </div>
        );
      })()}

      {popup.type === 'civ' && (() => {
        const h = popup.item;
        const stage = getCurrentStage(h, selectedYear);
        const stageMeta = STAGE_META[stage] || STAGE_META['foraging'];
        return (
          <div style={{ padding: '10px 28px 13px 13px' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: h.color, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: 8.5, color: '#7a7060', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {stageMeta.label}
              </span>
            </div>
            <p style={{ ...TITLE_STYLE, fontSize: 15 }}>{h.name}</p>
            {h.region && <p style={META_STYLE}>{h.region}</p>}
            {h.summary && (
              <p style={{ ...BODY_STYLE, ...DIVIDER }}>
                {h.summary.length > 180 ? h.summary.slice(0, 180) + '…' : h.summary}
              </p>
            )}
          </div>
        );
      })()}

      {onExpand && (
        <div style={{ padding: '0 13px 11px' }}>
          <button
            onClick={() => onExpand(popup.type, popup.item)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, fontSize: 10, color: '#7a9e8e', letterSpacing: '0.04em',
            }}
          >
            Read more →
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}

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

// Deterministic per-milestone placement around its hearth, so pulses don't stack
function hashId(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// How long (in years) an event pulse stays visible after its date passes
const PULSE_WINDOW = 700;

export default function MapCanvas({
  data, selectedYear, era, selectedCivId, selectedConnectionId, selectedMilestoneId,
  onCivSelect, onConnectionSelect, onMilestoneSelect, onBgClick, onExpand,
}) {
  const containerRef = useRef(null);
  const dims = useDimensions(containerRef);
  const [hoveredConnId, setHoveredConnId] = useState(null);
  const [popup, setPopup] = useState(null); // { type, item, x, y } — viewport coords

  const openPopup = (type, item, e) => {
    e.stopPropagation();
    setPopup(prev => (prev?.item?.id === item.id ? null : { type, item, x: e.clientX, y: e.clientY }));
  };
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
    const results = [];

    // diffusionEvents — original schema (fromId + toRegion object)
    data.diffusionEvents.forEach(ev => {
      const fromCiv = data.civById[ev.fromId];
      if (!fromCiv) return;
      const from = [fromCiv.hearth.lng, fromCiv.hearth.lat];
      const to = [ev.toRegion.lng, ev.toRegion.lat];
      const dPath = makeArcPath(proj, from, to);
      const length = approxPathLength(dPath);
      const tech = TECH_FAMILIES[ev.enablingTech] || TECH_FAMILIES['foot-river'];
      const toPt = proj(to);
      const interp = d3.geoInterpolate(from, to);
      const midPt = proj(interp(0.5));
      results.push({ ...ev, dPath, length, fromCiv, tech, toPt, midPt, _fromCivId: ev.fromId });
    });

    // rich connections — new schema: coords stored as [lat, lng], D3 needs [lng, lat]
    (data.connections || []).forEach(conn => {
      const from = [conn.fromCoords[1], conn.fromCoords[0]];
      const to   = [conn.toCoords[1],   conn.toCoords[0]];
      const dPath = makeArcPath(proj, from, to);
      const length = approxPathLength(dPath);
      const tech = TECH_FAMILIES[conn.enablingTech] || TECH_FAMILIES['foot-river'];
      const toPt = proj(to);
      const interp = d3.geoInterpolate(from, to);
      const midPt = proj(interp(0.5));
      results.push({ ...conn, dPath, length, tech, toPt, midPt, _fromCivId: conn.fromRegion });
    });

    return results;
  }, [data, proj]);  // NOT selectedYear — paths don't change when year changes

  const activeConnections = useMemo(() => {
    return allConnectionPaths.filter(conn =>
      (conn.fromDate != null ? conn.fromDate <= selectedYear : conn.approxDate <= selectedYear) &&
      (conn.toDate == null || conn.toDate >= selectedYear)
    );
  }, [allConnectionPaths, selectedYear]);  // just filter, no path computation

  const visibleConnections = selectedCivId
    ? activeConnections.filter(c => c._fromCivId === selectedCivId)
    : activeConnections;

  const scale = dims.width / MAP_W;
  const glowR = 88 * scale;
  const palette = ERA_PALETTES[era?.id] || DEFAULT_PALETTE;

  // Event pulses: milestones whose date was crossed within the trailing window.
  // The map shows what is happening *now*, not everything that ever happened.
  const pulses = useMemo(() => {
    const out = [];
    hearths.forEach(h => {
      (data.milestonesByCiv[h.id] || []).forEach(m => {
        const age = selectedYear - m.date;
        if (age < 0 || age > PULSE_WINDOW) return;
        const hash = hashId(m.id);
        const angle = (hash % 360) * Math.PI / 180;
        const rad = (22 + (hash >> 3) % 18) * Math.max(scale, 0.7);
        out.push({
          m, civ: h,
          x: h.px + rad * Math.cos(angle),
          y: h.py + rad * Math.sin(angle),
          t: age / PULSE_WINDOW,
        });
      });
    });
    // Freshest first — they get the captions
    out.sort((a, b) => b.m.date - a.m.date);
    return out;
  }, [hearths, data.milestonesByCiv, selectedYear, scale]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden" onClick={() => { onBgClick(); setPopup(null); }}>
      <svg
        width={dims.width}
        height={dims.height}
        style={{ display: 'block' }}
        aria-label="World atlas showing cultural hearths and technology-typed connections"
      >
        <defs>
          <radialGradient id="mc-ocean" cx="50%" cy="50%" r="70%">
            <stop offset="0%" style={{ stopColor: palette.oceanIn, transition: 'stop-color 1.4s ease' }} />
            <stop offset="100%" style={{ stopColor: palette.oceanOut, transition: 'stop-color 1.4s ease' }} />
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
          <filter id="mc-textHalo" x="-15%" y="-40%" width="130%" height="180%" colorInterpolationFilters="sRGB">
            <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="expanded" />
            <feFlood floodColor="#080c12" floodOpacity="0.88" result="bg" />
            <feComposite in="bg" in2="expanded" operator="in" result="halo" />
            <feMerge>
              <feMergeNode in="halo" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
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
          fill="none" stroke="#1a2235" strokeWidth={0.5} opacity={0.75}
        />

        {/* Land — tinted by the current era's palette */}
        <path
          d={landPath}
          strokeWidth={0.6}
          style={{ fill: palette.land, stroke: palette.landStroke, transition: 'fill 1.4s ease, stroke 1.4s ease' }}
        />

        {/* Country borders */}
        <path d={bordersPath} fill="none" stroke="#1a2840" strokeWidth={0.3} opacity={0.5} />

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
          const isHovered = conn.id === hoveredConnId;
          const isDimmed = hoveredConnId != null && !isHovered && !isSelected;
          const { tech, toPt } = conn;
          const delay = i * 0.10;
          const duration = 1.5 + i * 0.08;
          const baseOpacity = isSelected ? 0.9 : isHovered ? 0.95 : isDimmed ? 0.12 : 0.72;
          const glowOpacity = isSelected ? 0.30 : isHovered ? 0.35 : isDimmed ? 0.04 : 0.15;

          return (
            <g
              key={conn.id}
              onClick={e => { openPopup('connection', conn, e); onConnectionSelect(conn.id); }}
              onMouseEnter={() => setHoveredConnId(conn.id)}
              onMouseLeave={() => setHoveredConnId(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Glow + dash track */}
              <path
                d={conn.dPath}
                fill="none"
                stroke={tech.color}
                strokeWidth={isSelected || isHovered ? 5 : 2.5}
                strokeOpacity={glowOpacity}
                strokeDasharray={tech.dash !== 'none' ? tech.dash : undefined}
                filter="url(#mc-arcGlow)"
              />
              {/* Animated draw arc */}
              <path
                d={conn.dPath}
                fill="none"
                stroke={tech.color}
                strokeWidth={isSelected || isHovered ? 2.5 : 1.5}
                strokeOpacity={baseOpacity}
                strokeDasharray={`${conn.length} ${conn.length}`}
                strokeDashoffset={conn.length}
                strokeLinecap="round"
                style={{
                  animation: `arcDraw ${duration}s cubic-bezier(0.4,0,0.2,1) ${delay}s forwards`,
                  '--arc-length': conn.length,
                  transition: 'stroke-opacity 0.15s ease',
                }}
              />
              {/* Contested uncertainty stripe */}
              {conn.contested && (
                <path
                  d={conn.dPath}
                  fill="none"
                  stroke="#c4a840"
                  strokeWidth={1}
                  strokeOpacity={isDimmed ? 0.08 : 0.28}
                  strokeDasharray="2,10"
                  pointerEvents="none"
                />
              )}
              {toPt && (
                <circle
                  cx={toPt[0]} cy={toPt[1]} r={isSelected || isHovered ? 4 : 2.5}
                  fill={tech.color} fillOpacity={isDimmed ? 0.15 : 0.7}
                  stroke={tech.color} strokeWidth={0.5}
                  pointerEvents="none"
                />
              )}
              {/* Arc label at midpoint — progressive disclosure: only on hover/select */}
              {conn.midPt && (isSelected || isHovered) && (
                <text
                  x={conn.midPt[0]}
                  y={conn.midPt[1] - 6}
                  textAnchor="middle"
                  fill={tech.color}
                  fontSize={9}
                  fontFamily="sans-serif"
                  fontWeight={600}
                  opacity={0.92}
                  filter="url(#mc-textHalo)"
                  pointerEvents="none"
                  style={{ letterSpacing: '0.04em' }}
                >
                  {tech.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Event pulses — milestones bloom at their location as time crosses them, then fade.
            The map shows what is happening now; full histories live in the detail overlay. */}
        {pulses.map(({ m, x, y, t }, idx) => {
          const meta = TYPE_META[m.type] || {};
          const color = meta.color || '#8a7d65';
          const fade = 1 - t;
          const isSel = m.id === selectedMilestoneId;
          return (
            <g
              key={m.id}
              onClick={e => { openPopup('milestone', m, e); onMilestoneSelect(m.id); }}
              style={{ cursor: 'pointer' }}
            >
              {/* Expanding ripple */}
              <circle
                cx={x} cy={y}
                r={5 + t * 24}
                fill="none" stroke={color} strokeWidth={1}
                opacity={fade * 0.32}
                pointerEvents="none"
              />
              {/* Core dot */}
              <circle
                cx={x} cy={y}
                r={isSel ? 5 : 3.2}
                fill={color} fillOpacity={0.25 + fade * 0.55}
                stroke={color} strokeWidth={1} strokeOpacity={0.35 + fade * 0.55}
                strokeDasharray={m.contested ? '2,2' : undefined}
              />
              {/* Caption for the freshest few events */}
              {idx < 7 && (
                <text
                  x={x + 9} y={y + 3}
                  fill={color}
                  fontSize={8.5}
                  fontFamily="sans-serif"
                  opacity={Math.min(1, fade * 1.5) * 0.88}
                  filter="url(#mc-textHalo)"
                  pointerEvents="none"
                  style={{ letterSpacing: '0.02em' }}
                >
                  {m.title}
                </text>
              )}
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
              onClick={e => { openPopup('civ', h, e); onCivSelect(h.id); }}
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
                x={h.px} y={h.py - (isActive ? 18 : 15)}
                textAnchor="middle"
                fill={color}
                fontSize={isActive ? 14 : 11}
                fontWeight={isActive ? 600 : 400}
                filter="url(#mc-textHalo)"
                style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', pointerEvents: 'none' }}
                opacity={isActive ? 1 : 0.85}
              >
                {h.name}
              </text>
            </g>
          );
        })}

        {/* Vignette */}
        <rect width={dims.width} height={dims.height}
          fill="url(#mc-vig)" pointerEvents="none" />
      </svg>

      <MapTooltip
        popup={popup}
        data={data}
        selectedYear={selectedYear}
        onClose={() => setPopup(null)}
        onExpand={onExpand ? (type, item) => { setPopup(null); onExpand(type, item); } : null}
      />
    </div>
  );
}

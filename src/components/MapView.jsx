import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import worldTopology from 'world-atlas/countries-110m.json';
import { TYPE_META, AXIS_COLORS, AXIS_LABELS, formatYear } from '../utils/constants';

const PROJ_SCALE = 155;
const MAP_W = 960;
const MAP_H = 500;

function useProjection(width, height) {
  return useMemo(() => {
    const proj = d3.geoNaturalEarth1()
      .scale(PROJ_SCALE * (width / MAP_W))
      .translate([width / 2, height / 2]);
    return proj;
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

// Create a great-circle arc path string between two [lng,lat] points
function makeArcPath(proj, from, to, numPoints = 64) {
  const interp = d3.geoInterpolate(from, to);
  const points = d3.range(numPoints + 1).map(i => interp(i / numPoints));
  const projected = points.map(p => proj(p)).filter(Boolean);
  if (projected.length < 2) return '';
  return 'M ' + projected.map(p => p.join(',')).join(' L ');
}

// Approximate SVG path length for animation
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

const STRENGTH_OPACITY = { strong: 0.75, moderate: 0.45, weak: 0.22 };
const STRENGTH_DASH = { strong: 'none', moderate: '6,4', weak: '3,5' };

export default function MapView({ data, selectedMilestone, hoveredMilestone, onSelect, onHover }) {
  const containerRef = useRef(null);
  const dims = useDimensions(containerRef);
  const proj = useProjection(dims.width, dims.height);
  const pathGen = useMemo(() => d3.geoPath(proj), [proj]);

  const [selectedCivId, setSelectedCivId] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  // World geometry
  const { land, borders } = useMemo(() => ({
    land: topojson.feature(worldTopology, worldTopology.objects.land),
    borders: topojson.mesh(worldTopology, worldTopology.objects.countries, (a, b) => a !== b),
  }), []);

  const landPath = useMemo(() => pathGen(land) || '', [pathGen, land]);
  const bordersPath = useMemo(() => pathGen(borders) || '', [pathGen, borders]);

  // Project cultural hearths
  const hearths = useMemo(() => data.civilizations.map(civ => {
    const coords = [civ.hearth.lng, civ.hearth.lat];
    const pt = proj(coords);
    return pt ? { ...civ, px: pt[0], py: pt[1] } : null;
  }).filter(Boolean), [data.civilizations, proj]);

  // Compute diffusion arc paths
  const arcs = useMemo(() => data.diffusionEvents.map(ev => {
    const fromCiv = data.civById[ev.fromId];
    if (!fromCiv) return null;
    const from = [fromCiv.hearth.lng, fromCiv.hearth.lat];
    const to = [ev.toRegion.lng, ev.toRegion.lat];
    const dPath = makeArcPath(proj, from, to);
    const length = approxPathLength(dPath);
    return { ...ev, dPath, length, fromCiv };
  }).filter(ev => ev && ev.dPath), [data, proj]);

  const activeCivId = selectedCivId ||
    (selectedMilestone ? selectedMilestone.civilizationId : null);

  const handleHearth = useCallback((civ, e) => {
    e.stopPropagation();
    setSelectedCivId(prev => prev === civ.id ? null : civ.id);
    setAnimKey(k => k + 1);
  }, []);

  const handleMapClick = useCallback(() => {
    setSelectedCivId(null);
  }, []);

  const activeCiv = activeCivId ? data.civById[activeCivId] : null;
  const activeArcs = activeCivId ? arcs.filter(a => a.fromId === activeCivId) : arcs;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-coal-900">
      {/* Map area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden" onClick={handleMapClick}>
        <svg
          width={dims.width}
          height={dims.height}
          style={{ display: 'block' }}
          aria-label="World map showing cultural hearths and diffusion routes"
        >
          <defs>
            {/* Ocean gradient */}
            <radialGradient id="oceanGrad" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0d1620" />
              <stop offset="100%" stopColor="#080c12" />
            </radialGradient>

            {/* Hearth glow */}
            <filter id="hearthGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Arc glow */}
            <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Vignette */}
            <radialGradient id="vigGrad" cx="50%" cy="50%" r="70%">
              <stop offset="55%" stopColor="transparent" />
              <stop offset="100%" stopColor="rgba(7,10,15,0.7)" />
            </radialGradient>
          </defs>

          {/* Ocean */}
          <rect width={dims.width} height={dims.height} fill="url(#oceanGrad)" />

          {/* Graticule */}
          <path
            d={pathGen(d3.geoGraticule()()) || ''}
            fill="none"
            stroke="#1a2235"
            strokeWidth={0.4}
            opacity={0.6}
          />

          {/* Land masses */}
          <path
            d={landPath}
            fill="#151e2d"
            stroke="#253045"
            strokeWidth={0.6}
          />

          {/* Country borders */}
          <path
            d={bordersPath}
            fill="none"
            stroke="#1a2840"
            strokeWidth={0.3}
          />

          {/* Diffusion arcs */}
          {activeArcs.map((arc, i) => {
            const isHighlighted = arc.fromId === activeCivId;
            const color = arc.fromCiv.color;
            const opacity = STRENGTH_OPACITY[arc.strength] || 0.3;
            const dash = STRENGTH_DASH[arc.strength] || 'none';
            const delay = i * 0.15;
            const duration = 1.8 + i * 0.12;

            return (
              <g key={`${arc.id}-${animKey}`}>
                {/* Glow track */}
                <path
                  d={arc.dPath}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHighlighted ? 4 : 2}
                  strokeOpacity={opacity * 0.3}
                  strokeDasharray={dash}
                  filter="url(#arcGlow)"
                />
                {/* Animated arc */}
                <path
                  d={arc.dPath}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHighlighted ? 2 : 1.2}
                  strokeOpacity={opacity}
                  strokeDasharray={`${arc.length} ${arc.length}`}
                  strokeDashoffset={arc.length}
                  strokeLinecap="round"
                  style={{
                    animation: `arcDraw ${duration}s cubic-bezier(0.4,0,0.2,1) ${delay}s forwards`,
                    '--arc-length': arc.length,
                  }}
                />
                {/* Destination dot */}
                {(() => {
                  const toPt = proj([arc.toRegion.lng, arc.toRegion.lat]);
                  return toPt ? (
                    <circle
                      cx={toPt[0]}
                      cy={toPt[1]}
                      r={3}
                      fill={color}
                      fillOpacity={opacity * 0.8}
                      stroke={color}
                      strokeWidth={0.5}
                    />
                  ) : null;
                })()}
              </g>
            );
          })}

          {/* Cultural hearths */}
          {hearths.map(h => {
            const isActive = h.id === activeCivId;
            const color = h.color;

            return (
              <g
                key={h.id}
                onClick={e => handleHearth(h, e)}
                style={{ cursor: 'pointer' }}
                role="button"
                aria-label={`Cultural hearth: ${h.name}`}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') handleHearth(h, e); }}
              >
                {/* Outer glow ring */}
                <circle
                  cx={h.px}
                  cy={h.py}
                  r={isActive ? 20 : 14}
                  fill={color}
                  fillOpacity={isActive ? 0.12 : 0.06}
                  filter="url(#hearthGlow)"
                />
                {/* Middle ring */}
                <circle
                  cx={h.px}
                  cy={h.py}
                  r={isActive ? 10 : 7}
                  fill="none"
                  stroke={color}
                  strokeWidth={isActive ? 1.5 : 1}
                  strokeOpacity={isActive ? 0.7 : 0.4}
                />
                {/* Core */}
                <circle
                  cx={h.px}
                  cy={h.py}
                  r={isActive ? 5 : 3.5}
                  fill={color}
                  fillOpacity={isActive ? 0.9 : 0.6}
                />
                {/* Label */}
                <text
                  x={h.px}
                  y={h.py - (isActive ? 14 : 11)}
                  textAnchor="middle"
                  fill={color}
                  fontSize={isActive ? 11 : 9}
                  fontWeight={isActive ? 600 : 400}
                  style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', pointerEvents: 'none' }}
                  opacity={isActive ? 1 : 0.75}
                >
                  {h.name}
                </text>
              </g>
            );
          })}

          {/* Vignette overlay */}
          <rect
            width={dims.width}
            height={dims.height}
            fill="url(#vigGrad)"
            pointerEvents="none"
          />
        </svg>

        {/* Active civ info overlay */}
        {activeCiv && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-80 panel rounded-lg p-4 pointer-events-none">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeCiv.color }} />
              <span className="serif text-lg text-parchment-200 font-medium">{activeCiv.name}</span>
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ backgroundColor: AXIS_COLORS[activeCiv.axisContext] + '20', color: AXIS_COLORS[activeCiv.axisContext] }}
              >
                {activeCiv.axisContext.replace('-', '–')}
              </span>
            </div>
            <p className="text-xs text-parchment-400 leading-relaxed">
              {activeCiv.summary.slice(0, 200)}…
            </p>
            <p className="text-xs text-parchment-500 mt-2">
              Showing {activeArcs.length} diffusion arc{activeArcs.length !== 1 ? 's' : ''} from this hearth.
              Click another hearth or the map to change focus.
            </p>
          </div>
        )}

        {!activeCiv && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-parchment-500 pointer-events-none">
            Click a cultural hearth to focus diffusion arcs · Arcs show innovation spread; dashed lines = slower diffusion
          </div>
        )}
      </div>

      {/* Arc legend */}
      <div className="flex-shrink-0 flex items-center gap-6 px-4 py-2 border-t border-coal-700 text-xs text-parchment-500 overflow-x-auto">
        <span className="text-parchment-400 mr-1 flex-shrink-0">Diffusion strength:</span>
        {[
          { label: 'Strong (east–west)', dash: 'none', opacity: 0.75 },
          { label: 'Moderate', dash: '6,4', opacity: 0.55 },
          { label: 'Weak (cross-climate)', dash: '3,5', opacity: 0.35 },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5 flex-shrink-0">
            <svg width="30" height="8" aria-hidden="true">
              <line
                x1="0" y1="4" x2="30" y2="4"
                stroke="#00a896"
                strokeWidth="1.5"
                strokeDasharray={s.dash}
                strokeOpacity={s.opacity}
              />
            </svg>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

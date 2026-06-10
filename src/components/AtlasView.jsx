import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import MapCanvas from './MapCanvas';
import DetailOverlay from './DetailOverlay';
import { ERA_PALETTES, DEFAULT_PALETTE, TYPE_META, formatYear } from '../utils/constants';

const TIME_START = -13000;
const TIME_END = 1500;

const SPEED_OPTIONS = [
  { value: 'slow',   label: 'Slow',   yearsPerSec: 60 },
  { value: 'normal', label: 'Normal', yearsPerSec: 250 },
  { value: 'fast',   label: 'Fast',   yearsPerSec: 800 },
];

function getCurrentEra(year, eras) {
  return eras.find(e => year >= e.start && year < e.end) || eras[eras.length - 1];
}

// Chapter filmstrip scrubber: the nine eras as palette-tinted chapters.
// Drag to scrub, click to glide, ‹ › to jump between pivotal moments.
function AtlasScrubber({ year, onScrub, onJump, playing, onPlayPause, speed, onSpeedChange, data, currentEra, moments, palette }) {
  const stripRef = useRef(null);
  const drag = useRef(null);
  const displayYear = Math.round(year);
  const RANGE = TIME_END - TIME_START;
  const pct = (y) => ((y - TIME_START) / RANGE) * 100;

  const yearFromEvent = (e) => {
    const rect = stripRef.current.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    return Math.round(TIME_START + frac * RANGE);
  };

  const prevMoment = useMemo(
    () => [...moments].reverse().find(m => m.date < displayYear - 80),
    [moments, displayYear]
  );
  const nextMoment = useMemo(
    () => moments.find(m => m.date > displayYear + 80),
    [moments, displayYear]
  );

  return (
    <div className="flex-shrink-0 border-t border-coal-700 bg-coal-900 select-none">
      {/* Year header */}
      <div className="text-center pt-2 pb-1 leading-none">
        <div className="serif text-xl font-medium text-parchment-200 tabular-nums">
          {formatYear(displayYear)}
        </div>
      </div>

      {/* Controls + filmstrip */}
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-1">
        {/* Play/Pause */}
        <button
          onClick={onPlayPause}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-coal-600 text-parchment-400 hover:text-teal-400 hover:border-teal-800 transition-colors"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
              <rect x="0" y="0" width="3.5" height="12" rx="1"/>
              <rect x="6.5" y="0" width="3.5" height="12" rx="1"/>
            </svg>
          ) : (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
              <polygon points="1,0 10,6 1,12"/>
            </svg>
          )}
        </button>

        {/* Speed selector */}
        <select
          value={speed}
          onChange={e => onSpeedChange(e.target.value)}
          className="flex-shrink-0 text-[10px] bg-coal-800 border border-coal-600 text-parchment-500 rounded px-1.5 py-1 focus:outline-none focus:border-teal-700"
          aria-label="Playback speed"
        >
          {SPEED_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Previous / next moment */}
        <div className="flex-shrink-0 flex items-center gap-1">
          <button
            onClick={() => prevMoment && onJump(prevMoment.date + 60)}
            disabled={!prevMoment}
            title={prevMoment ? `${prevMoment.title} · ${formatYear(prevMoment.date)}` : ''}
            aria-label="Previous moment"
            className="w-7 h-7 flex items-center justify-center rounded border border-coal-600 text-parchment-500 hover:text-parchment-200 hover:border-coal-500 disabled:opacity-25 transition-colors"
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
              <polygon points="9,0 3.5,4.5 9,9"/><rect x="0" y="0" width="1.6" height="9"/>
            </svg>
          </button>
          <button
            onClick={() => nextMoment && onJump(nextMoment.date + 60)}
            disabled={!nextMoment}
            title={nextMoment ? `${nextMoment.title} · ${formatYear(nextMoment.date)}` : ''}
            aria-label="Next moment"
            className="w-7 h-7 flex items-center justify-center rounded border border-coal-600 text-parchment-500 hover:text-parchment-200 hover:border-coal-500 disabled:opacity-25 transition-colors"
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
              <polygon points="0,0 5.5,4.5 0,9"/><rect x="7.4" y="0" width="1.6" height="9"/>
            </svg>
          </button>
        </div>

        {/* Era filmstrip */}
        <div
          ref={stripRef}
          className="relative flex-1 rounded-sm overflow-hidden cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-800"
          style={{ height: 46, background: '#0a0e16', border: '1px solid #1e2840', touchAction: 'none' }}
          tabIndex={0}
          role="slider"
          aria-label="Time scrubber — drag to scrub, click to travel"
          aria-valuemin={TIME_START}
          aria-valuemax={TIME_END}
          aria-valuenow={displayYear}
          aria-valuetext={formatYear(displayYear)}
          onPointerDown={e => {
            stripRef.current.setPointerCapture(e.pointerId);
            drag.current = { moved: false };
          }}
          onPointerMove={e => {
            if (!drag.current || e.buttons !== 1) return;
            drag.current.moved = true;
            onScrub(yearFromEvent(e));
          }}
          onPointerUp={e => {
            if (drag.current && !drag.current.moved) onJump(yearFromEvent(e));
            drag.current = null;
          }}
          onKeyDown={e => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); onScrub(Math.max(TIME_START, displayYear - 100)); }
            if (e.key === 'ArrowRight') { e.preventDefault(); onScrub(Math.min(TIME_END, displayYear + 100)); }
          }}
        >
          {/* Era chapters, width proportional to duration, tinted by their palette */}
          {data.eras.map(e2 => {
            const pal = ERA_PALETTES[e2.id] || DEFAULT_PALETTE;
            const active = currentEra.id === e2.id;
            const short = e2.label.split('·')[0].trim();
            return (
              <div
                key={e2.id}
                className="absolute top-0 bottom-0 overflow-hidden"
                title={e2.label}
                style={{
                  left: pct(e2.start) + '%',
                  width: (pct(e2.end) - pct(e2.start)) + '%',
                  background: `linear-gradient(180deg, ${pal.accent}${active ? '38' : '12'} 0%, transparent 85%)`,
                  borderLeft: '1px solid rgba(30,40,64,0.9)',
                  transition: 'background 0.6s ease',
                }}
              >
                <span
                  className="absolute bottom-1 left-1.5 whitespace-nowrap uppercase"
                  style={{
                    fontSize: 8,
                    letterSpacing: '0.08em',
                    color: active ? '#d8cdb0' : '#6a604f',
                    transition: 'color 0.4s ease',
                  }}
                >
                  {short}
                </span>
              </div>
            );
          })}

          {/* Future dimmed */}
          <div
            className="absolute top-0 bottom-0 right-0 pointer-events-none"
            style={{ left: pct(displayYear) + '%', background: 'rgba(5,7,11,0.5)' }}
          />

          {/* Pivotal-moment ticks */}
          {moments.map(m => (
            <div
              key={m.id}
              className="absolute pointer-events-none"
              style={{
                left: `calc(${pct(m.date)}% - 1px)`,
                top: 0, width: 2, height: 5,
                background: TYPE_META[m.type]?.color || '#8a7d65',
                opacity: 0.8,
              }}
            />
          ))}

          {/* Playhead */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: `calc(${pct(displayYear)}% - 1px)`,
              top: 0, bottom: 0, width: 2,
              background: palette.accent,
              boxShadow: `0 0 8px ${palette.accent}99`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Era title card — top-left over the map, re-animates when the era changes
function EraTitleCard({ era, palette }) {
  return (
    <div
      key={era.id}
      className="absolute left-6 top-5 z-10 pointer-events-none era-title-in"
      style={{ maxWidth: 460 }}
    >
      <p
        className="uppercase"
        style={{ color: palette.accent, fontSize: 10, letterSpacing: '0.24em', opacity: 0.9 }}
      >
        {formatYear(era.fromDate)} — {formatYear(era.toDate)}
      </p>
      <h1
        className="serif font-medium"
        style={{ fontSize: 30, color: '#eadfc4', lineHeight: 1.12, marginTop: 4, textShadow: '0 2px 14px rgba(0,0,0,0.85)' }}
      >
        {era.label}
      </h1>
      {era.sublabel && (
        <p className="italic" style={{ fontSize: 11, color: '#8a7d65', marginTop: 5 }}>
          {era.sublabel}
        </p>
      )}
    </div>
  );
}

// Era narrative — documentary-style caption, lower-left over the map
function EraCaption({ era, onMore }) {
  const text = era.narrative || '';
  const short = text.length > 240 ? text.slice(0, 240).replace(/\s+\S*$/, '') + ' …' : text;
  return (
    <div
      key={era.id}
      className="absolute left-6 bottom-5 z-10 era-caption-in"
      style={{ maxWidth: 420, pointerEvents: 'none' }}
    >
      <p
        className="serif"
        style={{ fontSize: 15, lineHeight: 1.6, color: '#c9bda0', textShadow: '0 1px 10px rgba(0,0,0,0.95)' }}
      >
        {short}
      </p>
      <button
        onClick={onMore}
        className="mt-1.5 text-[11px] text-teal-600 hover:text-teal-400 transition-colors"
        style={{ pointerEvents: 'auto' }}
      >
        Read the full era →
      </button>
    </div>
  );
}

function TourOverlay({ tour, onBeat, onClose }) {
  const { beats, beatIndex } = tour;
  const beat = beats[beatIndex];
  if (!beat) return null;
  const isFirst = beatIndex === 0;
  const isLast = beatIndex === beats.length - 1;

  return (
    <div
      className="absolute left-4 bottom-4 z-20 rounded border border-coal-600 flex flex-col overflow-hidden"
      style={{
        width: 320,
        background: 'rgba(8,12,18,0.94)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-0">
        <span className="text-[9px] uppercase tracking-widest text-parchment-700">
          Atlas Tour
        </span>
        <button
          onClick={onClose}
          className="text-parchment-600 hover:text-parchment-400 text-base leading-none transition-colors"
          aria-label="Close tour"
        >
          ×
        </button>
      </div>

      {/* Beat date / label */}
      <div className="px-4 pt-2 pb-1">
        <p className="serif text-sm font-medium text-parchment-200" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
          {beat.label || formatYear(beat.date ?? beat.year)}
        </p>
      </div>

      {/* Narrative */}
      <div className="px-4 pb-3">
        <p className="text-[11px] text-parchment-400 leading-relaxed">
          {beat.narrative}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-coal-700">
        <button
          onClick={() => onBeat(beatIndex - 1)}
          disabled={isFirst}
          className="text-[10px] text-parchment-500 hover:text-parchment-300 disabled:opacity-25 transition-colors"
        >
          ← Previous
        </button>
        <span className="text-[9px] text-parchment-700 tabular-nums">
          {beatIndex + 1} / {beats.length}
        </span>
        {isLast ? (
          <button
            onClick={onClose}
            className="text-[10px] text-teal-500 hover:text-teal-300 transition-colors"
          >
            Finish ✓
          </button>
        ) : (
          <button
            onClick={() => onBeat(beatIndex + 1)}
            className="text-[10px] text-parchment-500 hover:text-parchment-300 transition-colors"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

export default function AtlasView({ data, activeTour, onCloseTour, onTourBeat }) {
  const [selectedYear, setSelectedYear] = useState(-2500);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState('normal');

  const [selectedCivId, setSelectedCivId] = useState(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);
  const [overlay, setOverlay] = useState(null); // { type, item } — full reading page

  // Animation loop
  const rafRef = useRef(null);
  const lastTsRef = useRef(null);
  const speedRef = useRef(speed);
  const playingRef = useRef(false);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  // Eased glide for chapter clicks and moment jumps
  const yearRef = useRef(selectedYear);
  useEffect(() => { yearRef.current = selectedYear; }, [selectedYear]);
  const jumpAnimRef = useRef(null);
  const cancelJump = useCallback(() => {
    if (jumpAnimRef.current) {
      cancelAnimationFrame(jumpAnimRef.current);
      jumpAnimRef.current = null;
    }
  }, []);
  const handleJump = useCallback((target) => {
    setPlaying(false);
    cancelJump();
    const from = yearRef.current;
    if (Math.abs(target - from) < 1) return;
    const start = performance.now();
    const dur = 900;
    const step = (ts) => {
      const t = Math.min(1, (ts - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setSelectedYear(from + (target - from) * eased);
      if (t < 1) jumpAnimRef.current = requestAnimationFrame(step);
      else jumpAnimRef.current = null;
    };
    jumpAnimRef.current = requestAnimationFrame(step);
  }, [cancelJump]);
  useEffect(() => cancelJump, [cancelJump]);

  // Pivotal moments — peak-complexity milestones (writing, cities, states, epidemics)
  const moments = useMemo(
    () => data.milestones
      .filter(m => TYPE_META[m.type]?.tier === 'double')
      .slice()
      .sort((a, b) => a.date - b.date),
    [data]
  );

  const tick = useCallback((ts) => {
    if (!playingRef.current) return;
    if (!lastTsRef.current) lastTsRef.current = ts;
    const dt = Math.min(ts - lastTsRef.current, 150);
    lastTsRef.current = ts;
    const yps = SPEED_OPTIONS.find(s => s.value === speedRef.current)?.yearsPerSec ?? 250;
    setSelectedYear(y => {
      const next = y + yps * dt / 1000;
      if (next >= TIME_END) {
        setPlaying(false);
        playingRef.current = false;
        return TIME_END;
      }
      return next;
    });
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    playingRef.current = playing;
    if (playing) {
      lastTsRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [playing, tick]);

  const handleCivSelect = useCallback((civId) => {
    setSelectedCivId(prev => prev === civId ? null : civId);
    setSelectedConnectionId(null);
    setSelectedMilestoneId(null);
  }, []);

  const handleConnectionSelect = useCallback((connId) => {
    setSelectedConnectionId(prev => prev === connId ? null : connId);
    setSelectedMilestoneId(null);
  }, []);

  const handleMilestoneSelect = useCallback((mId) => {
    setSelectedMilestoneId(prev => prev === mId ? null : mId);
  }, []);

  const handleBgClick = useCallback(() => {
    setSelectedCivId(null);
    setSelectedConnectionId(null);
    setSelectedMilestoneId(null);
  }, []);

  // Sync to tour beat when the tour or beat index changes
  useEffect(() => {
    if (!activeTour) return;
    const beat = activeTour.beats[activeTour.beatIndex];
    if (!beat) return;
    // beats from data.json use `date`; legacy beats used `year`
    setSelectedYear(beat.date ?? beat.year);
    setPlaying(false);
    const { focus } = beat;
    if (focus?.type === 'region') {
      setSelectedCivId(focus.id ?? null);
      setSelectedConnectionId(null);
    } else if (focus?.type === 'connection') {
      setSelectedConnectionId(focus.id ?? null);
      setSelectedCivId(null);
    } else {
      setSelectedCivId(null);
      setSelectedConnectionId(null);
    }
    setSelectedMilestoneId(null);
  }, [activeTour]);

  const handleScrub = useCallback((year) => {
    setPlaying(false);
    cancelJump();
    setSelectedYear(year);
  }, [cancelJump]);

  const handlePlayPause = useCallback(() => {
    cancelJump();
    setPlaying(p => {
      if (!p && selectedYear >= TIME_END) {
        setSelectedYear(TIME_START);
      }
      return !p;
    });
  }, [selectedYear, cancelJump]);

  const currentEra = getCurrentEra(selectedYear, data.eras);
  const palette = ERA_PALETTES[currentEra.id] || DEFAULT_PALETTE;

  const handleExpand = useCallback((type, item) => {
    setOverlay({ type, item });
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-coal-900">
      {/* Full-bleed map with cinematic overlays */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 overflow-hidden min-w-0 relative">
          <EraTitleCard era={currentEra} palette={palette} />
          {!activeTour && (
            <EraCaption
              era={currentEra}
              onMore={() => setOverlay({ type: 'era', item: currentEra })}
            />
          )}
          {activeTour && (
            <TourOverlay
              tour={activeTour}
              onBeat={onTourBeat}
              onClose={onCloseTour}
            />
          )}
          <MapCanvas
            data={data}
            selectedYear={selectedYear}
            era={currentEra}
            selectedCivId={selectedCivId}
            selectedConnectionId={selectedConnectionId}
            selectedMilestoneId={selectedMilestoneId}
            onCivSelect={handleCivSelect}
            onConnectionSelect={handleConnectionSelect}
            onMilestoneSelect={handleMilestoneSelect}
            onBgClick={handleBgClick}
            onExpand={handleExpand}
          />
        </div>
      </div>

      <DetailOverlay
        overlay={overlay}
        data={data}
        selectedYear={selectedYear}
        onClose={() => setOverlay(null)}
        onNavigate={setOverlay}
      />

      <AtlasScrubber
        year={selectedYear}
        onScrub={handleScrub}
        onJump={handleJump}
        playing={playing}
        onPlayPause={handlePlayPause}
        speed={speed}
        onSpeedChange={setSpeed}
        data={data}
        currentEra={currentEra}
        moments={moments}
        palette={palette}
      />
    </div>
  );
}

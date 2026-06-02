import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import MapCanvas from './MapCanvas';
import RightRail from './RightRail';
import { formatYear } from '../utils/constants';

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

// Sparkline path for the scrubber — pre-computes event density
function useSparkline(data) {
  return useMemo(() => {
    const BINS = 160;
    const range = TIME_END - TIME_START;
    const counts = new Array(BINS).fill(0);
    data.milestones.forEach(m => {
      const idx = Math.floor(((m.date - TIME_START) / range) * BINS);
      if (idx >= 0 && idx < BINS) counts[idx]++;
    });
    data.diffusionEvents.forEach(ev => {
      const date = ev.fromDate ?? ev.approxDate;
      if (date == null) return;
      const idx = Math.floor(((date - TIME_START) / range) * BINS);
      if (idx >= 0 && idx < BINS) counts[idx]++;
    });
    const max = Math.max(...counts, 1);
    const pts = counts.map((c, i) => `${(i / BINS) * 100},${20 - (c / max) * 18}`);
    return `M 0,20 L ${pts.join(' L ')} L 100,20 Z`;
  }, [data]);
}

function AtlasScrubber({ year, onScrub, playing, onPlayPause, speed, onSpeedChange, data, currentEra }) {
  const sparkPath = useSparkline(data);
  const displayYear = Math.round(year);

  // Era boundaries as tick positions (%)
  const eraTicks = data.eras.slice(1).map(e => ({
    pct: ((e.start - TIME_START) / (TIME_END - TIME_START)) * 100,
    label: e.label,
  }));

  return (
    <div className="flex-shrink-0 border-t border-coal-700 bg-coal-900 select-none">
      {/* Year + era header */}
      <div className="text-center pt-2 pb-1 leading-none">
        <div className="serif text-xl font-medium text-parchment-200 tabular-nums">
          {formatYear(displayYear)}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-parchment-600 mt-0.5">
          {currentEra.label}
        </div>
      </div>

      {/* Controls + track */}
      <div className="flex items-center gap-3 px-4 pb-3">
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

        {/* Track with sparkline */}
        <div className="flex-1 relative" style={{ height: 44 }}>
          {/* Sparkline SVG */}
          <svg
            className="absolute inset-0 w-full"
            style={{ height: 44, pointerEvents: 'none', zIndex: 1 }}
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
          >
            {/* Era ticks */}
            {eraTicks.map(t => (
              <line key={t.label}
                x1={t.pct} y1={0} x2={t.pct} y2={20}
                stroke="#2a3550" strokeWidth={0.3} />
            ))}
            {/* Density silhouette */}
            <path d={sparkPath} fill="rgba(0,168,150,0.08)" />
            {/* Track line */}
            <line x1={0} y1={14} x2={100} y2={14}
              stroke="#2a3550" strokeWidth={0.5} />
          </svg>

          {/* Range input on top */}
          <input
            type="range"
            min={TIME_START}
            max={TIME_END}
            step={10}
            value={displayYear}
            onChange={e => onScrub(Number(e.target.value))}
            className="atlas-scrubber-track"
            aria-label="Time scrubber"
          />
        </div>

        {/* Date range bookends */}
        <span className="flex-shrink-0 text-[9px] text-parchment-700 tabular-nums">
          {formatYear(TIME_END)}
        </span>
      </div>
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

      {/* Beat label */}
      <div className="px-4 pt-2 pb-1">
        <p className="serif text-sm font-medium text-parchment-200" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
          {beat.label}
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

  // Animation loop
  const rafRef = useRef(null);
  const lastTsRef = useRef(null);
  const speedRef = useRef(speed);
  const playingRef = useRef(false);
  useEffect(() => { speedRef.current = speed; }, [speed]);

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
    setSelectedYear(beat.year);
    setPlaying(false);
    setSelectedConnectionId(beat.focusConnectionId ?? null);
    setSelectedCivId(null);
    setSelectedMilestoneId(null);
  }, [activeTour]);

  const handleScrub = useCallback((year) => {
    setPlaying(false);
    setSelectedYear(year);
  }, []);

  const handlePlayPause = useCallback(() => {
    setPlaying(p => {
      if (!p && selectedYear >= TIME_END) {
        setSelectedYear(TIME_START);
      }
      return !p;
    });
  }, [selectedYear]);

  const currentEra = getCurrentEra(selectedYear, data.eras);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-coal-900">
      {/* Map + right rail */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 overflow-hidden min-w-0 relative">
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
            selectedCivId={selectedCivId}
            selectedConnectionId={selectedConnectionId}
            selectedMilestoneId={selectedMilestoneId}
            onCivSelect={handleCivSelect}
            onConnectionSelect={handleConnectionSelect}
            onMilestoneSelect={handleMilestoneSelect}
            onBgClick={handleBgClick}
          />
        </div>

        <div className="hidden md:flex flex-col flex-shrink-0 border-l border-coal-700 overflow-hidden"
          style={{ width: '22rem' }}>
          <RightRail
            data={data}
            selectedYear={selectedYear}
            currentEra={currentEra}
            selectedCivId={selectedCivId}
            selectedConnectionId={selectedConnectionId}
            selectedMilestoneId={selectedMilestoneId}
            onCivSelect={handleCivSelect}
            onConnectionSelect={handleConnectionSelect}
            onMilestoneSelect={handleMilestoneSelect}
          />
        </div>
      </div>

      <AtlasScrubber
        year={selectedYear}
        onScrub={handleScrub}
        playing={playing}
        onPlayPause={handlePlayPause}
        speed={speed}
        onSpeedChange={setSpeed}
        data={data}
        currentEra={currentEra}
      />
    </div>
  );
}

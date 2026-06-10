import React, { useEffect, useMemo } from 'react';
import { TECH_FAMILIES, STAGE_META, TYPE_META, NODE_TIERS, formatYear } from '../utils/constants';

function getCurrentStage(civ, year) {
  if (!civ.stages || !civ.stages.length) return 'foraging';
  let stage = civ.stages[0].stage;
  for (const s of civ.stages) {
    if (s.fromDate <= year) stage = s.stage;
    else break;
  }
  return stage;
}

function Badge({ color, children }) {
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded uppercase tracking-widest"
      style={{ color, background: color + '1c', border: `1px solid ${color}44` }}
    >
      {children}
    </span>
  );
}

// ── Era reading page ─────────────────────────────────────────────────────────

function EraContent({ era }) {
  return (
    <>
      <p className="text-[11px] uppercase tracking-[0.22em] text-parchment-600">
        {formatYear(era.fromDate)} — {formatYear(era.toDate)}
      </p>
      <h1 className="serif text-4xl text-parchment-100 font-medium leading-tight mt-2">
        {era.label}
      </h1>
      {era.sublabel && (
        <p className="text-sm text-parchment-500 italic mt-2">{era.sublabel}</p>
      )}
      {era.narrative && (
        <p className="serif text-lg text-parchment-300 leading-relaxed mt-8">
          {era.narrative}
        </p>
      )}
    </>
  );
}

// ── Civilization reading page ────────────────────────────────────────────────

function CivContent({ civ, data, selectedYear, onNavigate }) {
  const stage = getCurrentStage(civ, selectedYear);
  const achieved = useMemo(
    () => (data.milestonesByCiv[civ.id] || []).filter(m => m.date <= selectedYear),
    [data.milestonesByCiv, civ.id, selectedYear]
  );
  const byTier = { ring: [], filled: [], double: [] };
  achieved.forEach(m => {
    byTier[TYPE_META[m.type]?.tier || 'filled'].push(m);
  });

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: civ.color }} />
        <Badge color="#c8b49a">{STAGE_META[stage]?.label || stage}</Badge>
      </div>
      <h1 className="serif text-4xl text-parchment-100 font-medium leading-tight mt-3">
        {civ.name}
      </h1>
      {civ.region && <p className="text-sm text-parchment-500 mt-1">{civ.region}</p>}

      {civ.summary && (
        <p className="serif text-lg text-parchment-300 leading-relaxed mt-8">{civ.summary}</p>
      )}

      {achieved.length > 0 && (
        <div className="mt-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-parchment-600 mb-4">
            Achieved by {formatYear(selectedYear)}
          </p>
          {['ring', 'filled', 'double'].map(tier => {
            if (!byTier[tier].length) return null;
            return (
              <div key={tier} className="mb-5">
                <p className="text-[10px] uppercase tracking-widest text-parchment-700 mb-2">
                  {NODE_TIERS[tier].label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {byTier[tier].map(m => {
                    const meta = TYPE_META[m.type] || {};
                    return (
                      <button
                        key={m.id}
                        onClick={() => onNavigate({ type: 'milestone', item: m })}
                        className="text-xs px-2 py-1 rounded transition-colors hover:brightness-125"
                        style={{
                          backgroundColor: (meta.color || '#8a7d65') + '15',
                          color: meta.color || '#8a7d65',
                          border: `1px solid ${meta.color || '#8a7d65'}40`,
                        }}
                      >
                        {m.title} <span className="opacity-60">· {formatYear(m.date)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Connection reading page ──────────────────────────────────────────────────

function ConnectionContent({ conn, data }) {
  const tech = TECH_FAMILIES[conn.enablingTech];
  const fromCiv = data.civById[conn.fromId];
  const title = conn.innovation || conn.flows?.[0] || conn.id;
  const fromLabel = fromCiv?.name || conn.fromRegion || '?';
  const toLabel = (typeof conn.toRegion === 'object' ? conn.toRegion?.name : conn.toRegion) || '?';

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {tech && <Badge color={tech.color}>{tech.label}</Badge>}
        {conn.contested && <Badge color="#c4a840">Contested</Badge>}
      </div>
      <h1 className="serif text-4xl text-parchment-100 font-medium leading-tight mt-3">
        {title}
      </h1>
      <p className="text-sm text-parchment-500 mt-2">
        {fromLabel} → {toLabel}
        {(conn.fromDate || conn.toDate) && (
          <span className="text-parchment-600">
            {' · '}{conn.fromDate ? formatYear(conn.fromDate) : '?'} – {conn.toDate ? formatYear(conn.toDate) : 'ongoing'}
          </span>
        )}
      </p>

      {conn.narrative && (
        <p className="serif text-lg text-parchment-300 leading-relaxed mt-8">{conn.narrative}</p>
      )}
      {conn.description && conn.description !== conn.narrative && (
        <p className="text-sm text-parchment-400 leading-relaxed mt-4">{conn.description}</p>
      )}

      {conn.flows?.length > 0 && (
        <div className="mt-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-parchment-600 mb-2">What moved</p>
          <div className="flex flex-wrap gap-1.5">
            {conn.flows.map(f => (
              <span key={f} className="text-xs px-2 py-1 rounded bg-coal-700 text-parchment-400 border border-coal-600">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {tech && (
        <div className="mt-8 p-4 rounded bg-coal-800 border border-coal-700">
          <p className="text-[10px] uppercase tracking-widest text-parchment-600 mb-1.5">Why this technology</p>
          <p className="text-sm text-parchment-400 leading-relaxed">{tech.description}</p>
        </div>
      )}
    </>
  );
}

// ── Milestone reading page ───────────────────────────────────────────────────

function MilestoneContent({ milestone, data, onNavigate }) {
  const civ = data.civById[milestone.civilizationId];
  const meta = TYPE_META[milestone.type] || {};

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge color={meta.color || '#8a7d65'}>{meta.label || milestone.type}</Badge>
        {milestone.contested && <Badge color="#c4a840">Contested date</Badge>}
      </div>
      <h1 className="serif text-4xl text-parchment-100 font-medium leading-tight mt-3">
        {milestone.title}
      </h1>
      <p className="text-sm text-parchment-500 mt-2">
        {formatYear(milestone.date)}
        {civ && (
          <>
            {' · '}
            <button
              onClick={() => onNavigate({ type: 'civ', item: civ })}
              className="underline decoration-dotted underline-offset-2 hover:text-parchment-300 transition-colors"
            >
              {civ.name}
            </button>
          </>
        )}
      </p>

      {milestone.causalExplanation && (
        <p className="serif text-lg text-parchment-300 leading-relaxed mt-8">
          {milestone.causalExplanation}
        </p>
      )}

      {milestone.caveat && (
        <div className="mt-8 p-4 rounded bg-coal-800 border border-coal-700">
          <p className="text-[10px] uppercase tracking-widest text-parchment-600 mb-1.5">Scholarly caveat</p>
          <p className="text-sm text-parchment-400 leading-relaxed italic">{milestone.caveat}</p>
        </div>
      )}
    </>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function DetailOverlay({ overlay, data, selectedYear, onClose, onNavigate }) {
  useEffect(() => {
    if (!overlay) return;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [overlay, onClose]);

  if (!overlay) return null;
  const { type, item } = overlay;

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto modal-enter"
      style={{ background: 'rgba(5,7,11,0.94)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="min-h-full flex justify-center px-6 py-16" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="w-full max-w-xl relative">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute -top-8 right-0 text-parchment-600 hover:text-parchment-300 text-2xl leading-none transition-colors"
          >
            ×
          </button>

          {type === 'era' && <EraContent era={item} />}
          {type === 'civ' && <CivContent civ={item} data={data} selectedYear={selectedYear} onNavigate={onNavigate} />}
          {type === 'connection' && <ConnectionContent conn={item} data={data} />}
          {type === 'milestone' && <MilestoneContent milestone={item} data={data} onNavigate={onNavigate} />}

          <div className="mt-12 pb-8">
            <button
              onClick={onClose}
              className="text-xs text-parchment-600 hover:text-parchment-400 transition-colors"
            >
              ← back to the atlas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

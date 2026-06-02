import React, { useMemo } from 'react';
import { TECH_FAMILIES, STAGE_META, AXIS_COLORS, TYPE_META, NODE_TIERS, formatYear } from '../utils/constants';

function ImageSlot({ imageUrl, title, prompt }) {
  return (
    <div className="w-full rounded overflow-hidden" style={{ position: 'relative', paddingBottom: '56.25%' }}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title || ''}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 35%, #2e2014 0%, #1a1208 55%, #0d0a06 100%)',
            border: '1px solid #2a2018',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '12px 16px',
          }}
        >
          {title && (
            <span
              className="text-center text-parchment-400 font-medium tracking-widest"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em' }}
            >
              {title}
            </span>
          )}
          <span className="text-parchment-700" style={{ fontSize: 10, letterSpacing: '0.3em' }}>· · ·</span>
          {prompt && (
            <span className="text-center text-[9px] italic text-parchment-700 leading-snug" style={{ maxWidth: '90%', opacity: 0.6 }}>
              {prompt.slice(0, 100)}…
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function StageBadge({ stage }) {
  const meta = STAGE_META[stage] || STAGE_META['foraging'];
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded font-medium"
      style={{
        backgroundColor: meta.color,
        color: '#c8b49a',
        border: '1px solid rgba(200,180,154,0.15)',
      }}
    >
      {meta.label}
    </span>
  );
}

function TechBadge({ techKey }) {
  const tech = TECH_FAMILIES[techKey];
  if (!tech) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded"
      style={{ backgroundColor: tech.color + '22', color: tech.color, border: `1px solid ${tech.color}44` }}
    >
      <svg width="16" height="6" className="flex-shrink-0" aria-hidden="true">
        <line x1={0} y1={3} x2={16} y2={3}
          stroke={tech.color} strokeWidth={1.5}
          strokeDasharray={tech.dash !== 'none' ? tech.dash : undefined} />
      </svg>
      {tech.label}
    </span>
  );
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

// ── Default: era view ──────────────────────────────────────────────────────

function EraView({ data, currentEra, activeConnections }) {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {/* Interaction affordance */}
      <div className="flex flex-col gap-1.5 px-3 py-2.5 rounded bg-coal-800 border border-coal-700 text-[10px] text-parchment-600">
        <p className="text-[9px] uppercase tracking-widest text-parchment-700 font-medium mb-0.5">Explore the atlas</p>
        <p className="flex items-center gap-2"><span className="opacity-60">○</span> Click a <span className="text-parchment-400">glowing region</span> to explore a civilisation</p>
        <p className="flex items-center gap-2"><span className="opacity-60">—</span> Click a <span className="text-parchment-400">connection line</span> for trade &amp; diffusion detail</p>
        <p className="flex items-center gap-2"><span className="opacity-60">·</span> Click a <span className="text-parchment-400">milestone dot</span> for a specific innovation</p>
        <p className="flex items-center gap-2"><span className="opacity-60">▷</span> Press <span className="text-parchment-400">Play</span> or drag the bottom bar to travel through time</p>
      </div>

      <div>
        <p className="text-[9px] uppercase tracking-widest text-parchment-600 mb-1">Current era</p>
        <h2 className="serif text-xl text-parchment-200 font-medium leading-snug">
          {currentEra.label}
        </h2>
        <p className="text-[10px] text-parchment-500 mt-0.5 leading-snug">{currentEra.sublabel}</p>
      </div>

      <ImageSlot title={currentEra.label} prompt={currentEra.heroImagePrompt} imageUrl={currentEra.imageUrl} />

      {currentEra.narrative && (
        <p className="text-xs text-parchment-400 leading-relaxed">{currentEra.narrative}</p>
      )}

      {activeConnections.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-parchment-500 mb-2 font-medium">
            Active connections
          </p>
          <div className="space-y-2">
            {activeConnections.map(conn => {
              const tech = TECH_FAMILIES[conn.enablingTech] || TECH_FAMILIES['foot-river'];
              const fromCiv = data.civById[conn.fromId];
              const label = conn.innovation || conn.flows?.[0] || conn.id;
              const fromLabel = fromCiv?.name || conn.fromRegion || '';
              const toLabel = (typeof conn.toRegion === 'object' ? conn.toRegion?.name : conn.toRegion) || '';
              return (
                <div key={conn.id} className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: tech.color }} />
                  <div>
                    <span className="text-xs text-parchment-300">{label}</span>
                    <span className="text-[10px] text-parchment-500 ml-1">
                      {fromLabel} → {toLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Civilization view ──────────────────────────────────────────────────────

function CivView({ civ, data, selectedYear, activeMilestones, civConnections, onMilestoneSelect, selectedMilestoneId }) {
  const stage = getCurrentStage(civ, selectedYear);

  const byTier = { ring: [], filled: [], double: [] };
  activeMilestones.forEach(m => {
    const tier = TYPE_META[m.type]?.tier || 'filled';
    byTier[tier].push(m);
  });

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: civ.color }} />
        <h2 className="serif text-xl text-parchment-200 font-medium">{civ.name}</h2>
        <StageBadge stage={stage} />
      </div>

      <ImageSlot title={civ.name} prompt={civ.imagePrompt} imageUrl={civ.imageUrl} />

      {civ.summary && (
        <p className="text-xs text-parchment-400 leading-relaxed">{civ.summary.slice(0, 300)}…</p>
      )}

      {activeMilestones.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-parchment-500 mb-2 font-medium">
            Achieved by {formatYear(selectedYear)}
          </p>
          {['ring', 'filled', 'double'].map(tier => {
            if (!byTier[tier].length) return null;
            return (
              <div key={tier} className="mb-2">
                <p className="text-[9px] uppercase tracking-widest text-parchment-600 mb-1">
                  {NODE_TIERS[tier].label}
                </p>
                <div className="flex flex-wrap gap-1">
                  {byTier[tier].map(m => {
                    const meta = TYPE_META[m.type] || {};
                    const isSel = m.id === selectedMilestoneId;
                    return (
                      <button
                        key={m.id}
                        onClick={() => onMilestoneSelect(m.id)}
                        className="text-[10px] px-1.5 py-0.5 rounded transition-colors"
                        style={{
                          backgroundColor: isSel ? meta.color + '33' : meta.color + '15',
                          color: meta.color || '#8a7d65',
                          border: `1px solid ${meta.color || '#8a7d65'}44`,
                        }}
                      >
                        {m.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {civConnections.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-parchment-500 mb-2 font-medium">
            Connections from this hearth
          </p>
          <div className="space-y-1.5">
            {civConnections.map(conn => {
              const tech = TECH_FAMILIES[conn.enablingTech] || TECH_FAMILIES['foot-river'];
              const label = conn.innovation || conn.flows?.[0] || conn.id;
              const toLabel = (typeof conn.toRegion === 'object' ? conn.toRegion?.name : conn.toRegion) || '';
              return (
                <div key={conn.id} className="flex items-center gap-2">
                  <svg width="16" height="6" className="flex-shrink-0" aria-hidden="true">
                    <line x1={0} y1={3} x2={16} y2={3}
                      stroke={tech.color} strokeWidth={1.5}
                      strokeDasharray={tech.dash !== 'none' ? tech.dash : undefined} />
                  </svg>
                  <span className="text-[10px] text-parchment-400">{label}</span>
                  <span className="text-[10px] text-parchment-600">→ {toLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Connection view ────────────────────────────────────────────────────────

function ConnectionView({ conn, data }) {
  const fromCiv = data.civById[conn.fromId];
  // Support both schemas: diffusionEvents have .innovation + .toRegion.name; rich connections have .flows[0] + string .toRegion
  const title = conn.innovation || conn.flows?.[0] || conn.id;
  const fromLabel = fromCiv?.name || conn.fromRegion || '?';
  const toLabel = (typeof conn.toRegion === 'object' ? conn.toRegion?.name : conn.toRegion) || '?';
  const imagePrompt = conn.imagePrompt || TECH_FAMILIES[conn.enablingTech]?.description;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <TechBadge techKey={conn.enablingTech} />
          {conn.contested && (
            <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
              style={{ backgroundColor: '#c4a84022', color: '#c4a840', border: '1px solid #c4a84044' }}>
              Contested
            </span>
          )}
        </div>
        <h2 className="serif text-xl text-parchment-200 font-medium mt-2 leading-snug">
          {title}
        </h2>
        <p className="text-xs text-parchment-500 mt-1">
          {fromLabel} → {toLabel}
        </p>
        {(conn.fromDate || conn.toDate) && (
          <p className="text-[10px] text-parchment-600 mt-0.5">
            {conn.fromDate ? formatYear(conn.fromDate) : '?'}{' – '}
            {conn.toDate ? formatYear(conn.toDate) : 'ongoing'}
          </p>
        )}
      </div>

      <ImageSlot title={title} prompt={imagePrompt} imageUrl={conn.imageUrl} />

      {conn.narrative && (
        <p className="text-xs text-parchment-400 leading-relaxed">{conn.narrative}</p>
      )}

      {conn.description && conn.description !== conn.narrative && (
        <p className="text-xs text-parchment-500 leading-relaxed">{conn.description}</p>
      )}

      {conn.flows?.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-parchment-500 mb-1.5 font-medium">
            What moved
          </p>
          <div className="flex flex-wrap gap-1">
            {conn.flows.map(f => (
              <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-coal-700 text-parchment-400 border border-coal-600">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {TECH_FAMILIES[conn.enablingTech] && (
        <div className="p-3 rounded bg-coal-800 border border-coal-700">
          <p className="text-[9px] uppercase tracking-widest text-parchment-600 mb-1">Why this technology</p>
          <p className="text-[10px] text-parchment-500 leading-snug">
            {TECH_FAMILIES[conn.enablingTech].description}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Milestone view ─────────────────────────────────────────────────────────

function MilestoneView({ milestone, data }) {
  const civ = data.civById[milestone.civilizationId];
  const meta = TYPE_META[milestone.type] || {};
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <div className="flex items-center gap-2 flex-wrap">
        {civ && (
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: civ.color }} />
        )}
        <span
          className="text-[10px] px-1.5 py-0.5 rounded"
          style={{ backgroundColor: (meta.color || '#8a7d65') + '22', color: meta.color || '#8a7d65' }}
        >
          {meta.label || milestone.type}
        </span>
        {milestone.contested && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400 border border-amber-900/50">
            Contested date
          </span>
        )}
      </div>

      <div>
        <h2 className="serif text-xl text-parchment-200 font-medium leading-snug">
          {milestone.title}
        </h2>
        <p className="text-xs text-parchment-500 mt-1">
          {formatYear(milestone.date)}
          {civ && <> · {civ.name}</>}
        </p>
      </div>

      <ImageSlot title={milestone.title} prompt={null} imageUrl={milestone.imageUrl} />

      {milestone.causalExplanation && (
        <p className="text-xs text-parchment-400 leading-relaxed">{milestone.causalExplanation}</p>
      )}

      {milestone.caveat && (
        <div className="p-3 rounded bg-coal-800 border border-coal-700">
          <p className="text-[9px] uppercase tracking-widest text-parchment-600 mb-1">Scholarly caveat</p>
          <p className="text-xs text-parchment-500 leading-snug italic">{milestone.caveat}</p>
        </div>
      )}
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────

export default function RightRail({
  data, selectedYear, currentEra,
  selectedCivId, selectedConnectionId, selectedMilestoneId,
  onCivSelect, onConnectionSelect, onMilestoneSelect,
}) {
  const activeConnections = useMemo(() => {
    const all = [...data.diffusionEvents, ...(data.connections || [])];
    return all
      .filter(ev => (ev.fromDate != null ? ev.fromDate <= selectedYear : (ev.approxDate ?? Infinity) <= selectedYear))
      .filter(ev => ev.toDate == null || ev.toDate >= selectedYear);
  }, [data, selectedYear]);

  const selectedCiv = selectedCivId ? data.civById[selectedCivId] : null;
  const selectedConn = selectedConnectionId
    ? (data.diffusionEvents.find(e => e.id === selectedConnectionId) ||
       data.connectionsById?.[selectedConnectionId] ||
       null)
    : null;
  const selectedMilestone = selectedMilestoneId
    ? data.milestones.find(m => m.id === selectedMilestoneId)
    : null;

  const activeMilestones = useMemo(() => {
    if (!selectedCiv) return [];
    return (data.milestonesByCiv[selectedCiv.id] || []).filter(m => m.date <= selectedYear);
  }, [selectedCiv, data.milestonesByCiv, selectedYear]);

  const civConnections = useMemo(() => {
    if (!selectedCiv) return [];
    return activeConnections.filter(c => (c.fromId || c.fromRegion) === selectedCiv.id);
  }, [selectedCiv, activeConnections]);

  return (
    <div className="flex flex-col h-full bg-coal-900 overflow-hidden">
      {/* Rail header */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-coal-700">
        {selectedMilestone && (
          <button
            onClick={() => onMilestoneSelect(null)}
            className="text-parchment-500 hover:text-parchment-300 text-xs"
            aria-label="Back"
          >
            ← back
          </button>
        )}
        {!selectedMilestone && selectedCiv && (
          <button
            onClick={() => onCivSelect(null)}
            className="text-parchment-500 hover:text-parchment-300 text-xs"
            aria-label="Back"
          >
            ← all
          </button>
        )}
        {!selectedMilestone && selectedConn && !selectedCiv && (
          <button
            onClick={() => onConnectionSelect(null)}
            className="text-parchment-500 hover:text-parchment-300 text-xs"
            aria-label="Back"
          >
            ← all
          </button>
        )}
        <span className="text-xs text-parchment-500 truncate">
          {selectedMilestone
            ? selectedMilestone.title
            : selectedConn && !selectedCiv
            ? (selectedConn.innovation || selectedConn.flows?.[0] || selectedConn.id)
            : selectedCiv
            ? selectedCiv.name
            : currentEra.label}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {selectedMilestone ? (
          <MilestoneView milestone={selectedMilestone} data={data} />
        ) : selectedConn && !selectedCiv ? (
          <ConnectionView conn={selectedConn} data={data} />
        ) : selectedCiv ? (
          <CivView
            civ={selectedCiv}
            data={data}
            selectedYear={selectedYear}
            activeMilestones={activeMilestones}
            civConnections={civConnections}
            onMilestoneSelect={onMilestoneSelect}
            selectedMilestoneId={selectedMilestoneId}
          />
        ) : (
          <EraView
            data={data}
            currentEra={currentEra}
            activeConnections={activeConnections}
          />
        )}
      </div>
    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import { STAGE_META, STAGES, formatYear } from '../utils/constants';

const T0 = -13000;
const T_END = 1500;

// ── The model ────────────────────────────────────────────────────────────────
// A deliberately small, transparent rule-of-thumb model of Diamond's argument:
// a civilization's speed through the developmental stages is a weighted blend
// of its endowment factors. It is calibrated so the Fertile Crescent's real
// trajectory is the S = 1.0 case. It is an extrapolation of one model — not history.

const STRENGTH_SCORE = {
  strong: 1.0,
  moderate: 0.65,
  'context-specific': 0.5,
  weak: 0.35,
  absent: 0.12,
};

const AXIS_SCORE = {
  'east-west': 1.0,
  fragmented: 0.55,
  'north-south': 0.45,
  isolated: 0.25,
  mixed: 0.6,
};

// Years after T0 each stage begins in the best case (Fertile Crescent, S = 1)
const BASE_OFFSETS = {
  'incipient-cultivation': 500,
  'established-farming': 3500,
  'towns-chiefdoms': 6500,
  'cities-states': 9500,
};

const composite = (species, biogeo, axis) =>
  0.45 * species + 0.25 * biogeo + 0.30 * axis;

function historicalFactors(civ) {
  return {
    species: civ.chainStrength?.['domesticable-species'] || 'moderate',
    biogeo: civ.chainStrength?.biogeography || 'moderate',
    axis: civ.axisContext || 'mixed',
  };
}

function factorScore(factors) {
  return composite(
    STRENGTH_SCORE[factors.species] ?? 0.5,
    STRENGTH_SCORE[factors.biogeo] ?? 0.5,
    AXIS_SCORE[factors.axis] ?? 0.5
  );
}

function simulate(civ, factors) {
  const sHist = factorScore(historicalFactors(civ));
  const sNew = factorScore(factors);
  const ratio = sNew / sHist;

  const recorded = {};
  (civ.stages || []).forEach(s => { recorded[s.stage] = s.fromDate; });

  const out = [{ stage: 'foraging', fromDate: T0 }];
  let prev = T0;
  for (const stage of STAGES.slice(1)) {
    let date;
    if (recorded[stage] != null) {
      // Stretch or compress the recorded trajectory by the factor-speed ratio
      date = T0 + (recorded[stage] - T0) / ratio;
    } else {
      // Stage never reached historically: project from the calibrated base curve
      date = T0 + BASE_OFFSETS[stage] / sNew;
    }
    date = Math.max(date, prev + 150);
    if (date > T_END) break;
    out.push({ stage, fromDate: Math.round(date) });
    prev = date;
  }
  return out;
}

// One-sentence reading of how the counterfactual diverges from the record
function divergenceSummary(civ, sim) {
  const hist = civ.stages || [];
  const histFinal = hist[hist.length - 1];
  const simFinal = sim[sim.length - 1];
  const histIdx = STAGES.indexOf(histFinal.stage);
  const simIdx = STAGES.indexOf(simFinal.stage);

  if (simIdx > histIdx) {
    return `In this world, ${civ.name} reaches ${STAGE_META[simFinal.stage].label.toLowerCase()} by ${formatYear(simFinal.fromDate)} — a threshold it never crossed historically before 1500 CE.`;
  }
  if (simIdx < histIdx) {
    return `In this world, ${civ.name} never reaches ${STAGE_META[histFinal.stage].label.toLowerCase()} by 1500 CE — historically it did, around ${formatYear(histFinal.fromDate)}.`;
  }
  const delta = Math.round(histFinal.fromDate - simFinal.fromDate);
  if (Math.abs(delta) < 120) {
    return `The trajectory barely moves — in this model, these factors were not the binding constraint for ${civ.name}.`;
  }
  return delta > 0
    ? `${civ.name} reaches ${STAGE_META[simFinal.stage].label.toLowerCase()} about ${Math.abs(delta).toLocaleString()} years earlier — ${formatYear(simFinal.fromDate)} instead of ${formatYear(histFinal.fromDate)}.`
    : `${civ.name} reaches ${STAGE_META[simFinal.stage].label.toLowerCase()} about ${Math.abs(delta).toLocaleString()} years later — ${formatYear(simFinal.fromDate)} instead of ${formatYear(histFinal.fromDate)}.`;
}

// ── UI pieces ────────────────────────────────────────────────────────────────

const SPECIES_OPTIONS = [
  { value: 'strong', label: 'Abundant' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'weak', label: 'Scarce' },
  { value: 'absent', label: 'Virtually none' },
];

const AXIS_OPTIONS = [
  { value: 'east-west', label: 'East–West' },
  { value: 'fragmented', label: 'Fragmented' },
  { value: 'north-south', label: 'North–South' },
  { value: 'isolated', label: 'Isolated' },
];

function FactorControl({ label, hint, options, value, historicalValue, onChange }) {
  const opts = options.some(o => o.value === historicalValue)
    ? options
    : [...options, { value: historicalValue, label: 'Mixed' }];
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.16em] text-parchment-600 mb-0.5">{label}</p>
      {hint && <p className="text-[10px] text-parchment-700 mb-2">{hint}</p>}
      <div className="flex flex-wrap gap-1.5">
        {opts.map(o => {
          const active = value === o.value;
          const isHist = historicalValue === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className="relative text-xs px-2.5 py-1 rounded transition-colors"
              style={{
                background: active ? 'rgba(0,168,150,0.16)' : 'rgba(26,34,53,0.6)',
                color: active ? '#5fd4c4' : '#8a7d65',
                border: `1px solid ${active ? 'rgba(0,168,150,0.5)' : '#1e2840'}`,
              }}
            >
              {o.label}
              {isHist && (
                <span
                  className="block text-[8px] uppercase tracking-widest mt-0.5"
                  style={{ color: active ? '#3fa898' : '#5a5045' }}
                >
                  historical
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StageBand({ title, stages, faded }) {
  const span = T_END - T0;
  const pct = (y) => ((y - T0) / span) * 100;
  const segs = stages.map((s, i) => ({
    stage: s.stage,
    from: s.fromDate,
    to: stages[i + 1]?.fromDate ?? T_END,
  }));

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.16em] text-parchment-600 mb-1.5">{title}</p>
      <div
        className="relative rounded-sm overflow-hidden"
        style={{ height: 40, background: '#0a0e16', border: '1px solid #1e2840', opacity: faded ? 0.75 : 1 }}
      >
        {segs.map(seg => {
          const meta = STAGE_META[seg.stage];
          const w = pct(seg.to) - pct(seg.from);
          return (
            <div
              key={seg.stage}
              className="absolute top-0 bottom-0"
              title={`${meta.label} · from ${formatYear(seg.from)}`}
              style={{
                left: pct(seg.from) + '%',
                width: w + '%',
                background: meta.color,
                borderLeft: seg.stage !== 'foraging' ? '1px solid rgba(8,12,18,0.8)' : 'none',
                transition: 'left 0.5s ease, width 0.5s ease',
              }}
            >
              {w > 9 && (
                <span
                  className="absolute left-1.5 top-1 whitespace-nowrap uppercase"
                  style={{ fontSize: 8, letterSpacing: '0.06em', color: 'rgba(232,220,196,0.75)' }}
                >
                  {meta.label}
                </span>
              )}
              {seg.stage !== 'foraging' && w > 5 && (
                <span
                  className="absolute left-1.5 bottom-1 whitespace-nowrap tabular-nums"
                  style={{ fontSize: 8, color: 'rgba(232,220,196,0.5)' }}
                >
                  {formatYear(seg.from)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function LabView({ data }) {
  const [civId, setCivId] = useState('aboriginal-australia');
  const civ = data.civById[civId];

  const [factors, setFactors] = useState(() => historicalFactors(civ));
  useEffect(() => { setFactors(historicalFactors(civ)); }, [civ]);

  const hist = historicalFactors(civ);
  const isHistorical =
    factors.species === hist.species &&
    factors.biogeo === hist.biogeo &&
    factors.axis === hist.axis;

  const sim = useMemo(() => simulate(civ, factors), [civ, factors]);
  const summary = useMemo(() => divergenceSummary(civ, sim), [civ, sim]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <p className="text-[11px] uppercase tracking-[0.22em] text-parchment-600">Counterfactual simulation</p>
        <h1 className="serif text-3xl text-parchment-100 font-medium mt-1">The What-If Lab</h1>
        <p className="text-sm text-parchment-400 leading-relaxed mt-3 max-w-xl">
          Diamond's argument is that geography dealt each region its hand: the wild species available to
          domesticate, the orientation of its continent, its connection to other peoples. Re-deal the hand
          and watch the model re-run history. <span className="text-parchment-500">This is one model,
          extrapolated — a way to test the logic of the argument, not a claim about what would have happened.</span>
        </p>

        {/* Civ selector */}
        <div className="mt-8">
          <p className="text-[10px] uppercase tracking-[0.16em] text-parchment-600 mb-2">Choose a civilisation</p>
          <div className="flex flex-wrap gap-1.5">
            {data.civilizations.map(c => (
              <button
                key={c.id}
                onClick={() => setCivId(c.id)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition-colors"
                style={{
                  background: civId === c.id ? c.color + '22' : 'rgba(26,34,53,0.6)',
                  color: civId === c.id ? '#d8cdb0' : '#8a7d65',
                  border: `1px solid ${civId === c.id ? c.color + '88' : '#1e2840'}`,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Factor controls */}
        <div className="mt-8 grid gap-6 sm:grid-cols-3 p-5 rounded border border-coal-700 bg-coal-800/40">
          <FactorControl
            label="Domesticable species"
            hint="Wild plants & animals worth taming"
            options={SPECIES_OPTIONS}
            value={factors.species}
            historicalValue={hist.species}
            onChange={v => setFactors(f => ({ ...f, species: v }))}
          />
          <FactorControl
            label="Geographic endowment"
            hint="Climate, area, terrain"
            options={SPECIES_OPTIONS}
            value={factors.biogeo}
            historicalValue={hist.biogeo}
            onChange={v => setFactors(f => ({ ...f, biogeo: v }))}
          />
          <FactorControl
            label="Axis & connectivity"
            hint="How easily ideas and crops travel"
            options={AXIS_OPTIONS}
            value={factors.axis}
            historicalValue={hist.axis}
            onChange={v => setFactors(f => ({ ...f, axis: v }))}
          />
          <div className="sm:col-span-3 -mt-2">
            <button
              onClick={() => setFactors(historicalFactors(civ))}
              disabled={isHistorical}
              className="text-[11px] text-parchment-600 hover:text-parchment-400 disabled:opacity-30 transition-colors"
            >
              ↺ Reset to history
            </button>
          </div>
        </div>

        {/* Result bands */}
        <div className="mt-10 flex flex-col gap-5">
          <StageBand title="Recorded history" stages={civ.stages || [{ stage: 'foraging', fromDate: T0 }]} faded={!isHistorical} />
          <StageBand
            title={isHistorical ? 'Simulation · historical endowment' : 'Simulation · your endowment'}
            stages={sim}
          />
          <div className="flex justify-between text-[9px] text-parchment-700 tabular-nums -mt-2 px-0.5">
            <span>{formatYear(T0)}</span>
            <span>{formatYear(T_END)}</span>
          </div>
        </div>

        {/* Divergence summary */}
        <p
          className="serif text-lg leading-relaxed mt-6"
          style={{ color: isHistorical ? '#8a7d65' : '#d8cdb0' }}
        >
          {isHistorical
            ? 'This is the hand history dealt. Change a factor above to re-deal it.'
            : summary}
        </p>

        {/* Honesty box */}
        <div className="mt-10 p-4 rounded bg-coal-800 border border-coal-700">
          <p className="text-[10px] uppercase tracking-widest text-parchment-600 mb-1.5">How this simulation works — and what it isn't</p>
          <p className="text-xs text-parchment-500 leading-relaxed">
            The model scores three endowment factors (weighted 45% species, 25% endowment, 30% connectivity)
            and stretches or compresses the civilisation's recorded timeline by the change in that score,
            calibrated so the Fertile Crescent's real trajectory is the benchmark. Real history is not a
            function of three variables: human choices, climate events, and contingency all shaped outcomes,
            and many scholars dispute environmental-determinist readings entirely. Treat the output as an
            argument made visible, not a prediction.
          </p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

export default function AboutPanel({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-enter"
      style={{ backgroundColor: 'rgba(7, 10, 15, 0.85)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto panel rounded-lg shadow-2xl"
        style={{ boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}
      >
        {/* Header */}
        <div className="panel-header flex items-start justify-between sticky top-0 bg-coal-800 z-10">
          <div>
            <h2 id="about-title" className="serif text-2xl text-parchment-100 font-semibold">
              About Hearths
            </h2>
            <p className="text-xs text-parchment-500 mt-0.5 tracking-wide uppercase">
              An Atlas of Cultural Evolution
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost mt-0.5 text-lg leading-none"
            aria-label="Close about panel"
          >
            ×
          </button>
        </div>

        <div className="px-5 pb-6 pt-4 space-y-5 text-sm text-parchment-300 leading-relaxed">

          {/* Vision */}
          <section>
            <p>
              <em className="serif text-base text-parchment-200 not-italic">Hearths</em> takes its name from <strong className="text-parchment-200 font-medium">cultural hearths</strong> — the geographic term for the handful of regions where complex civilizations independently emerged. This application lets you trace those divergent paths across deep time, from the first settled villages to the threshold of European global expansion around 1500 CE.
            </p>
          </section>

          {/* The framework */}
          <section>
            <h3 className="serif text-lg text-parchment-200 mb-2">The interpretive framework</h3>
            <p>
              The organizing idea is drawn from the work of Jared Diamond, particularly{' '}
              <em>Guns, Germs, and Steel</em> (1997). Diamond argues that the divergent trajectories of human societies were shaped less by the cleverness of peoples than by the <strong className="text-parchment-200 font-medium">biogeography of the lands they inhabited</strong>: the suite of domesticable wild species available, the orientation of continental axes (east–west facilitates diffusion; north–south impedes it), and the connectivity of landmasses.
            </p>
            <div className="mt-3 pl-4 border-l-2 border-coal-500">
              <p className="text-parchment-400 text-xs leading-relaxed font-mono tracking-tight">
                Biogeography → Domesticable species → Food production → Surplus<br />
                → Specialization → Writing · Technology · Political complexity<br />
                → Epidemic disease (as biological weapon of contact)
              </p>
            </div>
          </section>

          {/* Intellectual honesty — the critical section */}
          <section className="bg-coal-700 rounded p-4 border border-coal-500">
            <h3 className="serif text-lg text-crimson-400 mb-2 flex items-center gap-2">
              <span>⚑</span> Caveats & critiques — please read this
            </h3>
            <div className="space-y-3 text-parchment-400">
              <p>
                <strong className="text-parchment-300">Diamond's thesis is influential but seriously contested.</strong>{' '}
                This application presents it as <em>one powerful interpretive model</em>, not as settled fact or the only valid framework.
              </p>
              <ul className="space-y-2 list-none pl-0">
                <li className="flex gap-2">
                  <span className="text-crimson-500 flex-shrink-0">—</span>
                  <span>Critics argue Diamond's framework <strong className="text-parchment-300">underweights human agency, culture, and politics</strong> in shaping historical outcomes. Geography may set broad constraints without determining outcomes within them.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-crimson-500 flex-shrink-0">—</span>
                  <span>The framing can implicitly reproduce a hierarchy of "development" that Diamond himself rejects. This app uses the language of <strong className="text-parchment-300">divergent paths shaped by environment</strong>, not "advanced" vs. "primitive" societies.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-crimson-500 flex-shrink-0">—</span>
                  <span>Many dates and causal attributions are genuinely uncertain. Where scholarly debate exists, the data is flagged with a <span className="text-gold-500">⚠ contested</span> marker.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-crimson-500 flex-shrink-0">—</span>
                  <span>The civilizations selected follow Diamond's comparative set and reflect a particular research tradition. Many societies not represented here developed equally sophisticated cultural forms that don't fit this schema.</span>
                </li>
              </ul>
              <p>
                Indigenous scholars, historians, and archaeologists have offered important correctives to environmental determinist readings of history. We encourage readers to pursue those critiques alongside this visualization.
              </p>
            </div>
          </section>

          {/* How to use */}
          <section>
            <h3 className="serif text-lg text-parchment-200 mb-2">How to use this atlas</h3>
            <ul className="space-y-1.5 text-parchment-400">
              <li><strong className="text-parchment-300">Threads</strong> — The primary view. Scroll horizontally across 14,500 years of divergent civilizational history. Click any node to open a detailed panel.</li>
              <li><strong className="text-parchment-300">Map</strong> — See the cultural hearths geographically and watch diffusion arcs show how innovations spread (or stalled) across continents.</li>
              <li><strong className="text-parchment-300">Causal Chain</strong> — Select any civilization and see how Diamond's causal chain resolved for it — which links were strong, weak, or absent entirely.</li>
            </ul>
          </section>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="btn-teal"
            >
              Begin exploring
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

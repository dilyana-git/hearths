import React, { useState } from 'react';
import CausalChain from './CausalChain';

const TOURS = {
  'bronze-made-world-small': [
    {
      label: 'The Bronze Problem',
      year: -2500,
      focusConnectionId: null,
      narrative: 'Bronze is an alloy of copper and tin — but they rarely occur together. Copper was available across much of the ancient world, but tin was scarce. By 2500 BCE, bronze had become the defining technology of civilisation. Those who wanted it had to trade, at distances no earlier society had sustained.',
    },
    {
      label: 'The Tin Routes',
      year: -2000,
      focusConnectionId: 'diff-bronze-europe',
      narrative: 'The principal tin sources were in Afghanistan, Central Europe (Bohemia), and later Cornwall. Copper came from Cyprus, Sinai, and the Caucasus. Bronze Age merchants had to map, fund, and protect overland and sea routes across thousands of kilometres — just to keep their smiths in business.',
    },
    {
      label: 'The Bronze Network',
      year: -1800,
      focusConnectionId: 'diff-bronze-aegean',
      narrative: "By 1800 BCE, the Eastern Mediterranean was the world's first multi-civilisational trade network. The Uluburun shipwreck (c. 1305 BCE) carried cargo from at least seven cultural regions — tin ingots, copper ingots, ebony, glass, and resin — a snapshot of Bronze Age globalisation frozen 3,300 years ago.",
    },
    {
      label: 'Collapse',
      year: -1200,
      focusConnectionId: null,
      narrative: "Around 1200 BCE, the Bronze Age Collapse terminated most of the Eastern Mediterranean's palatial civilisations within a few decades. The very interconnection that had made the Bronze Age possible — complex, multi-node supply chains — became its fatal vulnerability. When the tin routes broke, the civilisation broke with them.",
    },
  ],
};

const STORIES = [
  {
    id: 'diamond-chain',
    title: "Diamond's Causal Chain",
    hook: 'One theory of civilizational advantage — after Guns, Germs, and Steel',
    description:
      'Jared Diamond traced why some civilizations developed faster than others: from biogeography, to domesticable species, to cities and disease. An influential framework with known critiques — presented here as one reading, not the definitive answer.',
    badge: 'Framework',
    badgeColor: '#8a7aad',
    available: true,
  },
  {
    id: 'bronze-made-world-small',
    title: 'Bronze Made the World Small',
    hook: 'How metal forced the first global trade network',
    description:
      'Tin and copper rarely occur together. Producing bronze required knowing your trading partner was a thousand kilometres away — the origin of long-distance commerce.',
    badge: 'Atlas Tour',
    badgeColor: '#c4a840',
    available: true,
  },
  {
    id: 'when-humans-stopped-moving',
    title: 'When Humans Stopped Moving',
    hook: 'The transition to sedentism',
    description:
      'For 90,000 years humans moved. Then, almost simultaneously across multiple continents, they stopped. What changed?',
    badge: 'Atlas Tour',
    badgeColor: '#6b8e9f',
    available: false,
  },
  {
    id: 'the-crops-that-made-cities',
    title: 'The Crops That Made Cities',
    hook: 'Storage, surplus, and the urban revolution',
    description:
      'Only certain crops could produce the storable surplus needed to free people from farming. Which plants made cities possible, and which ones could not?',
    badge: 'Atlas Tour',
    badgeColor: '#7a9e5c',
    available: false,
  },
  {
    id: 'how-far-could-a-boat-go',
    title: 'How Far Could a Boat Go?',
    hook: 'The Austronesian expansion',
    description:
      'Starting from Taiwan 4,000 years ago, a single maritime culture colonized half the world\'s coast — from Madagascar to Easter Island. The most extraordinary migration in human history.',
    badge: 'Atlas Tour',
    badgeColor: '#5a7fb5',
    available: false,
  },
  {
    id: 'spread-of-cattle',
    title: 'The Spread of Cattle',
    hook: 'From the Fertile Crescent to three continents',
    description:
      'Cattle domestication began in Anatolia and transformed not just food systems but cosmologies, economies, and disease landscapes across the Old World.',
    badge: 'Atlas Tour',
    badgeColor: '#c4966a',
    available: false,
  },
];

function StoryCard({ story, onOpen }) {
  return (
    <div
      className="flex flex-col rounded border border-coal-700 overflow-hidden transition-all duration-200 hover:border-coal-500"
      style={{ background: '#0f1420' }}
    >
      {/* Image placeholder */}
      <div
        className="flex flex-col items-center justify-center gap-2 px-4"
        style={{
          height: 120,
          background: `radial-gradient(ellipse at 50% 40%, ${story.badgeColor}18 0%, #0d1018 70%)`,
          borderBottom: '1px solid #1a2235',
        }}
      >
        <span
          className="text-center font-medium tracking-widest text-parchment-400"
          style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em' }}
        >
          {story.title}
        </span>
        <span className="text-parchment-700" style={{ fontSize: 9, letterSpacing: '0.3em' }}>· · ·</span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider"
            style={{ backgroundColor: story.badgeColor + '22', color: story.badgeColor, border: `1px solid ${story.badgeColor}40` }}
          >
            {story.badge}
          </span>
          {!story.available && (
            <span className="text-[9px] text-parchment-700 italic">Coming soon</span>
          )}
        </div>
        <p className="text-[10px] text-parchment-500 leading-snug flex-1">{story.description}</p>
        <button
          onClick={() => story.available && onOpen(story.id)}
          disabled={!story.available}
          className={`w-full py-2 rounded text-xs font-medium transition-colors ${
            story.available
              ? 'text-teal-400 border border-teal-900 hover:bg-teal-900/20 cursor-pointer'
              : 'text-parchment-700 border border-coal-700 cursor-default'
          }`}
        >
          {story.available ? 'Open' : 'Not yet available'}
        </button>
      </div>
    </div>
  );
}

export default function StoriesView({ data, chainCivId, onChainCivChange, onOpenTour }) {
  const [activeStory, setActiveStory] = useState(null);

  function handleOpen(storyId) {
    if (storyId === 'diamond-chain') {
      setActiveStory(storyId);
    } else if (TOURS[storyId]) {
      onOpenTour?.(TOURS[storyId]);
    }
  }

  if (activeStory === 'diamond-chain') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Back bar */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-coal-700 bg-coal-900">
          <button
            onClick={() => setActiveStory(null)}
            className="text-xs text-parchment-500 hover:text-parchment-300 flex items-center gap-1.5 transition-colors"
          >
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 1L1 5l4 4M1 5h10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Stories
          </button>
          <span className="text-parchment-700 text-xs">·</span>
          <span className="text-xs text-parchment-600 italic">
            One framework among many — not a neutral truth
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <CausalChain
            data={data}
            selectedCivId={chainCivId}
            onSelectCiv={onChainCivChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-coal-900">
      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-8 pb-6 border-b border-coal-700">
        <h2 className="serif text-3xl font-medium text-parchment-200 mb-2">Stories</h2>
        <p className="text-sm text-parchment-500 max-w-prose leading-relaxed">
          Guided explorations through the atlas — each story traces one argument, one migration,
          or one transformation through space and time. Start with the Framework, then explore the
          atlas-driven tours as they become available.
        </p>
      </div>

      {/* Story grid */}
      <div className="flex-1 px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
          {STORIES.map(story => (
            <StoryCard key={story.id} story={story} onOpen={handleOpen} />
          ))}
        </div>
      </div>
    </div>
  );
}

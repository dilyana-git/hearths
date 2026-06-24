import React, { useState } from 'react';
import CausalChain from './CausalChain';

// The Diamond framework is a special non-tour story (no beats / atlas navigation)
const DIAMOND_STORY = {
  id: 'diamond-chain',
  title: "Diamond's Causal Chain",
  description: 'Jared Diamond traced why some civilizations developed faster than others — from biogeography to domesticable species to cities and disease. An influential framework with known critiques, presented here as one reading, not the definitive answer.',
  badge: 'Framework',
  badgeColor: '#8a7aad',
  available: true,
};

function StoryCard({ story, onOpen }) {
  return (
    <div
      className="flex flex-col rounded border border-coal-700 overflow-hidden transition-all duration-200 hover:border-coal-500"
      style={{ background: '#0f1420' }}
    >
      {/* Image / title area */}
      <div
        className="relative flex flex-col items-center justify-center gap-2 px-4 overflow-hidden"
        style={{
          height: 120,
          background: `radial-gradient(ellipse at 50% 40%, ${story.badgeColor}18 0%, #0d1018 70%)`,
          borderBottom: '1px solid #1a2235',
        }}
      >
        {story.imageUrl && (
          <>
            <img
              src={story.imageUrl}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: 'cover' }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(8,12,18,0.15) 0%, rgba(8,12,18,0.72) 100%)' }}
            />
          </>
        )}
        <span
          className="relative text-center font-medium tracking-widest text-parchment-400"
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 14,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            textShadow: story.imageUrl ? '0 1px 6px rgba(0,0,0,0.9)' : 'none',
          }}
        >
          {story.title}
        </span>
        {!story.imageUrl && (
          <span className="text-parchment-700" style={{ fontSize: 9, letterSpacing: '0.3em' }}>· · ·</span>
        )}
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
          {story.beatCount != null && (
            <span className="text-[9px] text-parchment-700">{story.beatCount} beats</span>
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

export default function StoriesView({ data, chainCivId, onChainCivChange, onOpenTour, onNavigate, onNavigateToMap }) {
  const [activeStory, setActiveStory] = useState(null);

  function handleOpen(storyId) {
    if (storyId === 'diamond-chain') {
      setActiveStory(storyId);
    } else {
      const story = data.storiesById[storyId];
      if (story?.beats) onOpenTour?.(story.beats);
    }
  }

  // Combine diamond-chain with all data-driven stories
  const allCards = [
    DIAMOND_STORY,
    ...data.stories.map(s => ({
      id: s.id,
      title: s.title,
      description: s.subtitle,
      badge: s.badge,
      badgeColor: s.badgeColor,
      beatCount: s.beats?.length,
      imageUrl: s.imageUrl,
      available: true,
    })),
  ];

  if (activeStory === 'diamond-chain') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
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
            onNavigate={onNavigate}
            onNavigateToMap={onNavigateToMap}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-coal-900">
      <div className="flex-shrink-0 px-8 pt-8 pb-6 border-b border-coal-700">
        <h2 className="serif text-3xl font-medium text-parchment-200 mb-2">Stories</h2>
        <p className="text-sm text-parchment-500 max-w-prose leading-relaxed">
          Guided explorations through the atlas — each story traces one argument, one migration,
          or one transformation through space and time. Open any Atlas Tour to step through
          the narrative on a live map.
        </p>
      </div>

      <div className="flex-1 px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
          {allCards.map(story => (
            <StoryCard key={story.id} story={story} onOpen={handleOpen} />
          ))}
        </div>
      </div>
    </div>
  );
}

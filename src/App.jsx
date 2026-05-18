import React, { useState, useCallback } from 'react';
import { useData } from './hooks/useData';
import Header from './components/Header';
import AboutPanel from './components/AboutPanel';
import ThreadsView from './components/ThreadsView';
import MapView from './components/MapView';
import MilestonePanel from './components/MilestonePanel';
import CausalChain from './components/CausalChain';
import TypeLegend from './components/TypeLegend';

const VIEWS = [
  { id: 'threads', label: 'Threads', description: 'Civilizations through time' },
  { id: 'map', label: 'Map', description: 'Geography & diffusion' },
  { id: 'chain', label: 'Causal Chain', description: 'Diamond\'s framework' },
];

export default function App() {
  const data = useData();
  const [activeView, setActiveView] = useState('threads');
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [hoveredMilestone, setHoveredMilestone] = useState(null);
  const [showAbout, setShowAbout] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [chainCivId, setChainCivId] = useState('fertile-crescent');

  const handleSelectMilestone = useCallback((milestone) => {
    setSelectedMilestone(prev => prev?.id === milestone?.id ? null : milestone);
  }, []);

  const handleHoverMilestone = useCallback((milestone) => {
    setHoveredMilestone(milestone);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedMilestone(null);
  }, []);

  const selectedCiv = selectedMilestone
    ? data.civById[selectedMilestone.civilizationId]
    : null;

  return (
    <div className="flex flex-col h-screen bg-coal-900 overflow-hidden">
      <Header
        activeView={activeView}
        views={VIEWS}
        onViewChange={setActiveView}
        onAbout={() => setShowAbout(true)}
        onLegend={() => setShowLegend(v => !v)}
        showLegend={showLegend}
        sortBy={sortBy}
        onSortChange={setSortBy}
        activeViewObj={VIEWS.find(v => v.id === activeView)}
      />

      <main className="flex flex-1 overflow-hidden relative">
        {/* Main content area */}
        <div
          className="flex-1 overflow-hidden transition-all duration-300"
          style={{ marginRight: selectedMilestone ? '380px' : '0' }}
        >
          {activeView === 'threads' && (
            <ThreadsView
              data={data}
              selectedMilestone={selectedMilestone}
              hoveredMilestone={hoveredMilestone}
              onSelect={handleSelectMilestone}
              onHover={handleHoverMilestone}
              sortBy={sortBy}
            />
          )}
          {activeView === 'map' && (
            <MapView
              data={data}
              selectedMilestone={selectedMilestone}
              hoveredMilestone={hoveredMilestone}
              onSelect={handleSelectMilestone}
              onHover={handleHoverMilestone}
            />
          )}
          {activeView === 'chain' && (
            <CausalChain
              data={data}
              selectedCivId={chainCivId}
              onSelectCiv={setChainCivId}
            />
          )}
        </div>

        {/* Milestone detail panel — slides in from the right */}
        {selectedMilestone && (
          <div className="absolute right-0 top-0 bottom-0 w-96 panel-enter z-20">
            <MilestonePanel
              milestone={selectedMilestone}
              civilization={selectedCiv}
              onClose={handleClosePanel}
              onSelectCiv={(civId) => {
                setChainCivId(civId);
                setActiveView('chain');
              }}
            />
          </div>
        )}
      </main>

      {/* Legend overlay */}
      {showLegend && (
        <div
          className="fixed bottom-16 right-4 z-30 modal-enter"
          role="dialog"
          aria-label="Milestone type legend"
        >
          <TypeLegend onClose={() => setShowLegend(false)} />
        </div>
      )}

      {/* About modal */}
      {showAbout && (
        <AboutPanel onClose={() => setShowAbout(false)} />
      )}
    </div>
  );
}

import React, { useState, useCallback, useEffect } from 'react';
import { useData } from './hooks/useData';
import Header from './components/Header';
import AboutPanel from './components/AboutPanel';
import AtlasView from './components/AtlasView';
import ThreadsView from './components/ThreadsView';
import StoriesView from './components/StoriesView';
import MilestonePanel from './components/MilestonePanel';
import TypeLegend from './components/TypeLegend';
import OnboardingModal from './components/OnboardingModal';

const VIEWS = [
  { id: 'atlas',   label: 'Atlas',    description: 'World map · space & time' },
  { id: 'stories', label: 'Stories',  description: 'Frameworks & guided tours' },
  { id: 'threads', label: 'Timeline', description: 'Civilizations through time' },
];

export default function App() {
  const data = useData();
  const [activeView, setActiveView] = useState('atlas');
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [hoveredMilestone, setHoveredMilestone] = useState(null);
  const [showAbout, setShowAbout] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [chainCivId, setChainCivId] = useState('fertile-crescent');
  const [activeTour, setActiveTour] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('hearths-onboarded')
  );

  const handleSelectMilestone = useCallback((milestone) => {
    setSelectedMilestone(prev => prev?.id === milestone?.id ? null : milestone);
  }, []);

  const handleHoverMilestone = useCallback((milestone) => {
    setHoveredMilestone(milestone);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedMilestone(null);
  }, []);

  const handleOpenTour = useCallback((beats) => {
    setActiveTour({ beats, beatIndex: 0 });
    setActiveView('atlas');
  }, []);

  const handleCloseTour = useCallback(() => {
    setActiveTour(null);
  }, []);

  const handleTourBeat = useCallback((idx) => {
    setActiveTour(t => t ? { ...t, beatIndex: idx } : null);
  }, []);

  const handleCloseOnboarding = useCallback(() => {
    localStorage.setItem('hearths-onboarded', '1');
    setShowOnboarding(false);
  }, []);

  useEffect(() => {
    if (activeView !== 'threads') setSelectedMilestone(null);
  }, [activeView]);

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
      />

      <main className="flex flex-1 overflow-hidden relative">
        {/* Main content area */}
        <div
          className="flex-1 overflow-hidden transition-all duration-300"
          style={{ marginRight: (selectedMilestone && activeView === 'threads') ? '380px' : '0' }}
        >
          {activeView === 'atlas' && (
            <AtlasView
              data={data}
              activeTour={activeTour}
              onCloseTour={handleCloseTour}
              onTourBeat={handleTourBeat}
            />
          )}
          {activeView === 'stories' && (
            <StoriesView
              data={data}
              chainCivId={chainCivId}
              onChainCivChange={setChainCivId}
              onOpenTour={handleOpenTour}
            />
          )}
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
        </div>

        {/* Milestone detail panel — slides in from the right (threads view only) */}
        {selectedMilestone && activeView === 'threads' && (
          <div className="absolute right-0 top-0 bottom-0 w-96 panel-enter z-20">
            <MilestonePanel
              milestone={selectedMilestone}
              civilization={selectedCiv}
              onClose={handleClosePanel}
              onSelectCiv={(civId) => {
                setChainCivId(civId);
                setActiveView('stories');
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

      {/* First-visit onboarding */}
      {showOnboarding && (
        <OnboardingModal onClose={handleCloseOnboarding} />
      )}
    </div>
  );
}

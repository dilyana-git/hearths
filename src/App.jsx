import React, { useState, useCallback, useEffect } from 'react';
import { useData } from './hooks/useData';
import Header from './components/Header';
import AboutPanel from './components/AboutPanel';
import AtlasView from './components/AtlasView';
import ThreadsView from './components/ThreadsView';
import StoriesView from './components/StoriesView';
import LabView from './components/LabView';
import DetailOverlay from './components/DetailOverlay';
import MilestonePanel from './components/MilestonePanel';
import TypeLegend from './components/TypeLegend';
import OnboardingModal from './components/OnboardingModal';

const VIEWS = [
  { id: 'atlas',   label: 'Atlas',    description: 'World map · space & time' },
  { id: 'stories', label: 'Stories',  description: 'Frameworks & guided tours' },
  { id: 'threads', label: 'Timeline', description: 'Civilizations through time' },
  { id: 'lab',     label: 'Lab',      description: 'What-if · counterfactual simulations' },
];

export default function App() {
  const data = useData();
  const [activeView, setActiveView] = useState('atlas');
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [hoveredMilestone, setHoveredMilestone] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [chainCivId, setChainCivId] = useState('fertile-crescent');
  const [activeTour, setActiveTour] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('hearths-onboarded')
  );

  // Global overlay — DetailOverlay is rendered at App level so any view can open it
  const [overlay, setOverlay] = useState(null);
  const [atlasSelectedYear, setAtlasSelectedYear] = useState(-2500);

  // Navigation target for the Atlas — when set, AtlasView glides to this civ/year
  const [mapTarget, setMapTarget] = useState(null);

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

  // Navigate to the Atlas with a specific civ highlighted and year set
  const handleNavigateToMap = useCallback((civId, year) => {
    setOverlay(null);
    setActiveView('atlas');
    setMapTarget({ civId, year, ts: Date.now() });
  }, []);

  // Navigate: open a reading page from any view
  const handleNavigate = useCallback((target) => {
    setOverlay(target);
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
              overlay={overlay}
              onOverlayChange={setOverlay}
              mapTarget={mapTarget}
              selectedYear={atlasSelectedYear}
              onSelectedYearChange={setAtlasSelectedYear}
            />
          )}
          {activeView === 'stories' && (
            <StoriesView
              data={data}
              chainCivId={chainCivId}
              onChainCivChange={setChainCivId}
              onOpenTour={handleOpenTour}
              onNavigate={handleNavigate}
              onNavigateToMap={handleNavigateToMap}
            />
          )}
          {activeView === 'lab' && (
            <LabView data={data} />
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

      {/* Global detail overlay — available from any view */}
      <DetailOverlay
        overlay={overlay}
        data={data}
        selectedYear={atlasSelectedYear}
        onClose={() => setOverlay(null)}
        onNavigate={handleNavigate}
        onNavigateToMap={handleNavigateToMap}
      />

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

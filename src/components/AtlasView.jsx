import React, { useState, useCallback } from 'react';
import MapCanvas from './MapCanvas';
import RightRail from './RightRail';
import { ERAS, formatYear } from '../utils/constants';

function getCurrentEra(year) {
  return (
    ERAS.find(e => year >= e.start && year < e.end) ||
    ERAS[ERAS.length - 1]
  );
}

export default function AtlasView({ data, selectedYear, onYearChange }) {
  const [selectedCivId, setSelectedCivId] = useState(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);

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

  const currentEra = getCurrentEra(selectedYear);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-coal-900">
      {/* Map + right rail */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 overflow-hidden min-w-0">
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

        <div className="hidden md:flex flex-col flex-shrink-0 w-88 border-l border-coal-700 overflow-hidden"
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

      {/* Era / year bar — static for Phase 1 */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-2 border-t border-coal-700 bg-coal-900">
        <div className="flex flex-col leading-none">
          <span className="text-[10px] uppercase tracking-wider text-parchment-600">{currentEra.label}</span>
        </div>
        <span className="serif text-base font-medium text-parchment-300">{formatYear(selectedYear)}</span>
        <span className="text-[10px] text-parchment-600 italic hidden sm:block">
          Click a hearth, line, or milestone glyph
        </span>
      </div>
    </div>
  );
}

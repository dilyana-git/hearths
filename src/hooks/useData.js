import { useMemo } from 'react';
import rawData from '../data/data.json';

export function useData() {
  return useMemo(() => {
    const milestonesByCiv = {};
    rawData.milestones.forEach(m => {
      if (!milestonesByCiv[m.civilizationId]) milestonesByCiv[m.civilizationId] = [];
      milestonesByCiv[m.civilizationId].push(m);
    });

    const civById = {};
    rawData.civilizations.forEach(c => { civById[c.id] = c; });

    // Normalise eras: add .start/.end aliases for backward compat with timeline math
    const eras = rawData.eras.map(e => ({ ...e, start: e.fromDate, end: e.toDate }));
    const erasById = {};
    eras.forEach(e => { erasById[e.id] = e; });

    const storiesById = {};
    rawData.stories.forEach(s => { storiesById[s.id] = s; });

    const connectionsById = {};
    (rawData.connections || []).forEach(c => { connectionsById[c.id] = c; });

    return {
      ...rawData,
      eras,
      erasById,
      storiesById,
      connectionsById,
      milestonesByCiv,
      civById,
    };
  }, []);
}

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

    return {
      ...rawData,
      milestonesByCiv,
      civById,
    };
  }, []);
}

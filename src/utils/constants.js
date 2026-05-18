export const TIME_DOMAIN = [-13000, 1500];

export const TYPE_META = {
  'sedentism': {
    label: 'Sedentism',
    color: '#6b8e9f',
    symbol: '◉',
  },
  'plant-domestication': {
    label: 'Plant Domestication',
    color: '#7a9e5c',
    symbol: '✦',
  },
  'animal-domestication': {
    label: 'Animal Domestication',
    color: '#c4966a',
    symbol: '◈',
  },
  'pottery': {
    label: 'Pottery',
    color: '#b07050',
    symbol: '◎',
  },
  'social-stratification': {
    label: 'Social Stratification',
    color: '#8a7aad',
    symbol: '△',
  },
  'monumental-architecture': {
    label: 'Monumental Architecture',
    color: '#b8960c',
    symbol: '▲',
  },
  'writing': {
    label: 'Writing',
    color: '#00a896',
    symbol: '¶',
  },
  'metallurgy': {
    label: 'Metallurgy',
    color: '#a0a8b0',
    symbol: '◆',
  },
  'urbanism': {
    label: 'Urbanism',
    color: '#5a7fb5',
    symbol: '⬡',
  },
  'state-formation': {
    label: 'State Formation',
    color: '#c0392b',
    symbol: '✦',
  },
  'epidemic-disease': {
    label: 'Epidemic Disease',
    color: '#8b3030',
    symbol: '✕',
  },
  'long-distance-trade': {
    label: 'Long-Distance Trade',
    color: '#c4a840',
    symbol: '◇',
  },
};

export const CHAIN_STRENGTH_COLORS = {
  'strong': '#00a896',
  'moderate': '#b8960c',
  'weak': '#c0392b',
  'absent': '#2a3550',
  'context-specific': '#8a7aad',
};

export const CHAIN_STRENGTH_LABELS = {
  'strong': 'Strong',
  'moderate': 'Moderate',
  'weak': 'Weak',
  'absent': 'Absent',
  'context-specific': 'Complex',
};

export const ERAS = [
  { label: 'Late Pleistocene', start: -13000, end: -9700 },
  { label: 'Early Holocene', start: -9700, end: -4000 },
  { label: 'Chalcolithic / Bronze Age', start: -4000, end: -1200 },
  { label: 'Iron Age', start: -1200, end: 500 },
  { label: 'Medieval', start: 500, end: 1500 },
];

export const AXIS_LABELS = {
  'east-west': 'East–West Axis (favorable diffusion)',
  'north-south': 'North–South Axis (climate barriers)',
  'fragmented': 'Fragmented / Barrier-Crossed',
  'isolated': 'Geographically Isolated',
  'mixed': 'Mixed Connectivity',
};

export const AXIS_COLORS = {
  'east-west': '#00a896',
  'north-south': '#c0392b',
  'fragmented': '#b8960c',
  'isolated': '#8a7aad',
  'mixed': '#6b8e9f',
};

export const formatYear = (year) => {
  const abs = Math.abs(Math.round(year));
  if (year < 0) return `${abs.toLocaleString()} BCE`;
  if (year === 0) return '1 CE';
  return `${abs.toLocaleString()} CE`;
};

export const SORT_OPTIONS = [
  { value: 'default', label: 'Default (by first agriculture)' },
  { value: 'region', label: 'By Region' },
  { value: 'axis', label: 'By Axis Orientation' },
];

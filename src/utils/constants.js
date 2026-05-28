export const TIME_DOMAIN = [-13000, 1500];

export const TYPE_META = {
  'sedentism':             { label: 'Sedentism',             color: '#6b8e9f', tier: 'ring'   },
  'plant-domestication':   { label: 'Plant Domestication',   color: '#7a9e5c', tier: 'ring'   },
  'animal-domestication':  { label: 'Animal Domestication',  color: '#c4966a', tier: 'ring'   },
  'pottery':               { label: 'Pottery',               color: '#b07050', tier: 'ring'   },
  'social-stratification': { label: 'Social Stratification', color: '#8a7aad', tier: 'filled' },
  'monumental-architecture':{ label: 'Monumental Architecture', color: '#b8960c', tier: 'filled'},
  'metallurgy':            { label: 'Metallurgy',            color: '#a0a8b0', tier: 'filled' },
  'long-distance-trade':   { label: 'Long-Distance Trade',   color: '#c4a840', tier: 'filled' },
  'writing':               { label: 'Writing',               color: '#00a896', tier: 'double' },
  'urbanism':              { label: 'Urbanism',              color: '#5a7fb5', tier: 'double' },
  'state-formation':       { label: 'State Formation',       color: '#c0392b', tier: 'double' },
  'epidemic-disease':      { label: 'Epidemic Disease',      color: '#8b3030', tier: 'double' },
};

// Three visual tiers encode complexity level
export const NODE_TIERS = {
  ring:   { label: 'Foundational',      description: 'Sedentism, cultivation, herding, pottery' },
  filled: { label: 'Emerging complexity', description: 'Social hierarchy, trade, craft, monuments' },
  double: { label: 'Peak complexity',   description: 'Writing, cities, states, epidemic disease' },
};

export function getNodeTier(type) {
  return TYPE_META[type]?.tier || 'filled';
}

export const CHAIN_STRENGTH_COLORS = {
  'strong':           '#00a896',
  'moderate':         '#b8960c',
  'weak':             '#c0392b',
  'absent':           '#2a3550',
  'context-specific': '#8a7aad',
};

export const CHAIN_STRENGTH_LABELS = {
  'strong':           'Strong',
  'moderate':         'Moderate',
  'weak':             'Weak',
  'absent':           'Absent',
  'context-specific': 'Complex',
};

// Era labels use geological / climatological epoch names where possible.
// Note: terms like "Iron Age" and "Post-Classical" reflect Eurasian
// archaeological convention; parallel developments elsewhere may not
// align neatly with these boundaries.
export const ERAS = [
  {
    label: 'Late Pleistocene',
    sublabel: 'Glacial world · global forager populations · no agriculture anywhere',
    start: -13000, end: -9700,
  },
  {
    label: 'Holocene Transition',
    sublabel: 'Post-glacial warming · first sedentism · proto-cultivation emerges independently across regions',
    start: -9700, end: -4000,
  },
  {
    label: 'First Urban Complexity',
    sublabel: 'Cities, writing, bronze metalwork — multiple independent centres. Eurasian "Chalcolithic/Bronze Age" is one thread.',
    start: -4000, end: -1200,
  },
  {
    label: 'Iron Age & Classical',
    sublabel: 'Iron technology in Eurasia & Africa; complex polities worldwide. "Classical" refers to Mediterranean antiquity — a regional, not global, label.',
    start: -1200, end: 500,
  },
  {
    label: 'Pre-Colonial Complexity',
    sublabel: 'Complex polities on every inhabited continent — threshold of European global expansion (c. 1500 CE)',
    start: 500, end: 1500,
  },
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

export const TECH_FAMILIES = {
  'foot-river':    { label: 'Foot / River',    color: '#6b8e9f', dash: '4,4',  description: 'Local exchange: obsidian, shells, ~100–300 km' },
  'farming-wave':  { label: 'Farming Wave',    color: '#7a9e5c', dash: '2,5',  description: 'Demic diffusion as farming populations expand' },
  'wheel-caravan': { label: 'Wheel / Caravan', color: '#c4966a', dash: '6,3',  description: 'Overland caravan corridors; donkey, horse, camel' },
  'bronze-trade':  { label: 'Bronze Trade',    color: '#c4a840', dash: 'none', description: 'Long-range necessity: tin and copper rarely co-locate' },
  'iron-maritime': { label: 'Iron / Maritime', color: '#a0a8b0', dash: '8,3',  description: 'Coastal and riverine; iron production localizes supply' },
  'sail-monsoon':  { label: 'Sail / Monsoon',  color: '#5a7fb5', dash: 'none', description: 'Seas become highways: Austronesian, Indian Ocean, Mediterranean' },
};

export const STAGES = [
  'foraging',
  'incipient-cultivation',
  'established-farming',
  'towns-chiefdoms',
  'cities-states',
];

export const STAGE_META = {
  'foraging':              { label: 'Foraging',              color: '#1a2840', glowOpacity: 0 },
  'incipient-cultivation': { label: 'Incipient Cultivation', color: '#1e3530', glowOpacity: 0.06 },
  'established-farming':   { label: 'Established Farming',   color: '#2a4830', glowOpacity: 0.12 },
  'towns-chiefdoms':       { label: 'Towns / Chiefdoms',     color: '#4a4020', glowOpacity: 0.20 },
  'cities-states':         { label: 'Cities / States',       color: '#8a5a18', glowOpacity: 0.30 },
};

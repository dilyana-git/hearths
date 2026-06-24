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

// Per-era art direction: the whole canvas re-tints as time advances.
// Glacial blues → first-green Holocene → clay → gold → bronze → iron slate → trade-wind teal.
export const ERA_PALETTES = {
  'late-pleistocene': { accent: '#86a8c6', oceanIn: '#0a1522', oceanOut: '#060c14', land: '#16202e', landStroke: '#26344a' },
  'younger-dryas':    { accent: '#9aa3c0', oceanIn: '#0c1320', oceanOut: '#080c14', land: '#181f2c', landStroke: '#283246' },
  'early-holocene':   { accent: '#8fae6a', oceanIn: '#0b1620', oceanOut: '#070d12', land: '#16221c', landStroke: '#28392e' },
  'neolithic-spread': { accent: '#a3b061', oceanIn: '#0c161e', oceanOut: '#080d10', land: '#19231a', landStroke: '#2b3a28' },
  'first-towns':      { accent: '#c4936a', oceanIn: '#0e1520', oceanOut: '#090c12', land: '#201d17', landStroke: '#383026' },
  'first-cities':     { accent: '#c9a84c', oceanIn: '#0d1420', oceanOut: '#080c12', land: '#211e14', landStroke: '#3a3322' },
  'bronze-age':       { accent: '#d4a843', oceanIn: '#101521', oceanOut: '#090c12', land: '#231d12', landStroke: '#3e3320' },
  'iron-age':         { accent: '#a8b0b8', oceanIn: '#0d1218', oceanOut: '#08090d', land: '#1c2026', landStroke: '#303841' },
  'pre-colonial':     { accent: '#56a3a0', oceanIn: '#0a161c', oceanOut: '#070d10', land: '#162220', landStroke: '#274038' },
};

export const DEFAULT_PALETTE = { accent: '#b8960c', oceanIn: '#0d1620', oceanOut: '#080c12', land: '#151e2d', landStroke: '#253045' };

export const STAGE_META = {
  'foraging':              { label: 'Foraging',              color: '#1a2840', glowOpacity: 0,    caption: 'Mobile bands subsisting on wild plants and game' },
  'incipient-cultivation': { label: 'Incipient Cultivation', color: '#1e3530', glowOpacity: 0.06, caption: 'Early experiments with planting and tending wild species' },
  'established-farming':   { label: 'Established Farming',   color: '#2a4830', glowOpacity: 0.12, caption: 'Settled communities dependent on domesticated crops' },
  'towns-chiefdoms':       { label: 'Towns / Chiefdoms',     color: '#4a4020', glowOpacity: 0.20, caption: 'Surplus-driven hierarchy and monumental building' },
  'cities-states':         { label: 'Cities / States',       color: '#8a5a18', glowOpacity: 0.30, caption: 'Urban centres with writing, taxation, and standing armies' },
};

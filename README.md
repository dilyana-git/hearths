# Hearths — An Interactive Atlas of Cultural Evolution

A dark-cartographic, single-page React application that illustrates the divergent trajectories of human societies through Jared Diamond's biogeographic lens. Explore 14,500 years of civilizational emergence across nine independent cultural hearths.

---

## Running the app

```bash
npm install
npm run dev      # development server
npm run build    # production build → dist/
npm run preview  # preview the production build
```

The app is a deployable static site. Copy `dist/` to any static host.

---

## Views

| View | Description |
|------|-------------|
| **Threads** | Horizontal parallel timeline — one track per civilization, ~13,000 BCE → 1500 CE. Click any milestone node for details. |
| **Map** | Stylized world map with cultural hearths and animated diffusion arcs. Click a hearth to focus its arcs. |
| **Causal Chain** | Interactive diagram of Diamond's causal chain; select any civilization to see which links were strong, weak, or absent. |

---

## Data schema

Everything is driven by `src/data/data.json`. The top-level structure:

```
{
  civilizations: Civilization[],
  milestones:    Milestone[],
  diffusionEvents: DiffusionEvent[],
  causalChain:   { links: ChainLink[] }
}
```

### Civilization

```typescript
{
  id: string                // unique slug, e.g. "fertile-crescent"
  name: string              // display name
  region: string            // geographic description
  hearth: { lat, lng }      // map centre point
  axisContext: "east-west" | "north-south" | "fragmented" | "isolated" | "mixed"
  color: string             // hex color for this civilization's track
  sortOrder: number         // default sort position (1 = first)
  summary: string           // 2-4 sentence overview
  chainStrength: {          // Diamond's chain, strength per link
    biogeography: Strength
    "domesticable-species": Strength
    "food-production": Strength
    surplus: Strength
    specialization: Strength
    writing: Strength
    technology: Strength
    "political-complexity": Strength
    "epidemic-disease": Strength
  }
}

type Strength = "strong" | "moderate" | "weak" | "absent" | "context-specific"
```

### Milestone

```typescript
{
  id: string
  civilizationId: string    // must match a Civilization.id
  type: MilestoneType       // see below
  title: string
  date: number              // year - negative = BCE
  contested: boolean        // show warning marker if true
  causalExplanation: string // Diamond-framework explanation
  caveat: string | null     // scholarly caveat or null
}

type MilestoneType =
  | "sedentism" | "plant-domestication" | "animal-domestication" | "pottery"
  | "social-stratification" | "monumental-architecture" | "writing" | "metallurgy"
  | "urbanism" | "state-formation" | "epidemic-disease" | "long-distance-trade"
```

### DiffusionEvent

```typescript
{
  id: string
  innovation: string        // human-readable name of what spread
  fromId: string            // source Civilization.id
  toRegion: { lat, lng, name }  // destination coordinates
  approxDate: number        // year
  axisAlong: "latitude" | "meridional"
  description: string
  strength: "strong" | "moderate" | "weak"
}
```

---

## Adding a civilization

1. Add a new entry to `civilizations[]` in `src/data/data.json`. Give it a unique `id`, a `hearth` coordinate, and fill in all `chainStrength` values.
2. Add milestone records to `milestones[]` referencing the new `civilizationId`.
3. Optionally add `diffusionEvents[]` records with `fromId` pointing to the new civilization.
4. Run `npm run dev` to verify.

No code changes needed - all views are data-driven.

---

## Adding a milestone

Add a new object to `milestones[]` in `src/data/data.json`:

```json
{
  "id": "my-civ-writing",
  "civilizationId": "my-civ",
  "type": "writing",
  "title": "Script Invention",
  "date": -2000,
  "contested": false,
  "causalExplanation": "...",
  "caveat": null
}
```

The Threads timeline places the node automatically at the correct date position.

---

## Intellectual honesty

Diamond's geographic-determinist thesis is presented as **one interpretive model**, not settled fact. The `caveat` field on milestones, and the About panel, are explicit about this. When adding content, please:

- Flag contested dates with `"contested": true`
- Use `caveat` to note scholarly disagreement where it exists
- Avoid language implying hierarchy between civilizations ("ahead", "behind", "primitive")
- Frame divergence as shaped by environment, not by human quality

---

## Tech stack

- **React 18** + **Vite 5** - component-based SPA, static build
- **D3.js v7** - scales, geo projection, path generation
- **Tailwind CSS v3** - utility styling with dark antiquarian theme extension
- **topojson-client** + **world-atlas** - Natural Earth 110m world topology for the map
- **Google Fonts** - Cormorant Garamond (serif) + Inter (sans)

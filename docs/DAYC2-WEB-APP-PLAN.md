# DAYC-2 Web App Implementation Plan

## Overview

We are building a **React-based web app** that converts DAYC-2 raw developmental assessment scores into standard scores, percentiles, and age equivalents. This replaces an earlier Excel-based calculator that had usability and compatibility issues.

**Target users:** Speech-language pathologists and other clinicians who need a reliable, easy-to-use scoring tool.

---

## Goals & Priorities

In order of importance:

1. **Transparency & Verifiability**
   - Clinicians must trust the accuracy of score conversions
   - Every displayed number should be traceable to source data (table ID, row number)
   - No interpolation or modeling—direct table lookups only

2. **Attractive, Simple, Intuitive UX**
   - Single-page app that feels like a native tool
   - Works offline (installable as PWA)
   - Clean interface similar to the existing HTML prototype

3. **High Test Coverage & Maintainability**
   - Business logic separated from UI for easy testing
   - Colocated tests for discoverability
   - TypeScript throughout

---

## Architecture Decisions

### Why React?

The current prototype (`output/dayc2-calculator.html`) is a single 330KB HTML file with inline JavaScript. It works but:
- Hard to test (logic mixed with DOM manipulation)
- Hard to maintain (no components, no type safety in the JS)
- Hard to extend (adding features requires careful manual work)

React gives us:
- Component-based UI (reusable, testable pieces)
- TypeScript integration (catch errors at compile time)
- Mature testing ecosystem (Vitest, React Testing Library)

### Why Vite?

Vite is a modern build tool that provides:
- **Fast development server** with hot module replacement (see changes instantly in browser)
- **Simple setup** for React + TypeScript
- **PWA plugin** for offline support and home screen installation
- **Small production bundles** with tree-shaking

We could use other tools (Parcel, webpack), but Vite is currently the most popular choice for new React projects.

### Why Vitest?

Vitest is the modern testing framework built specifically for Vite projects:
- Uses the same config and plugins as Vite (no duplicate configuration)
- Native ESM support (matches how Vite handles modules)
- Significantly faster than Jest for Vite apps
- Compatible with Jest's API (easy migration, familiar syntax)
- Built-in watch mode with instant re-runs

### Why date-fns?

Age calculation is critical for correct scoring. We use [date-fns](https://date-fns.org/) because:
- `differenceInMonths(testDate, dob)` handles leap years and month boundaries correctly
- Tree-shakeable (only imports what we use)
- Pure functions (no side effects, easy to test)
- Well-tested library used across the industry

### Data Strategy: Bundle the JSON

The scoring tables total ~330KB of JSON. Two options:

1. **Fetch at runtime** from `/public/` folder
2. **Import into bundle** as JavaScript modules

We choose **option 2 (import into bundle)** because:
- App works immediately on load (no waiting for data fetch)
- Guaranteed offline support without extra service worker logic
- 330KB is acceptable for a specialized clinical tool
- SourceMeta (provenance info) stays intact for transparency

### Folder Structure: Feature-First with Type-Based Subfolders

Following the [Bulletproof React](https://github.com/alan2207/bulletproof-react) pattern.

**Multi-instrument consideration:** We plan to add other assessments (OWLS, etc.) later. The structure supports this by:
- Each instrument gets its own feature folder (`dayc2/`, `owls/`, etc.)
- Shared utilities live in `shared/`
- The main app can have tabs or routes per instrument

```
slp/
├── src/
│   ├── App.tsx                   # Top-level shell (tabs/routes per instrument)
│   ├── main.tsx                  # Vite entry point
│   │
│   ├── shared/                   # Cross-instrument utilities
│   │   ├── components/           # Reusable UI (Card, FormRow, ScoreCell)
│   │   ├── lib/                  # Generic scoring utilities
│   │   │   ├── types.ts          # ProvenanceStep, ValueWithProvenance, SourceMeta
│   │   │   └── format.ts         # formatValue, formatAgeEquiv
│   │   └── hooks/
│   │
│   ├── dayc2/                    # DAYC-2 specific code
│   │   ├── components/           # React components
│   │   │   ├── Dayc2App.tsx      # DAYC-2 instrument UI (plugged into top-level App)
│   │   │   ├── Dayc2App.test.tsx
│   │   │   ├── ChildInfoForm.tsx
│   │   │   ├── RawScoresForm.tsx
│   │   │   ├── ResultsTable.tsx
│   │   │   ├── GoalPlanner.tsx
│   │   │   └── ProvenancePanel.tsx
│   │   │
│   │   ├── hooks/                # React hooks
│   │   │   ├── useCalculation.ts
│   │   │   └── useCalculation.test.ts
│   │   │
│   │   ├── lib/                  # Pure business logic (no React)
│   │   │   ├── age.ts            # Age calculations (using date-fns)
│   │   │   ├── age.test.ts
│   │   │   ├── tables.ts         # Type guards, formatting
│   │   │   ├── tables.test.ts
│   │   │   ├── scoring.ts        # Forward lookups (raw → standard → percentile)
│   │   │   ├── scoring.test.ts
│   │   │   ├── goals.ts          # Reverse lookups (percentile → raw)
│   │   │   ├── goals.test.ts
│   │   │   └── index.ts          # Re-exports public API
│   │   │
│   │   ├── data/                 # JSON table imports
│   │   │   ├── index.ts          # Loads and exports all tables + createLookupContext
│   │   │   └── fixtures.ts       # Test fixtures (small mock tables)
│   │   │
│   │   └── types.ts              # DAYC-2 specific table types
│   │
├── tools/                        # Build pipeline (Node-only, not bundled)
│   ├── csvToJson.ts              # CSV → JSON conversion
│   ├── parseValue.ts             # CSV string parsing
│   └── parsers.ts                # Age band extraction, table ID parsing
│
├── public/
│   ├── manifest.json             # PWA manifest
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
│
├── index.html                    # Vite HTML template
├── vite.config.ts
├── vitest.config.ts              # Vitest configuration
├── tsconfig.json
└── package.json
```

**Top-level App routing:**

The top-level `src/App.tsx` acts as a shell that can host multiple instruments:

```tsx
// src/App.tsx (simplified)
const App = () => {
  const [instrument, setInstrument] = useState<'dayc2' | 'owls'>('dayc2');
  
  return (
    <div>
      <nav>
        <button onClick={() => setInstrument('dayc2')}>DAYC-2</button>
        <button onClick={() => setInstrument('owls')}>OWLS</button>
      </nav>
      {instrument === 'dayc2' && <Dayc2App />}
      {instrument === 'owls' && <OwlsApp />}
    </div>
  );
};
```

For MVP (DAYC-2 only), the shell simply renders `<Dayc2App />` directly.

**Why this structure?**

- **Feature folder (`dayc2/`)**: All related code in one place. Easy to find, easy to delete or extract.
- **Type subfolders (`components/`, `hooks/`, `lib/`)**: Familiar pattern, easy to find "all components" or "all logic."
- **Colocated tests**: `scoring.test.ts` next to `scoring.ts`. Obvious when tests are missing.
- **`lib/` for business logic**: Signals this is substantial, framework-agnostic code that could be its own package.
- **`shared/` folder**: Code reused across instruments. Start minimal, extract as patterns emerge.

**Adding a new instrument (e.g., OWLS) later:**

```
src/
├── shared/           # Already exists
├── dayc2/            # Already exists
├── owls/             # New folder, same structure as dayc2/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── data/
│   └── types.ts
└── main.tsx          # Add route/tab for OWLS
```

Each instrument is self-contained. Shared utilities grow organically as we find common patterns.

---

## Key Design: Provenance Throughout

Every lookup function returns not just the result, but the complete path of how it was derived. This is critical because many scores involve **multi-step lookups** (e.g., raw → standard score → percentile) or **composite calculations** (e.g., sum of subtest scores → domain composite → percentile).

```typescript
interface ProvenanceStep {
  tableId: string;           // e.g., "B17", "C1", "D1"
  csvRow: number;            // Row in original CSV
  source: SourceMeta;        // SHA256, generator version, etc.
  description?: string;      // e.g., "raw→standard", "SS→percentile"
}

interface ValueWithProvenance<T> {
  value: T | null;
  steps: ProvenanceStep[];   // Complete lookup path (may be multiple steps)
  note?: string;             // e.g., "below table minimum"
}
```

**Example: Subtest percentile lookup path**
```
steps: [
  { tableId: "B17", csvRow: 25, description: "raw 12 → SS 92" },
  { tableId: "C1",  csvRow: 40, description: "SS 92 → 30th percentile" }
]
```

**Example: Domain composite lookup path**
```
steps: [
  { tableId: "B17", csvRow: 25, description: "RL raw → SS 92" },
  { tableId: "B17", csvRow: 18, description: "EL raw → SS 88" },
  { tableId: "D1",  csvRow: 12, description: "sum 180 → domain SS 90" },
  { tableId: "C1",  csvRow: 38, description: "SS 90 → 25th percentile" }
]
```

This enables:
- **UI transparency**: Show users the complete lookup path, not just the final table
- **Test verification**: Assert that lookups hit the expected sequence of rows
- **Debugging**: Trace any discrepancy through the full derivation chain

---

## Feature List

### Core Features (MVP)

1. **Child Information Input**
   - Date of birth, test date
   - Calculate age in months
   - Validate age is 12-71 months

2. **Raw Score Input**
   - 7 subtests: Cognitive, Receptive Language, Expressive Language, Social-Emotional, Gross Motor, Fine Motor, Adaptive Behavior
   - Input validation (min/max per subtest)

3. **Results Display**
   - Standard scores per subtest
   - Percentile ranks
   - Age equivalents
   - Domain composites (Communication = RL+EL, Physical = GM+FM)

4. **Goal Planning (Reverse Lookup)**
   - Enter target percentile
   - Show required raw scores per subtest to reach that percentile

### Trust & Transparency Features

5. **Provenance Panel**
   - "About the data" section showing table sources, SHA256 hashes, generator version
   - Per-result drill-down showing exact lookup path

### Offline & PWA Features

6. **Offline Support**
   - Works without internet after first load

7. **Installable**
   - Add to home screen on iOS/Android
   - Opens in standalone mode (no browser chrome)

---

## Implementation Phases

### Phase 1: Project Setup

Set up Vite + React + TypeScript with hot reload for real-time development.

| Task | Verify |
|------|--------|
| 1.1 Initialize Vite project with React + TypeScript template | `npm run dev` starts server |
| 1.2 Install and configure Vitest + React Testing Library | `npm test` runs and passes |
| 1.3 Install date-fns | Import works without error |
| 1.4 Configure Vite to find existing `data/json/` files | Import works without error |
| 1.5 Add basic `index.html` with app title | Page loads in browser |
| 1.6 Create minimal `App.tsx` that renders "Hello DAYC-2" | Text visible in browser |

### Phase 2: Data & Context Setup

Define `LookupContext` and load JSON tables. This must come before `lib/` so scoring functions can accept context as a parameter and tests can use fixtures.

| Task | Verify |
|------|--------|
| 2.1 Create `shared/lib/types.ts`: `ProvenanceStep`, `ValueWithProvenance`, `SourceMeta` | Types compile |
| 2.2 Create `dayc2/types.ts`: DAYC-2 specific table types (move from existing) | Types compile |
| 2.3 Create `dayc2/data/index.ts`: import all JSON tables (A1, B13-B29, C1, D1) | No import errors |
| 2.4 Create `LookupContext` interface and `createLookupContext()` function | Returns valid context object |
| 2.5 Create test fixtures: small mock tables for unit testing without full JSON | Fixtures importable |

### Phase 3: Core Library (`lib/`)

Build pure TypeScript scoring logic with tests. No React yet. All scoring functions accept `LookupContext` as a parameter (defined in Phase 2).

| Task | Verify |
|------|--------|
| 3.1 Create `lib/tables.ts`: type guards (`isExact`, `isBounded`, `isRange`), `formatValue`, `getNumericValue` | Unit tests pass |
| 3.2 Create `lib/age.ts`: `calcAgeMonths` (using date-fns), `findAgeBand` | Unit tests pass |
| 3.3 Create `lib/scoring.ts`: `lookupStandardScore`, `lookupPercentile`, `lookupAgeEquivalent`, `lookupDomainComposite` with multi-step provenance | Unit tests pass |
| 3.4 Create `lib/goals.ts`: `lookupStandardScoreFromPercentile`, `lookupRawScoreFromStandardScore` | Unit tests pass |
| 3.5 Create `lib/index.ts`: re-export public API | Imports work from `lib/` |
| 3.6 Create `calculateAllScores` orchestrator function | Golden-path tests pass (compare to known-correct values) |

### Phase 4: React Components (`components/`)

Build UI components, verifying each in browser with hot reload.

| Task | Verify |
|------|--------|
| 4.1 Create `ChildInfoForm.tsx`: DOB and test date inputs | Inputs visible, values change |
| 4.2 Add age calculation display below inputs | Shows "X months, Age Band: Y" |
| 4.3 Add validation error display (age out of range, test before DOB) | Error messages appear correctly |
| 4.4 Create `RawScoresForm.tsx`: 7 numeric inputs | Inputs visible, accept numbers |
| 4.5 Create `ResultsTable.tsx`: displays subtest results | Table renders with placeholder data |
| 4.6 Wire up `useCalculation` hook to connect inputs → results | Real calculations appear in table |
| 4.7 Add color coding for scores (low/avg/high) | Colors visible |
| 4.8 Add composite rows (Communication, Physical) | Composite scores calculated correctly |
| 4.9 Create `GoalPlanner.tsx`: target percentile → required raw scores | Reverse lookup displays correctly |
| 4.10 Create `ProvenancePanel.tsx`: collapsible data source info | Panel shows table IDs, SHAs |
| 4.11 Add per-result provenance drill-down | Clicking a result shows lookup details |

### Phase 5: Styling & Polish

Clean, professional appearance suitable for clinical use.

| Task | Verify |
|------|--------|
| 5.1 Add CSS (cards, form layout, table styling) | Looks clean and professional |
| 5.2 Add responsive layout for mobile | Works on phone-sized viewport |

### Phase 6: PWA Setup

Make the app installable and offline-capable.

| Task | Verify |
|------|--------|
| 6.1 Add `vite-plugin-pwa` to project | Plugin loads without error |
| 6.2 Create `manifest.json` with app name, icons, colors | Manifest loads (check DevTools → Application) |
| 6.3 Create app icons (192x192, 512x512) | Icons display in manifest |
| 6.4 Configure service worker with `registerType: 'autoUpdate'` | App works after going offline (DevTools → Network → Offline) |
| 6.5 Display app version + `generatorVersion` in UI footer | Version visible in app |
| 6.6 Add "Update available" toast when new version is installed | Toast appears after SW update |
| 6.7 Test "Add to Home Screen" on iOS/Android | App opens in standalone mode |

### Phase 7: Final Verification

End-to-end testing and documentation.

| Task | Verify |
|------|--------|
| 7.1 Run all unit tests | All pass |
| 7.2 Manual test: enter known case, verify against DAYC-2 manual | Numbers match |
| 7.3 Manual test: verify provenance shows correct table/row | Matches source CSV |
| 7.4 Update README with usage instructions | README is accurate |
| 7.5 Production build | `npm run build` succeeds, dist/ folder created |
| 7.6 Deploy to hosting (GitHub Pages, Vercel, etc.) | Live URL works |

---

## Development Workflow

### Real-Time Browser Verification

Vite's dev server provides **hot module replacement (HMR)**:

1. Run `npm run dev` — browser opens at `http://localhost:5173`
2. Edit any file — browser updates instantly (no full reload)
3. Component state is preserved during edits

This allows you to:
- See UI changes immediately as you code
- Test calculations by entering values and watching results update
- Verify styling changes in real-time

### Test-Driven Development

For `lib/` modules (business logic):

1. Write a failing test first
2. Implement the function
3. Run `npm test` to verify
4. Refactor if needed

Example workflow for `scoring.ts`:

```bash
# Terminal 1: Run tests in watch mode
npm test -- --watch

# Terminal 2: Run dev server for manual verification
npm run dev
```

---

## Reusing Existing Code

**Important distinction:** Some existing code is for the **build/data pipeline** (CSV → JSON conversion), while the web app needs **runtime code** (JSON → scores). These should be kept separate.

### Runtime Code (for web app `src/`)

| File | Reuse? | Notes |
|------|--------|-------|
| `types.ts` | ✅ Partial | Move generic types (`SourceMeta`) to `shared/lib/types.ts`; keep DAYC-2 table types in `dayc2/types.ts` |
| `generateWorkbook.ts` | 📋 Reference | Port scoring logic to `lib/scoring.ts` (browser-compatible, no Excel deps) |

### Build Pipeline Code (keep in `tools/` or `scripts/`)

These are Node-only utilities for regenerating JSON from CSVs. They should **not** be bundled into the web app.

| File | Location | Notes |
|------|----------|-------|
| `csvToJson.ts` | Move to `tools/` | Still needed to regenerate JSON from CSVs |
| `parseValue.ts` | Move to `tools/` | CSV string parsing (only needed at build time) |
| `parsers.ts` | Move to `tools/` | `getAgeBandForTable`, `extractBTableId` (only for CSV processing) |
| `buildWebApp.ts` | ❌ Delete | Replaced by Vite build |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Scoring logic drift from source tables | Meta-validation tests verify table integrity (monotonicity, coverage) |
| Clinicians misinterpret scores | Clear age validation messages, explicit table references |
| Complex provenance UI overwhelms users | Provenance is opt-in (collapsed by default) |
| PWA caching serves stale app | Include version in UI, service worker update prompt |

---

## Success Criteria

1. ✅ All unit tests pass
2. ✅ Known test cases match DAYC-2 manual examples
3. ✅ App works offline after first load
4. ✅ App installable to home screen
5. ✅ Provenance traceable for any displayed score
6. ✅ Clinicians can use it without training (intuitive UI)

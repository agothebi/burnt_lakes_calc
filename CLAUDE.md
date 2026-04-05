# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint
npm test             # Vitest run (single pass)
npm run test:watch   # Vitest interactive watch mode

# Run a single test file
npx vitest run src/utils/__tests__/calculator.test.ts
```

## Architecture

This is a single-page React app — no routing, no backend. The user flows through a multi-step wizard to calculate their AI water usage, while a reactive SVG lake scene on the left responds in real time.

**Data flow:**

```
WizardAnswers (useWizard)
  → useBurnProgress   →  progress: 0–1 (log scale)
  → LakeScene(progress)   →  colors / positions / opacity via Framer Motion springs
  → ResultStep            →  formatResult(calculateXxx(answers))
```

**Calculator (`src/utils/calculator.ts`)**
Three exported calculation paths, all returning total liters as `number`:
- `calculateRegularUser` — message-based: frequency × session length × style × tool multiplier × model multiplier × months
- `calculatePowerUserTokens` — token-based: monthly tokens × water/token × output ratio multiplier × months
- `calculatePowerUserCalls` — converts calls/day × call size → tokens, then delegates to token path

`formatResult(liters)` picks a human-readable lake unit (bathtubs → pools → small/large lake) and returns comparisons. Water constants are intentionally scaled to the total data center footprint (not just direct cooling): `LITERS_PER_MESSAGE_BASELINE = 0.100`, `ML_PER_1K_TOKENS = { small: 4, mid: 10, frontier: 25 }`.

**Wizard state (`src/hooks/useWizard.ts`)**
Single `WizardAnswers` flat bag populated as users answer questions. `stepsFor(userType)` generates the ordered step sequence dynamically — power users get `powerPathSelect` inserted; regular users skip it. `submitAndNext` merges answers and advances in one atomic state update, which is important to avoid a render where the wrong step sequence is computed.

**Burn progress (`src/hooks/useBurnProgress.ts`)**
`litersToProgress(liters)` maps via log10 scale: 1L→0.0, 10L→0.2, 100L→0.4, 1K→0.6, 10K→0.8, 100K+→1.0. `estimateFromPartialAnswers` fills conservative defaults for unanswered questions so the scene responds as soon as the first answer is given.

**Lake scene (`src/components/scene/LakeScene.tsx` + `sceneUtils.ts`)**
Layered SVG (viewBox `0 0 400 650`). All visible elements animate via `animate={{ fill: color }}` with spring transitions (`stiffness: 38, damping: 24`). Color stops in `sceneUtils.ts` `STOPS` object drive `interpolateStops(stops, progress)` for every colored layer. Mouse parallax uses `useMotionValue` + `useSpring` — **all `useTransform` calls must be at the top level of the component** (React hooks rules), not inside JSX. SVG gradient fills (`fill="url(#grad)"`) cannot be animated by Framer Motion; the workaround is redeclaring `<defs>` inline each render with computed stop colors.

**Design system (`src/index.css`)**
Tailwind v4 with `@theme` block for custom tokens. Claymorphism via `.clay` base class (hard bottom shadow `0 8px 0 0 <shadow-color>` + inner highlight) plus `.clay-{color}` variants. Fonts: Fredoka One (display) and Nunito (body). **No emojis anywhere in the UI.**

**Steps (`src/components/steps/`)**
`RegularUserSteps` and `PowerUserSteps` manage internal sub-step state. Single-select pill questions auto-advance after 220ms; multi-select and sliders require an explicit Continue. `LoadingStep` uses a `hasAdvanced` ref guard to prevent double-fire in React StrictMode.

**Testing**
Vitest + jsdom + @testing-library/react. Tests live in `src/**/__tests__/`. The `vite.config.ts` must import from `vitest/config` (not `vite`) to support the `test` field.

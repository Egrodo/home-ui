# Technical Debt

Identified 2026-02-23. Work through these to improve maintainability.

## Critical Issues

| File                               | Line  | Issue                                                                                                                                  |
| ---------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/data/stores.ts`           | 48-55 | **"BULLSHIT HACK"** - Manually deleting `last_changed`, `last_updated`, rate limit fields from `light.tv_lights` to prevent re-renders |
| `src/routes/+layout.ts`            | 11    | TODO: Device registry never updates after initial load                                                                                 |
| `src/lib/components/slider.svelte` | 78    | Hardcoded track width `342px` breaks responsiveness                                                                                    |
| `src/lib/utils/debounce.ts`        | 1     | `@ts-nocheck` disables TypeScript for entire file                                                                                      |

## Duplicated Patterns (High Impact)

**Icon loading pattern** - Nearly identical in 3 files:

- `src/lib/groups/lights.svelte:29-45`
- `src/lib/groups/switches.svelte:33-59`
- `src/lib/groups/scenes.svelte:25-40`

**Room filtering logic** - Duplicated in same 3 files around lines 61-77

**JSON.stringify equality check** - Inefficient change detection in:

- `src/lib/groups/lights.svelte:30-32`
- `src/lib/groups/scenes.svelte:29-31`
- `src/lib/drawers/right.svelte:25-27`

## Type Safety Issues

| File                        | Line       | Issue                                           |
| --------------------------- | ---------- | ----------------------------------------------- |
| `src/lib/data/ws.ts`        | 66, 73, 78 | Multiple `@ts-expect-error` for type refinement |
| `src/lib/data/ws.ts`        | 286        | `catch (err: any)`                              |
| `src/lib/utils/debounce.ts` | 5          | `fn: Function` overly generic                   |

## Hardcoded Values

| File                                 | Value                       | Should Be            |
| ------------------------------------ | --------------------------- | -------------------- |
| `src/lib/data/ws.ts:31`              | `'donotshow'`               | Environment variable |
| `src/routes/pong/playing.svelte:9`   | `'light.sconce_2'`          | Config/env var       |
| `src/lib/data/pongEventBus.ts:15-16` | `'zha_event'`, `'pongBtn'`  | Config               |
| Multiple components                  | `500ms` debounce delay      | Shared constant      |
| Multiple components                  | `#666c94`, `#1F212E` colors | CSS variables        |

## Overly Large Components

| File                                    | Lines | Problem                                              |
| --------------------------------------- | ----- | ---------------------------------------------------- |
| `src/lib/components/colorPicker.svelte` | 484   | 400+ lines of inline SVG, mixed touch/click handling |
| `src/lib/drawers/right.svelte`          | 270   | Multi-mode control with heavy conditionals           |
| `src/lib/data/ws.ts`                    | 289   | Handles entity types, state, and connections         |

## Inconsistent Naming

- Components: `backBtn.svelte` vs `Loader.svelte` vs `ColorPicker.svelte`
- Props: `lightId` vs `entityid` (different casing)

## Console Logging in Production

- `src/lib/data/ws.ts:124` - Logs every WS message
- `src/lib/blocks/weather.svelte:45`
- `src/lib/data/pongEventBus.ts:36, 41, 53`

## Dead Code

- `src/routes/+page.svelte:18-41` - Large commented-out touch event block

## Missing Error Handling

- `src/lib/components/effectPicker.svelte:20-22` - No await/catch on `changeLightEffect()`
- `src/lib/drawers/main.svelte:27` - `toggleAreaState()` fire-and-forget

---

## Recommended Fix Order

1. Extract shared icon loading + room filtering utility
2. Replace JSON.stringify change detection with `deep-object-diff` (already a dependency)
3. Move hardcoded colors to CSS variables in `:global(body)`
4. Fix the TV_LIGHTS hack with a proper debounce/throttle at the store level
5. Split `colorPicker.svelte` - extract SVG to separate file

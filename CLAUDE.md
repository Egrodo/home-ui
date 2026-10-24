# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SvelteKit 2 webapp for controlling Home Assistant smart lights, switches, and scenes. It's designed for a fixed-resolution display (1080x1920) as a dedicated smart home controller interface.

## Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production (uses Node adapter)
- `pnpm check` - Type-check with svelte-check
- `pnpm lint` - Run Prettier and ESLint
- `pnpm format` - Auto-format with Prettier

## Architecture

### Data Layer (`src/lib/data/`)

- **ws.ts** - WebSocket connection to Home Assistant using `home-assistant-js-websocket`. Contains all service call functions (`toggleLightState`, `changeLightBrightness`, `changeLightColor`, etc.)
- **stores.ts** - Svelte stores for lights, switches, scenes, weather, and UI state (selected room, selected light)
- **types.ts** - TypeScript types for Home Assistant entities (`LightEntity`, `SwitchEntity`, `SceneEntity`, etc.) and app state

### Connection Flow

1. `+layout.ts` initializes the WebSocket connection on load (client-side only)
2. `subscribeEntities()` from home-assistant-js-websocket subscribes to all entity state changes
3. `handleStateMessage()` in ws.ts filters and routes updates to the appropriate stores

### UI Structure

The main layout uses a three-panel drawer system:

- **Left drawer** - Home name, date/time, weather, wifi status
- **Main drawer** - Room selector tabs, device controls (lights, switches, scenes)
- **Right drawer** - Detailed light control panel (color picker, temperature, effects, brightness)

### Environment Variables

Required in `.env`:

- `PUBLIC_WS_AUTH_KEY` - Home Assistant long-lived access token
- `PUBLIC_SERVER_URL` - Home Assistant server URL
- `PUBLIC_WEATHER_ENTITY_ID` - Entity ID for weather display
- `PUBLIC_HOME_NAME` - Display name for the home
- `PUBLIC_CALENDAR_ENTITY_ID` - Entity ID for the calendar panel
- `PUBLIC_AIR_QUALITY_DEVICE` - Entity slug of the Airthings air-quality device (e.g. `air_qualington`); the six `sensor.<slug>_*` entity IDs are derived from it in `ws.ts`

### Room Configuration

Rooms are defined in `src/lib/data/types.ts` as an enum mapping display names to Home Assistant area IDs in `ws.ts:getAreaIds()`.

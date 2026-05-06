# AGENTS.md - Bool Sinuca Premiere

Condensed instructions for future agent sessions.

## Project Overview

Bool Sinuca Premiere is a Next.js 14 + TypeScript pool/billiards game prototype.

The project has:
- local/BOT gameplay;
- multiplayer flow;
- custom in-house 2D pool physics;
- aim prediction overlay;
- Supabase Edge Function for multiplayer shot validation.

Do not assume this is a purely frontend-only project anymore.

## Key Technologies

- Framework: Next.js 14 App Router
- Language: TypeScript
- UI: React + Tailwind CSS
- State: Zustand
- Animations: Framer Motion
- i18n: next-intl
- Multiplayer validation: Supabase Edge Function
- Local persistence: localStorage/Zustand where applicable

## Developer Commands

- `npm run dev`: start development server.
- `npm run build`: production build.
- `npm run lint`: run ESLint.
- `npm run type-check`: run TypeScript check.
- `npm run test:e2e`: run Playwright tests, if needed.

No broad automated unit/integration test suite is currently configured.

## Core Game Files

Important files:

- `src/lib/engine/gameEngine.ts`
  - custom game engine;
  - physics;
  - turns;
  - bot logic;
  - rules;
  - ball movement.

- `src/components/game/GameScreen.tsx`
  - main gameplay orchestration;
  - timer/local turn flow;
  - input state;
  - engine subscription.

- `src/components/game/MatchTable.tsx`
  - table composition;
  - canvas + overlays.

- `src/components/game/AimOverlay.tsx`
  - cue rendering;
  - aim line;
  - ghost/target prediction;
  - yellow target guide.

- `src/components/game/input/TouchDragInput.tsx`
  - mobile/touch shot input;
  - cue ball placement.

- `src/components/game/input/MousePullBackInput.tsx`
  - desktop/mouse shot input;
  - cue ball placement.

- `src/components/mobile/game/MultiplayerGameScreen.tsx`
  - multiplayer screen orchestration;
  - room state;
  - synced timer;
  - multiplayer turn/input control.

- `src/hooks/useMultiplayer.ts`
  - multiplayer room/session hooks.

- `src/lib/multiplayer/client.ts`
  - multiplayer client operations.

- `supabase/functions/validate-shot/index.ts`
  - authoritative multiplayer shot validation / turn resolution.

## Recent Important Fixes

The following fixes are important and must not be casually reverted:

1. Pool physics improved:
   - ball-ball collision improved;
   - substeps added;
   - friction/stop behavior improved.

2. Aim prediction improved:
   - first interference detection;
   - cue line stops at ball or rail;
   - yellow line limited to honest short direction guide;
   - aim constants aligned with engine.

3. Local timer fixed:
   - timer resets when player changes;
   - timer resets when shot ends.

4. Multiplayer turn/timer fixed:
   - `validate-shot` bug fixed.
   - Important: `game_state.currentPlayer` represents the player who just played, not the next player.
   - `nextPlayerId` logic must invert correctly:
     - if `currentPlayer === 1`, next player is `player_2_id`;
     - if `currentPlayer === 2`, next player is `player_1_id`.

## Rules for Agents

Always follow these rules:

- Keep best practices.
- No `any` in TypeScript.
- No dynamic imports.
- Make minimal, focused, reversible changes.
- Audit before implementing.
- Do not refactor architecture unless explicitly requested.
- Do not change physics, timer, multiplayer, layout, or Supabase in the same task unless the task explicitly requires it.
- Do not commit unless explicitly approved.
- Always run:
  - `npm run type-check`
  - `npm run build`
  - `git status --short`

## Scope Discipline

When working on aim/UI:
- prefer changes in `AimOverlay.tsx`, `MatchTable.tsx`, or `GameScreen.tsx`;
- do not touch `gameEngine.ts` unless physics is explicitly in scope.

When working on local timer:
- prefer `GameScreen.tsx`;
- do not touch multiplayer or Supabase.

When working on multiplayer timer/turn:
- inspect `MultiplayerGameScreen.tsx`, `useMultiplayer.ts`, `client.ts`, and `validate-shot`;
- do not patch only the HUD if the authoritative room state is wrong.

When working on physics:
- prefer minimal changes in `gameEngine.ts`;
- preserve existing rules, bot flow, pockets, and turn handling.

When working on i18n:
- update `pt.json`, `en.json`, and `es.json`.

## Current UX Issues To Address Later

Pending/possible future lotes:

1. Ball-in-hand UX:
   - banner/input must only appear when it is the local player's turn.

2. Idle cue:
   - cue should appear automatically when it is the local player's turn and balls are stopped.

3. Close target yellow guide:
   - yellow line should start at the target ball edge, not through the ball center.
   - hide or shorten if the target is too close/unstable.

## When In Doubt

Stop and report:
- files analyzed;
- proposed files to change;
- risk;
- commands to validate.

Do not make broad speculative edits.

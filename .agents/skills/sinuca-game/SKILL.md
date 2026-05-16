---
name: sinuca-game
description: Use for work on the Bool Sinuca Premiere project, a Next.js 14 TypeScript pool game with custom 2D physics, aim prediction, local/BOT gameplay, multiplayer flow, and Supabase Edge Function shot validation.
---

# Bool Sinuca Premiere

Use this skill whenever the user asks to work on this sinuca/pool project.

## Project Shape

- Next.js 14 App Router with TypeScript.
- UI: React, Tailwind CSS, Framer Motion, next-intl.
- State: Zustand plus localStorage where applicable.
- Gameplay: custom in-house 2D pool physics, local/BOT flow, aim prediction overlay.
- Multiplayer: room/session hooks and Supabase Edge Function authoritative shot validation.

This is not a frontend-only project. Multiplayer state and shot validation may involve Supabase.

## First Moves

1. Audit before editing. Read the files relevant to the requested area.
2. Keep changes minimal, focused, and reversible.
3. Do not refactor architecture unless explicitly requested.
4. Do not commit unless the user explicitly approves.
5. Avoid `any` in TypeScript and avoid dynamic imports.

## Key Files

- `src/lib/engine/gameEngine.ts`: custom physics, collisions, turns, rules, bot logic.
- `src/components/game/GameScreen.tsx`: local gameplay orchestration, timer, input state.
- `src/components/game/MatchTable.tsx`: table composition, canvas, overlays.
- `src/components/game/AimOverlay.tsx`: cue, aim line, ghost/target prediction, yellow guide.
- `src/components/game/input/TouchDragInput.tsx`: mobile/touch shot input and cue ball placement.
- `src/components/game/input/MousePullBackInput.tsx`: desktop/mouse shot input and cue ball placement.
- `src/components/mobile/game/MultiplayerGameScreen.tsx`: multiplayer screen, room state, synced timer.
- `src/hooks/useMultiplayer.ts`: multiplayer room/session hooks.
- `src/lib/multiplayer/client.ts`: multiplayer client operations.
- `supabase/functions/validate-shot/index.ts`: authoritative multiplayer shot validation and turn resolution.

## Scope Rules

- Aim/UI work: prefer `AimOverlay.tsx`, `MatchTable.tsx`, or `GameScreen.tsx`.
- Local timer work: prefer `GameScreen.tsx`; do not touch multiplayer or Supabase unless required.
- Multiplayer timer/turn work: inspect `MultiplayerGameScreen.tsx`, `useMultiplayer.ts`, `client.ts`, and `validate-shot`.
- Physics work: prefer minimal edits in `gameEngine.ts`; preserve rules, bot flow, pockets, and turn handling.
- i18n work: update `pt.json`, `en.json`, and `es.json` together.

Do not mix physics, timer, multiplayer, layout, or Supabase changes in the same task unless the user explicitly asks for that combined scope.

## Important Existing Fixes

Do not casually revert these behaviors:

- Ball-ball collision, substeps, friction, and stop behavior were improved.
- Aim prediction includes first-interference detection, cue line stopping at ball/rail, a short honest yellow target guide, and constants aligned with the engine.
- Local timer resets when the player changes and when a shot ends.
- Multiplayer turn/timer was fixed in `validate-shot`.

For multiplayer turn resolution, `game_state.currentPlayer` represents the player who just played, not the next player:

- if `currentPlayer === 1`, next player is `player_2_id`;
- if `currentPlayer === 2`, next player is `player_1_id`.

## Validation

After code changes, run:

```bash
npm run type-check
npm run build
git status --short
```

Run `npm run lint` or `npm run test:e2e` when the requested change touches areas where those checks add useful signal.

## When Unsure

Stop and report:

- files analyzed;
- proposed files to change;
- risk;
- commands to validate.

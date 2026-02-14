// src/lib/decision.ts
// ─── Decision logic for dinner picker (pure functions, no IO) ───

import type { MainGenre, Carb, Menu } from "./menus";

// ─── Types ───

export type Mode = "genre" | "dessert" | "carb" | "random";

export interface Filter {
  /** Required when mode is "genre" */
  mainGenre?: MainGenre;
  /** Required when mode is "carb" — only "米" or "麺" */
  carb?: "米" | "麺";
  mode: Mode;
}

// ─── Core functions ───

/**
 * Return the subset of `menus` that match the given `filter`.
 *
 * Rules:
 *  - "random"  → everything EXCEPT デザート
 *  - "carb"    → match carb value OR carb="どちらでもない", EXCEPT デザート
 *  - "genre"   → match mainGenre (not デザート by definition of selectable genres)
 *  - "dessert" → only デザート
 */
export function getCandidates(menus: Menu[], filter: Filter): Menu[] {
  switch (filter.mode) {
    case "random":
      return menus.filter((m) => m.mainGenre !== "デザート");

    case "carb": {
      const target = filter.carb;
      if (!target) return [];
      return menus.filter(
        (m) =>
          m.mainGenre !== "デザート" &&
          (m.carb === target || m.carb === "どちらでもない"),
      );
    }

    case "genre": {
      const genre = filter.mainGenre;
      if (!genre) return [];
      return menus.filter((m) => m.mainGenre === genre);
    }

    case "dessert":
      return menus.filter((m) => m.mainGenre === "デザート");

    default: {
      // exhaustive check
      const _never: never = filter.mode;
      throw new Error(`Unknown mode: ${_never}`);
    }
  }
}

/**
 * Pick one random menu from `candidates`.
 * Returns `null` if the array is empty.
 */
export function pickOne(candidates: Menu[]): Menu | null {
  if (candidates.length === 0) return null;
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx]!;
}

/**
 * High-level entry point: filter → pick.
 *
 * `prevId` is accepted for API symmetry ("これはやだ" flow),
 * but repetition IS allowed, so it is intentionally unused.
 */
export function decideNext(
  menus: Menu[],
  filter: Filter,
  _prevId?: string,
): { result: Menu | null; candidatesCount: number } {
  const candidates = getCandidates(menus, filter);
  const result = pickOne(candidates);
  return { result, candidatesCount: candidates.length };
}

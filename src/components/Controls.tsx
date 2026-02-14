// src/components/Controls.tsx
"use client";

import type { Filter } from "@/lib/decision";
import type { MainGenre } from "@/lib/menus";

interface Props {
  onSelect: (filter: Filter) => void;
  onReroll: () => void;
  activeFilter: Filter | null;
  hasResult: boolean;
}

type ButtonDef = {
  label: string;
  filter: Filter;
  color: string;
};

const GENRE_BUTTONS: ButtonDef[] = [
  { label: "和食", filter: { mode: "genre", mainGenre: "和食" }, color: "washoku" },
  { label: "洋食", filter: { mode: "genre", mainGenre: "洋食" }, color: "yoshoku" },
  { label: "中華", filter: { mode: "genre", mainGenre: "中華" }, color: "chuka" },
  { label: "その他", filter: { mode: "genre", mainGenre: "その他" }, color: "sonota" },
];

const DESSERT_BUTTON: ButtonDef = {
  label: "デザート",
  filter: { mode: "dessert" },
  color: "dessert",
};

const CARB_BUTTONS: ButtonDef[] = [
  { label: "米が食べたい", filter: { mode: "carb", carb: "米" }, color: "rice" },
  { label: "麺が食べたい", filter: { mode: "carb", carb: "麺" }, color: "noodle" },
];

const RANDOM_BUTTON: ButtonDef = {
  label: "🎲 ランダム",
  filter: { mode: "random" },
  color: "random",
};

function isActiveFilter(a: Filter | null, b: Filter): boolean {
  if (!a) return false;
  if (a.mode !== b.mode) return false;
  if (a.mode === "genre" && b.mode === "genre") return a.mainGenre === b.mainGenre;
  if (a.mode === "carb" && b.mode === "carb") return a.carb === b.carb;
  return true;
}

export function Controls({ onSelect, onReroll, activeFilter, hasResult }: Props) {
  const renderBtn = (def: ButtonDef) => {
    const active = isActiveFilter(activeFilter, def.filter);
    return (
      <button
        key={def.label}
        className={`btn ${active ? "active" : ""}`}
        data-color={def.color}
        onClick={() => onSelect(def.filter)}
        type="button"
      >
        {def.label}
      </button>
    );
  };

  return (
    <div className="controls">
      {/* Genre row */}
      <span className="btn-group-label">ジャンルで選ぶ</span>
      <div className="btn-row">
        {GENRE_BUTTONS.map(renderBtn)}
      </div>

      {/* Dessert */}
      <div className="btn-row">
        {renderBtn(DESSERT_BUTTON)}
      </div>

      {/* Carb row */}
      <span className="btn-group-label">主食で選ぶ</span>
      <div className="btn-row">
        {CARB_BUTTONS.map(renderBtn)}
      </div>

      {/* Random + Reroll */}
      <span className="btn-group-label">おまかせ</span>
      <div className="btn-row">
        {renderBtn(RANDOM_BUTTON)}
        <button
          className="btn btn-reroll"
          onClick={onReroll}
          disabled={!hasResult}
          type="button"
          style={{ opacity: hasResult ? 1 : 0.4 }}
        >
          これはやだ
        </button>
      </div>
    </div>
  );
}

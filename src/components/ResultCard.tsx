// src/components/ResultCard.tsx
"use client";

import type { Menu } from "@/lib/menus";

interface Props {
  menu: Menu;
}

export function ResultCard({ menu }: Props) {
  return (
    <div className="result-card">
      <div className="dish-name">{menu.name}</div>
      <div className="tags">
        <span className="tag">{menu.mainGenre}</span>
        <span className="tag">
          {menu.carb === "どちらでもない" ? "─" : menu.carb}
        </span>
      </div>
    </div>
  );
}

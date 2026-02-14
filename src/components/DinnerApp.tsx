// src/components/DinnerApp.tsx
"use client";

import { useState, useCallback } from "react";
import type { Menu } from "@/lib/menus";
import type { Filter } from "@/lib/decision";
import { decideNext } from "@/lib/decision";
import { Controls } from "./Controls";
import { ResultCard } from "./ResultCard";

interface Props {
  menus: Menu[];
}

type State = {
  filter: Filter | null;
  result: Menu | null;
  candidatesCount: number;
  hasDecided: boolean;
};

export function DinnerApp({ menus }: Props) {
  const [state, setState] = useState<State>({
    filter: null,
    result: null,
    candidatesCount: 0,
    hasDecided: false,
  });

  const handleSelect = useCallback(
    (filter: Filter) => {
      const { result, candidatesCount } = decideNext(menus, filter);
      setState({ filter, result, candidatesCount, hasDecided: true });
    },
    [menus],
  );

  const handleReroll = useCallback(() => {
    if (!state.filter) return;
    const { result, candidatesCount } = decideNext(
      menus,
      state.filter,
      state.result?.id,
    );
    setState((prev) => ({ ...prev, result, candidatesCount }));
  }, [menus, state.filter, state.result?.id]);

  return (
    <>
      <Controls
        onSelect={handleSelect}
        onReroll={handleReroll}
        activeFilter={state.filter}
        hasResult={state.result !== null}
      />
      <div className="result-area">
        {!state.hasDecided ? (
          <p className="placeholder">
            ↑ 気分に合ったボタンをタップ！
          </p>
        ) : state.result ? (
          <ResultCard key={state.result.id + Math.random()} menu={state.result} />
        ) : (
          <div className="error-msg">
            該当するメニューがありません…
            <br />
            別の条件を試してみてください
          </div>
        )}
      </div>
    </>
  );
}

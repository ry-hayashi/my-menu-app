// src/app/page.tsx
import { loadMenusFromPublicCSV } from "@/lib/menus";
import { DinnerApp } from "@/components/DinnerApp";

export default async function Home() {
  const menus = await loadMenusFromPublicCSV();

  return (
    <main className="page">
      <header className="header">
        <h1>今日のごはん</h1>
        <p>ボタンを押して、今夜のメニューを決めよう</p>
      </header>
      <div className="noren-line" />
      <DinnerApp menus={menus} />
    </main>
  );
}

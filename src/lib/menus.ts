// src/lib/menus.ts
// ─── CSV Loader for Menu data ───
// Compatible with static export (no Node fs/crypto at top-level).
// Node APIs are dynamically imported only at build time (SSG).

// ─── Types ───

export const MAIN_GENRES = ["和食", "洋食", "中華", "その他", "デザート"] as const;
export type MainGenre = (typeof MAIN_GENRES)[number];

export const CARBS = ["米", "麺", "どちらでもない"] as const;
export type Carb = (typeof CARBS)[number];

export interface Menu {
  id: string;
  name: string;
  mainGenre: MainGenre;
  carb: Carb;
}

// ─── Helpers ───

/**
 * Deterministic ID via murmurhash-inspired hash (no Node crypto).
 */
function stableId(name: string, mainGenre: string, carb: string): string {
  const str = `${name}\t${mainGenre}\t${carb}`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return combined.toString(36).padStart(11, "0");
}

/**
 * Minimal CSV line parser (handles quoted values).
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  const len = line.length;

  while (i <= len) {
    if (i === len) {
      fields.push("");
      break;
    }
    if (line[i] === '"') {
      i++;
      let value = "";
      while (i < len) {
        if (line[i] === '"') {
          if (i + 1 < len && line[i + 1] === '"') {
            value += '"';
            i += 2;
          } else {
            i++;
            break;
          }
        } else {
          value += line[i];
          i++;
        }
      }
      fields.push(value);
      if (i < len && line[i] === ",") i++;
    } else {
      const nextComma = line.indexOf(",", i);
      if (nextComma === -1) {
        fields.push(line.slice(i));
        break;
      } else {
        fields.push(line.slice(i, nextComma));
        i = nextComma + 1;
      }
    }
  }
  return fields;
}

function isMainGenre(v: string): v is MainGenre {
  return (MAIN_GENRES as readonly string[]).includes(v);
}

function isCarb(v: string): v is Carb {
  return (CARBS as readonly string[]).includes(v);
}

// ─── Parse from raw CSV text (pure function, works anywhere) ───

export function parseMenusFromCSVText(raw: string): Menu[] {
  const lines = raw.split(/\r?\n/);

  const headerIdx = lines.findIndex((l) => l.trim() !== "");
  if (headerIdx === -1) {
    throw new Error("menus.csv is empty or contains only blank lines.");
  }

  const header = parseCSVLine(lines[headerIdx]).map((h) => h.trim());
  const expectedHeader = ["name", "mainGenre", "carb"];
  if (
    header.length < expectedHeader.length ||
    !expectedHeader.every((h, i) => header[i] === h)
  ) {
    throw new Error(
      `menus.csv: unexpected header. Expected [${expectedHeader.join(",")}] but got [${header.join(",")}]`,
    );
  }

  const menus: Menu[] = [];
  const errors: string[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    const rowNum = i + 1;
    if (line.trim() === "") continue;

    const cols = parseCSVLine(line).map((c) => c.trim());
    const [name, mainGenre, carb] = cols;
    if (!name) continue;

    const rowErrors: string[] = [];
    if (!isMainGenre(mainGenre ?? "")) {
      rowErrors.push(`mainGenre="${mainGenre}" is not one of [${MAIN_GENRES.join(",")}]`);
    }
    if (!isCarb(carb ?? "")) {
      rowErrors.push(`carb="${carb}" is not one of [${CARBS.join(",")}]`);
    }

    if (rowErrors.length > 0) {
      errors.push(`Row ${rowNum}: ${rowErrors.join("; ")}`);
      continue;
    }

    menus.push({
      id: stableId(name, mainGenre!, carb!),
      name,
      mainGenre: mainGenre as MainGenre,
      carb: carb as Carb,
    });
  }

  if (errors.length > 0) {
    throw new Error(`menus.csv validation failed:\n${errors.join("\n")}`);
  }

  return menus;
}

// ─── Build-time loader (SSG only — never runs on the edge) ───

export async function loadMenusFromPublicCSV(): Promise<Menu[]> {
  const { readFileSync } = await import("fs");
  const { join } = await import("path");
  const csvPath = join(process.cwd(), "public", "menus.csv");
  const raw = readFileSync(csvPath, "utf-8");
  return parseMenusFromCSVText(raw);
}

// src/lib/menus.ts
// ─── CSV Loader for Menu data (server-side only) ───

import { readFileSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

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
 * Deterministic ID from row content (SHA-256 truncated to 12 hex chars).
 */
function stableId(name: string, mainGenre: string, carb: string): string {
  const hash = createHash("sha256")
    .update(`${name}\t${mainGenre}\t${carb}`)
    .digest("hex");
  return hash.slice(0, 12);
}

/**
 * Minimal CSV line parser that handles:
 *  - bare values:   a,b,c
 *  - quoted values:  "a,b","c"   (double-quote escaping "")
 *  - mixed:          a,"b""c",d
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  const len = line.length;

  while (i <= len) {
    if (i === len) {
      // trailing comma → empty field
      fields.push("");
      break;
    }

    if (line[i] === '"') {
      // Quoted field
      i++; // skip opening quote
      let value = "";
      while (i < len) {
        if (line[i] === '"') {
          if (i + 1 < len && line[i + 1] === '"') {
            // escaped quote
            value += '"';
            i += 2;
          } else {
            // closing quote
            i++; // skip closing quote
            break;
          }
        } else {
          value += line[i];
          i++;
        }
      }
      fields.push(value);
      // skip comma (or end)
      if (i < len && line[i] === ",") i++;
    } else {
      // Unquoted field
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

// ─── Guard functions ───

function isMainGenre(v: string): v is MainGenre {
  return (MAIN_GENRES as readonly string[]).includes(v);
}

function isCarb(v: string): v is Carb {
  return (CARBS as readonly string[]).includes(v);
}

// ─── Main loader ───

/**
 * Reads `/public/menus.csv` from the project root (server-side only)
 * and returns a validated `Menu[]`.
 *
 * Throws an `Error` listing every validation issue if any row is invalid.
 */
export async function loadMenusFromPublicCSV(): Promise<Menu[]> {
  const csvPath = join(process.cwd(), "public", "menus.csv");
  const raw = readFileSync(csvPath, "utf-8");

  const lines = raw.split(/\r?\n/);

  // First non-empty line must be the header
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
      `menus.csv: unexpected header. Expected [${expectedHeader.join(",")}] but got [${header.join(",")}]`
    );
  }

  const menus: Menu[] = [];
  const errors: string[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    const rowNum = i + 1; // 1-based for human-readable messages

    // Skip completely empty lines
    if (line.trim() === "") continue;

    const cols = parseCSVLine(line).map((c) => c.trim());
    const [name, mainGenre, carb] = cols;

    // Skip lines with empty name
    if (!name) continue;

    const rowErrors: string[] = [];

    if (!isMainGenre(mainGenre ?? "")) {
      rowErrors.push(
        `mainGenre="${mainGenre}" is not one of [${MAIN_GENRES.join(",")}]`
      );
    }
    if (!isCarb(carb ?? "")) {
      rowErrors.push(
        `carb="${carb}" is not one of [${CARBS.join(",")}]`
      );
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
    throw new Error(
      `menus.csv validation failed:\n${errors.join("\n")}`
    );
  }

  return menus;
}

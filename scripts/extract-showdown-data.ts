import fs from "fs";
import path from "path";
import { Dex as Showdown } from "pokemon-showdown";
import { fileURLToPath } from "url";

interface NameMap {
  [key: string]: string;
}

interface NameMapEntry {
  id: number;
  englishName: string;
  japaneseName: string;
  [key: string]: unknown;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "packages/shared/src/data/showdown");

/**
 * 既存の日本語名マップJSONを読み込み、englishName → japaneseName のフラットマップに変換
 */
function loadNameMap(filename: string): NameMap {
  const filePath = path.join(
    projectRoot,
    "packages/shared/src/data",
    filename
  );
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const raw: Record<string, NameMapEntry> = JSON.parse(content);
    const result: NameMap = {};
    for (const entry of Object.values(raw)) {
      if (entry.englishName && entry.japaneseName) {
        result[entry.englishName] = entry.japaneseName;
      }
    }
    return result;
  } catch {
    console.warn(`Warning: Could not load ${filename}, continuing without it`);
    return {};
  }
}

/**
 * 英語名またはキーを正規化（小文字、スペース削除）
 */
function normalizeId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "");
}

/**
 * ShowdownのID形式に変換
 */
function toShowdownId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Showdownデータから日本語名をマップから取得
 */
function getJapaneseName(englishName: string, nameMap: NameMap): string {
  const normalized = normalizeId(englishName);
  for (const [key, value] of Object.entries(nameMap)) {
    if (normalizeId(key) === normalized) {
      return value;
    }
  }
  return englishName;
}

/**
 * Gen9スペシーズデータを抽出
 */
function extractSpecies(): number {
  console.log("Extracting species data...");

  const pokemonNameMap = loadNameMap("pokemon-name-map.json");
  const dex = Showdown.mod("gen9");

  const species: Record<string, unknown> = {};
  let count = 0;

  for (const showdownSpecies of dex.species.all()) {
    if (!showdownSpecies.exists || showdownSpecies.num <= 0) continue;

    const id = toShowdownId(showdownSpecies.id);
    species[id] = {
      id,
      num: showdownSpecies.num,
      name: showdownSpecies.name,
      nameJa: getJapaneseName(showdownSpecies.name, pokemonNameMap),
      types: showdownSpecies.types,
      baseStats: {
        hp: showdownSpecies.baseStats.hp,
        atk: showdownSpecies.baseStats.atk,
        def: showdownSpecies.baseStats.def,
        spa: showdownSpecies.baseStats.spa,
        spd: showdownSpecies.baseStats.spd,
        spe: showdownSpecies.baseStats.spe,
      },
      abilities: showdownSpecies.abilities,
      weightkg: showdownSpecies.weightkg,
      heightm: showdownSpecies.heightm,
    };
    count++;
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, "species.json"),
    JSON.stringify(species, null, 2),
    "utf-8"
  );

  console.log(`  Extracted ${count} species`);
  return count;
}

/**
 * Gen9技データを抽出
 */
function extractMoves(): number {
  console.log("Extracting move data...");

  const moveNameMap = loadNameMap("move-name-map.json");
  const dex = Showdown.mod("gen9");

  const moves: Record<string, unknown> = {};
  let count = 0;

  for (const showdownMove of dex.moves.all()) {
    if (!showdownMove.exists || showdownMove.num <= 0) continue;

    const id = toShowdownId(showdownMove.id);
    moves[id] = {
      id,
      num: showdownMove.num,
      name: showdownMove.name,
      nameJa: getJapaneseName(showdownMove.name, moveNameMap),
      type: showdownMove.type,
      category: showdownMove.category,
      basePower: showdownMove.basePower,
      accuracy: showdownMove.accuracy,
      pp: showdownMove.pp,
      priority: showdownMove.priority,
      target: showdownMove.target,
      shortDesc: showdownMove.shortDesc || "",
    };
    count++;
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, "moves.json"),
    JSON.stringify(moves, null, 2),
    "utf-8"
  );

  console.log(`  Extracted ${count} moves`);
  return count;
}

/**
 * Gen9特性データを抽出
 */
function extractAbilities(): number {
  console.log("Extracting ability data...");

  const abilityNameMapPath = path.join(
    projectRoot,
    "packages/shared/src/data",
    "ability-name-map.json"
  );
  let abilityNameEntries: Record<string, AbilityNameEntry> = {};
  try {
    const content = fs.readFileSync(abilityNameMapPath, "utf-8");
    abilityNameEntries = JSON.parse(content);
  } catch {
    console.warn("Warning: Could not load ability-name-map.json");
  }

  // 英語名→日本語名のルックアップ構築
  const englishToJa: Record<string, string> = {};
  for (const entry of Object.values(abilityNameEntries)) {
    englishToJa[entry.englishName.toLowerCase().replace(/[^a-z0-9]/g, "")] =
      entry.japaneseName;
  }

  const dex = Showdown.mod("gen9");
  const abilities: Record<string, unknown> = {};
  let count = 0;

  for (const showdownAbility of dex.abilities.all()) {
    if (!showdownAbility.exists || showdownAbility.num <= 0) continue;

    const id = toShowdownId(showdownAbility.id);
    const normalizedName = showdownAbility.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const nameJa = englishToJa[normalizedName] || showdownAbility.name;

    abilities[id] = {
      id,
      num: showdownAbility.num,
      name: showdownAbility.name,
      nameJa,
      shortDesc: showdownAbility.shortDesc || "",
    };
    count++;
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, "abilities.json"),
    JSON.stringify(abilities, null, 2),
    "utf-8"
  );

  console.log(`  Extracted ${count} abilities`);
  return count;
}

/**
 * Gen9アイテムデータを抽出
 */
function extractItems(): number {
  console.log("Extracting item data...");

  const itemNameMap = loadNameMap("item-name-map.json");
  const dex = Showdown.mod("gen9");

  const items: Record<string, unknown> = {};
  let count = 0;

  for (const showdownItem of dex.items.all()) {
    if (!showdownItem.exists || showdownItem.num <= 0) continue;

    const id = toShowdownId(showdownItem.id);
    items[id] = {
      id,
      num: showdownItem.num,
      name: showdownItem.name,
      nameJa: getJapaneseName(showdownItem.name, itemNameMap),
      desc: showdownItem.desc || "",
      shortDesc: showdownItem.shortDesc || "",
    };
    count++;
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, "items.json"),
    JSON.stringify(items, null, 2),
    "utf-8"
  );

  console.log(`  Extracted ${count} items`);
  return count;
}

/**
 * 習得技データを抽出
 */
async function extractLearnsets(): Promise<number> {
  console.log("Extracting learnset data...");

  const dex = Showdown.mod("gen9");
  const learnsets: Record<string, string[]> = {};
  let count = 0;

  for (const species of dex.species.all()) {
    if (!species.exists || species.num <= 0) continue;

    const learnsetData = await dex.species.getLearnsetData(species.id);
    if (!learnsetData?.learnset) continue;

    const pokemonId = toShowdownId(species.id);
    learnsets[pokemonId] = Object.keys(learnsetData.learnset);
    count++;
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, "learnsets.json"),
    JSON.stringify(learnsets, null, 2),
    "utf-8"
  );

  console.log(`  Extracted ${count} learnsets`);
  return count;
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  console.log("Starting Pokemon Showdown data extraction...\n");

  try {
    const speciesCount = extractSpecies();
    const movesCount = extractMoves();
    const abilitiesCount = extractAbilities();
    const itemsCount = extractItems();
    const learnsetsCount = await extractLearnsets();

    console.log(
      `\nExtracted: ${speciesCount} species, ${movesCount} moves, ${abilitiesCount} abilities, ${itemsCount} items, ${learnsetsCount} learnsets`
    );
    console.log("Output: packages/shared/src/data/showdown/");
  } catch (error) {
    console.error("Error during extraction:", error);
    process.exit(1);
  }
}

main();

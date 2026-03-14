import fs from 'fs';
import path from 'path';
import { Dex as Showdown } from 'pokemon-showdown';
import { fileURLToPath } from 'url';

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
const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'packages/shared/src/data/showdown');

/**
 * 既存の日本語名マップJSONを読み込み、正規化キー → japaneseName のルックアップを構築
 */
function loadNameMap(filename: string): NameMap {
  const filePath = path.join(projectRoot, 'packages/shared/src/data', filename);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const raw: Record<string, NameMapEntry> = JSON.parse(content);
    const result: NameMap = {};
    for (const entry of Object.values(raw)) {
      if (entry.englishName && entry.japaneseName) {
        // 正規化キーで登録（ハイフン・スペース・記号をすべて除去）
        const key = entry.englishName.toLowerCase().replace(/[^a-z0-9]/g, '');
        result[key] = entry.japaneseName;
      }
    }
    return result;
  } catch {
    console.warn(`Warning: Could not load ${filename}, continuing without it`);
    return {};
  }
}

/**
 * 英語名を正規化（小文字、記号除去）
 * Showdown名 "Aerial Ace" → "aerialace"
 * PokéAPI名 "aerial-ace" → "aerialace"
 */
function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * ShowdownのID形式に変換
 */
function toShowdownId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * 日本語名を取得（正規化ベースのルックアップ）
 * フォルム付きの場合（"Terapagos-Terastal"）、ベース名でフォールバック検索
 */
function getJapaneseName(englishName: string, nameMap: NameMap): string | null {
  // まず完全一致
  const fullKey = normalize(englishName);
  if (nameMap[fullKey]) {
    return nameMap[fullKey];
  }

  // フォルム付き名前の場合、ベース名で検索
  const hyphenIdx = englishName.indexOf('-');
  if (hyphenIdx > 0) {
    const baseName = englishName.substring(0, hyphenIdx);
    const baseKey = normalize(baseName);
    if (nameMap[baseKey]) {
      return nameMap[baseKey];
    }
  }

  return null;
}

/**
 * ポケモンのフォルム名を取得（"Terapagos-Terastal" → "テラスタル"）
 */
function getFormSuffix(name: string): string | null {
  const hyphenIdx = name.indexOf('-');
  if (hyphenIdx > 0) {
    return name.substring(hyphenIdx + 1);
  }
  return null;
}

/**
 * Gen9スペシーズデータを抽出
 */
function extractSpecies(): number {
  console.log('Extracting species data...');

  const pokemonNameMap = loadNameMap('pokemon-name-map.json');
  const dex = Showdown.mod('gen9');

  // VGC 2025 Reg G のルールテーブルで使用可能ポケモンをフィルタ
  const vgcFormat = dex.formats.get('gen9vgc2025regg');
  const ruleTable = dex.formats.getRuleTable(vgcFormat);

  const species: Record<string, unknown> = {};
  let count = 0;
  let skippedNoJa = 0;
  let skippedBanned = 0;

  for (const showdownSpecies of dex.species.all()) {
    if (!showdownSpecies.exists || showdownSpecies.num <= 0) continue;

    // ランクマッチで使用不可のポケモンをスキップ
    if (ruleTable.isBannedSpecies(showdownSpecies)) {
      skippedBanned++;
      continue;
    }

    const jaName = getJapaneseName(showdownSpecies.name, pokemonNameMap);
    // 日本語名がないエントリはスキップ
    if (!jaName) {
      skippedNoJa++;
      continue;
    }

    // フォルム付きの場合、表示名にフォルムを付加
    const formSuffix = getFormSuffix(showdownSpecies.name);
    const nameJa = formSuffix ? `${jaName} (${formSuffix})` : jaName;

    const id = toShowdownId(showdownSpecies.id);
    species[id] = {
      id,
      num: showdownSpecies.num,
      name: showdownSpecies.name,
      nameJa,
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
  fs.writeFileSync(path.join(outputDir, 'species.json'), JSON.stringify(species, null, 2), 'utf-8');

  console.log(
    `  Extracted ${count} species (skipped ${skippedBanned} banned, ${skippedNoJa} without Japanese name)`
  );
  return count;
}

/**
 * Gen9技データを抽出
 */
function extractMoves(): number {
  console.log('Extracting move data...');

  const moveNameMap = loadNameMap('move-name-map.json');
  const dex = Showdown.mod('gen9');

  const moves: Record<string, unknown> = {};
  let count = 0;
  let skippedNoJa = 0;

  for (const showdownMove of dex.moves.all()) {
    if (!showdownMove.exists || showdownMove.num <= 0) continue;

    const nameJa = getJapaneseName(showdownMove.name, moveNameMap);
    if (!nameJa) {
      skippedNoJa++;
      continue;
    }

    const id = toShowdownId(showdownMove.id);
    moves[id] = {
      id,
      num: showdownMove.num,
      name: showdownMove.name,
      nameJa,
      type: showdownMove.type,
      category: showdownMove.category,
      basePower: showdownMove.basePower,
      accuracy: showdownMove.accuracy,
      pp: showdownMove.pp,
      priority: showdownMove.priority,
      target: showdownMove.target,
      shortDesc: showdownMove.shortDesc || '',
    };
    count++;
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'moves.json'), JSON.stringify(moves, null, 2), 'utf-8');

  console.log(`  Extracted ${count} moves (skipped ${skippedNoJa} without Japanese name)`);
  return count;
}

/**
 * Gen9特性データを抽出
 */
function extractAbilities(): number {
  console.log('Extracting ability data...');

  const abilityNameMapPath = path.join(
    projectRoot,
    'packages/shared/src/data',
    'ability-name-map.json'
  );
  let abilityNameEntries: Record<string, NameMapEntry> = {};
  try {
    const content = fs.readFileSync(abilityNameMapPath, 'utf-8');
    abilityNameEntries = JSON.parse(content);
  } catch {
    console.warn('Warning: Could not load ability-name-map.json');
  }

  // 正規化キー → 日本語名 のルックアップ構築
  const abilityNameMap: NameMap = {};
  for (const entry of Object.values(abilityNameEntries)) {
    if (entry.englishName && entry.japaneseName) {
      const key = normalize(entry.englishName);
      abilityNameMap[key] = entry.japaneseName;
    }
  }

  const dex = Showdown.mod('gen9');
  const abilities: Record<string, unknown> = {};
  let count = 0;
  let skippedNoJa = 0;

  for (const showdownAbility of dex.abilities.all()) {
    if (!showdownAbility.exists || showdownAbility.num <= 0) continue;

    const nameJa = abilityNameMap[normalize(showdownAbility.name)];
    if (!nameJa) {
      skippedNoJa++;
      continue;
    }

    const id = toShowdownId(showdownAbility.id);
    abilities[id] = {
      id,
      num: showdownAbility.num,
      name: showdownAbility.name,
      nameJa,
      shortDesc: showdownAbility.shortDesc || '',
    };
    count++;
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, 'abilities.json'),
    JSON.stringify(abilities, null, 2),
    'utf-8'
  );

  console.log(`  Extracted ${count} abilities (skipped ${skippedNoJa} without Japanese name)`);
  return count;
}

/**
 * Gen9アイテムデータを抽出
 */
function extractItems(): number {
  console.log('Extracting item data...');

  const itemNameMap = loadNameMap('item-name-map.json');
  const dex = Showdown.mod('gen9');

  const items: Record<string, unknown> = {};
  let count = 0;
  let skippedNoJa = 0;

  for (const showdownItem of dex.items.all()) {
    if (!showdownItem.exists || showdownItem.num <= 0) continue;

    const nameJa = getJapaneseName(showdownItem.name, itemNameMap);
    if (!nameJa) {
      skippedNoJa++;
      continue;
    }

    const id = toShowdownId(showdownItem.id);
    items[id] = {
      id,
      num: showdownItem.num,
      name: showdownItem.name,
      nameJa,
      desc: showdownItem.desc || '',
      shortDesc: showdownItem.shortDesc || '',
    };
    count++;
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'items.json'), JSON.stringify(items, null, 2), 'utf-8');

  console.log(`  Extracted ${count} items (skipped ${skippedNoJa} without Japanese name)`);
  return count;
}

interface LearnsetEntry {
  level: string[];
  machine: string[];
}

/**
 * 習得技データを抽出（レベル技・思い出し技 / わざマシンで分類）
 * 方法コード: 9L = レベル技, 9R = 思い出し技, 9M = わざマシン
 */
async function extractLearnsets(): Promise<number> {
  console.log('Extracting learnset data...');

  const dex = Showdown.mod('gen9');

  // 抽出済み species の ID セットを取得（日本語名があるもののみ）
  const speciesJsonPath = path.join(outputDir, 'species.json');
  let validSpeciesIds: Set<string>;
  try {
    const speciesData = JSON.parse(fs.readFileSync(speciesJsonPath, 'utf-8'));
    validSpeciesIds = new Set(Object.keys(speciesData));
  } catch {
    validSpeciesIds = new Set();
  }

  const learnsets: Record<string, LearnsetEntry> = {};
  let count = 0;

  for (const species of dex.species.all()) {
    if (!species.exists || species.num <= 0) continue;

    const pokemonId = toShowdownId(species.id);
    if (!validSpeciesIds.has(pokemonId)) continue;

    const learnsetData = await dex.species.getLearnsetData(species.id);
    if (!learnsetData?.learnset) continue;

    const levelMoves = new Set<string>();
    const machineMoves = new Set<string>();

    for (const [moveId, methods] of Object.entries(learnsetData.learnset)) {
      for (const method of methods as string[]) {
        if (!method.startsWith('9')) continue;
        if (method.match(/^9[LR]/)) {
          levelMoves.add(moveId);
        } else if (method === '9M') {
          machineMoves.add(moveId);
        }
      }
    }

    if (levelMoves.size > 0 || machineMoves.size > 0) {
      learnsets[pokemonId] = {
        level: [...levelMoves],
        machine: [...machineMoves],
      };
      count++;
    }
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, 'learnsets.json'),
    JSON.stringify(learnsets, null, 2),
    'utf-8'
  );

  console.log(`  Extracted ${count} learnsets`);
  return count;
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  console.log('Starting Pokemon Showdown data extraction...\n');

  try {
    const speciesCount = extractSpecies();
    const movesCount = extractMoves();
    const abilitiesCount = extractAbilities();
    const itemsCount = extractItems();
    const learnsetsCount = await extractLearnsets();

    console.log(
      `\nExtracted: ${speciesCount} species, ${movesCount} moves, ${abilitiesCount} abilities, ${itemsCount} items, ${learnsetsCount} learnsets`
    );
    console.log('Output: packages/shared/src/data/showdown/');
  } catch (error) {
    console.error('Error during extraction:', error);
    process.exit(1);
  }
}

main();

/**
 * シードスクリプト（PokeAPIベース）
 * PokeAPIから直接データを取得し、DBに投入する
 */
import { resolve } from 'path';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  games,
  regulations,
  pokemon,
  moves,
  abilities,
  items,
  learnsets,
  regulationPokemon,
} from './schema';

dotenv.config({ path: resolve(__dirname, '../../../apps/web/.env.local') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL が設定されていません');
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

// ---------------------------------------------------------------------------
// PokeAPI レスポンス型定義
// ---------------------------------------------------------------------------

interface PokeApiNameEntry {
  language: { name: string };
  name: string;
}

interface PokeApiStatEntry {
  stat: { name: string };
  base_stat: number;
}

interface PokeApiTypeEntry {
  slot: number;
  type: { name: string };
}

interface PokeApiAbilityEntry {
  slot: number;
  is_hidden: boolean;
  ability: { name: string };
}

interface PokeApiMoveVersionDetail {
  version_group: { name: string };
  move_learn_method: { name: string };
  level_learned_at: number;
}

interface PokeApiMoveEntry {
  move: { name: string };
  version_group_details: PokeApiMoveVersionDetail[];
}

interface PokeApiEffectEntry {
  language: { name: string };
  short_effect: string;
}

interface PokeApiVariety {
  pokemon: { name: string; url: string };
  is_default: boolean;
}

interface PokeApiPokemonData {
  name: string;
  stats: PokeApiStatEntry[];
  types: PokeApiTypeEntry[];
  abilities: PokeApiAbilityEntry[];
  moves: PokeApiMoveEntry[];
  sprites: { front_default: string | null } | null;
  weight: number;
  height: number;
}

interface PokeApiSpeciesData {
  names: PokeApiNameEntry[];
  is_legendary: boolean;
  is_mythical: boolean;
  varieties: PokeApiVariety[];
  gender_rate: number;
}

interface PokeApiFormData {
  names: PokeApiNameEntry[];
}

interface PokeApiMoveData {
  id: number;
  name: string;
  names: PokeApiNameEntry[];
  type: { name: string };
  damage_class: { name: string };
  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
  target: { name: string };
  effect_entries: PokeApiEffectEntry[];
}

interface PokeApiAbilityData {
  id: number;
  name: string;
  names: PokeApiNameEntry[];
  effect_entries: PokeApiEffectEntry[];
}

interface PokeApiItemData {
  id: number;
  name: string;
  names: PokeApiNameEntry[];
  effect_entries: PokeApiEffectEntry[];
}

interface PokeApiItemCategoryData {
  items: Array<{ name: string }>;
}

// ---------------------------------------------------------------------------
// PokeAPI ヘルパー
// ---------------------------------------------------------------------------

async function fetchWithRetry<T>(url: string, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
      return (await res.json()) as T;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error(`fetchWithRetry failed: ${url}`);
}

async function parallelFetch<T>(
  items: string[],
  fn: (item: string) => Promise<T>,
  concurrency = 5
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    if (i + concurrency < items.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------

const ADDITIONAL_REG_I_POKEMON = [
  144, 145, 146, 150, 243, 244, 245, 249, 250, 377, 378, 379, 380, 381, 382, 383, 384, 480, 481,
  482, 483, 484, 485, 486, 487, 488, 638, 639, 640, 641, 642, 643, 644, 645, 646, 789, 790, 791,
  792, 800, 888, 889, 890, 891, 892, 894, 895, 896, 897, 898, 899, 901, 903, 905,
];

const RESTRICTED_POKEMON = new Set([
  150, 249, 250, 382, 383, 384, 483, 484, 487, 643, 644, 646, 789, 790, 791, 792, 800, 888, 889,
  890, 898, 1007, 1008, 1024,
]);

const SV_VERSION_GROUPS = new Set(['scarlet-violet', 'the-teal-mask', 'the-indigo-disk']);

// PokeAPIにSVデータがないポケモン用のフォールバック（HOME経由参加可能なポケモン）
const FALLBACK_VERSION_GROUPS = new Set(['sword-shield']);

const VALID_LEARN_METHODS = new Set(['level-up', 'machine', 'egg']);

// Showdown ID → PokeAPI item name 変換マップ
const SHOWDOWN_TO_POKEAPI_ITEM: Record<string, string> = {
  choiceband: 'choice-band',
  choicescarf: 'choice-scarf',
  choicespecs: 'choice-specs',
  lifeorb: 'life-orb',
  expertbelt: 'expert-belt',
  muscleband: 'muscle-band',
  wiseglasses: 'wise-glasses',
  metronome: 'metronome',
  scopelens: 'scope-lens',
  leftovers: 'leftovers',
  sitrusberry: 'sitrus-berry',
  assaultvest: 'assault-vest',
  eviolite: 'eviolite',
  rockyhelmet: 'rocky-helmet',
  blacksludge: 'black-sludge',
  focussash: 'focus-sash',
  focusband: 'focus-band',
  mentalherb: 'mental-herb',
  whiteherb: 'white-herb',
  powerherb: 'power-herb',
  safetygoggles: 'safety-goggles',
  lightclay: 'light-clay',
  occaberry: 'occa-berry',
  passhoberry: 'passho-berry',
  wacanberry: 'wacan-berry',
  rindoberry: 'rindo-berry',
  yacheberry: 'yache-berry',
  chopleberry: 'chople-berry',
  kebiaberry: 'kebia-berry',
  shucaberry: 'shuca-berry',
  cobaberry: 'coba-berry',
  payapaberry: 'payapa-berry',
  tangaberry: 'tanga-berry',
  chartiberry: 'charti-berry',
  kasibberry: 'kasib-berry',
  habanberry: 'haban-berry',
  colburberry: 'colbur-berry',
  babiriberry: 'babiri-berry',
  chilanberry: 'chilan-berry',
  roseliberry: 'roseli-berry',
  figyberry: 'figy-berry',
  wikiberry: 'wiki-berry',
  magoberry: 'mago-berry',
  aguavberry: 'aguav-berry',
  iapapaberry: 'iapapa-berry',
  lumberry: 'lum-berry',
  boosterenergy: 'booster-energy',
  electricseed: 'electric-seed',
  psychicseed: 'psychic-seed',
  mistyseed: 'misty-seed',
  grassyseed: 'grassy-seed',
  clearamulet: 'clear-amulet',
  mirrorherb: 'mirror-herb',
  punchingglove: 'punching-glove',
  covertcloak: 'covert-cloak',
  loadeddice: 'loaded-dice',
  weaknesspolicy: 'weakness-policy',
  throatspray: 'throat-spray',
  roomservice: 'room-service',
  heavydutyboots: 'heavy-duty-boots',
  blunderpolicy: 'blunder-policy',
  terrainextender: 'terrain-extender',
  absorbbulb: 'absorb-bulb',
  luminousmoss: 'luminous-moss',
  snowball: 'snowball',
  cellbattery: 'cell-battery',
  ejectbutton: 'eject-button',
  ejectpack: 'eject-pack',
  protectivepads: 'protective-pads',
  redcard: 'red-card',
  airballoon: 'air-balloon',
  shedshell: 'shed-shell',
  widelens: 'wide-lens',
  ironball: 'iron-ball',
  bindingband: 'binding-band',
  bigroot: 'big-root',
  lightball: 'light-ball',
  thickclub: 'thick-club',
};

const COMPETITIVE_ITEM_IDS = Object.keys(SHOWDOWN_TO_POKEAPI_ITEM);

// メガシンカポケモンID → メガストーン名 マッピング
const MEGA_STONE_MAP: Record<string, string> = {
  'venusaur-mega': 'venusaurite',
  'charizard-mega-x': 'charizardite-x',
  'charizard-mega-y': 'charizardite-y',
  'blastoise-mega': 'blastoisinite',
  'beedrill-mega': 'beedrillite',
  'pidgeot-mega': 'pidgeotite',
  'alakazam-mega': 'alakazite',
  'slowbro-mega': 'slowbronite',
  'gengar-mega': 'gengarite',
  'kangaskhan-mega': 'kangaskhanite',
  'pinsir-mega': 'pinsirite',
  'gyarados-mega': 'gyaradosite',
  'aerodactyl-mega': 'aerodactylite',
  'mewtwo-mega-x': 'mewtwonite-x',
  'mewtwo-mega-y': 'mewtwonite-y',
  'ampharos-mega': 'ampharosite',
  'steelix-mega': 'steelixite',
  'scizor-mega': 'scizorite',
  'heracross-mega': 'heracronite',
  'houndoom-mega': 'houndoominite',
  'tyranitar-mega': 'tyranitarite',
  'sceptile-mega': 'sceptilite',
  'blaziken-mega': 'blazikenite',
  'swampert-mega': 'swampertite',
  'gardevoir-mega': 'gardevoirite',
  'sableye-mega': 'sablenite',
  'mawile-mega': 'mawilite',
  'aggron-mega': 'aggronite',
  'medicham-mega': 'medichamite',
  'manectric-mega': 'manectite',
  'sharpedo-mega': 'sharpedonite',
  'camerupt-mega': 'cameruptite',
  'altaria-mega': 'altarianite',
  'banette-mega': 'banettite',
  'absol-mega': 'absolite',
  'glalie-mega': 'glalitite',
  'salamence-mega': 'salamencite',
  'metagross-mega': 'metagrossite',
  'latias-mega': 'latiasite',
  'latios-mega': 'latiosite',
  // レックウザはメガストーンなし（技「ガリョウテンセイ」でメガシンカ）→ fixed_itemはnull
  'lopunny-mega': 'lopunnite',
  'garchomp-mega': 'garchompite',
  'lucario-mega': 'lucarionite',
  'abomasnow-mega': 'abomasite',
  'gallade-mega': 'galladite',
  'audino-mega': 'audinite',
  'diancie-mega': 'diancite',
};

// フォルム別の日本語名上書きマッピング
const FORM_NAME_JA_MAP: Record<string, string> = {
  // ウーラオス
  'urshifu-single-strike': 'ウーラオス（いちげきのかた）',
  'urshifu-rapid-strike': 'ウーラオス（れんげきのかた）',
  // オーガポン
  'ogerpon-wellspring-mask': 'オーガポン（いどのめん）',
  'ogerpon-hearthflame-mask': 'オーガポン（かまどのめん）',
  'ogerpon-cornerstone-mask': 'オーガポン（いしずえのめん）',
  // デフォルトオーガポン
  ogerpon: 'オーガポン（みどりのめん）',
  // ロトム
  'rotom-heat': 'ヒートロトム',
  'rotom-wash': 'ウォッシュロトム',
  'rotom-frost': 'フロストロトム',
  'rotom-fan': 'スピンロトム',
  'rotom-mow': 'カットロトム',
  // デオキシス
  'deoxys-attack': 'デオキシス（アタックフォルム）',
  'deoxys-defense': 'デオキシス（ディフェンスフォルム）',
  'deoxys-speed': 'デオキシス（スピードフォルム）',
  // ギラティナ
  'giratina-origin': 'ギラティナ（オリジンフォルム）',
  // シェイミ
  'shaymin-sky': 'シェイミ（スカイフォルム）',
  // トルネロス・ボルトロス・ランドロス・ラブトロス
  'tornadus-therian': 'トルネロス（れいじゅうフォルム）',
  'thundurus-therian': 'ボルトロス（れいじゅうフォルム）',
  'landorus-therian': 'ランドロス（れいじゅうフォルム）',
  'enamorus-therian': 'ラブトロス（れいじゅうフォルム）',
  // キュレム
  'kyurem-white': 'ホワイトキュレム',
  'kyurem-black': 'ブラックキュレム',
  // フーパ
  'hoopa-unbound': 'フーパ（ときはなたれしフーパ）',
  // ネクロズマ（PokeAPIのIDは necrozma-dusk / necrozma-dawn）
  'necrozma-dusk-mane': 'ネクロズマ（たそがれのたてがみ）',
  'necrozma-dawn-wings': 'ネクロズマ（あかつきのつばさ）',
  'necrozma-dusk': 'ネクロズマ（たそがれのたてがみ）',
  'necrozma-dawn': 'ネクロズマ（あかつきのつばさ）',
  // ザシアン・ザマゼンタ
  'zacian-crowned': 'ザシアン（けんのおう）',
  'zamazenta-crowned': 'ザマゼンタ（たてのおう）',
  // バドレックス（PokeAPIのIDは calyrex-ice / calyrex-shadow）
  'calyrex-ice': 'バドレックス（はくばじょうのすがた）',
  'calyrex-shadow': 'バドレックス（こくばじょうのすがた）',
  // テラパゴス
  'terapagos-terastal': 'テラパゴス（テラスタルフォルム）',
  // キャストフォーム
  'castform-sunny': 'ポワルン（たいようのすがた）',
  'castform-rainy': 'ポワルン（あまみずのすがた）',
  'castform-snowy': 'ポワルン（ゆきぐものすがた）',
  // ゲンシカイキ
  'kyogre-primal': 'ゲンシカイオーガ',
  'groudon-primal': 'ゲンシグラードン',
  // ミノマダム
  'wormadam-sandy': 'ミノマダム（すなちのミノ）',
  'wormadam-trash': 'ミノマダム（ゴミのミノ）',
  // ディアルガ・パルキア（オリジンフォルム）
  'dialga-origin': 'ディアルガ（オリジンフォルム）',
  'palkia-origin': 'パルキア（オリジンフォルム）',
  // ヒヒダルマ
  'darmanitan-zen': 'ヒヒダルマ（ダルマモード）',
  'darmanitan-galar-standard': 'ヒヒダルマ（ガラルのすがた）',
  'darmanitan-galar-zen': 'ヒヒダルマ（ガラルダルマモード）',
  // メロエッタ
  'meloetta-pirouette': 'メロエッタ（ステップフォルム）',
  // ギルガルド
  'aegislash-blade': 'ギルガルド（ブレードフォルム）',
  // バケッチャ・パンプジン
  'pumpkaboo-small': 'バケッチャ（ちいさいサイズ）',
  'pumpkaboo-large': 'バケッチャ（おおきいサイズ）',
  'pumpkaboo-super': 'バケッチャ（とくだいサイズ）',
  'gourgeist-small': 'パンプジン（ちいさいサイズ）',
  'gourgeist-large': 'パンプジン（おおきいサイズ）',
  'gourgeist-super': 'パンプジン（とくだいサイズ）',
  // ジガルデ
  'zygarde-10': 'ジガルデ（10%フォルム）',
  'zygarde-complete': 'ジガルデ（パーフェクトフォルム）',
  // オドリドリ
  'oricorio-pom-pom': 'オドリドリ（ぱちぱちスタイル）',
  'oricorio-pau': 'オドリドリ（ふらふらスタイル）',
  'oricorio-sensu': 'オドリドリ（まいまいスタイル）',
  // ルガルガン
  'lycanroc-midnight': 'ルガルガン（まよなかのすがた）',
  'lycanroc-dusk': 'ルガルガン（たそがれのすがた）',
  // ネクロズマ（ウルトラ）
  'necrozma-ultra': 'ウルトラネクロズマ',
  // ガチグマ
  'ursaluna-bloodmoon': 'ガチグマ（あかつきのすがた）',
  // イルカマン
  'palafin-hero': 'イルカマン（マイティフォルム）',
  // タイカイデン
  'squawkabilly-blue-plumage': 'タイカイデン（あおのはね）',
  'squawkabilly-yellow-plumage': 'タイカイデン（きいろのはね）',
  'squawkabilly-white-plumage': 'タイカイデン（しろのはね）',
  // ウネルミナモ等のパラドックスはベースフォルムのみなので不要
  // バサギリ
  'basculegion-female': 'イダイトウ（めすのすがた）',
  // コオリッポ
  'eiscue-noice': 'コオリッポ（ナイスフェイス）',
  // ムゲンダイナ
  'eternatus-eternamax': 'ムゲンダイナ（ムゲンダイマックス）',
  // フラエッテ
  'floette-eternal': 'フラエッテ（エターナルフラワー）',
  // ゲッコウガ
  'greninja-ash': 'サトシゲッコウガ',
  // コレクレー
  'gimmighoul-roaming': 'コレクレー（とほフォルム）',
  // イエッサン
  'indeedee-female': 'イエッサン（めすのすがた）',
  // パフュートン
  'oinkologne-female': 'パフュートン（めすのすがた）',
  // ヨワシ
  'wishiwashi-school': 'ヨワシ（むれたすがた）',
  // ジガルデ（スワームチェンジ）
  'zygarde-10-power-construct': 'ジガルデ（10%フォルム・スワームチェンジ）',
  // メテノ（コア各色）
  'minior-red': 'メテノ（あかいろのコア）',
  'minior-orange': 'メテノ（だいだいいろのコア）',
  'minior-yellow': 'メテノ（きいろのコア）',
  'minior-green': 'メテノ（みどりいろのコア）',
  'minior-blue': 'メテノ（あおいろのコア）',
  'minior-indigo': 'メテノ（あいいろのコア）',
  'minior-violet': 'メテノ（むらさきいろのコア）',
};

// フォルム別の固定アイテム（PokeAPI ID → 日本語名ペア）
const FIXED_ITEM_MAP: Record<string, { id: string; nameJa: string }> = {
  'ogerpon-wellspring-mask': { id: 'wellspring-mask', nameJa: 'いどのめん' },
  'ogerpon-hearthflame-mask': { id: 'hearthflame-mask', nameJa: 'かまどのめん' },
  'ogerpon-cornerstone-mask': { id: 'cornerstone-mask', nameJa: 'いしずえのめん' },
  'zacian-crowned': { id: 'rusted-sword', nameJa: 'くちたけん' },
  'zamazenta-crowned': { id: 'rusted-shield', nameJa: 'くちたたて' },
  'giratina-origin': { id: 'griseous-orb', nameJa: 'はっきんだま' },
};

// PokeAPIで欠落しているフォルムポケモンの技を手動補完
// ゲーム内で実際に覚える技のみ追加
const FORM_LEARNSET_SUPPLEMENTS: Record<string, string[]> = {
  'calyrex-shadow': [
    'expanding-force',
    'solar-blade',
    'body-press',
    'psych-up',
    'gravity',
    'trick',
    'imprison',
    'protect',
    'substitute',
    'rest',
    'sleep-talk',
  ],
  'calyrex-ice': [
    'high-horsepower',
    'body-press',
    'swords-dance',
    'trick-room',
    'protect',
    'substitute',
    'rest',
    'sleep-talk',
  ],
};

const FIXED_TERA_TYPE_MAP: Record<string, string> = {
  ogerpon: 'Grass',
  'ogerpon-wellspring-mask': 'Water',
  'ogerpon-hearthflame-mask': 'Fire',
  'ogerpon-cornerstone-mask': 'Rock',
};

// ---------------------------------------------------------------------------
// ヘルパー関数
// ---------------------------------------------------------------------------

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getJaName(names: PokeApiNameEntry[]): string {
  const ja = names.find((n) => n.language.name === 'ja');
  return ja?.name ?? '';
}

function getCategory(num: number, isLegendary: boolean, isMythical: boolean): string {
  if (isMythical) return 'mythical';
  if (RESTRICTED_POKEMON.has(num)) return 'restricted';
  if (isLegendary) return 'sub_legendary';
  return 'normal';
}

function shouldIncludeVariety(name: string): boolean {
  if (name.includes('-gmax')) return false;
  if (name.includes('-totem')) return false;
  if (name.startsWith('pikachu-') && name !== 'pikachu') return false;
  if (name.includes('-starter')) return false;
  if (name === 'terapagos-stellar') return false;
  return true;
}

function extractIdFromUrl(url: string): number {
  const parts = url.replace(/\/$/, '').split('/');
  return parseInt(parts[parts.length - 1], 10);
}

function getStatsArray(data: PokeApiPokemonData): number[] {
  return data.stats.sort((a, b) => a.stat.name.localeCompare(b.stat.name)).map((s) => s.base_stat);
}

function getTypesArray(data: PokeApiPokemonData): string[] {
  return data.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name);
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

// ---------------------------------------------------------------------------
// メイン処理
// ---------------------------------------------------------------------------

interface PokemonRow {
  id: string;
  num: number;
  name: string;
  nameJa: string;
  types: string[];
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
  ability0: string;
  ability1: string | null;
  abilityH: string | null;
  weightkg: number;
  heightm: number;
  category: string;
  spriteUrl: string | null;
  fixedItem: string | null;
  fixedTeraType: string | null;
}

interface LearnsetRow {
  pokemonId: string;
  moveId: string;
  method: string;
  level: number;
}

async function seed() {
  console.log('シード開始...\n');

  // -----------------------------------------------------------------------
  // 1. 全国図鑑 1〜1025 の全ポケモンを対象とする
  // -----------------------------------------------------------------------
  const allNums = Array.from({ length: 1025 }, (_, i) => i + 1);
  console.log(`対象ポケモン種: ${allNums.length}種\n`);

  // -----------------------------------------------------------------------
  // 1.5. SVレギュレーションIで使えるポケモンの全国図鑑番号を収集
  // -----------------------------------------------------------------------
  console.log('PokeAPIから図鑑データ取得中（レギュレーションI判定用）...');
  const regINums = new Set<number>();

  const dexUrls = [
    'https://pokeapi.co/api/v2/pokedex/paldea',
    'https://pokeapi.co/api/v2/pokedex/kitakami',
    'https://pokeapi.co/api/v2/pokedex/blueberry',
  ];

  const dexData = await Promise.all(dexUrls.map((url) => fetchWithRetry(url)));
  for (const dex of dexData) {
    for (const entry of dex.pokemon_entries) {
      regINums.add(extractIdFromUrl(entry.pokemon_species.url));
    }
  }

  // 追加ポケモン
  for (const num of ADDITIONAL_REG_I_POKEMON) {
    regINums.add(num);
  }

  console.log(`レギュレーションI対象: ${regINums.size}種\n`);

  // -----------------------------------------------------------------------
  // 2. ポケモンデータ取得
  // -----------------------------------------------------------------------
  console.log('ポケモンデータ取得中...');
  const allPokemonRows: PokemonRow[] = [];
  const allLearnsetRows: LearnsetRow[] = [];
  const allMoveIds = new Set<string>();
  const allAbilityIds = new Set<string>();

  let pokemonCount = 0;

  await parallelFetch(
    allNums.map(String),
    async (numStr) => {
      const num = parseInt(numStr, 10);

      // species データ
      const speciesData = await fetchWithRetry<PokeApiSpeciesData>(
        `https://pokeapi.co/api/v2/pokemon-species/${num}`
      );
      const nameJa = getJaName(speciesData.names);
      const isLegendary: boolean = speciesData.is_legendary;
      const isMythical: boolean = speciesData.is_mythical;
      const category = getCategory(num, isLegendary, isMythical);

      // varieties を処理
      const varieties: Array<{
        name: string;
        url: string;
        isDefault: boolean;
      }> = speciesData.varieties.map((v) => ({
        name: v.pokemon.name,
        url: v.pokemon.url,
        isDefault: v.is_default,
      }));

      // デフォルトフォルムのデータを先に取得
      const defaultVariety = varieties.find((v) => v.isDefault);
      if (!defaultVariety) {
        pokemonCount++;
        if (pokemonCount % 50 === 0) {
          console.log(`  ${pokemonCount}体取得済み...`);
        }
        return;
      }

      const defaultData = await fetchWithRetry<PokeApiPokemonData>(defaultVariety.url);
      const defaultStats = getStatsArray(defaultData);
      const defaultTypes = getTypesArray(defaultData);

      for (const variety of varieties) {
        if (!shouldIncludeVariety(variety.name)) continue;

        let pokemonData: PokeApiPokemonData;

        if (variety.isDefault) {
          pokemonData = defaultData;
        } else {
          pokemonData = await fetchWithRetry<PokeApiPokemonData>(variety.url);
          const varStats = getStatsArray(pokemonData);
          const varTypes = getTypesArray(pokemonData);

          // 種族値もタイプも同じなら見た目違い → スキップ
          if (arraysEqual(defaultStats, varStats) && arraysEqual(defaultTypes, varTypes)) {
            continue;
          }
        }

        const pokemonId = pokemonData.name as string;
        const pokemonNum = num;

        // フォルム名の日本語名
        let formNameJa = nameJa;
        if (FORM_NAME_JA_MAP[pokemonId]) {
          formNameJa = FORM_NAME_JA_MAP[pokemonId];
        } else if (pokemonId.includes('-mega')) {
          if (pokemonId.endsWith('-mega-x')) {
            formNameJa = `メガ${nameJa}X`;
          } else if (pokemonId.endsWith('-mega-y')) {
            formNameJa = `メガ${nameJa}Y`;
          } else {
            formNameJa = `メガ${nameJa}`;
          }
        } else if (!variety.isDefault) {
          // リージョンフォルム等の自動命名
          if (pokemonId.endsWith('-alola')) {
            formNameJa = `${nameJa}（アローラのすがた）`;
          } else if (pokemonId.endsWith('-galar')) {
            formNameJa = `${nameJa}（ガラルのすがた）`;
          } else if (pokemonId.endsWith('-hisui')) {
            formNameJa = `${nameJa}（ヒスイのすがた）`;
          } else if (pokemonId.endsWith('-paldea')) {
            formNameJa = `${nameJa}（パルデアのすがた）`;
          } else if (pokemonId.endsWith('-paldea-combat-breed')) {
            formNameJa = `${nameJa}（パルデアのすがた・かくとう）`;
          } else if (pokemonId.endsWith('-paldea-blaze-breed')) {
            formNameJa = `${nameJa}（パルデアのすがた・ほのお）`;
          } else if (pokemonId.endsWith('-paldea-aqua-breed')) {
            formNameJa = `${nameJa}（パルデアのすがた・みず）`;
          } else {
            // その他のフォルム: PokeAPIのpokemon-formから日本語名を取得試行
            try {
              const formData = await fetchWithRetry<PokeApiFormData>(
                `https://pokeapi.co/api/v2/pokemon-form/${pokemonId}`
              );
              const formJa = formData.names?.find((n) => n.language.name === 'ja')?.name;
              if (formJa && formJa !== nameJa) {
                formNameJa = formJa;
              } else {
                // フォールバック: IDのサフィックスを括弧付きで追加
                const suffix = pokemonId.replace(`${defaultVariety!.name}-`, '').replace(/-/g, ' ');
                formNameJa = `${nameJa}（${suffix}）`;
              }
            } catch {
              const suffix = pokemonId.replace(`${defaultVariety!.name}-`, '').replace(/-/g, ' ');
              formNameJa = `${nameJa}（${suffix}）`;
            }
          }
        }

        const typesList = pokemonData.types
          .sort((a, b) => a.slot - b.slot)
          .map((t) => capitalize(t.type.name));

        const stats = pokemonData.stats;
        const getStat = (name: string) => stats.find((s) => s.stat.name === name)?.base_stat ?? 0;

        const abilitiesList = pokemonData.abilities.sort((a, b) => a.slot - b.slot);
        const ability0 = abilitiesList.find((a) => a.slot === 1)?.ability.name ?? '';
        const ability1 = abilitiesList.find((a) => a.slot === 2)?.ability.name ?? null;
        const abilityH = abilitiesList.find((a) => a.is_hidden)?.ability.name ?? null;

        // 特性ID収集
        if (ability0) allAbilityIds.add(ability0);
        if (ability1) allAbilityIds.add(ability1);
        if (abilityH) allAbilityIds.add(abilityH);

        const spriteUrl = pokemonData.sprites?.front_default ?? null;

        allPokemonRows.push({
          id: pokemonId,
          num: pokemonNum,
          name: pokemonData.name,
          nameJa: formNameJa,
          types: typesList,
          hp: getStat('hp'),
          atk: getStat('attack'),
          def: getStat('defense'),
          spa: getStat('special-attack'),
          spd: getStat('special-defense'),
          spe: getStat('speed'),
          ability0,
          ability1,
          abilityH,
          weightkg: pokemonData.weight / 10,
          heightm: pokemonData.height / 10,
          category: pokemonId.includes('-mega') ? 'mega' : category,
          spriteUrl,
          fixedItem: MEGA_STONE_MAP[pokemonId] ?? FIXED_ITEM_MAP[pokemonId]?.id ?? null,
          fixedTeraType: FIXED_TERA_TYPE_MAP[pokemonId] ?? null,
          genderRate: speciesData.gender_rate,
        });

        // 覚える技（SV優先、なければsword-shieldにフォールバック）
        const svLearnsetRows: LearnsetRow[] = [];
        const fallbackLearnsetRows: LearnsetRow[] = [];

        for (const moveEntry of pokemonData.moves) {
          const moveName: string = moveEntry.move.name;
          const versionDetails: PokeApiMoveVersionDetail[] = moveEntry.version_group_details;

          for (const detail of versionDetails) {
            const vgName: string = detail.version_group.name;
            const method: string = detail.move_learn_method.name;
            if (!VALID_LEARN_METHODS.has(method)) continue;

            if (SV_VERSION_GROUPS.has(vgName)) {
              allMoveIds.add(moveName);
              svLearnsetRows.push({
                pokemonId,
                moveId: moveName,
                method,
                level: detail.level_learned_at ?? 0,
              });
            } else if (FALLBACK_VERSION_GROUPS.has(vgName)) {
              allMoveIds.add(moveName);
              fallbackLearnsetRows.push({
                pokemonId,
                moveId: moveName,
                method,
                level: detail.level_learned_at ?? 0,
              });
            }
          }
        }

        // SVデータがある場合はSVのみ、ない場合はフォールバックを使用
        allLearnsetRows.push(
          ...(svLearnsetRows.length > 0 ? svLearnsetRows : fallbackLearnsetRows)
        );
      }

      pokemonCount++;
      if (pokemonCount % 50 === 0) {
        console.log(`  ${pokemonCount}体取得済み...`);
      }
    },
    5
  );

  console.log(`ポケモン: ${allPokemonRows.length}体取得完了`);

  // learnsets の重複除去（pokemonId + moveId + method でユニーク）
  const learnsetMap = new Map<string, LearnsetRow>();
  for (const row of allLearnsetRows) {
    const key = `${row.pokemonId}|${row.moveId}|${row.method}`;
    // 同じキーで level が大きい方を保持（level-up の場合最高レベルを記録）
    const existing = learnsetMap.get(key);
    if (!existing || row.level > existing.level) {
      learnsetMap.set(key, row);
    }
  }
  const uniqueLearnsets = [...learnsetMap.values()];

  // -----------------------------------------------------------------------
  // 3. 技データ取得
  // -----------------------------------------------------------------------
  console.log(`\n技データ取得中... (${allMoveIds.size}件)`);
  const moveIdList = [...allMoveIds];

  const moveRows = await parallelFetch(
    moveIdList,
    async (moveName) => {
      const data = await fetchWithRetry<PokeApiMoveData>(
        `https://pokeapi.co/api/v2/move/${moveName}`
      );
      return {
        id: moveName,
        num: data.id,
        name: data.name,
        nameJa: getJaName(data.names),
        type: capitalize(data.type.name),
        category: capitalize(data.damage_class.name),
        power: data.power,
        accuracy: data.accuracy,
        pp: data.pp,
        priority: data.priority,
        target: data.target.name,
        shortDesc: data.effect_entries.find((e) => e.language.name === 'en')?.short_effect ?? null,
      };
    },
    5
  );
  console.log(`技: ${moveRows.length}件取得完了`);

  // -----------------------------------------------------------------------
  // 4. 特性データ取得
  // -----------------------------------------------------------------------
  console.log(`\n特性データ取得中... (${allAbilityIds.size}件)`);
  const abilityIdList = [...allAbilityIds];

  const abilityRows = await parallelFetch(
    abilityIdList,
    async (abilityName) => {
      const data = await fetchWithRetry<PokeApiAbilityData>(
        `https://pokeapi.co/api/v2/ability/${abilityName}`
      );
      return {
        id: abilityName,
        num: data.id,
        name: data.name,
        nameJa: getJaName(data.names),
        shortDesc: data.effect_entries.find((e) => e.language.name === 'en')?.short_effect ?? null,
      };
    },
    5
  );
  console.log(`特性: ${abilityRows.length}件取得完了`);

  // -----------------------------------------------------------------------
  // 5. アイテムデータ取得
  // -----------------------------------------------------------------------
  console.log(`\nアイテムデータ取得中... (${COMPETITIVE_ITEM_IDS.length}件)`);

  const itemRows = await parallelFetch(
    COMPETITIVE_ITEM_IDS,
    async (showdownId) => {
      const pokeApiName = SHOWDOWN_TO_POKEAPI_ITEM[showdownId];
      const data = await fetchWithRetry<PokeApiItemData>(
        `https://pokeapi.co/api/v2/item/${pokeApiName}`
      );
      return {
        id: pokeApiName,
        num: data.id,
        name: data.name,
        nameJa: getJaName(data.names),
        shortDesc: data.effect_entries.find((e) => e.language.name === 'en')?.short_effect ?? null,
        isCompetitive: true,
      };
    },
    5
  );
  console.log(`アイテム: ${itemRows.length}件取得完了`);

  // メガストーンをPokeAPIから取得
  console.log('\nメガストーン取得中...');
  const megaStonesCategory = await fetchWithRetry<PokeApiItemCategoryData>(
    'https://pokeapi.co/api/v2/item-category/mega-stones/'
  );
  const megaStoneNames: string[] = megaStonesCategory.items.map((i) => i.name);

  const megaStoneRows = await parallelFetch(
    megaStoneNames,
    async (itemName) => {
      const data = await fetchWithRetry<PokeApiItemData>(
        `https://pokeapi.co/api/v2/item/${itemName}`
      );
      return {
        id: itemName,
        num: data.id,
        name: data.name,
        nameJa: getJaName(data.names),
        shortDesc: data.effect_entries.find((e) => e.language.name === 'en')?.short_effect ?? null,
        isCompetitive: false, // SVでは使えない
      };
    },
    5
  );
  console.log(`メガストーン: ${megaStoneRows.length}件取得完了`);

  // 既存のcompetitiveアイテムとメガストーンを合わせる
  const allItemRows = [...itemRows, ...megaStoneRows];

  // -----------------------------------------------------------------------
  // 6. regulation_pokemon 準備
  // -----------------------------------------------------------------------
  const regIPokemonRows = allPokemonRows
    .filter(
      (p) => regINums.has(p.num) && p.category !== 'mythical' && !p.id.includes('-mega') // メガシンカは除外
    )
    .map((p) => ({
      regulationId: 'sv-reg-i',
      pokemonId: p.id,
    }));

  // -----------------------------------------------------------------------
  // 7. DB投入前に存在しない moveId を持つ learnset を除外
  // -----------------------------------------------------------------------
  const validMoveIdSet = new Set(moveRows.map((m) => m.id));
  const validPokemonIdSet = new Set(allPokemonRows.map((p) => p.id));
  const filteredLearnsets = uniqueLearnsets.filter(
    (l) => validMoveIdSet.has(l.moveId) && validPokemonIdSet.has(l.pokemonId)
  );

  // learnset補完: FORM_LEARNSET_SUPPLEMENTS で指定された技を追加
  const existingLearnsetKeys = new Set(filteredLearnsets.map((l) => `${l.pokemonId}|${l.moveId}`));
  for (const [pokemonId, moveIds] of Object.entries(FORM_LEARNSET_SUPPLEMENTS)) {
    if (!validPokemonIdSet.has(pokemonId)) continue;
    for (const moveId of moveIds) {
      if (!validMoveIdSet.has(moveId)) continue;
      const key = `${pokemonId}|${moveId}`;
      if (existingLearnsetKeys.has(key)) continue;
      filteredLearnsets.push({
        pokemonId,
        moveId,
        method: 'machine',
        level: 0,
      });
      existingLearnsetKeys.add(key);
    }
  }
  console.log('learnset補完完了');

  // -----------------------------------------------------------------------
  // 8. DB投入
  // -----------------------------------------------------------------------
  console.log('\nDB投入中...');

  // DELETE（外部キー制約順）
  console.log('  既存データ削除中...');
  await db.delete(learnsets);
  await db.delete(regulationPokemon);
  await db.delete(pokemon);
  await db.delete(moves);
  await db.delete(abilities);
  await db.delete(items);
  await db.delete(regulations);
  await db.delete(games);
  console.log('  既存データ削除完了');

  // INSERT games
  await db.insert(games).values({
    id: 'sv',
    name: 'スカーレット・バイオレット',
    battleSystems: ['terastal'],
  });
  console.log('  Games: 1件');

  // INSERT regulations
  await db.insert(regulations).values({
    id: 'sv-reg-i',
    gameId: 'sv',
    name: 'レギュレーションI',
    restrictedCount: 2,
    mythicalAllowed: false,
  });
  console.log('  Regulations: 1件');

  // INSERT pokemon（バッチ分割）
  await insertBatch(db, pokemon, allPokemonRows, 100);
  console.log(`  Pokemon: ${allPokemonRows.length}件`);

  // INSERT moves（バッチ分割）
  await insertBatch(db, moves, moveRows, 100);
  console.log(`  Moves: ${moveRows.length}件`);

  // INSERT abilities（バッチ分割）
  await insertBatch(db, abilities, abilityRows, 100);
  console.log(`  Abilities: ${abilityRows.length}件`);

  // INSERT items
  await insertBatch(db, items, allItemRows, 100);
  console.log(`  Items: ${allItemRows.length}件`);

  // INSERT learnsets（バッチ分割）
  await insertBatch(db, learnsets, filteredLearnsets, 500);
  console.log(`  Learnsets: ${filteredLearnsets.length}件`);

  // INSERT regulation_pokemon（バッチ分割）
  await insertBatch(db, regulationPokemon, regIPokemonRows, 500);
  console.log(`  Regulation Pokemon: ${regIPokemonRows.length}件`);

  // -----------------------------------------------------------------------
  // 結果表示
  // -----------------------------------------------------------------------
  console.log('\n=== シード完了 ===');
  console.log(`Games: 1件`);
  console.log(`Regulations: 1件`);
  console.log(`Pokemon: ${allPokemonRows.length}件`);
  console.log(`Moves: ${moveRows.length}件`);
  console.log(`Abilities: ${abilityRows.length}件`);
  console.log(`Items: ${allItemRows.length}件`);
  console.log(`Learnsets: ${filteredLearnsets.length}件`);
  console.log(`Regulation Pokemon: ${regIPokemonRows.length}件`);

  await client.end();
}

/**
 * バッチ分割 INSERT
 * Drizzle ORM の PgTable 型は複雑なジェネリクスを持つため、
 * insert/table の型パラメータには typeof db を利用する
 */
async function insertBatch(
  database: typeof db,
  table: Parameters<(typeof db)['insert']>[0],
  rows: Record<string, unknown>[],
  batchSize: number
): Promise<void> {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await database.insert(table).values(batch as any);
  }
}

seed().catch((e) => {
  console.error('シード失敗:', e);
  process.exit(1);
});

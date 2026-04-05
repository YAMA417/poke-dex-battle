/** アイテムカテゴリ */
export type ItemCategory =
  | 'held'
  | 'berry'
  | 'plate'
  | 'z-crystal'
  | 'z-crystal-exclusive'
  | 'mega-stone'
  | 'orb'
  | 'mask'
  | 'drive'
  | 'memory';

/** battleSystems不要で常に表示するカテゴリ */
export const ALWAYS_VISIBLE_CATEGORIES: readonly ItemCategory[] = [
  'held',
  'berry',
  'plate',
] as const;

/** battleSystemsに応じて表示するカテゴリのマッピング */
export const BATTLE_SYSTEM_CATEGORIES: Record<string, readonly ItemCategory[]> = {
  mega: ['mega-stone', 'orb'],
  zmove: ['z-crystal', 'z-crystal-exclusive'],
} as const;

/** 対応ポケモン選択時のみ表示するカテゴリ（fixedItemIdで逆引き） */
export const POKEMON_SPECIFIC_CATEGORIES: readonly ItemCategory[] = [
  'mega-stone',
  'z-crystal-exclusive',
  'orb',
  'mask',
  'drive',
  'memory',
] as const;

/** ダメージ計算UI攻撃側アイテム固定リスト */
export const DAMAGE_CALC_ATTACKER_ITEMS = [
  { nameJa: 'なし', name: '', group: null, label: '' },
  { nameJa: 'こだわりハチマキ', name: 'Choice Band', group: null, label: '攻撃 x1.5' },
  { nameJa: 'こだわりメガネ', name: 'Choice Specs', group: null, label: '特攻 x1.5' },
  { nameJa: 'いのちのたま', name: 'Life Orb', group: null, label: 'ダメージ x1.3' },
  { nameJa: 'たつじんのおび', name: 'Expert Belt', group: null, label: '抜群時 x1.2' },
  { nameJa: 'ちからのハチマキ', name: 'Muscle Band', group: null, label: '物理技威力 x1.1' },
  { nameJa: 'ものしりメガネ', name: 'Wise Glasses', group: null, label: '特殊技威力 x1.1' },
  { nameJa: 'タイプ強化', name: '__type_boost__', group: 'type_boost', label: '技威力 x1.2' },
  {
    nameJa: 'パンチグローブ',
    name: 'Punching Glove',
    group: null,
    label: 'パンチ技 x1.1 + 接触なし',
  },
] as const;

/** ダメージ計算UI防御側アイテム固定リスト */
export const DAMAGE_CALC_DEFENDER_ITEMS = [
  { nameJa: 'なし', name: '', group: null, label: '' },
  { nameJa: 'しんかのきせき', name: 'Eviolite', group: null, label: '防御・特防 x1.5' },
  { nameJa: 'とつげきチョッキ', name: 'Assault Vest', group: null, label: '特防 x1.5' },
  { nameJa: 'オボンの実', name: 'Sitrus Berry', group: null, label: 'HP回復 最大HPの1/4' },
  { nameJa: 'たべのこし', name: 'Leftovers', group: null, label: '毎ターン HP回復 1/16' },
  {
    nameJa: '半減実',
    name: '__type_resist_berry__',
    group: 'type_resist_berry',
    label: '弱点ダメージ x0.5',
  },
  { nameJa: 'きあいのタスキ', name: 'Focus Sash', group: null, label: 'HP満タン時に一撃耐え' },
  { nameJa: 'くろいヘドロ', name: 'Black Sludge', group: null, label: '毒タイプ HP回復 1/16' },
  {
    nameJa: '混乱実',
    name: '__confusion_berry__',
    group: 'confusion_berry',
    label: 'HP 1/3以下で回復',
  },
] as const;

/** タイプ→タイプ強化アイテム英語名のマッピング */
export const TYPE_BOOST_ITEM_MAP: Record<string, string> = {
  Normal: 'Silk Scarf',
  Fire: 'Charcoal',
  Water: 'Mystic Water',
  Electric: 'Magnet',
  Grass: 'Miracle Seed',
  Ice: 'Never-Melt Ice',
  Fighting: 'Black Belt',
  Poison: 'Poison Barb',
  Ground: 'Soft Sand',
  Flying: 'Sharp Beak',
  Psychic: 'Twisted Spoon',
  Bug: 'Silver Powder',
  Rock: 'Hard Stone',
  Ghost: 'Spell Tag',
  Dragon: 'Dragon Fang',
  Dark: 'Black Glasses',
  Steel: 'Metal Coat',
  Fairy: 'Fairy Feather',
};

/** タイプ→半減実英語名のマッピング */
export const TYPE_RESIST_BERRY_MAP: Record<string, string> = {
  Normal: 'Chilan Berry',
  Fire: 'Occa Berry',
  Water: 'Passho Berry',
  Electric: 'Wacan Berry',
  Grass: 'Rindo Berry',
  Ice: 'Yache Berry',
  Fighting: 'Chople Berry',
  Poison: 'Kebia Berry',
  Ground: 'Shuca Berry',
  Flying: 'Coba Berry',
  Psychic: 'Payapa Berry',
  Bug: 'Tanga Berry',
  Rock: 'Charti Berry',
  Ghost: 'Kasib Berry',
  Dragon: 'Haban Berry',
  Dark: 'Colbur Berry',
  Steel: 'Babiri Berry',
  Fairy: 'Roseli Berry',
};

/**
 * グループアイテムを技タイプに応じた実アイテム英語名に解決する
 */
export function resolveGroupItem(groupName: string, moveType: string): string | null {
  switch (groupName) {
    case 'type_boost':
      return TYPE_BOOST_ITEM_MAP[moveType] ?? null;
    case 'type_resist_berry':
      return TYPE_RESIST_BERRY_MAP[moveType] ?? null;
    case 'confusion_berry':
      // 混乱実は回復量が同じなので代表としてフィラの実を返す
      return 'Figy Berry';
    default:
      return null;
  }
}

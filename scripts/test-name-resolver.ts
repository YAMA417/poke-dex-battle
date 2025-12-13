/**
 * ポケモン名前解決のテストスクリプト
 */

import { resolvePokemonName, getPokemonId, getJapaneseName, getEnglishName } from '../packages/shared/src/utils/pokemon-name-resolver';

console.log('🧪 ポケモン名前解決テスト\n');
console.log('='.repeat(60));

// テストケース
const testCases = [
  { input: 'ガブリアス', expected: 'garchomp' },
  { input: 'ピカチュウ', expected: 'pikachu' },
  { input: 'pikachu', expected: 'pikachu' },
  { input: 'Garchomp', expected: 'garchomp' },
  { input: '25', expected: '25' },
  { input: 'リザードン', expected: 'charizard' },
];

console.log('\n📝 resolvePokemonName() テスト:\n');
testCases.forEach(({ input, expected }) => {
  const result = resolvePokemonName(input);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} "${input}" → ${result} (期待値: ${expected})`);
});

console.log('\n📝 getPokemonId() テスト:\n');
const idTests = [
  { input: 'ガブリアス', expected: 445 },
  { input: 'ピカチュウ', expected: 25 },
  { input: 'garchomp', expected: 445 },
  { input: '25', expected: 25 },
];

idTests.forEach(({ input, expected }) => {
  const result = getPokemonId(input);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} "${input}" → ${result} (期待値: ${expected})`);
});

console.log('\n📝 getJapaneseName() テスト:\n');
const jaTests = [
  { input: 'garchomp', expected: 'ガブリアス' },
  { input: 'pikachu', expected: 'ピカチュウ' },
  { input: '445', expected: 'ガブリアス' },
  { input: 25, expected: 'ピカチュウ' },
];

jaTests.forEach(({ input, expected }) => {
  const result = getJapaneseName(input);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} "${input}" → ${result} (期待値: ${expected})`);
});

console.log('\n📝 存在しないポケモンのテスト:\n');
const notFoundTest = resolvePokemonName('存在しないポケモン');
console.log(`${notFoundTest === null ? '✅' : '❌'} "存在しないポケモン" → ${notFoundTest} (期待値: null)`);

console.log('\n' + '='.repeat(60));
console.log('🎉 テスト完了！');

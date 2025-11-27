import type {
  PokeApiAbilityResponse,
  PokeApiItemResponse,
  PokeApiMoveResponse,
  PokeApiPokemonResponse,
  PokeApiSpeciesResponse,
  PokeApiTypeResponse,
} from "../types/pokeapi";
// ================================================================================
// PokéAPI 定数
// ================================================================================

/**
 * PokéAPI ベースURL
 */
const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";

/**
 * API リクエストタイムアウト（ミリ秒）
 */
const REQUEST_TIMEOUT = 10000; // 10秒

// ================================================================================
// エラークラス
// ================================================================================

/**
 * PokéAPI エラー
 */
export class PokeApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = "PokeApiError";
  }
}

// ================================================================================
// ヘルパー関数
// ================================================================================

/**
 * タイムアウト付きfetch
 * @param url リクエストURL
 * @param timeout タイムアウト時間（ミリ秒）
 * @returns レスポンス
 */
async function fetchWithTimeout(
  url: string,
  timeout: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new PokeApiError(`Request timeout: ${url}`, undefined, url);
    }
    throw error;
  }
}

/**
 * PokéAPIからデータを取得する汎用関数
 * @param endpoint APIエンドポイント（例: '/pokemon/25'）
 * @returns レスポンスデータ
 */
async function fetchFromPokeApi<T>(endpoint: string): Promise<T> {
  const url = `${POKEAPI_BASE_URL}${endpoint}`;

  try {
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new PokeApiError(
        `Failed to fetch from PokéAPI: ${response.statusText}`,
        response.status,
        endpoint
      );
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof PokeApiError) {
      throw error;
    }
    throw new PokeApiError(
      `Network error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      undefined,
      endpoint
    );
  }
}

// ================================================================================
// データ取得関数
// ================================================================================

/**
 * ポケモンの基本データを取得
 * @param idOrName ポケモンID or 英語名（例: 25 or 'pikachu'）
 * @returns ポケモンデータ
 */
export async function fetchPokemon(
  idOrName: number | string
): Promise<PokeApiPokemonResponse> {
  return fetchFromPokeApi<PokeApiPokemonResponse>(`/pokemon/${idOrName}`);
}

/**
 * ポケモンの種族情報を取得（日本語名など）
 * @param idOrName ポケモンID or 英語名
 * @returns 種族情報
 */
export async function fetchPokemonSpecies(
  idOrName: number | string
): Promise<PokeApiSpeciesResponse> {
  return fetchFromPokeApi<PokeApiSpeciesResponse>(
    `/pokemon-species/${idOrName}`
  );
}

/**
 * 技データを取得
 * @param idOrName 技ID or 英語名
 * @returns 技データ
 */
export async function fetchMove(
  idOrName: number | string
): Promise<PokeApiMoveResponse> {
  return fetchFromPokeApi<PokeApiMoveResponse>(`/move/${idOrName}`);
}

/**
 * 特性データを取得
 * @param idOrName 特性ID or 英語名
 * @returns 特性データ
 */
export async function fetchAbility(
  idOrName: number | string
): Promise<PokeApiAbilityResponse> {
  return fetchFromPokeApi<PokeApiAbilityResponse>(`/ability/${idOrName}`);
}

/**
 * アイテムデータを取得
 * @param idOrName アイテムID or 英語名
 * @returns アイテムデータ
 */
export async function fetchItem(
  idOrName: number | string
): Promise<PokeApiItemResponse> {
  return fetchFromPokeApi<PokeApiItemResponse>(`/item/${idOrName}`);
}

/**
 * タイプ相性データを取得
 * @param typeNameOrId タイプ名 or ID
 * @returns タイプ相性データ
 */
export async function fetchType(
  typeNameOrId: number | string
): Promise<PokeApiTypeResponse> {
  return fetchFromPokeApi<PokeApiTypeResponse>(`/type/${typeNameOrId}`);
}

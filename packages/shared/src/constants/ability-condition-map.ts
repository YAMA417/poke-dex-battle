import type { Field, Weather } from '../types/damage';

/**
 * Ability ID to weather mapping.
 * Keys are Showdown-style ability IDs (lowercase, no spaces).
 */
export const ABILITY_WEATHER_MAP: Record<string, Weather> = {
  drizzle: 'rain',
  drought: 'sun',
  sandstream: 'sandstorm',
  snowwarning: 'snow',
  orichalcumpulse: 'sun',
};

/**
 * Ability ID to field mapping.
 * Keys are Showdown-style ability IDs (lowercase, no spaces).
 */
export const ABILITY_FIELD_MAP: Record<string, Field> = {
  electricsurge: 'electric',
  grassysurge: 'grassy',
  mistysurge: 'misty',
  psychicsurge: 'psychic',
  hadronengine: 'electric',
};

/**
 * Get the weather/field effect for a given ability name (English).
 * Returns null if the ability doesn't set weather or field.
 */
export function getAbilityConditionEffect(
  abilityName: string
): { weather?: Weather; field?: Field } | null {
  if (!abilityName) return null;

  const id = abilityName.toLowerCase().replace(/[^a-z0-9]/g, '');

  const weather = ABILITY_WEATHER_MAP[id];
  const field = ABILITY_FIELD_MAP[id];

  if (!weather && !field) return null;

  const result: { weather?: Weather; field?: Field } = {};
  if (weather) result.weather = weather;
  if (field) result.field = field;
  return result;
}

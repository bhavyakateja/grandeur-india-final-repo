import * as repository from "./repository";
import { cache, CacheKeys } from "../redis";

import type { UpdateSettingsInput } from "./schema";

/** Settings cache TTL — 5 minutes. */
const SETTINGS_CACHE_TTL = 300;

export async function getSettings() {
  const cacheKey = CacheKeys.settings();

  const cached = await cache.get<Awaited<ReturnType<typeof repository.getSettings>>>(cacheKey);

  if (cached) {
    return {
      ...cached,
      gstRate: Number(cached.gstRate),
      freeShippingThreshold: Number(
        cached.freeShippingThreshold,
      ),
      defaultShippingCharge: Number(
        cached.defaultShippingCharge,
      ),
    };
  }

  let settings = await repository.getSettings();

  if (!settings) {
    settings = await repository.createDefaults();
  }

  await cache.set(cacheKey, settings, SETTINGS_CACHE_TTL);

  return {
    ...settings,
    gstRate: Number(settings.gstRate),
    freeShippingThreshold: Number(
      settings.freeShippingThreshold,
    ),
    defaultShippingCharge: Number(
      settings.defaultShippingCharge,
    ),
  };
}

export async function updateSettings(
  data: UpdateSettingsInput,
) {
  const settings =
    await repository.updateSettings(data);

  // Invalidate the cache so next read picks up the new values.
  await cache.remove(CacheKeys.settings());

  return {
    ...settings,
    gstRate: Number(settings.gstRate),
    freeShippingThreshold: Number(
      settings.freeShippingThreshold,
    ),
    defaultShippingCharge: Number(
      settings.defaultShippingCharge,
    ),
  };
}
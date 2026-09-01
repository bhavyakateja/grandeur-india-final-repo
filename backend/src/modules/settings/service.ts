import * as repository from "./repository";

import type { UpdateSettingsInput } from "./schema";

export async function getSettings() {
  let settings = await repository.getSettings();

  if (!settings) {
    settings = await repository.createDefaults();
  }

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
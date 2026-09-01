import { prisma } from "../../db/prisma";
import type { UpdateSettingsInput } from "./schema";

const SETTINGS_ID = "store";

export async function getSettings() {
  return prisma.storeSettings.findUnique({
    where: {
      id: SETTINGS_ID,
    },
  });
}

export async function createDefaults() {
  return prisma.storeSettings.create({
    data: {
      id: SETTINGS_ID,
    },
  });
}

export async function updateSettings(
  data: UpdateSettingsInput,
) {
  return prisma.storeSettings.upsert({
    where: {
      id: SETTINGS_ID,
    },
    create: {
      id: SETTINGS_ID,
      ...data,
    },
    update: data,
  });
}
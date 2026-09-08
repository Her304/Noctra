import { supabase } from "@/lib/supabase/server";
import {
  APERCU_WINDOW_DAYS,
  FREE_TIER_NODE_LIMIT,
  GRAPH_WINDOW_DAYS,
  MIN_LINK_STRENGTH,
} from "@/lib/config";

export type Settings = {
  minLinkStrength: number;
  graphWindowDays: number;
  apercuWindowDays: number;
  freeTierNodeLimit: number;
};

/**
 * The constants in lib/config.ts are now the floor, not the source of truth.
 * They carry the reasoning; the settings table carries the current value.
 *
 * Keeping them as a fallback is what lets the pages survive an unreachable or
 * paused database: a sparse graph is a bad afternoon, an empty one is a broken
 * site, and neither should be caused by a settings lookup timing out.
 */
export const DEFAULTS: Settings = {
  minLinkStrength: MIN_LINK_STRENGTH,
  graphWindowDays: GRAPH_WINDOW_DAYS,
  apercuWindowDays: APERCU_WINDOW_DAYS,
  freeTierNodeLimit: FREE_TIER_NODE_LIMIT,
};

const KEYS: Record<string, keyof Settings> = {
  min_link_strength: "minLinkStrength",
  graph_window_days: "graphWindowDays",
  apercu_window_days: "apercuWindowDays",
  free_tier_node_limit: "freeTierNodeLimit",
};

export async function getSettings(): Promise<Settings> {
  try {
    const { data, error } = await supabase().from("settings").select("key,value");
    if (error) throw new Error(error.message);

    const resolved = { ...DEFAULTS };
    for (const row of data ?? []) {
      const field = KEYS[row.key as string];
      // A malformed row falls back rather than propagating NaN into a query.
      const value = Number(row.value);
      if (field && Number.isFinite(value)) resolved[field] = value;
    }
    return resolved;
  } catch {
    return DEFAULTS;
  }
}

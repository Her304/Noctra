"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/queries";
import type { ActionResult } from "@/lib/admin/types";

/**
 * Every action re-runs requireAdmin(). Server Actions are POST endpoints with
 * a public URL, so the enclosing page having checked already means nothing --
 * an action is reachable without ever rendering the page that contains it.
 *
 * Each takes the useActionState (prevState, formData) shape. The previous
 * result is unused: these are single-shot writes, not accumulating reducers.
 */

/** Public pages are ISR-cached, so a correction is invisible until they rebuild. */
function revalidatePublic() {
  revalidatePath("/apercu");
  revalidatePath("/catographic");
}

function fail(message: string): ActionResult {
  return { ok: false, error: message };
}

// ---------------------------------------------------------------------------
// Linkage curation
// ---------------------------------------------------------------------------

/**
 * Retire or restore an edge.
 *
 * Sets is_linked rather than deleting: the row is the record that this pair was
 * examined, and discover_linkages.py reads exactly that to avoid re-paying an
 * LLM call for a verdict it already has. Deleting would make the pipeline buy
 * the same answer again next run -- and no role holds DELETE anyway.
 */
export async function setLinkageVerdict(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const id = Number(formData.get("id"));
  const isLinked = formData.get("is_linked") === "true";
  if (!Number.isInteger(id)) return fail("Bad linkage id.");

  const { error } = await supabase
    .from("linkages")
    .update({ is_linked: isLinked })
    .eq("id", id);

  if (error) return fail(error.message);

  revalidatePath("/admin/linkages");
  revalidatePublic();
  return { ok: true };
}

/**
 * Hand-correct an edge's strength.
 *
 * The verifier parks on 0.35 for almost everything it accepts, which makes the
 * floor a coin-flip rather than a filter. Until the prompt's anchoring is
 * fixed, this is how a genuinely strong link gets to look strong.
 */
export async function setLinkageStrength(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const id = Number(formData.get("id"));
  const strength = Number(formData.get("strength"));

  if (!Number.isInteger(id)) return fail("Bad linkage id.");
  if (!Number.isFinite(strength) || strength < 0 || strength > 1) {
    return fail("Strength must be between 0 and 1.");
  }

  const { error } = await supabase
    .from("linkages")
    .update({ strength: Math.round(strength * 100) / 100 })
    .eq("id", id);

  if (error) return fail(error.message);

  revalidatePath("/admin/linkages");
  revalidatePublic();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Article and insight corrections
// ---------------------------------------------------------------------------

/**
 * Rewrite an article's executive summary.
 *
 * Merges into the existing jsonb rather than replacing it: `summary` also
 * carries the SWOT, PEST and Diamond-E sections, and a whole-column write from
 * a form that only edits one field would silently drop them.
 */
export async function updateExecutiveSummary(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const id = Number(formData.get("id"));
  const text = String(formData.get("executive_summary") ?? "").trim();

  if (!Number.isInteger(id)) return fail("Bad article id.");
  if (text.length > 4000) return fail("Summary is too long (4000 characters max).");

  const { data: existing, error: readError } = await supabase
    .from("articles")
    .select("summary")
    .eq("id", id)
    .single();

  if (readError) return fail(readError.message);

  const merged = { ...(existing?.summary ?? {}), executive_summary: text };

  const { error } = await supabase
    .from("articles")
    .update({ summary: merged })
    .eq("id", id);

  if (error) return fail(error.message);

  revalidatePath("/admin/articles");
  revalidatePublic();
  return { ok: true };
}

/** Correct the one-line event summary that labels a node on the graph. */
export async function updateEventSummary(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const articleId = Number(formData.get("article_id"));
  const text = String(formData.get("event_summary") ?? "").trim();

  if (!Number.isInteger(articleId)) return fail("Bad article id.");
  if (text.length > 2000) return fail("Event summary is too long (2000 characters max).");

  // Upsert, not update: an article whose insight has not been generated yet has
  // no row to update, and that is the common case in the correction queue.
  const { error } = await supabase
    .from("article_insights")
    .upsert({ article_id: articleId, event_summary: text }, { onConflict: "article_id" });

  if (error) return fail(error.message);

  revalidatePath("/admin/articles");
  revalidatePublic();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Graph tuning
// ---------------------------------------------------------------------------

/**
 * Bounds are enforced here, not just in the input's min/max: a `type=number`
 * attribute is a hint to a browser, not a constraint on a POST.
 */
const BOUNDS: Record<string, { min: number; max: number; integer: boolean }> = {
  min_link_strength: { min: 0, max: 1, integer: false },
  graph_window_days: { min: 1, max: 365, integer: true },
  apercu_window_days: { min: 1, max: 365, integer: true },
  free_tier_node_limit: { min: 1, max: 500, integer: true },
};

export async function updateSetting(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const key = String(formData.get("key") ?? "");
  const value = Number(formData.get("value"));

  const bound = BOUNDS[key];
  if (!bound) return fail(`Unknown setting: ${key}`);
  if (!Number.isFinite(value)) return fail("Value must be a number.");
  if (value < bound.min || value > bound.max) {
    return fail(`${key} must be between ${bound.min} and ${bound.max}.`);
  }
  if (bound.integer && !Number.isInteger(value)) {
    return fail(`${key} must be a whole number.`);
  }

  // updated_at and updated_by are stamped by the settings_touch trigger, so
  // they are not sent from here and cannot be spoofed.
  const { error } = await supabase.from("settings").update({ value }).eq("key", key);

  if (error) return fail(error.message);

  revalidatePath("/admin/settings");
  revalidatePublic();
  return { ok: true };
}

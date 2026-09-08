import { redirect } from "next/navigation";
import { supabaseSession } from "@/lib/supabase/server";
import type { AdminLinkage, PipelineHealth, SettingRow } from "@/lib/admin/types";

/**
 * The gate. Every admin page and every server action calls this first.
 *
 * It is deliberately redundant with the RLS policies: if this check were
 * somehow skipped, the database would still refuse the write, and if the
 * database somehow allowed it, this would still have refused the render. The
 * proxy redirect is a third layer, and the least trustworthy of the three.
 */
export async function requireAdmin() {
  const supabase = await supabaseSession();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  // Reads through the "read own role" policy -- a non-admin sees their own
  // absent row, never anyone else's presence.
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data?.role !== "admin") redirect("/login?error=denied");

  return { supabase, user };
}

export async function getPipelineHealth(): Promise<PipelineHealth | null> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("get_pipeline_health");

  if (error) {
    console.error("getPipelineHealth:", error.message);
    return null;
  }
  return data as PipelineHealth;
}

export async function getAdminLinkages(days = 14, limit = 200): Promise<AdminLinkage[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("get_admin_linkages", {
    p_days: days,
    p_limit: limit,
  });

  if (error) {
    console.error("getAdminLinkages:", error.message);
    return [];
  }
  return (data ?? []) as AdminLinkage[];
}

export async function getSettingRows(): Promise<SettingRow[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("settings")
    .select("key,value,description,updated_at")
    .order("key");

  if (error) {
    console.error("getSettingRows:", error.message);
    return [];
  }
  return (data ?? []) as SettingRow[];
}

/**
 * Articles for the correction queue, newest first. Includes the ones the public
 * Apercu page hides -- an article with no summary is exactly the row an admin
 * needs to see.
 */
export async function getAdminArticles(limit = 60) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("articles")
    .select("id,title,url,domain,published_at,summary,article_insights(event_summary,predictions)")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getAdminArticles:", error.message);
    return [];
  }
  return data ?? [];
}

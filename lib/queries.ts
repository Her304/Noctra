import { supabase } from "@/lib/supabase/server";
import {
  APERCU_WINDOW_DAYS,
  FREE_TIER_NODE_LIMIT,
  GRAPH_WINDOW_DAYS,
  MIN_LINK_STRENGTH,
} from "@/lib/config";
import type { Article, Graph } from "@/lib/types";

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export async function getRecentArticles(days = APERCU_WINDOW_DAYS): Promise<Article[]> {
  const { data, error } = await supabase()
    .from("articles")
    .select("id,title,url,domain,published_at,summary")
    .not("summary", "is", null)
    .gte("published_at", daysAgo(days))
    .order("published_at", { ascending: false });

  if (error) throw new Error(`getRecentArticles: ${error.message}`);
  return (data ?? []) as Article[];
}

export async function getGraph(
  days = GRAPH_WINDOW_DAYS,
  nodeLimit = FREE_TIER_NODE_LIMIT,
  minStrength = MIN_LINK_STRENGTH
): Promise<Graph> {
  const { data, error } = await supabase().rpc("get_graph", {
    p_days: days,
    p_node_limit: nodeLimit,
    p_min_strength: minStrength,
  });

  if (error) throw new Error(`getGraph: ${error.message}`);
  return (data ?? { nodes: [], edges: [] }) as Graph;
}

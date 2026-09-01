import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationNodeDatum,
} from "d3-force";
import type { GraphEdge, GraphNode } from "@/lib/types";

export const CHIP_WIDTH = 180;
export const CARD_WIDTH = 300;

/** Bigger nodes for better-connected events, the way Obsidian scales by link count. */
export function nodeRadius(degree: number) {
  return 46 + Math.min(degree, 6) * 7;
}

export type SimNode = SimulationNodeDatum & { id: string; degree: number };

const SETTLE_TICKS = 400;

/**
 * Force-directed positioning: clusters emerge from the linkage structure rather
 * than being imposed by rank order. Replaces dagre, which laid every event on a
 * strict left-to-right rank and turns into an unreadable ribbon past ~20 nodes.
 *
 * Returns a live simulation; the caller ticks it and reads x/y each frame so the
 * graph visibly settles.
 */
export function layoutGraph(
  nodes: GraphNode[],
  edges: GraphEdge[]
): Record<string, { x: number; y: number }> {
  const simNodes: SimNode[] = nodes.map((n, i) => ({
    id: n.id,
    degree: n.data.degree,
    // Seed on a ring so the first tick has no degenerate all-at-origin state.
    x: Math.cos((i / nodes.length) * 2 * Math.PI) * 240,
    y: Math.sin((i / nodes.length) * 2 * Math.PI) * 240,
  }));

  const byId = new Map(simNodes.map((n) => [n.id, n]));
  const links = edges
    .filter((e) => byId.has(e.source) && byId.has(e.target))
    .map((e) => ({
      source: byId.get(e.source)!,
      target: byId.get(e.target)!,
      strength: e.data.strength ?? 0.3,
    }));

  const sim = forceSimulation(simNodes)
    .force(
      "link",
      forceLink(links)
        .id((d) => (d as SimNode).id)
        // Stronger causal links pull their events closer together.
        .distance((l) => 300 - (l as { strength: number }).strength * 120)
        .strength((l) => 0.2 + (l as { strength: number }).strength * 0.5)
    )
    .force("charge", forceManyBody().strength(-1400))
    .force("collide", forceCollide<SimNode>().radius((d) => nodeRadius(d.degree) + 34))
    .force("center", forceCenter(0, 0))
    .alpha(1)
    .alphaDecay(0.028)
    .stop();

  // Settle synchronously. Ticking inside an animation frame and rebuilding the
  // node array each time defeats React Flow's measurement pass -- it keeps nodes
  // visibility:hidden until measured, so they never appear. Positions are
  // computed once here and handed over static; CSS animates the arrival.
  sim.tick(SETTLE_TICKS);

  return Object.fromEntries(
    simNodes.map((n) => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }])
  );
}

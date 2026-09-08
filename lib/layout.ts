import type { GraphEdge, GraphNode } from "@/lib/types";

// Matches the .star rule in globals.css. The ring maths below spaces nodes by
// their real footprint, so these have to track the stylesheet: a chip is 190
// wide, and its min-height is nodeRadius(degree) * 2.
export const CHIP_WIDTH = 190;
export const CARD_WIDTH = 310;

/** Bigger nodes for better-connected events, the way Obsidian scales by link count. */
export function nodeRadius(degree: number) {
  return 46 + Math.min(degree, 6) * 7;
}

/** Clearance between two chips sitting side by side on the same ring. */
const ARC_GAP = 90;
/** Clearance between consecutive rings, measured against the tallest chip. */
const RING_GAP = 150;
/** Clearance between one component's outer ring and the next component's. */
const COMPONENT_GAP = 260;

const MAX_CHIP_HEIGHT = nodeRadius(6) * 2;
const MIN_ARC = CHIP_WIDTH + ARC_GAP;
const MIN_RING = MAX_CHIP_HEIGHT + RING_GAP;

type Point = { x: number; y: number };

/**
 * Radial layout: the best-connected event sits at the centre and its
 * consequences fall outward, one ring per hop.
 *
 * Replaces the d3-force simulation. Force layout is the right tool when the
 * structure is genuinely a web, but these graphs are near-forests -- ten events
 * and eight linkages resolve to two disjoint trees -- and a spring model draws
 * that as a lopsided left-to-right drift with no visual answer to "what is this
 * graph about". Ring position now carries meaning: the centre is the driver,
 * and distance from it is causal distance.
 *
 * It is also deterministic. forceLink jiggles coincident nodes with
 * Math.random, so the same graph settled differently on every render.
 */
export function layoutGraph(
  nodes: GraphNode[],
  edges: GraphEdge[]
): Record<string, Point> {
  if (nodes.length === 0) return {};

  const byId = new Map(nodes.map((n) => [n.id, n]));

  // Undirected adjacency: the trigger -> ripple direction is what the arrowhead
  // is for, but reachability has to ignore it or a ripple with two upstream
  // causes would never be reached from either.
  const adjacency = new Map<string, Set<string>>(nodes.map((n) => [n.id, new Set<string>()]));
  for (const edge of edges) {
    if (!byId.has(edge.source) || !byId.has(edge.target) || edge.source === edge.target) continue;
    adjacency.get(edge.source)!.add(edge.target);
    adjacency.get(edge.target)!.add(edge.source);
  }

  // Sorting everything by id keeps the output stable between renders, which is
  // the property the force version lacked.
  const neighbours = (id: string) => [...adjacency.get(id)!].sort();
  const ordered = [...nodes].sort((a, b) => a.id.localeCompare(b.id));

  const components = findComponents(ordered, neighbours);

  // Densest component takes the centre; the rest orbit it. get_graph excludes
  // orphans, so every component here has at least one edge.
  const laid = components
    .map((component) => layoutComponent(component, byId, neighbours))
    .sort((a, b) => b.size - a.size || a.rootId.localeCompare(b.rootId));

  const positions: Record<string, Point> = {};
  const [primary, ...satellites] = laid;

  for (const [id, point] of Object.entries(primary.points)) {
    positions[id] = point;
  }

  // Satellites ride an orbit wide enough to clear both extents, so two clusters
  // never overlap however the rings came out.
  const orbit =
    primary.extent + COMPONENT_GAP + Math.max(0, ...satellites.map((s) => s.extent));

  satellites.forEach((satellite, i) => {
    const angle = (i / satellites.length) * 2 * Math.PI;
    const dx = Math.cos(angle) * orbit;
    const dy = Math.sin(angle) * orbit;
    for (const [id, point] of Object.entries(satellite.points)) {
      positions[id] = { x: point.x + dx, y: point.y + dy };
    }
  });

  return positions;
}

function findComponents(
  ordered: GraphNode[],
  neighbours: (id: string) => string[]
): GraphNode[][] {
  const seen = new Set<string>();
  const components: GraphNode[][] = [];

  for (const node of ordered) {
    if (seen.has(node.id)) continue;
    const ids: string[] = [];
    const queue = [node.id];
    seen.add(node.id);

    while (queue.length) {
      const id = queue.shift()!;
      ids.push(id);
      for (const next of neighbours(id)) {
        if (seen.has(next)) continue;
        seen.add(next);
        queue.push(next);
      }
    }

    const members = new Set(ids);
    components.push(ordered.filter((n) => members.has(n.id)));
  }

  return components;
}

type LaidComponent = {
  rootId: string;
  size: number;
  extent: number;
  points: Record<string, Point>;
};

function layoutComponent(
  component: GraphNode[],
  byId: Map<string, GraphNode>,
  neighbours: (id: string) => string[]
): LaidComponent {
  // The hub is the event the briefing is really about. Degree comes from
  // get_graph, which counts edges across the whole window rather than only the
  // ones that survived the node limit, so it is the better centre.
  const root = [...component].sort(
    (a, b) => b.data.degree - a.data.degree || a.id.localeCompare(b.id)
  )[0];

  // Breadth-first, so each node hangs off its shortest path to the hub. Any
  // remaining edge is a cross-link and simply draws as a chord -- with a
  // near-forest that is rare, and forcing those into the tree would cost the
  // clean ring structure that makes the centre readable.
  const depth = new Map<string, number>([[root.id, 0]]);
  const children = new Map<string, string[]>([[root.id, []]]);
  const queue = [root.id];

  while (queue.length) {
    const id = queue.shift()!;
    for (const next of neighbours(id)) {
      if (depth.has(next)) continue;
      depth.set(next, depth.get(id)! + 1);
      children.set(next, []);
      children.get(id)!.push(next);
      queue.push(next);
    }
  }

  // Wedge width is proportional to how many leaves a branch ends in, so a
  // six-leaf branch is not squeezed into the same arc as a single leaf.
  const leaves = new Map<string, number>();
  const countLeaves = (id: string): number => {
    const kids = children.get(id) ?? [];
    const total = kids.length === 0 ? 1 : kids.reduce((sum, kid) => sum + countLeaves(kid), 0);
    leaves.set(id, total);
    return total;
  };
  countLeaves(root.id);

  // One radius per ring, widened when that ring holds too many nodes to seat
  // them MIN_ARC apart. Without this the outer ring of a bushy hub overlaps.
  const perDepth = new Map<number, number>();
  for (const d of depth.values()) perDepth.set(d, (perDepth.get(d) ?? 0) + 1);

  const radii = new Map<number, number>([[0, 0]]);
  for (const [d, count] of [...perDepth.entries()].sort((a, b) => a[0] - b[0])) {
    if (d === 0) continue;
    radii.set(d, Math.max(d * MIN_RING, (count * MIN_ARC) / (2 * Math.PI)));
  }

  const points: Record<string, Point> = {};
  let extent = 0;

  // React Flow positions a node by its top-left corner, so the centring offset
  // is what actually puts the hub on the origin and keeps each ring true.
  const place = (id: string, angle: number) => {
    const radius = radii.get(depth.get(id)!) ?? 0;
    const node = byId.get(id)!;
    const height = nodeRadius(node.data.degree) * 2;
    points[id] = {
      x: Math.cos(angle) * radius - CHIP_WIDTH / 2,
      y: Math.sin(angle) * radius - height / 2,
    };
    extent = Math.max(extent, radius + Math.max(CHIP_WIDTH, height) / 2);
  };

  const assign = (id: string, from: number, to: number) => {
    place(id, id === root.id ? 0 : (from + to) / 2);

    const kids = children.get(id) ?? [];
    if (kids.length === 0) return;

    const total = kids.reduce((sum, kid) => sum + (leaves.get(kid) ?? 1), 0);
    let cursor = from;
    for (const kid of kids) {
      const share = ((leaves.get(kid) ?? 1) / total) * (to - from);
      assign(kid, cursor, cursor + share);
      cursor += share;
    }
  };

  // Start the sweep at -90deg so the first branch of a hub climbs rather than
  // shooting right, which reads as a constellation instead of a flowchart.
  assign(root.id, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI);

  return { rootId: root.id, size: component.length, extent, points };
}

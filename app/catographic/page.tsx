import GraphCanvas from "@/components/catographic/GraphCanvas";
import { FREE_TIER_NODE_LIMIT, GRAPH_WINDOW_DAYS, MIN_LINK_STRENGTH } from "@/lib/config";
import { getGraph } from "@/lib/queries";
import type { Graph } from "@/lib/types";

export const metadata = { title: "Catographic" };

export const revalidate = 300;

export default async function CatographicPage() {
  let graph: Graph = { nodes: [], edges: [] };

  // See the note in app/apercu/page.tsx: an unreachable database renders the
  // empty state rather than failing the build.
  try {
    graph = await getGraph(GRAPH_WINDOW_DAYS, FREE_TIER_NODE_LIMIT);
  } catch (error) {
    console.error(error);
  }

  return (
    <>
      <header className="page-head">
        <div className="hero-stars" aria-hidden="true" />
        <div className="page-head-inner">
          <p className="label">Catographic — the map</p>
          <h1>
            The week as a <em>constellation</em>.
          </h1>
          <p>
            The {FREE_TIER_NODE_LIMIT} most connected business events of the past{" "}
            {GRAPH_WINDOW_DAYS} days, and the arguments that tie one to the next.
          </p>

          <div className="page-head-meta">
            <span className="mono-meta">Events · {graph.nodes.length}</span>
            <span className="mono-meta">Linkages · {graph.edges.length}</span>
            <span className="mono-meta">Floor · strength {MIN_LINK_STRENGTH.toFixed(2)}</span>
          </div>
        </div>
      </header>

      <GraphCanvas graph={graph} />
    </>
  );
}

import GraphCanvas from "@/components/catographic/GraphCanvas";
import { getGraph } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import type { Graph } from "@/lib/types";

export const metadata = { title: "Catographic" };

export const revalidate = 300;

export default async function CatographicPage() {
  let graph: Graph = { nodes: [], edges: [] };

  // All three are tunable from /admin/settings without a redeploy -- the floor
  // and the window have each blanked this page once already.
  const { graphWindowDays, freeTierNodeLimit, minLinkStrength } = await getSettings();

  // See the note in app/apercu/page.tsx: an unreachable database renders the
  // empty state rather than failing the build.
  try {
    graph = await getGraph(graphWindowDays, freeTierNodeLimit, minLinkStrength);
  } catch (error) {
    console.error(error);
  }

  return (
    <>
      <header className="page-head map-head">
        <div className="hero-stars" aria-hidden="true" />
        <div className="map-head-inner">
          <div>
            <p className="label">Catographic — the map</p>
            <h1>
              The week as a <em>constellation</em>.
            </h1>
          </div>

          <div className="map-head-meta">
            <span className="mono-meta">Events · {graph.nodes.length}</span>
            <span className="mono-meta">Linkages · {graph.edges.length}</span>
            <span className="mono-meta">Window · {graphWindowDays} days</span>
            <span className="mono-meta">Floor · strength {minLinkStrength.toFixed(2)}</span>
          </div>
        </div>
      </header>

      <GraphCanvas graph={graph} />
    </>
  );
}

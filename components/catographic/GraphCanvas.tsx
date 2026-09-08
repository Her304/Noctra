"use client";

import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type EdgeMouseHandler,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useState } from "react";

import { layoutGraph } from "@/lib/layout";
import type { Graph, GraphEdgeData, GraphNodeData } from "@/lib/types";
import ArticleNode, { type ArticleFlowNode } from "./ArticleNode";
import ImpactPanel from "./ImpactPanel";

const nodeTypes = { articleNode: ArticleNode };

function Canvas({ graph }: { graph: Graph }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [edgeDetail, setEdgeDetail] = useState<GraphEdgeData | null>(null);

  // Force layout settles once per graph, not per frame.
  const positions = useMemo(() => layoutGraph(graph.nodes, graph.edges), [graph]);

  const initialNodes = useMemo<ArticleFlowNode[]>(
    () =>
      graph.nodes.map((n) => ({
        id: n.id,
        type: "articleNode" as const,
        position: positions[n.id] ?? { x: 0, y: 0 },
        data: { ...n.data },
      })),
    [graph.nodes, positions]
  );

  const initialEdges = useMemo<Edge[]>(
    () =>
      graph.edges.map((item) => {
        const strength = item.data.strength ?? 0;
        return {
          id: item.id,
          source: item.source,
          target: item.target,
          data: item.data,
          // React Flow writes the arrowhead colour inline, so CSS cannot reach it.
          markerEnd: { type: MarkerType.ArrowClosed, color: "#E9B44C", width: 16, height: 16 },
          style: {
            strokeWidth: 1 + strength * 3,
            opacity: 0.3 + strength * 0.7,
          },
        };
      }),
    [graph.edges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Obsidian's focus behaviour: a node and its direct neighbours stay lit,
  // everything else recedes.
  const focusId = hoveredId ?? selectedId;
  const inFocus = useMemo(() => {
    if (!focusId) return null;
    const set = new Set([focusId]);
    for (const e of graph.edges) {
      if (e.source === focusId) set.add(e.target);
      if (e.target === focusId) set.add(e.source);
    }
    return set;
  }, [focusId, graph.edges]);

  // Spread the existing node rather than rebuilding it: React Flow stores a
  // `measured` field on each node and keeps it visibility:hidden until measured.
  // Constructing fresh objects on every hover drops that field, so the whole
  // graph blinks out and edges never get drawn.
  useEffect(() => {
    setNodes((current) =>
      current.map((n) => ({
        ...n,
        data: {
          ...n.data,
          expanded: n.id === selectedId,
          dimmed: inFocus !== null && !inFocus.has(n.id),
        },
      }))
    );
  }, [selectedId, inFocus, setNodes]);

  useEffect(() => {
    setEdges((current) =>
      current.map((e) => {
        const strength = (e.data as GraphEdgeData | undefined)?.strength ?? 0;
        const faded = inFocus !== null && !(inFocus.has(e.source) && inFocus.has(e.target));
        return {
          ...e,
          style: {
            strokeWidth: 1 + strength * 3,
            opacity: faded ? 0.07 : 0.3 + strength * 0.7,
          },
        };
      })
    );
  }, [inFocus, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback((_, clicked) => {
    setSelectedId((current) => (current === clicked.id ? null : clicked.id));
    setEdgeDetail(null);
  }, []);

  const onEdgeClick: EdgeMouseHandler = useCallback((_, clicked) => {
    setEdgeDetail((clicked.data ?? null) as GraphEdgeData | null);
    setSelectedId(null);
  }, []);

  const selectedNode = useMemo(
    () => graph.nodes.find((n) => n.id === selectedId)?.data ?? null,
    [graph.nodes, selectedId]
  );

  if (graph.nodes.length === 0) {
    return (
      <div className="observatory">
        <div className="observatory-empty">
          <h2>No connected events yet</h2>
          <p>
            The graph appears once the pipeline has verified linkages between articles. Run the
            pipeline, or widen the time window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="observatory">
      <div className="sky">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onNodeMouseEnter={(_, n) => setHoveredId(n.id)}
          onNodeMouseLeave={() => setHoveredId(null)}
          onPaneClick={() => {
            setSelectedId(null);
            setEdgeDetail(null);
          }}
          fitView
          // The briefing panel is an absolute overlay on the right of the very
          // box React Flow fits into, so uniform padding parks the outermost
          // cluster underneath it. Reserve the panel's own width instead:
          // 24rem plus its 1.25rem inset, rounded up for breathing room.
          fitViewOptions={{
            padding: { top: "48px", right: "424px", bottom: "48px", left: "48px" },
          }}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: false }}
        >
          <Background gap={26} size={1} color="#1b2a54" />
          <Controls />
        </ReactFlow>
      </div>

      <ImpactPanel node={selectedNode as GraphNodeData | null} edge={edgeDetail} />
    </div>
  );
}

export default function GraphCanvas({ graph }: { graph: Graph }) {
  return (
    <ReactFlowProvider>
      <Canvas graph={graph} />
    </ReactFlowProvider>
  );
}

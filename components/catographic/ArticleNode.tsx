"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { nodeRadius } from "@/lib/layout";
import type { GraphNodeData } from "@/lib/types";

export type ArticleNodeData = GraphNodeData & {
  expanded?: boolean;
  dimmed?: boolean;
};

export type ArticleFlowNode = Node<ArticleNodeData, "articleNode">;

/**
 * A star in the field: compact by default so the web stays readable, opening
 * into the briefing card on selection -- the board's reason for React Flow over
 * D3 was that the analysis lives inside the node rather than beside the graph.
 */
export default function ArticleNode({ data }: NodeProps<ArticleFlowNode>) {
  const classes = ["star", data.expanded ? "expanded" : "chip", data.dimmed ? "dimmed" : ""]
    .filter(Boolean)
    .join(" ");

  // Better-connected events sit physically heavier in the sky.
  const size = nodeRadius(data.degree) * 2;

  return (
    <div className={classes} style={data.expanded ? undefined : { minHeight: size }}>
      <Handle type="target" position={Position.Left} />

      <div className="star-domain">{data.domain ?? "source unknown"}</div>
      <div className="star-title">{data.title}</div>

      {data.expanded && data.summary?.executive_summary && (
        <p className="star-summary">{data.summary.executive_summary}</p>
      )}

      <div className="star-degree">
        <span className="pip" aria-hidden="true" />
        {data.degree} {data.degree === 1 ? "link" : "links"}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

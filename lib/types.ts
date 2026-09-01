export type AnalysisSection = Record<string, string[]>;

export type ArticleSummary = {
  executive_summary?: string;
  swot_analysis?: AnalysisSection;
  pest_analysis?: AnalysisSection;
  diamond_e_analysis?: AnalysisSection;
};

export type Article = {
  id: number;
  title: string;
  url: string | null;
  domain: string | null;
  published_at: string | null;
  summary: ArticleSummary | null;
};

export type Prediction = {
  horizon: string;
  claim: string;
  confidence: number;
};

export type GraphNodeData = {
  title: string;
  url: string | null;
  domain: string | null;
  publishedAt: string | null;
  summary: ArticleSummary | null;
  degree: number;
  insight: {
    eventSummary: string | null;
    predictions: Prediction[] | null;
  } | null;
};

export type GraphNode = {
  id: string;
  type: "articleNode";
  data: GraphNodeData;
};

export type GraphEdgeData = {
  strength: number | null;
  explanation: string | null;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  data: GraphEdgeData;
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

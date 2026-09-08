export type PipelineHealth = {
  articles: {
    total: number;
    awaitingSummary: number;
    awaitingEmbed: number;
    last24h: number;
    newestPublished: string | null;
    lastWrite: string | null;
  };
  linkages: {
    total: number;
    linked: number;
    rejected: number;
    aboveFloor: number;
    lastWrite: string | null;
  };
  insights: {
    total: number;
    lastWrite: string | null;
  };
  strengthHistogram: { floor: string; count: number }[];
};

export type AdminLinkage = {
  id: number;
  strength: number | null;
  similarity: number;
  explanation: string | null;
  is_linked: boolean;
  verified: boolean;
  model_used: string | null;
  created_at: string;
  source_id: number;
  source_title: string;
  target_id: number;
  target_title: string;
};

export type SettingRow = {
  key: string;
  value: number;
  description: string | null;
  updated_at: string;
};

/** What a server action hands back to the form it was called from. */
export type ActionResult = { ok: true } | { ok: false; error: string };

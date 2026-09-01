// The free/paid seam. With auth deferred this is a constant; when accounts
// land it becomes a lookup on the signed-in user and nothing else changes.
export const FREE_TIER_NODE_LIMIT = 10;

// Wider than the old backend's 24 hours, which left Apercu empty between crawls.
export const APERCU_WINDOW_DAYS = 7;

/**
 * Only draw links the verifier was reasonably confident about.
 * Measured separation on real data: rejected pairs land at 0.0-0.2, accepted
 * ones at 0.35-0.6. A 0.4 floor keeps the confident half of the accepted band.
 */
export const MIN_LINK_STRENGTH = 0.4;
export const GRAPH_WINDOW_DAYS = 7;

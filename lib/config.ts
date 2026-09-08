// The free/paid seam. With auth deferred this is a constant; when accounts
// land it becomes a lookup on the signed-in user and nothing else changes.
export const FREE_TIER_NODE_LIMIT = 10;

// Wider than the old backend's 24 hours, which left Apercu empty between crawls.
export const APERCU_WINDOW_DAYS = 7;

/**
 * Only draw links the verifier was reasonably confident about.
 *
 * Rejected pairs still land at 0.0-0.2, so a floor in the 0.2-0.3 gap is doing
 * real work. The accepted side is not the 0.35-0.6 spread this was originally
 * set against, though: measured across 14 accepted links it is a spike --
 * twelve at 0.35, one at 0.4, one at 0.6. A 0.4 floor therefore sat directly on
 * top of the mode and hid 12 of 14 edges, which is what left Catographic empty.
 *
 * 0.3 admits the whole accepted band, so this is currently a guard against
 * rejects leaking in rather than a confidence filter. It only becomes a real
 * tunable again once discover_linkages.py stops parking on 0.35 -- see the
 * anchoring note in that file's VERIFY_PROMPT.
 */
export const MIN_LINK_STRENGTH = 0.3;

/**
 * get_graph requires BOTH endpoints of an edge inside the window, so the graph
 * is only as durable as its most-connected article. At 7 days a single hub
 * aging out blanked the page mid-day: the degree-6 "Mortgage rates" article
 * crossed the boundary and took the last two above-floor edges with it.
 * 14 days keeps a hub for a second week rather than to the hour.
 */
export const GRAPH_WINDOW_DAYS = 14;

import "server-only";

/**
 * AI cost model for the admin "margin per customer" view.
 *
 * The Copilot runs entirely on Mistral Large (mistral-large-latest); every
 * chat turn records token_usage_in/out on chat_messages, so we can put a real
 * € cost against each org and compare it to the revenue they pay us.
 *
 * NOTE: these are list-price ESTIMATES (Mistral bills in USD; converted to EUR
 * at a rounded rate). Update them here when the contract price changes — this
 * is the single source of truth for the cost side of the margin maths.
 */

// € per 1,000,000 tokens. Mistral Large 2: ~$2 in / ~$6 out, ≈ €1.85 / €5.55.
export const MISTRAL_LARGE_EUR_PER_1M_INPUT = 1.85;
export const MISTRAL_LARGE_EUR_PER_1M_OUTPUT = 5.55;

/** € cost of a token bundle at Mistral Large list price. */
export function aiCostEur(tokensIn: number, tokensOut: number): number {
  return (
    (tokensIn / 1_000_000) * MISTRAL_LARGE_EUR_PER_1M_INPUT +
    (tokensOut / 1_000_000) * MISTRAL_LARGE_EUR_PER_1M_OUTPUT
  );
}

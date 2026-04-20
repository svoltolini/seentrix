import { createMistral } from "@ai-sdk/mistral";

/**
 * Singleton Mistral provider wired to the user's EU-hosted account.
 *
 * We deliberately create this in one place so:
 *  1) API key reads stay server-side only (never bundled into client code)
 *  2) Every call picks up the same defaults and telemetry
 *  3) If we ever need to swap provider (e.g. Claude via AWS Bedrock EU),
 *     we only change this file
 *
 * Models used:
 *  - chat:      mistral-large-latest (Mistral Large 2) — all plans
 *  - embedding: mistral-embed (1024-dim vectors, French/English/German)
 */

const apiKey = process.env.MISTRAL_API_KEY;
if (!apiKey) {
  throw new Error(
    "MISTRAL_API_KEY is not set — add it to your Vercel environment or .env.local",
  );
}

export const mistral = createMistral({ apiKey });

export const MISTRAL_CHAT_MODEL = "mistral-large-latest" as const;
export const MISTRAL_EMBED_MODEL = "mistral-embed" as const;

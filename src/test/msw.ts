import { setupServer } from "msw/node";
import type { RequestHandler } from "msw";

// A shared MSW server for integration tests that exercise real fetch/JSON
// parsing against mocked HTTP endpoints (OSV.dev, CISA KEV, Supabase REST).
// Tests register per-suite handlers via `server.use(...)` and the lifecycle
// hooks below keep them isolated.
export const server = setupServer();

export function startMsw(handlers: RequestHandler[] = []) {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  beforeEach(() => {
    if (handlers.length) server.use(...handlers);
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}

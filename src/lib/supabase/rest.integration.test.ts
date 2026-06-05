import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { server } from "@/test/msw";

// Integration tests that drive the REAL @supabase/supabase-js client against
// a mocked PostgREST endpoint via MSW. This exercises the client's actual
// request building (filters, ordering, count headers, insert payloads) and
// response/error parsing — the same query shapes the SBOM and conformity
// server actions rely on — without standing up a database.

const SUPABASE_URL = "https://test-project.supabase.co";
const REST = `${SUPABASE_URL}/rest/v1`;

function makeClient(): SupabaseClient {
  return createClient(SUPABASE_URL, "test-anon-key", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Supabase REST (real client via MSW)", () => {
  it("lists SBOMs filtered by product_id and ordered by created_at desc", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${REST}/sboms`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([
          { id: "s1", product_id: "p1", created_at: "2026-06-02T00:00:00Z" },
          { id: "s2", product_id: "p1", created_at: "2026-06-01T00:00:00Z" },
        ]);
      })
    );

    const supabase = makeClient();
    const { data, error } = await supabase
      .from("sboms")
      .select("id, product_id, created_at")
      .eq("product_id", "p1")
      .order("created_at", { ascending: false });

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data?.[0].id).toBe("s1");
    // The real client must have encoded the filter + ordering into the URL.
    expect(capturedUrl).toContain("product_id=eq.p1");
    expect(capturedUrl).toContain("order=created_at.desc");
  });

  it("surfaces a PostgREST error in the { error } tuple instead of throwing", async () => {
    server.use(
      http.get(`${REST}/sboms`, () =>
        HttpResponse.json(
          { message: "permission denied", code: "42501" },
          { status: 403 }
        )
      )
    );

    const supabase = makeClient();
    const { data, error } = await supabase.from("sboms").select("id");

    expect(data).toBeNull();
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/permission denied/i);
  });

  it("returns an exact head count (count: 'exact', head: true)", async () => {
    server.use(
      http.head(`${REST}/checklist_items`, () =>
        new HttpResponse(null, {
          status: 200,
          headers: {
            // PostgREST reports counts in the Content-Range header.
            "content-range": "*/7",
          },
        })
      )
    );

    const supabase = makeClient();
    const { count, error } = await supabase
      .from("checklist_items")
      .select("id", { count: "exact", head: true })
      .eq("product_id", "p1")
      .neq("status", "not_applicable");

    expect(error).toBeNull();
    expect(count).toBe(7);
  });

  it("inserts a row and returns the created record via .select().single()", async () => {
    let receivedBody: unknown = null;
    server.use(
      http.post(`${REST}/sboms`, async ({ request }) => {
        receivedBody = await request.json();
        // `.single()` sets the PostgREST object Accept header, so the server
        // responds with a single object (not an array).
        const single = request.headers
          .get("accept")
          ?.includes("vnd.pgrst.object");
        const row = { id: "new-sbom-id" };
        return HttpResponse.json(single ? row : [row], { status: 201 });
      })
    );

    const supabase = makeClient();
    const { data, error } = await supabase
      .from("sboms")
      .insert({ product_id: "p1", sbom_format: "cyclonedx", total_components: 3 })
      .select("id")
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBe("new-sbom-id");
    // The insert payload reached the network as sent.
    expect(receivedBody).toMatchObject({
      product_id: "p1",
      sbom_format: "cyclonedx",
      total_components: 3,
    });
  });

  it("filters vulnerabilities with .in() over a list of component ids", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${REST}/vulnerabilities`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([{ id: "v1" }, { id: "v2" }]);
      })
    );

    const supabase = makeClient();
    const { data, error } = await supabase
      .from("vulnerabilities")
      .select("id")
      .in("sbom_component_id", ["c1", "c2", "c3"]);

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(decodeURIComponent(capturedUrl)).toContain(
      "sbom_component_id=in.(c1,c2,c3)"
    );
  });
});

"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import {
  computeReadiness,
  readinessScore,
  type ReadinessItem,
} from "@/lib/constants/cra-readiness";
import {
  gatherReadinessInputs,
  emptyReadinessInput,
} from "@/lib/readiness/gather";

export interface ReadinessState {
  productName: string;
  items: ReadinessItem[];
  score: ReturnType<typeof readinessScore>;
}

async function getAuthContext() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { supabase, user: null, orgId: null };
  const orgId = (user.app_metadata?.org_id as string | undefined) ?? null;
  return { supabase, user, orgId };
}

export async function loadReadiness(
  productId: string,
): Promise<{ state: ReadinessState | null; error?: string }> {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) return { state: null, error: "notAuthenticated" };

  const { data: product } = await supabase
    .from("products")
    .select("name")
    .eq("id", productId)
    .single();
  if (!product) return { state: null, error: "notFound" };

  const inputs = await gatherReadinessInputs(supabase, orgId, [productId]);
  const input = inputs.get(productId);
  const items = input
    ? computeReadiness(input)
    : computeReadiness(emptyReadinessInput());
  return {
    state: {
      productName: (product as { name: string }).name ?? "",
      items,
      score: readinessScore(items),
    },
  };
}

export interface ReadinessRollupRow {
  id: string;
  name: string;
  percent: number;
}

export async function getReadinessRollup(): Promise<ReadinessRollupRow[]> {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) return [];
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("org_id", orgId)
    .order("name", { ascending: true });
  const list = (products as { id: string; name: string }[] | null) ?? [];
  if (list.length === 0) return [];
  const inputs = await gatherReadinessInputs(
    supabase,
    orgId,
    list.map((p) => p.id),
  );
  return list.map((p) => {
    const input = inputs.get(p.id);
    const percent = input
      ? readinessScore(computeReadiness(input)).percent
      : 0;
    return { id: p.id, name: p.name, percent };
  });
}

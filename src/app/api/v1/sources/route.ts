/**
 * GET /api/v1/sources
 *
 * List all approved Verified Sources.
 * Only returns sources where approved_at IS NOT NULL.
 */

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api/auth";

interface SourceEntry {
  source_id: string;
  name: string;
  slug: string;
  website: string | null;
  description: string | null;
  joined_at: string;
}

interface SourcesResponse {
  sources: SourceEntry[];
  total: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const region = searchParams.get("region");

  const supabase = createAdminClient();

  // Query approved sources
  // Note: region filtering would require a region column in verified_sources
  // For now, we'll ignore it as it's not in the current schema
  void region; // Acknowledge unused parameter for future use

  const { data: sources, error, count } = await supabase
    .from("verified_sources")
    .select("id, name, slug, website, description, approved_at", { count: "exact" })
    .not("approved_at", "is", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch sources:", error);
    return apiError("database_error", "Failed to fetch sources", 500);
  }

  // Transform the data
  const sourceList: SourceEntry[] = (sources || []).map((source) => ({
    source_id: source.id,
    name: source.name,
    slug: source.slug,
    website: source.website,
    description: source.description,
    joined_at: source.approved_at?.split("T")[0] || "",
  }));

  const response: SourcesResponse = {
    sources: sourceList,
    total: count || 0,
  };

  return apiSuccess(response);
}

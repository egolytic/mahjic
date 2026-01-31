/**
 * API Authentication Middleware
 *
 * Validates API keys for Verified Sources.
 * API keys are passed via Authorization header as Bearer tokens.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export interface VerifiedSource {
  id: string;
  name: string;
  slug: string;
  contact_email: string;
  website: string | null;
  description: string | null;
  created_at: string;
  approved_at: string | null;
}

export interface AuthResult {
  success: true;
  source: VerifiedSource;
}

export interface AuthError {
  success: false;
  error: string;
  status: number;
}

/**
 * Validates the API key from the Authorization header.
 * Returns the verified source if valid, or an error response.
 */
export async function validateApiKey(
  request: NextRequest
): Promise<AuthResult | AuthError> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return {
      success: false,
      error: "Missing Authorization header",
      status: 401,
    };
  }

  if (!authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      error: "Invalid Authorization header format. Expected: Bearer <api_key>",
      status: 401,
    };
  }

  const apiKey = authHeader.slice(7); // Remove "Bearer " prefix

  if (!apiKey) {
    return {
      success: false,
      error: "API key is required",
      status: 401,
    };
  }

  const supabase = createAdminClient();

  // Look up the source by API key
  const { data: source, error } = await supabase
    .from("verified_sources")
    .select("id, name, slug, contact_email, website, description, created_at, approved_at")
    .eq("api_key", apiKey)
    .single();

  if (error || !source) {
    return {
      success: false,
      error: "Invalid API key",
      status: 401,
    };
  }

  // Check if the source is approved
  if (!source.approved_at) {
    return {
      success: false,
      error: "Source not approved. Your application is still under review.",
      status: 403,
    };
  }

  return {
    success: true,
    source,
  };
}

/**
 * Creates a standardized error response.
 */
export function apiError(
  code: string,
  message: string,
  status: number
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        status,
      },
    },
    { status }
  );
}

/**
 * Creates a standardized success response.
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

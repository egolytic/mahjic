// Browser client - for Client Components
export { createClient } from "./client";

// Server client - for Server Components and Route Handlers
export { createClient as createServerClient } from "./server";

// Admin client - bypasses RLS, server-side only
export { createAdminClient } from "./admin";

// Middleware helper - for Next.js middleware
export { updateSession } from "./middleware";

import { createClient } from "@supabase/supabase-js";

// Service role client — ONLY use in trusted server-side code (webhooks, admin tasks).
// Lazy-initialized to prevent build-time errors when env vars are not set.
// Never expose the service role key to the client.
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase admin client cannot be created: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set."
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Export a Proxy so call sites use `supabaseAdmin.from(...)` as before,
// but the actual client is created lazily on first property access.
export const supabaseAdmin = new Proxy({} as ReturnType<typeof getAdminClient>, {
  get(_target, prop, receiver) {
    const client = getAdminClient();
    return Reflect.get(client, prop, receiver);
  },
});

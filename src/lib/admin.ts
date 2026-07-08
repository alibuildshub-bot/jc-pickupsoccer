import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const adminPassword = process.env.ADMIN_PASSWORD;

export function isAdminRequest(request: Request) {
  const providedPassword = request.headers.get("x-admin-password");

  return Boolean(adminPassword && providedPassword && providedPassword === adminPassword);
}

export function createSupabaseAdminClient() {
  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseSecretKey);
}

export function adminConfigError() {
  return Response.json(
    {
      error:
        "Admin is not configured. Add SUPABASE_SECRET_KEY and ADMIN_PASSWORD in Vercel environment variables.",
    },
    { status: 500 },
  );
}

export function unauthorizedError() {
  return Response.json({ error: "Invalid admin password." }, { status: 401 });
}

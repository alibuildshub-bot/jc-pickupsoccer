import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

export async function isAdminRequest(request: Request) {
  const providedPassword = request.headers.get("x-admin-password");

  if (adminPassword && providedPassword && providedPassword === adminPassword) {
    return true;
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

  if (!token || !adminEmail) {
    return false;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user.email) {
    return false;
  }

  return data.user.email.toLowerCase() === adminEmail;
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
        "Admin is not configured. Add SUPABASE_SECRET_KEY and ADMIN_EMAIL in Vercel environment variables.",
    },
    { status: 500 },
  );
}

export function unauthorizedError() {
  return Response.json({ error: "You are not authorized to manage this site." }, { status: 401 });
}

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const supabaseSecretKey = (
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  ""
).trim();
const adminPassword = process.env.ADMIN_PASSWORD?.trim();
const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function isAdminRequest(request: Request) {
  const authInfo = await getAdminAuthInfo(request);

  return authInfo.allowed;
}

export async function getAdminAuthInfo(request: Request) {
  const providedPassword = request.headers.get("x-admin-password");

  if (adminPassword && providedPassword && providedPassword === adminPassword) {
    return {
      allowed: true,
      method: "password",
      email: null,
      hasToken: false,
      tokenValid: false,
      adminEmailConfigured: adminEmails.length > 0,
      serverConfigured: Boolean(supabaseUrl && supabaseSecretKey),
      reason: "Password fallback accepted.",
    };
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

  if (!token || adminEmails.length === 0) {
    return {
      allowed: false,
      method: token ? "google" : "none",
      email: null,
      hasToken: Boolean(token),
      tokenValid: false,
      adminEmailConfigured: adminEmails.length > 0,
      serverConfigured: Boolean(supabaseUrl && supabaseSecretKey),
      reason: !token ? "No Google session token reached the server." : "ADMIN_EMAIL is not configured.",
    };
  }

  const supabase = createSupabaseAuthClient();
  if (!supabase) {
    return {
      allowed: false,
      method: "google",
      email: null,
      hasToken: true,
      tokenValid: false,
      adminEmailConfigured: adminEmails.length > 0,
      serverConfigured: false,
      reason: "Supabase auth key is not configured.",
    };
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user.email) {
    return {
      allowed: false,
      method: "google",
      email: null,
      hasToken: true,
      tokenValid: false,
      adminEmailConfigured: adminEmails.length > 0,
      serverConfigured: true,
      reason: error?.message || "Google session did not include an email.",
    };
  }

  const email = data.user.email.trim().toLowerCase();
  const allowed = adminEmails.includes(email);

  return {
    allowed,
    method: "google",
    email,
    hasToken: true,
    tokenValid: true,
    adminEmailConfigured: adminEmails.length > 0,
    serverConfigured: true,
    reason: allowed ? "Google account accepted." : "Signed-in Google email does not match ADMIN_EMAIL.",
  };
}

export function createSupabaseAdminClient() {
  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseSecretKey);
}

function createSupabaseAuthClient() {
  const authKey = supabasePublishableKey || supabaseSecretKey;

  if (!supabaseUrl || !authKey) {
    return null;
  }

  return createClient(supabaseUrl, authKey);
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

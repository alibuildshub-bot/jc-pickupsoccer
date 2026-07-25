import { createSupabaseAdminClient } from "@/lib/admin";

type AnalyticsPayload = {
  path?: string;
  referrer?: string;
  visitorId?: string;
};

export async function POST(request: Request) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.warn("Analytics skipped: Supabase admin client is not configured.");
    return Response.json({ ok: true, skipped: true });
  }

  const payload = (await request.json().catch(() => ({}))) as AnalyticsPayload;
  const path = sanitizePath(payload.path);
  const visitorId = sanitizeText(payload.visitorId, 120);

  if (!path || !visitorId) {
    return Response.json({ ok: true, skipped: true });
  }

  const userAgent = sanitizeText(request.headers.get("user-agent"), 500);
  const referrer = sanitizeText(payload.referrer, 500);

  const { error } = await supabase.from("site_visits").insert({
    path,
    referrer: referrer || null,
    visitor_id: visitorId,
    user_agent: userAgent || null,
  });

  if (error && isMissingAnalyticsTable(error)) {
    console.warn("Analytics skipped: site_visits table is missing or incomplete.", error);
    return Response.json({ ok: true, setupNeeded: true });
  }

  if (error) {
    console.error("Analytics insert failed:", error);
    return Response.json({ ok: true, skipped: true });
  }

  return Response.json({ ok: true });
}

function sanitizePath(value?: string) {
  if (!value || !value.startsWith("/")) return "/";

  return value.slice(0, 250);
}

function sanitizeText(value: string | null | undefined, maxLength: number) {
  return (value || "").trim().slice(0, maxLength);
}

function isMissingAnalyticsTable(error: { code?: string; message?: string }) {
  return error.code === "42P01" || error.message?.toLowerCase().includes("site_visits");
}

import {
  adminConfigError,
  createSupabaseAdminClient,
  isAdminRequest,
  unauthorizedError,
} from "@/lib/admin";

type PlayerSessionFlagPayload = {
  player_id?: string;
  session_date?: string;
  exclude_from_averages?: boolean;
  reason?: string;
};

const flagSelect = "id,player_id,session_date,exclude_from_averages,reason";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const { data, error } = await supabase
    .from("player_session_flags")
    .select(flagSelect)
    .order("session_date", { ascending: false });

  if (error) {
    if (isMissingPlayerSessionFlagsTable(error)) {
      return Response.json({ flags: [], setupNeeded: true });
    }

    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ flags: data || [], setupNeeded: false });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const payload = (await request.json()) as PlayerSessionFlagPayload;
  const validationError = validateFlagPayload(payload);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const row = {
    player_id: payload.player_id,
    session_date: payload.session_date,
    exclude_from_averages: payload.exclude_from_averages !== false,
    reason: payload.reason?.trim() || "goalie_only",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("player_session_flags")
    .upsert(row, { onConflict: "player_id,session_date" })
    .select(flagSelect)
    .single();

  if (error) {
    if (isMissingPlayerSessionFlagsTable(error)) {
      return Response.json(
        { error: "Goalie-only sessions are not set up yet. Run supabase-player-session-flags.sql in Supabase first." },
        { status: 500 },
      );
    }

    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ flag: data });
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("player_id");
  const sessionDate = searchParams.get("session_date");

  if (!playerId || !sessionDate) {
    return Response.json({ error: "Player and session date are required." }, { status: 400 });
  }

  const { error } = await supabase
    .from("player_session_flags")
    .delete()
    .eq("player_id", playerId)
    .eq("session_date", sessionDate);

  if (error) {
    if (isMissingPlayerSessionFlagsTable(error)) {
      return Response.json(
        { error: "Goalie-only sessions are not set up yet. Run supabase-player-session-flags.sql in Supabase first." },
        { status: 500 },
      );
    }

    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

function validateFlagPayload(payload: PlayerSessionFlagPayload) {
  if (!payload.player_id) return "Player is required.";
  if (!payload.session_date) return "Session date is required.";

  return null;
}

function isMissingPlayerSessionFlagsTable(error: { code?: string; message?: string }) {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    Boolean(error.message?.includes("player_session_flags"))
  );
}

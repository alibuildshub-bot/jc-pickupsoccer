import {
  adminConfigError,
  createSupabaseAdminClient,
  isAdminRequest,
  unauthorizedError,
} from "@/lib/admin";

type MatchPayload = {
  id?: string;
  match_date?: string;
  week_label?: string;
  location?: string;
  team_a_name?: string;
  team_b_name?: string;
  team_a_score?: number;
  team_b_score?: number;
  status?: string;
};

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const { data, error } = await supabase
    .from("matches")
    .select("id,match_date,week_label,location,team_a_name,team_b_name,team_a_score,team_b_score,status,created_at")
    .order("match_date", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ matches: data });
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const payload = (await request.json()) as MatchPayload;
  const validationError = validateMatchPayload(payload);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("matches")
    .insert(matchPayloadToRow(payload))
    .select("id,match_date,week_label,location,team_a_name,team_b_name,team_a_score,team_b_score,status,created_at")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ match: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const payload = (await request.json()) as MatchPayload;

  if (!payload.id) {
    return Response.json({ error: "Match id is required." }, { status: 400 });
  }

  const validationError = validateMatchPayload(payload);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("matches")
    .update(matchPayloadToRow(payload))
    .eq("id", payload.id)
    .select("id,match_date,week_label,location,team_a_name,team_b_name,team_a_score,team_b_score,status,created_at")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ match: data });
}

export async function DELETE(request: Request) {
  if (!isAdminRequest(request)) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Match id is required." }, { status: 400 });
  }

  const { error } = await supabase.from("matches").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

function validateMatchPayload(payload: MatchPayload) {
  if (!payload.match_date) return "Match date is required.";
  if (!payload.week_label?.trim()) return "Week label is required.";
  if (!payload.team_a_name?.trim()) return "Team A name is required.";
  if (!payload.team_b_name?.trim()) return "Team B name is required.";

  return null;
}

function matchPayloadToRow(payload: MatchPayload) {
  return {
    match_date: payload.match_date,
    week_label: payload.week_label?.trim(),
    location: payload.location?.trim() || null,
    team_a_name: payload.team_a_name?.trim(),
    team_b_name: payload.team_b_name?.trim(),
    team_a_score: Number(payload.team_a_score || 0),
    team_b_score: Number(payload.team_b_score || 0),
    status: payload.status || "completed",
  };
}

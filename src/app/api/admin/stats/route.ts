import {
  adminConfigError,
  createSupabaseAdminClient,
  isAdminRequest,
  unauthorizedError,
} from "@/lib/admin";

type StatPayload = {
  id?: string;
  match_id?: string;
  player_id?: string;
  team_name?: string;
  goals?: number;
  assists?: number;
  result?: string;
};

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const { data, error } = await supabase
    .from("match_players")
    .select("id,match_id,player_id,team_name,goals,assists,result,players(name),matches(week_label,match_date)")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ stats: data });
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const payload = (await request.json()) as StatPayload;
  const validationError = validateStatPayload(payload);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("match_players")
    .insert(statPayloadToRow(payload))
    .select("id,match_id,player_id,team_name,goals,assists,result")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ stat: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const payload = (await request.json()) as StatPayload;

  if (!payload.id) {
    return Response.json({ error: "Stat row id is required." }, { status: 400 });
  }

  const validationError = validateStatPayload(payload);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("match_players")
    .update(statPayloadToRow(payload))
    .eq("id", payload.id)
    .select("id,match_id,player_id,team_name,goals,assists,result")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ stat: data });
}

export async function DELETE(request: Request) {
  if (!isAdminRequest(request)) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Stat row id is required." }, { status: 400 });
  }

  const { error } = await supabase.from("match_players").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

function validateStatPayload(payload: StatPayload) {
  if (!payload.match_id) return "Match is required.";
  if (!payload.player_id) return "Player is required.";
  if (!payload.team_name?.trim()) return "Team name is required.";
  if (!["win", "loss", "draw"].includes(payload.result || "")) return "Result must be win, loss, or draw.";

  return null;
}

function statPayloadToRow(payload: StatPayload) {
  return {
    match_id: payload.match_id,
    player_id: payload.player_id,
    team_name: payload.team_name?.trim(),
    goals: Number(payload.goals || 0),
    assists: Number(payload.assists || 0),
    result: payload.result,
  };
}

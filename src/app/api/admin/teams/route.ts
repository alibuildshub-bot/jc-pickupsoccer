import {
  adminConfigError,
  createSupabaseAdminClient,
  isAdminRequest,
  unauthorizedError,
} from "@/lib/admin";

type TeamPayload = {
  id?: string;
  name?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
};

type RosterPayload = {
  action?: "add_player" | "remove_player";
  team_id?: string;
  player_id?: string;
};

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const [teamsResult, rosterResult] = await Promise.all([
    supabase
      .from("tournament_teams")
      .select("id,name,color,sort_order,is_active,created_at")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("tournament_team_players")
      .select("id,team_id,player_id,players(name)")
      .order("created_at", { ascending: true }),
  ]);

  if (teamsResult.error) {
    return Response.json({ error: teamsResult.error.message }, { status: 500 });
  }

  if (rosterResult.error) {
    return Response.json({ error: rosterResult.error.message }, { status: 500 });
  }

  return Response.json({
    teams: teamsResult.data,
    roster: rosterResult.data,
  });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const payload = (await request.json()) as TeamPayload & RosterPayload;

  if (payload.action) {
    return updateRoster(payload, supabase);
  }

  const teamPayload: TeamPayload = payload;
  const validationError = validateTeamPayload(teamPayload);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tournament_teams")
    .insert(teamPayloadToRow(teamPayload))
    .select("id,name,color,sort_order,is_active,created_at")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ team: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const payload = (await request.json()) as TeamPayload;

  if (!payload.id) {
    return Response.json({ error: "Team id is required." }, { status: 400 });
  }

  const validationError = validateTeamPayload(payload);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tournament_teams")
    .update(teamPayloadToRow(payload))
    .eq("id", payload.id)
    .select("id,name,color,sort_order,is_active,created_at")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ team: data });
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Team id is required." }, { status: 400 });
  }

  const { error } = await supabase.from("tournament_teams").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

async function updateRoster(
  payload: RosterPayload,
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
) {
  if (!payload.team_id || !payload.player_id) {
    return Response.json({ error: "Team and player are required." }, { status: 400 });
  }

  if (payload.action === "remove_player") {
    const { error } = await supabase
      .from("tournament_team_players")
      .delete()
      .eq("team_id", payload.team_id)
      .eq("player_id", payload.player_id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  const { data, error } = await supabase
    .from("tournament_team_players")
    .insert({
      team_id: payload.team_id,
      player_id: payload.player_id,
    })
    .select("id,team_id,player_id")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ roster: data }, { status: 201 });
}

function validateTeamPayload(payload: TeamPayload) {
  if (!payload.name?.trim()) return "Team name is required.";

  return null;
}

function teamPayloadToRow(payload: TeamPayload) {
  return {
    name: payload.name?.trim(),
    color: payload.color?.trim() || "#1f7a4d",
    sort_order: Number(payload.sort_order || 0),
    is_active: payload.is_active ?? true,
  };
}

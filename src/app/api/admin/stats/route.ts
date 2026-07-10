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
};

type MatchForResult = {
  team_a_name: string;
  team_b_name: string;
  team_a_score: number;
  team_b_score: number;
  status: string;
};

const statSelect = "id,match_id,player_id,team_name,goals,assists,result,players(name),matches(week_label,match_date)";
const statMutationSelect = "id,match_id,player_id,team_name,goals,assists,result";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const { data, error } = await supabase
    .from("match_players")
    .select(statSelect)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ stats: data });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const payload = (await request.json()) as StatPayload;
  const validationError = validateStatPayload(payload);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const result = await calculateResult(payload, supabase);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  const rowPayload = statPayloadToRow(payload, result.result);

  const { data: existingStat, error: existingStatError } = await supabase
    .from("match_players")
    .select("id")
    .eq("match_id", payload.match_id)
    .eq("player_id", payload.player_id)
    .eq("team_name", payload.team_name?.trim())
    .maybeSingle();

  if (existingStatError) {
    return Response.json({ error: existingStatError.message }, { status: 500 });
  }

  if (existingStat) {
    const { data, error } = await supabase
      .from("match_players")
      .update(rowPayload)
      .eq("id", existingStat.id)
      .select(statMutationSelect)
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ stat: data, updatedExisting: true });
  }

  const { data, error } = await supabase
    .from("match_players")
    .insert(rowPayload)
    .select(statMutationSelect)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ stat: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

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

  const result = await calculateResult(payload, supabase);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  const rowPayload = statPayloadToRow(payload, result.result);

  const { data, error } = await supabase
    .from("match_players")
    .update(rowPayload)
    .eq("id", payload.id)
    .select(statMutationSelect)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ stat: data });
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

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

  return null;
}

async function calculateResult(
  payload: StatPayload,
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
) {
  const { data: match, error } = await supabase
    .from("matches")
    .select("team_a_name,team_b_name,team_a_score,team_b_score,status")
    .eq("id", payload.match_id)
    .single();

  if (error || !match) {
    return { error: error?.message || "Match not found." };
  }

  const typedMatch = match as MatchForResult;
  if (typedMatch.status !== "completed" && typedMatch.status !== "live") {
    return { error: "Mark the game Live or Completed before adding player stats." };
  }

  const teamName = payload.team_name?.trim();
  const isTeamA = teamName === typedMatch.team_a_name;
  const isTeamB = teamName === typedMatch.team_b_name;

  if (!isTeamA && !isTeamB) {
    return { error: "Selected team is not part of this match." };
  }

  if (typedMatch.team_a_score === typedMatch.team_b_score) {
    return { result: "draw" };
  }

  const didTeamAWin = typedMatch.team_a_score > typedMatch.team_b_score;

  return { result: isTeamA === didTeamAWin ? "win" : "loss" };
}

function statPayloadToRow(payload: StatPayload, result: string) {
  return {
    match_id: payload.match_id,
    player_id: payload.player_id,
    team_name: payload.team_name?.trim(),
    goals: Number(payload.goals || 0),
    assists: Number(payload.assists || 0),
    result,
  };
}

import {
  adminConfigError,
  createSupabaseAdminClient,
  isScorerRequest,
  unauthorizedError,
} from "@/lib/admin";

type MatchPayload = {
  action?: "score" | "stat" | "create_match" | "update_match" | "delete_match";
  match_id?: string;
  match_date?: string;
  week_label?: string;
  team_a_name?: string;
  team_b_name?: string;
  team_a_score?: number;
  team_b_score?: number;
  status?: "live" | "completed";
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

const matchSelect =
  "id,match_date,start_time,end_time,week_label,location,team_a_name,team_b_name,team_a_score,team_b_score,status,created_at";
const teamSelect =
  "id,name,color,logo_url,sort_order,is_active,created_at,session_date,session_start_time,session_end_time,session_location";
const statSelect =
  "id,match_id,player_id,team_name,goals,assists,result,players(name),matches(week_label,match_date)";
const statMutationSelect = "id,match_id,player_id,team_name,goals,assists,result";

export async function GET(request: Request) {
  if (!(await isScorerRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const [matchesResult, playersResult, teamsResult, rosterResult, statsResult] = await Promise.all([
    supabase.from("matches").select(matchSelect).order("match_date", { ascending: false }),
    supabase.from("players").select("id,name,nickname,position,is_active").order("name", { ascending: true }),
    supabase
      .from("tournament_teams")
      .select(teamSelect)
      .order("session_date", { ascending: false, nullsFirst: false })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("tournament_team_players")
      .select("id,team_id,player_id,players(name)")
      .order("created_at", { ascending: true }),
    supabase.from("match_players").select(statSelect).order("created_at", { ascending: false }),
  ]);

  const failedResult = [matchesResult, playersResult, teamsResult, rosterResult, statsResult].find(
    (result) => result.error,
  );

  if (failedResult?.error) {
    return Response.json({ error: failedResult.error.message }, { status: 500 });
  }

  return Response.json({
    matches: matchesResult.data || [],
    players: playersResult.data || [],
    teams: teamsResult.data || [],
    roster: rosterResult.data || [],
    stats: statsResult.data || [],
  });
}

export async function POST(request: Request) {
  if (!(await isScorerRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const payload = (await request.json()) as MatchPayload;

  if (payload.action === "score") {
    return saveScore(payload, supabase);
  }

  if (payload.action === "stat") {
    return saveStat(payload, supabase);
  }

  if (payload.action === "create_match") {
    return createMatch(payload, supabase);
  }

  if (payload.action === "update_match") {
    return updateMatch(payload, supabase);
  }

  if (payload.action === "delete_match") {
    return deleteMatch(payload, supabase);
  }

  return Response.json({ error: "Choose a scorer action." }, { status: 400 });
}

async function createMatch(
  payload: MatchPayload,
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
) {
  const matchDate = payload.match_date?.trim();
  const teamAName = payload.team_a_name?.trim();
  const teamBName = payload.team_b_name?.trim();
  const weekLabel = payload.week_label?.trim() || "Game";

  if (!matchDate) {
    return Response.json({ error: "Date is required." }, { status: 400 });
  }

  if (!teamAName || !teamBName) {
    return Response.json({ error: "Choose two teams for the game." }, { status: 400 });
  }

  if (teamAName === teamBName) {
    return Response.json({ error: "Choose two different teams." }, { status: 400 });
  }

  const sessionDetails = await getSessionDetails(matchDate, [teamAName, teamBName], supabase);

  const { data, error } = await supabase
    .from("matches")
    .insert({
      match_date: matchDate,
      start_time: sessionDetails.start_time,
      end_time: sessionDetails.end_time,
      week_label: weekLabel,
      location: sessionDetails.location,
      team_a_name: teamAName,
      team_b_name: teamBName,
      team_a_score: 0,
      team_b_score: 0,
      status: "scheduled",
    })
    .select(matchSelect)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ match: data }, { status: 201 });
}

async function updateMatch(
  payload: MatchPayload,
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
) {
  if (!payload.match_id) {
    return Response.json({ error: "Match is required." }, { status: 400 });
  }

  const teamAName = payload.team_a_name?.trim();
  const teamBName = payload.team_b_name?.trim();

  if (!teamAName || !teamBName) {
    return Response.json({ error: "Choose two teams for the game." }, { status: 400 });
  }

  if (teamAName === teamBName) {
    return Response.json({ error: "Choose two different teams." }, { status: 400 });
  }

  const { data: existingMatch, error: existingMatchError } = await supabase
    .from("matches")
    .select("id,match_date,team_a_name,team_b_name")
    .eq("id", payload.match_id)
    .single();

  if (existingMatchError || !existingMatch) {
    return Response.json({ error: existingMatchError?.message || "Match not found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("matches")
    .update({
      team_a_name: teamAName,
      team_b_name: teamBName,
    })
    .eq("id", payload.match_id)
    .select(matchSelect)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const typedMatch = existingMatch as { team_a_name: string; team_b_name: string };
  const teamUpdates = [
    { from: typedMatch.team_a_name, to: teamAName },
    { from: typedMatch.team_b_name, to: teamBName },
  ].filter((teamUpdate) => teamUpdate.from !== teamUpdate.to);

  for (const teamUpdate of teamUpdates) {
    const { error: statTeamError } = await supabase
      .from("match_players")
      .update({ team_name: teamUpdate.to })
      .eq("match_id", payload.match_id)
      .eq("team_name", teamUpdate.from);

    if (statTeamError) {
      return Response.json({ error: statTeamError.message }, { status: 500 });
    }
  }

  return Response.json({ match: data });
}

async function deleteMatch(
  payload: MatchPayload,
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
) {
  if (!payload.match_id) {
    return Response.json({ error: "Match is required." }, { status: 400 });
  }

  const { error: statsError } = await supabase.from("match_players").delete().eq("match_id", payload.match_id);
  if (statsError) {
    return Response.json({ error: statsError.message }, { status: 500 });
  }

  const { error } = await supabase.from("matches").delete().eq("id", payload.match_id);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

async function getSessionDetails(
  matchDate: string,
  teamNames: string[],
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
) {
  const { data } = await supabase
    .from("tournament_teams")
    .select("name,session_start_time,session_end_time,session_location")
    .eq("session_date", matchDate)
    .in("name", teamNames);

  const teamWithDetails = data?.find(
    (team) => team.session_start_time || team.session_end_time || team.session_location,
  );
  const fallbackTeam = teamWithDetails || data?.[0];

  return {
    start_time: fallbackTeam?.session_start_time || null,
    end_time: fallbackTeam?.session_end_time || null,
    location: fallbackTeam?.session_location || null,
  };
}

async function saveScore(
  payload: MatchPayload,
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
) {
  if (!payload.match_id) {
    return Response.json({ error: "Match is required." }, { status: 400 });
  }

  const matchId = payload.match_id;
  const status = payload.status === "completed" ? "completed" : "live";

  const { data, error } = await supabase
    .from("matches")
    .update({
      team_a_score: Number(payload.team_a_score || 0),
      team_b_score: Number(payload.team_b_score || 0),
      status,
    })
    .eq("id", matchId)
    .select(matchSelect)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ match: data });
}

async function saveStat(
  payload: MatchPayload,
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
) {
  const validationError = validateStatPayload(payload);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const matchId = payload.match_id as string;
  const playerId = payload.player_id as string;
  const teamName = payload.team_name?.trim() as string;
  const result = await calculateResult(payload, supabase);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  const rowPayload = {
    match_id: matchId,
    player_id: playerId,
    team_name: teamName,
    goals: Number(payload.goals || 0),
    assists: Number(payload.assists || 0),
    result: result.result,
  };

  const { data: existingStat, error: existingStatError } = await supabase
    .from("match_players")
    .select("id")
    .eq("match_id", matchId)
    .eq("player_id", playerId)
    .eq("team_name", teamName)
    .maybeSingle();

  if (existingStatError) {
    return Response.json({ error: existingStatError.message }, { status: 500 });
  }

  const query = existingStat
    ? supabase.from("match_players").update(rowPayload).eq("id", existingStat.id)
    : supabase.from("match_players").insert(rowPayload);

  const { data, error } = await query.select(statMutationSelect).single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ stat: data, updatedExisting: Boolean(existingStat) }, { status: existingStat ? 200 : 201 });
}

function validateStatPayload(payload: MatchPayload) {
  if (!payload.match_id) return "Match is required.";
  if (!payload.player_id) return "Player is required.";
  if (!payload.team_name?.trim()) return "Team name is required.";

  return null;
}

async function calculateResult(
  payload: MatchPayload,
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
) {
  const matchId = payload.match_id as string;
  const teamName = payload.team_name?.trim() as string;

  const { data: match, error } = await supabase
    .from("matches")
    .select("team_a_name,team_b_name,team_a_score,team_b_score,status")
    .eq("id", matchId)
    .single();

  if (error || !match) {
    return { error: error?.message || "Match not found." };
  }

  const typedMatch = match as MatchForResult;
  if (typedMatch.status !== "completed" && typedMatch.status !== "live") {
    return { error: "Mark the game Live or Completed before adding player stats." };
  }

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

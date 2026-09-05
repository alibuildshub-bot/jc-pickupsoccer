import {
  adminConfigError,
  createSupabaseAdminClient,
  isScorerRequest,
  unauthorizedError,
} from "@/lib/admin";

type ScorePayload = {
  action: "score";
  match_id?: string;
  team_a_score?: number;
  team_b_score?: number;
  status?: string;
};

type StatPayload = {
  action: "stat";
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

const matchSelect =
  "id,match_date,start_time,end_time,week_label,location,team_a_name,team_b_name,team_a_score,team_b_score,status,created_at";
const teamSelect =
  "id,name,color,logo_url,sort_order,is_active,session_date,session_start_time,session_end_time,session_location";
const statSelect = "id,match_id,player_id,team_name,goals,assists,result,players(name)";

export async function GET(request: Request) {
  if (!(await isScorerRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const [matches, players, teams, roster, stats] = await Promise.all([
    supabase.from("matches").select(matchSelect).order("match_date", { ascending: false }).order("created_at", { ascending: true }),
    supabase.from("players").select("id,name,is_active").eq("is_active", true).order("name"),
    supabase.from("tournament_teams").select(teamSelect).eq("is_active", true).order("sort_order").order("name"),
    supabase.from("tournament_team_players").select("id,team_id,player_id,players(name)").order("created_at", { ascending: true }),
    supabase.from("match_players").select(statSelect).order("created_at", { ascending: false }),
  ]);

  const firstError = [matches.error, players.error, teams.error, roster.error, stats.error].find(Boolean);
  if (firstError) return Response.json({ error: firstError.message }, { status: 500 });

  return Response.json({
    matches: matches.data || [],
    players: players.data || [],
    teams: teams.data || [],
    roster: roster.data || [],
    stats: stats.data || [],
  });
}

export async function POST(request: Request) {
  if (!(await isScorerRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const payload = (await request.json()) as ScorePayload | StatPayload;

  if (payload.action === "score") return saveScore(payload, supabase);
  if (payload.action === "stat") return saveStat(payload, supabase);

  return Response.json({ error: "Unknown scorer action." }, { status: 400 });
}

async function saveScore(
  payload: ScorePayload,
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
) {
  if (!payload.match_id) return Response.json({ error: "Match is required." }, { status: 400 });

  const { data, error } = await supabase
    .from("matches")
    .update({
      team_a_score: Number(payload.team_a_score || 0),
      team_b_score: Number(payload.team_b_score || 0),
      status: payload.status || "live",
    })
    .eq("id", payload.match_id)
    .select(matchSelect)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ match: data });
}

async function saveStat(
  payload: StatPayload,
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
) {
  const validationError = validateStatPayload(payload);
  if (validationError) return Response.json({ error: validationError }, { status: 400 });

  const result = await calculateResult(payload, supabase);
  if ("error" in result) return Response.json({ error: result.error }, { status: 400 });

  const rowPayload = {
    match_id: payload.match_id,
    player_id: payload.player_id,
    team_name: payload.team_name?.trim(),
    goals: Number(payload.goals || 0),
    assists: Number(payload.assists || 0),
    result: result.result,
  };

  const { data: existingStat, error: existingStatError } = await supabase
    .from("match_players")
    .select("id")
    .eq("match_id", payload.match_id)
    .eq("player_id", payload.player_id)
    .eq("team_name", payload.team_name?.trim())
    .maybeSingle();

  if (existingStatError) return Response.json({ error: existingStatError.message }, { status: 500 });

  const query = existingStat
    ? supabase.from("match_players").update(rowPayload).eq("id", existingStat.id)
    : supabase.from("match_players").insert(rowPayload);

  const { data, error } = await query.select(statSelect).single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ stat: data, updatedExisting: Boolean(existingStat) });
}

function validateStatPayload(payload: StatPayload) {
  if (!payload.match_id) return "Match is required.";
  if (!payload.player_id) return "Player is required.";
  if (!payload.team_name?.trim()) return "Team is required.";

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

  if (error || !match) return { error: error?.message || "Match not found." };

  const typedMatch = match as MatchForResult;
  if (typedMatch.status !== "completed" && typedMatch.status !== "live") {
    return { error: "Save the game as Live or Completed before adding player stats." };
  }

  const teamName = payload.team_name?.trim();
  const isTeamA = teamName === typedMatch.team_a_name;
  const isTeamB = teamName === typedMatch.team_b_name;

  if (!isTeamA && !isTeamB) return { error: "Selected team is not part of this match." };
  if (typedMatch.team_a_score === typedMatch.team_b_score) return { result: "draw" };

  const didTeamAWin = typedMatch.team_a_score > typedMatch.team_b_score;

  return { result: isTeamA === didTeamAWin ? "win" : "loss" };
}

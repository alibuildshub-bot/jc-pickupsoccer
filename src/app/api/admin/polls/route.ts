import {
  adminConfigError,
  createSupabaseAdminClient,
  isAdminRequest,
  unauthorizedError,
} from "@/lib/admin";

type PollPayload = {
  id?: string;
  action?: "reset_votes" | "close" | "open";
  title?: string;
  match_date?: string;
  player_ids?: string[];
};

type PollRow = {
  id: string;
  token: string;
  title: string;
  match_date: string | null;
  status: string;
  created_at: string;
};

type PollOptionRow = {
  id: string;
  poll_id: string;
  player_id: string | null;
  label: string;
};

type PollVoteRow = {
  id: string;
  poll_id: string;
  option_id: string;
};

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const [pollsResult, optionsResult, votesResult] = await Promise.all([
    supabase.from("mvp_polls").select("id,token,title,match_date,status,created_at").order("created_at", { ascending: false }),
    supabase.from("mvp_poll_options").select("id,poll_id,player_id,label").order("label", { ascending: true }),
    supabase.from("mvp_votes").select("id,poll_id,option_id"),
  ]);

  if (isMissingPollTable(pollsResult.error || optionsResult.error || votesResult.error)) {
    return Response.json({ polls: [], setupNeeded: true });
  }

  if (pollsResult.error) return Response.json({ error: pollsResult.error.message }, { status: 500 });
  if (optionsResult.error) return Response.json({ error: optionsResult.error.message }, { status: 500 });
  if (votesResult.error) return Response.json({ error: votesResult.error.message }, { status: 500 });

  return Response.json({
    polls: buildPollSummaries(
      (pollsResult.data || []) as PollRow[],
      (optionsResult.data || []) as PollOptionRow[],
      (votesResult.data || []) as PollVoteRow[],
    ),
    setupNeeded: false,
  });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const payload = (await request.json()) as PollPayload;

  if (payload.action) {
    return updatePoll(payload, supabase);
  }

  const title = payload.title?.trim() || "JC Footy Tournament MVP";

  const playerIds = Array.isArray(payload.player_ids) ? payload.player_ids.filter(Boolean) : [];
  const playersQuery = supabase.from("players").select("id,name").eq("is_active", true).order("name");
  const playersResult = playerIds.length > 0 ? await playersQuery.in("id", playerIds) : await playersQuery;

  if (playersResult.error) {
    return Response.json({ error: playersResult.error.message }, { status: 500 });
  }

  const players = playersResult.data || [];
  if (players.length < 2) {
    return Response.json({ error: "Add at least two active players before creating an MVP poll." }, { status: 400 });
  }

  const { data: poll, error: pollError } = await supabase
    .from("mvp_polls")
    .insert({
      token: crypto.randomUUID().replaceAll("-", ""),
      title,
      match_date: payload.match_date || null,
      status: "open",
    })
    .select("id,token,title,match_date,status,created_at")
    .single();

  if (isMissingPollTable(pollError)) {
    return Response.json({ error: "MVP poll tables are not set up yet.", setupNeeded: true }, { status: 400 });
  }

  if (pollError) {
    return Response.json({ error: pollError.message }, { status: 500 });
  }

  const { error: optionsError } = await supabase.from("mvp_poll_options").insert(
    players.map((player) => ({
      poll_id: poll.id,
      player_id: player.id,
      label: player.name,
    })),
  );

  if (optionsError) {
    return Response.json({ error: optionsError.message }, { status: 500 });
  }

  return Response.json({ poll }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) return unauthorizedError();

  const supabase = createSupabaseAdminClient();
  if (!supabase) return adminConfigError();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Poll id is required." }, { status: 400 });
  }

  const { error } = await supabase.from("mvp_polls").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

async function updatePoll(
  payload: PollPayload,
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
) {
  if (!payload.id) {
    return Response.json({ error: "Poll id is required." }, { status: 400 });
  }

  if (payload.action === "reset_votes") {
    const { error } = await supabase.from("mvp_votes").delete().eq("poll_id", payload.id);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ok: true });
  }

  if (payload.action === "close" || payload.action === "open") {
    const { data, error } = await supabase
      .from("mvp_polls")
      .update({ status: payload.action === "close" ? "closed" : "open" })
      .eq("id", payload.id)
      .select("id,token,title,match_date,status,created_at")
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ poll: data });
  }

  return Response.json({ error: "Unknown poll action." }, { status: 400 });
}

function buildPollSummaries(polls: PollRow[], options: PollOptionRow[], votes: PollVoteRow[]) {
  return polls.map((poll) => {
    const pollOptions = options.filter((option) => option.poll_id === poll.id);
    const pollVotes = votes.filter((vote) => vote.poll_id === poll.id);

    return {
      ...poll,
      totalVotes: pollVotes.length,
      options: pollOptions.map((option) => ({
        ...option,
        votes: pollVotes.filter((vote) => vote.option_id === option.id).length,
      })),
    };
  });
}

function isMissingPollTable(error: { message?: string; code?: string } | null) {
  if (!error) return false;

  return error.code === "42P01" || error.message?.toLowerCase().includes("mvp_polls");
}

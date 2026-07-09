import { createSupabaseAdminClient } from "@/lib/admin";

type VotePayload = {
  option_id?: string;
  voter_key?: string;
  voter_name?: string;
};

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return Response.json({ error: "Polls are not configured." }, { status: 500 });

  const { token } = await params;
  const { data: poll, error: pollError } = await supabase
    .from("mvp_polls")
    .select("id,token,title,match_date,status,created_at")
    .eq("token", token)
    .single();

  if (pollError || !poll) {
    return Response.json({ error: "Poll not found." }, { status: 404 });
  }

  const [optionsResult, votesResult] = await Promise.all([
    supabase.from("mvp_poll_options").select("id,poll_id,player_id,label").eq("poll_id", poll.id).order("label"),
    supabase.from("mvp_votes").select("id,option_id").eq("poll_id", poll.id),
  ]);

  if (optionsResult.error) return Response.json({ error: optionsResult.error.message }, { status: 500 });
  if (votesResult.error) return Response.json({ error: votesResult.error.message }, { status: 500 });

  const votes = votesResult.data || [];

  return Response.json({
    poll: {
      ...poll,
      totalVotes: votes.length,
      options: (optionsResult.data || []).map((option) => ({
        ...option,
        votes: votes.filter((vote) => vote.option_id === option.id).length,
      })),
    },
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return Response.json({ error: "Polls are not configured." }, { status: 500 });

  const { token } = await params;
  const payload = (await request.json()) as VotePayload;
  const voterKey = payload.voter_key?.trim();

  if (!payload.option_id || !voterKey) {
    return Response.json({ error: "Choose a player before voting." }, { status: 400 });
  }

  const { data: poll, error: pollError } = await supabase
    .from("mvp_polls")
    .select("id,status")
    .eq("token", token)
    .single();

  if (pollError || !poll) {
    return Response.json({ error: "Poll not found." }, { status: 404 });
  }

  if (poll.status !== "open") {
    return Response.json({ error: "This poll is closed." }, { status: 400 });
  }

  const { data: option, error: optionError } = await supabase
    .from("mvp_poll_options")
    .select("id")
    .eq("id", payload.option_id)
    .eq("poll_id", poll.id)
    .single();

  if (optionError || !option) {
    return Response.json({ error: "That player is not in this poll." }, { status: 400 });
  }

  const { error: voteError } = await supabase.from("mvp_votes").upsert(
    {
      poll_id: poll.id,
      option_id: option.id,
      voter_key: voterKey,
      voter_name: payload.voter_name?.trim() || null,
    },
    { onConflict: "poll_id,voter_key" },
  );

  if (voteError) {
    return Response.json({ error: voteError.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

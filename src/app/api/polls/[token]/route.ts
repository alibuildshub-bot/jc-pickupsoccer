import { createSupabaseAdminClient } from "@/lib/admin";

type VotePayload = {
  option_id?: string;
  voter_key?: string;
  voter_name?: string;
};

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return Response.json({ error: "Polls are not configured." }, { status: 500 });

  const { token } = await params;
  const { searchParams } = new URL(request.url);
  const voterKey = searchParams.get("voter_key")?.trim();
  const { data: poll, error: pollError } = await supabase
    .from("mvp_polls")
    .select("id,token,title,match_date,status,created_at")
    .eq("token", token)
    .single();

  if (pollError || !poll) {
    return Response.json({ error: "Poll not found." }, { status: 404 });
  }

  const [optionsResult, votesResult, currentVoteResult] = await Promise.all([
    supabase.from("mvp_poll_options").select("id,poll_id,player_id,label").eq("poll_id", poll.id).order("label"),
    supabase.from("mvp_votes").select("id,option_id").eq("poll_id", poll.id),
    voterKey
      ? supabase.from("mvp_votes").select("option_id").eq("poll_id", poll.id).eq("voter_key", voterKey).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (optionsResult.error) return Response.json({ error: optionsResult.error.message }, { status: 500 });
  if (votesResult.error) return Response.json({ error: votesResult.error.message }, { status: 500 });
  if (currentVoteResult.error) return Response.json({ error: currentVoteResult.error.message }, { status: 500 });

  const votes = votesResult.data || [];

  return Response.json({
    poll: {
      ...poll,
      totalVotes: votes.length,
      options: (optionsResult.data || []).map((option) => ({
        ...option,
        votes: votes.filter((vote) => vote.option_id === option.id).length,
      })),
      currentOptionId: currentVoteResult.data?.option_id || null,
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

  const voteRow = {
    poll_id: poll.id,
    option_id: option.id,
    voter_key: voterKey,
    voter_name: payload.voter_name?.trim() || null,
  };

  const { data: existingVote, error: existingVoteError } = await supabase
    .from("mvp_votes")
    .select("id")
    .eq("poll_id", poll.id)
    .eq("voter_key", voterKey)
    .maybeSingle();

  if (existingVoteError) {
    return Response.json({ error: existingVoteError.message }, { status: 500 });
  }

  const { error: voteError } = existingVote
    ? await supabase.from("mvp_votes").update(voteRow).eq("id", existingVote.id)
    : await supabase.from("mvp_votes").insert(voteRow);

  if (voteError) {
    return Response.json({ error: voteError.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

import Link from "next/link";
import { ArrowLeft, Award, Crown, Footprints, Medal, Trophy } from "lucide-react";
import LogoMark from "@/components/LogoMark";
import { createSupabaseClient } from "@/lib/supabase";

type PlayerRow = {
  id: string;
  name: string;
  position: string | null;
};

type MatchRow = {
  id: string;
  match_date: string;
  week_label: string;
  team_a_name: string;
  team_b_name: string;
  team_a_score: number;
  team_b_score: number;
  status: string;
};

type MatchPlayerRow = {
  match_id: string;
  player_id: string;
  team_name: string;
  goals: number;
  assists: number;
  result: string;
};

type TeamRow = {
  id: string;
  name: string;
};

type RosterRow = {
  team_id: string;
  player_id: string;
};

type PollRow = {
  id: string;
  match_date: string | null;
  status: string | null;
};

type PollOptionRow = {
  id: string;
  poll_id: string;
  player_id: string | null;
  label: string;
};

type PollVoteRow = {
  option_id: string;
};

type PlayerFormMatch = {
  date: string;
  label: string;
  result: "W" | "D" | "L";
  goals: number;
  assists: number;
};

type PlayerHonor = {
  label: string;
  count: number;
  description: string;
  sessions?: string[];
  type: "mvp" | "golden-boot" | "assist-leader" | "champion";
};

const manualMvpHonors = [
  {
    playerName: "Hamzah Q",
    sessionDate: "2026-07-25",
  },
];

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function PlayerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getPlayerProfile(slug);

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-8 text-[#171717] sm:px-6">
        <div className="mx-auto max-w-3xl">
          <SiteHeader />
          <section className="rounded-lg border border-black/10 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-black/50">Player Profile</p>
            <h1 className="mt-1 text-3xl font-black">Player not found</h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-black/55">
              This player may not have been added yet, or the profile link is old.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-3 py-5 text-[#171717] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <SiteHeader />

        <section className="rounded-lg border border-black/10 bg-white p-3 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 border-b border-black/10 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5 sm:pb-5">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#edf4f0] text-lg font-black text-[#17613d] sm:h-16 sm:w-16 sm:text-2xl">
                {getInitials(profile.name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-black/50">Player Profile</p>
                <h1 className="mt-1 break-words text-2xl font-black leading-none sm:text-4xl">{profile.name}</h1>
                <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-[#f7f3ec] px-2.5 py-1.5 text-xs font-bold text-black/60 sm:px-3 sm:py-2 sm:text-sm">
                    All-time stats
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-lg bg-[#f7f3ec] px-2.5 py-1.5 text-xs font-bold text-black/60 sm:px-3 sm:py-2 sm:text-sm">
                    {profile.position || "Player"}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-[#171717] px-3 py-2.5 text-center text-white sm:px-4 sm:py-3">
              <p className="text-xs font-black uppercase text-white/55">G+A</p>
              <p className="text-2xl font-black sm:text-3xl">{profile.points}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3">
            <ProfileStat label="Goals" value={profile.goals} />
            <ProfileStat label="Assists" value={profile.assists} />
            <ProfileStat label="Sessions" value={profile.sessionsPlayed} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:gap-3">
            <ProfileAverageStat label="Goals/Session" value={profile.goalsPerSession} />
            <ProfileAverageStat label="Assists/Session" value={profile.assistsPerSession} />
          </div>
          <PlayerHonors honors={profile.honors} />
          <PlayerFormGuide form={profile.form} />
        </section>

        <section className="mt-4 rounded-lg border border-black/10 bg-white p-3 shadow-sm sm:mt-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-black/50">Performance</p>
              <h2 className="text-xl font-black sm:text-2xl">Session History</h2>
            </div>
            <Trophy className="text-[#b7791f]" size={28} />
          </div>

          {profile.sessions.length > 0 ? (
            <div className="grid gap-3">
              {profile.sessions.map((session) => (
                <article key={session.date} className="rounded-lg bg-[#fbfaf7] p-3 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-black/50">{session.date}</p>
                      <h3 className="mt-1 break-words text-lg font-black">Session totals</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center sm:min-w-72">
                      <ProfileMiniStat label="G" value={session.goals} />
                      <ProfileMiniStat label="A" value={session.assists} />
                      <ProfileMiniStat label="G+A" value={session.points} dark />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-[#fbfaf7] px-3 py-4 text-sm font-semibold text-black/55">
              Stats have not been entered for this player yet.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function SiteHeader() {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-3">
        <LogoMark />
        <div>
          <p className="text-lg font-black leading-none">JC Pickup Soccer</p>
          <p className="text-xs font-medium text-black/55">All-time player stats</p>
        </div>
      </Link>
      <Link href="/players" className="inline-flex h-10 items-center gap-2 rounded-lg border border-black/15 bg-white px-3 text-sm font-black">
        <ArrowLeft size={16} />
        Back
      </Link>
    </div>
  );
}

async function getPlayerProfile(slug: string) {
  const supabase = createSupabaseClient();

  if (!supabase) return null;

  const [
    { data: playerRows },
    { data: matchRows },
    { data: statRows },
    { data: teamRows },
    { data: rosterRows },
    { data: pollRows },
    { data: pollOptionRows },
    { data: pollVoteRows },
  ] = await Promise.all([
    supabase.from("players").select("id,name,position").order("name"),
    supabase
      .from("matches")
      .select("id,match_date,week_label,team_a_name,team_b_name,team_a_score,team_b_score,status")
      .order("match_date", { ascending: false })
      .limit(100),
    supabase.from("match_players").select("match_id,player_id,team_name,goals,assists,result"),
    supabase.from("tournament_teams").select("id,name"),
    supabase.from("tournament_team_players").select("team_id,player_id"),
    supabase.from("mvp_polls").select("id,match_date,status"),
    supabase.from("mvp_poll_options").select("id,poll_id,player_id,label"),
    supabase.from("mvp_votes").select("option_id"),
  ]);

  const players = (playerRows || []) as PlayerRow[];
  const matchingPlayers = players.filter((row) => slugify(row.name) === slug);
  const player = matchingPlayers[0];

  if (!player) return null;

  const matchingPlayerIds = new Set(matchingPlayers.map((row) => row.id));
  const matchingPlayerNames = new Set(matchingPlayers.map((row) => normalizePlayerName(row.name)));
  const matches = ((matchRows || []) as MatchRow[]).filter((match) => match.status === "completed");
  const allStats = (statRows || []) as MatchPlayerRow[];
  const stats = allStats.filter((stat) => matchingPlayerIds.has(stat.player_id));
  const teams = (teamRows || []) as TeamRow[];
  const roster = (rosterRows || []) as RosterRow[];
  const polls = (pollRows || []) as PollRow[];
  const pollOptions = (pollOptionRows || []) as PollOptionRow[];
  const pollVotes = (pollVoteRows || []) as PollVoteRow[];
  const completedMatchIds = new Set(matches.map((match) => match.id));
  const completedDates = new Set(matches.map((match) => match.match_date));
  const matchesById = new Map(matches.map((match) => [match.id, match]));
  const matchDates = new Map(matches.map((match) => [match.id, match.match_date]));
  const pollDates = new Map(polls.map((poll) => [poll.id, poll.match_date]));
  const sessionsByDate = new Map<string, { date: string; goals: number; assists: number; points: number }>();

  for (const stat of stats) {
    if (!completedMatchIds.has(stat.match_id)) continue;

    const rawDate = matchDates.get(stat.match_id);
    if (!rawDate) continue;

    const existing = sessionsByDate.get(rawDate) || {
      date: formatDate(rawDate),
      goals: 0,
      assists: 0,
      points: 0,
    };

    existing.goals += stat.goals || 0;
    existing.assists += stat.assists || 0;
    existing.points = existing.goals + existing.assists;
    sessionsByDate.set(rawDate, existing);
  }

  const playerTeamIds = new Set(roster.filter((row) => matchingPlayerIds.has(row.player_id)).map((row) => row.team_id));
  const teamIdsByName = buildTeamIdsByName(teams);

  for (const match of matches) {
    const matchTeamIds = [
      ...(teamIdsByName.get(normalizeLabel(match.team_a_name)) || []),
      ...(teamIdsByName.get(normalizeLabel(match.team_b_name)) || []),
    ];
    const playerWasRostered = matchTeamIds.some((teamId) => playerTeamIds.has(teamId));

    if (!playerWasRostered || sessionsByDate.has(match.match_date)) continue;

    sessionsByDate.set(match.match_date, {
      date: formatDate(match.match_date),
      goals: 0,
      assists: 0,
      points: 0,
    });
  }

  for (const option of pollOptions) {
    const pollDate = pollDates.get(option.poll_id);
    if (!pollDate || !completedDates.has(pollDate)) continue;

    const isPlayerOption = Boolean(option.player_id && matchingPlayerIds.has(option.player_id)) || matchingPlayerNames.has(normalizePlayerName(option.label));
    if (!isPlayerOption || sessionsByDate.has(pollDate)) continue;

    sessionsByDate.set(pollDate, {
      date: formatDate(pollDate),
      goals: 0,
      assists: 0,
      points: 0,
    });
  }

  const sessions = Array.from(sessionsByDate.entries())
    .sort(([firstDate], [secondDate]) => secondDate.localeCompare(firstDate))
    .map(([, session]) => session);
  const goals = sessions.reduce((total, session) => total + session.goals, 0);
  const assists = sessions.reduce((total, session) => total + session.assists, 0);
  const form = buildPlayerForm(stats, matchesById);
  const honors = buildPlayerHonors({
    allStats,
    matches,
    matchingPlayerIds,
    matchingPlayerNames,
    players,
    pollOptions,
    polls,
    pollVotes,
  });

  return {
    name: player.name,
    position: player.position,
    goals,
    assists,
    points: goals + assists,
    sessionsPlayed: sessions.length,
    goalsPerSession: getPerSessionAverage(goals, sessions.length),
    assistsPerSession: getPerSessionAverage(assists, sessions.length),
    form,
    honors,
    sessions,
  };
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-[#fbfaf7] p-4 text-center">
      <p className="text-xs font-black uppercase text-black/45">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function ProfileAverageStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 text-center">
      <p className="text-xs font-black uppercase text-black/45">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function PlayerHonors({ honors }: { honors: PlayerHonor[] }) {
  return (
    <div className="mt-3 rounded-lg bg-[#fbfaf7] p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-black/45">Trophies / Honors</p>
          <p className="mt-1 text-sm font-bold text-black/55">Automatically earned from saved sessions</p>
        </div>
        <Award className="shrink-0 text-[#b7791f]" size={22} />
      </div>

      {honors.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-3">
          {honors.map((honor) => (
            <HonorCard key={honor.type} honor={honor} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-black/10 bg-white px-3 py-3 text-sm font-semibold text-black/55">
          Honors will appear after this player earns an MVP, Golden Boot, or Champion session.
        </p>
      )}
    </div>
  );
}

function HonorCard({ honor }: { honor: PlayerHonor }) {
  const Icon =
    honor.type === "mvp"
      ? Trophy
      : honor.type === "champion"
        ? Crown
        : honor.type === "assist-leader"
          ? Footprints
          : Medal;

  return (
    <article className="rounded-lg border border-black/10 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-black">{honor.count}x</p>
          <h3 className="mt-1 text-sm font-black leading-tight">{honor.label}</h3>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#edf4f0] text-[#17613d]">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-black/50">{honor.description}</p>
      {honor.sessions && honor.sessions.length > 0 ? (
        <p className="mt-2 text-xs font-black text-[#17613d]">{formatHonorSessions(honor.sessions)}</p>
      ) : null}
    </article>
  );
}

function PlayerFormGuide({ form }: { form: PlayerFormMatch[] }) {
  if (form.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg bg-[#fbfaf7] p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-black/45">Last 5 Form</p>
          <p className="mt-1 text-sm font-bold text-black/55">{getFormSummary(form)}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {form.map((match, index) => (
            <FormBadge key={`${match.date}-${match.label}-${index}`} result={match.result} title={`${match.label}: ${match.goals}G ${match.assists}A`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FormBadge({ result, title }: { result: PlayerFormMatch["result"]; title: string }) {
  return (
    <span
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${
        result === "W"
          ? "bg-[#dff0e7] text-[#17613d]"
          : result === "D"
            ? "bg-[#efe9dd] text-black/55"
            : "bg-red-50 text-red-700"
      }`}
    >
      {result}
    </span>
  );
}

function ProfileMiniStat({ label, value, dark = false }: { label: string; value: number; dark?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${dark ? "bg-[#171717] text-white" : "bg-white text-black"}`}>
      <p className={`text-xs font-black uppercase ${dark ? "text-white/55" : "text-black/45"}`}>{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function buildPlayerForm(stats: MatchPlayerRow[], matchesById: Map<string, MatchRow>): PlayerFormMatch[] {
  return stats
    .map((stat) => {
      const match = matchesById.get(stat.match_id);
      const result = normalizeResult(stat.result);

      if (!match || !result) return null;

      return {
        date: match.match_date,
        label: match.week_label || formatDate(match.match_date),
        result,
        goals: stat.goals || 0,
        assists: stat.assists || 0,
      };
    })
    .filter((match): match is PlayerFormMatch => Boolean(match))
    .sort((first, second) => second.date.localeCompare(first.date) || second.label.localeCompare(first.label))
    .slice(0, 5);
}

function buildPlayerHonors({
  allStats,
  matches,
  matchingPlayerIds,
  matchingPlayerNames,
  players,
  pollOptions,
  polls,
  pollVotes,
}: {
  allStats: MatchPlayerRow[];
  matches: MatchRow[];
  matchingPlayerIds: Set<string>;
  matchingPlayerNames: Set<string>;
  players: PlayerRow[];
  pollOptions: PollOptionRow[];
  polls: PollRow[];
  pollVotes: PollVoteRow[];
}) {
  const honors: PlayerHonor[] = [];
  const mvpHonor = countMvpHonors(polls, pollOptions, pollVotes, matchingPlayerIds, matchingPlayerNames);
  const manualMvpSessions = manualMvpHonors
    .filter((honor) => matchingPlayerNames.has(normalizePlayerName(honor.playerName)))
    .map((honor) => formatDate(honor.sessionDate));
  const mvpSessions = Array.from(new Set([...mvpHonor.sessions, ...manualMvpSessions]));
  const goldenBootHonor = countGoldenBoots(matches, allStats, players, matchingPlayerIds);
  const assistLeaderHonor = countAssistLeaderHonors(matches, allStats, players, matchingPlayerIds);
  const championHonor = countChampionSessions(matches, allStats, matchingPlayerIds);

  if (mvpSessions.length > 0) {
    honors.push({
      label: "Tournament MVP",
      count: mvpSessions.length,
      description: "Selected as player of the session.",
      sessions: mvpSessions,
      type: "mvp",
    });
  }

  if (goldenBootHonor.count > 0) {
    honors.push({
      label: "Golden Boot",
      count: goldenBootHonor.count,
      description: "Top goal scorer for a session.",
      sessions: goldenBootHonor.sessions,
      type: "golden-boot",
    });
  }

  if (assistLeaderHonor.count > 0) {
    honors.push({
      label: "Assist Leader",
      count: assistLeaderHonor.count,
      description: "Most assists in a session.",
      sessions: assistLeaderHonor.sessions,
      type: "assist-leader",
    });
  }

  if (championHonor.count > 0) {
    honors.push({
      label: "Champion",
      count: championHonor.count,
      description: "Played for the top team of a session.",
      sessions: championHonor.sessions,
      type: "champion",
    });
  }

  return honors;
}

function countMvpHonors(
  polls: PollRow[],
  pollOptions: PollOptionRow[],
  pollVotes: PollVoteRow[],
  matchingPlayerIds: Set<string>,
  matchingPlayerNames: Set<string>,
) {
  const mvpSessions: string[] = [];
  const optionsByPoll = new Map<string, PollOptionRow[]>();
  const voteCounts = new Map<string, number>();

  for (const option of pollOptions) {
    const options = optionsByPoll.get(option.poll_id) || [];
    options.push(option);
    optionsByPoll.set(option.poll_id, options);
  }

  for (const vote of pollVotes) {
    voteCounts.set(vote.option_id, (voteCounts.get(vote.option_id) || 0) + 1);
  }

  for (const poll of polls) {
    if (poll.status?.toLowerCase() !== "closed") continue;

    const options = optionsByPoll.get(poll.id) || [];
    const rankedOptions = options
      .map((option) => ({
        ...option,
        votes: voteCounts.get(option.id) || 0,
      }))
      .sort((first, second) => second.votes - first.votes || first.label.localeCompare(second.label));
    const winner = rankedOptions[0];

    if (!winner || winner.votes === 0) continue;

    const playerWonPoll = rankedOptions.some((option) => {
      const isPlayerOption =
        Boolean(option.player_id && matchingPlayerIds.has(option.player_id)) || matchingPlayerNames.has(normalizePlayerName(option.label));

      return isPlayerOption && option.votes === winner.votes;
    });

    if (playerWonPoll) mvpSessions.push(poll.match_date ? formatDate(poll.match_date) : "MVP Poll");
  }

  return {
    count: mvpSessions.length,
    sessions: mvpSessions,
  };
}

function countGoldenBoots(matches: MatchRow[], allStats: MatchPlayerRow[], players: PlayerRow[], matchingPlayerIds: Set<string>) {
  return countSessionStatLeaderHonors(matches, allStats, players, matchingPlayerIds, "goals");
}

function countAssistLeaderHonors(matches: MatchRow[], allStats: MatchPlayerRow[], players: PlayerRow[], matchingPlayerIds: Set<string>) {
  return countSessionStatLeaderHonors(matches, allStats, players, matchingPlayerIds, "assists");
}

function countSessionStatLeaderHonors(
  matches: MatchRow[],
  allStats: MatchPlayerRow[],
  players: PlayerRow[],
  matchingPlayerIds: Set<string>,
  statKey: "goals" | "assists",
) {
  const honorSessions: string[] = [];
  const matchesById = new Map(matches.map((match) => [match.id, match]));
  const playerNamesById = new Map(players.map((player) => [player.id, player.name]));
  const sessionStats = new Map<string, Map<string, { total: number; isTargetPlayer: boolean }>>();

  for (const stat of allStats) {
    const match = matchesById.get(stat.match_id);
    if (!match) continue;

    const playerName = playerNamesById.get(stat.player_id) || stat.player_id;
    const playerKey = normalizePlayerName(playerName);
    const session = sessionStats.get(match.match_date) || new Map<string, { total: number; isTargetPlayer: boolean }>();
    const existing = session.get(playerKey) || { total: 0, isTargetPlayer: false };

    existing.total += stat[statKey] || 0;
    existing.isTargetPlayer = existing.isTargetPlayer || matchingPlayerIds.has(stat.player_id);
    session.set(playerKey, existing);
    sessionStats.set(match.match_date, session);
  }

  for (const [sessionDate, session] of sessionStats.entries()) {
    const scores = Array.from(session.values());
    const topTotal = Math.max(0, ...scores.map((score) => score.total));
    if (topTotal === 0) continue;

    if (scores.some((score) => score.isTargetPlayer && score.total === topTotal)) honorSessions.push(formatDate(sessionDate));
  }

  return {
    count: honorSessions.length,
    sessions: honorSessions,
  };
}

function countChampionSessions(matches: MatchRow[], allStats: MatchPlayerRow[], matchingPlayerIds: Set<string>) {
  const honorSessions: string[] = [];
  const matchesById = new Map(matches.map((match) => [match.id, match]));
  const matchesByDate = new Map<string, MatchRow[]>();
  const playerTeamsByDate = new Map<string, Set<string>>();

  for (const match of matches) {
    const sessionMatches = matchesByDate.get(match.match_date) || [];
    sessionMatches.push(match);
    matchesByDate.set(match.match_date, sessionMatches);
  }

  for (const stat of allStats) {
    if (!matchingPlayerIds.has(stat.player_id)) continue;

    const match = matchesById.get(stat.match_id);
    if (!match || !stat.team_name) continue;

    const teams = playerTeamsByDate.get(match.match_date) || new Set<string>();
    teams.add(normalizeLabel(stat.team_name));
    playerTeamsByDate.set(match.match_date, teams);
  }

  for (const [date, sessionMatches] of matchesByDate.entries()) {
    const championTeam = getChampionTeamKey(sessionMatches);
    if (!championTeam) continue;

    if (playerTeamsByDate.get(date)?.has(championTeam)) honorSessions.push(formatDate(date));
  }

  return {
    count: honorSessions.length,
    sessions: honorSessions,
  };
}

function getChampionTeamKey(matches: MatchRow[]) {
  const standings = new Map<string, { points: number; goalDifference: number; goalsFor: number }>();

  for (const match of matches) {
    const teamA = normalizeLabel(match.team_a_name);
    const teamB = normalizeLabel(match.team_b_name);
    const teamAStats = standings.get(teamA) || { points: 0, goalDifference: 0, goalsFor: 0 };
    const teamBStats = standings.get(teamB) || { points: 0, goalDifference: 0, goalsFor: 0 };

    teamAStats.goalsFor += match.team_a_score || 0;
    teamBStats.goalsFor += match.team_b_score || 0;
    teamAStats.goalDifference += (match.team_a_score || 0) - (match.team_b_score || 0);
    teamBStats.goalDifference += (match.team_b_score || 0) - (match.team_a_score || 0);

    if ((match.team_a_score || 0) > (match.team_b_score || 0)) {
      teamAStats.points += 3;
    } else if ((match.team_b_score || 0) > (match.team_a_score || 0)) {
      teamBStats.points += 3;
    } else {
      teamAStats.points += 1;
      teamBStats.points += 1;
    }

    standings.set(teamA, teamAStats);
    standings.set(teamB, teamBStats);
  }

  return Array.from(standings.entries()).sort(([, first], [, second]) => {
    return second.points - first.points || second.goalDifference - first.goalDifference || second.goalsFor - first.goalsFor;
  })[0]?.[0];
}

function normalizeResult(result: string): PlayerFormMatch["result"] | null {
  const normalized = result.trim().toLowerCase();

  if (normalized === "win" || normalized === "w") return "W";
  if (normalized === "draw" || normalized === "tie" || normalized === "d") return "D";
  if (normalized === "loss" || normalized === "lose" || normalized === "l") return "L";

  return null;
}

function getFormSummary(form: PlayerFormMatch[]) {
  const winStreak = getCurrentStreak(form, "W");
  const pointStreak = getContributionStreak(form);

  if (winStreak >= 3 && pointStreak >= 3) return `${winStreak}-game win streak, ${pointStreak}-game G+A streak`;
  if (winStreak >= 3) return `${winStreak}-game win streak`;
  if (pointStreak >= 3) return `${pointStreak}-game G+A streak`;

  const wins = form.filter((match) => match.result === "W").length;
  return `${wins} wins in last ${form.length}`;
}

function getCurrentStreak(form: PlayerFormMatch[], result: PlayerFormMatch["result"]) {
  let streak = 0;

  for (const match of form) {
    if (match.result !== result) break;
    streak += 1;
  }

  return streak;
}

function getContributionStreak(form: PlayerFormMatch[]) {
  let streak = 0;

  for (const match of form) {
    if (match.goals + match.assists <= 0) break;
    streak += 1;
  }

  return streak;
}

function getPerSessionAverage(total: number, sessionsPlayed: number) {
  if (sessionsPlayed === 0) return "0";

  const average = total / sessionsPlayed;

  return Number.isInteger(average) ? String(average) : average.toFixed(1);
}

function formatHonorSessions(sessions: string[]) {
  const visibleSessions = sessions.slice(0, 3);
  const remaining = sessions.length - visibleSessions.length;
  const suffix = remaining > 0 ? ` +${remaining} more` : "";

  return `${visibleSessions.join(", ")}${suffix}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "player";
}

function getInitials(value: string) {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "P";
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function buildTeamIdsByName(teams: TeamRow[]) {
  const teamIdsByName = new Map<string, string[]>();

  for (const team of teams) {
    const key = normalizeLabel(team.name);
    const teamIds = teamIdsByName.get(key) || [];
    teamIds.push(team.id);
    teamIdsByName.set(key, teamIds);
  }

  return teamIdsByName;
}

function normalizeLabel(value: string) {
  return value
    .trim()
    .replace(/^team\s+/i, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizePlayerName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

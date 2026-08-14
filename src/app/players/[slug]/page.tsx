import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
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
};

type PollOptionRow = {
  poll_id: string;
  player_id: string | null;
  label: string;
};

type PlayerFormMatch = {
  date: string;
  label: string;
  result: "W" | "D" | "L";
  goals: number;
  assists: number;
};

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

  const [{ data: playerRows }, { data: matchRows }, { data: statRows }, { data: teamRows }, { data: rosterRows }, { data: pollRows }, { data: pollOptionRows }] = await Promise.all([
    supabase.from("players").select("id,name,position").order("name"),
    supabase
      .from("matches")
      .select("id,match_date,week_label,team_a_name,team_b_name,team_a_score,team_b_score,status")
      .order("match_date", { ascending: false })
      .limit(100),
    supabase.from("match_players").select("match_id,player_id,team_name,goals,assists,result"),
    supabase.from("tournament_teams").select("id,name"),
    supabase.from("tournament_team_players").select("team_id,player_id"),
    supabase.from("mvp_polls").select("id,match_date"),
    supabase.from("mvp_poll_options").select("poll_id,player_id,label"),
  ]);

  const players = (playerRows || []) as PlayerRow[];
  const matchingPlayers = players.filter((row) => slugify(row.name) === slug);
  const player = matchingPlayers[0];

  if (!player) return null;

  const matchingPlayerIds = new Set(matchingPlayers.map((row) => row.id));
  const matchingPlayerNames = new Set(matchingPlayers.map((row) => normalizePlayerName(row.name)));
  const matches = ((matchRows || []) as MatchRow[]).filter((match) => match.status === "completed");
  const stats = ((statRows || []) as MatchPlayerRow[]).filter((stat) => matchingPlayerIds.has(stat.player_id));
  const teams = (teamRows || []) as TeamRow[];
  const roster = (rosterRows || []) as RosterRow[];
  const polls = (pollRows || []) as PollRow[];
  const pollOptions = (pollOptionRows || []) as PollOptionRow[];
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

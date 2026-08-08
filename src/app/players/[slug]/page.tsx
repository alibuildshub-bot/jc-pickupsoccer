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

export const revalidate = 0;

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
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-8 text-[#171717] sm:px-6">
      <div className="mx-auto max-w-5xl">
        <SiteHeader />

        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 border-b border-black/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#edf4f0] text-2xl font-black text-[#17613d]">
                {getInitials(profile.name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-black/50">Player Profile</p>
                <h1 className="mt-1 break-words text-4xl font-black leading-none">{profile.name}</h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-[#f7f3ec] px-3 py-2 text-sm font-bold text-black/60">
                    All-time stats
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-lg bg-[#f7f3ec] px-3 py-2 text-sm font-bold text-black/60">
                    {profile.position || "Player"}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-[#171717] px-4 py-3 text-center text-white">
              <p className="text-xs font-black uppercase text-white/55">G+A</p>
              <p className="text-3xl font-black">{profile.points}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <ProfileStat label="Goals" value={profile.goals} />
            <ProfileStat label="Assists" value={profile.assists} />
            <ProfileStat label="Sessions" value={profile.sessionsPlayed} />
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-black/50">Performance</p>
              <h2 className="text-2xl font-black">Session History</h2>
            </div>
            <Trophy className="text-[#b7791f]" size={28} />
          </div>

          {profile.sessions.length > 0 ? (
            <div className="grid gap-3">
              {profile.sessions.map((session) => (
                <article key={session.date} className="rounded-lg bg-[#fbfaf7] p-4">
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
  const player = players.find((row) => slugify(row.name) === slug);

  if (!player) return null;

  const matches = ((matchRows || []) as MatchRow[]).filter((match) => match.status === "completed");
  const stats = ((statRows || []) as MatchPlayerRow[]).filter((stat) => stat.player_id === player.id);
  const teams = (teamRows || []) as TeamRow[];
  const roster = (rosterRows || []) as RosterRow[];
  const polls = (pollRows || []) as PollRow[];
  const pollOptions = (pollOptionRows || []) as PollOptionRow[];
  const completedMatchIds = new Set(matches.map((match) => match.id));
  const completedDates = new Set(matches.map((match) => match.match_date));
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

  const playerTeamIds = new Set(roster.filter((row) => row.player_id === player.id).map((row) => row.team_id));
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

    const isPlayerOption = option.player_id === player.id || option.label.trim().toLowerCase() === player.name.trim().toLowerCase();
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

  return {
    name: player.name,
    position: player.position,
    goals,
    assists,
    points: goals + assists,
    sessionsPlayed: sessions.length,
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

function ProfileMiniStat({ label, value, dark = false }: { label: string; value: number; dark?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${dark ? "bg-[#171717] text-white" : "bg-white text-black"}`}>
      <p className={`text-xs font-black uppercase ${dark ? "text-white/55" : "text-black/45"}`}>{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
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

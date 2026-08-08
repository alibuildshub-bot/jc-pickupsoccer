import Link from "next/link";
import { ArrowLeft, Trophy, Users } from "lucide-react";
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
  team_a_name: string;
  team_b_name: string;
  status: string;
};

type MatchPlayerRow = {
  match_id: string;
  player_id: string;
  goals: number;
  assists: number;
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

type PlayerTotal = {
  id: string;
  name: string;
  goals: number;
  assists: number;
  points: number;
  sessions: number;
  slug: string;
};

export const revalidate = 0;

export default async function PlayersPage() {
  const players = await getAllTimePlayers();
  const topPlayer = players[0];

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-8 text-[#171717] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="text-lg font-black leading-none">JC Pickup Soccer</p>
              <p className="text-xs font-medium text-black/55">All-time player stats</p>
            </div>
          </Link>
          <Link href="/" className="inline-flex h-10 items-center gap-2 rounded-lg border border-black/15 bg-white px-3 text-sm font-black">
            <ArrowLeft size={16} />
            Home
          </Link>
        </div>

        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 border-b border-black/10 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold text-black/50">Players</p>
              <h1 className="mt-1 text-4xl font-black leading-none sm:text-5xl">All-Time Player Hub</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-black/55 sm:text-base">
                Historical goals and assists across every completed JC Footy session.
              </p>
            </div>
            <div className="rounded-lg bg-[#171717] px-4 py-3 text-white">
              <p className="text-xs font-black uppercase text-white/55">Current Leader</p>
              <p className="mt-1 text-xl font-black">{topPlayer?.name || "Coming soon"}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <SummaryStat label="Players" value={players.length} icon={Users} />
            <SummaryStat label="Total Goals" value={players.reduce((total, player) => total + player.goals, 0)} />
            <SummaryStat label="Total Assists" value={players.reduce((total, player) => total + player.assists, 0)} />
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-black/10 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-black/50">All-Time Table</p>
              <h2 className="text-2xl font-black">Player Rankings</h2>
            </div>
            <Trophy className="text-[#b7791f]" size={28} />
          </div>

          {players.length > 0 ? (
            <>
              <div className="grid gap-3 md:hidden">
                {players.map((player, index) => (
                  <PlayerCard key={player.id} player={player} rank={index + 1} />
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left">
                  <thead>
                    <tr className="text-xs font-black uppercase text-black/45">
                      <th className="pb-2">Player</th>
                      <th className="pb-2 text-center">Goals</th>
                      <th className="pb-2 text-center">Assists</th>
                      <th className="pb-2 text-center">G+A</th>
                      <th className="pb-2 text-center">Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player, index) => (
                      <tr key={player.id} className="bg-[#fbfaf7]">
                        <td className="rounded-l-lg px-3 py-3">
                          <Link href={`/players/${player.slug}`} className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4f0] text-sm font-black text-[#17613d]">
                              {index + 1}
                            </span>
                            <span className="font-black hover:underline">{player.name}</span>
                          </Link>
                        </td>
                        <StatCell value={player.goals} />
                        <StatCell value={player.assists} />
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex min-w-14 justify-center rounded-lg bg-[#171717] px-3 py-2 text-base font-black text-white">
                            {player.points}
                          </span>
                        </td>
                        <td className="rounded-r-lg px-3 py-3 text-center font-black text-black/65">{player.sessions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="rounded-lg bg-[#fbfaf7] px-3 py-4 text-sm font-semibold text-black/55">
              Player stats will appear after completed games are entered.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

async function getAllTimePlayers(): Promise<PlayerTotal[]> {
  const supabase = createSupabaseClient();

  if (!supabase) return [];

  const [{ data: playerRows }, { data: matchRows }, { data: statRows }, { data: teamRows }, { data: rosterRows }, { data: pollRows }, { data: pollOptionRows }] = await Promise.all([
    supabase.from("players").select("id,name,position").order("name"),
    supabase.from("matches").select("id,match_date,team_a_name,team_b_name,status").eq("status", "completed").limit(200),
    supabase.from("match_players").select("match_id,player_id,goals,assists"),
    supabase.from("tournament_teams").select("id,name"),
    supabase.from("tournament_team_players").select("team_id,player_id"),
    supabase.from("mvp_polls").select("id,match_date"),
    supabase.from("mvp_poll_options").select("poll_id,player_id,label"),
  ]);
  const players = (playerRows || []) as PlayerRow[];
  const matches = (matchRows || []) as MatchRow[];
  const stats = (statRows || []) as MatchPlayerRow[];
  const teams = (teamRows || []) as TeamRow[];
  const roster = (rosterRows || []) as RosterRow[];
  const polls = (pollRows || []) as PollRow[];
  const pollOptions = (pollOptionRows || []) as PollOptionRow[];
  const completedMatchIds = new Set(matches.map((match) => match.id));
  const completedDates = new Set(matches.map((match) => match.match_date));
  const matchDates = new Map(matches.map((match) => [match.id, match.match_date]));
  const playerIdsByName = new Map(players.map((player) => [player.name.trim().toLowerCase(), player.id]));
  const pollDates = new Map(polls.map((poll) => [poll.id, poll.match_date]));
  const totals = new Map<string, PlayerTotal & { sessionDates: Set<string> }>();

  for (const player of players) {
    totals.set(player.id, {
      id: player.id,
      name: player.name,
      goals: 0,
      assists: 0,
      points: 0,
      sessions: 0,
      slug: slugify(player.name),
      sessionDates: new Set<string>(),
    });
  }

  for (const stat of stats) {
    if (!completedMatchIds.has(stat.match_id)) continue;

    const player = totals.get(stat.player_id);
    if (!player) continue;

    player.goals += stat.goals || 0;
    player.assists += stat.assists || 0;
    player.points = player.goals + player.assists;

    const matchDate = matchDates.get(stat.match_id);
    if (matchDate) player.sessionDates.add(matchDate);
  }

  const matchTeamsByDate = buildMatchTeamNamesByDate(matches);
  const teamIdsByName = buildTeamIdsByName(teams);
  const rosterByTeamId = new Map<string, string[]>();

  for (const row of roster) {
    const playerIds = rosterByTeamId.get(row.team_id) || [];
    playerIds.push(row.player_id);
    rosterByTeamId.set(row.team_id, playerIds);
  }

  for (const [matchDate, teamNames] of matchTeamsByDate.entries()) {
    for (const teamName of teamNames) {
      for (const teamId of teamIdsByName.get(teamName) || []) {
        for (const playerId of rosterByTeamId.get(teamId) || []) {
          totals.get(playerId)?.sessionDates.add(matchDate);
        }
      }
    }
  }

  for (const option of pollOptions) {
    const pollDate = pollDates.get(option.poll_id);
    if (!pollDate || !completedDates.has(pollDate)) continue;

    const playerId = option.player_id || playerIdsByName.get(option.label.trim().toLowerCase());
    if (!playerId) continue;

    const player = totals.get(playerId);
    if (!player) continue;

    player.sessionDates.add(pollDate);
  }

  return Array.from(totals.values())
    .map(({ sessionDates, ...player }) => ({
      ...player,
      sessions: sessionDates.size,
    }))
    .filter((player) => player.points > 0 || player.sessions > 0)
    .sort((first, second) => second.points - first.points || second.goals - first.goals || first.name.localeCompare(second.name));
}

function PlayerCard({ player, rank }: { player: PlayerTotal; rank: number }) {
  return (
    <Link href={`/players/${player.slug}`} className="block rounded-lg border border-black/10 bg-[#fbfaf7] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf4f0] text-sm font-black text-[#17613d]">
            {rank}
          </span>
          <div className="min-w-0">
            <h3 className="break-words font-black leading-tight">{player.name}</h3>
            <p className="mt-1 text-xs font-bold uppercase text-black/40">{player.sessions} sessions</p>
          </div>
        </div>
        <span className="rounded-lg bg-[#171717] px-3 py-2 text-sm font-black text-white">
          {player.points} G+A
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <MiniStat label="G" value={player.goals} />
        <MiniStat label="A" value={player.assists} />
        <MiniStat label="G+A" value={player.points} dark />
      </div>
    </Link>
  );
}

function SummaryStat({ label, value, icon: Icon }: { label: string; value: number; icon?: typeof Users }) {
  return (
    <div className="rounded-lg bg-[#fbfaf7] p-4">
      {Icon && <Icon className="mb-2 text-[#1f7a4d]" size={20} />}
      <p className="text-xs font-black uppercase text-black/45">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, dark = false }: { label: string; value: number; dark?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${dark ? "bg-[#171717] text-white" : "bg-white text-black"}`}>
      <p className={`text-xs font-black uppercase ${dark ? "text-white/55" : "text-black/45"}`}>{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function StatCell({ value }: { value: number }) {
  return (
    <td className="px-3 py-3 text-center">
      <span className="inline-flex min-w-14 justify-center rounded-lg bg-white px-3 py-2 text-base font-black text-black">
        {value}
      </span>
    </td>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "player";
}

function buildMatchTeamNamesByDate(matches: MatchRow[]) {
  const teamsByDate = new Map<string, Set<string>>();

  for (const match of matches) {
    const teamNames = teamsByDate.get(match.match_date) || new Set<string>();
    teamNames.add(normalizeLabel(match.team_a_name));
    teamNames.add(normalizeLabel(match.team_b_name));
    teamsByDate.set(match.match_date, teamNames);
  }

  return teamsByDate;
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

import {
  CalendarDays,
  Medal,
  Target,
  Trophy,
  Users,
} from "lucide-react";
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
  location: string | null;
  team_a_name: string;
  team_b_name: string;
  team_a_score: number;
  team_b_score: number;
  status: string;
  created_at?: string;
};

type MatchPlayerRow = {
  match_id: string;
  player_id: string;
  team_name: string;
  goals: number;
  assists: number;
  result: string;
};

type LeaderboardPlayer = {
  name: string;
  games: number;
  wins: number;
  goals: number;
  assists: number;
  points: number;
};

type TeamRow = {
  id: string;
  name: string;
  color: string | null;
  sort_order: number;
  is_active: boolean;
};

type TeamStanding = {
  name: string;
  color: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

type RosterRow = {
  id: string;
  team_id: string;
  player_id: string;
  players: { name: string } | { name: string }[] | null;
};

type TeamRoster = {
  name: string;
  color: string;
  players: string[];
};

const fallbackMatches = [
  {
    game: "Game 1",
    week: "Week 1",
    date: "Schedule a match",
    teamA: "Team A",
    teamB: "Team B",
    score: "0 - 0",
    winner: "Coming soon",
    status: "Coming soon",
  },
];

export const revalidate = 0;

export default async function Home() {
  const data = await getDashboardData();
  const latestMatch = data.recentMatches[0] || fallbackMatches[0];

  const statCards = [
    { label: "Active Players", value: String(data.activePlayers), icon: Users },
    { label: "Teams", value: String(data.activeTeams), icon: Users },
    { label: "Games Played", value: String(data.gamesPlayed), icon: CalendarDays },
    { label: "Goals Tracked", value: String(data.goalsTracked), icon: Target },
  ];

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-[#171717]">
      <nav className="border-b border-black/10 bg-[#f7f3ec]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="text-lg font-black leading-none">JC Pickup Soccer</p>
              <p className="text-xs font-medium text-black/55">Weekly rec league stats</p>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-sm font-semibold text-black/65 md:flex">
            <a href="#progress" className="hover:text-black">Progress</a>
            <a href="#teams" className="hover:text-black">Teams</a>
            <a href="#matches" className="hover:text-black">Matches</a>
            <a href="#leaderboard" className="hover:text-black">Leaderboard</a>
          </div>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-12">
        <div className="flex flex-col justify-center">
          <p className="mb-4 inline-flex w-fit rounded-lg bg-[#dff0e7] px-3 py-2 text-sm font-extrabold text-[#17613d]">
            3 teams. 5 players each. One tournament day.
          </p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl">
            Track every game, score, table, goal, and assist.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-black/65">
            Follow each week&apos;s matchups, scores, and player stats as the group
            competes through the season.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href="#leaderboard"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-[#171717] px-5 text-sm font-bold text-white transition hover:bg-black"
            >
              View Leaderboard
            </a>
            <a
              href="#matches"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-black/15 bg-white px-5 text-sm font-bold text-black transition hover:border-black/30"
            >
              See Recent Matches
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <div>
              <p className="text-sm font-bold text-black/50">Latest Result</p>
              <h2 className="text-2xl font-black">{latestMatch.week}</h2>
            </div>
            <Medal className="text-[#b7791f]" size={32} />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 py-6 text-center sm:gap-4 sm:py-7">
            <div className="min-w-0">
              <p className="break-words text-xl font-black leading-tight sm:text-3xl">{latestMatch.teamA}</p>
              <p className="mt-2 text-sm font-semibold text-black/55">Team A</p>
            </div>
            <div className="rounded-lg bg-[#171717] px-3 py-2 text-xl font-black text-white sm:px-4 sm:py-3 sm:text-3xl">
              {latestMatch.score}
            </div>
            <div className="min-w-0">
              <p className="break-words text-xl font-black leading-tight sm:text-3xl">{latestMatch.teamB}</p>
              <p className="mt-2 text-sm font-semibold text-black/55">Team B</p>
            </div>
          </div>
          <div className="grid gap-3 border-t border-black/10 pt-4 sm:grid-cols-3">
            <MiniStat label="Winner" value={latestMatch.winner} />
            <MiniStat label="Date" value={latestMatch.date} />
            <MiniStat label="Team of the Week" value={latestMatch.winner} icon={Trophy} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {statCards.map((item) => (
          <div key={item.label} className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <item.icon className="mb-4 text-[#1f7a4d]" size={24} />
            <p className="text-3xl font-black">{item.value}</p>
            <p className="mt-1 text-sm font-semibold text-black/55">{item.label}</p>
          </div>
        ))}
      </section>

      <section id="progress" className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-black/50">Tournament Progress</p>
              <h2 className="text-2xl font-black">{data.tournamentLabel}</h2>
            </div>
            <p className="text-sm font-bold text-black/50">
              {data.completedTournamentGames} completed / {data.tournamentGames} games
            </p>
          </div>
          <div className="grid gap-3 md:hidden">
            {data.teamStandings.map((team, index) => (
              <article key={team.name} className="rounded-lg border border-black/10 bg-[#fbfaf7] p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf4f0] text-sm font-black text-[#17613d]">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: team.color }} />
                        <h3 className="break-words font-black leading-tight">{team.name}</h3>
                      </div>
                      <p className="mt-1 text-xs font-bold text-black/45">
                        {team.wins}W {team.draws}D {team.losses}L
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black">{team.points}</p>
                    <p className="text-xs font-black uppercase text-black/40">PTS</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <MiniStat label="P" value={String(team.played)} />
                  <MiniStat label="GF" value={String(team.goalsFor)} />
                  <MiniStat label="GA" value={String(team.goalsAgainst)} />
                  <MiniStat label="GD" value={String(team.goalDiff)} />
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-black/10 text-xs font-black uppercase text-black/45">
                  <th className="py-3">Team</th>
                  <th className="py-3 text-center">P</th>
                  <th className="py-3 text-center">W</th>
                  <th className="py-3 text-center">D</th>
                  <th className="py-3 text-center">L</th>
                  <th className="py-3 text-center">GF</th>
                  <th className="py-3 text-center">GA</th>
                  <th className="py-3 text-center">GD</th>
                  <th className="py-3 text-center">PTS</th>
                </tr>
              </thead>
              <tbody>
                {data.teamStandings.map((team, index) => (
                  <tr key={team.name} className="border-b border-black/10 last:border-0">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4f0] text-sm font-black text-[#17613d]">
                          {index + 1}
                        </span>
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color }} />
                        <span className="font-black">{team.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center font-bold">{team.played}</td>
                    <td className="py-4 text-center font-bold">{team.wins}</td>
                    <td className="py-4 text-center font-bold">{team.draws}</td>
                    <td className="py-4 text-center font-bold">{team.losses}</td>
                    <td className="py-4 text-center font-bold">{team.goalsFor}</td>
                    <td className="py-4 text-center font-bold">{team.goalsAgainst}</td>
                    <td className="py-4 text-center font-bold">{team.goalDiff}</td>
                    <td className="py-4 text-center font-black">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="teams" className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-black/50">Rosters</p>
            <h2 className="text-2xl font-black">Teams & Players</h2>
          </div>
          <Users className="hidden text-[#1f7a4d] sm:block" size={26} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.teamRosters.map((team) => (
            <article key={team.name} className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
	              <div className="mb-4 flex items-center justify-between gap-3 border-b border-black/10 pb-4">
	                <div className="flex min-w-0 items-center gap-3">
	                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: team.color }} />
	                  <h3 className="break-words text-lg font-black leading-tight">{team.name}</h3>
	                </div>
	                <p className="shrink-0 text-sm font-black text-black/45">{team.players.length}/5</p>
	              </div>
              {team.players.length > 0 ? (
                <div className="grid gap-2">
                  {team.players.map((player, index) => (
                    <div key={`${team.name}-${player}`} className="flex items-center gap-3 rounded-lg bg-[#fbfaf7] px-3 py-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#edf4f0] text-xs font-black text-[#17613d]">
                        {index + 1}
                      </span>
	                      <span className="min-w-0 break-words text-sm font-bold">{player}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-[#fbfaf7] px-3 py-4 text-sm font-semibold text-black/50">
                  Roster coming soon.
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-start gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div id="matches" className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-black/50">Game Log</p>
              <h2 className="text-2xl font-black">Recent Matches</h2>
            </div>
            <CalendarDays className="text-[#1f7a4d]" size={26} />
          </div>
          <div className="space-y-3">
                  {data.recentMatches.map((match) => (
              <article key={`${match.week}-${match.date}`} className="rounded-lg border border-black/10 bg-[#fbfaf7] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-black/50">{match.date}</p>
                    <p className="mt-1 text-xs font-black uppercase text-[#1f7a4d]">{match.game}</p>
                    <h3 className="mt-1 text-lg font-black">{match.week}</h3>
                  </div>
                  <p className="shrink-0 rounded-lg bg-[#171717] px-3 py-2 text-base font-black text-white sm:text-lg">{match.score}</p>
                </div>
                <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-sm font-bold">
                  <span className="min-w-0 break-words">{match.teamA}</span>
                  <span className="text-black/35">vs</span>
                  <span className="min-w-0 break-words text-right">{match.teamB}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-black/55">Winner: {match.winner}</p>
              </article>
            ))}
          </div>
        </div>

        <div id="leaderboard" className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-black/50">Season Table</p>
              <h2 className="text-2xl font-black">Player Leaderboard</h2>
            </div>
            <Trophy className="text-[#b7791f]" size={28} />
          </div>
          {data.players.length > 0 ? (
            <>
            <div className="grid gap-3 md:hidden">
              {data.players.map((player, index) => (
                <article key={player.name} className="rounded-lg border border-black/10 bg-[#fbfaf7] p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf4f0] text-sm font-black text-[#17613d]">
                        {index + 1}
                      </span>
                      <h3 className="min-w-0 break-words font-black leading-tight">{player.name}</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <MiniStat label="G" value={String(player.goals)} />
                    <MiniStat label="A" value={String(player.assists)} />
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-black/10 text-xs font-black uppercase text-black/45">
                    <th className="py-3">Player</th>
                    <th className="py-3 text-center">G</th>
                    <th className="py-3 text-center">A</th>
                  </tr>
                </thead>
                <tbody>
                  {data.players.map((player, index) => (
                    <tr key={player.name} className="border-b border-black/10 last:border-0">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4f0] text-sm font-black text-[#17613d]">
                            {index + 1}
                          </span>
                          <span className="font-black">{player.name}</span>
                        </div>
                      </td>
                      <td className="py-4 text-center font-bold">{player.goals}</td>
                      <td className="py-4 text-center font-bold">{player.assists}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          ) : (
            <div className="rounded-lg border border-black/10 bg-[#fbfaf7] p-6">
              <p className="font-black">Leaderboard will appear after the first game.</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-black/55">
                Once scores and player stats are entered, this table will rank goals and assists.
              </p>
            </div>
          )}
        </div>
      </section>

    </main>
  );
}

async function getDashboardData() {
  const supabase = createSupabaseClient();

  if (!supabase) {
    return {
      isConnected: false,
      activePlayers: 0,
      activeTeams: 0,
      gamesPlayed: 0,
      goalsTracked: 0,
      topPlayer: "Setup",
      players: [],
      recentMatches: fallbackMatches,
      teamStandings: fallbackStandings(),
      teamRosters: fallbackRosters(),
      tournamentLabel: "Tournament Day",
      tournamentGames: 0,
      completedTournamentGames: 0,
    };
  }

  const [{ data: playerRows }, { data: matchRows }, { data: statRows }, { data: teamRows }, { data: rosterRows }] = await Promise.all([
    supabase.from("players").select("id,name,position").eq("is_active", true).order("name"),
    supabase
      .from("matches")
      .select("id,match_date,week_label,location,team_a_name,team_b_name,team_a_score,team_b_score,status,created_at")
      .order("match_date", { ascending: false })
      .limit(50),
    supabase.from("match_players").select("match_id,player_id,team_name,goals,assists,result"),
    supabase
      .from("tournament_teams")
      .select("id,name,color,sort_order,is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("tournament_team_players")
      .select("id,team_id,player_id,players(name)")
      .order("created_at", { ascending: true }),
  ]);

  const players = (playerRows || []) as PlayerRow[];
  const matches = sortMatchesForDisplay(dedupeMatches((matchRows || []) as MatchRow[]));
  const matchStats = (statRows || []) as MatchPlayerRow[];
  const rawTeams = (teamRows || []) as TeamRow[];
  const teams = dedupeTeams(rawTeams);
  const teamRosters = buildTeamRosters(teams, rawTeams, (rosterRows || []) as unknown as RosterRow[]);
  const gameLabels = buildGameLabels(matches);
  const tournamentDate = matches[0]?.match_date || "";
  const tournamentMatches = tournamentDate
    ? matches.filter((match) => match.match_date === tournamentDate)
    : [];
  const teamStandings = buildTeamStandings(teams, tournamentMatches);
  const teamDisplayNames = buildTeamDisplayNames(teams);

  const totalsByPlayer = new Map<string, Omit<LeaderboardPlayer, "name">>();

  for (const player of players) {
    totalsByPlayer.set(player.id, { games: 0, wins: 0, goals: 0, assists: 0, points: 0 });
  }

  for (const stat of matchStats) {
    const totals = totalsByPlayer.get(stat.player_id);
    if (!totals) continue;

    totals.games += 1;
    totals.goals += stat.goals || 0;
    totals.assists += stat.assists || 0;
    totals.wins += stat.result === "win" ? 1 : 0;
    totals.points = totals.goals + totals.assists;
  }

  const leaderboard = players
    .map((player) => ({
      name: player.name,
      ...(totalsByPlayer.get(player.id) || { games: 0, wins: 0, goals: 0, assists: 0, points: 0 }),
    }))
    .sort((a, b) => b.points - a.points || b.goals - a.goals || a.name.localeCompare(b.name));
  const activeLeaderboard = leaderboard.filter((player) => player.games > 0);

  const recentMatches = matches.map((match) => ({
    game: gameLabels.get(match.id) || "Game",
    week: match.week_label,
    date: formatDate(match.match_date),
    teamA: getTeamDisplayName(match.team_a_name, teamDisplayNames),
    teamB: getTeamDisplayName(match.team_b_name, teamDisplayNames),
    score: getMatchScoreLabel(match),
    winner: getMatchWinner(match, teamDisplayNames),
    status: getMatchStatusLabel(match.status),
  }));

  const goalsTracked = matchStats.reduce((total, stat) => total + (stat.goals || 0), 0);

  return {
    isConnected: true,
    activePlayers: players.length,
    activeTeams: teamStandings.length || teams.length,
    gamesPlayed: matches.filter((match) => match.status === "completed").length,
    goalsTracked,
    topPlayer: activeLeaderboard[0]?.name || "Coming soon",
    players: activeLeaderboard,
    recentMatches: recentMatches.length > 0 ? recentMatches : fallbackMatches,
    teamStandings: teamStandings.length > 0 ? teamStandings : fallbackStandings(),
    teamRosters: teamRosters.length > 0 ? teamRosters : fallbackRosters(),
    tournamentLabel: tournamentDate ? formatDate(tournamentDate) : "Tournament Day",
    tournamentGames: tournamentMatches.length,
    completedTournamentGames: tournamentMatches.filter((match) => match.status === "completed").length,
  };
}

function buildTeamStandings(teams: TeamRow[], matches: MatchRow[]) {
  const standings = new Map<string, TeamStanding>();

  for (const team of teams) {
    const key = normalizeTeamName(team.name);
    const existing = standings.get(key);
    const nextName = cleanTeamName(team.name);

    if (existing && prefersExistingTeamName(existing.name, nextName)) {
      continue;
    }

    standings.set(key, {
      ...existing,
      name: nextName,
      color: team.color || "#1f7a4d",
      played: existing?.played || 0,
      wins: existing?.wins || 0,
      draws: existing?.draws || 0,
      losses: existing?.losses || 0,
      goalsFor: existing?.goalsFor || 0,
      goalsAgainst: existing?.goalsAgainst || 0,
      goalDiff: existing?.goalDiff || 0,
      points: existing?.points || 0,
    });
  }

  for (const match of matches) {
    if (match.status !== "completed") {
      continue;
    }

    const teamA = ensureTeam(standings, match.team_a_name);
    const teamB = ensureTeam(standings, match.team_b_name);

    teamA.played += 1;
    teamB.played += 1;
    teamA.goalsFor += match.team_a_score;
    teamA.goalsAgainst += match.team_b_score;
    teamB.goalsFor += match.team_b_score;
    teamB.goalsAgainst += match.team_a_score;

    if (match.team_a_score > match.team_b_score) {
      teamA.wins += 1;
      teamB.losses += 1;
      teamA.points += 3;
    } else if (match.team_b_score > match.team_a_score) {
      teamB.wins += 1;
      teamA.losses += 1;
      teamB.points += 3;
    } else {
      teamA.draws += 1;
      teamB.draws += 1;
      teamA.points += 1;
      teamB.points += 1;
    }
  }

  return Array.from(standings.values())
    .map((team) => ({
      ...team,
      goalDiff: team.goalsFor - team.goalsAgainst,
    }))
    .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor || a.name.localeCompare(b.name));
}

function dedupeTeams(teams: TeamRow[]) {
  const teamsByName = new Map<string, TeamRow>();

  for (const team of teams) {
    const key = normalizeTeamName(team.name);
    const existing = teamsByName.get(key);

    if (!existing) {
      teamsByName.set(key, {
        ...team,
        name: cleanTeamName(team.name),
      });
      continue;
    }

    const nextName = cleanTeamName(team.name);
    const keepExistingName = prefersExistingTeamName(existing.name, nextName);

    teamsByName.set(key, {
      ...existing,
      name: keepExistingName ? existing.name : nextName,
      color: existing.color || team.color,
      sort_order: Math.min(existing.sort_order, team.sort_order),
    });
  }

  return Array.from(teamsByName.values()).sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
  );
}

function dedupeMatches(matches: MatchRow[]) {
  const matchesByKey = new Map<string, MatchRow>();

  for (const match of matches) {
    const key = [
      match.match_date,
      cleanTeamName(match.week_label).toLowerCase(),
      normalizeTeamName(match.team_a_name),
      normalizeTeamName(match.team_b_name),
      match.team_a_score,
      match.team_b_score,
      match.status,
    ].join("|");

    if (!matchesByKey.has(key)) {
      matchesByKey.set(key, {
        ...match,
        team_a_name: cleanTeamName(match.team_a_name),
        team_b_name: cleanTeamName(match.team_b_name),
        week_label: cleanTeamName(match.week_label),
        location: match.location ? cleanTeamName(match.location) : null,
      });
    }
  }

  return Array.from(matchesByKey.values());
}

function sortMatchesForDisplay(matches: MatchRow[]) {
  return [...matches].sort(
    (first, second) =>
      second.match_date.localeCompare(first.match_date) ||
      sortMatchesByGameOrder(first, second),
  );
}

function buildGameLabels(matches: MatchRow[]) {
  const labels = new Map<string, string>();
  const matchesByDate = new Map<string, MatchRow[]>();

  for (const match of matches) {
    const dateMatches = matchesByDate.get(match.match_date) || [];
    dateMatches.push(match);
    matchesByDate.set(match.match_date, dateMatches);
  }

  for (const dateMatches of matchesByDate.values()) {
    dateMatches.sort(sortMatchesByGameOrder).forEach((match, index) => {
      labels.set(match.id, `Game ${index + 1}`);
    });
  }

  return labels;
}

function sortMatchesByGameOrder(first: MatchRow, second: MatchRow) {
  return (
    (first.created_at || "").localeCompare(second.created_at || "") ||
    first.week_label.localeCompare(second.week_label) ||
    first.id.localeCompare(second.id)
  );
}

function buildTeamRosters(teams: TeamRow[], rawTeams: TeamRow[], rosterRows: RosterRow[]) {
  const rawTeamKeys = new Map(rawTeams.map((team) => [team.id, normalizeTeamName(team.name)]));
  const rostersByTeam = new Map<string, TeamRoster>();

  for (const team of teams) {
    rostersByTeam.set(normalizeTeamName(team.name), {
      name: cleanTeamName(team.name),
      color: team.color || "#1f7a4d",
      players: [],
    });
  }

  for (const row of rosterRows) {
    const teamKey = rawTeamKeys.get(row.team_id);
    const playerName = getRosterPlayerName(row.players);

    if (!teamKey || !playerName) continue;

    const roster = rostersByTeam.get(teamKey);
    if (!roster || roster.players.includes(playerName)) continue;

    roster.players.push(playerName);
  }

  return Array.from(rostersByTeam.values()).map((team) => ({
    ...team,
    players: team.players.sort((a, b) => a.localeCompare(b)),
  }));
}

function getRosterPlayerName(players: RosterRow["players"]) {
  if (!players) return "";

  return (Array.isArray(players) ? players[0]?.name : players.name)?.trim() || "";
}

function ensureTeam(standings: Map<string, TeamStanding>, name: string) {
  const key = normalizeTeamName(name);

  if (!standings.has(key)) {
    standings.set(key, {
      name: cleanTeamName(name),
      color: "#1f7a4d",
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    });
  }

  return standings.get(key)!;
}

function normalizeTeamName(name: string) {
  return cleanTeamName(name)
    .replace(/^team\s+/i, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cleanTeamName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function buildTeamDisplayNames(teams: TeamRow[]) {
  const displayNames = new Map<string, string>();

  for (const team of teams) {
    const key = normalizeTeamName(team.name);
    const nextName = cleanTeamName(team.name);
    const existingName = displayNames.get(key);

    if (!existingName || !prefersExistingTeamName(existingName, nextName)) {
      displayNames.set(key, nextName);
    }
  }

  return displayNames;
}

function getTeamDisplayName(name: string, displayNames: Map<string, string>) {
  return displayNames.get(normalizeTeamName(name)) || cleanTeamName(name);
}

function prefersExistingTeamName(existingName: string, nextName: string) {
  return existingName.toLowerCase().startsWith("team ") || !nextName.toLowerCase().startsWith("team ");
}

function getMatchScoreLabel(match: MatchRow) {
  if (match.status === "scheduled") return "Not started";
  if (match.status === "live") return `Live ${match.team_a_score} - ${match.team_b_score}`;

  return `${match.team_a_score} - ${match.team_b_score}`;
}

function getMatchWinner(match: MatchRow, teamDisplayNames: Map<string, string>) {
  if (match.status === "scheduled") return "Not started";
  if (match.status === "live") return "In progress";
  if (match.team_a_score === match.team_b_score) return "Draw";

  const winnerName = match.team_a_score > match.team_b_score ? match.team_a_name : match.team_b_name;

  return getTeamDisplayName(winnerName, teamDisplayNames);
}

function getMatchStatusLabel(status: string) {
  if (status === "completed") return "Completed";
  if (status === "live") return "Live";
  if (status === "scheduled") return "Scheduled";

  return status;
}

function fallbackStandings() {
  return ["Team A", "Team B", "Team C"].map((name) => ({
    name,
    color: "#1f7a4d",
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  }));
}

function fallbackRosters() {
  return fallbackStandings().map((team) => ({
    name: team.name,
    color: team.color,
    players: [],
  }));
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Trophy }) {
  return (
    <div className="rounded-lg bg-[#f7f3ec] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase text-black/45">{label}</p>
        {Icon && <Icon className="shrink-0 text-[#b7791f]" size={18} />}
      </div>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

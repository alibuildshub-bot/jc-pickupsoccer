import Link from "next/link";
import { ArrowLeft, CalendarDays, Trophy } from "lucide-react";
import LogoMark from "@/components/LogoMark";
import { createSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type PlayerRow = {
  id: string;
  name: string;
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
  created_at?: string;
};

type MatchPlayerRow = {
  match_id: string;
  player_id: string;
  team_name: string;
  goals: number;
  assists: number;
};

type TeamRow = {
  id: string;
  name: string;
  color: string | null;
  logo_url: string | null;
  sort_order: number;
  is_active: boolean;
  session_date: string | null;
};

type TeamStanding = {
  name: string;
  color: string;
  logo: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: Array<"W" | "D" | "L">;
};

type ArchivePlayer = {
  name: string;
  team: string;
  goals: number;
  assists: number;
  points: number;
};

type ArchiveDay = {
  date: string;
  rawDate: string;
  matches: Array<{
    game: string;
    teamA: string;
    teamB: string;
    score: string;
    winner: string;
  }>;
  standings: TeamStanding[];
  players: ArchivePlayer[];
  totalGoals: number;
  teamOfTheWeek: string;
  teamOfTheWeekLogo: string | null;
  teamOfTheWeekColor: string | null;
  topScorer: string;
};

export const revalidate = 0;

export default async function PastSessionsPage() {
  const archive = await getPastSessions();

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-8 text-[#171717] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="text-lg font-black leading-none">JC Pickup Soccer</p>
              <p className="text-xs font-medium text-black/55">Session archive</p>
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
              <p className="text-sm font-bold text-black/50">Archive</p>
              <h1 className="mt-1 text-4xl font-black leading-none sm:text-5xl">Past Sessions</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-black/55 sm:text-base">
                Completed pickup days with match results, team tables, and player stats.
              </p>
            </div>
            <div className="rounded-lg bg-[#171717] px-4 py-3 text-white">
              <p className="text-xs font-black uppercase text-white/55">Saved Sessions</p>
              <p className="mt-1 text-xl font-black">{archive.length}</p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-black/10 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-black/50">Results</p>
              <h2 className="text-2xl font-black">Session Folders</h2>
            </div>
            <CalendarDays className="text-[#1f7a4d]" size={26} />
          </div>

          {archive.length > 0 ? (
            <div className="grid gap-5">
              {archive.map((day) => (
                <details key={day.rawDate} className="group rounded-lg border border-black/10 bg-[#fbfaf7] p-4">
                  <summary className="list-none cursor-pointer">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase text-[#1f7a4d]">Completed games</p>
                        <h3 className="text-xl font-black">{day.date}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-black/55">
                          {day.matches.length} games
                        </span>
                        <span className="rounded-lg bg-[#171717] px-3 py-2 text-sm font-black text-white">
                          <span className="group-open:hidden">View stats</span>
                          <span className="hidden group-open:inline">Hide stats</span>
                        </span>
                      </div>
                    </div>
                  </summary>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MiniStat
                      label="Team of the Week"
                      value={day.teamOfTheWeek}
                      icon={Trophy}
                      logo={day.teamOfTheWeekLogo}
                      color={day.teamOfTheWeekColor}
                    />
                    <MiniStat label="Total Goals" value={String(day.totalGoals)} />
                    <MiniStat label="Top Scorer" value={day.topScorer} />
                  </div>

                  <div className="mt-4 border-t border-black/10 pt-4">
                    <p className="mb-2 text-xs font-black uppercase text-black/45">Games</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {day.matches.map((match) => (
                        <article key={`${day.rawDate}-${match.game}-${match.teamA}-${match.teamB}`} className="rounded-lg bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-black uppercase text-[#1f7a4d]">{match.game}</p>
                              <p className="mt-1 text-sm font-black">{match.teamA} vs {match.teamB}</p>
                            </div>
                            <p className="shrink-0 rounded-lg bg-[#171717] px-3 py-2 text-sm font-black text-white">
                              {match.score}
                            </p>
                          </div>
                          <p className="mt-2 text-xs font-bold text-black/50">Winner: {match.winner}</p>
                        </article>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-lg bg-white p-3 sm:p-4">
                        <p className="mb-2 text-xs font-black uppercase text-black/45">Team table</p>
                        <div className="space-y-2">
                          {day.standings.map((team, index) => (
                            <div key={`${day.rawDate}-${team.name}`} className="rounded-lg bg-[#fbfaf7] p-3">
                              <div className="flex items-center gap-3">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#edf4f0] text-xs font-black text-[#17613d]">
                                  {index + 1}
                                </span>
                                <TeamLogo logo={team.logo} color={team.color} name={team.name} />
                                <span className="min-w-0 flex-1 break-words text-sm font-black">{team.name}</span>
                              </div>
                              <div className="mt-3 grid grid-cols-3 gap-2 pl-10 text-center">
                                <MiniStat label="PTS" value={String(team.points)} />
                                <MiniStat label="GF" value={String(team.goalsFor)} />
                                <MiniStat label="GD" value={String(team.goalDiff)} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg bg-white p-3 sm:p-4">
                        <p className="mb-2 text-xs font-black uppercase text-black/45">Player stats</p>
                        {day.players.length > 0 ? (
                          <div className="space-y-2">
                            {day.players.map((player, index) => (
                              <div key={`${day.rawDate}-${player.name}-${player.team}`} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg bg-[#fbfaf7] p-3 text-sm sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#edf4f0] text-xs font-black text-[#17613d]">
                                  {index + 1}
                                </span>
                                <div className="min-w-0">
                                  <Link href={`/players/${slugify(player.name)}`} className="break-words font-black hover:underline">
                                    {player.name}
                                  </Link>
                                  <p className="break-words text-xs font-bold text-black/45">{player.team}</p>
                                </div>
                                <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-1 sm:justify-end">
                                  <span className="rounded-lg bg-white px-2 py-1 font-bold text-black/55">{player.goals} G</span>
                                  <span className="rounded-lg bg-white px-2 py-1 font-bold text-black/55">{player.assists} A</span>
                                  <span className="rounded-lg bg-[#171717] px-2 py-1 font-black text-white">{player.points} G+A</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="rounded-lg bg-[#fbfaf7] px-3 py-4 text-sm font-semibold text-black/50">
                            Player stats were not entered for this session.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-black/10 bg-[#fbfaf7] p-6">
              <p className="font-black">Past sessions will appear after completed games.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

async function getPastSessions() {
  const supabase = createSupabaseClient();

  if (!supabase) return [];

  const [{ data: playerRows }, { data: matchRows }, teamRowsResult, { data: statRows }] = await Promise.all([
    supabase.from("players").select("id,name").order("name"),
    supabase
      .from("matches")
      .select("id,match_date,week_label,team_a_name,team_b_name,team_a_score,team_b_score,status,created_at")
      .eq("status", "completed")
      .order("match_date", { ascending: false })
      .limit(200),
    selectTeams(supabase),
    supabase.from("match_players").select("match_id,player_id,team_name,goals,assists"),
  ]);

  const players = (playerRows || []) as PlayerRow[];
  const matches = sortMatchesForDisplay(dedupeMatches((matchRows || []) as MatchRow[]));
  const teams = dedupeTeams((teamRowsResult.data || []) as TeamRow[]);
  const stats = (statRows || []) as MatchPlayerRow[];
  const gameLabels = buildGameLabels(matches);
  const teamDisplayNames = buildTeamDisplayNames(teams);

  return buildResultsArchive(matches, stats, players, teams, gameLabels, teamDisplayNames);
}

async function selectTeams(supabase: NonNullable<ReturnType<typeof createSupabaseClient>>) {
  const withLogo = await supabase
    .from("tournament_teams")
    .select("id,name,color,logo_url,sort_order,is_active,session_date")
    .order("session_date", { ascending: false, nullsFirst: false })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (!withLogo.error) return withLogo;

  const withoutLogo = await supabase
    .from("tournament_teams")
    .select("id,name,color,sort_order,is_active,session_date")
    .order("session_date", { ascending: false, nullsFirst: false })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return {
    ...withoutLogo,
    data: withoutLogo.data?.map((team) => ({ ...team, logo_url: null })),
  };
}

function buildResultsArchive(
  matches: MatchRow[],
  matchStats: MatchPlayerRow[],
  players: PlayerRow[],
  teams: TeamRow[],
  gameLabels: Map<string, string>,
  teamDisplayNames: Map<string, string>,
) : ArchiveDay[] {
  const archiveByRawDate = new Map<string, MatchRow[]>();
  const playerNames = new Map(players.map((player) => [player.id, player.name]));

  for (const match of matches) {
    const dateMatches = archiveByRawDate.get(match.match_date) || [];
    dateMatches.push(match);
    archiveByRawDate.set(match.match_date, dateMatches);
  }

  return Array.from(archiveByRawDate.entries())
    .sort(([firstDate], [secondDate]) => secondDate.localeCompare(firstDate))
    .map(([rawDate, dayMatches]) => {
      const matchIds = new Set(dayMatches.map((match) => match.id));
      const dayStats = matchStats.filter((stat) => matchIds.has(stat.match_id));
      const playerTotals = new Map<string, ArchivePlayer>();

      for (const stat of dayStats) {
        const playerName = playerNames.get(stat.player_id);
        if (!playerName) continue;

        const playerKey = normalizePlayerName(playerName);
        if (!playerKey) continue;

        const existing = playerTotals.get(playerKey) || {
          name: playerName,
          team: getTeamDisplayName(stat.team_name, teamDisplayNames),
          goals: 0,
          assists: 0,
          points: 0,
        };

        existing.goals += stat.goals || 0;
        existing.assists += stat.assists || 0;
        existing.points = existing.goals + existing.assists;
        playerTotals.set(playerKey, existing);
      }

      const dayTeams = getTeamsForMatches(teams, dayMatches, rawDate);
      const standings = buildTeamStandings(dayTeams, dayMatches);
      const teamOfTheWeek = buildTeamOfTheWeek(standings);
      const sortedPlayers = Array.from(playerTotals.values()).sort(
        (a, b) => b.points - a.points || b.goals - a.goals || a.name.localeCompare(b.name),
      );

      return {
        date: formatDate(rawDate),
        rawDate,
        matches: dayMatches.sort(sortMatchesByGameOrder).map((match) => ({
          game: gameLabels.get(match.id) || "Game",
          teamA: getTeamDisplayName(match.team_a_name, teamDisplayNames),
          teamB: getTeamDisplayName(match.team_b_name, teamDisplayNames),
          score: `${match.team_a_score} - ${match.team_b_score}`,
          winner: getMatchWinner(match, teamDisplayNames),
        })),
        standings,
        players: sortedPlayers,
        totalGoals: dayMatches.reduce((total, match) => total + match.team_a_score + match.team_b_score, 0),
        teamOfTheWeek: teamOfTheWeek.name,
        teamOfTheWeekLogo: "logo" in teamOfTheWeek ? teamOfTheWeek.logo : null,
        teamOfTheWeekColor: "color" in teamOfTheWeek ? teamOfTheWeek.color : null,
        topScorer: getArchiveTopScorer(sortedPlayers),
      };
    });
}

function buildTeamStandings(teams: TeamRow[], matches: MatchRow[]) {
  const standings = new Map<string, TeamStanding>();

  for (const team of teams) {
    const key = normalizeTeamName(team.name);
    const existing = standings.get(key);
    const nextName = cleanTeamName(team.name);

    if (existing && prefersExistingTeamName(existing.name, nextName)) continue;

    standings.set(key, {
      ...existing,
      name: existing && prefersExistingTeamName(existing.name, nextName) ? existing.name : nextName,
      color: team.color || existing?.color || "#1f7a4d",
      logo: existing?.logo || team.logo_url || null,
      played: existing?.played || 0,
      wins: existing?.wins || 0,
      draws: existing?.draws || 0,
      losses: existing?.losses || 0,
      goalsFor: existing?.goalsFor || 0,
      goalsAgainst: existing?.goalsAgainst || 0,
      goalDiff: existing?.goalDiff || 0,
      points: existing?.points || 0,
      form: existing?.form || [],
    });
  }

  for (const match of matches) {
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
      teamA.form.push("W");
      teamB.form.push("L");
    } else if (match.team_b_score > match.team_a_score) {
      teamB.wins += 1;
      teamA.losses += 1;
      teamB.points += 3;
      teamB.form.push("W");
      teamA.form.push("L");
    } else {
      teamA.draws += 1;
      teamB.draws += 1;
      teamA.points += 1;
      teamB.points += 1;
      teamA.form.push("D");
      teamB.form.push("D");
    }
  }

  return Array.from(standings.values())
    .map((team) => ({
      ...team,
      goalDiff: team.goalsFor - team.goalsAgainst,
      form: team.form.slice(-5),
    }))
    .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor || a.name.localeCompare(b.name));
}

function buildTeamOfTheWeek(standings: TeamStanding[]) {
  const winner = standings.find((team) => team.played > 0);

  return winner || { name: "Coming soon" };
}

function getTeamsForMatches(teams: TeamRow[], matches: MatchRow[], rawDate: string) {
  const matchTeamNames = new Set<string>();

  for (const match of matches) {
    matchTeamNames.add(normalizeTeamName(match.team_a_name));
    matchTeamNames.add(normalizeTeamName(match.team_b_name));
  }

  const datedTeams = teams.filter(
    (team) => team.session_date === rawDate && matchTeamNames.has(normalizeTeamName(team.name)),
  );

  if (datedTeams.length > 0) return datedTeams;

  return teams.filter((team) => matchTeamNames.has(normalizeTeamName(team.name)));
}

function ensureTeam(standings: Map<string, TeamStanding>, name: string) {
  const key = normalizeTeamName(name);

  if (!standings.has(key)) {
    standings.set(key, {
      name: cleanTeamName(name),
      color: "#1f7a4d",
      logo: null,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
      form: [],
    });
  }

  return standings.get(key)!;
}

function getArchiveTopScorer(players: ArchivePlayer[]) {
  const topGoalCount = players[0]?.goals || 0;

  if (topGoalCount === 0) return "No goals entered";

  return players
    .filter((player) => player.goals === topGoalCount)
    .map((player) => `${player.name} (${player.goals})`)
    .join(" / ");
}

function getMatchWinner(match: MatchRow, teamDisplayNames: Map<string, string>) {
  if (match.team_a_score === match.team_b_score) return "Draw";

  const winnerName = match.team_a_score > match.team_b_score ? match.team_a_name : match.team_b_name;

  return getTeamDisplayName(winnerName, teamDisplayNames);
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
      });
    }
  }

  return Array.from(matchesByKey.values());
}

function dedupeTeams(teams: TeamRow[]) {
  const teamsByName = new Map<string, TeamRow>();

  for (const team of teams) {
    const key = `${normalizeTeamName(team.name)}|${team.session_date || "undated"}`;
    const existing = teamsByName.get(key);

    if (!existing) {
      teamsByName.set(key, { ...team, name: cleanTeamName(team.name) });
      continue;
    }

    const nextName = cleanTeamName(team.name);
    const keepExistingName = prefersExistingTeamName(existing.name, nextName);

    teamsByName.set(key, {
      ...existing,
      name: keepExistingName ? existing.name : nextName,
      color: existing.color || team.color,
      logo_url: existing.logo_url || team.logo_url,
      sort_order: Math.min(existing.sort_order, team.sort_order),
      session_date: existing.session_date || team.session_date,
    });
  }

  return Array.from(teamsByName.values()).sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
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

function sortMatchesForDisplay(matches: MatchRow[]) {
  return [...matches].sort(
    (first, second) =>
      second.match_date.localeCompare(first.match_date) ||
      sortMatchesByGameOrder(first, second),
  );
}

function sortMatchesByGameOrder(first: MatchRow, second: MatchRow) {
  return (
    (first.created_at || "").localeCompare(second.created_at || "") ||
    first.week_label.localeCompare(second.week_label) ||
    first.id.localeCompare(second.id)
  );
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

function normalizeTeamName(name: string) {
  return cleanTeamName(name)
    .replace(/^team\s+/i, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizePlayerName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function cleanTeamName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "player";
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function TeamLogo({
  logo,
  color,
  name,
}: {
  logo?: string | null;
  color?: string;
  name: string;
}) {
  const logoValue = logo?.trim();
  const className = "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ring-2 ring-black/5";

  if (!logoValue) {
    return <span className={className} style={{ backgroundColor: color || "#1f7a4d" }} aria-hidden="true" />;
  }

  if (/^https?:\/\//i.test(logoValue) || logoValue.startsWith("/")) {
    return <img src={logoValue} alt={`${name} logo`} className={`${className} bg-white object-cover`} />;
  }

  return <span className={`${className} bg-white font-black`}>{logoValue}</span>;
}

function MiniStat({
  label,
  value,
  icon: Icon,
  logo,
  color,
}: {
  label: string;
  value: string;
  icon?: typeof Trophy;
  logo?: string | null;
  color?: string | null;
}) {
  return (
    <div className="rounded-lg bg-[#f7f3ec] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase text-black/45">{label}</p>
        {Icon && <Icon className="shrink-0 text-[#b7791f]" size={18} />}
      </div>
      <div className="mt-1 flex min-w-0 items-center gap-2">
        {(logo || color) && <TeamLogo logo={logo} color={color || "#1f7a4d"} name={value} />}
        <p className="min-w-0 break-words text-sm font-black">{value}</p>
      </div>
    </div>
  );
}

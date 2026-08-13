import {
  BarChart3,
  CalendarDays,
  Clock,
  Home,
  ListOrdered,
  MapPin,
  Medal,
  ShieldCheck,
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
  start_time: string | null;
  end_time: string | null;
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

type TeamRow = {
  id: string;
  name: string;
  color: string | null;
  logo_url: string | null;
  sort_order: number;
  is_active: boolean;
  session_date: string | null;
  session_start_time: string | null;
  session_end_time: string | null;
  session_location: string | null;
};

type RosterRow = {
  id: string;
  team_id: string;
  player_id: string;
  players: { name: string } | { name: string }[] | null;
};

type LeaderboardPlayer = {
  id: string;
  name: string;
  team: string;
  games: number;
  wins: number;
  goals: number;
  assists: number;
  points: number;
  winPct: number;
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

type TeamRoster = {
  name: string;
  color: string;
  logo: string | null;
  players: string[];
};

type UpcomingSession = {
  date: string;
  rawDate: string;
  time: string;
  location: string;
  teams: TeamRoster[];
};

type MvpPollRow = {
  id: string;
  title: string;
  match_date: string | null;
};

type MvpPollOptionRow = {
  id: string;
  label: string;
};

type MvpVoteRow = {
  option_id: string;
};

type MvpWinner = {
  name: string;
  votes: number;
  totalVotes: number;
  isReady: boolean;
};

const fallbackMvpWinner: MvpWinner = {
  name: "Voting pending",
  votes: 0,
  totalVotes: 0,
  isReady: false,
};

export const revalidate = 0;

export default async function PreviewPage() {
  const data = await getPreviewData();
  const topPlayer = data.players[0];
  const topScorer = data.players.slice().sort((a, b) => b.goals - a.goals || b.points - a.points)[0];
  const topAssister = data.players.slice().sort((a, b) => b.assists - a.assists || b.points - a.points)[0];
  const goalsTotal = data.players.reduce((total, player) => total + player.goals, 0);
  const assistsTotal = data.players.reduce((total, player) => total + player.assists, 0);

  return (
    <main className="min-h-screen bg-[#060B16] text-[#F8FAFC]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,108,255,0.22),transparent_34rem),radial-gradient(circle_at_80%_12%,rgba(110,231,255,0.12),transparent_26rem)]" />
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[88px] border-r border-white/[0.08] bg-[#060B16]/80 px-3 py-5 backdrop-blur-xl lg:block">
        <a href="/" className="grid place-items-center">
          <LogoMark size="sm" />
        </a>
        <nav className="mt-8 grid gap-3 text-[11px] font-black text-slate-400">
          <SideLink href="#dashboard" label="Dash" active icon={Home} />
          <SideLink href="#matches" label="Games" icon={CalendarDays} />
          <SideLink href="/players" label="Players" icon={Users} />
          <SideLink href="#leaderboard" label="Board" icon={ListOrdered} />
          <SideLink href="#teams" label="Teams" icon={ShieldCheck} />
          <SideLink href="/past-sessions" label="Records" icon={Trophy} />
        </nav>
      </aside>

      <div className="relative z-10 px-4 pb-28 pt-5 sm:px-6 lg:ml-[88px] lg:px-8 lg:pb-10">
        <header id="dashboard" className="mx-auto mb-6 flex max-w-[1500px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#6EE7FF]">JC Footy analytics preview</p>
            <h1 className="mt-2 text-5xl font-black leading-[0.92] tracking-[-0.05em] sm:text-6xl xl:text-7xl">
              Pickup Command Center
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-slate-400 sm:text-base">
              Dark sports-dashboard concept using the current JC Footy data. This is a preview route only.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/" className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-black text-slate-200 transition hover:border-[#3B6CFF]/50">
              Current Site
            </a>
            <a href="/admin" className="rounded-2xl border border-[#3B6CFF]/50 bg-[#3B6CFF] px-4 py-3 text-sm font-black text-white shadow-[0_18px_42px_rgba(59,108,255,0.25)] transition hover:bg-[#3158d8]">
              Admin
            </a>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1500px] gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.72fr)]">
          <div className="grid gap-5">
            <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0B1424]/95 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)] sm:p-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-[#6EE7FF]">Latest pickup session</p>
                  <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.04em] sm:text-6xl">
                    {data.upcomingSession?.date || data.sessionLabel}
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-slate-400">
                    {data.upcomingSession
                      ? "Next session details, rosters, and matchday stats in one compact analytics view."
                      : "Latest completed session details, player stats, and match results in one compact analytics view."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <InfoChip icon={Clock} label={data.upcomingSession?.time || "Latest results"} />
                    <InfoChip icon={MapPin} label={data.upcomingSession?.location || "JC Footy"} />
                    <InfoChip icon={Users} label={`${data.teamRosters.length || data.teamStandings.length} teams`} />
                    <InfoChip icon={CalendarDays} label={`${data.matches.length} timed games`} />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <a href="/" className="rounded-2xl border border-[#3B6CFF]/55 bg-gradient-to-br from-[#3B6CFF] to-[#2447D8] px-4 py-3 text-sm font-black text-white shadow-[0_18px_42px_rgba(59,108,255,0.24)]">
                      Keep Current Homepage
                    </a>
                    <a href="https://bondsports.co/login" target="_blank" rel="noreferrer" className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-black text-slate-200">
                      Complete Waiver
                    </a>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/[0.08] bg-[#111C30] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Session summary</p>
                  <div className="mt-4 grid gap-3">
                    <SummaryLine label="Team of the week" value={data.teamOfTheWeek || "Coming soon"} />
                    <SummaryLine label="MVP" value={data.mvpWinner.isReady ? data.mvpWinner.name : "Voting pending"} />
                    <SummaryLine label="Top player" value={topPlayer?.name || "Coming soon"} />
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Goals" value={goalsTotal} note="Latest session total" />
              <StatCard label="Assists" value={assistsTotal} note="Tracked from player stats" />
              <StatCard label="Top scorer" value={topScorer?.name || "TBD"} note={`${topScorer?.goals || 0} goals`} />
              <StatCard label="Top assists" value={topAssister?.name || "TBD"} note={`${topAssister?.assists || 0} assists`} />
            </section>

            <section id="matches" className="rounded-[28px] border border-white/[0.08] bg-[#0B1424]/95 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.24)] sm:p-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">Game timeline</p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.03em]">Game 1-9 Match Flow</h2>
                </div>
                <span className="w-fit rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-black text-slate-300">
                  {data.completedGames} completed / {data.matches.length} games
                </span>
              </div>

              <div className="grid auto-cols-[112px] grid-flow-col gap-3 overflow-x-auto pb-2">
                {data.timelineGames.map((match, index) => (
                  <a
                    key={match.id || `placeholder-${index}`}
                    href="#selected-match"
                    className={`min-h-28 rounded-[20px] border p-3 transition hover:-translate-y-0.5 ${
                      index === 0
                        ? "border-[#3B6CFF]/60 bg-[#3B6CFF]/15 shadow-[0_0_32px_rgba(59,108,255,0.16)]"
                        : "border-white/[0.08] bg-white/[0.04] hover:border-[#3B6CFF]/45"
                    }`}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6EE7FF]">Game {index + 1}</p>
                    <p className="mt-2 text-xs font-bold leading-4 text-slate-400">{match.teamA} vs {match.teamB}</p>
                    <p className="mt-3 inline-flex rounded-xl bg-[#F8FAFC] px-3 py-2 text-lg font-black text-[#08111F]">
                      {match.score}
                    </p>
                  </a>
                ))}
              </div>

              <div id="selected-match" className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Selected match</p>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.03em]">
                    {data.timelineGames[0]?.teamA || "Team A"} vs {data.timelineGames[0]?.teamB || "Team B"}
                  </h3>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {data.selectedMatchStats.length > 0 ? (
                      data.selectedMatchStats.map((stat) => (
                        <div key={`${stat.name}-${stat.team}`} className="rounded-2xl border border-white/[0.08] bg-[#111C30] p-3">
                          <p className="font-black">{stat.name}</p>
                          <p className="mt-1 text-xs font-bold text-slate-400">{stat.team}</p>
                          <p className="mt-3 text-sm font-black text-[#6EE7FF]">{stat.goals} G / {stat.assists} A</p>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-white/[0.08] bg-[#111C30] p-3 text-sm font-bold text-slate-400 sm:col-span-2">
                        Individual player stats will appear when entered.
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Final score</p>
                  <p className="mt-3 text-5xl font-black tracking-[-0.06em]">{data.timelineGames[0]?.score || "--"}</p>
                  <p className="mt-2 text-sm font-bold text-slate-400">{data.timelineGames[0]?.status || "Scheduled"}</p>
                </div>
              </div>
            </section>

            <section id="leaderboard" className="rounded-[28px] border border-white/[0.08] bg-[#0B1424]/95 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.24)] sm:p-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">Leaderboard</p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.03em]">Professional Stat Table</h2>
                </div>
                <span className="w-fit rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-black text-slate-300">
                  Ranked by G+A
                </span>
              </div>
              <div className="grid gap-2">
                <div className="hidden grid-cols-[54px_minmax(0,1.2fr)_minmax(120px,0.9fr)_70px_70px_80px_100px] gap-3 px-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500 md:grid">
                  <span>#</span><span>Player</span><span>Team</span><span>G</span><span>A</span><span>G+A</span><span>Profile</span>
                </div>
                {data.players.slice(0, 8).map((player, index) => (
                  <a
                    key={player.id}
                    href={`/players/${slugify(player.name)}`}
                    className="grid gap-3 rounded-[20px] border border-white/[0.08] bg-white/[0.04] p-3 transition hover:border-[#3B6CFF]/45 hover:bg-white/[0.06] md:grid-cols-[54px_minmax(0,1.2fr)_minmax(120px,0.9fr)_70px_70px_80px_100px] md:items-center"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#3B6CFF]/16 text-sm font-black text-[#B9C8FF]">{index + 1}</span>
                    <div>
                      <p className="font-black">{player.name}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500 md:hidden">{player.team}</p>
                    </div>
                    <span className="hidden text-sm font-bold text-slate-400 md:block">{player.team}</span>
                    <StatPill value={player.goals} />
                    <StatPill value={player.assists} />
                    <span className="w-fit rounded-2xl bg-[#F8FAFC] px-3 py-2 text-sm font-black text-[#08111F]">{player.points}</span>
                    <span className="w-fit rounded-2xl border border-[#3B6CFF]/25 bg-[#3B6CFF]/10 px-3 py-2 text-xs font-black uppercase text-[#9DB3FF]">Profile</span>
                  </a>
                ))}
              </div>
            </section>
          </div>

          <aside className="grid gap-5">
            <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0B1424]/95 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.24)] sm:p-6">
              <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-[#3B6CFF]/20 blur-2xl" />
              <div className="relative">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-[#6EE7FF]">Player spotlight</p>
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="max-w-[220px] text-4xl font-black leading-none tracking-[-0.04em]">{topPlayer?.name || "Coming soon"}</h2>
                    <p className="mt-3 text-sm font-bold leading-6 text-slate-400">Latest session leader by goal contribution.</p>
                  </div>
                  <div className="grid h-24 w-24 shrink-0 place-items-center rounded-[28px] border border-[#3B6CFF]/35 bg-gradient-to-br from-[#3B6CFF]/50 to-[#111C30] text-3xl font-black">
                    {topPlayer ? getInitials(topPlayer.name) : "JC"}
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <MiniMetric label="Goals" value={topPlayer?.goals || 0} />
                  <MiniMetric label="G+A" value={topPlayer?.points || 0} />
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/[0.08] bg-[#0B1424]/95 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.24)] sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">Goals overview</p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.03em]">Game Pulse</h2>
                </div>
                <BarChart3 className="text-[#6EE7FF]" size={26} />
              </div>
              <div className="grid h-44 grid-cols-9 items-end gap-2">
                {data.timelineGames.map((match, index) => (
                  <div
                    key={`bar-${match.id || index}`}
                    className={`min-h-6 rounded-t-full rounded-b-lg bg-gradient-to-b from-[#6EE7FF] to-[#3B6CFF] ${index === 0 ? "opacity-100 shadow-[0_0_28px_rgba(59,108,255,0.46)]" : "opacity-55"}`}
                    style={{ height: `${Math.max(18, Math.min(100, (match.totalGoals || 1) * 18))}%` }}
                  />
                ))}
              </div>
            </section>

            <section id="teams" className="rounded-[28px] border border-white/[0.08] bg-[#0B1424]/95 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.24)] sm:p-6">
              <div className="mb-4">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">Team results</p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.03em]">Recent Form</h2>
              </div>
              <div className="grid gap-2">
                {data.teamStandings.slice(0, 4).map((team, index) => (
                  <div key={team.name} className="rounded-[20px] border border-white/[0.08] bg-white/[0.04] p-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#3B6CFF]/16 text-sm font-black text-[#B9C8FF]">{index + 1}</span>
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black">{team.name}</p>
                        <p className="text-xs font-bold text-slate-500">{team.wins}W {team.draws}D {team.losses}L</p>
                      </div>
                      <span className="rounded-2xl bg-[#F8FAFC] px-3 py-2 text-sm font-black text-[#08111F]">{team.points}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                      {team.form.length > 0 ? team.form.map((result, formIndex) => (
                        <span key={`${team.name}-${result}-${formIndex}`} className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-black ${getFormClass(result)}`}>
                          {result}
                        </span>
                      )) : (
                        <span className="text-xs font-bold text-slate-500">Form appears after games.</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="players" className="rounded-[28px] border border-white/[0.08] bg-[#0B1424]/95 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.24)] sm:p-6">
              <div className="mb-4">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">Player performance</p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.03em]">Player Cards</h2>
              </div>
              <div className="grid gap-2">
                {data.players.slice(0, 4).map((player) => (
                  <a key={`card-${player.id}`} href={`/players/${slugify(player.name)}`} className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] border border-white/[0.08] bg-white/[0.04] p-3 transition hover:border-[#3B6CFF]/45">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#3B6CFF]/25 bg-[#3B6CFF]/18 font-black text-[#B9C8FF]">{getInitials(player.name)}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-black">{player.name}</span>
                      <span className="mt-1 block text-xs font-bold text-slate-500">{player.games} GP / {player.winPct}% win</span>
                    </span>
                    <span className="rounded-2xl bg-[#111C30] px-3 py-2 text-sm font-black text-[#6EE7FF]">{player.points}</span>
                  </a>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>

      <nav className="fixed bottom-3 left-3 right-3 z-40 grid grid-cols-5 gap-2 rounded-[24px] border border-white/[0.08] bg-[#0B1424]/90 p-2 text-[11px] font-black text-slate-400 backdrop-blur-xl lg:hidden">
        <BottomLink href="#dashboard" label="Dash" active icon={Home} />
        <BottomLink href="#matches" label="Games" icon={CalendarDays} />
        <BottomLink href="/players" label="Players" icon={Users} />
        <BottomLink href="#leaderboard" label="Board" icon={ListOrdered} />
        <BottomLink href="#teams" label="Teams" icon={ShieldCheck} />
      </nav>
    </main>
  );
}

async function getPreviewData() {
  const supabase = createSupabaseClient();

  if (!supabase) {
    return buildFallbackPreviewData();
  }

  const [{ data: playerRows }, matchRowsResult, { data: statRows }, teamRowsResult, { data: rosterRows }] = await Promise.all([
    supabase.from("players").select("id,name,position").eq("is_active", true).order("name"),
    selectPreviewMatches(supabase),
    supabase.from("match_players").select("match_id,player_id,team_name,goals,assists,result"),
    selectPreviewTeams(supabase),
    supabase
      .from("tournament_team_players")
      .select("id,team_id,player_id,players(name)")
      .order("created_at", { ascending: true }),
  ]);

  const players = (playerRows || []) as PlayerRow[];
  const matches = sortMatchesForDisplay(dedupeMatches((matchRowsResult.data || []) as MatchRow[]));
  const stats = (statRows || []) as MatchPlayerRow[];
  const rawTeams = (teamRowsResult.data || []) as TeamRow[];
  const teams = dedupeTeams(rawTeams);
  const gameLabels = buildGameLabels(matches);
  const sessionDate = getLatestCompletedSessionDate(matches) || getCurrentSessionDate(matches, teams);
  const sessionMatches = sessionDate ? matches.filter((match) => match.match_date === sessionDate) : [];
  const sessionCompletedMatches = sessionMatches.filter((match) => match.status === "completed");
  const currentTeams = getCurrentSessionTeams(teams, sessionMatches, sessionDate);
  const teamRosters = buildTeamRosters(currentTeams, rawTeams, (rosterRows || []) as unknown as RosterRow[]);
  const teamDisplayNames = buildTeamDisplayNames(teams);
  const matchIds = new Set(sessionCompletedMatches.map((match) => match.id));
  const currentStats = stats.filter((stat) => matchIds.has(stat.match_id));
  const teamStandings = buildTeamStandings(currentTeams, sessionMatches);
  const playerTeamNames = buildCurrentPlayerTeamNames(currentStats, teamDisplayNames);
  const leaderboard = buildLeaderboard(players, currentStats, playerTeamNames);
  const mvpWinner = await getClosedMvpWinner(supabase, sessionDate);
  const upcomingSession = buildUpcomingSession(matches, teams, rawTeams, (rosterRows || []) as unknown as RosterRow[], teamDisplayNames);
  const timelineGames = buildTimelineGames(sessionMatches, gameLabels, teamDisplayNames);
  const selectedMatchStats = buildSelectedMatchStats(timelineGames[0]?.id || "", currentStats, players, teamDisplayNames);

  return {
    sessionLabel: sessionDate ? formatDate(sessionDate) : "Matchday Dashboard",
    matches: sessionMatches,
    completedGames: sessionCompletedMatches.length,
    timelineGames,
    selectedMatchStats,
    players: leaderboard,
    teamStandings,
    teamRosters,
    teamOfTheWeek: buildTeamOfTheWeek(teamStandings),
    mvpWinner,
    upcomingSession,
  };
}

function buildFallbackPreviewData() {
  const players: LeaderboardPlayer[] = [
    { id: "1", name: "Hamzah Q", team: "Team Switzerland", games: 6, wins: 3, goals: 8, assists: 3, points: 11, winPct: 50 },
    { id: "2", name: "Aariz Syed", team: "Team Switzerland", games: 6, wins: 3, goals: 5, assists: 5, points: 10, winPct: 50 },
    { id: "3", name: "Zain Kaiser", team: "Team New Zealand", games: 6, wins: 3, goals: 5, assists: 1, points: 6, winPct: 50 },
  ];
  const teamStandings: TeamStanding[] = [
    { name: "Team Switzerland", color: "#3B6CFF", logo: null, played: 6, wins: 3, draws: 3, losses: 0, goalsFor: 14, goalsAgainst: 8, goalDiff: 6, points: 12, form: ["D", "W", "W"] },
    { name: "Team New Zealand", color: "#6EE7FF", logo: null, played: 6, wins: 3, draws: 1, losses: 2, goalsFor: 12, goalsAgainst: 10, goalDiff: 2, points: 10, form: ["W", "L", "W"] },
  ];

  return {
    sessionLabel: "Thu, Aug 13",
    matches: [],
    completedGames: 6,
    timelineGames: Array.from({ length: 9 }, (_, index) => ({
      id: `fallback-${index}`,
      teamA: index % 2 ? "Team Brazil" : "Team Switzerland",
      teamB: index % 2 ? "Team Turkiye" : "Team New Zealand",
      score: index < 6 ? `${index % 4} - ${(index + 2) % 4}` : "--",
      status: index < 6 ? "Completed" : "Scheduled",
      totalGoals: index < 6 ? 2 + index : 0,
    })),
    selectedMatchStats: [],
    players,
    teamStandings,
    teamRosters: [],
    teamOfTheWeek: "Team Switzerland",
    mvpWinner: fallbackMvpWinner,
    upcomingSession: null,
  };
}

async function selectPreviewMatches(
  supabase: NonNullable<ReturnType<typeof createSupabaseClient>>,
) {
  const withStartTime = await supabase
    .from("matches")
    .select("id,match_date,start_time,end_time,week_label,location,team_a_name,team_b_name,team_a_score,team_b_score,status,created_at")
    .order("match_date", { ascending: false })
    .limit(80);

  if (!isMissingStartTimeColumn(withStartTime.error)) return withStartTime;

  const withoutStartTime = await supabase
    .from("matches")
    .select("id,match_date,week_label,location,team_a_name,team_b_name,team_a_score,team_b_score,status,created_at")
    .order("match_date", { ascending: false })
    .limit(80);

  return {
    ...withoutStartTime,
    data: withoutStartTime.data?.map((match) => ({ ...match, start_time: null, end_time: null })),
  };
}

async function selectPreviewTeams(
  supabase: NonNullable<ReturnType<typeof createSupabaseClient>>,
) {
  const withDetails = await supabase
    .from("tournament_teams")
    .select("id,name,color,logo_url,sort_order,is_active,session_date,session_start_time,session_end_time,session_location")
    .eq("is_active", true)
    .order("session_date", { ascending: false, nullsFirst: false })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (!withDetails.error) return withDetails;

  const withoutDetails = await supabase
    .from("tournament_teams")
    .select("id,name,color,sort_order,is_active,session_date")
    .eq("is_active", true)
    .order("session_date", { ascending: false, nullsFirst: false })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return {
    ...withoutDetails,
    data: withoutDetails.data?.map((team) => ({
      ...team,
      logo_url: null,
      session_start_time: null,
      session_end_time: null,
      session_location: null,
    })),
  };
}

async function getClosedMvpWinner(
  supabase: NonNullable<ReturnType<typeof createSupabaseClient>>,
  matchDate: string,
): Promise<MvpWinner> {
  let query = supabase
    .from("mvp_polls")
    .select("id,title,match_date")
    .eq("status", "closed")
    .order("created_at", { ascending: false })
    .limit(5);

  if (matchDate) query = query.eq("match_date", matchDate);

  const { data: polls, error: pollError } = await query;
  if (pollError || !polls?.length) return fallbackMvpWinner;

  for (const poll of polls as MvpPollRow[]) {
    const [{ data: optionRows, error: optionError }, { data: voteRows, error: voteError }] = await Promise.all([
      supabase.from("mvp_poll_options").select("id,label").eq("poll_id", poll.id),
      supabase.from("mvp_votes").select("option_id").eq("poll_id", poll.id),
    ]);

    if (optionError || voteError) continue;

    const voteCounts = new Map<string, number>();
    for (const vote of (voteRows || []) as MvpVoteRow[]) {
      voteCounts.set(vote.option_id, (voteCounts.get(vote.option_id) || 0) + 1);
    }

    const [winner] = ((optionRows || []) as MvpPollOptionRow[])
      .map((option) => ({ label: option.label, votes: voteCounts.get(option.id) || 0 }))
      .sort((a, b) => b.votes - a.votes || a.label.localeCompare(b.label));

    if (winner && winner.votes > 0) {
      return { name: winner.label, votes: winner.votes, totalVotes: (voteRows || []).length, isReady: true };
    }
  }

  return fallbackMvpWinner;
}

function buildLeaderboard(players: PlayerRow[], stats: MatchPlayerRow[], playerTeamNames: Map<string, string>) {
  const totalsByPlayer = new Map<string, Omit<LeaderboardPlayer, "id" | "name" | "team" | "winPct">>();

  for (const player of players) {
    totalsByPlayer.set(player.id, { games: 0, wins: 0, goals: 0, assists: 0, points: 0 });
  }

  for (const stat of stats) {
    const totals = totalsByPlayer.get(stat.player_id);
    if (!totals) continue;

    totals.games += 1;
    totals.goals += stat.goals || 0;
    totals.assists += stat.assists || 0;
    totals.wins += stat.result === "win" ? 1 : 0;
    totals.points = totals.goals + totals.assists;
  }

  return players
    .map((player) => {
      const totals = totalsByPlayer.get(player.id) || { games: 0, wins: 0, goals: 0, assists: 0, points: 0 };

      return {
        id: player.id,
        name: player.name,
        team: playerTeamNames.get(player.id) || "Unassigned",
        ...totals,
        winPct: totals.games > 0 ? Math.round((totals.wins / totals.games) * 100) : 0,
      };
    })
    .filter((player) => player.games > 0)
    .sort((a, b) => b.points - a.points || b.goals - a.goals || a.name.localeCompare(b.name));
}

function buildSelectedMatchStats(
  matchId: string,
  stats: MatchPlayerRow[],
  players: PlayerRow[],
  teamDisplayNames: Map<string, string>,
) {
  const playerNames = new Map(players.map((player) => [player.id, player.name]));

  return stats
    .filter((stat) => stat.match_id === matchId)
    .map((stat) => ({
      name: playerNames.get(stat.player_id) || "Player",
      team: getTeamDisplayName(stat.team_name, teamDisplayNames),
      goals: stat.goals || 0,
      assists: stat.assists || 0,
    }))
    .filter((stat) => stat.goals > 0 || stat.assists > 0)
    .sort((a, b) => b.goals + b.assists - (a.goals + a.assists) || a.name.localeCompare(b.name));
}

function buildTimelineGames(matches: MatchRow[], gameLabels: Map<string, string>, teamDisplayNames: Map<string, string>) {
  const realGames = matches.sort(sortMatchesByGameOrder).map((match) => ({
    id: match.id,
    label: gameLabels.get(match.id) || "Game",
    teamA: getTeamDisplayName(match.team_a_name, teamDisplayNames),
    teamB: getTeamDisplayName(match.team_b_name, teamDisplayNames),
    score: match.status === "scheduled" ? "--" : `${match.team_a_score} - ${match.team_b_score}`,
    status: getMatchStatusLabel(match.status),
    totalGoals: match.status === "scheduled" ? 0 : match.team_a_score + match.team_b_score,
  }));

  while (realGames.length < 9) {
    const index = realGames.length;
    realGames.push({
      id: "",
      label: `Game ${index + 1}`,
      teamA: "Team A",
      teamB: "Team B",
      score: "--",
      status: "Scheduled",
      totalGoals: 0,
    });
  }

  return realGames.slice(0, 9);
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
      name: nextName,
      color: team.color || "#3B6CFF",
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
    if (match.status !== "completed") continue;

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
    .map((team) => ({ ...team, goalDiff: team.goalsFor - team.goalsAgainst, form: team.form.slice(-5) }))
    .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor || a.name.localeCompare(b.name));
}

function buildTeamOfTheWeek(standings: TeamStanding[]) {
  return standings.find((team) => team.played > 0)?.name || "Coming soon";
}

function buildCurrentPlayerTeamNames(currentMatchStats: MatchPlayerRow[], teamDisplayNames: Map<string, string>) {
  const playerTeams = new Map<string, string>();

  for (const stat of currentMatchStats) {
    if (playerTeams.has(stat.player_id)) continue;
    playerTeams.set(stat.player_id, getTeamDisplayName(stat.team_name, teamDisplayNames));
  }

  return playerTeams;
}

function buildUpcomingSession(
  matches: MatchRow[],
  teams: TeamRow[],
  rawTeams: TeamRow[],
  rosterRows: RosterRow[],
  teamDisplayNames: Map<string, string>,
): UpcomingSession | null {
  const today = getTodayDateInput();
  const upcomingMatches = matches
    .filter((match) => match.match_date >= today && match.status !== "completed")
    .sort((first, second) => first.match_date.localeCompare(second.match_date) || sortMatchesByGameOrder(first, second));
  const sessionDate = upcomingMatches[0]?.match_date || getNextTeamSessionDate(teams);

  if (!sessionDate) return null;

  const sessionMatches = upcomingMatches.filter((match) => match.match_date === sessionDate);
  const sessionTeams = sessionMatches.length > 0
    ? getTeamsForMatches(teams, sessionMatches)
    : teams.filter((team) => team.session_date === sessionDate);
  const rosters = buildTeamRosters(sessionTeams, rawTeams, rosterRows);
  const sessionDetails = getTeamSessionDetails(sessionTeams);
  const location = sessionMatches.find((match) => match.location?.trim())?.location?.trim() || sessionDetails.location || "Field TBD";
  const startTime = sessionMatches.find((match) => match.start_time)?.start_time || sessionDetails.startTime;
  const endTime = sessionMatches.find((match) => match.end_time)?.end_time || sessionDetails.endTime;

  return {
    date: formatDate(sessionDate),
    rawDate: sessionDate,
    time: startTime ? formatTimeRange(startTime, endTime) : "Time TBD",
    location,
    teams: rosters,
  };
}

function getCurrentSessionDate(matches: MatchRow[], teams: TeamRow[] = []) {
  const nextTeamSession = getNextTeamSessionDate(teams);
  if (nextTeamSession) return nextTeamSession;

  const currentMatch = [...matches].sort(
    (first, second) =>
      second.match_date.localeCompare(first.match_date) ||
      sortMatchesByGameOrder(first, second),
  )[0];

  if (currentMatch) return currentMatch.match_date;

  return getLatestTeamSessionDate(teams);
}

function getLatestCompletedSessionDate(matches: MatchRow[]) {
  return matches
    .filter((match) => match.status === "completed")
    .map((match) => match.match_date)
    .sort((first, second) => second.localeCompare(first))[0] || "";
}

function getNextTeamSessionDate(teams: TeamRow[]) {
  const today = getTodayDateInput();

  return teams
    .map((team) => team.session_date)
    .filter((date): date is string => Boolean(date && date >= today))
    .sort((first, second) => first.localeCompare(second))[0] || "";
}

function getLatestTeamSessionDate(teams: TeamRow[]) {
  return teams
    .map((team) => team.session_date)
    .filter((date): date is string => Boolean(date))
    .sort((first, second) => second.localeCompare(first))[0] || "";
}

function getCurrentSessionTeams(teams: TeamRow[], currentMatches: MatchRow[], currentDate = "") {
  const datedTeams = currentDate ? teams.filter((team) => team.session_date === currentDate) : [];
  if (datedTeams.length > 0) return datedTeams;

  if (currentMatches.length > 0) return getTeamsForMatches(teams, currentMatches);

  return [];
}

function getTeamsForMatches(teams: TeamRow[], matches: MatchRow[]) {
  const matchTeamNames = new Set<string>();

  for (const match of matches) {
    matchTeamNames.add(normalizeTeamName(match.team_a_name));
    matchTeamNames.add(normalizeTeamName(match.team_b_name));
  }

  return teams.filter((team) => matchTeamNames.has(normalizeTeamName(team.name)));
}

function getTeamSessionDetails(teams: TeamRow[]) {
  const startTime = teams.find((team) => team.session_start_time)?.session_start_time || null;
  const endTime = teams.find((team) => team.session_end_time)?.session_end_time || null;
  const location = teams.find((team) => team.session_location?.trim())?.session_location?.trim() || "";

  return { startTime, endTime, location };
}

function buildTeamRosters(teams: TeamRow[], rawTeams: TeamRow[], rosterRows: RosterRow[]) {
  const rawTeamKeys = new Map(rawTeams.map((team) => [team.id, normalizeTeamName(team.name)]));
  const rostersByTeam = new Map<string, TeamRoster>();

  for (const team of teams) {
    rostersByTeam.set(normalizeTeamName(team.name), {
      name: cleanTeamName(team.name),
      color: team.color || "#3B6CFF",
      logo: team.logo_url || null,
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
      color: "#3B6CFF",
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
      session_start_time: existing.session_start_time || team.session_start_time,
      session_end_time: existing.session_end_time || team.session_end_time,
      session_location: existing.session_location || team.session_location,
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

function cleanTeamName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function isMissingStartTimeColumn(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const { code, message } = error as { code?: string; message?: string };
  return code === "42703" || code === "PGRST204" || Boolean(message?.includes("start_time")) || Boolean(message?.includes("end_time"));
}

function getTodayDateInput() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTimeLabel(value: string) {
  if (!value) return "Time TBD";
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date(2000, 0, 1, hours, minutes || 0);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatTimeRange(startTime: string, endTime?: string | null) {
  if (!endTime) return formatTimeLabel(startTime);
  return `${formatTimeLabel(startTime)} - ${formatTimeLabel(endTime)}`;
}

function getMatchStatusLabel(status: string) {
  if (status === "completed") return "Completed";
  if (status === "live") return "Live";
  if (status === "scheduled") return "Scheduled";
  return status;
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "player";
}

function getFormClass(result: "W" | "D" | "L") {
  if (result === "W") return "bg-emerald-400/15 text-emerald-300";
  if (result === "D") return "bg-amber-300/15 text-amber-200";
  return "bg-rose-400/15 text-rose-300";
}

function SideLink({
  href,
  label,
  icon: Icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`grid h-14 place-items-center rounded-2xl border transition ${
        active
          ? "border-[#3B6CFF]/35 bg-[#3B6CFF]/16 text-white"
          : "border-transparent hover:border-[#3B6CFF]/35 hover:bg-[#3B6CFF]/12 hover:text-white"
      }`}
      title={label}
    >
      <Icon size={18} />
      <span>{label}</span>
    </a>
  );
}

function BottomLink({
  href,
  label,
  icon: Icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active?: boolean;
}) {
  return (
    <a href={href} className={`grid place-items-center rounded-2xl px-1 py-2 ${active ? "bg-[#3B6CFF]/18 text-white" : ""}`}>
      <Icon size={17} />
      <span className="mt-1">{label}</span>
    </a>
  );
}

function InfoChip({ icon: Icon, label }: { icon: typeof Clock; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-black text-slate-300">
      <Icon size={15} />
      {label}
    </span>
  );
}

function StatCard({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <article className="rounded-[24px] border border-white/[0.08] bg-[#0B1424]/95 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.2)] sm:p-5">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-3 truncate text-3xl font-black tracking-[-0.04em]">{value}</p>
      <p className="mt-2 text-xs font-bold text-slate-500">{note}</p>
    </article>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 break-words font-black">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function StatPill({ value }: { value: number }) {
  return <span className="w-fit rounded-2xl bg-[#111C30] px-3 py-2 text-sm font-black text-slate-100">{value}</span>;
}

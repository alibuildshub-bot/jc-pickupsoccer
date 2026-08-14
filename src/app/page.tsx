import {
  BarChart3,
  CalendarDays,
  Clock,
  MapPin,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import LogoMark from "@/components/LogoMark";
import PlayerLeaderboard from "@/components/PlayerLeaderboard";
import SiteVisitTracker from "@/components/SiteVisitTracker";
import { createSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type PlayerRow = {
  id: string;
  name: string;
  position: string | null;
  is_active?: boolean;
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

type LeaderboardPlayer = {
  name: string;
  team: string;
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
  logo_url: string | null;
  sort_order: number;
  is_active: boolean;
  session_date: string | null;
  session_start_time: string | null;
  session_end_time: string | null;
  session_location: string | null;
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

type RosterRow = {
  id: string;
  team_id: string;
  player_id: string;
  players: { name: string } | { name: string }[] | null;
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
  startTime: string | null;
  endTime: string | null;
  location: string;
  calendarUrl: string;
  googleCalendarUrl: string;
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
  title: string;
  date: string;
  isReady: boolean;
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
  topScorer: string;
};

type SessionGoalTrend = {
  date: string;
  totalGoals: number;
  games: number;
  goalsPerGame: number;
};

const fallbackTeamOfTheWeek = {
  name: "Coming soon",
  color: "#1f7a4d",
  logo: null,
  goalsFor: 0,
  points: 0,
  record: "0W - 0D - 0L",
  isReady: false,
};

const fallbackMvpWinner: MvpWinner = {
  name: "Coming soon",
  votes: 0,
  totalVotes: 0,
  title: "Tournament MVP",
  date: "After voting closes",
  isReady: false,
};

export const revalidate = 0;

export default async function Home() {
  const data = await getDashboardData();
  const latestSession = data.latestSession || {
    label: "Latest Session",
    winner: "Waiting on results",
    winnerLogo: null,
    winnerColor: "#1f7a4d",
    mvp: "Voting pending",
  };
  const topPlayers = data.players.slice(0, 3);
  const topPlayersLabel = data.playerLeaderboardLabel.replace(" Stats", "");
  const showUpcomingTeams = data.completedTournamentGames === 0 && data.teamRosters.length > 0;

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-[#171717]">
      <SiteVisitTracker />
      <nav className="sticky top-0 z-20 border-b border-black/10 bg-[#f7f3ec]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="text-lg font-black leading-none">JC Pickup Soccer</p>
              <p className="text-xs font-medium text-black/55">Weekly rec league stats</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm font-semibold text-black/65 md:flex">
            <a href="#progress" className="rounded-lg px-3 py-2 hover:bg-white hover:text-black">Standings</a>
            <a href="/players" className="rounded-lg px-3 py-2 hover:bg-white hover:text-black">Players</a>
            <a href="#matches" className="rounded-lg px-3 py-2 hover:bg-white hover:text-black">Matches</a>
            <a href="#teams" className="rounded-lg px-3 py-2 hover:bg-white hover:text-black">Teams</a>
            <a href="/past-sessions" className="rounded-lg px-3 py-2 hover:bg-white hover:text-black">Past Sessions</a>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 text-sm font-black text-black/65 sm:px-6 md:hidden">
          <a href="#progress" className="shrink-0 rounded-lg border border-black/10 bg-white px-3 py-2">Standings</a>
          <a href="/players" className="shrink-0 rounded-lg border border-black/10 bg-white px-3 py-2">Players</a>
          <a href="#matches" className="shrink-0 rounded-lg border border-black/10 bg-white px-3 py-2">Matches</a>
          <a href="#teams" className="shrink-0 rounded-lg border border-black/10 bg-white px-3 py-2">Teams</a>
          <a href="/past-sessions" className="shrink-0 rounded-lg bg-[#171717] px-3 py-2 text-white">Past Sessions</a>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 inline-flex w-fit rounded-lg bg-[#edf4f0] px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#17613d] sm:px-3 sm:py-2 sm:text-sm">
              JC Footy
            </p>
            <h1 className="text-[2rem] font-black leading-none tracking-normal sm:text-6xl">
              Matchday Dashboard
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/players"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#1f7a4d] px-4 text-center text-sm font-black text-white transition hover:bg-[#17613d]"
            >
              Players
            </a>
            <a
              href="#progress"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-black/15 bg-white px-4 text-center text-sm font-black text-black transition hover:border-black/30"
            >
              Standings
            </a>
          </div>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[1.35fr_0.9fr]">
          <article className="rounded-lg border border-black/10 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-[#17613d] sm:text-sm">
                  {data.upcomingSession ? "Next Pickup" : "Latest Session Recap"}
                </p>
                <h2 className="mt-2 text-3xl font-black leading-none sm:text-5xl">
                  {data.upcomingSession ? data.upcomingSession.date : latestSession.label}
                </h2>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-5 text-black/55 sm:leading-6">
                  {data.upcomingSession
                    ? "Add it to your calendar, complete the waiver, and check back after games for updated stats."
                    : "The latest pickup is complete. Review the winner, player stats, and full session results below."}
                </p>
              </div>
              {data.upcomingSession ? (
                <CalendarDays className="shrink-0 text-[#b7791f]" size={38} />
              ) : (
                <Trophy className="shrink-0 text-[#b7791f]" size={38} />
              )}
            </div>
            {data.upcomingSession ? (
              <>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-[#fbfaf7] px-3 py-2 text-xs font-bold text-black/60 sm:text-sm">
                    <MapPin size={16} />
                    {data.upcomingSession.location}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-lg bg-[#fbfaf7] px-3 py-2 text-xs font-bold text-black/60 sm:text-sm">
                    <Clock size={16} />
                    {data.upcomingSession.time}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-lg bg-[#fbfaf7] px-3 py-2 text-xs font-bold text-black/60 sm:text-sm">
                    <Users size={16} />
                    {data.upcomingSession.teams.length} teams
                  </span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <a
                    href={data.upcomingSession.calendarUrl}
                    download={`jc-footy-${data.upcomingSession.rawDate}.ics`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1f7a4d] px-4 text-center text-sm font-black text-white transition hover:bg-[#17613d]"
                  >
                    <CalendarDays size={17} />
                    Add to Calendar
                  </a>
                  <a
                    href={data.upcomingSession.googleCalendarUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-black/15 bg-white px-4 text-center text-sm font-black text-black transition hover:border-black/30"
                  >
                    <Clock size={17} />
                    Google
                  </a>
                  <a
                    href="https://bondsports.co/login"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#1f7a4d]/30 bg-[#edf4f0] px-4 text-center text-sm font-black text-[#17613d] transition hover:border-[#17613d]"
                  >
                    <ShieldCheck size={17} />
                    Complete Waiver
                  </a>
                </div>

                {data.upcomingSession.teams.length > 0 ? (
                  <div className="mt-4 grid gap-2 md:grid-cols-3">
                    {data.upcomingSession.teams.map((team) => (
                      <div key={`next-${team.name}`} className="rounded-lg border border-black/10 bg-[#fbfaf7] p-3">
                        <div className="mb-1 flex items-center gap-2">
                          <TeamLogo logo={team.logo} color={team.color} name={team.name} />
                          <p className="truncate text-sm font-black">{team.name}</p>
                        </div>
                        <p className="text-xs font-bold text-black/45">{formatPlayerCount(team.players.length)}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="mt-5">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <MiniStat label="Winner" value={latestSession.winner} icon={Trophy} />
                  <MiniStat
                    label="Games Complete"
                    value={`${data.completedTournamentGames}/${data.tournamentGames || data.completedTournamentGames}`}
                  />
                  <MiniStat label="Total Goals" value={String(data.goalsTracked)} />
                  <MiniStat
                    label={data.mvpWinner.isReady ? "MVP" : "Top Player"}
                    value={data.mvpWinner.isReady
                      ? data.mvpWinner.name
                      : data.players[0]
                        ? `${data.players[0].name} - ${data.players[0].points} G+A`
                        : "Stats pending"}
                    icon={Trophy}
                  />
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <a
                    href="#progress"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1f7a4d] px-4 text-center text-sm font-black text-white transition hover:bg-[#17613d]"
                  >
                    <Trophy size={17} />
                    View Results
                  </a>
                  <a
                    href="#leaderboard"
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-black/15 bg-white px-4 text-center text-sm font-black text-black transition hover:border-black/30"
                  >
                    Player Stats
                  </a>
                  <a
                    href="/past-sessions"
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-black/15 bg-white px-4 text-center text-sm font-black text-black transition hover:border-black/30"
                  >
                    Past Sessions
                  </a>
                </div>
                <div className="mt-4">
                <a
                  href="https://bondsports.co/login"
                  target="_blank"
                  rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#1f7a4d]/30 bg-[#edf4f0] px-4 text-center text-sm font-black text-[#17613d] transition hover:border-[#17613d]"
                >
                  <ShieldCheck size={17} />
                  Complete Waiver
                </a>
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-black/10 pt-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-black uppercase tracking-wide text-black/45">Latest Results</p>
                <a href="/past-sessions" className="text-sm font-black text-[#17613d] hover:text-black">View all</a>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {data.recentMatches.length > 0 ? (
                  data.recentMatches.slice(0, 2).map((match) => (
                    <article key={`latest-${match.week}-${match.date}-${match.game}`} className="rounded-lg bg-[#fbfaf7] p-3">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase text-[#17613d]">{match.game}</p>
                          <p className="mt-1 text-xs font-bold text-black/45">{match.date}</p>
                        </div>
                        <p className="rounded-lg bg-[#171717] px-3 py-2 text-sm font-black text-white">{match.score}</p>
                      </div>
                      <p className="break-words text-sm font-black">{match.teamA} vs {match.teamB}</p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-lg bg-[#fbfaf7] p-3 text-sm font-bold text-black/50 md:col-span-2">
                    Latest results will appear after the next completed pickup.
                  </div>
                )}
              </div>
              {data.recentMatches.length > 2 ? (
                <div className="mt-3 rounded-lg bg-[#fbfaf7] p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-wide text-black/45">Session Timeline</p>
                    <p className="text-xs font-bold text-black/40">{data.recentMatches.length} games</p>
                  </div>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {data.recentMatches.slice(2).map((match) => (
                      <a
                        key={`timeline-${match.week}-${match.date}-${match.game}`}
                        href="/past-sessions"
                        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-xs transition hover:bg-[#f1ece3]"
                      >
                        <span className="font-black uppercase text-[#17613d]">{match.game}</span>
                        <span className="truncate font-bold text-black/60">{match.teamA} vs {match.teamB}</span>
                        <span className="rounded-md bg-[#171717] px-2 py-1 font-black text-white">{match.score}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </article>

          <div className="grid gap-4">
            <article className="rounded-lg border border-black/10 bg-white p-4 shadow-sm sm:p-5">
              <div>
                <p className="text-xs font-bold text-black/50 sm:text-sm">Latest Session</p>
                <h2 className="mt-1 text-xl font-black sm:text-2xl">{latestSession.label}</h2>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <TeamCompactResult
                  label="Winner"
                  value={latestSession.winner}
                  logo={latestSession.winnerLogo}
                  color={latestSession.winnerColor}
                />
                <CompactResult label="MVP" value={latestSession.mvp} />
              </div>
            </article>

            <SessionGoalChart trends={data.sessionGoalTrends} />

            <article className="rounded-lg border border-black/10 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-black/50 sm:text-sm">Top Players</p>
                  <h2 className="mt-1 text-xl font-black sm:text-2xl">{topPlayersLabel} Top 3</h2>
                </div>
                <Trophy className="text-[#c7922b]" size={28} />
              </div>
              {topPlayers.length > 0 ? (
                <div className="grid gap-2">
                  {topPlayers.map((player, index) => (
                    <TopPlayerCard key={player.name} player={player} rank={index + 1} />
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-[#fbfaf7] px-3 py-4 text-sm font-semibold leading-6 text-black/55">
                  Top players will appear after stats are entered.
                </p>
              )}
            </article>
          </div>
        </div>
      </section>

      <section id="progress" className="mx-auto max-w-7xl px-3 pb-6 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-black/10 bg-white p-3 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold text-black/50 sm:text-sm">
                {showUpcomingTeams ? "Upcoming Teams" : "Tournament Progress"}
              </p>
              <h2 className="text-xl font-black sm:text-2xl">{data.tournamentLabel}</h2>
            </div>
            <p className="text-xs font-bold text-black/50 sm:text-sm">
              {showUpcomingTeams
                ? "Standings will appear after Game 1"
                : `${data.completedTournamentGames} completed / ${data.tournamentGames} games`}
            </p>
          </div>
          {showUpcomingTeams ? (
            <UpcomingTeams teams={data.teamRosters} />
          ) : (
            <>
              <div className="grid gap-2 md:hidden">
                {data.teamStandings.length > 0 ? data.teamStandings.map((team, index) => (
                  <article key={team.name} className="rounded-lg border border-black/10 bg-[#fbfaf7] p-3">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#edf4f0] text-xs font-black text-[#17613d]">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <TeamLogo logo={team.logo} color={team.color} name={team.name} />
                            <h3 className="break-words font-black leading-tight">{team.name}</h3>
                          </div>
                          <p className="mt-1 text-xs font-bold text-black/45">
                            {team.wins}W {team.draws}D {team.losses}L
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black">{team.points}</p>
                        <p className="text-xs font-black uppercase text-black/40">PTS</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <MiniStat label="P" value={String(team.played)} />
                      <MiniStat label="GF" value={String(team.goalsFor)} />
                      <MiniStat label="GA" value={String(team.goalsAgainst)} />
                      <MiniStat label="GD" value={String(team.goalDiff)} />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-[#f7f3ec] px-3 py-2">
                      <span className="text-xs font-black uppercase text-black/40">Form</span>
                      <TeamForm form={team.form} />
                    </div>
                  </article>
                )) : (
                  <div className="rounded-lg border border-black/10 bg-[#fbfaf7] p-4">
                    <p className="font-black">No standings yet.</p>
                    <p className="mt-1 text-sm font-semibold text-black/50">
                      Teams will appear here once tomorrow&apos;s games are scheduled.
                    </p>
                  </div>
                )}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[840px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-black/10 bg-[#fbfaf7] text-xs font-black uppercase text-black/45">
                      <th className="w-14 rounded-l-lg px-3 py-3 text-center">Pos</th>
                      <th className="px-3 py-3">Club</th>
                      <th className="py-3 text-center">MP</th>
                      <th className="py-3 text-center">W</th>
                      <th className="py-3 text-center">D</th>
                      <th className="py-3 text-center">L</th>
                      <th className="py-3 text-center">GF</th>
                      <th className="py-3 text-center">GA</th>
                      <th className="py-3 text-center">GD</th>
                      <th className="py-3 text-center">Form</th>
                      <th className="rounded-r-lg py-3 text-center">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.teamStandings.map((team, index) => (
                      <tr key={team.name} className="border-b border-black/10 last:border-0 hover:bg-[#fbfaf7]">
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4f0] text-sm font-black text-[#17613d]">
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <TeamLogo logo={team.logo} color={team.color} name={team.name} size="md" />
                            <div className="min-w-0">
                              <span className="block truncate text-base font-black">{team.name}</span>
                              <span className="text-xs font-bold uppercase text-black/35">
                                {team.played === 0 ? "Awaiting first match" : `${team.wins}W ${team.draws}D ${team.losses}L`}
                              </span>
                            </div>
                          </div>
                        </td>
                        <LeagueNumber value={team.played} />
                        <LeagueNumber value={team.wins} />
                        <LeagueNumber value={team.draws} />
                        <LeagueNumber value={team.losses} />
                        <LeagueNumber value={team.goalsFor} />
                        <LeagueNumber value={team.goalsAgainst} />
                        <LeagueNumber value={team.goalDiff} strong={team.goalDiff !== 0} />
                        <td className="py-3">
                          <div className="flex justify-center">
                            <TeamForm form={team.form} />
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <span className="inline-flex min-w-11 justify-center rounded-lg bg-[#171717] px-3 py-2 text-sm font-black text-white">
                            {team.points}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-black/45">
                  <span>MP: Matches Played</span>
                  <span>GF: Goals For</span>
                  <span>GA: Goals Against</span>
                  <span>GD: Goal Difference</span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section id="teams" className="mx-auto max-w-7xl px-3 pb-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-black/50">Rosters</p>
            <h2 className="text-xl font-black sm:text-2xl">Teams & Players</h2>
          </div>
          <Users className="hidden text-[#1f7a4d] sm:block" size={26} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.teamRosters.length > 0 ? data.teamRosters.map((team) => (
            <article key={team.name} className="rounded-lg border border-black/10 bg-white p-3 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3 border-b border-black/10 pb-3 sm:mb-4 sm:pb-4">
                <div className="flex min-w-0 items-center gap-3">
                  <TeamLogo logo={team.logo} color={team.color} name={team.name} size="md" />
                  <h3 className="break-words text-base font-black leading-tight sm:text-lg">{team.name}</h3>
                </div>
                <p className="shrink-0 text-sm font-black text-black/45">{formatPlayerCount(team.players.length)}</p>
              </div>
              {team.players.length > 0 ? (
                <div className="grid gap-2">
                  {team.players.map((player, index) => (
                    <div key={`${team.name}-${player}`} className="flex items-center gap-3 rounded-lg bg-[#fbfaf7] px-3 py-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#edf4f0] text-xs font-black text-[#17613d]">
                        {index + 1}
                      </span>
                      <a href={`/players/${slugify(player)}`} className="min-w-0 break-words text-sm font-bold hover:underline">
                        {player}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-[#fbfaf7] px-3 py-4 text-sm font-semibold text-black/50">
                  Roster coming soon.
                </p>
              )}
            </article>
          )) : (
            <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm md:col-span-2 xl:col-span-3">
              <p className="font-black">Rosters coming soon.</p>
              <p className="mt-1 text-sm font-semibold text-black/50">
                Add tomorrow&apos;s teams and players in the admin portal.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-start gap-4 px-3 pb-6 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div id="matches" className="rounded-lg border border-black/10 bg-white p-3 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-black/50 sm:text-sm">Game Log</p>
              <h2 className="text-xl font-black sm:text-2xl">Recent Matches</h2>
            </div>
            <CalendarDays className="text-[#1f7a4d]" size={26} />
          </div>
          <div className="space-y-3">
            {data.recentMatches.length > 0 ? (
              data.recentMatches.map((match) => (
                <article key={`${match.week}-${match.date}-${match.game}`} className="rounded-lg border border-black/10 bg-[#fbfaf7] p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-black/50">{match.date}</p>
                      <p className="mt-1 text-xs font-black uppercase text-[#1f7a4d]">{match.game}</p>
                      <h3 className="mt-1 text-base font-black sm:text-lg">{match.week}</h3>
                    </div>
                    <p className="shrink-0 rounded-lg bg-[#171717] px-3 py-2 text-sm font-black text-white sm:text-lg">{match.score}</p>
                  </div>
                  <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-sm font-bold">
                    <span className="min-w-0 break-words">{match.teamA}</span>
                    <span className="text-black/35">vs</span>
                    <span className="min-w-0 break-words text-right">{match.teamB}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-black/55">Winner: {match.winner}</p>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-black/10 bg-[#fbfaf7] p-4 text-sm font-bold text-black/50">
                Match results will appear here after games are completed.
              </div>
            )}
          </div>
        </div>

        <div id="leaderboard" className="rounded-lg border border-black/10 bg-white p-3 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-black/50 sm:text-sm">{data.playerLeaderboardLabel}</p>
              <h2 className="text-xl font-black sm:text-2xl">Player Leaderboard</h2>
            </div>
            <Trophy className="text-[#b7791f]" size={28} />
          </div>
          {data.players.length > 0 ? (
            <PlayerLeaderboard players={data.players} />
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

      <section className="mx-auto max-w-7xl px-3 pb-6 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-black/10 bg-white p-3 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-black/50 sm:text-sm">Results</p>
              <h2 className="text-xl font-black sm:text-2xl">Past Sessions</h2>
            </div>
            <CalendarDays className="text-[#1f7a4d]" size={26} />
          </div>
          {data.resultsArchive.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-3">
              {data.resultsArchive.slice(0, 3).map((day) => (
                <a
                  key={day.date}
                  href="/past-sessions"
                  className="rounded-lg border border-black/10 bg-[#fbfaf7] p-4 transition hover:border-[#1f7a4d]/40 hover:bg-[#f1ece3]"
                >
                  <p className="text-xs font-black uppercase text-[#1f7a4d]">Completed session</p>
                  <h3 className="mt-1 text-xl font-black">{day.date}</h3>
                  <div className="mt-4 grid gap-2">
                    <MiniStat label="Team of the Week" value={day.teamOfTheWeek} icon={Trophy} />
                    <MiniStat label="Games" value={String(day.matches.length)} />
                    <MiniStat label="Total Goals" value={String(day.totalGoals)} />
                  </div>
                </a>
              ))}
              <div className="rounded-lg border border-dashed border-black/20 bg-white p-4 md:col-span-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black">Past results are saved here.</p>
                    <p className="mt-1 text-sm font-semibold text-black/50">
                      View previous pickup dates, final tables, match scores, and player stats.
                    </p>
                  </div>
                  <a
                    href="/past-sessions"
                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-[#171717] px-4 text-sm font-black text-white transition hover:bg-[#2a2a2a]"
                  >
                    View Past Games
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-black/10 bg-[#fbfaf7] p-6">
              <p className="font-black">Past games will appear after completed games.</p>
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
      playerLeaderboardLabel: "Latest Session Stats",
      recentMatches: [],
      resultsArchive: [],
      sessionGoalTrends: [],
      teamStandings: fallbackStandings(),
      teamRosters: fallbackRosters(),
      teamOfTheWeek: fallbackTeamOfTheWeek,
      mvpWinner: fallbackMvpWinner,
      latestSession: {
        label: "Latest Session",
        winner: "Waiting on results",
        winnerLogo: null,
        winnerColor: "#1f7a4d",
        mvp: "Voting pending",
      },
      upcomingSession: null,
      tournamentLabel: "Tournament Day",
      tournamentGames: 0,
      completedTournamentGames: 0,
    };
  }

  const [{ data: playerRows }, matchRowsResult, { data: statRows }, teamRowsResult, { data: rosterRows }] = await Promise.all([
    supabase.from("players").select("id,name,position,is_active").order("name"),
    selectPublicMatches(supabase),
    supabase.from("match_players").select("match_id,player_id,team_name,goals,assists,result"),
    selectPublicTeams(supabase),
    supabase
      .from("tournament_team_players")
      .select("id,team_id,player_id,players(name)")
      .order("created_at", { ascending: true }),
  ]);

  const players = (playerRows || []) as PlayerRow[];
  const matches = sortMatchesForDisplay(cleanMatches((matchRowsResult.data || []) as MatchRow[]));
  const matchStats = (statRows || []) as MatchPlayerRow[];
  const rawTeams = (teamRowsResult.data || []) as TeamRow[];
  const teams = dedupeTeams(rawTeams);
  const gameLabels = buildGameLabels(matches);
  const tournamentDate = getCurrentSessionDate(matches, teams);
  const tournamentMatches = tournamentDate
    ? matches.filter((match) => match.match_date === tournamentDate)
    : [];
  const currentTeams = getCurrentSessionTeams(teams, tournamentMatches, tournamentDate);
  const teamRosters = buildTeamRosters(currentTeams, rawTeams, (rosterRows || []) as unknown as RosterRow[]);
  const playerLeaderboardDate = getLatestStatSessionDate(matches, matchStats) || getLatestCompletedSessionDate(matches) || tournamentDate;
  const playerLeaderboardMatches = playerLeaderboardDate
    ? getPlayerLeaderboardMatches(matches, matchStats, playerLeaderboardDate)
    : [];
  const playerLeaderboardMatchIds = new Set(playerLeaderboardMatches.map((match) => match.id));
  const currentMatchStats = matchStats.filter((stat) => playerLeaderboardMatchIds.has(stat.match_id));
  const teamStandings = buildTeamStandings(currentTeams, tournamentMatches);
  const teamOfTheWeek = buildTeamOfTheWeek(teamStandings);
  const mvpWinner = await getClosedMvpWinner(supabase, tournamentDate);
  const teamDisplayNames = buildTeamDisplayNames(teams);
  const latestSession = await buildLatestSessionSummary(supabase, matches, teams, teamDisplayNames);
  const upcomingSession = buildUpcomingSession(matches, teams, rawTeams, (rosterRows || []) as unknown as RosterRow[], teamDisplayNames);
  const playerNamesById = buildPlayerNamesById(players);
  const playerDisplayNamesByKey = buildPlayerDisplayNamesByKey(players);
  const playerTeamNames = buildPlayerTeamNames(rawTeams, (rosterRows || []) as RosterRow[], teamDisplayNames);
  const playerTeamNamesByKey = buildPlayerTeamNamesByKey(playerTeamNames, playerNamesById);
  const currentPlayerTeamNamesByKey = buildCurrentPlayerTeamNamesByKey(currentMatchStats, playerNamesById, teamDisplayNames);
  const totalsByPlayerKey = buildLeaderboardTotalsByPlayerKey(currentMatchStats, playerNamesById);

  const leaderboard = Array.from(playerDisplayNamesByKey.entries())
    .map(([playerKey, playerName]) => ({
      name: playerName,
      team: currentPlayerTeamNamesByKey.get(playerKey) || playerTeamNamesByKey.get(playerKey) || "Unassigned",
      ...(totalsByPlayerKey.get(playerKey) || { games: 0, wins: 0, goals: 0, assists: 0, points: 0 }),
    }))
    .sort((a, b) => b.points - a.points || b.goals - a.goals || a.name.localeCompare(b.name));
  const activeLeaderboard = leaderboard.filter((player) => player.games > 0);

  const recentMatches = tournamentMatches.map((match) => ({
    game: gameLabels.get(match.id) || "Game",
    week: match.week_label,
    date: formatDate(match.match_date),
    teamA: getTeamDisplayName(match.team_a_name, teamDisplayNames),
    teamB: getTeamDisplayName(match.team_b_name, teamDisplayNames),
    score: getMatchScoreLabel(match),
    winner: getMatchWinner(match, teamDisplayNames),
    status: getMatchStatusLabel(match.status),
  }));
  const resultsArchive = buildResultsArchive(matches, matchStats, players, teams, gameLabels, teamDisplayNames, tournamentDate);
  const sessionGoalTrends = buildSessionGoalTrends(resultsArchive);

  const goalsTracked = currentMatchStats.reduce((total, stat) => total + (stat.goals || 0), 0);

  return {
    isConnected: true,
    activePlayers: players.filter((player) => player.is_active !== false).length,
    activeTeams: currentTeams.length,
    gamesPlayed: tournamentMatches.filter((match) => match.status === "completed").length,
    goalsTracked,
    topPlayer: activeLeaderboard[0]?.name || "Coming soon",
    players: activeLeaderboard,
    playerLeaderboardLabel: playerLeaderboardDate ? `${formatMonthDayOrdinal(playerLeaderboardDate)} Stats` : "Latest Session Stats",
    recentMatches,
    resultsArchive,
    sessionGoalTrends,
    teamStandings: teamStandings.length > 0 ? teamStandings : [],
    teamRosters,
    teamOfTheWeek,
    mvpWinner,
    latestSession,
    upcomingSession,
    tournamentLabel: tournamentDate ? formatDate(tournamentDate) : "Tournament Day",
    tournamentGames: tournamentMatches.length,
    completedTournamentGames: tournamentMatches.filter((match) => match.status === "completed").length,
  };
}

async function selectPublicTeams(
  supabase: NonNullable<ReturnType<typeof createSupabaseClient>>,
) {
  const withSessionDetailsAndLogo = await supabase
    .from("tournament_teams")
    .select("id,name,color,logo_url,sort_order,is_active,session_date,session_start_time,session_end_time,session_location")
    .eq("is_active", true)
    .order("session_date", { ascending: false, nullsFirst: false })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (!withSessionDetailsAndLogo.error) {
    return withSessionDetailsAndLogo;
  }

  if (isMissingTeamLogoColumn(withSessionDetailsAndLogo.error)) {
    const withSessionDetails = await supabase
      .from("tournament_teams")
      .select("id,name,color,sort_order,is_active,session_date,session_start_time,session_end_time,session_location")
      .eq("is_active", true)
      .order("session_date", { ascending: false, nullsFirst: false })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (!withSessionDetails.error) {
      return {
        ...withSessionDetails,
        data: withSessionDetails.data?.map((team) => ({
          ...team,
          logo_url: null,
        })),
      };
    }
  }

  const withSessionDate = await supabase
    .from("tournament_teams")
    .select("id,name,color,sort_order,is_active,session_date")
    .eq("is_active", true)
    .order("session_date", { ascending: false, nullsFirst: false })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (!isMissingSessionDateColumn(withSessionDate.error)) {
    return {
      ...withSessionDate,
      data: withSessionDate.data?.map((team) => ({
        ...team,
        logo_url: null,
        session_start_time: null,
        session_end_time: null,
        session_location: null,
      })),
    };
  }

  const withoutSessionDate = await supabase
    .from("tournament_teams")
    .select("id,name,color,sort_order,is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return {
    ...withoutSessionDate,
    data: withoutSessionDate.data?.map((team) => ({
      ...team,
      logo_url: null,
      session_date: null,
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
  if (matchDate) {
    const currentSessionWinner = await getClosedMvpWinnerFromPolls(supabase, matchDate);
    if (currentSessionWinner.isReady) return currentSessionWinner;
  }

  return getClosedMvpWinnerFromPolls(supabase);
}

async function getClosedMvpWinnerFromPolls(
  supabase: NonNullable<ReturnType<typeof createSupabaseClient>>,
  matchDate?: string,
): Promise<MvpWinner> {
  let query = supabase
    .from("mvp_polls")
    .select("id,title,match_date")
    .eq("status", "closed")
    .order("created_at", { ascending: false })
    .limit(5);

  if (matchDate) {
    query = query.eq("match_date", matchDate);
  }

  const { data: polls, error: pollError } = await query;

  if (pollError || !polls?.length) return fallbackMvpWinner;

  for (const poll of polls as MvpPollRow[]) {
    const winner = await getMvpWinnerForPoll(supabase, poll);
    if (winner.isReady) return winner;
  }

  const latestPoll = polls[0] as MvpPollRow;
  return {
    ...fallbackMvpWinner,
    title: latestPoll.title,
    date: latestPoll.match_date ? formatDate(latestPoll.match_date) : "Latest poll",
  };
}

async function getMvpWinnerForPoll(
  supabase: NonNullable<ReturnType<typeof createSupabaseClient>>,
  latestPoll: MvpPollRow,
): Promise<MvpWinner> {
  const [{ data: optionRows, error: optionError }, { data: voteRows, error: voteError }] = await Promise.all([
    supabase.from("mvp_poll_options").select("id,label").eq("poll_id", latestPoll.id),
    supabase.from("mvp_votes").select("option_id").eq("poll_id", latestPoll.id),
  ]);

  if (optionError || voteError) return fallbackMvpWinner;

  const options = (optionRows || []) as MvpPollOptionRow[];
  const votes = (voteRows || []) as MvpVoteRow[];
  const voteCounts = new Map<string, number>();

  for (const vote of votes) {
    voteCounts.set(vote.option_id, (voteCounts.get(vote.option_id) || 0) + 1);
  }

  const rankedOptions = options
    .map((option) => ({
      label: option.label,
      votes: voteCounts.get(option.id) || 0,
    }))
    .sort((a, b) => b.votes - a.votes || a.label.localeCompare(b.label));
  const [winner] = rankedOptions;

  if (!winner || winner.votes === 0) {
    return {
      ...fallbackMvpWinner,
      title: latestPoll.title,
      date: latestPoll.match_date ? formatDate(latestPoll.match_date) : "Latest poll",
    };
  }

  const tiedWinners = rankedOptions.filter((option) => option.votes === winner.votes);

  return {
    name: tiedWinners.map((option) => option.label).join(" / "),
    votes: winner.votes,
    totalVotes: votes.length,
    title: latestPoll.title,
    date: latestPoll.match_date ? formatDate(latestPoll.match_date) : "Latest poll",
    isReady: true,
  };
}

function getCurrentSessionDate(matches: MatchRow[], teams: TeamRow[] = []) {
  const nextTeamSession = getNextTeamSessionDate(teams, matches);

  if (nextTeamSession) return nextTeamSession;

  const datedTeamSession = getLatestTeamSessionDate(teams);

  const currentMatch = [...matches].sort(
    (first, second) =>
      second.match_date.localeCompare(first.match_date) ||
      sortMatchesByGameOrder(first, second),
  )[0];

  if (datedTeamSession && (!currentMatch || datedTeamSession >= currentMatch.match_date)) {
    return datedTeamSession;
  }

  if (currentMatch) return currentMatch.match_date;

  if (datedTeamSession) return datedTeamSession;

  return "";
}

function getNextTeamSessionDate(teams: TeamRow[], matches: MatchRow[] = []) {
  const today = getTodayDateInput();
  const matchesByDate = new Map<string, MatchRow[]>();

  for (const match of matches) {
    const dateMatches = matchesByDate.get(match.match_date) || [];
    dateMatches.push(match);
    matchesByDate.set(match.match_date, dateMatches);
  }

  return teams
    .map((team) => team.session_date)
    .filter((date): date is string => {
      if (!date || date < today) return false;

      const dateMatches = matchesByDate.get(date) || [];
      return dateMatches.length === 0 || dateMatches.some((match) => match.status !== "completed");
    })
    .sort((first, second) => first.localeCompare(second))[0] || "";
}

function getLatestTeamSessionDate(teams: TeamRow[]) {
  return teams
    .map((team) => team.session_date)
    .filter((date): date is string => Boolean(date))
    .sort((first, second) => second.localeCompare(first))[0] || "";
}

async function buildLatestSessionSummary(
  supabase: NonNullable<ReturnType<typeof createSupabaseClient>>,
  matches: MatchRow[],
  teams: TeamRow[],
  teamDisplayNames: Map<string, string>,
) {
  const latestDate = getLatestCompletedSessionDate(matches);

  if (!latestDate) {
    return {
      label: "Latest Session",
      winner: "Waiting on results",
      winnerLogo: null,
      winnerColor: "#1f7a4d",
      mvp: "Voting pending",
    };
  }

  const latestMatches = matches.filter((match) => match.match_date === latestDate && match.status === "completed");
  const latestTeams = getTeamsForMatches(teams, latestMatches);
  const standings = buildTeamStandings(latestTeams, latestMatches);
  const winner = buildTeamOfTheWeek(standings);
  const latestMvp = await getClosedMvpWinner(supabase, latestDate);

  return {
    label: formatDate(latestDate),
    winner: winner.isReady ? winner.name : "Waiting on results",
    winnerLogo: winner.isReady ? winner.logo : null,
    winnerColor: winner.isReady ? winner.color : "#1f7a4d",
    mvp: latestMvp.isReady ? latestMvp.name : "Voting pending",
  };
}

function getLatestCompletedSessionDate(matches: MatchRow[]) {
  return matches
    .filter((match) => match.status === "completed")
    .map((match) => match.match_date)
    .sort((first, second) => second.localeCompare(first))[0] || "";
}

function getLatestStatSessionDate(matches: MatchRow[], matchStats: MatchPlayerRow[]) {
  const statMatchIds = new Set(matchStats.map((stat) => stat.match_id));

  return matches
    .filter((match) => match.status === "completed" && statMatchIds.has(match.id))
    .map((match) => match.match_date)
    .sort((first, second) => second.localeCompare(first))[0] || "";
}

function getPlayerLeaderboardMatches(
  matches: MatchRow[],
  matchStats: MatchPlayerRow[],
  matchDate: string,
) {
  const statMatchIds = new Set(matchStats.map((stat) => stat.match_id));

  return matches.filter(
    (match) => match.match_date === matchDate && match.status === "completed" && statMatchIds.has(match.id),
  );
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

  const sessionDate = upcomingMatches[0]?.match_date;

  if (!sessionDate) {
    const teamSessionDate = getNextTeamSessionDate(teams, matches);

    if (!teamSessionDate) return null;

    const sessionTeams = teams.filter((team) => team.session_date === teamSessionDate);
    if (sessionTeams.length === 0) return null;

    const rosters = buildTeamRosters(sessionTeams, rawTeams, rosterRows);
    const sessionDetails = getTeamSessionDetails(sessionTeams);
    const details = buildCalendarDetails(rosters);

    return {
      date: formatDate(teamSessionDate),
      rawDate: teamSessionDate,
      time: sessionDetails.startTime ? formatTimeRange(sessionDetails.startTime, sessionDetails.endTime) : "Time TBD",
      startTime: sessionDetails.startTime,
      endTime: sessionDetails.endTime,
      location: sessionDetails.location || "Field TBD",
      calendarUrl: buildIcsCalendarUrl(teamSessionDate, sessionDetails.startTime, sessionDetails.endTime, sessionDetails.location || "Field TBD", details),
      googleCalendarUrl: buildGoogleCalendarUrl(teamSessionDate, sessionDetails.startTime, sessionDetails.endTime, sessionDetails.location || "Field TBD", details),
      teams: rosters,
    };
  }

  const sessionMatches = upcomingMatches.filter((match) => match.match_date === sessionDate);
  const sessionTeams = getTeamsForMatches(teams, sessionMatches);
  const rosters = buildTeamRostersWithMatchTeams(sessionTeams, rawTeams, rosterRows, sessionMatches, teamDisplayNames);
  const sessionDetails = getTeamSessionDetails(sessionTeams);
  const location =
    sessionMatches.find((match) => match.location?.trim())?.location?.trim() ||
    sessionDetails.location ||
    "Field TBD";
  const startTime = sessionMatches.find((match) => match.start_time)?.start_time || sessionDetails.startTime;
  const endTime = sessionMatches.find((match) => match.end_time)?.end_time || sessionDetails.endTime;
  const details = buildCalendarDetails(rosters);

  return {
    date: formatDate(sessionDate),
    rawDate: sessionDate,
    time: startTime ? formatTimeRange(startTime, endTime) : "Time TBD",
    startTime,
    endTime,
    location,
    calendarUrl: buildIcsCalendarUrl(sessionDate, startTime, endTime, location, details),
    googleCalendarUrl: buildGoogleCalendarUrl(sessionDate, startTime, endTime, location, details),
    teams: rosters,
  };
}

function getCurrentSessionTeams(
  teams: TeamRow[],
  currentMatches: MatchRow[],
  currentDate = "",
) {
  const datedTeams = currentDate
    ? teams.filter((team) => team.session_date === currentDate)
    : [];

  if (datedTeams.length > 0) return datedTeams;

  if (currentMatches.length > 0) {
    const currentTeamNames = new Set<string>();

    for (const match of currentMatches) {
      currentTeamNames.add(normalizeTeamName(match.team_a_name));
      currentTeamNames.add(normalizeTeamName(match.team_b_name));
    }

    return teams.filter((team) => {
      const teamName = normalizeTeamName(team.name);

      return currentTeamNames.has(teamName);
    });
  }

  return [];
}

function getTeamSessionDetails(teams: TeamRow[]) {
  const startTime = teams.find((team) => team.session_start_time)?.session_start_time || null;
  const endTime = teams.find((team) => team.session_end_time)?.session_end_time || null;
  const location = teams.find((team) => team.session_location?.trim())?.session_location?.trim() || "";

  return {
    startTime,
    endTime,
    location,
  };
}

function buildTeamOfTheWeek(standings: TeamStanding[]) {
  const winner = standings.find((team) => team.played > 0);

  if (!winner) return fallbackTeamOfTheWeek;

  return {
    name: winner.name,
    color: winner.color,
    logo: winner.logo,
    goalsFor: winner.goalsFor,
    points: winner.points,
    record: `${winner.wins}W - ${winner.draws}D - ${winner.losses}L`,
    isReady: true,
  };
}

function buildPlayerTeamNames(
  rawTeams: TeamRow[],
  rosterRows: RosterRow[],
  teamDisplayNames: Map<string, string>,
) {
  const teamNamesById = new Map(
    rawTeams.map((team) => [
      team.id,
      getTeamDisplayName(team.name, teamDisplayNames),
    ]),
  );
  const playerTeams = new Map<string, string>();

  for (const row of rosterRows) {
    const teamName = teamNamesById.get(row.team_id);
    if (!teamName || playerTeams.has(row.player_id)) continue;

    playerTeams.set(row.player_id, teamName);
  }

  return playerTeams;
}

function buildPlayerNamesById(players: PlayerRow[]) {
  return new Map(players.map((player) => [player.id, player.name]));
}

function buildPlayerDisplayNamesByKey(players: PlayerRow[]) {
  const playerNames = new Map<string, string>();

  for (const player of players) {
    const key = normalizePlayerName(player.name);
    if (!key || playerNames.has(key)) continue;

    playerNames.set(key, player.name);
  }

  return playerNames;
}

function buildPlayerTeamNamesByKey(
  playerTeamNames: Map<string, string>,
  playerNamesById: Map<string, string>,
) {
  const playerTeams = new Map<string, string>();

  for (const [playerId, teamName] of playerTeamNames.entries()) {
    const playerName = playerNamesById.get(playerId);
    if (!playerName) continue;

    const playerKey = normalizePlayerName(playerName);
    if (!playerKey || playerTeams.has(playerKey)) continue;

    playerTeams.set(playerKey, teamName);
  }

  return playerTeams;
}

function buildCurrentPlayerTeamNamesByKey(
  currentMatchStats: MatchPlayerRow[],
  playerNamesById: Map<string, string>,
  teamDisplayNames: Map<string, string>,
) {
  const playerTeams = new Map<string, string>();

  for (const stat of currentMatchStats) {
    const playerName = playerNamesById.get(stat.player_id);
    if (!playerName) continue;

    const playerKey = normalizePlayerName(playerName);
    if (!playerKey || playerTeams.has(playerKey)) continue;

    playerTeams.set(playerKey, getTeamDisplayName(stat.team_name, teamDisplayNames));
  }

  return playerTeams;
}

function buildLeaderboardTotalsByPlayerKey(
  currentMatchStats: MatchPlayerRow[],
  playerNamesById: Map<string, string>,
) {
  const totalsByPlayer = new Map<string, Omit<LeaderboardPlayer, "name" | "team">>();

  for (const stat of currentMatchStats) {
    const playerName = playerNamesById.get(stat.player_id);
    if (!playerName) continue;

    const playerKey = normalizePlayerName(playerName);
    if (!playerKey) continue;

    const totals = totalsByPlayer.get(playerKey) || { games: 0, wins: 0, goals: 0, assists: 0, points: 0 };

    totals.games += 1;
    totals.goals += stat.goals || 0;
    totals.assists += stat.assists || 0;
    totals.wins += stat.result === "win" ? 1 : 0;
    totals.points = totals.goals + totals.assists;
    totalsByPlayer.set(playerKey, totals);
  }

  return totalsByPlayer;
}

function buildResultsArchive(
  matches: MatchRow[],
  matchStats: MatchPlayerRow[],
  players: PlayerRow[],
  teams: TeamRow[],
  gameLabels: Map<string, string>,
  teamDisplayNames: Map<string, string>,
  currentDate: string,
) : ArchiveDay[] {
  const archiveByRawDate = new Map<string, MatchRow[]>();
  const playerNames = new Map(players.map((player) => [player.id, player.name]));
  const matchesByRawDate = new Map<string, MatchRow[]>();

  for (const match of matches) {
    const dateMatches = matchesByRawDate.get(match.match_date) || [];
    dateMatches.push(match);
    matchesByRawDate.set(match.match_date, dateMatches);
  }

  for (const [matchDate, dateMatches] of matchesByRawDate.entries()) {
    const isCurrentDate = matchDate === currentDate;
    const completedMatches = dateMatches.filter((match) => match.status === "completed");
    const allDateMatchesCompleted = dateMatches.every((match) => match.status === "completed");

    if (completedMatches.length === 0) continue;
    if (isCurrentDate && !allDateMatchesCompleted) continue;

    archiveByRawDate.set(matchDate, completedMatches);
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

      const dayTeams = getTeamsForMatches(teams, dayMatches);
      const standings = buildTeamStandings(dayTeams, dayMatches);
      const teamOfTheWeek = buildTeamOfTheWeek(standings);
      const sortedPlayers = Array.from(playerTotals.values()).sort(
        (a, b) => b.points - a.points || b.goals - a.goals || a.name.localeCompare(b.name),
      );
      const topScorer = getArchiveTopScorer(sortedPlayers);

      return {
        date: formatDate(rawDate),
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
        topScorer,
      };
    });
}

function buildSessionGoalTrends(resultsArchive: ArchiveDay[]): SessionGoalTrend[] {
  return resultsArchive
    .slice(0, 6)
    .reverse()
    .map((session) => {
      const games = session.matches.length;

      return {
        date: session.date,
        totalGoals: session.totalGoals,
        games,
        goalsPerGame: games > 0 ? session.totalGoals / games : 0,
      };
    });
}

function getArchiveTopScorer(players: ArchivePlayer[]) {
  const topGoalCount = players[0]?.goals || 0;

  if (topGoalCount === 0) return "No goals entered";

  return players
    .filter((player) => player.goals === topGoalCount)
    .map((player) => `${player.name} (${player.goals})`)
    .join(" / ");
}

function getTeamsForMatches(teams: TeamRow[], matches: MatchRow[]) {
  const matchTeamNames = new Set<string>();

  for (const match of matches) {
    matchTeamNames.add(normalizeTeamName(match.team_a_name));
    matchTeamNames.add(normalizeTeamName(match.team_b_name));
  }

  return teams.filter((team) => matchTeamNames.has(normalizeTeamName(team.name)));
}

function formatPlayerCount(count: number) {
  return `${count} ${count === 1 ? "player" : "players"}`;
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

function dedupeTeams(teams: TeamRow[]) {
  const teamsByName = new Map<string, TeamRow>();

  for (const team of teams) {
    const key = getTeamSessionKey(team);
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

function getTeamSessionKey(team: TeamRow) {
  return `${normalizeTeamName(team.name)}|${team.session_date || "undated"}`;
}

function isMissingSessionDateColumn(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const { code, message } = error as { code?: string; message?: string };

  return Boolean(message?.includes("session_date")) || (code === "PGRST204" && Boolean(message?.includes("session_date")));
}

function isMissingTeamLogoColumn(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const { code, message } = error as { code?: string; message?: string };

  return Boolean(message?.includes("logo_url")) || (code === "PGRST204" && Boolean(message?.includes("logo_url")));
}

async function selectPublicMatches(
  supabase: NonNullable<ReturnType<typeof createSupabaseClient>>,
) {
  const withStartTime = await supabase
    .from("matches")
    .select("id,match_date,start_time,end_time,week_label,location,team_a_name,team_b_name,team_a_score,team_b_score,status,created_at")
    .order("match_date", { ascending: false })
    .limit(500);

  if (!isMissingStartTimeColumn(withStartTime.error)) {
    return withStartTime;
  }

  const withoutStartTime = await supabase
    .from("matches")
    .select("id,match_date,week_label,location,team_a_name,team_b_name,team_a_score,team_b_score,status,created_at")
    .order("match_date", { ascending: false })
    .limit(500);

  return {
    ...withoutStartTime,
    data: withoutStartTime.data?.map((match) => ({ ...match, start_time: null, end_time: null })),
  };
}

function isMissingStartTimeColumn(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const { code, message } = error as { code?: string; message?: string };

  return code === "42703" || code === "PGRST204" || Boolean(message?.includes("start_time")) || Boolean(message?.includes("end_time"));
}

function cleanMatches(matches: MatchRow[]) {
  return matches.map((match) => ({
    ...match,
    team_a_name: cleanTeamName(match.team_a_name),
    team_b_name: cleanTeamName(match.team_b_name),
    week_label: cleanTeamName(match.week_label),
    location: match.location ? cleanTeamName(match.location) : null,
  }));
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
  const rawTeamKeys = new Map(rawTeams.map((team) => [team.id, getTeamRosterKey(team)]));
  const rostersByTeam = new Map<string, TeamRoster>();

  for (const team of teams) {
    rostersByTeam.set(getTeamRosterKey(team), {
      name: cleanTeamName(team.name),
      color: team.color || "#1f7a4d",
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

function getTeamRosterKey(team: Pick<TeamRow, "name" | "session_date">) {
  return `${normalizeTeamName(team.name)}|${team.session_date || "undated"}`;
}

function buildTeamRostersWithMatchTeams(
  teams: TeamRow[],
  rawTeams: TeamRow[],
  rosterRows: RosterRow[],
  matches: MatchRow[],
  teamDisplayNames: Map<string, string>,
) {
  const rosters = buildTeamRosters(teams, rawTeams, rosterRows);
  const rostersByKey = new Map(rosters.map((roster) => [normalizeTeamName(roster.name), roster]));

  for (const match of matches) {
    addMatchTeamRoster(match.team_a_name, rostersByKey, teamDisplayNames);
    addMatchTeamRoster(match.team_b_name, rostersByKey, teamDisplayNames);
  }

  return Array.from(rostersByKey.values());
}

function addMatchTeamRoster(
  teamName: string,
  rostersByKey: Map<string, TeamRoster>,
  teamDisplayNames: Map<string, string>,
) {
  const key = normalizeTeamName(teamName);

  if (rostersByKey.has(key)) return;

  rostersByKey.set(key, {
    name: getTeamDisplayName(teamName, teamDisplayNames),
    color: "#1f7a4d",
    logo: null,
    players: [],
  });
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
  }));
}

function fallbackRosters() {
  return fallbackStandings().map((team) => ({
    name: team.name,
    color: team.color,
    logo: team.logo,
    players: [],
  }));
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

function buildCalendarDetails(teams: TeamRoster[]) {
  const rosterDetails = teams
    .map((team) => {
      const players = team.players.length > 0 ? team.players.map((player) => `- ${player}`).join("\n") : "- Roster coming soon";

      return `${team.name}\n${players}`;
    })
    .join("\n\n");

  return [
    "JC Footy pickup soccer session.",
    "Teams are set before kickoff. Game order can be figured out at the field.",
    rosterDetails ? `Teams:\n${rosterDetails}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildGoogleCalendarUrl(rawDate: string, startTime: string | null, endTime: string | null, location: string, details: string) {
  const dates = startTime
    ? `${formatCalendarDateTime(rawDate, startTime)}/${formatCalendarDateTime(rawDate, endTime || startTime, endTime ? 0 : 2)}`
    : `${formatCalendarDate(rawDate)}/${formatCalendarDate(addDaysToDateInput(rawDate, 1))}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "JC Footy Pickup Soccer",
    dates,
    details,
    location,
  });

  if (startTime) params.set("ctz", "America/Chicago");

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcsCalendarUrl(rawDate: string, startTime: string | null, endTime: string | null, location: string, details: string) {
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const startLine = startTime
    ? `DTSTART;TZID=America/Chicago:${formatCalendarDateTime(rawDate, startTime)}`
    : `DTSTART;VALUE=DATE:${formatCalendarDate(rawDate)}`;
  const endLine = startTime
    ? `DTEND;TZID=America/Chicago:${formatCalendarDateTime(rawDate, endTime || startTime, endTime ? 0 : 2)}`
    : `DTEND;VALUE=DATE:${formatCalendarDate(addDaysToDateInput(rawDate, 1))}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JC Footy//Pickup Soccer//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:jc-footy-${rawDate}@jcfooty.com`,
    `DTSTAMP:${timestamp}`,
    startLine,
    endLine,
    "SUMMARY:JC Footy Pickup Soccer",
    `LOCATION:${escapeCalendarText(location)}`,
    `DESCRIPTION:${escapeCalendarText(details)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

function addDaysToDateInput(rawDate: string, days: number) {
  const date = new Date(`${rawDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function formatCalendarDate(rawDate: string) {
  return rawDate.replaceAll("-", "");
}

function formatCalendarDateTime(rawDate: string, startTime: string, addHours = 0) {
  const [year, month, day] = rawDate.split("-");
  const [hour, minute] = startTime.split(":").map(Number);
  const date = new Date(Number(year), Number(month) - 1, Number(day), hour + addHours, minute || 0, 0);
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    pad(date.getMinutes()),
    "00",
  ].join("");
}

function escapeCalendarText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
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

function formatTimeLabel(value: string) {
  if (!value) return "Time TBD";

  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date(2000, 0, 1, hours, minutes || 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatTimeRange(startTime: string, endTime?: string | null) {
  if (!endTime) return formatTimeLabel(startTime);

  return `${formatTimeLabel(startTime)} - ${formatTimeLabel(endTime)}`;
}

function formatDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatMonthDayOrdinal(value: string) {
  const date = new Date(`${value}T12:00:00`);
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
  const day = date.getDate();

  return `${month} ${day}${getOrdinalSuffix(day)}`;
}

function getOrdinalSuffix(value: number) {
  const remainder = value % 100;

  if (remainder >= 11 && remainder <= 13) return "th";

  switch (value % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function LeagueNumber({ value, strong = false }: { value: number; strong?: boolean }) {
  return (
    <td className={`py-3 text-center ${strong ? "font-black" : "font-bold text-black/70"}`}>
      {value > 0 && strong ? `+${value}` : value}
    </td>
  );
}

function UpcomingTeams({ teams }: { teams: TeamRoster[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {teams.map((team) => (
        <article key={team.name} className="rounded-lg border border-black/10 bg-[#fbfaf7] p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <TeamLogo logo={team.logo} color={team.color} name={team.name} size="md" />
              <div className="min-w-0">
                <h3 className="break-words font-black leading-tight">{team.name}</h3>
                <p className="mt-1 text-xs font-bold text-black/45">{formatPlayerCount(team.players.length)}</p>
              </div>
            </div>
            <span className="shrink-0 rounded-lg bg-[#edf4f0] px-2 py-1 text-xs font-black text-[#17613d]">
              Ready
            </span>
          </div>
          {team.players.length > 0 ? (
            <div className="grid gap-2">
              {team.players.map((player) => (
                <a
                  key={`${team.name}-${player}`}
                  href={`/players/${slugify(player)}`}
                  className="rounded-lg bg-white px-3 py-2 text-sm font-bold hover:underline"
                >
                  {player}
                </a>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-white px-3 py-3 text-sm font-semibold text-black/50">
              Roster coming soon.
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

function SessionGoalChart({ trends }: { trends: SessionGoalTrend[] }) {
  const maxGoals = Math.max(...trends.map((trend) => trend.totalGoals), 1);
  const latestTrend = trends[trends.length - 1];

  return (
    <article className="rounded-lg border border-black/10 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-black/45">Session Data</p>
          <h2 className="mt-0.5 text-lg font-black">Goals by Session</h2>
        </div>
        <BarChart3 className="mt-1 text-[#1f7a4d]" size={20} />
      </div>

      {trends.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-y border-black/10 py-2 text-xs font-bold text-black/55">
            <span><strong className="text-black">{latestTrend?.totalGoals || 0}</strong> latest goals</span>
            <span><strong className="text-black">{latestTrend?.games || 0}</strong> games</span>
            <span><strong className="text-black">{formatDecimal(latestTrend?.goalsPerGame || 0)}</strong> goals/game</span>
          </div>

          <div className="mt-3 grid gap-2">
            {trends.map((trend) => {
              const barWidth = Math.max((trend.totalGoals / maxGoals) * 100, trend.totalGoals > 0 ? 8 : 2);

              return (
                <div key={trend.date} className="grid grid-cols-[72px_minmax(0,1fr)_40px] items-center gap-2">
                  <p className="truncate text-[11px] font-bold text-black/45">{trend.date.replace(",", "")}</p>
                  <div className="h-2 overflow-hidden rounded-full bg-[#edf4f0]">
                    <div
                      className="h-full rounded-full bg-[#1f7a4d] transition-all"
                      style={{ width: `${barWidth}%` }}
                      title={`${trend.date}: ${trend.totalGoals} goals`}
                    />
                  </div>
                  <p className="text-right text-xs font-black text-black/70">{trend.totalGoals}</p>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="rounded-lg bg-[#fbfaf7] px-3 py-4 text-sm font-semibold leading-6 text-black/55">
          Goal charts will appear after completed sessions are saved.
        </p>
      )}
    </article>
  );
}

function TeamLogo({
  logo,
  color,
  name,
  size = "sm",
}: {
  logo?: string | null;
  color?: string;
  name: string;
  size?: "sm" | "md";
}) {
  const logoValue = logo?.trim();
  const sizeClass = size === "md" ? "h-7 w-7 text-sm" : "h-5 w-5 text-xs";
  const className = `${sizeClass} inline-flex shrink-0 items-center justify-center rounded-full ring-2 ring-black/5`;

  if (!logoValue) {
    return <span className={className} style={{ backgroundColor: color || "#1f7a4d" }} aria-hidden="true" />;
  }

  if (isLogoImage(logoValue)) {
    return (
      <img
        src={logoValue}
        alt={`${name} logo`}
        className={`${className} bg-white object-cover`}
      />
    );
  }

  return (
    <span className={`${className} bg-white font-black`}>
      {logoValue}
    </span>
  );
}

function CompactResult({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#fbfaf7] px-3 py-4">
      <p className="text-xs font-black uppercase text-black/45">{label}</p>
      <p className="mt-1 break-words text-lg font-black">{value}</p>
    </div>
  );
}

function TeamCompactResult({
  label,
  value,
  logo,
  color,
}: {
  label: string;
  value: string;
  logo?: string | null;
  color?: string | null;
}) {
  return (
    <div className="rounded-lg bg-[#fbfaf7] px-3 py-4">
      <p className="text-xs font-black uppercase text-black/45">{label}</p>
      <div className="mt-2 flex min-w-0 items-center gap-2">
        <TeamLogo logo={logo} color={color || "#1f7a4d"} name={value} size="md" />
        <p className="min-w-0 break-words text-lg font-black">{value}</p>
      </div>
    </div>
  );
}

function TinyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#fbfaf7] px-2 py-2">
      <p className="text-[10px] font-black uppercase text-black/40">{label}</p>
      <p className="mt-0.5 text-sm font-black">{value}</p>
    </div>
  );
}

function TopPlayerCard({ player, rank }: { player: LeaderboardPlayer; rank: number }) {
  return (
    <a
      href={`/players/${slugify(player.name)}`}
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-[#fbfaf7] px-3 py-3 transition hover:bg-[#f1ece3]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4f0] text-sm font-black text-[#17613d]">
        {rank}
      </span>
      <span className="min-w-0 break-words font-black">{player.name}</span>
      <span className="rounded-lg bg-[#171717] px-3 py-2 text-sm font-black text-white">
        {player.points} G+A
      </span>
    </a>
  );
}

function TeamForm({ form }: { form: TeamStanding["form"] }) {
  if (form.length === 0) {
    return <span className="text-xs font-black uppercase text-black/35">-</span>;
  }

  return (
    <div className="flex items-center gap-1">
      {form.map((result, index) => (
        <span
          key={`${result}-${index}`}
          className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-black ${
            result === "W"
              ? "bg-[#dff0e7] text-[#17613d]"
              : result === "D"
                ? "bg-[#efe9dd] text-black/55"
                : "bg-red-50 text-red-700"
          }`}
        >
          {result}
        </span>
      ))}
    </div>
  );
}

function isLogoImage(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith("/");
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

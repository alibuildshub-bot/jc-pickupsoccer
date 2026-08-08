import {
  CalendarDays,
  Clock,
  MapPin,
  Trophy,
  Users,
} from "lucide-react";
import LogoMark from "@/components/LogoMark";
import PlayerLeaderboard from "@/components/PlayerLeaderboard";
import SiteVisitTracker from "@/components/SiteVisitTracker";
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
  players: string[];
};

type UpcomingSession = {
  date: string;
  rawDate: string;
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

const fallbackTeamOfTheWeek = {
  name: "Coming soon",
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
    mvp: "Voting pending",
  };
  const topPlayers = data.players.slice(0, 3);

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
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 inline-flex w-fit rounded-lg bg-[#1f7a4d]/20 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-[#64d69a] sm:text-sm">
              JC Footy
            </p>
            <h1 className="text-[2.35rem] font-black leading-none tracking-normal sm:text-6xl">
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

        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
          <article className="rounded-lg border border-black/10 bg-[#171717] p-5 text-white shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-wide text-[#64d69a]">Next Pickup</p>
                <h2 className="mt-2 text-4xl font-black leading-none sm:text-5xl">
                  {data.upcomingSession ? data.upcomingSession.date : "Not scheduled yet"}
                </h2>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-white/60">
                  {data.upcomingSession
                    ? "Add it to your calendar and check back after games for updated stats."
                    : "Create a scheduled game in the admin portal and the calendar option will appear here."}
                </p>
              </div>
              <CalendarDays className="shrink-0 text-[#64d69a]" size={38} />
            </div>
            {data.upcomingSession ? (
              <>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-white/75">
                    <MapPin size={16} />
                    {data.upcomingSession.location}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-white/75">
                    <Users size={16} />
                    {data.upcomingSession.teams.length} teams
                  </span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
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
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 text-center text-sm font-black text-white transition hover:bg-white/15"
                  >
                    <Clock size={17} />
                    Google
                  </a>
                </div>

                {data.upcomingSession.teams.length > 0 ? (
                  <div className="mt-4 grid gap-2 md:grid-cols-3">
                    {data.upcomingSession.teams.map((team) => (
                      <div key={`next-${team.name}`} className="rounded-lg border border-white/10 bg-white/10 p-3">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: team.color }} />
                          <p className="truncate text-sm font-black">{team.name}</p>
                        </div>
                        <p className="text-xs font-bold text-white/45">{formatPlayerCount(team.players.length)}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}

            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-black uppercase tracking-wide text-white/45">Latest Results</p>
                <a href="#matches" className="text-sm font-black text-[#64d69a] hover:text-white">View all</a>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {data.recentMatches.slice(0, 2).map((match) => (
                  <article key={`latest-${match.week}-${match.date}-${match.game}`} className="rounded-lg bg-black/25 p-3">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase text-[#64d69a]">{match.game}</p>
                        <p className="mt-1 text-xs font-bold text-white/45">{match.date}</p>
                      </div>
                      <p className="rounded-lg bg-[#f4f7f1] px-3 py-2 text-sm font-black text-[#071009]">{match.score}</p>
                    </div>
                    <p className="break-words text-sm font-black">{match.teamA} vs {match.teamB}</p>
                  </article>
                ))}
              </div>
            </div>
          </article>

          <div className="grid gap-4">
            <article className="rounded-lg border border-black/10 bg-white p-4 shadow-sm sm:p-5">
              <div>
                <p className="text-sm font-bold text-black/50">Latest Session</p>
                <h2 className="mt-1 text-2xl font-black">{latestSession.label}</h2>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <CompactResult label="Winner" value={latestSession.winner} />
                <CompactResult label="MVP" value={latestSession.mvp} />
              </div>
            </article>

            <article className="rounded-lg border border-black/10 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-black/50">Top Players</p>
                  <h2 className="mt-1 text-2xl font-black">Top 3</h2>
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

      <section id="progress" className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm sm:p-5">
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
            {data.teamStandings.length > 0 ? data.teamStandings.map((team, index) => (
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
                        <span className="h-4 w-4 shrink-0 rounded-full ring-2 ring-black/5" style={{ backgroundColor: team.color }} />
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
        </div>
      </section>

      <section id="teams" className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-black/50">Rosters</p>
            <h2 className="text-2xl font-black">Teams & Players</h2>
          </div>
          <Users className="hidden text-[#1f7a4d] sm:block" size={26} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.teamRosters.length > 0 ? data.teamRosters.map((team) => (
            <article key={team.name} className="rounded-lg border border-black/10 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-black/10 pb-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: team.color }} />
                  <h3 className="break-words text-lg font-black leading-tight">{team.name}</h3>
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

      <section className="mx-auto grid max-w-7xl items-start gap-5 px-4 pb-8 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div id="matches" className="rounded-lg border border-black/10 bg-white p-4 shadow-sm sm:p-5">
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
                  <p className="shrink-0 rounded-lg bg-[#171717] px-3 py-2 text-sm font-black text-white sm:text-lg">{match.score}</p>
                </div>
                <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-sm font-bold">
                  <span className="min-w-0 break-words">{match.teamA}</span>
                  <span className="text-black/35">vs</span>
                  <span className="min-w-0 break-words text-right">{match.teamB}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-black/55">Winner: {match.winner}</p>
              </article>
            ))}
          </div>
        </div>

        <div id="leaderboard" className="rounded-lg border border-black/10 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-black/50">{data.playerLeaderboardLabel}</p>
              <h2 className="text-2xl font-black">Player Leaderboard</h2>
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

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-black/50">Results</p>
              <h2 className="text-2xl font-black">Past Games</h2>
            </div>
            <CalendarDays className="text-[#1f7a4d]" size={26} />
          </div>
          {data.resultsArchive.length > 0 ? (
            <div className="grid gap-5">
              {data.resultsArchive.map((day) => (
                <details key={day.date} className="group rounded-lg border border-black/10 bg-[#fbfaf7] p-4">
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
                    <MiniStat label="Team of the Week" value={day.teamOfTheWeek} icon={Trophy} />
                    <MiniStat label="Total Goals" value={String(day.totalGoals)} />
                    <MiniStat label="Top Scorer" value={day.topScorer} />
                  </div>
                  <div className="mt-4 border-t border-black/10 pt-4">
                    <div>
                      <p className="mb-2 text-xs font-black uppercase text-black/45">Games</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {day.matches.map((match) => (
                          <article key={`${day.date}-${match.game}-${match.teamA}-${match.teamB}`} className="rounded-lg bg-white p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-black uppercase text-[#1f7a4d]">{match.game}</p>
                                <p className="mt-1 text-sm font-black">
                                  {match.teamA} vs {match.teamB}
                                </p>
                              </div>
                              <p className="shrink-0 rounded-lg bg-[#171717] px-3 py-2 text-sm font-black text-white">
                                {match.score}
                              </p>
                            </div>
                            <p className="mt-2 text-xs font-bold text-black/50">Winner: {match.winner}</p>
                          </article>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-lg bg-white p-3 sm:p-4">
                        <p className="mb-2 text-xs font-black uppercase text-black/45">Team table</p>
                        <div className="space-y-2">
                          {day.standings.map((team, index) => (
                            <div key={`${day.date}-${team.name}`} className="rounded-lg bg-[#fbfaf7] p-3">
                              <div className="flex items-center gap-3">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#edf4f0] text-xs font-black text-[#17613d]">
                                  {index + 1}
                                </span>
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
                              <div key={`${day.date}-${player.name}-${player.team}`} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg bg-[#fbfaf7] p-3 text-sm sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#edf4f0] text-xs font-black text-[#17613d]">
                                  {index + 1}
                                </span>
                                <div className="min-w-0">
                                  <a href={`/players/${slugify(player.name)}`} className="break-words font-black hover:underline">
                                    {player.name}
                                  </a>
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
      recentMatches: fallbackMatches,
      resultsArchive: [],
      teamStandings: fallbackStandings(),
      teamRosters: fallbackRosters(),
      teamOfTheWeek: fallbackTeamOfTheWeek,
      mvpWinner: fallbackMvpWinner,
      latestSession: {
        label: "Latest Session",
        winner: "Waiting on results",
        mvp: "Voting pending",
      },
      upcomingSession: null,
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
  const gameLabels = buildGameLabels(matches);
  const tournamentDate = getCurrentSessionDate(matches);
  const tournamentMatches = tournamentDate
    ? matches.filter((match) => match.match_date === tournamentDate)
    : [];
  const archivedTeamNames = buildArchivedTeamNames(matches, tournamentDate);
  const currentTeams = getCurrentSessionTeams(teams, tournamentMatches, archivedTeamNames);
  const teamRosters = buildTeamRosters(currentTeams, rawTeams, (rosterRows || []) as unknown as RosterRow[]);
  const playerLeaderboardDate = getLatestCompletedSessionDate(matches) || tournamentDate;
  const playerLeaderboardMatches = playerLeaderboardDate
    ? matches.filter((match) => match.match_date === playerLeaderboardDate && match.status === "completed")
    : [];
  const playerLeaderboardMatchIds = new Set(playerLeaderboardMatches.map((match) => match.id));
  const currentMatchStats = matchStats.filter((stat) => playerLeaderboardMatchIds.has(stat.match_id));
  const teamStandings = buildTeamStandings(currentTeams, tournamentMatches);
  const teamOfTheWeek = buildTeamOfTheWeek(teamStandings);
  const mvpWinner = await getClosedMvpWinner(supabase, tournamentDate);
  const teamDisplayNames = buildTeamDisplayNames(teams);
  const latestSession = await buildLatestSessionSummary(supabase, matches, teams, teamDisplayNames);
  const upcomingSession = buildUpcomingSession(matches, teams, rawTeams, (rosterRows || []) as unknown as RosterRow[], teamDisplayNames);
  const playerTeamNames = buildPlayerTeamNames(rawTeams, (rosterRows || []) as RosterRow[], teamDisplayNames);
  const currentPlayerTeamNames = buildCurrentPlayerTeamNames(currentMatchStats, teamDisplayNames);

  const totalsByPlayer = new Map<string, Omit<LeaderboardPlayer, "name" | "team">>();

  for (const player of players) {
    totalsByPlayer.set(player.id, { games: 0, wins: 0, goals: 0, assists: 0, points: 0 });
  }

  for (const stat of currentMatchStats) {
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
      team: currentPlayerTeamNames.get(player.id) || playerTeamNames.get(player.id) || "Unassigned",
      ...(totalsByPlayer.get(player.id) || { games: 0, wins: 0, goals: 0, assists: 0, points: 0 }),
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

  const goalsTracked = currentMatchStats.reduce((total, stat) => total + (stat.goals || 0), 0);

  return {
    isConnected: true,
    activePlayers: players.length,
    activeTeams: currentTeams.length,
    gamesPlayed: tournamentMatches.filter((match) => match.status === "completed").length,
    goalsTracked,
    topPlayer: activeLeaderboard[0]?.name || "Coming soon",
    players: activeLeaderboard,
    playerLeaderboardLabel: playerLeaderboardDate ? `${formatMonthDayOrdinal(playerLeaderboardDate)} Stats` : "Latest Session Stats",
    recentMatches: recentMatches.length > 0 ? recentMatches : fallbackMatches,
    resultsArchive,
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

function getCurrentSessionDate(matches: MatchRow[]) {
  const currentMatch = [...matches].sort(
    (first, second) =>
      second.match_date.localeCompare(first.match_date) ||
      sortMatchesByGameOrder(first, second),
  )[0];

  if (currentMatch) return currentMatch.match_date;
  return "";
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
    mvp: latestMvp.isReady ? latestMvp.name : "Voting pending",
  };
}

function getLatestCompletedSessionDate(matches: MatchRow[]) {
  return matches
    .filter((match) => match.status === "completed")
    .map((match) => match.match_date)
    .sort((first, second) => second.localeCompare(first))[0] || "";
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

  if (!sessionDate) return null;

  const sessionMatches = upcomingMatches.filter((match) => match.match_date === sessionDate);
  const sessionTeams = getTeamsForMatches(teams, sessionMatches);
  const rosters = buildTeamRosters(sessionTeams, rawTeams, rosterRows);
  const location = sessionMatches.find((match) => match.location?.trim())?.location?.trim() || "Field TBD";
  const details = buildCalendarDetails(rosters);

  return {
    date: formatDate(sessionDate),
    rawDate: sessionDate,
    location,
    calendarUrl: buildIcsCalendarUrl(sessionDate, location, details),
    googleCalendarUrl: buildGoogleCalendarUrl(sessionDate, location, details),
    teams: rosters,
  };
}

function getCurrentSessionTeams(
  teams: TeamRow[],
  currentMatches: MatchRow[],
  archivedTeamNames: Set<string>,
) {
  if (currentMatches.length > 0) {
    const currentTeamNames = new Set<string>();

    for (const match of currentMatches) {
      currentTeamNames.add(normalizeTeamName(match.team_a_name));
      currentTeamNames.add(normalizeTeamName(match.team_b_name));
    }

    return teams.filter((team) => {
      const teamName = normalizeTeamName(team.name);

      return currentTeamNames.has(teamName) || !archivedTeamNames.has(teamName);
    });
  }

  return teams.filter((team) => !archivedTeamNames.has(normalizeTeamName(team.name)));
}

function buildArchivedTeamNames(matches: MatchRow[], currentDate: string) {
  const names = new Set<string>();

  for (const match of matches) {
    if (match.status !== "completed" || match.match_date === currentDate) continue;

    names.add(normalizeTeamName(match.team_a_name));
    names.add(normalizeTeamName(match.team_b_name));
  }

  return names;
}

function buildTeamOfTheWeek(standings: TeamStanding[]) {
  const winner = standings.find((team) => team.played > 0);

  if (!winner) return fallbackTeamOfTheWeek;

  return {
    name: winner.name,
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

function buildCurrentPlayerTeamNames(
  currentMatchStats: MatchPlayerRow[],
  teamDisplayNames: Map<string, string>,
) {
  const playerTeams = new Map<string, string>();

  for (const stat of currentMatchStats) {
    if (playerTeams.has(stat.player_id)) continue;

    playerTeams.set(stat.player_id, getTeamDisplayName(stat.team_name, teamDisplayNames));
  }

  return playerTeams;
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

        const existing = playerTotals.get(stat.player_id) || {
          name: playerName,
          team: getTeamDisplayName(stat.team_name, teamDisplayNames),
          goals: 0,
          assists: 0,
          points: 0,
        };

        existing.goals += stat.goals || 0;
        existing.assists += stat.assists || 0;
        existing.points = existing.goals + existing.assists;
        playerTotals.set(stat.player_id, existing);
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
    form: [],
  }));
}

function fallbackRosters() {
  return fallbackStandings().map((team) => ({
    name: team.name,
    color: team.color,
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

function buildGoogleCalendarUrl(rawDate: string, location: string, details: string) {
  const start = formatCalendarDate(rawDate);
  const end = formatCalendarDate(addDaysToDateInput(rawDate, 1));
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "JC Footy Pickup Soccer",
    dates: `${start}/${end}`,
    details,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcsCalendarUrl(rawDate: string, location: string, details: string) {
  const start = formatCalendarDate(rawDate);
  const end = formatCalendarDate(addDaysToDateInput(rawDate, 1));
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JC Footy//Pickup Soccer//EN",
    "BEGIN:VEVENT",
    `UID:jc-footy-${rawDate}@jcfooty.com`,
    `DTSTAMP:${timestamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
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

function CompactResult({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#fbfaf7] px-3 py-4">
      <p className="text-xs font-black uppercase text-black/45">{label}</p>
      <p className="mt-1 break-words text-lg font-black">{value}</p>
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

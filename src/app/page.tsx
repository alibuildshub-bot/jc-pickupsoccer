import {
  Activity,
  CalendarDays,
  ClipboardList,
  Medal,
  Plus,
  Shield,
  Target,
  Trophy,
  Users,
} from "lucide-react";
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
};

type MatchPlayerRow = {
  player_id: string;
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

const fallbackPlayers: LeaderboardPlayer[] = [
  { name: "Add players in Supabase", games: 0, wins: 0, goals: 0, assists: 0, points: 0 },
];

const fallbackMatches = [
  {
    week: "Week 1",
    date: "Add a match in Supabase",
    teamA: "Team A",
    teamB: "Team B",
    score: "0 - 0",
    mvp: "Coming soon",
  },
];

export const revalidate = 0;

export default async function Home() {
  const data = await getDashboardData();
  const latestMatch = data.recentMatches[0] || fallbackMatches[0];

  const statCards = [
    { label: "Active Players", value: String(data.activePlayers), icon: Users },
    { label: "Games Played", value: String(data.gamesPlayed), icon: CalendarDays },
    { label: "Goals Tracked", value: String(data.goalsTracked), icon: Target },
    { label: "Top Player", value: data.topPlayer, icon: Trophy },
  ];

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-[#171717]">
      <nav className="border-b border-black/10 bg-[#f7f3ec]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#171717] text-white">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-lg font-black leading-none">JC Pickup Soccer</p>
              <p className="text-xs font-medium text-black/55">Weekly rec league stats</p>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-sm font-semibold text-black/65 md:flex">
            <a href="#matches" className="hover:text-black">Matches</a>
            <a href="#leaderboard" className="hover:text-black">Leaderboard</a>
            <a href="#admin" className="hover:text-black">Admin</a>
          </div>
          <a
            href="/admin"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1f7a4d] px-4 text-sm font-bold text-white transition hover:bg-[#17613d]"
          >
            <Plus size={16} />
            Add Match
          </a>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-12">
        <div className="flex flex-col justify-center">
          <p className="mb-4 inline-flex w-fit rounded-lg bg-[#dff0e7] px-3 py-2 text-sm font-extrabold text-[#17613d]">
            Rotating teams. Permanent bragging rights.
          </p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl">
            Track every weekly pickup game, player, goal, assist, and win.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-black/65">
            A simple home base for JC Pickup Soccer: weekly results, temporary teams,
            player profiles, and leaderboards that update as the season goes.
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
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-7 text-center">
            <div>
              <p className="text-3xl font-black">{latestMatch.teamA}</p>
              <p className="mt-2 text-sm font-semibold text-black/55">Team A</p>
            </div>
            <div className="rounded-lg bg-[#171717] px-4 py-3 text-3xl font-black text-white">
              {latestMatch.score}
            </div>
            <div>
              <p className="text-3xl font-black">{latestMatch.teamB}</p>
              <p className="mt-2 text-sm font-semibold text-black/55">Team B</p>
            </div>
          </div>
          <div className="grid gap-3 border-t border-black/10 pt-4 sm:grid-cols-3">
            <MiniStat label="MVP" value={latestMatch.mvp} />
            <MiniStat label="Date" value={latestMatch.date} />
            <MiniStat label="Source" value={data.isConnected ? "Supabase" : "Setup needed"} />
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

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
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
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-black/50">{match.date}</p>
                    <h3 className="mt-1 text-lg font-black">{match.week}</h3>
                  </div>
                  <p className="rounded-lg bg-[#171717] px-3 py-2 text-lg font-black text-white">{match.score}</p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-sm font-bold">
                  <span>{match.teamA}</span>
                  <span className="text-black/35">vs</span>
                  <span>{match.teamB}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-black/55">MVP: {match.mvp}</p>
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-black/10 text-xs font-black uppercase text-black/45">
                  <th className="py-3">Player</th>
                  <th className="py-3 text-center">GP</th>
                  <th className="py-3 text-center">W</th>
                  <th className="py-3 text-center">G</th>
                  <th className="py-3 text-center">A</th>
                  <th className="py-3 text-center">PTS</th>
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
                    <td className="py-4 text-center font-bold">{player.games}</td>
                    <td className="py-4 text-center font-bold">{player.wins}</td>
                    <td className="py-4 text-center font-bold">{player.goals}</td>
                    <td className="py-4 text-center font-bold">{player.assists}</td>
                    <td className="py-4 text-center font-black">{player.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="admin" className="border-t border-black/10 bg-[#171717] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-bold text-white/50">Admin Preview</p>
            <h2 className="mt-2 text-3xl font-black">The first real feature to build</h2>
            <p className="mt-4 max-w-xl leading-7 text-white/65">
              Start with one simple flow: create a match, pick both teams, enter
              the final score, add goals and assists, then let the leaderboard update.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminStep icon={Users} title="Add Players" text="Create the permanent player list." />
            <AdminStep icon={ClipboardList} title="Create Match" text="Add date, teams, and final score." />
            <AdminStep icon={Target} title="Enter Stats" text="Track goals, assists, wins, and losses." />
            <AdminStep icon={Activity} title="Update Tables" text="Show season leaders automatically." />
          </div>
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
      gamesPlayed: 0,
      goalsTracked: 0,
      topPlayer: "Setup",
      players: fallbackPlayers,
      recentMatches: fallbackMatches,
    };
  }

  const [{ data: playerRows }, { data: matchRows }, { data: statRows }] = await Promise.all([
    supabase.from("players").select("id,name,position").eq("is_active", true).order("name"),
    supabase
      .from("matches")
      .select("id,match_date,week_label,location,team_a_name,team_b_name,team_a_score,team_b_score")
      .order("match_date", { ascending: false })
      .limit(5),
    supabase.from("match_players").select("player_id,goals,assists,result"),
  ]);

  const players = (playerRows || []) as PlayerRow[];
  const matches = (matchRows || []) as MatchRow[];
  const matchStats = (statRows || []) as MatchPlayerRow[];

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

  const recentMatches = matches.map((match) => ({
    week: match.week_label,
    date: formatDate(match.match_date),
    teamA: match.team_a_name,
    teamB: match.team_b_name,
    score: `${match.team_a_score} - ${match.team_b_score}`,
    mvp: leaderboard[0]?.name || "Coming soon",
  }));

  const goalsTracked = matchStats.reduce((total, stat) => total + (stat.goals || 0), 0);

  return {
    isConnected: true,
    activePlayers: players.length,
    gamesPlayed: matches.length,
    goalsTracked,
    topPlayer: leaderboard[0]?.name || "Coming soon",
    players: leaderboard.length > 0 ? leaderboard : fallbackPlayers,
    recentMatches: recentMatches.length > 0 ? recentMatches : fallbackMatches,
  };
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f7f3ec] p-3">
      <p className="text-xs font-bold uppercase text-black/45">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function AdminStep({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Users;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-5">
      <Icon className="mb-4 text-[#7ed9a3]" size={24} />
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/60">{text}</p>
    </div>
  );
}

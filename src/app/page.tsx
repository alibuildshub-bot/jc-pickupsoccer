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

const players = [
  { name: "Ali Khan", games: 8, wins: 6, goals: 12, assists: 5, points: 17 },
  { name: "Hamza Malik", games: 8, wins: 5, goals: 9, assists: 8, points: 17 },
  { name: "Omar Syed", games: 7, wins: 5, goals: 7, assists: 6, points: 13 },
  { name: "Bilal Ahmed", games: 8, wins: 4, goals: 5, assists: 9, points: 14 },
  { name: "Ray Patel", games: 6, wins: 4, goals: 8, assists: 3, points: 11 },
];

const recentMatches = [
  {
    week: "Week 8",
    date: "Sunday, July 5",
    teamA: "Black",
    teamB: "White",
    score: "7 - 5",
    mvp: "Ali Khan",
  },
  {
    week: "Week 7",
    date: "Sunday, June 28",
    teamA: "Green",
    teamB: "Blue",
    score: "4 - 4",
    mvp: "Hamza Malik",
  },
  {
    week: "Week 6",
    date: "Sunday, June 21",
    teamA: "Red",
    teamB: "Grey",
    score: "6 - 3",
    mvp: "Ray Patel",
  },
];

const statCards = [
  { label: "Active Players", value: "28", icon: Users },
  { label: "Games Played", value: "8", icon: CalendarDays },
  { label: "Goals Tracked", value: "86", icon: Target },
  { label: "Top Streak", value: "4W", icon: Trophy },
];

export default function Home() {
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
            href="#admin"
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
              <h2 className="text-2xl font-black">Week 8</h2>
            </div>
            <Medal className="text-[#b7791f]" size={32} />
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-7 text-center">
            <div>
              <p className="text-3xl font-black">Black</p>
              <p className="mt-2 text-sm font-semibold text-black/55">Team A</p>
            </div>
            <div className="rounded-lg bg-[#171717] px-4 py-3 text-3xl font-black text-white">7-5</div>
            <div>
              <p className="text-3xl font-black">White</p>
              <p className="mt-2 text-sm font-semibold text-black/55">Team B</p>
            </div>
          </div>
          <div className="grid gap-3 border-t border-black/10 pt-4 sm:grid-cols-3">
            <MiniStat label="MVP" value="Ali Khan" />
            <MiniStat label="Top scorer" value="Ali, 4" />
            <MiniStat label="Next game" value="Sunday" />
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
            {recentMatches.map((match) => (
              <article key={match.week} className="rounded-lg border border-black/10 bg-[#fbfaf7] p-4">
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
                {players.map((player, index) => (
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

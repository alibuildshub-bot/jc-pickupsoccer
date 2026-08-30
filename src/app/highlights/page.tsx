import Link from "next/link";
import { ArrowLeft, CalendarDays, Clapperboard, Play, Trophy } from "lucide-react";
import LogoMark from "@/components/LogoMark";
import { createSupabaseClient } from "@/lib/supabase";

export const metadata = {
  title: "Highlights | JC Footy",
  description: "JC Footy pickup soccer goal highlights by game date.",
};

export const revalidate = 0;

type MatchRow = {
  id: string;
  match_date: string | null;
  week_label: string | null;
  team_a_name: string | null;
  team_b_name: string | null;
  team_a_score: number | null;
  team_b_score: number | null;
  status: string | null;
  created_at: string | null;
};

type DateGroup = {
  key: string;
  label: string;
  totalGames: number;
  completedGames: number;
  totalGoals: number;
  matches: MatchRow[];
};

export default async function HighlightsPage() {
  const supabase = createSupabaseClient();
  const { data: matches } = supabase
    ? await supabase
        .from("matches")
        .select("id, match_date, week_label, team_a_name, team_b_name, team_a_score, team_b_score, status, created_at")
        .order("match_date", { ascending: false })
        .order("created_at", { ascending: true })
    : { data: [] as MatchRow[] };

  const groups = groupMatchesByDate((matches ?? []) as MatchRow[]);
  const latestGroup = groups[0];

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-8 text-[#171717] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <LogoMark />
            <div className="min-w-0">
              <p className="truncate text-lg font-black leading-none">JC Pickup Soccer</p>
              <p className="text-xs font-medium text-black/55">Goal highlights</p>
            </div>
          </Link>
          <Link href="/" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-black/15 bg-white px-3 text-sm font-black transition hover:bg-[#fbfaf7]">
            <ArrowLeft size={16} />
            Home
          </Link>
        </div>

        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 border-b border-black/10 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex w-fit rounded-lg bg-[#edf4f0] px-3 py-2 text-xs font-black uppercase text-[#17613d]">
                Highlights
              </p>
              <h1 className="mt-3 text-4xl font-black leading-none sm:text-5xl">Goals by Game Date</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-black/55 sm:text-base">
                Goal clips will be organized by pickup date, so each session stays easy to find.
              </p>
            </div>
            <div className="rounded-lg bg-[#171717] px-4 py-3 text-white">
              <p className="text-xs font-black uppercase text-white/55">Latest Date</p>
              <p className="mt-1 text-xl font-black">{latestGroup?.label ?? "No games yet"}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoCard label="Game Dates" value={String(groups.length)} />
            <InfoCard label="Latest Goals" value={latestGroup ? String(latestGroup.totalGoals) : "0"} />
            <InfoCard label="Clip Status" value="Coming soon" />
          </div>
        </section>

        <section className="mt-5 space-y-4">
          {groups.length > 0 ? (
            groups.map((group, index) => (
              <details
                key={group.key}
                className="group rounded-lg border border-black/10 bg-white shadow-sm"
                open={index === 0}
              >
                <summary className="flex cursor-pointer list-none flex-col gap-4 p-5 marker:hidden sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#edf4f0] text-[#17613d]">
                      <CalendarDays size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-[#17613d]">Game Date</p>
                      <h2 className="text-2xl font-black">{group.label}</h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[320px]">
                    <MiniStat label="Games" value={String(group.totalGames)} />
                    <MiniStat label="Done" value={String(group.completedGames)} />
                    <MiniStat label="Goals" value={String(group.totalGoals)} />
                  </div>
                </summary>

                <div className="border-t border-black/10 p-5 sm:p-6">
                  <div className="mb-4 rounded-lg border border-dashed border-black/15 bg-[#fbfaf7] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#171717] text-white">
                        <Play fill="currentColor" size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black">Goal clips for {group.label}</p>
                        <p className="text-xs font-semibold text-black/50">Add the goal videos here once they are ready.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {group.matches.map((match, matchIndex) => (
                      <article key={match.id} className="rounded-lg bg-[#fbfaf7] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase text-[#17613d]">
                              {match.week_label?.trim() || `Game ${matchIndex + 1}`}
                            </p>
                            <h3 className="mt-1 text-base font-black">
                              {match.team_a_name || "Team A"} vs {match.team_b_name || "Team B"}
                            </h3>
                          </div>
                          <div className="rounded-lg bg-[#171717] px-3 py-2 text-sm font-black text-white">
                            {match.team_a_score ?? 0} - {match.team_b_score ?? 0}
                          </div>
                        </div>
                        <p className="mt-3 text-xs font-black uppercase text-black/45">
                          {(match.status || "scheduled").replaceAll("_", " ")}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </details>
            ))
          ) : (
            <section className="rounded-lg border border-dashed border-black/15 bg-white p-6 text-center shadow-sm">
              <Clapperboard className="mx-auto text-[#b7791f]" size={36} />
              <h2 className="mt-3 text-2xl font-black">No game dates yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-black/55">
                Once pickup games are scheduled, this page will show each date as its own highlights section.
              </p>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

function groupMatchesByDate(matches: MatchRow[]) {
  const grouped = new Map<string, MatchRow[]>();

  matches.forEach((match) => {
    const key = match.match_date || "unscheduled";
    grouped.set(key, [...(grouped.get(key) ?? []), match]);
  });

  return Array.from(grouped.entries()).map(([key, dateMatches]) => {
    const completedMatches = dateMatches.filter((match) => match.status === "completed");
    const totalGoals = completedMatches.reduce(
      (sum, match) => sum + (match.team_a_score ?? 0) + (match.team_b_score ?? 0),
      0,
    );

    return {
      key,
      label: key === "unscheduled" ? "Unscheduled" : formatDate(key),
      totalGames: dateMatches.length,
      completedGames: completedMatches.length,
      totalGoals,
      matches: dateMatches,
    } satisfies DateGroup;
  });
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f7f3ec] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase text-black/45">{label}</p>
        <Trophy className="text-[#b7791f]" size={20} />
      </div>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f7f3ec] px-3 py-2">
      <p className="text-[11px] font-black uppercase text-black/45">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

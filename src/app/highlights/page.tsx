import Link from "next/link";
import { ArrowLeft, CalendarDays, Clapperboard, Play } from "lucide-react";
import LogoMark from "@/components/LogoMark";
import { createSupabaseClient } from "@/lib/supabase";

export const metadata = {
  title: "Highlights | JC Footy",
  description: "JC Footy pickup soccer goal highlights by game date.",
};

export const revalidate = 0;

type MatchRow = {
  match_date: string | null;
};

type DateGroup = {
  key: string;
  label: string;
};

export default async function HighlightsPage() {
  const supabase = createSupabaseClient();
  const { data: matches } = supabase
    ? await supabase
        .from("matches")
        .select("match_date")
        .order("match_date", { ascending: false })
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
              <h1 className="mt-3 text-4xl font-black leading-none sm:text-5xl">Highlights by Date</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-black/55 sm:text-base">
                A simple library for saved goal highlights, organized by pickup date.
              </p>
            </div>
            <div className="rounded-lg bg-[#171717] px-4 py-3 text-white">
              <p className="text-xs font-black uppercase text-white/55">Latest Date</p>
              <p className="mt-1 text-xl font-black">{latestGroup?.label ?? "No games yet"}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoCard label="Game Dates" value={String(groups.length)} />
            <InfoCard label="Library Status" value="Ready for clips" />
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.length > 0 ? (
            groups.map((group) => (
              <article
                key={group.key}
                className="rounded-lg border border-black/10 bg-white p-5 shadow-sm transition hover:border-[#1f7a4d]/35 hover:bg-[#fbfaf7] sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase text-[#17613d]">Game Date</p>
                    <h2 className="mt-2 text-3xl font-black">{group.label}</h2>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#edf4f0] text-[#17613d]">
                    <CalendarDays size={22} />
                  </div>
                </div>
                <div className="mt-5 rounded-lg border border-dashed border-black/15 bg-[#fbfaf7] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#171717] text-white">
                      <Play fill="currentColor" size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black">Goal highlights</p>
                      <p className="text-xs font-semibold text-black/50">Videos from this date will appear here.</p>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <section className="rounded-lg border border-dashed border-black/15 bg-white p-6 text-center shadow-sm sm:col-span-2 lg:col-span-3">
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

  return Array.from(grouped.keys()).map((key) => {
    return {
      key,
      label: key === "unscheduled" ? "Unscheduled" : formatDate(key),
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
        <Clapperboard className="text-[#b7791f]" size={20} />
      </div>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, Clapperboard, Flame, Play, Send, Trophy, type LucideIcon } from "lucide-react";
import LogoMark from "@/components/LogoMark";

const highlightCards = [
  {
    title: "Goal of the Week",
    description: "The cleanest finish from the latest pickup session.",
    label: "Top Finish",
  },
  {
    title: "Latest Goals",
    description: "New goal clips from the most recent matchday.",
    label: "Recent",
  },
  {
    title: "All Goal Clips",
    description: "Every saved goal highlight in one place.",
    label: "Library",
  },
];

export const metadata = {
  title: "Highlights | JC Footy",
  description: "JC Footy pickup soccer goal highlights.",
};

export default function HighlightsPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-8 text-[#171717] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <LogoMark />
            <div className="min-w-0">
              <p className="truncate text-lg font-black leading-none">JC Pickup Soccer</p>
              <p className="text-xs font-medium text-black/55">Matchday highlights</p>
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
              <h1 className="mt-3 text-4xl font-black leading-none sm:text-5xl">JC Footy Clips</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-black/55 sm:text-base">
                Goal highlights from pickup nights, organized by session and finish.
              </p>
            </div>
            <div className="rounded-lg bg-[#171717] px-4 py-3 text-white">
              <p className="text-xs font-black uppercase text-white/55">Goal Library</p>
              <p className="mt-1 text-xl font-black">Coming Soon</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-lg border border-dashed border-black/20 bg-[#fbfaf7] p-5 sm:p-6">
              <div className="flex h-48 items-center justify-center rounded-lg bg-[#171717] text-white sm:h-72">
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                    <Play fill="currentColor" size={26} />
                  </div>
                  <p className="mt-4 text-xl font-black">Featured goal</p>
                  <p className="mt-1 text-sm font-semibold text-white/55">First goal clip drops here.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <InfoCard icon={Clapperboard} label="Latest Goal" value="Waiting on footage" />
              <InfoCard icon={Trophy} label="Goal of the Week" value="Not selected yet" />
              <InfoCard icon={Flame} label="Goal Clips" value="Session breakdown" />
              <InfoCard icon={Send} label="Send Goals" value="Text or upload after games" />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          {highlightCards.map((card) => (
            <article key={card.title} className="rounded-lg border border-black/10 bg-white p-5 shadow-sm transition hover:border-[#1f7a4d]/35 hover:bg-[#fbfaf7]">
              <p className="text-xs font-black uppercase text-[#17613d]">{card.label}</p>
              <h2 className="mt-2 text-xl font-black">{card.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-black/55">{card.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-[#f7f3ec] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase text-black/45">{label}</p>
        <Icon className="text-[#b7791f]" size={20} />
      </div>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}

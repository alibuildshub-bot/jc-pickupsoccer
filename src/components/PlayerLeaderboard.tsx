"use client";

import { ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";

export type LeaderboardPlayer = {
  name: string;
  team: string;
  goals: number;
  assists: number;
  points: number;
};

type LeaderboardMode = "ga" | "goals" | "assists";

const leaderboardTabs: Array<{ id: LeaderboardMode; label: string }> = [
  { id: "ga", label: "G+A" },
  { id: "goals", label: "Goals" },
  { id: "assists", label: "Assists" },
];

export default function PlayerLeaderboard({ players }: { players: LeaderboardPlayer[] }) {
  const [mode, setMode] = useState<LeaderboardMode>("ga");
  const sortedPlayers = useMemo(() => sortPlayers(players, mode), [mode, players]);

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-1.5 sm:mb-4 sm:gap-2">
        {leaderboardTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={`h-8 rounded-lg px-2.5 text-xs font-black transition sm:h-10 sm:px-4 sm:text-sm ${
              mode === tab.id
                ? "bg-[#171717] text-white"
                : "border border-black/10 bg-[#fbfaf7] text-black/60 hover:bg-black/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="inline-flex h-8 items-center rounded-lg bg-[#f7f3ec] px-2.5 text-[10px] font-black uppercase text-black/45 sm:h-10 sm:px-3 sm:text-xs">
          Ranked by {getModeLabel(mode)}
        </span>
      </div>
      <div className="grid gap-2 md:hidden">
        {sortedPlayers.map((player, index) => (
          <a
            key={player.name}
            href={`/players/${slugify(player.name)}`}
            className="block rounded-lg border border-black/10 bg-[#fbfaf7] p-2.5 transition hover:border-[#1f7a4d]/40 hover:bg-[#f1ece3] sm:p-4"
          >
            <div className="mb-2 flex items-start justify-between gap-2 sm:mb-4 sm:gap-3">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#edf4f0] text-[11px] font-black text-[#17613d] sm:h-8 sm:w-8 sm:text-sm">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="break-words text-sm font-black leading-tight sm:text-base">{player.name}</p>
                  <p className="mt-0.5 break-words text-[11px] font-bold text-black/45 sm:mt-1 sm:text-xs">{player.team}</p>
                </div>
              </div>
              <div className="grid shrink-0 justify-items-end gap-1.5 sm:gap-2">
                <span className="rounded-lg bg-[#171717] px-2.5 py-1 text-xs font-black text-white sm:px-3 sm:py-2 sm:text-sm">
                  {getModeValue(player, mode)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[10px] font-black uppercase text-[#17613d] sm:text-[11px]">
                  Profile
                  <ArrowUpRight size={13} />
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center sm:gap-2">
              <MiniStat label="G" value={String(player.goals)} />
              <MiniStat label="A" value={String(player.assists)} />
              <MiniStat label="G+A" value={String(player.points)} />
            </div>
          </a>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] border-separate border-spacing-y-2 text-left">
          <thead>
            <tr className="text-xs font-black uppercase text-black/45">
              <th className="pb-2">Player</th>
              <th className="pb-2">Team</th>
              <th className="pb-2 text-center">Goals</th>
              <th className="pb-2 text-center">Assists</th>
              <th className="pb-2 text-center">G+A</th>
              <th className="pb-2 text-center">Profile</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player, index) => (
              <tr key={player.name} className="bg-[#fbfaf7]">
                <td className="rounded-l-lg px-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4f0] text-sm font-black text-[#17613d]">
                      {index + 1}
                    </span>
                    <a href={`/players/${slugify(player.name)}`} className="font-black hover:underline">
                      {player.name}
                    </a>
                  </div>
                </td>
                <td className="px-3 py-3 font-bold text-black/55">{player.team}</td>
                <StatCell value={player.goals} active={mode === "goals"} />
                <StatCell value={player.assists} active={mode === "assists"} />
                <td className="px-3 py-3 text-center">
                  <span className={`inline-flex min-w-14 justify-center rounded-lg px-3 py-2 text-base font-black ${
                    mode === "ga" ? "bg-[#171717] text-white" : "bg-white text-black"
                  }`}>
                    {player.points}
                  </span>
                </td>
                <td className="rounded-r-lg px-3 py-3 text-center">
                  <a
                    href={`/players/${slugify(player.name)}`}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-[#1f7a4d]/20 bg-white px-3 text-xs font-black uppercase text-[#17613d] transition hover:border-[#1f7a4d]/50 hover:bg-[#edf4f0]"
                  >
                    Profile
                    <ArrowUpRight size={14} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function sortPlayers(players: LeaderboardPlayer[], mode: LeaderboardMode) {
  return [...players].sort((first, second) => {
    if (mode === "goals") {
      return second.goals - first.goals || second.assists - first.assists || first.name.localeCompare(second.name);
    }

    if (mode === "assists") {
      return second.assists - first.assists || second.goals - first.goals || first.name.localeCompare(second.name);
    }

    return second.points - first.points || second.goals - first.goals || first.name.localeCompare(second.name);
  });
}

function getModeValue(player: LeaderboardPlayer, mode: LeaderboardMode) {
  if (mode === "goals") return player.goals;
  if (mode === "assists") return player.assists;

  return player.points;
}

function getModeLabel(mode: LeaderboardMode) {
  if (mode === "goals") return "Goals";
  if (mode === "assists") return "Assists";

  return "G+A";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "player";
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-2 sm:p-3">
      <p className="text-[10px] font-bold uppercase text-black/45 sm:text-xs">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function StatCell({ value, active }: { value: number; active: boolean }) {
  return (
    <td className="px-3 py-3 text-center">
      <span className={`inline-flex min-w-14 justify-center rounded-lg px-3 py-2 text-base font-black ${
        active ? "bg-[#171717] text-white" : "bg-white text-black"
      }`}>
        {value}
      </span>
    </td>
  );
}

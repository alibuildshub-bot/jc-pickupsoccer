"use client";

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
  { id: "goals", label: "Goals" },
  { id: "assists", label: "Assists" },
  { id: "ga", label: "G+A" },
];

export default function PlayerLeaderboard({ players }: { players: LeaderboardPlayer[] }) {
  const [mode, setMode] = useState<LeaderboardMode>("goals");
  const sortedPlayers = useMemo(() => sortPlayers(players, mode), [mode, players]);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {leaderboardTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={`h-10 rounded-lg px-4 text-sm font-black transition ${
              mode === tab.id
                ? "bg-[#171717] text-white"
                : "border border-black/10 bg-[#fbfaf7] text-black/60 hover:bg-black/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:hidden">
        {sortedPlayers.map((player, index) => (
          <article key={player.name} className="rounded-lg border border-black/10 bg-[#fbfaf7] p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf4f0] text-sm font-black text-[#17613d]">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="break-words font-black leading-tight">{player.name}</h3>
                  <p className="mt-1 break-words text-xs font-bold text-black/45">{player.team}</p>
                </div>
              </div>
              <span className="rounded-lg bg-[#171717] px-3 py-2 text-sm font-black text-white">
                {getModeValue(player, mode)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <MiniStat label="G" value={String(player.goals)} />
              <MiniStat label="A" value={String(player.assists)} />
              <MiniStat label="G+A" value={String(player.points)} />
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left">
          <thead>
            <tr className="text-xs font-black uppercase text-black/45">
              <th className="pb-2">Player</th>
              <th className="pb-2">Team</th>
              <th className="pb-2 text-center">Goals</th>
              <th className="pb-2 text-center">Assists</th>
              <th className="pb-2 text-center">G+A</th>
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
                    <span className="font-black">{player.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3 font-bold text-black/55">{player.team}</td>
                <StatCell value={player.goals} active={mode === "goals"} />
                <StatCell value={player.assists} active={mode === "assists"} />
                <td className="rounded-r-lg px-3 py-3 text-center">
                  <span className={`inline-flex min-w-14 justify-center rounded-lg px-3 py-2 text-base font-black ${
                    mode === "ga" ? "bg-[#171717] text-white" : "bg-white text-black"
                  }`}>
                    {player.points}
                  </span>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-xs font-bold uppercase text-black/45">{label}</p>
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

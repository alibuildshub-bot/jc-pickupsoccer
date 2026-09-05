"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Lock,
  Minus,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import LogoMark from "@/components/LogoMark";

type Player = {
  id: string;
  name: string;
  is_active: boolean;
};

type Match = {
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

type TournamentTeam = {
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
  players: { name: string } | null;
};

type PlayerStat = {
  id: string;
  match_id: string;
  player_id: string;
  team_name: string;
  goals: number;
  assists: number;
  result: string;
  players: { name: string } | null;
};

type ScorerData = {
  matches: Match[];
  players: Player[];
  teams: TournamentTeam[];
  roster: RosterRow[];
  stats: PlayerStat[];
};

type StatDraft = {
  goals: string;
  assists: string;
};

const codeStorageKey = "jc-footy-scorer-code";

export default function ScorerPage() {
  const [code, setCode] = useState("");
  const [savedCode, setSavedCode] = useState("");
  const [data, setData] = useState<ScorerData>({
    matches: [],
    players: [],
    teams: [],
    roster: [],
    stats: [],
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, { a: string; b: string }>>({});
  const [statDrafts, setStatDrafts] = useState<Record<string, StatDraft>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const dateOptions = useMemo(() => buildDateOptions(data.matches, data.teams), [data.matches, data.teams]);
  const selectedDateMatches = useMemo(
    () => data.matches.filter((match) => match.match_date === selectedDate).sort(sortMatches),
    [data.matches, selectedDate],
  );
  const selectedMatch = useMemo(
    () => selectedDateMatches.find((match) => match.id === selectedMatchId) || selectedDateMatches[0] || null,
    [selectedDateMatches, selectedMatchId],
  );
  const activeTeams = useMemo(() => getTeamsForDate(data.teams, selectedDateMatches, selectedDate), [
    data.teams,
    selectedDate,
    selectedDateMatches,
  ]);
  const matchLabels = useMemo(() => buildGameLabels(selectedDateMatches), [selectedDateMatches]);

  useEffect(() => {
    if (!selectedDate && dateOptions.length > 0) {
      setSelectedDate(dateOptions[0].date);
    }
  }, [dateOptions, selectedDate]);

  useEffect(() => {
    if (!selectedMatchId && selectedDateMatches[0]) {
      setSelectedMatchId(selectedDateMatches[0].id);
    }
    if (selectedMatchId && !selectedDateMatches.some((match) => match.id === selectedMatchId)) {
      setSelectedMatchId(selectedDateMatches[0]?.id || "");
    }
  }, [selectedDateMatches, selectedMatchId]);

  useEffect(() => {
    setScoreDrafts((current) => {
      const next = { ...current };

      for (const match of data.matches) {
        if (!next[match.id]) {
          next[match.id] = {
            a: String(match.team_a_score ?? 0),
            b: String(match.team_b_score ?? 0),
          };
        }
      }

      return next;
    });
  }, [data.matches]);

  const loadData = useCallback(async (credential = savedCode) => {
    if (!credential) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/scorer", {
        headers: {
          "x-scorer-code": credential,
        },
      });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error || "Could not load scorer data.");
        return;
      }

      setData(payload);
      setMessage("Live scorer is ready.");
    } catch {
      setMessage("Could not reach the scorer service.");
    } finally {
      setLoading(false);
    }
  }, [savedCode]);

  useEffect(() => {
    const storedCode = window.localStorage.getItem(codeStorageKey) || "";
    if (!storedCode) return;

    setCode(storedCode);
    setSavedCode(storedCode);
    loadData(storedCode);
  }, [loadData]);

  function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setMessage("Enter the scorer code first.");
      return;
    }

    window.localStorage.setItem(codeStorageKey, trimmedCode);
    setSavedCode(trimmedCode);
    loadData(trimmedCode);
  }

  async function saveScore(match: Match, status: "live" | "completed") {
    const draft = scoreDrafts[match.id] || { a: String(match.team_a_score || 0), b: String(match.team_b_score || 0) };

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/scorer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-scorer-code": savedCode,
        },
        body: JSON.stringify({
          action: "score",
          match_id: match.id,
          team_a_score: Number(draft.a || 0),
          team_b_score: Number(draft.b || 0),
          status,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error || "Score was not saved.");
        return;
      }

      setMessage(status === "completed" ? "Final score saved." : "Live score saved.");
      await loadData(savedCode);
    } catch {
      setMessage("Could not save the score.");
    } finally {
      setLoading(false);
    }
  }

  async function saveStat(match: Match, player: Player, teamName: string) {
    const key = getStatKey(match.id, player.id, teamName);
    const draft = statDrafts[key] || getDraftFromExisting(data.stats, match.id, player.id, teamName);

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/scorer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-scorer-code": savedCode,
        },
        body: JSON.stringify({
          action: "stat",
          match_id: match.id,
          player_id: player.id,
          team_name: teamName,
          goals: Number(draft.goals || 0),
          assists: Number(draft.assists || 0),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error || "Player stat was not saved.");
        return;
      }

      setMessage(`${player.name} updated for ${matchLabels.get(match.id) || "this game"}.`);
      await loadData(savedCode);
    } catch {
      setMessage("Could not save player stats.");
    } finally {
      setLoading(false);
    }
  }

  function updateScore(matchId: string, side: "a" | "b", value: string) {
    setScoreDrafts((current) => ({
      ...current,
      [matchId]: {
        a: current[matchId]?.a ?? "0",
        b: current[matchId]?.b ?? "0",
        [side]: value,
      },
    }));
  }

  function stepScore(matchId: string, side: "a" | "b", amount: number) {
    const current = scoreDrafts[matchId]?.[side] || "0";
    updateScore(matchId, side, String(Math.max(0, Number(current || 0) + amount)));
  }

  function updateStat(matchId: string, playerId: string, teamName: string, field: keyof StatDraft, value: string) {
    const key = getStatKey(matchId, playerId, teamName);

    setStatDrafts((current) => ({
      ...current,
      [key]: {
        goals: current[key]?.goals ?? getDraftFromExisting(data.stats, matchId, playerId, teamName).goals,
        assists: current[key]?.assists ?? getDraftFromExisting(data.stats, matchId, playerId, teamName).assists,
        [field]: value,
      },
    }));
  }

  function stepStat(matchId: string, playerId: string, teamName: string, field: keyof StatDraft, amount: number) {
    const key = getStatKey(matchId, playerId, teamName);
    const current = statDrafts[key]?.[field] ?? getDraftFromExisting(data.stats, matchId, playerId, teamName)[field];

    updateStat(matchId, playerId, teamName, field, String(Math.max(0, Number(current || 0) + amount)));
  }

  if (!savedCode) {
    return (
      <main className="min-h-screen bg-[#f4efe7] px-4 py-6 text-[#171717]">
        <section className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center">
          <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-4">
              <LogoMark className="h-16 w-16" />
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-[#16633f]">JC Footy</p>
                <h1 className="text-3xl font-black">Live Scorer</h1>
              </div>
            </div>
            <form onSubmit={unlock} className="space-y-4">
              <label className="block text-sm font-black uppercase text-black/55" htmlFor="scorer-code">
                Scorer Code
              </label>
              <input
                id="scorer-code"
                type="password"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="w-full rounded-2xl border border-black/15 bg-white px-4 py-4 text-lg font-bold outline-none transition focus:border-[#1f7a4d]"
                placeholder="Enter code"
              />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#171717] px-5 py-4 text-lg font-black text-white transition hover:bg-[#1f7a4d]"
              >
                <Lock className="h-5 w-5" />
                Open Scorer
              </button>
            </form>
            {message ? <p className="mt-4 text-sm font-bold text-black/60">{message}</p> : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4efe7] px-3 py-4 text-[#171717] sm:px-6">
      <section className="mx-auto max-w-5xl space-y-4">
        <header className="rounded-[28px] border border-black/10 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <LogoMark className="h-14 w-14 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-[#16633f]">JC Footy</p>
                <h1 className="truncate text-2xl font-black sm:text-4xl">Live Scorer</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadData(savedCode)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-white text-[#16633f] transition hover:bg-[#eef6f1]"
              aria-label="Refresh scorer data"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {message ? (
            <div className="mt-4 rounded-2xl bg-[#f7f3ed] px-4 py-3 text-sm font-bold text-black/60">
              {message}
            </div>
          ) : null}
        </header>

        <section className="grid gap-3 rounded-[28px] border border-black/10 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-6">
          <label className="space-y-2">
            <span className="flex items-center gap-2 text-sm font-black uppercase text-black/55">
              <CalendarDays className="h-4 w-4 text-[#16633f]" />
              Date
            </span>
            <select
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setSelectedMatchId("");
              }}
              className="w-full rounded-2xl border border-black/15 bg-white px-4 py-4 text-base font-black outline-none focus:border-[#1f7a4d]"
            >
              {dateOptions.map((option) => (
                <option key={option.date} value={option.date}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="flex items-center gap-2 text-sm font-black uppercase text-black/55">
              <Trophy className="h-4 w-4 text-[#b87516]" />
              Game
            </span>
            <select
              value={selectedMatch?.id || ""}
              onChange={(event) => setSelectedMatchId(event.target.value)}
              className="w-full rounded-2xl border border-black/15 bg-white px-4 py-4 text-base font-black outline-none focus:border-[#1f7a4d]"
            >
              {selectedDateMatches.map((match) => (
                <option key={match.id} value={match.id}>
                  {matchLabels.get(match.id) || "Game"}
                </option>
              ))}
            </select>
          </label>
        </section>

        {!selectedMatch ? (
          <section className="rounded-[28px] border border-black/10 bg-white p-6 text-center shadow-sm">
            <p className="text-lg font-black">No games found for this date.</p>
            <p className="mt-2 font-bold text-black/55">Create the matchups in the admin portal first.</p>
          </section>
        ) : (
          <>
            <ScoreCard
              match={selectedMatch}
              label={matchLabels.get(selectedMatch.id) || "Game"}
              draft={scoreDrafts[selectedMatch.id] || { a: String(selectedMatch.team_a_score || 0), b: String(selectedMatch.team_b_score || 0) }}
              loading={loading}
              onScoreChange={updateScore}
              onStepScore={stepScore}
              onSaveScore={saveScore}
            />

            <section className="grid gap-4 lg:grid-cols-2">
              {[selectedMatch.team_a_name, selectedMatch.team_b_name].map((teamName) => (
                <TeamStatCard
                  key={teamName}
                  teamName={teamName}
                  team={activeTeams.find((team) => team.name === teamName)}
                  match={selectedMatch}
                  players={getPlayersForTeam(teamName, activeTeams, data.roster, data.players)}
                  stats={data.stats}
                  drafts={statDrafts}
                  loading={loading}
                  onStepStat={stepStat}
                  onStatChange={updateStat}
                  onSaveStat={saveStat}
                />
              ))}
            </section>

            <SavedStats match={selectedMatch} stats={data.stats} />
          </>
        )}

        <footer className="pb-8 text-center text-xs font-bold text-black/40">
          Share this page only with people helping run the games.
        </footer>
      </section>
    </main>
  );
}

function ScoreCard({
  match,
  label,
  draft,
  loading,
  onScoreChange,
  onStepScore,
  onSaveScore,
}: {
  match: Match;
  label: string;
  draft: { a: string; b: string };
  loading: boolean;
  onScoreChange: (matchId: string, side: "a" | "b", value: string) => void;
  onStepScore: (matchId: string, side: "a" | "b", amount: number) => void;
  onSaveScore: (match: Match, status: "live" | "completed") => void;
}) {
  return (
    <section className="rounded-[28px] border border-black/10 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-[#16633f]">{label}</p>
          <h2 className="text-2xl font-black sm:text-4xl">
            {match.team_a_name} vs {match.team_b_name}
          </h2>
        </div>
        <span className="rounded-2xl bg-[#f7f3ed] px-4 py-2 text-sm font-black capitalize text-black/60">
          {match.status}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <ScoreInput
          label={match.team_a_name}
          value={draft.a}
          onChange={(value) => onScoreChange(match.id, "a", value)}
          onMinus={() => onStepScore(match.id, "a", -1)}
          onPlus={() => onStepScore(match.id, "a", 1)}
        />
        <div className="hidden pb-4 text-center text-2xl font-black text-black/35 sm:block">vs</div>
        <ScoreInput
          label={match.team_b_name}
          value={draft.b}
          onChange={(value) => onScoreChange(match.id, "b", value)}
          onMinus={() => onStepScore(match.id, "b", -1)}
          onPlus={() => onStepScore(match.id, "b", 1)}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => onSaveScore(match, "live")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#171717] px-5 py-4 text-lg font-black text-white transition hover:bg-black disabled:opacity-60"
        >
          <Save className="h-5 w-5" />
          Save Live
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => onSaveScore(match, "completed")}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1f7a4d] px-5 py-4 text-lg font-black text-white transition hover:bg-[#16633f] disabled:opacity-60"
        >
          <Check className="h-5 w-5" />
          Mark Complete
        </button>
      </div>
    </section>
  );
}

function ScoreInput({
  label,
  value,
  onChange,
  onMinus,
  onPlus,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="rounded-3xl bg-[#f7f3ed] p-4">
      <p className="mb-3 text-base font-black text-black/65">{label}</p>
      <div className="grid grid-cols-[52px_1fr_52px] gap-2">
        <button
          type="button"
          onClick={onMinus}
          className="flex h-14 items-center justify-center rounded-2xl bg-white text-[#171717] shadow-sm"
          aria-label={`Decrease ${label} score`}
        >
          <Minus className="h-5 w-5" />
        </button>
        <input
          type="number"
          min="0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-14 rounded-2xl border border-black/10 bg-white text-center text-3xl font-black outline-none focus:border-[#1f7a4d]"
        />
        <button
          type="button"
          onClick={onPlus}
          className="flex h-14 items-center justify-center rounded-2xl bg-[#1f7a4d] text-white shadow-sm"
          aria-label={`Increase ${label} score`}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function TeamStatCard({
  teamName,
  team,
  match,
  players,
  stats,
  drafts,
  loading,
  onStepStat,
  onStatChange,
  onSaveStat,
}: {
  teamName: string;
  team?: TournamentTeam;
  match: Match;
  players: Player[];
  stats: PlayerStat[];
  drafts: Record<string, StatDraft>;
  loading: boolean;
  onStepStat: (matchId: string, playerId: string, teamName: string, field: keyof StatDraft, amount: number) => void;
  onStatChange: (matchId: string, playerId: string, teamName: string, field: keyof StatDraft, value: string) => void;
  onSaveStat: (match: Match, player: Player, teamName: string) => void;
}) {
  return (
    <section className="rounded-[28px] border border-black/10 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <TeamBadge team={team} />
        <div>
          <p className="text-xs font-black uppercase text-black/45">Player Stats</p>
          <h3 className="text-2xl font-black">{teamName}</h3>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="rounded-2xl bg-[#f7f3ed] p-4 font-bold text-black/55">
          No roster found for this team. You can still use the full admin portal if a player is missing.
        </div>
      ) : (
        <div className="space-y-3">
          {players.map((player) => {
            const key = getStatKey(match.id, player.id, teamName);
            const draft = drafts[key] || getDraftFromExisting(stats, match.id, player.id, teamName);

            return (
              <div key={player.id} className="rounded-3xl bg-[#f7f3ed] p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-lg font-black">{player.name}</p>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => onSaveStat(match, player, teamName)}
                    className="shrink-0 rounded-2xl bg-[#171717] px-4 py-2 text-sm font-black text-white transition hover:bg-[#1f7a4d] disabled:opacity-60"
                  >
                    Save
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <StatStepper
                    label="Goals"
                    value={draft.goals}
                    onChange={(value) => onStatChange(match.id, player.id, teamName, "goals", value)}
                    onMinus={() => onStepStat(match.id, player.id, teamName, "goals", -1)}
                    onPlus={() => onStepStat(match.id, player.id, teamName, "goals", 1)}
                  />
                  <StatStepper
                    label="Assists"
                    value={draft.assists}
                    onChange={(value) => onStatChange(match.id, player.id, teamName, "assists", value)}
                    onMinus={() => onStepStat(match.id, player.id, teamName, "assists", -1)}
                    onPlus={() => onStepStat(match.id, player.id, teamName, "assists", 1)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function StatStepper({
  label,
  value,
  onChange,
  onMinus,
  onPlus,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase text-black/45">{label}</p>
      <div className="grid grid-cols-[40px_1fr_40px] gap-1">
        <button type="button" onClick={onMinus} className="flex h-11 items-center justify-center rounded-xl bg-white">
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          min="0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 rounded-xl border border-black/10 bg-white text-center text-xl font-black outline-none focus:border-[#1f7a4d]"
        />
        <button type="button" onClick={onPlus} className="flex h-11 items-center justify-center rounded-xl bg-[#1f7a4d] text-white">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SavedStats({ match, stats }: { match: Match; stats: PlayerStat[] }) {
  const matchStats = stats
    .filter((stat) => stat.match_id === match.id)
    .sort((first, second) => (second.goals + second.assists) - (first.goals + first.assists));

  return (
    <section className="rounded-[28px] border border-black/10 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-[#16633f]" />
        <h3 className="text-2xl font-black">Saved Stats</h3>
      </div>
      {matchStats.length === 0 ? (
        <p className="rounded-2xl bg-[#f7f3ed] p-4 font-bold text-black/55">No player stats saved for this game yet.</p>
      ) : (
        <div className="space-y-2">
          {matchStats.map((stat) => (
            <div key={stat.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl bg-[#f7f3ed] p-3">
              <div className="min-w-0">
                <p className="truncate font-black">{stat.players?.name || "Player"}</p>
                <p className="truncate text-sm font-bold text-black/50">{stat.team_name}</p>
              </div>
              <p className="font-black">
                {stat.goals} G / {stat.assists} A
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TeamBadge({ team }: { team?: TournamentTeam }) {
  if (team?.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={team.logo_url}
        alt=""
        className="h-12 w-12 rounded-full border border-black/10 bg-white object-contain p-1"
      />
    );
  }

  return (
    <span
      className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-[#16633f]"
      style={{ color: team?.color || "#16633f" }}
    >
      <Users className="h-6 w-6" />
    </span>
  );
}

function buildDateOptions(matches: Match[], teams: TournamentTeam[]) {
  const dates = new Set<string>();

  for (const match of matches) dates.add(match.match_date);
  for (const team of teams) {
    if (team.session_date) dates.add(team.session_date);
  }

  return Array.from(dates)
    .sort((first, second) => second.localeCompare(first))
    .map((date) => ({
      date,
      label: formatDateLabel(date),
    }));
}

function getTeamsForDate(teams: TournamentTeam[], matches: Match[], date: string) {
  const sessionTeams = teams.filter((team) => team.session_date === date);
  if (sessionTeams.length > 0) return sessionTeams;

  const matchTeamNames = new Set(matches.flatMap((match) => [match.team_a_name, match.team_b_name]));
  return teams.filter((team) => matchTeamNames.has(team.name));
}

function getPlayersForTeam(teamName: string, teams: TournamentTeam[], roster: RosterRow[], players: Player[]) {
  const team = teams.find((candidate) => candidate.name === teamName);
  if (!team) return [];

  const playerIds = roster.filter((row) => row.team_id === team.id).map((row) => row.player_id);
  const playerLookup = new Map(players.map((player) => [player.id, player]));

  return playerIds
    .map((playerId) => playerLookup.get(playerId))
    .filter((player): player is Player => Boolean(player))
    .sort((first, second) => first.name.localeCompare(second.name));
}

function getDraftFromExisting(stats: PlayerStat[], matchId: string, playerId: string, teamName: string) {
  const existing = stats.find(
    (stat) => stat.match_id === matchId && stat.player_id === playerId && stat.team_name === teamName,
  );

  return {
    goals: String(existing?.goals || 0),
    assists: String(existing?.assists || 0),
  };
}

function getStatKey(matchId: string, playerId: string, teamName: string) {
  return `${matchId}:${playerId}:${teamName}`;
}

function sortMatches(first: Match, second: Match) {
  const firstOrder = extractGameNumber(first.week_label);
  const secondOrder = extractGameNumber(second.week_label);

  return firstOrder - secondOrder || (first.created_at || "").localeCompare(second.created_at || "");
}

function extractGameNumber(label: string) {
  const match = label.match(/\d+/);
  return match ? Number(match[0]) : 999;
}

function buildGameLabels(matches: Match[]) {
  return new Map(matches.sort(sortMatches).map((match, index) => [match.id, `Game ${index + 1}`]));
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

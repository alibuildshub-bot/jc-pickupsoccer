"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Lock,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import LogoMark from "@/components/LogoMark";

type Player = {
  id: string;
  name: string;
  nickname?: string | null;
  position?: string | null;
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
  own_goals?: number;
  result: string;
  players: { name: string } | null;
  matches?: { week_label: string; match_date: string } | null;
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

type NewGameDraft = {
  teamA: string;
  teamB: string;
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
  const [newGameDraft, setNewGameDraft] = useState<NewGameDraft>({ teamA: "", teamB: "" });
  const [editingMatchId, setEditingMatchId] = useState("");
  const [editGameDraft, setEditGameDraft] = useState<NewGameDraft>({ teamA: "", teamB: "" });
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
  const normalizedNewGameDraft = useMemo(
    () => normalizeNewGameDraft(newGameDraft, activeTeams),
    [activeTeams, newGameDraft],
  );
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
      const response = await scorerFetch("/api/scorer", { method: "GET" }, credential);
      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          resetScorerAccess();
        }
        setMessage(payload.error || "Could not load scorer data.");
        return;
      }

      setData({
        matches: payload.matches || [],
        players: payload.players || [],
        teams: payload.teams || [],
        roster: payload.roster || [],
        stats: payload.stats || [],
      });
      setMessage("");
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
      const response = await scorerFetch(
        "/api/scorer",
        {
          method: "POST",
          body: JSON.stringify({
            action: "score",
            match_id: match.id,
            team_a_score: Number(draft.a || 0),
            team_b_score: Number(draft.b || 0),
            status,
          }),
        },
        savedCode,
      );
      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          resetScorerAccess();
        }
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
      const response = await scorerFetch(
        "/api/scorer",
        {
          method: "POST",
          body: JSON.stringify({
            action: "stat",
            match_id: match.id,
            player_id: player.id,
            team_name: teamName,
            goals: Number(draft.goals || 0),
            assists: Number(draft.assists || 0),
          }),
        },
        savedCode,
      );
      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          resetScorerAccess();
        }
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

  async function createGame() {
    const teamAName = normalizedNewGameDraft.teamA.trim();
    const teamBName = normalizedNewGameDraft.teamB.trim();

    if (!selectedDate) {
      setMessage("Pick a date first.");
      return;
    }

    if (!teamAName || !teamBName) {
      setMessage("Choose two teams for the game.");
      return;
    }

    if (teamAName === teamBName) {
      setMessage("Choose two different teams.");
      return;
    }

    setLoading(true);
    setMessage("");

    const nextGameLabel = `Game ${selectedDateMatches.length + 1}`;

    try {
      const response = await scorerFetch(
        "/api/scorer",
        {
          method: "POST",
          body: JSON.stringify({
            action: "create_match",
            match_date: selectedDate,
            week_label: nextGameLabel,
            team_a_name: teamAName,
            team_b_name: teamBName,
          }),
        },
        savedCode,
      );
      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          resetScorerAccess();
        }
        setMessage(payload.error || "Game was not created.");
        return;
      }

      setMessage(`${nextGameLabel} added. You can score it now.`);
      await loadData(savedCode);
      setSelectedMatchId(payload.match?.id || "");
    } catch {
      setMessage("Could not add the game.");
    } finally {
      setLoading(false);
    }
  }

  function startEditGame(match: Match) {
    setEditingMatchId(match.id);
    setEditGameDraft({ teamA: match.team_a_name, teamB: match.team_b_name });
  }

  function cancelEditGame() {
    setEditingMatchId("");
    setEditGameDraft({ teamA: "", teamB: "" });
  }

  async function updateGame(match: Match) {
    const normalizedDraft = normalizeNewGameDraft(editGameDraft, activeTeams);
    const teamAName = normalizedDraft.teamA.trim();
    const teamBName = normalizedDraft.teamB.trim();

    if (!teamAName || !teamBName) {
      setMessage("Choose two teams for the game.");
      return;
    }

    if (teamAName === teamBName) {
      setMessage("Choose two different teams.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await scorerFetch(
        "/api/scorer",
        {
          method: "POST",
          body: JSON.stringify({
            action: "update_match",
            match_id: match.id,
            team_a_name: teamAName,
            team_b_name: teamBName,
          }),
        },
        savedCode,
      );
      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          resetScorerAccess();
        }
        setMessage(payload.error || "Game was not updated.");
        return;
      }

      setMessage(`${matchLabels.get(match.id) || "Game"} updated.`);
      cancelEditGame();
      await loadData(savedCode);
      setSelectedMatchId(match.id);
    } catch {
      setMessage("Could not update the game.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteGame(match: Match) {
    const label = matchLabels.get(match.id) || "this game";
    const shouldDelete = window.confirm(`Delete ${label}? This also removes its saved player stats.`);
    if (!shouldDelete) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await scorerFetch(
        "/api/scorer",
        {
          method: "POST",
          body: JSON.stringify({
            action: "delete_match",
            match_id: match.id,
          }),
        },
        savedCode,
      );
      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          resetScorerAccess();
        }
        setMessage(payload.error || "Game was not deleted.");
        return;
      }

      setMessage(`${label} deleted.`);
      cancelEditGame();
      setSelectedMatchId("");
      await loadData(savedCode);
    } catch {
      setMessage("Could not delete the game.");
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

  function resetScorerAccess() {
    window.localStorage.removeItem(codeStorageKey);
    setSavedCode("");
    setCode("");
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
              <LogoMark />
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
    <main className="min-h-screen bg-[#f4efe7] px-3 py-3 text-[#171717] sm:px-6 sm:py-5">
      <section className="mx-auto max-w-4xl space-y-3 sm:space-y-4">
        <header className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <LogoMark size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-[#16633f]">JC Footy</p>
                <h1 className="truncate text-2xl font-black sm:text-3xl">Live Scorer</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadData(savedCode)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white text-[#16633f] transition hover:bg-[#eef6f1]"
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

        <section className="grid gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5">
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
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base font-black outline-none focus:border-[#1f7a4d]"
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
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base font-black outline-none focus:border-[#1f7a4d]"
            >
              {selectedDateMatches.map((match) => (
                <option key={match.id} value={match.id}>
                  {matchLabels.get(match.id) || "Game"}
                </option>
              ))}
            </select>
          </label>
        </section>

        <CreateGameCard
          teams={activeTeams}
          draft={normalizedNewGameDraft}
          nextGameNumber={selectedDateMatches.length + 1}
          loading={loading}
          onDraftChange={setNewGameDraft}
          onCreateGame={createGame}
        />

        {!selectedMatch ? (
          <section className="rounded-2xl border border-black/10 bg-white p-6 text-center shadow-sm">
            <p className="text-lg font-black">No games found for this date.</p>
            <p className="mt-2 font-bold text-black/55">
              Pick two teams from this date above, add the game, then save the score and player stats here.
            </p>
          </section>
        ) : (
          <>
            {editingMatchId === selectedMatch.id ? (
              <EditGameCard
                teams={activeTeams}
                draft={normalizeNewGameDraft(editGameDraft, activeTeams)}
                loading={loading}
                onDraftChange={setEditGameDraft}
                onCancel={cancelEditGame}
                onUpdate={() => updateGame(selectedMatch)}
              />
            ) : null}

            <ScoreCard
              match={selectedMatch}
              label={matchLabels.get(selectedMatch.id) || "Game"}
              draft={scoreDrafts[selectedMatch.id] || { a: String(selectedMatch.team_a_score || 0), b: String(selectedMatch.team_b_score || 0) }}
              loading={loading}
              onScoreChange={updateScore}
              onStepScore={stepScore}
              onSaveScore={saveScore}
              onStartEdit={startEditGame}
              onDelete={deleteGame}
            />

            <section className="grid gap-3 lg:grid-cols-2">
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

function CreateGameCard({
  teams,
  draft,
  nextGameNumber,
  loading,
  onDraftChange,
  onCreateGame,
}: {
  teams: TournamentTeam[];
  draft: NewGameDraft;
  nextGameNumber: number;
  loading: boolean;
  onDraftChange: (draft: NewGameDraft) => void;
  onCreateGame: () => void;
}) {
  const canCreate = teams.length >= 2 && draft.teamA && draft.teamB && draft.teamA !== draft.teamB;

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-[#16633f]">Teams for this date</p>
          <h2 className="text-2xl font-black">Create Game {nextGameNumber}</h2>
        </div>
        <button
          type="button"
          disabled={loading || !canCreate}
          onClick={onCreateGame}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f7a4d] px-4 py-3 text-base font-black text-white transition hover:bg-[#16633f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
          Add Game
        </button>
      </div>

      {teams.length < 2 ? (
        <p className="rounded-xl bg-[#f7f3ed] p-3 text-sm font-bold text-black/55">
          No team list is available for this date yet. Select a date that already has teams assigned.
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {teams.map((team) => (
              <span
                key={team.id}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f7f3ed] px-3 py-2 text-sm font-black text-black/70"
              >
                <TeamBadge team={team} size="sm" />
                {team.name}
              </span>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
            <TeamSelect
              label="Team A"
              value={draft.teamA}
              teams={teams}
              blockedTeam={draft.teamB}
              onChange={(teamA) => onDraftChange({ ...draft, teamA })}
            />
            <div className="hidden pb-3 text-center text-lg font-black text-black/35 sm:block">vs</div>
            <TeamSelect
              label="Team B"
              value={draft.teamB}
              teams={teams}
              blockedTeam={draft.teamA}
              onChange={(teamB) => onDraftChange({ ...draft, teamB })}
            />
          </div>
        </>
      )}
    </section>
  );
}

function TeamSelect({
  label,
  value,
  teams,
  blockedTeam,
  onChange,
}: {
  label: string;
  value: string;
  teams: TournamentTeam[];
  blockedTeam: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-black uppercase text-black/55">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base font-black outline-none focus:border-[#1f7a4d]"
      >
        {teams.map((team) => (
          <option key={team.id} value={team.name} disabled={team.name === blockedTeam}>
            {team.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function EditGameCard({
  teams,
  draft,
  loading,
  onDraftChange,
  onCancel,
  onUpdate,
}: {
  teams: TournamentTeam[];
  draft: NewGameDraft;
  loading: boolean;
  onDraftChange: (draft: NewGameDraft) => void;
  onCancel: () => void;
  onUpdate: () => void;
}) {
  const canUpdate = teams.length >= 2 && draft.teamA && draft.teamB && draft.teamA !== draft.teamB;

  return (
    <section className="rounded-2xl border border-[#1f7a4d]/25 bg-[#eef6f1] p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-[#16633f]">Edit selected game</p>
          <h2 className="text-2xl font-black">Change matchup</h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-black text-black/70 transition hover:bg-[#f7f3ed]"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
        <TeamSelect
          label="Team A"
          value={draft.teamA}
          teams={teams}
          blockedTeam={draft.teamB}
          onChange={(teamA) => onDraftChange({ ...draft, teamA })}
        />
        <div className="hidden pb-3 text-center text-lg font-black text-black/35 sm:block">vs</div>
        <TeamSelect
          label="Team B"
          value={draft.teamB}
          teams={teams}
          blockedTeam={draft.teamA}
          onChange={(teamB) => onDraftChange({ ...draft, teamB })}
        />
      </div>

      <button
        type="button"
        disabled={loading || !canUpdate}
        onClick={onUpdate}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#171717] px-4 py-3 text-base font-black text-white transition hover:bg-[#1f7a4d] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Save className="h-5 w-5" />
        Save Game Changes
      </button>
    </section>
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
  onStartEdit,
  onDelete,
}: {
  match: Match;
  label: string;
  draft: { a: string; b: string };
  loading: boolean;
  onScoreChange: (matchId: string, side: "a" | "b", value: string) => void;
  onStepScore: (matchId: string, side: "a" | "b", amount: number) => void;
  onSaveScore: (match: Match, status: "live" | "completed") => void;
  onStartEdit: (match: Match) => void;
  onDelete: (match: Match) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black uppercase text-[#16633f]">{label}</p>
          <h2 className="mt-1 break-words text-2xl font-black leading-tight sm:text-3xl">
            {match.team_a_name} vs {match.team_b_name}
          </h2>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-xl bg-[#f7f3ed] px-3 py-2 text-xs font-black capitalize text-black/60 sm:text-sm">
            {match.status}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onStartEdit(match)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-black/65 transition hover:bg-[#f7f3ed]"
              aria-label={`Edit ${label}`}
            >
              <Pencil className="h-5 w-5" />
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => onDelete(match)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
              aria-label={`Delete ${label}`}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)] md:items-end">
        <ScoreInput
          label={match.team_a_name}
          value={draft.a}
          onChange={(value) => onScoreChange(match.id, "a", value)}
          onMinus={() => onStepScore(match.id, "a", -1)}
          onPlus={() => onStepScore(match.id, "a", 1)}
        />
        <div className="hidden pb-4 text-center text-lg font-black text-black/35 md:block">vs</div>
        <ScoreInput
          label={match.team_b_name}
          value={draft.b}
          onChange={(value) => onScoreChange(match.id, "b", value)}
          onMinus={() => onStepScore(match.id, "b", -1)}
          onPlus={() => onStepScore(match.id, "b", 1)}
        />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => onSaveScore(match, "live")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#171717] px-4 py-3 text-base font-black text-white transition hover:bg-black disabled:opacity-60"
        >
          <Save className="h-5 w-5" />
          Save Live
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => onSaveScore(match, "completed")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f7a4d] px-4 py-3 text-base font-black text-white transition hover:bg-[#16633f] disabled:opacity-60"
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
    <div className="min-w-0 rounded-2xl bg-[#f7f3ed] p-3">
      <p className="mb-2 truncate text-sm font-black text-black/65 sm:text-base">{label}</p>
      <div className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)_44px] gap-2">
        <button
          type="button"
          onClick={onMinus}
          className="flex h-12 w-11 items-center justify-center rounded-xl bg-white text-[#171717] shadow-sm"
          aria-label={`Decrease ${label} score`}
        >
          <Minus className="h-5 w-5" />
        </button>
        <input
          type="number"
          min="0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 min-w-0 rounded-xl border border-black/10 bg-white text-center text-2xl font-black outline-none focus:border-[#1f7a4d]"
        />
        <button
          type="button"
          onClick={onPlus}
          className="flex h-12 w-11 items-center justify-center rounded-xl bg-[#1f7a4d] text-white shadow-sm"
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
    <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center gap-3">
        <TeamBadge team={team} />
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-black/45">Player Stats</p>
          <h3 className="truncate text-xl font-black">{teamName}</h3>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="rounded-xl bg-[#f7f3ed] p-3 text-sm font-bold text-black/55">
          No roster found for this team. You can still use the full admin portal if a player is missing.
        </div>
      ) : (
        <div className="space-y-2">
          {players.map((player) => {
            const key = getStatKey(match.id, player.id, teamName);
            const draft = drafts[key] || getDraftFromExisting(stats, match.id, player.id, teamName);

            return (
              <div key={player.id} className="rounded-2xl bg-[#f7f3ed] p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-base font-black">{player.name}</p>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => onSaveStat(match, player, teamName)}
                    className="shrink-0 rounded-xl bg-[#171717] px-3 py-2 text-xs font-black text-white transition hover:bg-[#1f7a4d] disabled:opacity-60"
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
      <div className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)_36px] gap-1">
        <button type="button" onClick={onMinus} className="flex h-10 items-center justify-center rounded-lg bg-white">
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          min="0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 min-w-0 rounded-lg border border-black/10 bg-white text-center text-lg font-black outline-none focus:border-[#1f7a4d]"
        />
        <button type="button" onClick={onPlus} className="flex h-10 items-center justify-center rounded-lg bg-[#1f7a4d] text-white">
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
    <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-[#16633f]" />
        <h3 className="text-xl font-black">Saved Stats</h3>
      </div>
      {matchStats.length === 0 ? (
        <p className="rounded-xl bg-[#f7f3ed] p-3 text-sm font-bold text-black/55">No player stats saved for this game yet.</p>
      ) : (
        <div className="space-y-2">
          {matchStats.map((stat) => (
            <div key={stat.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-xl bg-[#f7f3ed] p-3">
              <div className="min-w-0">
                <p className="truncate font-black">{stat.players?.name || "Player"}</p>
                <p className="truncate text-sm font-bold text-black/50">{stat.team_name}</p>
              </div>
              <p className="shrink-0 font-black">
                {stat.goals} G / {stat.assists} A
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TeamBadge({ team, size = "md" }: { team?: TournamentTeam; size?: "sm" | "md" }) {
  const imageClassName =
    size === "sm"
      ? "h-6 w-6 rounded-full border border-black/10 bg-white object-contain p-0.5"
      : "h-10 w-10 rounded-full border border-black/10 bg-white object-contain p-1";
  const fallbackClassName =
    size === "sm"
      ? "flex h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-white text-[#16633f]"
      : "flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#16633f]";
  const iconClassName = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  if (team?.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={team.logo_url}
        alt=""
        className={imageClassName}
      />
    );
  }

  return (
    <span
      className={fallbackClassName}
      style={{ color: team?.color || "#16633f" }}
    >
      <Users className={iconClassName} />
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

function normalizeNewGameDraft(draft: NewGameDraft, teams: TournamentTeam[]) {
  const teamNames = teams.map((team) => team.name);
  const teamA = teamNames.includes(draft.teamA) ? draft.teamA : teamNames[0] || "";
  const teamB =
    teamNames.includes(draft.teamB) && draft.teamB !== teamA
      ? draft.teamB
      : teamNames.find((teamName) => teamName !== teamA) || "";

  return { teamA, teamB };
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

function scorerFetch(path: string, init: RequestInit, credential: string) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  headers.set("x-scorer-code", credential);

  return fetch(path, {
    ...init,
    headers,
  });
}

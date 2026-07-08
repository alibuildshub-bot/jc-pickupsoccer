"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Edit3,
  Loader2,
  Lock,
  Plus,
  Shield,
  Trash2,
  Users,
} from "lucide-react";

type Player = {
  id: string;
  name: string;
  nickname: string | null;
  position: string | null;
  is_active: boolean;
};

type Match = {
  id: string;
  match_date: string;
  week_label: string;
  location: string | null;
  team_a_name: string;
  team_b_name: string;
  team_a_score: number;
  team_b_score: number;
  status: string;
};

const emptyPlayer = {
  name: "",
  nickname: "",
  position: "",
  is_active: true,
};

const emptyMatch = {
  match_date: new Date().toISOString().slice(0, 10),
  week_label: "",
  location: "",
  team_a_name: "Black",
  team_b_name: "White",
  team_a_score: 0,
  team_b_score: 0,
  status: "completed",
};

export default function AdminPage() {
  const [password, setPassword] = useState(getStoredPassword);
  const [savedPassword, setSavedPassword] = useState(getStoredPassword);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [playerForm, setPlayerForm] = useState(emptyPlayer);
  const [matchForm, setMatchForm] = useState(emptyMatch);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isUnlocked = Boolean(savedPassword);
  const activePlayers = useMemo(() => players.filter((player) => player.is_active), [players]);

  const loadData = useCallback(async (adminPassword = savedPassword) => {
    if (!adminPassword) return;

    setLoading(true);
    setMessage("");

    try {
      const [playersResponse, matchesResponse] = await Promise.all([
        adminFetch("/api/admin/players", { method: "GET" }, adminPassword),
        adminFetch("/api/admin/matches", { method: "GET" }, adminPassword),
      ]);

      setPlayers(playersResponse.players || []);
      setMatches(matchesResponse.matches || []);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [savedPassword]);

  useEffect(() => {
    if (savedPassword) {
      const timeoutId = window.setTimeout(() => loadData(savedPassword), 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [loadData, savedPassword]);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = password.trim();

    if (!trimmed) {
      setMessage("Enter the admin password.");
      return;
    }

    window.localStorage.setItem("jc-admin-password", trimmed);
    setSavedPassword(trimmed);
    await loadData(trimmed);
  }

  function lockDashboard() {
    window.localStorage.removeItem("jc-admin-password");
    setSavedPassword("");
    setPassword("");
    setPlayers([]);
    setMatches([]);
    setMessage("");
  }

  async function savePlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        ...playerForm,
        id: editingPlayerId || undefined,
      };

      await adminFetch(
        "/api/admin/players",
        {
          method: editingPlayerId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
        savedPassword,
      );

      setPlayerForm(emptyPlayer);
      setEditingPlayerId(null);
      setMessage(editingPlayerId ? "Player updated." : "Player added.");
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function deletePlayer(playerId: string) {
    if (!window.confirm("Remove this player? This also removes their match stat rows.")) return;

    setLoading(true);
    setMessage("");

    try {
      await adminFetch(`/api/admin/players?id=${playerId}`, { method: "DELETE" }, savedPassword);
      setMessage("Player removed.");
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function editPlayer(player: Player) {
    setEditingPlayerId(player.id);
    setPlayerForm({
      name: player.name,
      nickname: player.nickname || "",
      position: player.position || "",
      is_active: player.is_active,
    });
  }

  async function saveMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        ...matchForm,
        id: editingMatchId || undefined,
      };

      await adminFetch(
        "/api/admin/matches",
        {
          method: editingMatchId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
        savedPassword,
      );

      setMatchForm(emptyMatch);
      setEditingMatchId(null);
      setMessage(editingMatchId ? "Match updated." : "Match added.");
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function deleteMatch(matchId: string) {
    if (!window.confirm("Remove this match? This also removes player stat rows for the match.")) return;

    setLoading(true);
    setMessage("");

    try {
      await adminFetch(`/api/admin/matches?id=${matchId}`, { method: "DELETE" }, savedPassword);
      setMessage("Match removed.");
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function editMatch(match: Match) {
    setEditingMatchId(match.id);
    setMatchForm({
      match_date: match.match_date,
      week_label: match.week_label,
      location: match.location || "",
      team_a_name: match.team_a_name,
      team_b_name: match.team_b_name,
      team_a_score: match.team_a_score,
      team_b_score: match.team_b_score,
      status: match.status,
    });
  }

  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-8 text-[#171717] sm:px-6">
        <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-black/60 hover:text-black">
            <Shield size={18} />
            JC Pickup Soccer
          </Link>
          <form onSubmit={unlock} className="rounded-lg border border-black/10 bg-white p-6 shadow-sm">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#171717] text-white">
              <Lock size={24} />
            </div>
            <h1 className="text-3xl font-black">Admin Dashboard</h1>
            <p className="mt-2 text-sm leading-6 text-black/60">
              Enter your admin password to manage players, matches, team names, and scores.
            </p>
            <label className="mt-6 block text-sm font-bold text-black/60" htmlFor="password">
              Admin password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-12 w-full rounded-lg border border-black/15 px-4 text-base outline-none focus:border-[#1f7a4d]"
            />
            {message && <p className="mt-4 text-sm font-semibold text-red-700">{message}</p>}
            <button className="mt-6 h-12 w-full rounded-lg bg-[#1f7a4d] text-sm font-black text-white transition hover:bg-[#17613d]">
              Open Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-[#171717]">
      <nav className="border-b border-black/10 bg-[#f7f3ec]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#171717] text-white">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-lg font-black leading-none">JC Pickup Soccer</p>
              <p className="text-xs font-medium text-black/55">Admin dashboard</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData()}
              className="hidden h-10 rounded-lg border border-black/15 bg-white px-4 text-sm font-bold sm:block"
            >
              Refresh
            </button>
            <button
              onClick={lockDashboard}
              className="h-10 rounded-lg bg-[#171717] px-4 text-sm font-bold text-white"
            >
              Lock
            </button>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <AdminMetric icon={Users} label="Active Players" value={String(activePlayers.length)} />
          <AdminMetric icon={CalendarDays} label="Matches" value={String(matches.length)} />
          <AdminMetric icon={Shield} label="Admin Status" value={loading ? "Saving" : "Ready"} />
        </div>

        {message && (
          <div className="mb-6 rounded-lg border border-black/10 bg-white p-4 text-sm font-bold text-black/70">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-black/50">Roster</p>
                <h1 className="text-2xl font-black">Players</h1>
              </div>
              {loading && <Loader2 className="animate-spin text-[#1f7a4d]" size={24} />}
            </div>

            <form onSubmit={savePlayer} className="mb-6 grid gap-3 rounded-lg bg-[#f7f3ec] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <AdminInput
                  label="Player name"
                  value={playerForm.name}
                  onChange={(value) => setPlayerForm({ ...playerForm, name: value })}
                  required
                />
                <AdminInput
                  label="Nickname"
                  value={playerForm.nickname}
                  onChange={(value) => setPlayerForm({ ...playerForm, nickname: value })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <AdminInput
                  label="Position"
                  value={playerForm.position}
                  onChange={(value) => setPlayerForm({ ...playerForm, position: value })}
                  placeholder="Forward, Mid, GK..."
                />
                <label className="flex items-end gap-2 pb-3 text-sm font-bold text-black/60">
                  <input
                    type="checkbox"
                    checked={playerForm.is_active}
                    onChange={(event) => setPlayerForm({ ...playerForm, is_active: event.target.checked })}
                  />
                  Active
                </label>
              </div>
              <div className="flex gap-2">
                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1f7a4d] px-4 text-sm font-black text-white">
                  <Plus size={16} />
                  {editingPlayerId ? "Update Player" : "Add Player"}
                </button>
                {editingPlayerId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPlayerId(null);
                      setPlayerForm(emptyPlayer);
                    }}
                    className="h-11 rounded-lg border border-black/15 bg-white px-4 text-sm font-bold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="space-y-3">
              {players.map((player) => (
                <div key={player.id} className="flex items-center justify-between gap-3 rounded-lg border border-black/10 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-black">{player.name}</p>
                    <p className="text-sm font-semibold text-black/50">
                      {[player.nickname, player.position, player.is_active ? "Active" : "Inactive"].filter(Boolean).join(" | ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <IconButton label="Edit player" onClick={() => editPlayer(player)} icon={Edit3} />
                    <IconButton label="Delete player" onClick={() => deletePlayer(player.id)} icon={Trash2} danger />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-black/50">Game Log</p>
                <h1 className="text-2xl font-black">Matches & Team Names</h1>
              </div>
              <CalendarDays className="text-[#1f7a4d]" size={26} />
            </div>

            <form onSubmit={saveMatch} className="mb-6 grid gap-3 rounded-lg bg-[#f7f3ec] p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <AdminInput
                  type="date"
                  label="Date"
                  value={matchForm.match_date}
                  onChange={(value) => setMatchForm({ ...matchForm, match_date: value })}
                  required
                />
                <AdminInput
                  label="Week label"
                  value={matchForm.week_label}
                  onChange={(value) => setMatchForm({ ...matchForm, week_label: value })}
                  placeholder="Week 2"
                  required
                />
                <AdminInput
                  label="Location"
                  value={matchForm.location}
                  onChange={(value) => setMatchForm({ ...matchForm, location: value })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <AdminInput
                  label="Team A name"
                  value={matchForm.team_a_name}
                  onChange={(value) => setMatchForm({ ...matchForm, team_a_name: value })}
                  required
                />
                <AdminInput
                  label="Team B name"
                  value={matchForm.team_b_name}
                  onChange={(value) => setMatchForm({ ...matchForm, team_b_name: value })}
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <AdminInput
                  type="number"
                  label="Team A score"
                  value={String(matchForm.team_a_score)}
                  onChange={(value) => setMatchForm({ ...matchForm, team_a_score: Number(value) })}
                />
                <AdminInput
                  type="number"
                  label="Team B score"
                  value={String(matchForm.team_b_score)}
                  onChange={(value) => setMatchForm({ ...matchForm, team_b_score: Number(value) })}
                />
                <label className="block">
                  <span className="text-sm font-bold text-black/60">Status</span>
                  <select
                    value={matchForm.status}
                    onChange={(event) => setMatchForm({ ...matchForm, status: event.target.value })}
                    className="mt-2 h-11 w-full rounded-lg border border-black/15 bg-white px-3 text-sm font-semibold outline-none focus:border-[#1f7a4d]"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
              </div>
              <div className="flex gap-2">
                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1f7a4d] px-4 text-sm font-black text-white">
                  <Plus size={16} />
                  {editingMatchId ? "Update Match" : "Add Match"}
                </button>
                {editingMatchId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMatchId(null);
                      setMatchForm(emptyMatch);
                    }}
                    className="h-11 rounded-lg border border-black/15 bg-white px-4 text-sm font-bold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="space-y-3">
              {matches.map((match) => (
                <div key={match.id} className="rounded-lg border border-black/10 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-black/50">{match.match_date}</p>
                      <p className="font-black">{match.week_label}</p>
                    </div>
                    <div className="flex gap-2">
                      <IconButton label="Edit match" onClick={() => editMatch(match)} icon={Edit3} />
                      <IconButton label="Delete match" onClick={() => deleteMatch(match.id)} icon={Trash2} danger />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                    <p className="font-black">{match.team_a_name}</p>
                    <p className="rounded-lg bg-[#171717] px-3 py-2 font-black text-white">
                      {match.team_a_score} - {match.team_b_score}
                    </p>
                    <p className="font-black">{match.team_b_name}</p>
                  </div>
                  {match.location && <p className="mt-3 text-sm font-semibold text-black/50">{match.location}</p>}
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

async function adminFetch(path: string, options: RequestInit, password: string) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": password,
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong.");
  }

  return data;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function getStoredPassword() {
  if (typeof window === "undefined") return "";

  return window.localStorage.getItem("jc-admin-password") || "";
}

function AdminMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <Icon className="mb-4 text-[#1f7a4d]" size={24} />
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-semibold text-black/55">{label}</p>
    </div>
  );
}

function AdminInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-black/60">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-2 h-11 w-full rounded-lg border border-black/15 bg-white px-3 text-sm font-semibold outline-none focus:border-[#1f7a4d]"
      />
    </label>
  );
}

function IconButton({
  label,
  icon: Icon,
  onClick,
  danger = false,
}: {
  label: string;
  icon: typeof Edit3;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
        danger
          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          : "border-black/10 bg-white text-black/70 hover:bg-black/5"
      }`}
    >
      <Icon size={16} />
    </button>
  );
}

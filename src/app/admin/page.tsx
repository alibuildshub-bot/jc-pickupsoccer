"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import {
  CalendarDays,
  Copy,
  Edit3,
  LogIn,
  Loader2,
  Lock,
  MousePointerClick,
  Plus,
  Target,
  Trash2,
  Users,
  Vote,
} from "lucide-react";
import LogoMark from "@/components/LogoMark";
import { createSupabaseClient } from "@/lib/supabase";

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

type PlayerStat = {
  id: string;
  match_id: string;
  player_id: string;
  team_name: string;
  goals: number;
  assists: number;
  result: string;
  players: { name: string } | null;
  matches: { week_label: string; match_date: string } | null;
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

type AuthInfo = {
  allowed: boolean;
  method: string;
  email: string | null;
  hasToken: boolean;
  tokenValid: boolean;
  adminEmailConfigured: boolean;
  serverConfigured: boolean;
  reason: string;
};

type MvpPoll = {
  id: string;
  token: string;
  title: string;
  match_date: string | null;
  status: string;
  totalVotes: number;
  options: Array<{
    id: string;
    label: string;
    votes: number;
  }>;
};

type PastGameSession = {
  rawDate: string;
  date: string;
  matches: Match[];
  teams: string[];
  players: Array<{
    name: string;
    team: string;
    goals: number;
    assists: number;
  }>;
  totalGoals: number;
};

type SiteAnalytics = {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  todayVisitors: number;
  daily: Array<{
    date: string;
    visits: number;
    visitors: number;
  }>;
  topPages: Array<{
    path: string;
    visits: number;
  }>;
};

const defaultPickupDate = getDefaultPickupDate();

const emptyAnalytics: SiteAnalytics = {
  totalVisits: 0,
  uniqueVisitors: 0,
  todayVisits: 0,
  todayVisitors: 0,
  daily: [],
  topPages: [],
};

const emptyPlayer = {
  name: "",
  nickname: "",
  position: "",
  is_active: true,
};

const emptyMatch = {
  match_date: defaultPickupDate,
  start_time: "",
  end_time: "",
  week_label: "",
  location: "",
  team_a_name: "Black",
  team_b_name: "White",
  team_a_score: 0,
  team_b_score: 0,
  status: "scheduled",
};

const emptyTeam = {
  name: "",
  color: "#1f7a4d",
  logo_url: "",
  sort_order: 0,
  is_active: true,
  session_date: defaultPickupDate,
};

export default function AdminPage() {
  const [password, setPassword] = useState(getStoredPassword);
  const [savedPassword, setSavedPassword] = useState(getStoredPassword);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [teamSessionDateSetupNeeded, setTeamSessionDateSetupNeeded] = useState(false);
  const [teamSessionDetailsSetupNeeded, setTeamSessionDetailsSetupNeeded] = useState(false);
  const [teamLogoSetupNeeded, setTeamLogoSetupNeeded] = useState(false);
  const [polls, setPolls] = useState<MvpPoll[]>([]);
  const [pollSetupNeeded, setPollSetupNeeded] = useState(false);
  const [analytics, setAnalytics] = useState<SiteAnalytics>(emptyAnalytics);
  const [analyticsSetupNeeded, setAnalyticsSetupNeeded] = useState(false);
  const [playerForm, setPlayerForm] = useState(emptyPlayer);
  const [matchForm, setMatchForm] = useState(emptyMatch);
  const [teamForm, setTeamForm] = useState(emptyTeam);
  const [rosterForm, setRosterForm] = useState({ team_id: "", player_id: "" });
  const [gameDayForm, setGameDayForm] = useState({
    date: defaultPickupDate,
    start_time: "",
    end_time: "",
    label: "Game",
    location: "",
  });
  const [quickScores, setQuickScores] = useState<Record<string, { team_a_score: string; team_b_score: string }>>({});
  const [quickStatMatchId, setQuickStatMatchId] = useState("");
  const [quickStatDrafts, setQuickStatDrafts] = useState<Record<string, { goals: string; assists: string }>>({});
  const [quickSingleStat, setQuickSingleStat] = useState({
    player_id: "",
    team_name: "",
    goals: "0",
    assists: "0",
  });
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const adminCredential = session?.access_token || savedPassword;
  const isUnlocked = Boolean(adminCredential);
  const activePlayers = useMemo(() => players.filter((player) => player.is_active), [players]);
  const matchGameLabels = useMemo(() => buildGameLabels(matches), [matches]);
  const gameDayMatches = useMemo(
    () =>
      matches
        .filter((match) => match.match_date === gameDayForm.date)
        .sort(sortMatchesByGameOrder),
    [gameDayForm.date, matches],
  );
  const activeTeams = useMemo(
    () => getCurrentSetupTeams(teams, gameDayMatches, gameDayForm.date),
    [gameDayForm.date, gameDayMatches, teams],
  );
  const teamSessionOptions = useMemo(() => buildTeamSessionOptions(teams, matches), [matches, teams]);
  const savedSessionDetails = useMemo(
    () => getSavedSessionDetails(activeTeams, gameDayMatches),
    [activeTeams, gameDayMatches],
  );
  const gameDayMatchIds = useMemo(() => new Set(gameDayMatches.map((match) => match.id)), [gameDayMatches]);
  const gameDayStats = useMemo(
    () => {
      const matchOrder = new Map(gameDayMatches.map((match, index) => [match.id, index]));

      return stats
        .filter((stat) => gameDayMatchIds.has(stat.match_id))
        .sort((first, second) => {
          const firstOrder = matchOrder.get(first.match_id) ?? 999;
          const secondOrder = matchOrder.get(second.match_id) ?? 999;

          return (
            firstOrder - secondOrder ||
            (first.players?.name || getPlayerName(first.player_id)).localeCompare(second.players?.name || getPlayerName(second.player_id))
          );
        });
    },
    [gameDayMatchIds, gameDayMatches, stats],
  );
  const selectedDateIsCompletedSession = useMemo(
    () => gameDayMatches.length > 0 && gameDayMatches.every((match) => match.status === "completed"),
    [gameDayMatches],
  );
  const pollCandidatePlayers = useMemo(
    () => buildPollCandidatePlayers(gameDayMatches, teams, roster, players, gameDayStats, activePlayers),
    [activePlayers, gameDayMatches, gameDayStats, players, roster, teams],
  );
  const pastGameSessions = useMemo(
    () => buildPastGameSessions(matches, stats, players, gameDayForm.date),
    [gameDayForm.date, matches, players, stats],
  );
  const sessionOptions = useMemo(() => buildSessionOptions(matches, stats), [matches, stats]);
  const setupDateIsPast = gameDayForm.date < getTodayDateInput();
  const quickStatSelectedMatchId = gameDayMatches.some((match) => match.id === quickStatMatchId)
    ? quickStatMatchId
    : gameDayMatches[0]?.id || "";
  const quickStatMatch = useMemo(
    () => gameDayMatches.find((match) => match.id === quickStatSelectedMatchId) || null,
    [gameDayMatches, quickStatSelectedMatchId],
  );

  function selectGameDayDate(date: string) {
    setGameDayForm((current) => ({
      ...current,
      date,
      start_time: "",
      end_time: "",
      location: "",
    }));
  }

  function startNewPickup() {
    const date = defaultPickupDate;

    setEditingMatchId(null);
    setEditingTeamId(null);
    setRosterForm({ team_id: "", player_id: "" });
    setGameDayForm((current) => ({ ...current, date }));
    setMatchForm({ ...emptyMatch, match_date: date });
    setTeamForm({ ...emptyTeam, session_date: date });
    setMessage(`Ready to set up ${formatDateLabel(date)}.`);
  }

  function getEmptyMatchForSelectedDate() {
    return {
      ...emptyMatch,
      match_date: gameDayForm.date,
    };
  }

  function getEmptyTeamForSelectedDate() {
    return {
      ...emptyTeam,
      session_date: gameDayForm.date,
    };
  }

  const loadData = useCallback(async (credential = adminCredential) => {
    if (!credential) return;

    setLoading(true);
    setMessage("");

    try {
      const authResponse = await adminFetch("/api/admin/auth", { method: "GET" }, credential);
      setAuthInfo(authResponse.auth);

      if (!authResponse.auth.allowed) {
        setMessage(authResponse.auth.reason || "You are not authorized to manage this site.");
        return;
      }

      const loadErrors: string[] = [];
      const loadSection = async <T,>(label: string, callback: () => Promise<T>) => {
        try {
          return await callback();
        } catch (error) {
          loadErrors.push(`${label}: ${getErrorMessage(error)}`);
          return null;
        }
      };

      const [playersResponse, matchesResponse, statsResponse, teamsResponse, pollsResponse, analyticsResponse] = await Promise.all([
        loadSection("Players", () => adminFetch("/api/admin/players", { method: "GET" }, credential)),
        loadSection("Matches", () => adminFetch("/api/admin/matches", { method: "GET" }, credential)),
        loadSection("Stats", () => adminFetch("/api/admin/stats", { method: "GET" }, credential)),
        loadSection("Teams", () => adminFetch("/api/admin/teams", { method: "GET" }, credential)),
        loadSection("Polls", () => adminFetch("/api/admin/polls", { method: "GET" }, credential)),
        loadSection("Analytics", () => adminFetch("/api/admin/analytics", { method: "GET" }, credential)),
      ]);

      if (playersResponse) setPlayers(playersResponse.players || []);
      if (matchesResponse) setMatches(matchesResponse.matches || []);
      if (statsResponse) setStats(statsResponse.stats || []);
      if (teamsResponse) {
        setTeams(teamsResponse.teams || []);
        setRoster(teamsResponse.roster || []);
        setTeamSessionDateSetupNeeded(Boolean(teamsResponse.teamSessionDateSetupNeeded));
        setTeamSessionDetailsSetupNeeded(Boolean(teamsResponse.teamSessionDetailsSetupNeeded));
        setTeamLogoSetupNeeded(Boolean(teamsResponse.teamLogoSetupNeeded));
      }
      if (pollsResponse) {
        setPolls(pollsResponse.polls || []);
        setPollSetupNeeded(Boolean(pollsResponse.setupNeeded));
      }
      if (analyticsResponse) {
        setAnalytics(analyticsResponse.analytics || emptyAnalytics);
        setAnalyticsSetupNeeded(Boolean(analyticsResponse.setupNeeded));
      }
      if (loadErrors.length > 0) {
        setMessage(`Some admin data did not load. ${loadErrors.join(" | ")}`);
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [adminCredential]);

  useEffect(() => {
    const supabase = createSupabaseClient();
    if (!supabase) {
      const timeoutId = window.setTimeout(() => setAuthLoading(false), 0);

      return () => window.clearTimeout(timeoutId);
    }

    const timeoutId = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setAuthLoading(false);
    }, 0);

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      window.clearTimeout(timeoutId);
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (adminCredential) {
      const timeoutId = window.setTimeout(() => loadData(adminCredential), 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [adminCredential, loadData]);

  useEffect(() => {
    if (!editingMatchId) {
      setMatchForm((current) => ({ ...current, match_date: gameDayForm.date }));
    }
  }, [editingMatchId, gameDayForm.date]);

  useEffect(() => {
    if (!editingTeamId) {
      setTeamForm((current) => ({ ...current, session_date: gameDayForm.date }));
    }
  }, [editingTeamId, gameDayForm.date]);

  useEffect(() => {
    setGameDayForm((current) => {
      const nextStartTime = current.start_time || savedSessionDetails.start_time || "";
      const nextEndTime = current.end_time || savedSessionDetails.end_time || "";
      const nextLocation = current.location || savedSessionDetails.location || "";

      if (
        nextStartTime === current.start_time &&
        nextEndTime === current.end_time &&
        nextLocation === current.location
      ) return current;

      return {
        ...current,
        start_time: nextStartTime,
        end_time: nextEndTime,
        location: nextLocation,
      };
    });
  }, [savedSessionDetails.end_time, savedSessionDetails.location, savedSessionDetails.start_time]);

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

  async function signInWithGoogle() {
    const supabase = createSupabaseClient();

    if (!supabase) {
      setMessage("Supabase login is not configured.");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/admin`,
      },
    });

    if (error) {
      setMessage(error.message);
    }
  }

  async function signOut() {
    const supabase = createSupabaseClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    lockDashboard();
  }

  function lockDashboard() {
    window.localStorage.removeItem("jc-admin-password");
    setSavedPassword("");
    setPassword("");
    setSession(null);
    setPlayers([]);
    setMatches([]);
    setStats([]);
    setTeams([]);
    setRoster([]);
    setTeamSessionDateSetupNeeded(false);
    setTeamSessionDetailsSetupNeeded(false);
    setTeamLogoSetupNeeded(false);
    setPolls([]);
    setPollSetupNeeded(false);
    setAnalytics(emptyAnalytics);
    setAnalyticsSetupNeeded(false);
    setAuthInfo(null);
    setMessage("");
  }

  async function createMvpPoll() {
    setLoading(true);
    setMessage("");

    try {
      const response = await adminFetch(
        "/api/admin/polls",
        {
          method: "POST",
          body: JSON.stringify({
            title: `JC Footy Tournament MVP - ${formatDateLabel(gameDayForm.date)}`,
            match_date: gameDayForm.date,
            player_ids: pollCandidatePlayers.map((player) => player.id),
          }),
        },
        adminCredential,
      );

      const pollUrl = getPollUrl(response.poll.token);
      await copyText(pollUrl);
      setMessage("MVP poll created and link copied.");
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function copyPollLink(token: string) {
    await copyText(getPollUrl(token));
    setMessage("Poll link copied.");
  }

  async function resetPollVotes(pollId: string) {
    if (!window.confirm("Reset all votes for this MVP poll? The poll link and player options will stay.")) return;

    setLoading(true);
    setMessage("");

    try {
      await adminFetch(
        "/api/admin/polls",
        {
          method: "POST",
          body: JSON.stringify({ id: pollId, action: "reset_votes" }),
        },
        adminCredential,
      );
      setMessage("MVP poll votes reset.");
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function removePollPlayer(poll: MvpPoll, option: MvpPoll["options"][number]) {
    if (
      !window.confirm(
        option.votes > 0
          ? `Remove ${option.label} from this poll? This will also remove their ${option.votes} vote${option.votes === 1 ? "" : "s"}.`
          : `Remove ${option.label} from this poll?`,
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await adminFetch(
        "/api/admin/polls",
        {
          method: "POST",
          body: JSON.stringify({
            id: poll.id,
            action: "remove_option",
            option_id: option.id,
          }),
        },
        adminCredential,
      );
      setMessage(`${option.label} removed from the MVP poll.`);
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function syncPollPlayers(poll: MvpPoll) {
    const pollDate = poll.match_date || gameDayForm.date;
    const pollMatches = matches.filter((match) => match.match_date === pollDate);
    const pollStats = stats.filter((stat) => pollMatches.some((match) => match.id === stat.match_id));
    const candidates = buildPollCandidatePlayers(pollMatches, teams, roster, players, pollStats, activePlayers);

    if (candidates.length < 2) {
      setMessage("No rostered players found for this poll date.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await adminFetch(
        "/api/admin/polls",
        {
          method: "POST",
          body: JSON.stringify({
            id: poll.id,
            action: "sync_options",
            player_ids: candidates.map((player) => player.id),
          }),
        },
        adminCredential,
      );

      setMessage(
        response.added > 0
          ? `${response.added} missing player${response.added === 1 ? "" : "s"} added to the MVP poll.`
          : "MVP poll already has every rostered player for this date.",
      );
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function togglePollStatus(poll: MvpPoll) {
    setLoading(true);
    setMessage("");

    try {
      await adminFetch(
        "/api/admin/polls",
        {
          method: "POST",
          body: JSON.stringify({
            id: poll.id,
            action: poll.status === "open" ? "close" : "open",
          }),
        },
        adminCredential,
      );
      setMessage(poll.status === "open" ? "MVP poll closed." : "MVP poll reopened.");
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function deletePoll(pollId: string) {
    if (!window.confirm("Delete this MVP poll completely? This removes the link, options, and votes.")) return;

    setLoading(true);
    setMessage("");

    try {
      await adminFetch(`/api/admin/polls?id=${pollId}`, { method: "DELETE" }, adminCredential);
      setMessage("MVP poll deleted.");
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function createGameDayMatchups() {
    if (activeTeams.length < 2) {
      setMessage("Add at least two active teams first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const pairings = getTeamPairings(activeTeams);
      const existingKeys = new Set(
        matches
          .filter((match) => match.match_date === gameDayForm.date)
          .map((match) => getMatchupKey(match.team_a_name, match.team_b_name)),
      );
      const newPairings = pairings.filter(([teamA, teamB]) => !existingKeys.has(getMatchupKey(teamA.name, teamB.name)));

      if (newPairings.length === 0) {
        setMessage("All matchups for this date already exist.");
        return;
      }

      await Promise.all(
        newPairings.map(([teamA, teamB], index) =>
          adminFetch(
            "/api/admin/matches",
            {
              method: "POST",
              body: JSON.stringify({
                match_date: gameDayForm.date,
                start_time: gameDayForm.start_time,
                end_time: gameDayForm.end_time,
                week_label: `${gameDayForm.label || "Game"} ${gameDayMatches.length + index + 1}`,
                location: gameDayForm.location,
                team_a_name: teamA.name,
                team_b_name: teamB.name,
                team_a_score: 0,
                team_b_score: 0,
                status: "scheduled",
              }),
            },
            adminCredential,
          ),
        ),
      );

      setMessage(`${newPairings.length} matchups created.`);
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function saveQuickScore(match: Match, nextStatus?: "live" | "completed") {
    const score = quickScores[match.id];
    const teamAScore = score?.team_a_score ?? String(match.team_a_score);
    const teamBScore = score?.team_b_score ?? String(match.team_b_score);
    const status = nextStatus || (match.status === "completed" ? "completed" : "live");

    setLoading(true);
    setMessage("");

    try {
      await adminFetch(
        "/api/admin/matches",
        {
          method: "PATCH",
          body: JSON.stringify({
            ...match,
            team_a_score: Number(teamAScore || 0),
            team_b_score: Number(teamBScore || 0),
            status,
          }),
        },
        adminCredential,
      );

      setMessage(status === "completed" ? "Final score saved." : "Live score saved.");
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
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
        adminCredential,
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
      await adminFetch(`/api/admin/players?id=${playerId}`, { method: "DELETE" }, adminCredential);
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
        week_label:
          matchForm.week_label.trim() ||
          `Game ${getNextGameNumber(matches, matchForm.match_date, editingMatchId || undefined)}`,
      };

      await adminFetch(
        "/api/admin/matches",
        {
          method: editingMatchId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
        adminCredential,
      );

      setMatchForm(getEmptyMatchForSelectedDate());
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
      await adminFetch(`/api/admin/matches?id=${matchId}`, { method: "DELETE" }, adminCredential);
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
      start_time: match.start_time || "",
      end_time: match.end_time || "",
      week_label: match.week_label,
      location: match.location || "",
      team_a_name: match.team_a_name,
      team_b_name: match.team_b_name,
      team_a_score: match.team_a_score,
      team_b_score: match.team_b_score,
      status: match.status,
    });
  }

  async function saveTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        ...teamForm,
        session_start_time: gameDayForm.start_time,
        session_end_time: gameDayForm.end_time,
        session_location: gameDayForm.location,
        id: editingTeamId || undefined,
      };

      await adminFetch(
        "/api/admin/teams",
        {
          method: editingTeamId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
        adminCredential,
      );

      setTeamForm(getEmptyTeamForSelectedDate());
      setEditingTeamId(null);
      setMessage(editingTeamId ? "Team updated." : "Team added.");
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function savePickupDetails() {
    if (activeTeams.length === 0) {
      setMessage("Add at least one team for this pickup before saving time and place.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await adminFetch(
        "/api/admin/teams",
        {
          method: "POST",
          body: JSON.stringify({
            action: "save_session_details",
            session_date: gameDayForm.date,
            session_start_time: gameDayForm.start_time,
            session_end_time: gameDayForm.end_time,
            session_location: gameDayForm.location,
          }),
        },
        adminCredential,
      );

      setMessage("Pickup time and place saved.");
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function deleteTeam(teamId: string) {
    if (!window.confirm("Remove this team and its roster assignments?")) return;

    setLoading(true);
    setMessage("");

    try {
      await adminFetch(`/api/admin/teams?id=${teamId}`, { method: "DELETE" }, adminCredential);
      setMessage("Team removed.");
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function editTeam(team: TournamentTeam) {
    setEditingTeamId(team.id);
    setTeamForm({
      name: team.name,
      color: team.color || "#1f7a4d",
      logo_url: team.logo_url || "",
      sort_order: team.sort_order,
      is_active: team.is_active,
      session_date: team.session_date || gameDayForm.date,
    });
    setGameDayForm((current) => ({
      ...current,
      start_time: team.session_start_time || current.start_time,
      end_time: team.session_end_time || current.end_time,
      location: team.session_location || current.location,
    }));
  }

  async function addPlayerToTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await adminFetch(
        "/api/admin/teams",
        {
          method: "POST",
          body: JSON.stringify({
            action: "add_player",
            team_id: rosterForm.team_id,
            player_id: rosterForm.player_id,
          }),
        },
        adminCredential,
      );

      setRosterForm({ team_id: rosterForm.team_id, player_id: "" });
      setMessage("Player assigned to team.");
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function removePlayerFromTeam(teamId: string, playerId: string) {
    setLoading(true);
    setMessage("");

    try {
      await adminFetch(
        "/api/admin/teams",
        {
          method: "POST",
          body: JSON.stringify({
            action: "remove_player",
            team_id: teamId,
            player_id: playerId,
          }),
        },
        adminCredential,
      );

      setMessage("Player removed from team.");
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function saveQuickPlayerStat(match: Match, player: Player, teamName: string) {
    setLoading(true);
    setMessage("");

    try {
      const draft = getQuickStatDraft(match.id, player.id, teamName);

      const response = await adminFetch(
        "/api/admin/stats",
        {
          method: "POST",
          body: JSON.stringify({
            match_id: match.id,
            player_id: player.id,
            team_name: teamName,
            goals: Number(draft.goals || 0),
            assists: Number(draft.assists || 0),
          }),
        },
        adminCredential,
      );

      setMessage(response.updatedExisting ? `${player.name} updated.` : `${player.name} added to stats.`);
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function saveQuickSinglePlayerStat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const statMatch = getStatMatchForTeam(quickSingleStat.team_name);

    if (!statMatch) {
      setMessage("Mark at least one game for that team Live or Completed first.");
      return;
    }

    const existingStatsForDay = stats.filter(
      (stat) =>
        gameDayMatchIds.has(stat.match_id) &&
        stat.player_id === quickSingleStat.player_id &&
        normalizeAdminLabel(stat.team_name) === normalizeAdminLabel(quickSingleStat.team_name),
    );

    if (existingStatsForDay.length > 0) {
      setMessage("This player already has match-by-match stats for this date. Edit the saved game rows below so totals stay accurate.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await adminFetch(
        "/api/admin/stats",
        {
          method: "POST",
          body: JSON.stringify({
            match_id: statMatch.id,
            player_id: quickSingleStat.player_id,
            team_name: quickSingleStat.team_name,
            goals: Number(quickSingleStat.goals || 0),
            assists: Number(quickSingleStat.assists || 0),
          }),
        },
        adminCredential,
      );
      const playerName = getPlayerName(quickSingleStat.player_id);

      setQuickSingleStat({
        player_id: "",
        team_name: quickSingleStat.team_name,
        goals: "0",
        assists: "0",
      });
      setMessage(response.updatedExisting ? `${playerName} updated.` : `${playerName} day totals saved.`);
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function updateQuickStatDraft(matchId: string, playerId: string, teamName: string, field: "goals" | "assists", value: string) {
    const key = getQuickStatKey(matchId, playerId, teamName);
    const current = getQuickStatDraft(matchId, playerId, teamName);

    setQuickStatDrafts({
      ...quickStatDrafts,
      [key]: {
        ...current,
        [field]: value,
      },
    });
  }

  function adjustQuickStatDraft(matchId: string, playerId: string, teamName: string, field: "goals" | "assists", amount: number) {
    const current = getQuickStatDraft(matchId, playerId, teamName);
    const nextValue = Math.max(0, Number(current[field] || 0) + amount);

    updateQuickStatDraft(matchId, playerId, teamName, field, String(nextValue));
  }

  async function deleteStat(statId: string) {
    if (!window.confirm("Remove this player stat row?")) return;

    setLoading(true);
    setMessage("");

    try {
      await adminFetch(`/api/admin/stats?id=${statId}`, { method: "DELETE" }, adminCredential);
      setMessage("Player stat removed.");
      await loadData();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function editStat(stat: PlayerStat) {
    setQuickStatMatchId(stat.match_id);
    setQuickStatDrafts({
      ...quickStatDrafts,
      [getQuickStatKey(stat.match_id, stat.player_id, stat.team_name)]: {
        goals: String(stat.goals),
        assists: String(stat.assists),
      },
    });
    setMessage(`Loaded ${stat.players?.name || getPlayerName(stat.player_id)} into match-by-match stats. Update goals or assists, then press Save.`);
  }

  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-8 text-[#171717] sm:px-6">
        <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-black/60 hover:text-black">
            <LogoMark size="sm" />
            JC Pickup Soccer
          </Link>
          <form onSubmit={unlock} className="rounded-lg border border-black/10 bg-white p-6 shadow-sm">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#171717] text-white">
              <Lock size={24} />
            </div>
            <h1 className="text-3xl font-black">Admin Dashboard</h1>
            <p className="mt-2 text-sm leading-6 text-black/60">
              Sign in with your approved Google account to manage players, matches, team names, and scores.
            </p>
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={authLoading}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#1f7a4d] text-sm font-black text-white transition hover:bg-[#17613d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {authLoading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
              Continue with Google
            </button>
            <div className="my-5 h-px bg-black/10" />
            <p className="text-xs font-bold uppercase tracking-wide text-black/40">Password fallback</p>
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
            <button className="mt-6 h-12 w-full rounded-lg border border-black/15 bg-white text-sm font-black text-black transition hover:bg-black/5">
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
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <LogoMark />
            <div className="min-w-0">
              <p className="truncate text-base font-black leading-none sm:text-lg">JC Pickup Soccer</p>
              <p className="truncate text-[11px] font-medium text-black/55 sm:text-xs">
                {session?.user.email ? `Signed in as ${session.user.email}` : "Admin dashboard"}
              </p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              onClick={() => loadData()}
              className="hidden h-10 rounded-lg border border-black/15 bg-white px-4 text-sm font-bold sm:block"
            >
              Refresh
            </button>
            <button
              onClick={signOut}
              className="h-9 rounded-lg bg-[#171717] px-3 text-xs font-bold text-white sm:h-10 sm:px-4 sm:text-sm"
            >
              Lock
            </button>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:gap-4 lg:grid-cols-4">
          <AdminMetric icon={Users} label="Active Players" value={String(activePlayers.length)} />
          <AdminMetric icon={Users} label="Teams" value={String(teams.filter((team) => team.is_active).length)} />
          <AdminMetric icon={CalendarDays} label="Current Games" value={String(gameDayMatches.length)} />
          <AdminMetric icon={Target} label="Current Stat Rows" value={String(gameDayStats.length)} />
        </div>

        <section className="mb-5 rounded-lg border border-black/10 bg-white p-4 shadow-sm sm:mb-6 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-black/50">Site Analytics</p>
              <h1 className="text-2xl font-black">Visitor Tracking</h1>
            </div>
            <MousePointerClick className="text-[#1f7a4d]" size={26} />
          </div>

          {analyticsSetupNeeded ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
              Analytics table is not set up yet. Run supabase-site-analytics.sql in Supabase, then refresh this page.
            </div>
          ) : (
            <>
              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <AdminMiniMetric label="Total Visits" value={String(analytics.totalVisits)} />
                <AdminMiniMetric label="Unique Visitors" value={String(analytics.uniqueVisitors)} />
                <AdminMiniMetric label="Today" value={String(analytics.todayVisits)} />
                <AdminMiniMetric label="Today Unique" value={String(analytics.todayVisitors)} />
              </div>
              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-lg bg-[#fbfaf7] p-4">
                  <p className="mb-3 text-xs font-black uppercase text-black/45">Recent Days</p>
                  {analytics.daily.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.daily.map((day) => (
                        <div key={day.date} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm">
                          <span className="font-black">{day.date}</span>
                          <span className="font-bold text-black/55">{day.visits} visits</span>
                          <span className="font-bold text-black/55">{day.visitors} unique</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg bg-white px-3 py-4 text-sm font-bold text-black/50">
                      Visits will appear after people open the public site.
                    </p>
                  )}
                </div>
                <div className="rounded-lg bg-[#fbfaf7] p-4">
                  <p className="mb-3 text-xs font-black uppercase text-black/45">Top Pages</p>
                  {analytics.topPages.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.topPages.map((page) => (
                        <div key={page.path} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm">
                          <span className="min-w-0 truncate font-black">{page.path}</span>
                          <span className="shrink-0 font-bold text-black/55">{page.visits}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg bg-white px-3 py-4 text-sm font-bold text-black/50">
                      Top pages will appear after visits are tracked.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </section>

        {message && (
          <div className="mb-6 rounded-lg border border-black/10 bg-white p-4 text-sm font-bold text-black/70">
            {message}
          </div>
        )}

        {authInfo && (
          <div className="mb-6 rounded-lg border border-black/10 bg-white p-4 text-sm text-black/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-black">Admin auth check</p>
                <p className="mt-1 font-semibold">{authInfo.reason}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  authInfo.allowed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {authInfo.allowed ? "Allowed" : "Blocked"}
              </span>
            </div>
            <div className="mt-4 grid gap-2 text-xs font-bold sm:grid-cols-2 lg:grid-cols-4">
              <p>Signed in as: {authInfo.email || session?.user.email || "No Google email detected"}</p>
              <p>Login method: {authInfo.method}</p>
              <p>ADMIN_EMAIL set: {authInfo.adminEmailConfigured ? "Yes" : "No"}</p>
              <p>Secret key set: {authInfo.serverConfigured ? "Yes" : "No"}</p>
            </div>
          </div>
        )}

        <section className="mb-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-black/50">Results</p>
              <h1 className="text-2xl font-black">Past Games</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-black/55">
                Completed sessions are saved here in one place. Open a date only when you need to review games, teams, or player stats.
              </p>
            </div>
            <CalendarDays className="text-[#1f7a4d]" size={26} />
          </div>
          {pastGameSessions.length === 0 ? (
            <div className="rounded-lg border border-black/10 bg-[#fbfaf7] p-4 text-sm font-bold text-black/50">
              Past games will appear after a completed session.
            </div>
          ) : (
            <div className="grid gap-4">
              {pastGameSessions.map((session) => (
                <details key={session.rawDate} className="group rounded-lg border border-black/10 bg-[#fbfaf7] p-4">
                  <summary className="list-none cursor-pointer">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase text-[#1f7a4d]">Completed session</p>
                        <h2 className="text-xl font-black">{session.date}</h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-white px-3 py-2 text-xs font-black text-black/55">
                          {session.matches.length} games
                        </span>
                        <span className="rounded-lg bg-white px-3 py-2 text-xs font-black text-black/55">
                          {session.totalGoals} goals
                        </span>
                        <span className="rounded-lg bg-white px-3 py-2 text-xs font-black text-black/55">
                          {session.players.length} players
                        </span>
                        <span className="rounded-lg bg-[#171717] px-3 py-2 text-xs font-black text-white">
                          <span className="group-open:hidden">View details</span>
                          <span className="hidden group-open:inline">Hide details</span>
                        </span>
                      </div>
                    </div>
                  </summary>

                  <div className="mt-4 grid gap-3 border-t border-black/10 pt-4 lg:grid-cols-[1fr_0.75fr]">
                    <div className="rounded-lg bg-white p-3 sm:p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase text-black/45">Games</p>
                        <button
                          type="button"
                          onClick={() => selectGameDayDate(session.rawDate)}
                          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-black text-black/70 hover:bg-black/5"
                        >
                          Edit This Date
                        </button>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        {session.matches.map((match) => (
                          <div key={match.id} className="rounded-lg bg-[#f7f3ec] px-3 py-2">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-xs font-black uppercase text-[#1f7a4d]">{matchGameLabels.get(match.id)}</p>
                              <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-black/45">
                                {formatMatchStatus(match.status)}
                              </span>
                            </div>
                            <p className="text-sm font-black">
                              {match.team_a_name} {match.team_a_score} - {match.team_b_score} {match.team_b_name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg bg-white p-3 sm:p-4">
                      <p className="mb-3 text-xs font-black uppercase text-black/45">Teams</p>
                      <div className="flex flex-wrap gap-2">
                        {session.teams.map((team) => (
                          <span key={`${session.rawDate}-${team}`} className="rounded-lg bg-[#f7f3ec] px-3 py-2 text-sm font-black">
                            {team}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg bg-white p-3 sm:p-4 lg:col-span-2">
                      <p className="mb-3 text-xs font-black uppercase text-black/45">Player Stats</p>
                      {session.players.length === 0 ? (
                        <p className="rounded-lg bg-[#f7f3ec] px-3 py-4 text-sm font-semibold text-black/50">
                          No player stats entered.
                        </p>
                      ) : (
                        <div className="grid gap-2 lg:grid-cols-2">
                          {session.players.map((player, index) => (
                            <div key={`${session.rawDate}-${player.name}-${player.team}`} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg bg-[#f7f3ec] px-3 py-2 text-sm sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#edf4f0] text-xs font-black text-[#17613d]">
                                {index + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-black">{player.name}</p>
                                <p className="truncate text-xs font-bold text-black/45">{player.team}</p>
                              </div>
                              <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-1 sm:justify-end">
                                <span className="rounded-lg bg-white px-2 py-1 font-bold text-black/55">{player.goals} G</span>
                                <span className="rounded-lg bg-white px-2 py-1 font-bold text-black/55">{player.assists} A</span>
                                <span className="rounded-lg bg-[#171717] px-2 py-1 font-black text-white">
                                  {player.goals + player.assists} G+A
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>

        <section className="mb-5 rounded-lg border border-black/10 bg-white p-4 shadow-sm sm:mb-6 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 lg:mb-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold text-black/50 sm:text-sm">Game Day Console</p>
              <h1 className="text-xl font-black sm:text-2xl">Run {formatDateLabel(gameDayForm.date)}</h1>
              <p className="mt-2 max-w-2xl text-xs font-semibold leading-5 text-black/55 sm:text-sm sm:leading-6">
                Create the matchups, save scores as games end, and enter goals or assists from one place.
              </p>
            </div>
            <button
              type="button"
              onClick={createGameDayMatchups}
              disabled={loading || activeTeams.length < 2}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1f7a4d] px-4 text-sm font-black text-white transition hover:bg-[#17613d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={16} />
              Create Matchups
            </button>
          </div>

          <div className="mb-4 grid gap-3 md:mb-5 md:grid-cols-3">
            <AdminSelect
              label="Previous sessions"
              value={sessionOptions.some((sessionOption) => sessionOption.date === gameDayForm.date) ? gameDayForm.date : ""}
              onChange={(value) => {
                if (value) selectGameDayDate(value);
              }}
            >
              <option value="">Open previous match date</option>
              {sessionOptions.map((sessionOption) => (
                <option key={sessionOption.date} value={sessionOption.date}>
                  {sessionOption.label}
                </option>
              ))}
            </AdminSelect>
            <AdminInput
              type="date"
              label="Tournament date"
              value={gameDayForm.date}
              onChange={selectGameDayDate}
            />
            <AdminInput
              label="Game label"
              value={gameDayForm.label}
              onChange={(value) => setGameDayForm({ ...gameDayForm, label: value })}
              placeholder="Game"
            />
          </div>

          {selectedDateIsCompletedSession && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
              This completed session is saved in Past Games. Only edit it here if you need to correct an old score or stat.
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr] xl:gap-5">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-black">Scores</h2>
                <p className="text-sm font-bold text-black/45">{gameDayMatches.length} games</p>
              </div>
              {gameDayMatches.length === 0 ? (
                <div className="rounded-lg border border-black/10 bg-[#fbfaf7] p-4 text-sm font-bold text-black/50">
                  No games for this date yet. Create matchups to start the day.
                </div>
              ) : (
                <div className="grid gap-3">
                  {gameDayMatches.map((match) => (
                    <article key={match.id} className="rounded-lg border border-black/10 bg-[#fbfaf7] p-3 sm:p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-black/50 sm:text-sm">{match.week_label}</p>
                          <p className="text-xs font-black uppercase text-[#1f7a4d]">
                            {matchGameLabels.get(match.id)}
                          </p>
                          <p className="text-sm font-black sm:text-base">
                            {match.team_a_name} vs {match.team_b_name}
                          </p>
                        </div>
                        <span className="rounded-lg bg-white px-3 py-2 text-xs font-black text-black/55">
                          {formatMatchStatus(match.status)}
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:gap-3">
                        <AdminInput
                          type="number"
                          label={match.team_a_name}
                          value={quickScores[match.id]?.team_a_score ?? String(match.team_a_score)}
                          onChange={(value) =>
                            setQuickScores({
                              ...quickScores,
                              [match.id]: {
                                team_a_score: value,
                                team_b_score: quickScores[match.id]?.team_b_score ?? String(match.team_b_score),
                              },
                            })
                          }
                        />
                        <AdminInput
                          type="number"
                          label={match.team_b_name}
                          value={quickScores[match.id]?.team_b_score ?? String(match.team_b_score)}
                          onChange={(value) =>
                            setQuickScores({
                              ...quickScores,
                              [match.id]: {
                                team_a_score: quickScores[match.id]?.team_a_score ?? String(match.team_a_score),
                                team_b_score: value,
                              },
                            })
                          }
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => saveQuickScore(match)}
                            className="h-10 rounded-lg bg-[#171717] px-3 text-xs font-black text-white sm:h-11 sm:px-4 sm:text-sm"
                          >
                            {match.status === "completed" ? "Update Final" : "Save Live"}
                          </button>
                          <button
                            type="button"
                            onClick={() => saveQuickScore(match, "completed")}
                            className="h-10 rounded-lg bg-[#1f7a4d] px-3 text-xs font-black text-white sm:h-11 sm:px-4 sm:text-sm"
                          >
                            Complete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-3 font-black">Match-by-match Stats</h2>
              <div className="grid gap-3 rounded-lg border border-black/10 bg-[#fbfaf7] p-3 sm:p-4">
                <p className="rounded-lg bg-white p-3 text-xs font-bold leading-5 text-black/50">
                  Select one game, save that game&apos;s score as Live or Completed, then enter each player&apos;s goals and assists.
                  Win/loss/draw is calculated automatically from the saved score.
                </p>
                <AdminSelect
                  label="Game"
                  value={quickStatSelectedMatchId}
                  onChange={(value) => setQuickStatMatchId(value)}
                  required
                >
                  <option value="">Select game</option>
                  {gameDayMatches.map((match) => (
                    <option key={match.id} value={match.id}>
                      {formatMatchOption(match, matchGameLabels)}
                    </option>
                  ))}
                </AdminSelect>
                {!quickStatMatch ? (
                  <div className="rounded-lg border border-black/10 bg-white p-4 text-sm font-bold text-black/50">
                    Create games for this date first.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs font-black uppercase text-[#17613d]">{quickStatMatch.week_label}</p>
                      <p className="mt-1 text-xs font-black sm:text-sm">
                        {quickStatMatch.team_a_name} {quickStatMatch.team_a_score} - {quickStatMatch.team_b_score} {quickStatMatch.team_b_name}
                      </p>
                      <p className="mt-1 text-xs font-bold capitalize text-black/45">
                        Status: {quickStatMatch.status}. Result is added to each player when their stat is saved.
                      </p>
                    </div>
                    <QuickStatTeamSheet
                      match={quickStatMatch}
                      teamName={quickStatMatch.team_a_name}
                      players={getPlayersForTeamName(quickStatMatch.team_a_name)}
                      getDraft={getQuickStatDraft}
                      updateDraft={updateQuickStatDraft}
                      adjustDraft={adjustQuickStatDraft}
                      savePlayerStat={saveQuickPlayerStat}
                      loading={loading}
                    />
                    <QuickStatTeamSheet
                      match={quickStatMatch}
                      teamName={quickStatMatch.team_b_name}
                      players={getPlayersForTeamName(quickStatMatch.team_b_name)}
                      getDraft={getQuickStatDraft}
                      updateDraft={updateQuickStatDraft}
                      adjustDraft={adjustQuickStatDraft}
                      savePlayerStat={saveQuickPlayerStat}
                      loading={loading}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold text-black/50">After the Tournament</p>
              <h1 className="text-2xl font-black">Tournament MVP Poll</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-black/55">
                Create one vote for the full tournament day after all games are finished, then send it to the group chat.
                {pollCandidatePlayers.length > 0
                  ? ` Polls will include ${pollCandidatePlayers.length} players from the teams that played this day.`
                  : " Add teams, rosters, or player stats first to limit the poll to players who participated."}
              </p>
            </div>
            <button
              type="button"
              onClick={createMvpPoll}
              disabled={loading || pollCandidatePlayers.length < 2}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1f7a4d] px-4 text-sm font-black text-white transition hover:bg-[#17613d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Vote size={16} />
              Create Tournament Poll
            </button>
          </div>

          {pollSetupNeeded ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
              MVP poll tables are not set up yet. Run the SQL file named supabase-mvp-polls.sql in Supabase first.
            </div>
          ) : polls.length === 0 ? (
            <div className="rounded-lg border border-black/10 bg-[#f7f3ec] p-4 text-sm font-bold text-black/50">
              No tournament MVP polls yet.
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {polls.map((poll) => (
                <article key={poll.id} className="rounded-lg border border-black/10 bg-[#fbfaf7] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-black">{getTournamentPollTitle(poll)}</h2>
                      <p className="mt-1 text-sm font-semibold text-black/50">
                        {poll.totalVotes} votes | {poll.status}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyPollLink(poll.token)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-xs font-black text-black/70 hover:bg-black/5"
                    >
                      <Copy size={14} />
                      Copy Link
                    </button>
                  </div>
                  <div className="mt-4 space-y-2">
                    {poll.options.map((option) => (
                      <div key={option.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                        <span className="min-w-0 break-words text-sm font-bold">{option.label}</span>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-black">{option.votes}</span>
                          <button
                            type="button"
                            onClick={() => removePollPlayer(poll, option)}
                            disabled={loading}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label={`Remove ${option.label} from poll`}
                            title={`Remove ${option.label}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-black/10 pt-4">
                    <button
                      type="button"
                      onClick={() => syncPollPlayers(poll)}
                      disabled={loading}
                      className="h-10 rounded-lg border border-black/10 bg-white px-3 text-xs font-black text-black/70 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Sync Players
                    </button>
                    <button
                      type="button"
                      onClick={() => resetPollVotes(poll.id)}
                      className="h-10 rounded-lg border border-black/10 bg-white px-3 text-xs font-black text-black/70 hover:bg-black/5"
                    >
                      Reset Votes
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePollStatus(poll)}
                      className="h-10 rounded-lg border border-black/10 bg-white px-3 text-xs font-black text-black/70 hover:bg-black/5"
                    >
                      {poll.status === "open" ? "Close Poll" : "Reopen Poll"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePoll(poll.id)}
                      className="h-10 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 hover:bg-red-100"
                    >
                      Delete Poll
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mb-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-black/50">Tournament Setup</p>
              <h1 className="text-2xl font-black">Teams & Rosters</h1>
            </div>
            <div className="flex items-center gap-3">
              {setupDateIsPast && (
                <button
                  type="button"
                  onClick={startNewPickup}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#171717] px-4 text-sm font-black text-white"
                >
                  <Plus size={16} />
                  Start New Pickup
                </button>
              )}
              <Users className="text-[#1f7a4d]" size={26} />
            </div>
          </div>

          {setupDateIsPast && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
              You are viewing an older pickup date. Click Start New Pickup before adding teams for the next run.
            </div>
          )}

          {teamSessionDateSetupNeeded && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
              Team pickup dates are not set up in Supabase yet. Run supabase-team-session-dates.sql, then refresh this page before adding teams.
            </div>
          )}

          {teamSessionDetailsSetupNeeded && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
              Pickup time and place are not set up in Supabase yet. Run supabase-team-session-details.sql, then refresh this page.
            </div>
          )}

          {teamLogoSetupNeeded && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
              Team logos are not set up in Supabase yet. Run supabase-team-logos.sql, then refresh this page.
            </div>
          )}

          {teamSessionOptions.length > 0 && (
            <div className="mb-5 rounded-lg border border-black/10 bg-[#fbfaf7] p-3">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-black uppercase tracking-wide text-black/45">Team dates</p>
                <p className="text-xs font-bold text-black/45">Pick a date to view or edit its teams.</p>
              </div>
              <div className="mb-3 sm:max-w-xs">
                <AdminSelect
                  label="Filter teams by date"
                  value={teamSessionOptions.some((option) => option.date === gameDayForm.date) ? gameDayForm.date : ""}
                  onChange={(value) => {
                    if (value) selectGameDayDate(value);
                  }}
                >
                  <option value="">Select pickup date</option>
                  {teamSessionOptions.map((option) => (
                    <option key={`select-${option.date}`} value={option.date}>
                      {option.label} - {option.teamCount} {option.teamCount === 1 ? "team" : "teams"}
                    </option>
                  ))}
                </AdminSelect>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {teamSessionOptions.map((option) => (
                  <button
                    key={option.date}
                    type="button"
                    onClick={() => selectGameDayDate(option.date)}
                    className={`shrink-0 rounded-lg border px-3 py-2 text-left text-xs font-black transition ${
                      option.date === gameDayForm.date
                        ? "border-[#1f7a4d] bg-[#1f7a4d] text-white"
                        : "border-black/10 bg-white text-black/65 hover:border-black/25"
                    }`}
                  >
                    <span className="block">{option.label}</span>
                    <span className={`mt-1 block ${option.date === gameDayForm.date ? "text-white/75" : "text-black/40"}`}>
                      {option.teamCount} {option.teamCount === 1 ? "team" : "teams"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <form onSubmit={saveTeam} className="mb-4 grid gap-3 rounded-lg bg-[#f7f3ec] p-4">
                <div className="grid gap-3 sm:grid-cols-[0.8fr_0.65fr_0.65fr_1fr_auto] sm:items-end">
                  <AdminInput
                    type="date"
                    label="Pickup date"
                    value={teamForm.session_date}
                    onChange={(value) => {
                      setTeamForm({ ...teamForm, session_date: value });
                      selectGameDayDate(value);
                    }}
                    required
                  />
                  <AdminInput
                    type="time"
                    label="Start time"
                    value={gameDayForm.start_time}
                    onChange={(value) => setGameDayForm({ ...gameDayForm, start_time: value })}
                  />
                  <AdminInput
                    type="time"
                    label="End time"
                    value={gameDayForm.end_time}
                    onChange={(value) => setGameDayForm({ ...gameDayForm, end_time: value })}
                  />
                  <AdminInput
                    label="Place"
                    value={gameDayForm.location}
                    onChange={(value) => setGameDayForm({ ...gameDayForm, location: value })}
                    placeholder="Field name"
                  />
                  <button
                    type="button"
                    onClick={savePickupDetails}
                    disabled={loading || activeTeams.length === 0}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#171717] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save Info
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_0.55fr_0.45fr]">
                  <div className="rounded-lg bg-white px-3 py-3 text-sm font-bold leading-6 text-black/50 sm:col-span-3">
                    Teams saved to this date will show on the public site. Time, end time, and place will be used for calendar links.
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_0.75fr_0.55fr_0.45fr]">
                  <AdminInput
                    label="Team name"
                    value={teamForm.name}
                    onChange={(value) => setTeamForm({ ...teamForm, name: value })}
                    placeholder="Gold, Black, White..."
                    required
                  />
                  <AdminInput
                    label="Logo"
                    value={teamForm.logo_url}
                    onChange={(value) => setTeamForm({ ...teamForm, logo_url: value })}
                    placeholder="Image URL or emoji"
                  />
                  <AdminInput
                    type="color"
                    label="Color"
                    value={teamForm.color}
                    onChange={(value) => setTeamForm({ ...teamForm, color: value })}
                  />
                  <AdminInput
                    type="number"
                    label="Order"
                    value={String(teamForm.sort_order)}
                    onChange={(value) => setTeamForm({ ...teamForm, sort_order: Number(value) })}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-black/60">
                    <input
                      type="checkbox"
                      checked={teamForm.is_active}
                      onChange={(event) => setTeamForm({ ...teamForm, is_active: event.target.checked })}
                    />
                    Active
                  </label>
                  <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1f7a4d] px-4 text-sm font-black text-white">
                    <Plus size={16} />
                    {editingTeamId ? "Update Team" : "Add Team"}
                  </button>
                  {editingTeamId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeamId(null);
                        setTeamForm(getEmptyTeamForSelectedDate());
                      }}
                      className="h-11 rounded-lg border border-black/15 bg-white px-4 text-sm font-bold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <form onSubmit={addPlayerToTeam} className="grid gap-3 rounded-lg bg-[#f7f3ec] p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <AdminSelect
                    label="Team"
                    value={rosterForm.team_id}
                    onChange={(value) => setRosterForm({ ...rosterForm, team_id: value })}
                    required
                  >
                    <option value="">Select team</option>
                    {activeTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </AdminSelect>
                  <AdminSelect
                    label="Player"
                    value={rosterForm.player_id}
                    onChange={(value) => setRosterForm({ ...rosterForm, player_id: value })}
                    required
                  >
                    <option value="">Select player</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </AdminSelect>
                </div>
                <button className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-[#171717] px-4 text-sm font-black text-white">
                  <Plus size={16} />
                  Assign Player
                </button>
              </form>

              <div className="mt-4 lg:hidden">
                <TeamCards
                  teams={activeTeams}
                  date={gameDayForm.date}
                  getTeamRoster={getTeamRoster}
                  getPlayerName={getPlayerName}
                  editTeam={editTeam}
                  deleteTeam={deleteTeam}
                  removePlayerFromTeam={removePlayerFromTeam}
                />
              </div>
            </div>

            <div className="hidden lg:block">
              <TeamCards
                teams={activeTeams}
                date={gameDayForm.date}
                getTeamRoster={getTeamRoster}
                getPlayerName={getPlayerName}
                editTeam={editTeam}
                deleteTeam={deleteTeam}
                removePlayerFromTeam={removePlayerFromTeam}
              />
            </div>
          </div>
        </section>

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
                  label="Nickname (optional)"
                  value={playerForm.nickname}
                  onChange={(value) => setPlayerForm({ ...playerForm, nickname: value })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <AdminInput
                  label="Position (optional)"
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
                  type="time"
                  label="Start time"
                  value={matchForm.start_time}
                  onChange={(value) => setMatchForm({ ...matchForm, start_time: value })}
                />
                <AdminInput
                  type="time"
                  label="End time"
                  value={matchForm.end_time}
                  onChange={(value) => setMatchForm({ ...matchForm, end_time: value })}
                />
                <AdminInput
                  label="Game label"
                  value={matchForm.week_label}
                  onChange={(value) => setMatchForm({ ...matchForm, week_label: value })}
                  placeholder={`Game ${getNextGameNumber(matches, matchForm.match_date, editingMatchId || undefined)}`}
                />
                <AdminInput
                  label="Location"
                  value={matchForm.location}
                  onChange={(value) => setMatchForm({ ...matchForm, location: value })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <TeamNameSelect
                  label="Team A"
                  value={matchForm.team_a_name}
                  teams={activeTeams}
                  onChange={(value) => setMatchForm({ ...matchForm, team_a_name: value })}
                />
                <TeamNameSelect
                  label="Team B"
                  value={matchForm.team_b_name}
                  teams={activeTeams}
                  onChange={(value) => setMatchForm({ ...matchForm, team_b_name: value })}
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
                    <option value="live">Live</option>
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
                      setMatchForm(getEmptyMatchForSelectedDate());
                    }}
                    className="h-11 rounded-lg border border-black/15 bg-white px-4 text-sm font-bold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="space-y-3">
              {gameDayMatches.length === 0 ? (
                <div className="rounded-lg border border-black/10 bg-[#fbfaf7] p-4 text-sm font-bold text-black/50">
                  No matches for {formatDateLabel(gameDayForm.date)} yet.
                </div>
              ) : gameDayMatches.map((match) => (
                <div key={match.id} className="rounded-lg border border-black/10 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-black/50">{match.match_date}</p>
                      <p className="text-xs font-black uppercase text-[#1f7a4d]">{matchGameLabels.get(match.id)}</p>
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
                  <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold text-black/50">
                    {match.start_time && <p>{formatTimeRange(match.start_time, match.end_time)}</p>}
                    {match.location && <p>{match.location}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-black/50">Player Performance</p>
              <h1 className="text-2xl font-black">Saved Game Stats</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-black/55">
                These rows are saved per match. Player profiles, leaderboards, and all-time totals roll up from this table automatically.
              </p>
            </div>
            <Target className="text-[#1f7a4d]" size={26} />
          </div>

          <details className="mb-6 rounded-lg border border-black/10 bg-[#fbfaf7] p-4">
            <summary className="cursor-pointer text-sm font-black text-black/70">
              Optional: add a player&apos;s day totals without choosing every match
            </summary>
            <form onSubmit={saveQuickSinglePlayerStat} className="mt-4 grid gap-3 rounded-lg bg-[#f7f3ec] p-4">
              <p className="text-xs font-bold leading-5 text-black/45">
                Only use this if you did not enter match-by-match stats for this player. If game rows already exist, edit them below instead.
              </p>
              <div className="grid gap-3 lg:grid-cols-2">
                <AdminSelect
                  label="Player"
                  value={quickSingleStat.player_id}
                  onChange={(value) => setQuickSingleStat({ ...quickSingleStat, player_id: value })}
                  required
                >
                  <option value="">Select player</option>
                  {activePlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect
                  label="Team"
                  value={quickSingleStat.team_name}
                  onChange={(value) => setQuickSingleStat({ ...quickSingleStat, team_name: value })}
                  required
                >
                  <option value="">Select team</option>
                  {activeTeams.map((team) => (
                    <option key={team.id} value={team.name}>
                      {team.name}
                    </option>
                  ))}
                </AdminSelect>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                <AdminInput
                  type="number"
                  label="Total goals"
                  value={quickSingleStat.goals}
                  onChange={(value) => setQuickSingleStat({ ...quickSingleStat, goals: value })}
                />
                <AdminInput
                  type="number"
                  label="Total assists"
                  value={quickSingleStat.assists}
                  onChange={(value) => setQuickSingleStat({ ...quickSingleStat, assists: value })}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1f7a4d] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus size={16} />
                  Save Totals
                </button>
              </div>
            </form>
          </details>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-black/10 text-xs font-black uppercase text-black/45">
                  <th className="py-3">Match</th>
                  <th className="py-3">Player</th>
                  <th className="py-3">Team</th>
                  <th className="py-3 text-center">G</th>
                  <th className="py-3 text-center">A</th>
                  <th className="py-3 text-center">G+A</th>
                  <th className="py-3 text-center">Result</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {gameDayStats.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-sm font-bold text-black/45">
                      No player stats for {formatDateLabel(gameDayForm.date)} yet.
                    </td>
                  </tr>
                ) : gameDayStats.map((stat) => (
                  <tr key={stat.id} className="border-b border-black/10 last:border-0">
                    <td className="py-4 font-bold">
                      {stat.matches?.week_label || getMatchLabel(stat.match_id)}
                    </td>
                    <td className="py-4 font-black">{stat.players?.name || getPlayerName(stat.player_id)}</td>
                    <td className="py-4 font-bold">{stat.team_name}</td>
                    <td className="py-4 text-center font-bold">{stat.goals}</td>
                    <td className="py-4 text-center font-bold">{stat.assists}</td>
                    <td className="py-4 text-center font-black">{stat.goals + stat.assists}</td>
                    <td className="py-4 text-center font-bold capitalize">{stat.result}</td>
                    <td className="py-4">
                      <div className="flex justify-end gap-2">
                        <IconButton label="Edit stat" onClick={() => editStat(stat)} icon={Edit3} />
                        <IconButton label="Delete stat" onClick={() => deleteStat(stat.id)} icon={Trash2} danger />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );

  function getPlayerName(playerId: string) {
    return players.find((player) => player.id === playerId)?.name || "Unknown player";
  }

  function getMatchLabel(matchId: string) {
    return matches.find((match) => match.id === matchId)?.week_label || "Unknown match";
  }

  function getTeamRoster(teamId: string) {
    return roster.filter((row) => row.team_id === teamId);
  }

  function getPlayersForTeamName(teamName: string) {
    const team = teams.find((nextTeam) => normalizeAdminLabel(nextTeam.name) === normalizeAdminLabel(teamName));
    if (!team) return [];

    const teamPlayerIds = new Set(getTeamRoster(team.id).map((row) => row.player_id));

    return activePlayers.filter((player) => teamPlayerIds.has(player.id));
  }

  function getStatMatchForTeam(teamName: string) {
    const normalizedTeamName = normalizeAdminLabel(teamName);

    return gameDayMatches.find(
      (match) =>
        (match.status === "live" || match.status === "completed") &&
        (normalizeAdminLabel(match.team_a_name) === normalizedTeamName ||
          normalizeAdminLabel(match.team_b_name) === normalizedTeamName),
    );
  }

  function getQuickStatDraft(matchId: string, playerId: string, teamName: string) {
    const key = getQuickStatKey(matchId, playerId, teamName);
    const draft = quickStatDrafts[key];
    if (draft) return draft;

    const existingStat = stats.find(
      (stat) =>
        stat.match_id === matchId &&
        stat.player_id === playerId &&
        normalizeAdminLabel(stat.team_name) === normalizeAdminLabel(teamName),
    );

    return {
      goals: String(existingStat?.goals ?? 0),
      assists: String(existingStat?.assists ?? 0),
    };
  }
}

async function adminFetch(path: string, options: RequestInit, credential: string) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${credential}`,
      "x-admin-password": credential,
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

function buildGameLabels(matches: Match[]) {
  const labels = new Map<string, string>();
  const matchesByDate = new Map<string, Match[]>();

  for (const match of matches) {
    const dateMatches = matchesByDate.get(match.match_date) || [];
    dateMatches.push(match);
    matchesByDate.set(match.match_date, dateMatches);
  }

  for (const dateMatches of matchesByDate.values()) {
    dateMatches.sort(sortMatchesByGameOrder).forEach((match, index) => {
      labels.set(match.id, `Game ${index + 1}`);
    });
  }

  return labels;
}

function sortMatchesByGameOrder(first: Match, second: Match) {
  return (
    (first.created_at || "").localeCompare(second.created_at || "") ||
    first.week_label.localeCompare(second.week_label) ||
    first.id.localeCompare(second.id)
  );
}

function getNextGameNumber(matches: Match[], matchDate: string, editingMatchId?: string) {
  return matches.filter((match) => match.match_date === matchDate && match.id !== editingMatchId).length + 1;
}

function formatMatchOption(match: Match, gameLabels: Map<string, string>) {
  const gameLabel = gameLabels.get(match.id) || "Game";
  const matchup = `${match.team_a_name} vs ${match.team_b_name}`;

  if (normalizeAdminLabel(match.week_label) === normalizeAdminLabel(gameLabel)) {
    return `${gameLabel}: ${matchup}`;
  }

  return `${gameLabel} - ${match.week_label}: ${matchup}`;
}

function normalizeAdminLabel(label: string) {
  return label.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeAdminPlayerName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function getQuickStatKey(matchId: string, playerId: string, teamName: string) {
  return `${matchId}:${playerId}:${normalizeAdminLabel(teamName)}`;
}

function getTeamPairings(teams: TournamentTeam[]) {
  const pairings: Array<[TournamentTeam, TournamentTeam]> = [];

  for (let firstIndex = 0; firstIndex < teams.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < teams.length; secondIndex += 1) {
      pairings.push([teams[firstIndex], teams[secondIndex]]);
    }
  }

  return pairings;
}

function getMatchupKey(teamA: string, teamB: string) {
  return [teamA.trim().toLowerCase(), teamB.trim().toLowerCase()].sort().join("|");
}

function formatMatchStatus(status: string) {
  if (status === "live") return "Live";
  if (status === "completed") return "Completed";
  if (status === "scheduled") return "Scheduled";

  return status;
}

function formatPlayerCount(count: number) {
  return `${count} ${count === 1 ? "player" : "players"}`;
}

function getDefaultPickupDate() {
  const date = new Date(`${getTodayDateInput()}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() + 1);

  return date.toISOString().slice(0, 10);
}

function getTodayDateInput() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

function formatDateLabel(value: string) {
  if (!value) return "Tournament Day";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTimeLabel(value: string) {
  if (!value) return "Time TBD";

  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date(2000, 0, 1, hours, minutes || 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatTimeRange(startTime: string, endTime?: string | null) {
  if (!endTime) return formatTimeLabel(startTime);

  return `${formatTimeLabel(startTime)} - ${formatTimeLabel(endTime)}`;
}

function buildSessionOptions(matches: Match[], stats: PlayerStat[]) {
  const statsByMatchId = new Map<string, number>();

  for (const stat of stats) {
    statsByMatchId.set(stat.match_id, (statsByMatchId.get(stat.match_id) || 0) + 1);
  }

  const sessions = new Map<string, { date: string; games: number; statRows: number; completedGames: number }>();

  for (const match of matches) {
    const session = sessions.get(match.match_date) || {
      date: match.match_date,
      games: 0,
      statRows: 0,
      completedGames: 0,
    };

    session.games += 1;
    session.statRows += statsByMatchId.get(match.id) || 0;
    session.completedGames += match.status === "completed" ? 1 : 0;
    sessions.set(match.match_date, session);
  }

  return Array.from(sessions.values())
    .sort((first, second) => second.date.localeCompare(first.date))
    .map((session) => ({
      date: session.date,
      label: `${formatDateLabel(session.date)} - ${session.completedGames}/${session.games} completed, ${session.statRows} stat rows`,
    }));
}

function buildPollCandidatePlayers(
  gameDayMatches: Match[],
  teams: TournamentTeam[],
  roster: RosterRow[],
  players: Player[],
  gameDayStats: PlayerStat[],
  activePlayers: Player[],
) {
  const gameDayTeamNames = new Set<string>();

  for (const match of gameDayMatches) {
    gameDayTeamNames.add(normalizeAdminLabel(match.team_a_name));
    gameDayTeamNames.add(normalizeAdminLabel(match.team_b_name));
  }

  const gameDayTeamIds = new Set(
    teams
      .filter((team) => gameDayTeamNames.has(normalizeAdminLabel(team.name)))
      .map((team) => team.id),
  );
  const rosterPlayerIds = new Set(
    roster
      .filter((row) => gameDayTeamIds.has(row.team_id))
      .map((row) => row.player_id),
  );
  const rosterPlayers = players
    .filter((player) => rosterPlayerIds.has(player.id))
    .sort((first, second) => first.name.localeCompare(second.name));

  if (rosterPlayers.length >= 2) return rosterPlayers;

  const statPlayerIds = new Set(gameDayStats.map((stat) => stat.player_id));
  const statPlayers = players
    .filter((player) => statPlayerIds.has(player.id))
    .sort((first, second) => first.name.localeCompare(second.name));

  if (statPlayers.length >= 2) return statPlayers;

  return activePlayers;
}

function getTournamentPollTitle(poll: Pick<MvpPoll, "title" | "match_date">) {
  if (poll.match_date) {
    return `JC Footy Tournament MVP - ${formatDateLabel(poll.match_date)}`;
  }

  if (poll.title.toLowerCase().includes("game ")) {
    return "JC Footy Tournament MVP";
  }

  return poll.title;
}

function buildPastGameSessions(
  matches: Match[],
  stats: PlayerStat[],
  players: Player[],
  currentDate: string,
): PastGameSession[] {
  const sessionsByDate = new Map<string, Match[]>();
  const matchesByDate = new Map<string, Match[]>();
  const playerNames = new Map(players.map((player) => [player.id, player.name]));

  for (const match of matches) {
    const dateMatches = matchesByDate.get(match.match_date) || [];
    dateMatches.push(match);
    matchesByDate.set(match.match_date, dateMatches);
  }

  for (const [matchDate, dateMatches] of matchesByDate.entries()) {
    const completedMatches = dateMatches.filter((match) => match.status === "completed");
    const allDateMatchesCompleted = dateMatches.every((match) => match.status === "completed");

    if (completedMatches.length === 0) continue;
    if (matchDate === currentDate && !allDateMatchesCompleted) continue;

    sessionsByDate.set(matchDate, completedMatches);
  }

  return Array.from(sessionsByDate.entries())
    .sort(([firstDate], [secondDate]) => secondDate.localeCompare(firstDate))
    .map(([rawDate, dateMatches]) => {
      const matchIds = new Set(dateMatches.map((match) => match.id));
      const playerTotals = new Map<string, PastGameSession["players"][number]>();
      const teams = new Set<string>();

      for (const match of dateMatches) {
        teams.add(match.team_a_name);
        teams.add(match.team_b_name);
      }

      for (const stat of stats) {
        if (!matchIds.has(stat.match_id)) continue;

        const playerName = stat.players?.name || playerNames.get(stat.player_id) || "Unknown player";
        const playerKey = normalizeAdminPlayerName(playerName);
        const existing = playerTotals.get(playerKey) || {
          name: playerName,
          team: stat.team_name,
          goals: 0,
          assists: 0,
        };

        existing.goals += stat.goals || 0;
        existing.assists += stat.assists || 0;
        playerTotals.set(playerKey, existing);
      }

      return {
        rawDate,
        date: formatDateLabel(rawDate),
        matches: dateMatches.sort(sortMatchesByGameOrder),
        teams: Array.from(teams).sort((a, b) => a.localeCompare(b)),
        players: Array.from(playerTotals.values()).sort(
          (first, second) =>
            second.goals + second.assists - (first.goals + first.assists) ||
            second.goals - first.goals ||
            first.name.localeCompare(second.name),
        ),
        totalGoals: dateMatches.reduce((total, match) => total + match.team_a_score + match.team_b_score, 0),
      };
    });
}

function getCurrentSetupTeams(
  teams: TournamentTeam[],
  currentMatches: Match[],
  currentDate: string,
) {
  const teamsForDate = teams.filter((team) => team.session_date === currentDate);

  if (teamsForDate.length > 0) {
    return teamsForDate;
  }

  if (currentMatches.length > 0) {
    const currentTeamNames = new Set<string>();

    for (const match of currentMatches) {
      currentTeamNames.add(normalizeAdminLabel(match.team_a_name));
      currentTeamNames.add(normalizeAdminLabel(match.team_b_name));
    }

    return dedupeTeamsForAdmin(teams.filter((team) => {
      const teamName = normalizeAdminLabel(team.name);

      return currentTeamNames.has(teamName);
    }));
  }

  return [];
}

function buildTeamSessionOptions(teams: TournamentTeam[], matches: Match[]) {
  const sessions = new Map<string, { date: string; teamNames: Set<string> }>();

  for (const team of teams) {
    const date = team.session_date || "";
    if (!date) continue;

    const current = sessions.get(date) || { date, teamNames: new Set<string>() };
    current.teamNames.add(normalizeAdminLabel(team.name));
    sessions.set(date, current);
  }

  for (const match of matches) {
    const date = match.match_date || "";
    if (!date) continue;

    const current = sessions.get(date) || { date, teamNames: new Set<string>() };
    current.teamNames.add(normalizeAdminLabel(match.team_a_name));
    current.teamNames.add(normalizeAdminLabel(match.team_b_name));
    sessions.set(date, current);
  }

  return Array.from(sessions.values())
    .sort((first, second) => second.date.localeCompare(first.date))
    .map((session) => ({
      date: session.date,
      label: formatDateLabel(session.date),
      teamCount: session.teamNames.size,
    }));
}

function dedupeTeamsForAdmin(teams: TournamentTeam[]) {
  const teamsByName = new Map<string, TournamentTeam>();

  for (const team of teams) {
    const key = normalizeAdminLabel(team.name);
    if (!teamsByName.has(key)) teamsByName.set(key, team);
  }

  return Array.from(teamsByName.values());
}

function getSavedSessionDetails(teams: TournamentTeam[], matches: Match[]) {
  const startTime =
    teams.find((team) => team.session_start_time)?.session_start_time ||
    matches.find((match) => match.start_time)?.start_time ||
    "";
  const endTime =
    teams.find((team) => team.session_end_time)?.session_end_time ||
    matches.find((match) => match.end_time)?.end_time ||
    "";
  const location =
    teams.find((team) => team.session_location?.trim())?.session_location?.trim() ||
    matches.find((match) => match.location?.trim())?.location?.trim() ||
    "";

  return {
    start_time: startTime,
    end_time: endTime,
    location,
  };
}

function getPollUrl(token: string) {
  if (typeof window === "undefined") return `/poll/${token}`;

  return `${window.location.origin}/poll/${token}`;
}

async function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(value);
  }
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
    <div className="rounded-lg border border-black/10 bg-white p-3 shadow-sm sm:p-5">
      <Icon className="mb-2 text-[#1f7a4d] sm:mb-4" size={20} />
      <p className="text-2xl font-black sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-semibold text-black/55 sm:text-sm">{label}</p>
    </div>
  );
}

function AdminMiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#fbfaf7] p-3 sm:p-4">
      <p className="text-xl font-black sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs font-bold text-black/50 sm:text-sm">{label}</p>
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
      <span className="text-xs font-bold text-black/60 sm:text-sm">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1.5 h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-sm font-semibold outline-none focus:border-[#1f7a4d] sm:mt-2 sm:h-11"
      />
    </label>
  );
}

function AdminSelect({
  label,
  value,
  onChange,
  children,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-black/60 sm:text-sm">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="mt-1.5 h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-sm font-semibold outline-none focus:border-[#1f7a4d] sm:mt-2 sm:h-11"
      >
        {children}
      </select>
    </label>
  );
}

function TeamLogo({
  logo,
  color,
  name,
  size = "sm",
}: {
  logo?: string | null;
  color?: string | null;
  name: string;
  size?: "sm" | "md";
}) {
  const logoValue = logo?.trim();
  const sizeClass = size === "md" ? "h-8 w-8 text-base" : "h-6 w-6 text-sm";
  const className = `${sizeClass} inline-flex shrink-0 items-center justify-center rounded-full ring-2 ring-black/5`;

  if (!logoValue) {
    return <span className={className} style={{ backgroundColor: color || "#1f7a4d" }} aria-hidden="true" />;
  }

  if (isLogoImage(logoValue)) {
    return (
      <img
        src={logoValue}
        alt={`${name} logo`}
        className={`${className} bg-white object-cover`}
      />
    );
  }

  return (
    <span className={`${className} bg-white font-black`}>
      {logoValue}
    </span>
  );
}

function TeamCards({
  teams,
  date,
  getTeamRoster,
  getPlayerName,
  editTeam,
  deleteTeam,
  removePlayerFromTeam,
}: {
  teams: TournamentTeam[];
  date: string;
  getTeamRoster: (teamId: string) => RosterRow[];
  getPlayerName: (playerId: string) => string;
  editTeam: (team: TournamentTeam) => void;
  deleteTeam: (teamId: string) => void;
  removePlayerFromTeam: (teamId: string, playerId: string) => void;
}) {
  if (teams.length === 0) {
    return (
      <div className="rounded-lg border border-black/10 bg-[#fbfaf7] p-4 text-sm font-bold leading-6 text-black/50">
        No teams for {formatDateLabel(date)} yet. Add a team above and it will show here.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {teams.map((team) => {
        const teamRoster = getTeamRoster(team.id);

        return (
          <article key={team.id} className="rounded-lg border border-black/10 bg-white p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-3 h-2 w-14 rounded-full" style={{ backgroundColor: team.color || "#1f7a4d" }} />
                <div className="flex min-w-0 items-center gap-2">
                  <TeamLogo logo={team.logo_url} color={team.color} name={team.name} size="md" />
                  <h2 className="min-w-0 break-words text-sm font-black sm:text-base">{team.name}</h2>
                </div>
                <p className="mt-1 text-xs font-semibold text-black/50 sm:text-sm">
                  {formatPlayerCount(teamRoster.length)} {team.is_active ? "" : "| inactive"}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => editTeam(team)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-2.5 text-xs font-black text-black/70 hover:bg-black/5 sm:h-10 sm:px-3 sm:text-sm"
                >
                  <Edit3 size={16} />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <IconButton label="Delete team" onClick={() => deleteTeam(team.id)} icon={Trash2} danger />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {teamRoster.length === 0 ? (
                <p className="rounded-lg bg-[#fbfaf7] px-3 py-3 text-sm font-semibold text-black/45">
                  No players assigned yet.
                </p>
              ) : (
                teamRoster.map((row) => (
                  <div key={row.id} className="flex items-center justify-between gap-2 rounded-lg bg-[#f7f3ec] px-3 py-2">
                    <span className="min-w-0 break-words text-xs font-bold sm:text-sm">{row.players?.name || getPlayerName(row.player_id)}</span>
                    <button
                      type="button"
                      onClick={() => removePlayerFromTeam(row.team_id, row.player_id)}
                      className="shrink-0 text-xs font-black text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function TeamNameSelect({
  label,
  value,
  teams,
  onChange,
}: {
  label: string;
  value: string;
  teams: TournamentTeam[];
  onChange: (teamName: string) => void;
}) {
  const activeTeams = teams.filter((team) => team.is_active);

  if (activeTeams.length === 0) {
    return (
      <AdminInput
        label={label}
        value={value}
        onChange={onChange}
        placeholder="Create teams first"
        required
      />
    );
  }

  return (
    <AdminSelect label={label} value={value} onChange={onChange} required>
      <option value="">Select team</option>
      {activeTeams.map((team) => (
        <option key={team.id} value={team.name}>
          {team.name}
        </option>
      ))}
    </AdminSelect>
  );
}

function isLogoImage(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith("/");
}

function QuickStatTeamSheet({
  match,
  teamName,
  players,
  getDraft,
  updateDraft,
  adjustDraft,
  savePlayerStat,
  loading,
}: {
  match: Match;
  teamName: string;
  players: Player[];
  getDraft: (matchId: string, playerId: string, teamName: string) => { goals: string; assists: string };
  updateDraft: (matchId: string, playerId: string, teamName: string, field: "goals" | "assists", value: string) => void;
  adjustDraft: (matchId: string, playerId: string, teamName: string, field: "goals" | "assists", amount: number) => void;
  savePlayerStat: (match: Match, player: Player, teamName: string) => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black sm:text-base">{teamName}</h3>
        <span className="rounded-lg bg-[#edf4f0] px-2 py-1 text-xs font-black text-[#17613d]">
          {formatPlayerCount(players.length)}
        </span>
      </div>
      {players.length === 0 ? (
        <p className="rounded-lg bg-[#f7f3ec] p-3 text-sm font-semibold text-black/50">
          Assign players to this team first.
        </p>
      ) : (
        <div className="grid gap-2">
          {players.map((player) => {
            const draft = getDraft(match.id, player.id, teamName);

            return (
              <div key={player.id} className="rounded-lg border border-black/10 bg-[#fbfaf7] p-2.5 sm:p-3">
                <p className="mb-2 break-words text-sm font-black sm:mb-3">{player.name}</p>
                <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-1.5 sm:gap-2">
                  <StatStepper
                    label="G"
                    value={draft.goals}
                    onChange={(value) => updateDraft(match.id, player.id, teamName, "goals", value)}
                    onAdjust={(amount) => adjustDraft(match.id, player.id, teamName, "goals", amount)}
                  />
                  <StatStepper
                    label="A"
                    value={draft.assists}
                    onChange={(value) => updateDraft(match.id, player.id, teamName, "assists", value)}
                    onAdjust={(amount) => adjustDraft(match.id, player.id, teamName, "assists", amount)}
                  />
                  <button
                    type="button"
                    onClick={() => savePlayerStat(match, player, teamName)}
                    disabled={loading}
                    className="h-9 rounded-lg bg-[#171717] px-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:px-3"
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatStepper({
  label,
  value,
  onChange,
  onAdjust,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onAdjust: (amount: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase text-black/45">{label}</span>
      <div className="mt-1 grid h-9 grid-cols-[28px_1fr_28px] overflow-hidden rounded-lg border border-black/15 bg-white sm:h-10 sm:grid-cols-[32px_1fr_32px]">
        <button type="button" onClick={() => onAdjust(-1)} className="font-black text-black/55 hover:bg-black/5">
          -
        </button>
        <input
          type="number"
          min="0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full border-x border-black/10 text-center text-sm font-black outline-none"
        />
        <button type="button" onClick={() => onAdjust(1)} className="font-black text-[#17613d] hover:bg-black/5">
          +
        </button>
      </div>
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
      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition sm:h-10 sm:w-10 ${
        danger
          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          : "border-black/10 bg-white text-black/70 hover:bg-black/5"
      }`}
    >
      <Icon size={16} />
    </button>
  );
}

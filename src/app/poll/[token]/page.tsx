"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Trophy } from "lucide-react";
import LogoMark from "@/components/LogoMark";

type PollOption = {
  id: string;
  label: string;
  votes: number;
};

type Poll = {
  token: string;
  title: string;
  match_date: string | null;
  status: string;
  totalVotes: number;
  options: PollOption[];
};

export default function MvpPollPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState("");
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [voterName, setVoterName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const voterKey = useMemo(() => getOrCreateVoterKey(), []);

  const loadPoll = useCallback(async (nextToken = token) => {
    if (!nextToken) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/polls/${nextToken}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Could not load poll.");

      setPoll(data.poll);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load poll.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    params.then(({ token: nextToken }) => {
      setToken(nextToken);
      loadPoll(nextToken);
    });
  }, [loadPoll, params]);

  async function submitVote() {
    if (!selectedOption) {
      setMessage("Pick a player first.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/polls/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          option_id: selectedOption,
          voter_key: voterKey,
          voter_name: voterName,
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Could not submit vote.");

      setMessage("Vote saved. You can change it by picking another player and voting again.");
      await loadPoll();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit vote.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-8 text-[#171717] sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-3">
          <LogoMark />
          <div>
            <p className="text-lg font-black leading-none">JC Pickup Soccer</p>
            <p className="text-xs font-medium text-black/55">Tournament MVP vote</p>
          </div>
        </Link>

        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="animate-spin text-[#1f7a4d]" size={28} />
            </div>
          ) : poll ? (
            <>
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-black/10 pb-5">
                <div>
                  <p className="text-sm font-bold text-black/50">Tournament MVP Poll</p>
                  <h1 className="mt-1 text-3xl font-black">{getTournamentPollTitle(poll)}</h1>
                  <p className="mt-2 text-sm font-semibold text-black/55">
                    Vote for the best player across all games. {poll.totalVotes} votes so far.
                  </p>
                </div>
                <Trophy className="shrink-0 text-[#b7791f]" size={32} />
              </div>

              <label className="mb-5 block">
                <span className="text-sm font-bold text-black/60">Your name (optional)</span>
                <input
                  value={voterName}
                  onChange={(event) => setVoterName(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-black/15 bg-white px-3 text-sm font-semibold outline-none focus:border-[#1f7a4d]"
                  placeholder="So the group knows who voted"
                />
              </label>

              <div className="space-y-3">
                {poll.options.map((option) => (
                  <label
                    key={option.id}
                    className={`block cursor-pointer rounded-lg border p-4 transition ${
                      selectedOption === option.id
                        ? "border-[#1f7a4d] bg-[#edf7f1]"
                        : "border-black/10 bg-[#fbfaf7] hover:border-black/25"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="mvp"
                          value={option.id}
                          checked={selectedOption === option.id}
                          onChange={(event) => setSelectedOption(event.target.value)}
                        />
                        <span className="font-black">{option.label}</span>
                      </div>
                      <span className="text-sm font-bold text-black/50">{option.votes} votes</span>
                    </div>
                  </label>
                ))}
              </div>

              {message && <p className="mt-5 text-sm font-bold text-black/65">{message}</p>}

              <button
                onClick={submitVote}
                disabled={saving || poll.status !== "open"}
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#1f7a4d] text-sm font-black text-white transition hover:bg-[#17613d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 className="animate-spin" size={18} />}
                Submit Tournament MVP Vote
              </button>
            </>
          ) : (
            <p className="font-bold text-red-700">{message || "Poll not found."}</p>
          )}
        </section>
      </div>
    </main>
  );
}

function getOrCreateVoterKey() {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem("jc-mvp-voter-key");
  if (existing) return existing;

  const nextKey = crypto.randomUUID();
  window.localStorage.setItem("jc-mvp-voter-key", nextKey);

  return nextKey;
}

function getTournamentPollTitle(poll: Pick<Poll, "title" | "match_date">) {
  if (poll.match_date) {
    return `JC Footy Tournament MVP - ${formatDateLabel(poll.match_date)}`;
  }

  if (poll.title.toLowerCase().includes("game ")) {
    return "JC Footy Tournament MVP";
  }

  return poll.title;
}

function formatDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

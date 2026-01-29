"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getActiveVotingEvent, castVote } from "@/actions/voting";
import { useSession, signIn, signOut } from "next-auth/react";
import Button from "@/components/ui/button/Button";
import { useDialog } from "@/context/DialogContext";

type VoteClientProps = {
  eventId: string;
};

export default function VoteClient({ eventId }: VoteClientProps) {
  const votePath = `/vote/${eventId}`;
  const { data: session, status } = useSession();
  const { showAlert, showConfirm } = useDialog();
  const [event, setEvent] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooth, setSelectedBooth] = useState("");

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    const res = await getActiveVotingEvent(eventId);
    if (res && res.event) {
      setEvent(res.event);
      setTeams(res.teams);
    } else {
      setError("Event not found or closed.");
    }
    setLoading(false);
  };

  const handleVote = async (teamId: string, teamName: string) => {
    if (!session) {
      signIn("google", { callbackUrl: votePath });
      return;
    }

    if (!(await showConfirm(`Vote for ${teamName}? You can only vote once.`, "success"))) return;

    setVoting(true);
    const res = await castVote(eventId, teamId);
    setVoting(false);

    if (res.success) {
      await showAlert("Thank you for voting!", "success");
    } else {
      await showAlert(res.error || "Failed", "error");
    }
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 dark:text-white">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 dark:text-white text-xl">{error}</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4 dark:text-white">{event.title}</h1>
          <p className="mb-8 text-gray-600 dark:text-gray-300">You need to sign in with your School Email to vote.</p>
          <Button onClick={() => signIn("google", { callbackUrl: votePath })}>Sign in with Google</Button>
        </div>
      </div>
    );
  }

  const email = session.user?.email || "";
  const isAllowed = email.endsWith("@smakstlouis1sby.sch.id") || email.endsWith("@s.smakstlouis1sby.sch.id");

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
          <h1 className="text-2xl font-bold mb-2 text-red-500">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sorry, only emails from <b>@smakstlouis1sby.sch.id</b> are allowed to vote.
          </p>
          <p className="mt-4 text-sm text-gray-500">You are logged in as {email}</p>
          <Button variant="outline" className="mt-6 w-full" onClick={() => signOut({ callbackUrl: votePath })}>
            Logout
          </Button>
        </div>
      </div>
    );
  }

  const boothOptions = useMemo(() => {
    const names = teams
      .map((team) => team.boothLocation?.name)
      .filter((name): name is string => Boolean(name));
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "id"));
  }, [teams]);

  useEffect(() => {
    if (selectedBooth && !boothOptions.includes(selectedBooth)) {
      setSelectedBooth("");
    }
  }, [boothOptions, selectedBooth]);

  const filteredTeams = teams.filter((team) => {
    const matchesSearch = searchTerm.trim()
      ? (team.name || "").toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesBooth = selectedBooth ? team.boothLocation?.name === selectedBooth : true;
    return matchesSearch && matchesBooth;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">{event.title}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">{event.description}</p>
          <p className="mt-2 text-sm text-blue-500">Logged in as {email}</p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-10">
          <div className="w-full md:max-w-md">
            <label htmlFor="tenant-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cari Tenant
            </label>
            <input
              id="tenant-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama tenant atau tim..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {boothOptions.length > 0 && (
            <div className="w-full md:max-w-xs">
              <label htmlFor="booth-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pilih Booth
              </label>
              <select
                id="booth-filter"
                value={selectedBooth}
                onChange={(e) => setSelectedBooth(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Semua Booth</option>
                {boothOptions.map((booth) => (
                  <option key={booth} value={booth}>
                    {booth}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button variant="outline" className="w-full md:w-auto text-red-600 dark:text-red-400" onClick={() => signOut({ callbackUrl: votePath })}>
            Logout
          </Button>
        </div>

        {filteredTeams.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-8 text-center text-gray-500 dark:text-gray-300">
            Tidak ada tenant yang cocok dengan pencarian.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTeams.map((team) => (
              <div key={team.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 dark:text-white">{team.name || "Unnamed Team"}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {team.category} - {team.boothLocation?.name}
                  </p>
                  <Button className="w-full justify-center" onClick={() => handleVote(team.id, team.name)} disabled={voting}>
                    Vote
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState, use } from 'react';
import { getActiveVotingEvent, castVote } from "@/actions/voting";
import { useSession, signIn } from "next-auth/react";
import Button from "@/components/ui/button/Button";
import { Link } from "next/link";
import Image from "next/image";
import { useDialog } from "@/context/DialogContext";

export default function VotePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session, status } = useSession();
    const { showAlert, showConfirm } = useDialog();
    const [event, setEvent] = useState<any>(null);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const res = await getActiveVotingEvent(id);
        if (res && res.event) {
            setEvent(res.event);
            setTeams(res.teams);
        } else {
            setError("Event not found or closed.");
        }
        setLoading(false);
    }
    
    const handleVote = async (teamId: string, teamName: string) => {
        if (!session) {
            signIn("google");
            return;
        }
        
        if (!(await showConfirm(`Vote for ${teamName}? You can only vote once.`, "success"))) return;
        
        setVoting(true);
        const res = await castVote(id, teamId);
        setVoting(false);

        
        if (res.success) {
            await showAlert("Thank you for voting!", "success");
            // Optionally disable further voting locally or redirect
        } else {
            await showAlert(res.error || "Failed", "error");
        }
    }

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
                     <Button onClick={() => signIn("google")}>Sign in with Google</Button>
                 </div>
             </div>
         )
    }

    // Client-side domain check visualization (Server also checks)
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
                 </div>
             </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                     <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">{event.title}</h1>
                     <p className="text-lg text-gray-600 dark:text-gray-400">{event.description}</p>
                     <p className="mt-2 text-sm text-blue-500">Logged in as {email}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {teams.map((team) => (
                        <div key={team.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700">
                             <div className="p-6">
                                 <h3 className="text-xl font-bold mb-2 dark:text-white">{team.name || "Unnamed Team"}</h3>
                                 <p className="text-sm text-gray-500 mb-4">{team.category} - {team.boothLocation?.name}</p>
                                 <Button 
                                    className="w-full justify-center" 
                                    onClick={() => handleVote(team.id, team.name)}
                                    disabled={voting}
                                 >
                                    Vote
                                 </Button>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

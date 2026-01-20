"use client";
import React, { useState, useEffect } from 'react';
import { getVotingEvents, createVotingEvent, toggleVotingEvent, deleteVotingEvent, getVotingAnalytics, getVoteAuditLog } from "@/actions/voting";
import { useDialog } from "@/context/DialogContext";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";

export default function VotingPage() {
    const { showAlert, showConfirm } = useDialog();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<any[]>([]);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [auditLog, setAuditLog] = useState<any[]>([]);
    const [auditLoading, setAuditLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");

    useEffect(() => {
        loadEvents();
        loadAnalytics();
        loadAuditLog();
    }, []);
    
    const loadEvents = async () => {
        setLoading(true);
        const res = await getVotingEvents();
        if (res.success) {
            setEvents(res.data || []);
        }
        setLoading(false);
    }

    const loadAnalytics = async () => {
        setAnalyticsLoading(true);
        const res = await getVotingAnalytics();
        if (res.success) {
            setAnalytics(res.events || []);
        }
        setAnalyticsLoading(false);
    }

    const loadAuditLog = async () => {
        setAuditLoading(true);
        const res = await getVoteAuditLog(100);
        if (res.success) {
            setAuditLog(res.votes || []);
        }
        setAuditLoading(false);
    }
    
    const handleCreate = async () => {
        if (!title) return;
        const res = await createVotingEvent(title, desc);
        if (res.success) {
            await showAlert("Voting Event Created!", "success");
            setIsModalOpen(false);
            setTitle("");
            setDesc("");
            loadEvents();
        } else {
            await showAlert("Failed", "error");
        }
    }
    
    const handleDelete = async (id: string) => {
        if (!(await showConfirm("Delete this event?", "error"))) return;
        await deleteVotingEvent(id);
        loadEvents();
    }
    
    const handleToggle = async (id: string, active: boolean) => {
        await toggleVotingEvent(id, !active);
        loadEvents();
    }

    const copyLink = (id: string) => {
        const url = `${window.location.origin}/vote/${id}`;
        navigator.clipboard.writeText(url);
        showAlert("Link copied to clipboard!", "success");
    }
    
    return (
        <div className="space-y-8">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold dark:text-white">Voting Events</h2>
                <Button onClick={() => setIsModalOpen(true)}>Create New Vote</Button>
             </div>
             
             <div className="flex flex-col gap-4">
                {events.map((e) => (
                    <div key={e.id} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <div>
                            <h3 className="font-bold text-lg dark:text-white">{e.title}</h3>
                            <p className="text-sm text-gray-500">{e.description}</p>
                            <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${e.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {e.isActive ? "ACTIVE" : "CLOSED"}
                            </span>
                            <div className="mt-1 text-xs text-gray-400">Total Votes: {e._count.votes}</div>
                        </div>
                        <div className="flex gap-2">
                             <Button size="sm" variant="outline" onClick={() => copyLink(e.id)}>Copy Link</Button>
                             <Button size="sm" variant="outline" onClick={() => handleToggle(e.id, e.isActive)}>
                                {e.isActive ? "Close" : "Open"}
                             </Button>
                             <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" onClick={() => handleDelete(e.id)}>
                                Delete
                             </Button>
                        </div>
                    </div>
                ))}
                {events.length === 0 && <p className="text-center text-gray-500">No events found.</p>}
             </div>
             
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-4 flex flex-col gap-4">
                    <h3 className="text-xl font-bold dark:text-white mb-2">New Voting Event</h3>
                    <div>
                        <Label>Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Best Booth 2024" />
                    </div>
                    <div>
                        <Label>Description</Label>
                        <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional description" />
                    </div>
                     <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Create</Button>
                    </div>
                </div>
             </Modal>
            </div>

            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-wide text-gray-400">Statistik Booth</p>
                        <h3 className="text-2xl font-semibold dark:text-white">Voting per Booth & Zona</h3>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { loadAnalytics(); loadAuditLog(); }}>Refresh Data</Button>
                </div>
                {analyticsLoading ? (
                    <div className="mt-6 text-sm text-gray-500">Memuat statistik booth...</div>
                ) : analytics.length === 0 ? (
                    <div className="mt-6 text-sm text-gray-500">Belum ada voting yang direkam.</div>
                ) : (
                    <div className="mt-6 space-y-6">
                        {analytics.map((event) => (
                            <article key={event.id} className="border border-gray-100 dark:border-gray-800 rounded-xl p-5 bg-gray-50 dark:bg-gray-800/60">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{event.title}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{event.description || "Tidak ada deskripsi"}</p>
                                        <p className="text-xs text-gray-400 mt-1">Diperbarui {new Date(event.createdAt).toLocaleDateString('id-ID')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs uppercase tracking-wide text-gray-500">Total Suara</p>
                                        <p className="text-3xl font-bold text-brand-600">{event.totalVotes}</p>
                                    </div>
                                </div>

                                {event.zoneSummary && event.zoneSummary.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {event.zoneSummary.map((zone: any) => (
                                            <span key={zone.zone} className="px-3 py-1 rounded-full bg-white dark:bg-gray-900 text-xs font-semibold border border-gray-200 dark:border-gray-700">
                                                {zone.zone}: {zone.votes} suara
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-4 overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-500 uppercase tracking-wide text-xs">
                                                <th className="py-2 pr-4">#</th>
                                                <th className="py-2 pr-4">Tim</th>
                                                <th className="py-2 pr-4">Booth</th>
                                                <th className="py-2 pr-4 text-right">Suara</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {event.perTeam.slice(0, 20).map((team: any, index: number) => (
                                                <tr key={team.teamId} className="border-t border-gray-100 dark:border-gray-700/60">
                                                    <td className="py-2 pr-4 text-gray-500">{index + 1}</td>
                                                    <td className="py-2 pr-4 font-semibold text-gray-900 dark:text-white">{team.teamName}</td>
                                                    <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{team.boothName}</td>
                                                    <td className="py-2 pr-4 text-right font-semibold">{team.votes}</td>
                                                </tr>
                                            ))}
                                            {event.perTeam.length > 20 && (
                                                <tr>
                                                    <td colSpan={4} className="pt-3 text-xs text-gray-400">
                                                        Menampilkan 20 tim teratas dari {event.perTeam.length} tim.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h3 className="text-2xl font-semibold dark:text-white">Riwayat Voting Terbaru</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Menampilkan siapa saja yang sudah melakukan voting beserta email Google mereka.</p>
                {auditLoading ? (
                    <div className="mt-6 text-sm text-gray-500">Memuat riwayat voting...</div>
                ) : auditLog.length === 0 ? (
                    <div className="mt-6 text-sm text-gray-500">Belum ada suara yang terekam.</div>
                ) : (
                    <div className="mt-6 overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 uppercase tracking-wide text-xs">
                                    <th className="py-2 pr-4">Waktu</th>
                                    <th className="py-2 pr-4">Pemilih</th>
                                    <th className="py-2 pr-4">Email</th>
                                    <th className="py-2 pr-4">Event</th>
                                    <th className="py-2 pr-4">Pilihan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLog.map((vote: any) => (
                                    <tr key={vote.id} className="border-t border-gray-100 dark:border-gray-700/60">
                                        <td className="py-2 pr-4 text-gray-500">{new Date(vote.createdAt).toLocaleString('id-ID')}</td>
                                        <td className="py-2 pr-4 font-semibold text-gray-900 dark:text-white">{vote.voterName}</td>
                                        <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{vote.voterEmail}</td>
                                        <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{vote.eventTitle}</td>
                                        <td className="py-2 pr-4 text-gray-900 dark:text-white">
                                            {vote.teamName}
                                            {vote.boothName && <span className="text-gray-500 text-xs ml-2">(Booth {vote.boothName})</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    )
}

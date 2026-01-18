"use client";
import React, { useState, useEffect } from 'react';
import { getVotingEvents, createVotingEvent, toggleVotingEvent, deleteVotingEvent } from "@/actions/voting";
import { useDialog } from "@/context/DialogContext";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";

export default function VotingPage() {
    const { showAlert, showConfirm } = useDialog();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");

    useEffect(() => {
        loadEvents();
    }, []);
    
    const loadEvents = async () => {
        setLoading(true);
        const res = await getVotingEvents();
        if (res.success) {
            setEvents(res.data || []);
        }
        setLoading(false);
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
             
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Voting Event">
                <div className="p-4 flex flex-col gap-4">
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
    )
}

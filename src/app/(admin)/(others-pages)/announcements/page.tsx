"use client";
import React, { useState } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useDialog } from "@/context/DialogContext";
import { createAnnouncement } from "@/actions/notification";

export default function AnnouncementPage() {
    const { showAlert } = useDialog();
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await createAnnouncement(title, message);
        setLoading(false);
        if (res.success) {
            await showAlert("Announcement created!", "success");
            setTitle("");
            setMessage("");
        } else {
            await showAlert("Error creating announcement", "error");
        }
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white">
                Create Announcement
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                    <Label>Title</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Topic e.g. Maintenance" />
                </div>
                <div>
                    <Label>Message</Label>
                    <textarea 
                        className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-3 text-base text-gray-800 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-transparent dark:text-white"
                        rows={6}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Details of the announcement..."
                        required
                    />
                </div>
                <div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="rounded bg-brand-500 px-6 py-2.5 font-medium text-gray-100 hover:bg-opacity-90 disabled:opacity-50"
                    >
                        {loading ? "Posting..." : "Post Announcement"}
                    </button>
                </div>
            </form>
        </div>
    );
}

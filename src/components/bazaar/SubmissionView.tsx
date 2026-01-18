"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/form/FileUpload";
import { uploadSubmission } from "@/actions/dashboard";

type SubmissionTask = {
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    allowFile: boolean;
    allowLink: boolean;
    acceptMimeTypes: string | null;
    dueDate: string | null;
    order: number;
    submission: {
        id: string;
        fileUrl: string | null;
        fileDownloadUrl: string | null;
        linkUrl: string | null;
        submittedAt: string;
        isLate: boolean;
    } | null;
};

export default function SubmissionView({ teamId, tasks }: { teamId: string; tasks: SubmissionTask[] }) {
    if (!tasks || tasks.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-2">Submission Tasks</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">No submission tasks are available yet. Please check back later.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow col-span-1 md:col-span-2">
                <h3 className="text-lg font-bold mb-4">Submission Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {tasks.map((task) => (
                        <StatusBadge key={task.id} task={task} />
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow md:col-span-2">
                <h3 className="text-lg font-bold mb-4">Upload Center</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tasks.map((task) => (
                        <UploadCard key={task.id} task={task} teamId={teamId} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ task }: { task: SubmissionTask }) {
    const submission = task.submission;
    const isSubmitted = !!submission;
    const isLate = submission ? submission.isLate : task.dueDate ? new Date() > new Date(task.dueDate) : false;
    const dueLabel = task.dueDate ? new Date(task.dueDate).toLocaleString() : "No deadline";

    return (
        <div className={`p-4 rounded border flex flex-col items-center justify-center text-center ${isSubmitted ? 'bg-green-50 border-green-200' : isLate ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
            <span className="font-bold text-gray-700 block mb-1">{task.title}</span>
            <span className={`text-xs font-bold px-2 py-1 rounded ${isSubmitted ? (submission?.isLate ? 'bg-orange-200 text-orange-900' : 'bg-green-200 text-green-800') : isLate ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
                {isSubmitted ? (submission?.isLate ? 'SUBMITTED (LATE)' : 'SUBMITTED') : isLate ? 'OVERDUE' : 'PENDING'}
            </span>
            <span className="text-xs text-gray-400 mt-2">Due: {dueLabel}</span>
            {submission && (
                <span className="text-[11px] text-gray-500 mt-1">Submitted {new Date(submission.submittedAt).toLocaleString()}</span>
            )}
        </div>
    );
}

function UploadCard({ task, teamId }: { task: SubmissionTask; teamId: string }) {
    const router = useRouter();
    const initialMode: 'FILE' | 'LINK' = task.allowFile ? 'FILE' : 'LINK';
    const [mode, setMode] = useState<'FILE' | 'LINK'>(initialMode);
    const [file, setFile] = useState<File | null>(null);
    const [link, setLink] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode]);

    const acceptMap = useMemo(() => {
        if (!task.acceptMimeTypes) return undefined;
        const entries = task.acceptMimeTypes.split(',').map((item) => item.trim()).filter(Boolean);
        if (!entries.length) return undefined;
        return entries.reduce<Record<string, string[]>>((acc, curr) => {
            acc[curr] = [];
            return acc;
        }, {});
    }, [task.acceptMimeTypes]);

    const isLate = !task.submission && task.dueDate ? new Date() > new Date(task.dueDate) : false;

    const handleUpload = async () => {
        setError(null);
        setSuccess(null);

        if (mode === 'FILE' && !file) {
            setError('Please attach a file first.');
            return;
        }
        if (mode === 'LINK' && !link) {
            setError('Please paste a link first.');
            return;
        }

        setLoading(true);
        const fd = new FormData();
        if (mode === 'FILE' && file) {
            fd.append('file', file);
        }
        if (mode === 'LINK' && link) {
            fd.append('link', link);
        }

        const result = await uploadSubmission(teamId, task.id, fd);
        setLoading(false);

        if (result?.error) {
            setError(result.error);
            return;
        }

        setSuccess('Submission uploaded successfully!');
        setFile(null);
        setLink('');
        router.refresh();
    };

    const dueLabel = task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No deadline';
    const instructions = task.instructions || task.description;

    return (
        <div className={`border p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 transition hover:border-brand-300 ${isLate ? 'border-red-300 bg-red-50' : ''}`}>
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">{task.title}</h3>
                    {task.description && <p className="text-xs text-gray-500 mt-1">{task.description}</p>}
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] ${task.submission ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                    {task.submission ? 'Submitted' : 'Pending'}
                </span>
            </div>

            <div className="flex justify-between text-xs text-gray-500 mb-3">
                <span>{task.submission ? `Last update: ${new Date(task.submission.submittedAt).toLocaleString()}` : 'Not submitted yet'}</span>
                <span className={isLate ? 'text-red-600 font-semibold' : ''}>Due: {dueLabel}</span>
            </div>

            {instructions && (
                <div className="text-xs text-gray-600 dark:text-gray-300 bg-white/40 dark:bg-black/30 border border-dashed border-gray-200 dark:border-gray-600 rounded p-2 mb-3 whitespace-pre-line">
                    {instructions}
                </div>
            )}

            {task.submission && (
                <div className="mb-3 text-xs space-y-1">
                    {task.submission.fileDownloadUrl && (
                        <a href={task.submission.fileDownloadUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 font-semibold">
                            View uploaded file
                        </a>
                    )}
                    {task.submission.linkUrl && (
                        <a href={task.submission.linkUrl} target="_blank" rel="noopener noreferrer" className="block text-indigo-600 hover:text-indigo-700">
                            Open submitted link
                        </a>
                    )}
                </div>
            )}

            {task.allowFile && task.allowLink && (
                <div className="flex gap-2 mb-3 text-xs">
                    <button
                        onClick={() => setMode('FILE')}
                        className={`px-2 py-1 rounded ${mode === 'FILE' ? 'bg-gray-900 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}
                    >
                        Upload File
                    </button>
                    <button
                        onClick={() => setMode('LINK')}
                        className={`px-2 py-1 rounded ${mode === 'LINK' ? 'bg-gray-900 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}
                    >
                        Use External Link
                    </button>
                </div>
            )}

            <div className="space-y-3">
                {mode === 'FILE' && task.allowFile ? (
                    <>
                        <FileUpload label="Drag & drop file here" onFileSelect={setFile} accept={acceptMap} />
                        {file && (
                            <div className="text-xs bg-gray-200 dark:bg-gray-800 p-1 rounded text-gray-700 dark:text-gray-200 truncate">
                                Selected: {file.name}
                            </div>
                        )}
                    </>
                ) : task.allowLink ? (
                    <input
                        className="w-full text-sm p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
                        placeholder="Paste Google Drive/Dropbox/YouTube link..."
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                    />
                ) : null}

                {error && <p className="text-xs text-red-600">{error}</p>}
                {success && <p className="text-xs text-green-600">{success}</p>}

                <button
                    onClick={handleUpload}
                    disabled={loading || (!file && mode === 'FILE' && task.allowFile) || (!link && mode === 'LINK' && task.allowLink)}
                    className="w-full text-xs bg-brand-600 text-white px-3 py-2 rounded hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Submitting...' : 'Submit' }
                </button>
            </div>
        </div>
    );
}

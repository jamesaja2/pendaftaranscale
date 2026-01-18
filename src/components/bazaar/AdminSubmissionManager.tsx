"use client";

import React, { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    createSubmissionTask,
    updateSubmissionTask,
    deleteSubmissionTask,
} from "@/actions/dashboard";

export type AdminSubmissionTask = {
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    allowFile: boolean;
    allowLink: boolean;
    acceptMimeTypes: string | null;
    dueDate: string | null;
    order: number;
    submissions: Array<{
        id: string;
        teamId: string;
        teamName: string;
        leaderName: string | null;
        leaderClass: string | null;
        category: string | null;
        fileUrl: string | null;
        fileDownloadUrl: string | null;
        linkUrl: string | null;
        submittedAt: string;
        isLate: boolean;
    }>;
};

export default function AdminSubmissionManager({ tasks }: { tasks: AdminSubmissionTask[] }) {
    const router = useRouter();
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(tasks[0]?.id ?? null);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();
    const [createError, setCreateError] = useState<string | null>(null);
    const [editError, setEditError] = useState<string | null>(null);

    const selectedTask = useMemo(() => tasks.find((task) => task.id === selectedTaskId) || null, [tasks, selectedTaskId]);

    useEffect(() => {
        if (!tasks.find((task) => task.id === selectedTaskId)) {
            setSelectedTaskId(tasks[0]?.id ?? null);
        }
    }, [tasks, selectedTaskId]);

    const handleCreate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        setCreateError(null);
        startTransition(async () => {
            const result = await createSubmissionTask(formData);
            if (result?.error) {
                setCreateError(result.error);
                return;
            }
            form.reset();
            router.refresh();
        });
    };

    const handleUpdate = (taskId: string) => (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        setEditError(null);
        startTransition(async () => {
            const result = await updateSubmissionTask(taskId, formData);
            if (result?.error) {
                setEditError(result.error);
                return;
            }
            setEditingTaskId(null);
            router.refresh();
        });
    };

    const handleDelete = (taskId: string) => {
        if (!window.confirm("Delete this task? This action cannot be undone.")) return;
        setEditError(null);
        startTransition(async () => {
            const result = await deleteSubmissionTask(taskId);
            if (result?.error) {
                setEditError(result.error);
                return;
            }
            if (selectedTaskId === taskId) {
                const fallback = tasks.find((task) => task.id !== taskId);
                setSelectedTaskId(fallback?.id ?? null);
            }
            if (editingTaskId === taskId) {
                setEditingTaskId(null);
            }
            router.refresh();
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6 lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">Submission Tasks</h3>
                        <span className="text-xs text-gray-500">{tasks.length} task{tasks.length === 1 ? "" : "s"}</span>
                    </div>
                    <div className="space-y-3">
                        {tasks.length === 0 && <p className="text-sm text-gray-500">No tasks defined yet.</p>}
                        {tasks.map((task) => (
                            <div key={task.id} className={`rounded border p-3 ${selectedTaskId === task.id ? 'border-brand-500 bg-brand-50 dark:bg-gray-900' : 'border-gray-200 dark:border-gray-700'}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <button
                                            className="text-left font-medium text-sm text-gray-900 dark:text-gray-100 hover:text-brand-600"
                                            onClick={() => setSelectedTaskId(task.id)}
                                        >
                                            {task.title}
                                        </button>
                                        <p className="text-[11px] text-gray-500">Due {task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No deadline'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            className="text-xs text-indigo-600 hover:text-indigo-800"
                                            onClick={() => setEditingTaskId(editingTaskId === task.id ? null : task.id)}
                                        >
                                            {editingTaskId === task.id ? 'Close' : 'Edit'}
                                        </button>
                                        <button className="text-xs text-red-600 hover:text-red-800" onClick={() => handleDelete(task.id)}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                {editingTaskId === task.id && (
                                    <form onSubmit={handleUpdate(task.id)} className="mt-3 space-y-3 text-sm">
                                        <TaskFormFields task={task} />
                                        {editError && <p className="text-xs text-red-600">{editError}</p>}
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                className="px-3 py-1 text-xs rounded border"
                                                onClick={() => setEditingTaskId(null)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={pending}
                                                className="px-3 py-1 text-xs rounded bg-brand-600 text-white disabled:opacity-50"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Add New Task</h3>
                    <form className="space-y-3 text-sm" onSubmit={handleCreate}>
                        <TaskFormFields />
                        {createError && <p className="text-xs text-red-600">{createError}</p>}
                        <button
                            type="submit"
                            disabled={pending}
                            className="w-full px-3 py-2 rounded bg-brand-600 text-white text-xs font-semibold disabled:opacity-50"
                        >
                            Create Task
                        </button>
                    </form>
                </div>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                {selectedTask ? (
                    <div>
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedTask.title}</h3>
                                <p className="text-sm text-gray-500">Review {selectedTask.submissions.length} submission{selectedTask.submissions.length === 1 ? '' : 's'}</p>
                            </div>
                            <div className="text-xs text-gray-500">
                                Deadline: {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleString() : 'No deadline'}
                            </div>
                        </div>
                        {selectedTask.instructions && (
                            <div className="mb-4 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 p-3 rounded">
                                {selectedTask.instructions}
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-xs uppercase text-gray-500 border-b dark:border-gray-700">
                                    <tr>
                                        <th className="py-3 pr-4">Team</th>
                                        <th className="py-3 pr-4">Submission</th>
                                        <th className="py-3 pr-4">Status</th>
                                        <th className="py-3 pr-4">Links</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedTask.submissions.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-6 text-center text-gray-500 text-sm">
                                                No submissions yet.
                                            </td>
                                        </tr>
                                    )}
                                    {selectedTask.submissions.map((submission) => (
                                        <tr key={submission.id} className="border-b last:border-b-0 dark:border-gray-700">
                                            <td className="py-4 pr-4">
                                                <div className="font-medium text-gray-900 dark:text-white">{submission.teamName}</div>
                                                <div className="text-xs text-gray-500">
                                                    {submission.leaderName} {submission.leaderClass ? `(${submission.leaderClass})` : ''}
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 text-xs text-gray-600">
                                                <div>{new Date(submission.submittedAt).toLocaleString()}</div>
                                                <div className="text-[11px] text-gray-500">{submission.isLate ? 'Late submission' : 'On time'}</div>
                                            </td>
                                            <td className="py-4 pr-4">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${submission.isLate ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                                    {submission.isLate ? 'Late' : 'On Time'}
                                                </span>
                                            </td>
                                            <td className="py-4 pr-4 space-y-1 text-xs">
                                                {submission.fileDownloadUrl && (
                                                    <a
                                                        href={submission.fileDownloadUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block text-brand-600 hover:text-brand-700"
                                                    >
                                                        View file
                                                    </a>
                                                )}
                                                {submission.linkUrl && (
                                                    <a
                                                        href={submission.linkUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block text-indigo-600 hover:text-indigo-700"
                                                    >
                                                        Open link
                                                    </a>
                                                )}
                                                {!submission.fileDownloadUrl && !submission.linkUrl && <span className="text-gray-400">—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 text-sm">Select a task to review participant submissions.</div>
                )}
            </div>
        </div>
    );
}

function TaskFormFields({ task }: { task?: AdminSubmissionTask }) {
    const dueDateValue = task?.dueDate ? formatDatetimeLocal(task.dueDate) : "";
    return (
        <>
            <div>
                <label className="block text-xs font-semibold mb-1">Title</label>
                <input
                    name="title"
                    defaultValue={task?.title || ""}
                    className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-700"
                    required
                />
            </div>
            <div>
                <label className="block text-xs font-semibold mb-1">Short Description</label>
                <input
                    name="description"
                    defaultValue={task?.description || ""}
                    className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-700"
                />
            </div>
            <div>
                <label className="block text-xs font-semibold mb-1">Instructions</label>
                <textarea
                    name="instructions"
                    rows={3}
                    defaultValue={task?.instructions || ""}
                    className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-700"
                    placeholder="Provide guidance, criteria, or links"
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold mb-1">Due Date</label>
                    <input
                        type="datetime-local"
                        name="dueDate"
                        defaultValue={dueDateValue}
                        className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-700"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold mb-1">Display Order</label>
                    <input
                        type="number"
                        name="order"
                        defaultValue={task?.order ?? 0}
                        className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-700"
                    />
                </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1">
                    <input type="checkbox" name="allowFile" defaultChecked={task ? task.allowFile : true} value="true" /> Allow file upload
                </label>
                <label className="flex items-center gap-1">
                    <input type="checkbox" name="allowLink" defaultChecked={task ? task.allowLink : true} value="true" /> Allow link submission
                </label>
            </div>
            <div>
                <label className="block text-xs font-semibold mb-1">Accepted MIME Types (comma separated)</label>
                <input
                    name="acceptMimeTypes"
                    defaultValue={task?.acceptMimeTypes || ""}
                    className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-700"
                    placeholder="image/*,application/pdf,video/*"
                />
                <p className="text-[11px] text-gray-500 mt-1">Leave blank to accept all file types.</p>
            </div>
        </>
    );
}

function formatDatetimeLocal(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n: number) => `${n}`.padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

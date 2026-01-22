"use client";
import React, { useState, useEffect, useCallback } from "react";
import { createUser, deleteUser } from "@/actions/user";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { useDialog } from "@/context/DialogContext";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Badge from "@/components/ui/badge/Badge";
import { twMerge } from "tailwind-merge";

const PAGE_SIZE_PRESETS = [5, 10, 25, 50];

export default function UserTable() {
    const { showAlert, showConfirm } = useDialog();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [tableLoading, setTableLoading] = useState(true);
    const [tableError, setTableError] = useState<string | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Form State
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        role: "ADMIN"
    });

    const fetchUsers = useCallback(async () => {
        try {
            setTableLoading(true);
            setTableError(null);
            const response = await fetch("/api/admin/users", { cache: "no-store" });
            if (!response.ok) throw new Error("Failed to fetch users");
            const payload = await response.json();
            const list = Array.isArray(payload?.data) ? payload.data : [];
            setUsers(list);
            // Clamp current page if dataset shrinks
            setCurrentPage((prev) => {
                const maxPage = Math.max(1, Math.ceil(list.length / rowsPerPage));
                return Math.min(prev, maxPage);
            });
        } catch (error: any) {
            console.error("Failed to load users", error);
            setTableError(error?.message || "Failed to load users");
        } finally {
            setTableLoading(false);
        }
    }, [rowsPerPage]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormSubmitting(true);
        const res = await createUser(formData);
        setFormSubmitting(false);
        if (res.success) {
            setIsModalOpen(false);
            setFormData({ email: "", password: "", role: "ADMIN" });
            await showAlert("User created successfully", "success");
            fetchUsers();
        } else {
            await showAlert(res.error || "Failed", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!(await showConfirm("Are you sure you want to delete this user?", "error"))) return;
        const res = await deleteUser(id);
        if ((res as any)?.error) {
            await showAlert((res as any).error, "error");
            return;
        }
        await showAlert("User removed", "success");
        fetchUsers();
    };

    const totalUsers = users.length;
    const totalPages = Math.max(1, Math.ceil(totalUsers / rowsPerPage));
    const clampedPage = Math.min(currentPage, totalPages);
    const startIndex = (clampedPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalUsers);
    const visibleUsers = users.slice(startIndex, endIndex);

    const paginationLabel = tableLoading
        ? "Loading..."
        : totalUsers === 0
            ? "No users"
            : `Showing ${startIndex + 1} to ${endIndex} of ${totalUsers} users`;

    return (
        <div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span>Show</span>
                    <select
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                        value={rowsPerPage}
                        onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    >
                        {PAGE_SIZE_PRESETS.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                    <span>entries</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    {paginationLabel}
                </div>
                <div className="flex justify-end">
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 font-medium text-white hover:bg-brand-600"
                >
                    <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 4.16666V15.8333" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4.16669 10H15.8334" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Add User
                </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                    <div className="min-w-[1000px]">
                        <Table>
                            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                <TableRow>
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                        User (Email)
                                    </TableCell>
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                        Role
                                    </TableCell>
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                        Joined Date
                                    </TableCell>
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                        Action
                                    </TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                {tableLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="px-5 py-6 text-center text-gray-500">
                                            Loading users...
                                        </TableCell>
                                    </TableRow>
                                ) : tableError ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="px-5 py-6 text-center text-red-500">
                                            {tableError}
                                        </TableCell>
                                    </TableRow>
                                ) : visibleUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="px-5 py-6 text-center text-gray-500">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    visibleUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                                                    {String(user.email).charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                                        {String(user.email)}
                                                    </span>
                                                    <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                                                        ID: {String(user.id).slice(-6)}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                            <Badge
                                                size="sm"
                                                color={(String(user.role) === 'ADMIN' ? 'success' : 'warning') as any}
                                            >
                                                {String(user.role) || 'UNKNOWN'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            <button 
                                                onClick={() => handleDelete(user.id)}
                                                className="text-red-500 hover:text-red-700 font-medium"
                                            >
                                                Delete
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))) }
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{paginationLabel}</p>
                <div className="flex items-center gap-2">
                    <button
                        className={twMerge(
                            "px-4 py-2 rounded-lg border text-sm",
                            clampedPage === 1
                                ? "cursor-not-allowed border-gray-200 text-gray-400"
                                : "border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-white"
                        )}
                        disabled={clampedPage === 1 || tableLoading}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Page {clampedPage} of {totalPages}
                    </span>
                    <button
                        className={twMerge(
                            "px-4 py-2 rounded-lg border text-sm",
                            clampedPage >= totalPages
                                ? "cursor-not-allowed border-gray-200 text-gray-400"
                                : "border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-white"
                        )}
                        disabled={clampedPage >= totalPages || tableLoading}
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    >
                        Next
                    </button>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg">
                <h3 className="text-xl font-bold mb-4 dark:text-white">Add New User</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <Label>Password</Label>
                        <Input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>
                    <div>
                        <Label>Role</Label>
                        <div className="relative">
                            <select 
                                className="w-full appearance-none rounded-lg border border-gray-300 bg-transparent py-3 px-4 outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-500"
                                value={formData.role} 
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                            >
                                <option value="ADMIN">ADMIN</option>
                                <option value="PARTICIPANT">PARTICIPANT</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={formSubmitting}
                            className="px-6 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-50"
                        >
                            {formSubmitting ? "Saving..." : "Create User"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

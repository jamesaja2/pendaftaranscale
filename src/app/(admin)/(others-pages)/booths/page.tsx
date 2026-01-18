"use client";

import React, { useEffect, useState } from "react";
import { getBooths, createBooth, deleteBooth } from "@/actions/booth";
import Label from "@/components/form/Label";
import { useDialog } from "@/context/DialogContext";
import Input from "@/components/form/input/InputField";

export default function BoothsPage() {
    const { showAlert, showConfirm } = useDialog();
    const [booths, setBooths] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // Form
    const [name, setName] = useState("");
    const [type, setType] = useState("STANDARD");

    useEffect(() => {
        loadBooths();
    }, []);

    const loadBooths = async () => {
        setLoading(true);
        const res = await getBooths();
        if (res.success) {
            setBooths(res.data || []);
        }
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        const fd = new FormData();
        fd.append("name", name);
        fd.append("type", type);

        const res = await createBooth(fd);
        setCreating(false);
        if (res.success) {
            setName("");
            loadBooths();
        } else {
            await showAlert("Error creating booth", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!(await showConfirm("Delete this booth?", "error"))) return;
        await deleteBooth(id);
        loadBooths();
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
             <h2 className="mb-6 text-2xl font-bold dark:text-white">Booth Management</h2>
             
             {/* Create Form */}
             <form onSubmit={handleCreate} className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded border">
                 <h3 className="font-semibold mb-4">Add New Booth</h3>
                 <div className="flex gap-4 items-end">
                     <div className="flex-1">
                         <Label>Booth Name / Number</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. A-01" />
                     </div>
                     {/* 
                     <div className="w-48">
                         <Label>Type</Label>
                         <select 
                            className="w-full p-3 border rounded dark:bg-gray-900 dark:border-gray-700" 
                            value={type} 
                            onChange={e => setType(e.target.value)}
                        >
                             <option value="STANDARD">Standard</option>
                             <option value="PREMIUM">Premium</option>
                         </select>
                     </div> 
                     */}
                     <button 
                        type="submit" 
                        disabled={creating} 
                        className="px-6 py-3 bg-brand-500 text-white rounded font-medium hover:bg-brand-600 disabled:opacity-50"
                    >
                        {creating ? "Adding..." : "Add Booth"}
                    </button>
                 </div>
             </form>

             {/* List */}
             {loading ? <p>Loading...</p> : (
                 <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                         <thead>
                             <tr className="bg-gray-100 dark:bg-gray-800 text-sm">
                                 <th className="p-3 border-b">Name</th>
                                 {/* <th className="p-3 border-b">Type</th> */}
                                 <th className="p-3 border-b">Status</th>
                                 <th className="p-3 border-b">Action</th>
                             </tr>
                         </thead>
                         <tbody>
                             {booths.map(booth => (
                                 <tr key={booth.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                     <td className="p-3 font-medium">{booth.name}</td>
                                     {/* <td className="p-3 text-sm text-gray-500">{booth.type}</td> */}
                                     <td className="p-3">
                                         {booth.team ? (
                                             <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Taken by {booth.team.name}</span>
                                         ) : (
                                             <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Available</span>
                                         )}
                                     </td>
                                     <td className="p-3">
                                         <button onClick={() => handleDelete(booth.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                                     </td>
                                 </tr>
                             ))}
                             {booths.length === 0 && (
                                 <tr>
                                     <td colSpan={4} className="p-4 text-center text-gray-500">No booths found.</td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                 </div>
             )}
        </div>
    );
}

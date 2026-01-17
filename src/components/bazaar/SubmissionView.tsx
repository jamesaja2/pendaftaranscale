"use client";
import React, { useState } from 'react';
import FileUpload from "@/components/form/FileUpload";
import { uploadSubmission } from "@/actions/dashboard";

export default function SubmissionView({ team, meta }: { team: any, meta: any }) {

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Submissions Status Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow col-span-1 md:col-span-2">
                <h3 className="text-lg font-bold mb-4">Submission Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatusBadge label="BMC" status={team.bmcSubmittedAt} dueDate={meta?.dueDates?.bmc} />
                    <StatusBadge label="Video" status={team.promotionalSubmittedAt} dueDate={meta?.dueDates?.video} />
                    <StatusBadge label="Poster" status={team.promoPoster} dueDate={meta?.dueDates?.poster} />
                    <StatusBadge label="Inventory" status={team.inventorySubmittedAt} dueDate={meta?.dueDates?.inventory} />
                </div>
            </div>
            
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow md:col-span-2">
                <h3 className="text-lg font-bold mb-4">Upload Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <UploadCard title="Business Model Canvas (BMC)" date={team.bmcSubmittedAt} type="BMC" teamId={team.id} dueDate={meta?.dueDates?.bmc} />
                     <UploadCard title="Promotional Video" date={team.promotionalSubmittedAt} type="VIDEO" teamId={team.id} accept={{'video/*' :[]}} dueDate={meta?.dueDates?.video} />
                     <UploadCard title="Promotional Poster" date={team.promoPoster} type="POSTER" teamId={team.id} accept={{'image/*' :[]}} dueDate={meta?.dueDates?.poster} />
                     <UploadCard title="Inventory Checklist" date={team.inventorySubmittedAt} type="INVENTORY" teamId={team.id} accept={{'application/pdf' :[]}} dueDate={meta?.dueDates?.inventory} />
                </div>
             </div>
        </div>
    );
}

function StatusBadge({ label, status, dueDate }: { label: string, status: any, dueDate: string }) {
    const isDone = !!status;
    const isLate = !isDone && dueDate && new Date() > new Date(dueDate);

    return (
        <div className={`p-4 rounded border flex flex-col items-center justify-center text-center ${isDone ? 'bg-green-50 border-green-200' : isLate ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
            <span className="font-bold text-gray-700 block mb-1">{label}</span>
            <span className={`text-xs font-bold px-2 py-1 rounded ${isDone ? 'bg-green-200 text-green-800' : isLate ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
                {isDone ? 'SUBMITTED' : isLate ? 'OVERDUE' : 'PENDING'}
            </span>
            {dueDate && <span className="text-xs text-gray-400 mt-2">Due: {new Date(dueDate).toLocaleDateString()}</span>}
        </div>
    )
}

function UploadCard({ title, date, type, teamId, accept, dueDate }: { title: string, date?: string, type: string, teamId: string, accept?: any, dueDate?: string }) {
    const [mode, setMode] = useState<'FILE' | 'LINK'>('FILE');
    const [file, setFile] = useState<File|null>(null);
    const [link, setLink] = useState("");
    const [loading, setLoading] = useState(false);
    const isLate = !date && dueDate && new Date() > new Date(dueDate);

    const handleUpload = async () => {
        if (mode === 'FILE' && !file) return;
        if (mode === 'LINK' && !link) return;

        setLoading(true);
        const fd = new FormData();
        
        if(mode === 'FILE' && file) {
            fd.append("file", file);
        } else if (mode === 'LINK' && link) {
             fd.append("link", link);
        }
        
        await uploadSubmission(teamId, type, fd);
        
        setLoading(false);
        setFile(null);
        setLink("");
        window.location.reload();
    };

    return (
        <div className={`border p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 transition hover:border-brand-300 ${isLate ? 'border-red-300 bg-red-50' : ''}`}>
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">{title}</h3>
            
            <div className="flex justify-between mb-3">
                 <span className={`inline-block px-2 py-0.5 rounded text-xs ${date ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
                    {date ? "Submitted" : "Pending"}
                </span>
                {dueDate && <span className={`text-xs ${isLate ? 'text-red-600 font-bold' : 'text-gray-500'}`}>Due: {new Date(dueDate).toLocaleDateString()}</span>}
            </div>
            
            <div className="flex gap-2 mb-2 text-xs">
                <button onClick={()=>setMode("FILE")} className={`px-2 py-1 rounded ${mode==='FILE' ? 'bg-gray-300 font-bold' : 'bg-transparent text-gray-500 hover:bg-gray-200'}`}>Upload File</button>
                <button onClick={()=>setMode("LINK")} className={`px-2 py-1 rounded ${mode==='LINK' ? 'bg-gray-300 font-bold' : 'bg-transparent text-gray-500 hover:bg-gray-200'}`}>Use External Link</button>
            </div>

            <div className="space-y-3">
                 {mode === 'FILE' ? (
                     <>
                        <FileUpload 
                            label="Drag file here" 
                            onFileSelect={setFile} 
                            accept={accept}
                        />
                        {file && (
                            <div className="text-xs bg-gray-200 p-1 rounded text-gray-700 truncate">
                                Selected: {file.name}
                            </div>
                        )}
                     </>
                 ) : (
                     <input 
                        className="w-full text-sm p-2 border rounded" 
                        placeholder="Paste Google Drive/Dropbox/YouTube link..."
                        value={link}
                        onChange={e => setLink(e.target.value)}
                     />
                 )}
                 
                 <button 
                    onClick={handleUpload} 
                    disabled={(!file && !link) || loading}
                    className="w-full text-xs bg-brand-600 text-white px-3 py-2 rounded hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Submitting..." : "Submit"}
                </button>
            </div>
        </div>
    );
}

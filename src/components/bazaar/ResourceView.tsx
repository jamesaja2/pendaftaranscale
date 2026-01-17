"use client";
import React, { useState } from 'react';
import { createResource, deleteResource } from "@/actions/resource";
import { useFormStatus } from 'react-dom';
import FileUpload from "@/components/form/FileUpload";

export default function ResourceView({ resources, role }: { resources: any[], role: string }) {
    const isAdmin = role === 'ADMIN';

    return (
        <div className="space-y-8">
            {/* List Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((res) => (
                    <div key={res.id} className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                {isAdmin && (
                                    <DeleteButton id={res.id} />
                                )}
                            </div>
                            <h3 className="font-bold text-lg mb-1 text-gray-800 dark:text-gray-200">{res.title}</h3>
                            <p className="text-xs text-gray-400 mb-4">Uploaded: {new Date(res.createdAt).toLocaleDateString()}</p>
                        </div>
                        
                        <a 
                            href={res.fileUrl} 
                            target="_blank" 
                            className="block w-full text-center py-2 bg-brand-50 hover:bg-brand-100 text-brand-600 font-bold rounded transition border border-brand-200"
                        >
                            {res.fileUrl.startsWith('http') ? "Open Link" : "Download File"}
                        </a>
                    </div>
                ))}
                
                {resources.length === 0 && (
                    <div className="col-span-full text-center py-10 bg-gray-50 rounded border border-dashed border-gray-300">
                        <p className="text-gray-500">No resources available yet.</p>
                    </div>
                )}
            </div>

            {/* Admin Upload Section */}
            {isAdmin && <AdminUploadForm />}
        </div>
    );
}

function AdminUploadForm() {
    const [mode, setMode] = useState<'FILE' | 'LINK'>('FILE');
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [link, setLink] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string|null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const form = new FormData();
        form.append("title", title);
        
        if (mode === 'FILE') {
            if (!file) {
                setError("Please select a file");
                setLoading(false);
                return;
            }
            // Admin no limit or large limit. Let's do 100MB check just in case.
            if (file.size > 100 * 1024 * 1024) { 
                 setError("File is too large (Max 100MB)");
                 setLoading(false);
                 return;
            }
            form.append("file", file);
        } else {
             if (!link) {
                setError("Please enter a link");
                setLoading(false);
                return;
            }
            form.append("link", link);
        }

        const res = await createResource(form);
        setLoading(false);
        
        if (res.success) {
            setTitle("");
            setFile(null);
            setLink("");
            // window.location.reload(); // simple refresh
        } else {
            setError(res.error || "Upload failed");
        }
    };

    return (
        <div className="border-t pt-8 mt-8">
            <h2 className="text-xl font-bold mb-4">Upload New Resource</h2>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow max-w-2xl">
                <div className="flex gap-4 mb-4 border-b">
                    <button onClick={()=>setMode("FILE")} className={`pb-2 px-1 font-medium ${mode==='FILE' ? 'border-b-2 border-brand-500 text-brand-600' : 'text-gray-500'}`}>Upload File</button>
                    <button onClick={()=>setMode("LINK")} className={`pb-2 px-1 font-medium ${mode==='LINK' ? 'border-b-2 border-brand-500 text-brand-600' : 'text-gray-500'}`}>Use External Link</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required 
                            className="w-full p-2 border rounded dark:bg-gray-900" 
                            placeholder="e.g. Technical Handbook" 
                        />
                    </div>
                    
                    {mode === 'FILE' ? (
                        <div>
                             <label className="block text-sm font-medium mb-1">File (Drag & Drop)</label>
                             <FileUpload 
                                label="Drop file here or click to upload"
                                onFileSelect={setFile}
                             />
                             {file && <p className="text-sm mt-1 text-green-600">Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
                        </div>
                    ) : (
                        <div>
                             <label className="block text-sm font-medium mb-1">External URL</label>
                             <input 
                                type="url" 
                                value={link}
                                onChange={e => setLink(e.target.value)}
                                required 
                                className="w-full p-2 border rounded dark:bg-gray-900" 
                                placeholder="https://drive.google.com/..." 
                            />
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700 disabled:opacity-50 font-medium">
                        {loading ? "Uploading..." : "Add Resource"}
                    </button>
                </form>
            </div>
        </div>
    )
}

function DeleteButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false);
    return (
        <button 
            onClick={async () => {
                if(!confirm("Delete this resource?")) return;
                setLoading(true);
                await deleteResource(id);
                setLoading(false);
            }} 
            disabled={loading}
            className="text-red-400 hover:text-red-600"
        >
            {loading ? "..." : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            )}
        </button>
    )
}

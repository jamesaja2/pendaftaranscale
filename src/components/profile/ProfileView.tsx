"use client";
import React, { useState } from "react";
import { updateUserProfile } from "@/actions/profile";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import FileUpload from "@/components/form/FileUpload";
import Image from "next/image";

export default function ProfileView({ user }: { user: any }) {
    const [loading, setLoading] = useState(false);
    
    // Derived state
    const isParticipant = user.role === 'PARTICIPANT';
    const team = user.team;

    // Form State
    const [name, setName] = useState(user.name || "");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    // File
    const [imageFile, setImageFile] = useState<File | null>(null);

    // Team State
    const [teamName, setTeamName] = useState(team?.name || "");
    const [contactInfo, setContactInfo] = useState(team?.contactInfo || "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const fd = new FormData();
        fd.append("name", name);
        
        if (imageFile) {
            fd.append("image", imageFile);
        }

        if (password) {
            fd.append("password", password);
            fd.append("confirmPassword", confirmPassword);
        }
        if (isParticipant) {
            fd.append("teamName", teamName);
            fd.append("contactInfo", contactInfo);
        }

        const res = await updateUserProfile(fd);
        setLoading(false);
        if (res.success) {
            alert("Profile updated successfully");
            setPassword("");
            setConfirmPassword("");
            setImageFile(null);
            window.location.reload(); 
        } else {
            alert(res.error || "Failed to update profile");
        }
    };

    return (
        <div className="grid grid-cols-1 gap-9 sm:grid-cols-2">
            <div className="flex flex-col gap-9">
                {/* User Info Card */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="border-b border-gray-200 py-4 px-6 dark:border-gray-800">
                        <h3 className="font-medium text-black dark:text-white">
                            Profile Information
                        </h3>
                    </div>
                    <div className="flex flex-col gap-5 p-6">
                        <div className="flex justify-center mb-4">
                            <div className="h-24 w-24 rounded-full overflow-hidden border relative">
                                {imageFile ? (
                                    <img src={URL.createObjectURL(imageFile)} className="w-full h-full object-cover" />
                                ) : (
                                    <Image 
                                        src={user.image || "/images/user/user-01.jpg"} 
                                        width={96} height={96} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover" 
                                    />
                                )}
                            </div>
                        </div>

                        <div>
                            <Label>Email (Read-only)</Label>
                            <Input disabled value={user.email} onChange={()=>{}} className="bg-gray-100 cursor-not-allowed text-gray-500 dark:bg-gray-800 dark:text-gray-400" />
                        </div>
                        <div>
                            <Label>Display Name</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Display Name" />
                        </div>
                        <div>
                            <Label>Role</Label>
                            <div className="inline-flex rounded bg-gray-100 px-3 py-1 font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                {user.role}
                            </div>
                        </div>
                    </div>
                </div>

                {isParticipant && team && (
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                         <div className="border-b border-gray-200 py-4 px-6 dark:border-gray-800">
                            <h3 className="font-medium text-black dark:text-white">
                                Team Details
                            </h3>
                        </div>
                        <div className="p-6 text-sm">
                             <div className="mb-4">
                                <span className="block text-gray-500 mb-1">Leader</span>
                                <span className="font-semibold text-lg">{team.leaderName || "N/A"}</span>
                                <span className="text-gray-400 ml-2">({team.leaderClass})</span>
                             </div>
                             
                             <div className="mb-4">
                                <span className="block text-gray-500 mb-1">Category</span>
                                <span className="font-semibold text-lg">{team.category}</span>
                             </div>

                             <div>
                                <span className="block text-gray-500 mb-1">Members</span>
                                <ul className="list-disc pl-5 space-y-1">
                                    {JSON.parse(team.members || "[]").map((m: any) => (
                                        <li key={m.nis}>{m.name} ({m.nis})</li>
                                    ))}
                                </ul>
                             </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-9">
                 {/* Edit Form */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="border-b border-gray-200 py-4 px-6 dark:border-gray-800">
                        <h3 className="font-medium text-black dark:text-white">
                            Edit Profile
                        </h3>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                         <div>
                            <Label>Profile Picture</Label>
                            <FileUpload 
                                label="Upload New Picture" 
                                accept={{'image/*': []}}
                                onFileSelect={setImageFile}
                            />
                        </div>

                        {isParticipant && (
                            <>
                                <div>
                                    <Label>Team Name (Optional)</Label>
                                    <Input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Official Team Name" />
                                </div>
                                <div>
                                    <Label>WhatsApp Contact</Label>
                                    <Input value={contactInfo} onChange={e => setContactInfo(e.target.value)} />
                                </div>
                                <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                            </>
                        )}

                        <div>
                            <Label>New Password</Label>
                            <Input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                placeholder="Leave blank to keep current"
                            />
                        </div>
                        {password && (
                            <div>
                                <Label>Confirm New Password</Label>
                                <Input 
                                    type="password" 
                                    value={confirmPassword} 
                                    onChange={e => setConfirmPassword(e.target.value)} 
                                />
                            </div>
                        )}

                        <div className="flex justify-end mt-4">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="rounded bg-brand-500 px-6 py-2.5 font-medium text-gray-100 hover:bg-opacity-90 disabled:opacity-50"
                            >
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

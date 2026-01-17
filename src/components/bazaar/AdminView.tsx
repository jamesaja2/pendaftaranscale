"use client";
import React, { useState } from "react";
import { verifyTeam, setPosCredentials, updateGlobalSettings } from "@/actions/dashboard";

export default function AdminView({ teams, settings }: { teams: any[], settings: any[] }) {
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [viewTeam, setViewTeam] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<'teams' | 'cms'>('teams');

    const getSetting = (key: string) => settings?.find(s => s.key === key)?.value || "";

    const handleExport = () => {
        // Create CSV content
        const headers = ["Team Name", "Leader", "Class", "Members", "Category", "Payment", "Trx ID", "Location", "Ingredient", "Contact", "BMC", "Video", "Inventory"];
        const rows = teams.map(t => {
            const members = JSON.parse(t.members || "[]").map((m: any) => `${m.name} (${m.class}${m.absen ? ' - No. ' + m.absen : ''})`).join("; ");
            const ingredient = t.mainIngredient?.name || "-";
            const location = t.boothLocation?.name || "-";
            
            return [
                `"${t.name || t.leaderName}"`,
                `"${t.leaderName}"`,
                `"${t.leaderClass}"`,
                `"${members}"`,
                `"${t.category}"`,
                `"${t.paymentStatus}"`,
                `"${t.paymentTrxId || ''}"`,
                `"${location}"`,
                `"${ingredient}"`,
                `"${t.contactInfo}"`,
                t.bmcSubmittedAt ? "Yes" : "No",
                t.promotionalSubmittedAt ? "Yes" : "No",
                t.inventorySubmittedAt ? "Yes" : "No"
            ].join(",");
        });
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `bazaar_teams_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                 <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
                 {activeTab === 'teams' && (
                     <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 text-sm font-bold">
                         Export CSV
                     </button>
                 )}
            </div>
            
            <div className="flex gap-4 mb-6 border-b dark:border-gray-700">
                <button 
                    onClick={() => setActiveTab('teams')}
                    className={`pb-2 px-1 ${activeTab === 'teams' ? 'border-b-2 border-brand-500 font-bold text-brand-500' : 'text-gray-500'}`}
                >
                    Participants
                </button>
                <button 
                    onClick={() => setActiveTab('cms')}
                    className={`pb-2 px-1 ${activeTab === 'cms' ? 'border-b-2 border-brand-500 font-bold text-brand-500' : 'text-gray-500'}`}
                >
                    Content Management (Guidebook/Poster)
                </button>
            </div>

            {activeTab === 'teams' && (
                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3">Team Name</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3">Member Count</th>
                                <th className="px-6 py-3">Payment</th>
                                <th className="px-6 py-3">Location</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams.map(team => (
                                <tr key={team.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 dark:text-white">{team.name || team.leaderName}</div>
                                        <div className="text-xs text-gray-500">{team.leaderClass}</div>
                                    </td>
                                    <td className="px-6 py-4">{team.category}</td>
                                    <td className="px-6 py-4">{JSON.parse(team.members || "[]").length + 1}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${team.paymentStatus === 'PAID' || team.paymentStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {team.paymentStatus}
                                        </span>
                                        {team.paymentTrxId && <div className="text-xs text-gray-400 mt-1">{team.paymentTrxId}</div>}
                                    </td>
                                    <td className="px-6 py-4">{team.boothLocation?.name || '-'}</td>
                                    <td className="px-6 py-4 flex gap-3">
                                        <button onClick={() => setViewTeam(team)} className="text-gray-600 hover:text-gray-900 dark:hover:text-gray-300 font-medium">View</button>
                                        {(team.paymentStatus !== 'VERIFIED') && (
                                             <button onClick={() => verifyTeam(team.id)} className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 font-medium">Verify</button>
                                        )}
                                        <button onClick={() => setSelectedTeam(team.id)} className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400 font-medium">Set POS</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'cms' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-4xl">
                    <h2 className="text-lg font-bold mb-4">Edit Global Content</h2>
                    <form action={async (formData) => { await updateGlobalSettings(formData); }} className="space-y-6">
                        
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded border">
                            <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Important Links</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Guidebook URL (PDF)</label>
                                    <input type="text" name="setting_guidebook" defaultValue={getSetting('guidebook')} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">WhatsApp Group Invite Link</label>
                                    <input type="text" name="setting_whatsapp_group_link" defaultValue={getSetting('whatsapp_group_link')} className="w-full p-2 border rounded" />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded border">
                            <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Images</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Payment QR Image URL</label>
                                    <input type="text" name="setting_payment_qr_image" defaultValue={getSetting('payment_qr_image')} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Event Poster Image URL</label>
                                    <input type="text" name="setting_event_poster" defaultValue={getSetting('event_poster')} className="w-full p-2 border rounded" />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium mb-1">Booth Layout Image URL</label>
                                    <input type="text" name="setting_booth_layout" defaultValue={getSetting('booth_layout')} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Slider Images (JSON Array)</label>
                                    <textarea name="setting_slider_images" defaultValue={getSetting('slider_images')} rows={3} className="w-full p-2 border rounded font-mono text-sm" />
                                    <p className="text-xs text-gray-500">e.g. ["/img/slide1.jpg", "https://..."]</p>
                                </div>
                            </div>
                        </div>
                        
                         <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded border">
                            <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Payment Gateway Config</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Merchant ID</label>
                                    <input type="text" name="setting_payment_gateway_id" defaultValue={getSetting('payment_gateway_id')} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Secret Key</label>
                                    <input type="password" name="setting_payment_gateway_key" defaultValue={getSetting('payment_gateway_key')} className="w-full p-2 border rounded" />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded shadow font-medium">
                            Save Changes
                        </button>
                    </form>
                </div>
            )}

            {selectedTeam && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-xl">
                        <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Set POS Credentials</h2>
                         {/* Display Team Name */}
                         <p className="text-sm text-gray-500 mb-4">For Team ID: {selectedTeam}</p>
                        <form action={async (formData) => {
                            await setPosCredentials(selectedTeam, formData);
                            setSelectedTeam(null);
                        }}>
                             <div className="mb-4">
                                 <label className="block text-sm font-medium mb-1 dark:text-gray-300">Username</label>
                                 <input type="text" name="username" placeholder="POS Username" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                             </div>
                             <div className="mb-6">
                                 <label className="block text-sm font-medium mb-1 dark:text-gray-300">Password</label>
                                 <input type="text" name="password" placeholder="POS Password" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                             </div>
                             <div className="flex justify-end gap-3">
                                 <button type="button" onClick={() => setSelectedTeam(null)} className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Cancel</button>
                                 <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow">Save Credentials</button>
                             </div>
                        </form>
                    </div>
                </div>
            )}

            {viewTeam && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold dark:text-white">Team Details</h2>
                            <button onClick={()=>setViewTeam(null)} className="text-2xl font-bold">&times;</button>
                        </div>
                        
                        <div className="space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="text-xs text-gray-500 uppercase">Team Name</label>
                                     <div className="font-semibold">{viewTeam.name}</div>
                                 </div>
                                 <div>
                                     <label className="text-xs text-gray-500 uppercase">Category</label>
                                     <div className="font-semibold">{viewTeam.category}</div>
                                 </div>
                                 <div>
                                     <label className="text-xs text-gray-500 uppercase">Leader</label>
                                     <div className="font-semibold">{viewTeam.leaderName} ({viewTeam.leaderClass})</div>
                                     <div className="text-xs text-gray-500">{viewTeam.leaderNis}</div>
                                 </div>
                                 <div>
                                     <label className="text-xs text-gray-500 uppercase">Contact</label>
                                     <div className="font-semibold">{viewTeam.contactInfo}</div>
                                 </div>
                             </div>

                             <div className="border-t pt-2">
                                 <label className="text-xs text-gray-500 uppercase mb-2 block">Members</label>
                                 <ul className="list-disc pl-5">
                                     {JSON.parse(viewTeam.members || "[]").map((m: any, idx: number) => (
                                         <li key={idx} className="mb-1">
                                             <span className="font-medium">{m.name}</span> <span className="text-sm text-gray-500"> - {m.class}{m.absen ? ` No. ${m.absen}` : ''} ({m.nis})</span>
                                         </li>
                                     ))}
                                 </ul>
                             </div>

                             <div className="border-t pt-2 grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="text-xs text-gray-500 uppercase">Main Ingredient</label>
                                     <div className="font-semibold">{viewTeam.mainIngredient?.name || "-"}</div>
                                 </div>
                                  <div>
                                     <label className="text-xs text-gray-500 uppercase">Booth Location</label>
                                     <div className="font-semibold">{viewTeam.boothLocation?.name || "-"}</div>
                                 </div>
                             </div>

                             <div className="border-t pt-2">
                                 <label className="text-xs text-gray-500 uppercase mb-2 block">Submission Status</label>
                                 <div className="grid grid-cols-2 gap-2 text-sm">
                                     <div>BMC: <span className={viewTeam.bmcSubmittedAt ? "text-green-600 font-bold" : "text-gray-400"}>{viewTeam.bmcSubmittedAt ? "Submitted" : "Pending"}</span></div>
                                     <div>Video: <span className={viewTeam.promotionalSubmittedAt ? "text-green-600 font-bold" : "text-gray-400"}>{viewTeam.promotionalSubmittedAt ? "Submitted" : "Pending"}</span></div>
                                     <div>Inventory: <span className={viewTeam.inventorySubmittedAt ? "text-green-600 font-bold" : "text-gray-400"}>{viewTeam.inventorySubmittedAt ? "Submitted" : "Pending"}</span></div>
                                 </div>
                             </div>
                             
                             <div className="border-t pt-4">
                                 <h4 className="font-bold text-sm mb-2">POS Credentials</h4>
                                 <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded flex justify-between">
                                     <div>
                                         <span className="text-xs block text-gray-500">Username</span>
                                         <span className="font-mono font-bold">{viewTeam.posUsername || "Not Set"}</span>
                                     </div>
                                     <div>
                                         <span className="text-xs block text-gray-500">Password</span>
                                         <span className="font-mono font-bold">{viewTeam.posPassword || "Not Set"}</span>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

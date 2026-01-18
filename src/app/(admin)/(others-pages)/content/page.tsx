"use client";
import React, { useState, useEffect } from "react";
import { getGlobalSettings, updateContentSettings, deleteSliderImage } from "@/actions/settings";
import { getIngredients, createIngredient, deleteIngredient } from "@/actions/ingredient";
import FileUpload from "@/components/form/FileUpload";
import MultiFileUpload from "@/components/form/MultiFileUpload";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import { useDialog } from "@/context/DialogContext";

type SliderItem = {
    key: string;
    url: string;
    link: string;
};

type PendingSliderItem = {
    file: File;
    link: string;
};

export default function ContentPage() {
    const { showAlert, showConfirm } = useDialog();
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [whatsapp, setWhatsapp] = useState("");
    const [paymentId, setPaymentId] = useState("");
    const [paymentKey, setPaymentKey] = useState("");
    
    // Files
    const [qrFile, setQrFile] = useState<File|null>(null);
    const [guidebookFile, setGuidebookFile] = useState<File|null>(null);
    const [posterFile, setPosterFile] = useState<File|null>(null);
    const [boothLayoutFile, setBoothLayoutFile] = useState<File|null>(null);
    const [sliderItems, setSliderItems] = useState<SliderItem[]>([]);
    const [newSliderItems, setNewSliderItems] = useState<PendingSliderItem[]>([]);

    // Registration Settings
    const [minMembers, setMinMembers] = useState("1");
    const [maxMembers, setMaxMembers] = useState("5");
    const [regOpen, setRegOpen] = useState("true"); // Stored as "true"/"false" string
    const [regFee, setRegFee] = useState("0");
    const [regMessage, setRegMessage] = useState("");
    
    // Due Dates
    const [bmcDue, setBmcDue] = useState("");
    const [videoDue, setVideoDue] = useState("");
    const [inventoryDue, setInventoryDue] = useState("");
    const [posterDue, setPosterDue] = useState("");

    // Ingredients
    const [ingredients, setIngredients] = useState<any[]>([]);
    const [newIngredient, setNewIngredient] = useState("");

    useEffect(() => {
        getGlobalSettings().then(res => {
            if (res.success && res.data) {
                setSettings(res.data);
                setWhatsapp(res.data.whatsapp_group_link || "");
                setPaymentId(res.data.payment_gateway_id || "");
                setPaymentKey(res.data.payment_gateway_key || "");
                
                // Load Reg Settings
                setMinMembers(res.data.min_team_members || "1");
                setMaxMembers(res.data.max_team_members || "5");
                setRegOpen(res.data.registration_open || "true");
                setRegFee(res.data.registration_fee || "0");
                setRegMessage(res.data.registration_close_message || "");
                
                // Load Dates
                setBmcDue(res.data.bmc_due_date || "");
                setVideoDue(res.data.video_due_date || "");
                setInventoryDue(res.data.inventory_due_date || "");
                setPosterDue(res.data.poster_due_date || "");
            }
            setLoading(false);
        });
        loadIngredients();
    }, []);

    useEffect(() => {
        if (!settings.slider_images) {
            setSliderItems([]);
            return;
        }
        try {
            const parsed = JSON.parse(settings.slider_images);
            if (Array.isArray(parsed)) {
                const normalized: SliderItem[] = parsed
                    .map((item: any) => {
                        if (!item) return null;
                        const key = item.key || item.image || item.path || "";
                        const url = item.url || item.imageUrl || "";
                        if (!key || !url) return null;
                        return {
                            key,
                            url,
                            link: item.link || ""
                        };
                    })
                    .filter((item): item is SliderItem => item !== null);
                setSliderItems(normalized);
            }
        } catch (error) {
            console.warn("Failed to parse slider settings", error);
            setSliderItems([]);
        }
    }, [settings.slider_images]);

    const loadIngredients = async () => {
        const res = await getIngredients();
        if (res.success && res.data) {
            setIngredients(res.data);
        }
    }

    const handleAddIngredient = async () => {
        if(!newIngredient) return;
        setSaving(true);
        await createIngredient(newIngredient);
        setNewIngredient("");
        await loadIngredients();
        setSaving(false);
    }

    const handleDeleteIngredient = async (id: string) => {
        if(!(await showConfirm("Delete ingredient?", "error"))) return;
        setSaving(true);
        await deleteIngredient(id);
        await loadIngredients();
        setSaving(false);
    }

    const handleSliderLinkChange = (idx: number, link: string) => {
        setSliderItems(prev => prev.map((item, i) => i === idx ? { ...item, link } : item));
    };

    const handleNewSliderLinkChange = (idx: number, link: string) => {
        setNewSliderItems(prev => prev.map((item, i) => i === idx ? { ...item, link } : item));
    };

    const handleNewSliderFiles = (files: File[]) => {
        if (!files || files.length === 0) return;
        setNewSliderItems(prev => ([
            ...prev,
            ...files.map(file => ({ file, link: "" }))
        ]));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const fd = new FormData();
        fd.append("setting_whatsapp_group_link", whatsapp);
        fd.append("setting_payment_gateway_id", paymentId);
        fd.append("setting_payment_gateway_key", paymentKey);
        
        // Append Reg Settings
        fd.append("setting_min_team_members", minMembers);
        fd.append("setting_max_team_members", maxMembers);
        fd.append("setting_registration_open", regOpen);
        fd.append("setting_registration_fee", regFee);
        fd.append("setting_registration_close_message", regMessage);
        
        // Append Due Dates
        fd.append("setting_bmc_due_date", bmcDue);
        fd.append("setting_video_due_date", videoDue);
        fd.append("setting_inventory_due_date", inventoryDue);
        fd.append("setting_poster_due_date", posterDue);

        if (qrFile) fd.append("setting_payment_qr_image", qrFile);
        if (guidebookFile) fd.append("setting_guidebook", guidebookFile);
        if (posterFile) fd.append("setting_event_poster", posterFile);
        if (boothLayoutFile) fd.append("setting_booth_layout", boothLayoutFile);

        fd.append(
            "setting_slider_images_metadata",
            JSON.stringify(sliderItems.map(item => ({ key: item.key, link: item.link || "" })))
        );

        newSliderItems.forEach(item => {
            fd.append("setting_slider_images_new_metadata", JSON.stringify({ link: item.link || "" }));
            fd.append("setting_slider_images_new_files", item.file);
        });

        const res = await updateContentSettings(fd);
        setSaving(false);
        if (res.success) {
            await showAlert("Settings updated successfully!", "success");
            // Refresh settings
            const newSettings = await getGlobalSettings();
            if (newSettings.data) setSettings(newSettings.data);
            if (newSettings.data) {
                setRegMessage(newSettings.data.registration_close_message || "");
            }
            
            // Clear file inputs
            setQrFile(null);
            setGuidebookFile(null);
            setPosterFile(null);
            setBoothLayoutFile(null);
            setNewSliderItems([]);
        } else {
            await showAlert("Failed to update settings.", "error");
        }
    };

    const handleDeleteSlider = async (path: string) => {
        if(!(await showConfirm("Delete this image?", "error"))) return;
        setSaving(true);
        await deleteSliderImage(path);
        const newSettings = await getGlobalSettings();
        if (newSettings.data) setSettings(newSettings.data);
        setSaving(false);
    }

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-6 text-2xl font-bold dark:text-white">Content Management</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* General Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label>WhatsApp Group Link</Label>
                        <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="https://chat.whatsapp.com/..." />
                    </div>
                    <div>
                        <Label>Payment Gateway ID (YoGateway)</Label>
                        <Input value={paymentId} onChange={(e) => setPaymentId(e.target.value)} />
                    </div>
                     <div>
                        <Label>Payment Gateway Key</Label>
                        <Input value={paymentKey} onChange={(e) => setPaymentKey(e.target.value)} type="password" />
                    </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    Enter YoGateway API Key above to enable Dynamic QRIS generation.
                </div>

                <div className="h-px bg-gray-200 dark:bg-gray-700 my-6"></div>
                
                {/* Registration Constraints & Fee */}
                <div>
                    <Label className="text-lg font-bold mb-4 block text-black dark:text-white">Registration Controls</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                             <Label>Registration Fee (IDR)</Label>
                             <Input type="number" value={regFee} onChange={(e) => setRegFee(e.target.value)} />
                        </div>
                        <div>
                             <Label>Registration Status</Label>
                             <select className="w-full p-3 border rounded" value={regOpen} onChange={(e) => setRegOpen(e.target.value)}>
                                 <option value="true">OPEN</option>
                                 <option value="false">CLOSED</option>
                             </select>
                        </div>
                        <div>
                             <Label>Min Members</Label>
                             <Input type="number" value={minMembers} onChange={(e) => setMinMembers(e.target.value)} />
                        </div>
                        <div>
                             <Label>Max Members</Label>
                             <Input type="number" value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} />
                        </div>
                            <div className="md:col-span-2">
                                <Label>Closed Registration Message</Label>
                                <TextArea
                                  rows={3}
                                  value={regMessage}
                                  onChange={setRegMessage}
                                  placeholder="Pesan yang ditampilkan ketika pendaftaran ditutup"
                                  hint="Ditampilkan kepada peserta baru ketika registrasi dinonaktifkan."
                                />
                            </div>
                    </div>
                </div>

                <div className="h-px bg-gray-200 dark:bg-gray-700 my-6"></div>
                
                {/* Due Dates */}
                 <div>
                    <Label className="text-lg font-bold mb-4 block text-black dark:text-white">Submission Due Dates</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                             <Label>BMC Deadline</Label>
                             <Input type="datetime-local" value={bmcDue} onChange={(e) => setBmcDue(e.target.value)} />
                        </div>
                        <div>
                             <Label>Video Deadline</Label>
                             <Input type="datetime-local" value={videoDue} onChange={(e) => setVideoDue(e.target.value)} />
                        </div>
                         <div>
                             <Label>Poster Deadline</Label>
                             <Input type="datetime-local" value={posterDue} onChange={(e) => setPosterDue(e.target.value)} />
                        </div>
                        <div>
                             <Label>Inventory List Deadline</Label>
                             <Input type="datetime-local" value={inventoryDue} onChange={(e) => setInventoryDue(e.target.value)} />
                        </div>
                    </div>
                </div>


                <div className="h-px bg-gray-200 dark:bg-gray-700 my-6"></div>

                {/* Main Ingredients Section */}
                <div>
                     <Label>F&B Main Ingredients Options</Label>
                     <div className="flex gap-2 mb-4">
                         <Input 
                            value={newIngredient} 
                            onChange={(e) => setNewIngredient(e.target.value)} 
                            placeholder="Add ingredient (e.g. Rice, Noodle...)" 
                         />
                         <button 
                            type="button" 
                            onClick={handleAddIngredient}
                            disabled={!newIngredient}
                            className="bg-brand-500 text-white px-4 rounded disabled:opacity-50"
                         >Add</button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                         {ingredients.map(ing => (
                             <div key={ing.id} className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full flex items-center gap-2 border dark:border-gray-700">
                                 <span>{ing.name}</span>
                                 <button type="button" onClick={() => handleDeleteIngredient(ing.id)} className="text-red-500 font-bold">&times;</button>
                             </div>
                         ))}
                         {ingredients.length === 0 && <p className="text-gray-400 text-sm">No ingredients added yet.</p>}
                     </div>
                </div>

                <div className="h-px bg-gray-200 dark:bg-gray-700 my-6"></div>

                {/* Slider Images Section */}
                <div>
                     <Label>Slider Images</Label>
                     <div className="space-y-4">
                         {sliderItems.length > 0 && (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {sliderItems.map((item, idx) => (
                                     <div key={item.key} className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
                                         <div className="relative">
                                             <img src={item.url} className="w-full h-32 object-cover" />
                                             <button
                                                 type="button"
                                                 onClick={() => handleDeleteSlider(item.key)}
                                                 className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow"
                                             >&times;</button>
                                         </div>
                                         <div className="p-3 space-y-2">
                                             <Label className="text-xs">Link (optional)</Label>
                                             <Input
                                                 value={item.link || ""}
                                                 onChange={(event) => handleSliderLinkChange(idx, event.target.value)}
                                                 placeholder="https://example.com"
                                             />
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}

                         <div>
                             <MultiFileUpload
                                 label="Drag & Drop new slider images here"
                                 onFilesSelect={handleNewSliderFiles}
                             />
                             {newSliderItems.length > 0 && (
                                 <div className="mt-3 space-y-3">
                                     {newSliderItems.map((item, idx) => (
                                         <div key={`${item.file.name}-${idx}`} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                                             <div className="flex justify-between items-center">
                                                 <span className="text-sm font-medium">
                                                     {item.file.name}
                                                 </span>
                                                 <button
                                                     type="button"
                                                     onClick={() => setNewSliderItems(prev => prev.filter((_, i) => i !== idx))}
                                                     className="text-red-500 text-sm font-semibold"
                                                 >Remove</button>
                                             </div>
                                             <div className="mt-2">
                                                 <Label className="text-xs">Link (optional)</Label>
                                                 <Input
                                                     value={item.link}
                                                     onChange={(event) => handleNewSliderLinkChange(idx, event.target.value)}
                                                     placeholder="https://example.com"
                                                 />
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                     </div>
                </div>

                <div className="h-px bg-gray-200 dark:bg-gray-700 my-6"></div>

                {/* File Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Payment QR */}
                    <div>
                        <Label>Payment QR Image (Automatic Fallback)</Label>
                        <div className="mb-2">
                            {settings.payment_qr_image && !qrFile && (
                                <div className="text-sm text-green-600 mb-2">Current: {settings.payment_qr_image}</div>
                            )}
                        </div>
                        <FileUpload 
                            label="Drag QR Image here" 
                            accept={{'image/*': []}}
                            onFileSelect={setQrFile}
                        />
                    </div>

                    {/* Guidebook */}
                    <div>
                        <Label>Guidebook (PDF)</Label>
                        <div className="mb-2">
                             {settings.guidebook && !guidebookFile && (
                                <div className="text-sm text-green-600 mb-2">Current: {settings.guidebook}</div>
                            )}
                        </div>
                        <FileUpload 
                            label="Drag Guidebook PDF here" 
                            accept={{'application/pdf': []}}
                            onFileSelect={setGuidebookFile}
                        />
                    </div>

                    {/* Event Poster */}
                    <div>
                        <Label>Event Poster</Label>
                         <div className="mb-2">
                             {settings.event_poster && !posterFile && (
                                <div className="text-sm text-green-600 mb-2">Current: {settings.event_poster}</div>
                            )}
                        </div>
                        <FileUpload 
                            label="Drag Poster Image here" 
                            accept={{'image/*': []}}
                            onFileSelect={setPosterFile}
                        />
                    </div>

                    {/* Booth Layout */}
                    <div>
                        <Label>Booth Layout Image (Denah)</Label>
                         <div className="mb-2">
                             {(settings as any).booth_layout && !boothLayoutFile && (
                                <div className="text-sm text-green-600 mb-2">Current: {(settings as any).booth_layout}</div>
                            )}
                        </div>
                        <FileUpload 
                            label="Drag Booth Map/Denah here" 
                            accept={{'image/*': []}}
                            onFileSelect={setBoothLayoutFile}
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-8">
                    <button 
                        type="submit" 
                        disabled={saving} 
                        className="px-8 py-3 bg-brand-500 text-white font-bold rounded hover:bg-brand-600 disabled:opacity-50"
                    >
                        {saving ? "Saving Changes..." : "Save All Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}

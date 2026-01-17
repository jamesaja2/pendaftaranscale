"use client";
import React, { useState, useEffect } from 'react';
import { createTeamAction, cancelRegistration } from "@/actions/team";
import { checkPaymentStatus } from "@/actions/payment";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import StudentSelect from "@/components/form/StudentSelect";

export default function RegistrationWizard({ meta, existingTeam }: { meta: any, existingTeam?: any }) {
    // If existingTeam is provided and not paid, start at Step 5
    const initialStep = (existingTeam && existingTeam.paymentStatus !== 'PAID') ? 5 : 1;

    const [step, setStep] = useState(initialStep);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdTeam, setCreatedTeam] = useState<any>(existingTeam || null); // To store team data after creation for Step 5

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        leaderName: "",
        leaderClass: "", 
        contactInfo: "",
        members: [] as { nis: string, name: string, class: string, absen?: string }[],
        category: "JASA",
        mainIngredientId: "",
        boothLocationId: ""
    });

    // Validations
    const minM = meta?.minMembers || 1;
    const maxM = meta?.maxMembers || 5;
    const totalMembers = formData.members.length + 1; // +1 Leader
    const isMemberCountValid = totalMembers >= minM && totalMembers <= maxM;

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        const payload = {
            name: formData.name,
            leaderName: formData.leaderName, 
            members: JSON.stringify(formData.members),
            contactInfo: formData.contactInfo,
            category: formData.category as any,
            mainIngredientId: formData.mainIngredientId || undefined,
            boothLocationId: formData.boothLocationId || undefined
        };

        const res = await createTeamAction(payload);
        setLoading(false);

        if ((res as any).error) {
            setError((res as any).error);
        } else {
            // Move to Step 5 (Payment) instead of redirecting
            // We need the team object ideally. 
            // Assuming createTeamAction might just return { success: true } currently or undefined,
            // we should update it or assume success. 
            // Ideally res.team would be great. But if not available, we might need to refetch 
            // or just rely on the user to pay which will verify against the ID.
            // For now, let's assume we can proceed to payment. 
            // If createTeamAction doesn't return the team object, the payment section needs the ID.
            // Let's assume the user is logged in, so we can fetch 'my team' or pass the returned team.
            
            // NOTE: If createTeamAction returns the team (which it should), set it.
            if ((res as any).team) {
                setCreatedTeam((res as any).team);
                setStep(5);
            } else {
                // Fallback if action doesn't return team, reload to dashboard
                // window.location.href = "/";
                // But user wants payment here. Let's force a reload to /register? 
                // No, reload to dashboard is safer if we can't get ID.
                 window.location.href = "/";
            }
        }
    };

    // --- STEP 1: Basic Info (Team Name, Leader, Contact) ---
    if (step === 1) {
        return (
            <WizardCard title="Step 1: Team & Leader Info" error={error}>
                <div>
                    <Label>Team Name</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. The Avengers" />
                </div>
                
                <div>
                    <Label>Cluster Leader (Ketua)</Label>
                    <StudentSelect 
                        label=""
                        placeholder="Search student..."
                        selectedStudent={formData.leaderName ? { name: formData.leaderName, nis: "", class: formData.leaderClass, absen: "" } : null}
                        onSelect={(s) => {
                             if(s) setFormData({...formData, leaderName: s.name, leaderClass: s.class + (s.absen ? ` - No. ${s.absen}` : "") });
                        }}
                    />
                </div>

                <div>
                    <Label>WhatsApp Contact</Label>
                    <Input value={formData.contactInfo} onChange={e => setFormData({...formData, contactInfo: e.target.value})} placeholder="0812..." />
                </div>

                <div className="flex justify-end mt-4">
                    <Button disabled={!formData.name || !formData.leaderName || !formData.contactInfo} onClick={() => setStep(2)}>Next: Members</Button>
                </div>
            </WizardCard>
        );
    }

    // --- STEP 2: Members ---
    if (step === 2) {
        return (
             <WizardCard title="Step 2: Add Members" error={error}>
                <div className="mb-4">
                    <Label>Add Member</Label>
                    <StudentSelect 
                        label=""
                        placeholder="Search to add..."
                        selectedStudent={null}
                        resetOnSelect={true}
                        onSelect={(s) => {
                             if(s && !formData.members.find(m => m.name === s.name) && s.name !== formData.leaderName) {
                                 // Check max limit (excluding step 3 logic, we check here too for better UX)
                                 // Current total = members.length + 1 (leader). If < maxM, we can add.
                                 if (formData.members.length + 1 < maxM) {
                                      setFormData(prev => ({...prev, members: [...prev.members, { nis: s.nis, name: s.name, class: s.class, absen: s.absen }]}));
                                 } else {
                                     alert(`Maximum ${maxM} members allowed (including leader).`);
                                 }
                             }
                        }}
                    />
                </div>

                <div className="space-y-2 mb-4">
                    {formData.members.map((m, idx) => (
                        <div key={idx} className="flex justify-between bg-gray-50 p-2 rounded border">
                            <span>{m.name} ({m.class}{m.absen ? ` - No. ${m.absen}` : ""})</span>
                            <button onClick={()=>setFormData(prev => ({...prev, members: prev.members.filter((_,i)=>i!==idx)}))} className="text-red-500 font-bold">&times;</button>
                        </div>
                    ))}
                    {formData.members.length === 0 && <p className="text-gray-400 italic">No members added.</p>}
                </div>
                
                <div className="flex justify-between mt-4">
                    <Button onClick={() => setStep(1)} secondary>Back</Button>
                    <Button 
                        onClick={() => {
                            if (!isMemberCountValid) {
                                alert(`Team must have between ${minM} and ${maxM} members (including leader). Currently: ${totalMembers}`);
                                return;
                            }
                            setStep(3);
                        }}
                    >Next: Category</Button>
                </div>
             </WizardCard>
        );
    }

    // --- STEP 3: Category ---
    if (step === 3) {
        return (
             <WizardCard title="Step 3: Choose Category" error={error}>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {["JASA", "BARANG", "FNB"].map(cat => (
                        <div key={cat} 
                             onClick={() => setFormData({...formData, category: cat})}
                             className={`p-4 border rounded cursor-pointer text-center font-bold ${formData.category === cat ? 'bg-brand-500 text-white border-brand-500' : 'bg-white hover:bg-gray-50' }`}
                        >
                            {cat}
                        </div>
                    ))}
                </div>
                
                <div className="flex justify-between mt-4">
                    <Button onClick={() => setStep(2)} secondary>Back</Button>
                    <Button onClick={() => setStep(4)}>Next: Selection</Button>
                </div>
             </WizardCard>
        );
    }

    // --- STEP 4: Ingredient & Booth ---
    if (step === 4) {
        // Filter Ingredients based on usage
        const availableIngredients = meta?.ingredients?.filter((i:any) => (i.usage || 0) < 2) || [];
        
        return (
             <WizardCard title="Step 4: Final Selection" error={error}>
                 {formData.category === 'FNB' && (
                     <div className="mb-4">
                         <Label>Main Ingredient (1 per Team)</Label>
                         <select 
                            className="w-full p-3 border rounded"
                            value={formData.mainIngredientId} 
                            onChange={e => setFormData({...formData, mainIngredientId: e.target.value})}
                         >
                             <option value="">-- Select Available Ingredient --</option>
                             {availableIngredients.map((i:any) => (
                                 <option key={i.id} value={i.id}>{i.name} (Remaining: {2 - (i.usage || 0)})</option>
                             ))}
                         </select>
                         <p className="text-xs text-gray-500 mt-1">First Come First Serve. Secured only after payment.</p>
                     </div>
                 )}

                 <div className="mb-4">
                     <Label>Booth Selection</Label>
                     
                     {meta?.boothLayout && (
                         <div className="mb-4 border rounded bg-gray-50 p-2">
                             <div className="text-sm font-medium mb-2 text-gray-700">Booth Layout Map</div>
                             <img src={meta.boothLayout} className="w-full h-auto rounded shadow-sm border" alt="Booth Map" />
                         </div>
                     )}

                     <select 
                        className="w-full p-3 border rounded"
                        value={formData.boothLocationId} 
                        onChange={e => setFormData({...formData, boothLocationId: e.target.value})}
                     >
                         <option value="">-- Select Booth --</option>
                         {meta?.booths?.map((b:any) => (
                             <option key={b.id} value={b.id}>{b.name}</option>
                         ))}
                     </select>
                 </div>

                 <div className="flex justify-between mt-6">
                    <Button onClick={() => setStep(3)} secondary>Back</Button>
                    <Button onClick={handleSubmit} disabled={loading || (formData.category === 'FNB' && !formData.mainIngredientId) || !formData.boothLocationId}>
                        {loading ? "Creating..." : "Create & Pay"}
                    </Button>
                </div>
             </WizardCard>
        );
    }

    // --- STEP 5: Payment ---
    if (step === 5 && createdTeam) {
        return <PaymentSection team={createdTeam} meta={meta} />;
    }

    // Fallback if step 5 but no team (shouldn't happen with existingTeam logic)
    if (step === 5 && !createdTeam) {
         return <div className="text-center p-10">Error: No team data found. Please contact admin.</div>;
    }

    return null;
}

function WizardCard({ title, children, error }: any) {
    return (
        <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow dark:bg-gray-800">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">{title}</h2>
            {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>}
            {children}
        </div>
    )
}

function Button({ children, onClick, disabled, secondary }: any) {
    return (
        <button 
            type="button"
            onClick={onClick} 
            disabled={disabled} 
            className={`px-6 py-2 rounded font-medium disabled:opacity-50 transition ${secondary ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-brand-500 text-white hover:bg-brand-600'}`}
        >
            {children}
        </button>
    )
}

// ----------------------------------------------------------------------
// PAYMENT SECTION (Internal to Wizard now)
// ----------------------------------------------------------------------

function PaymentSection({ team, meta }: { team: any, meta: any }) {
    const [timeLeft, setTimeLeft] = useState("");
    const [expired, setExpired] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            if (!team.paymentDeadline) return;
            const deadline = new Date(team.paymentDeadline).getTime();
            const now = new Date().getTime();
            const diff = deadline - now;

            if (diff <= 0) {
                setExpired(true);
                setTimeLeft("00:00");
                clearInterval(timer);
            } else {
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${m}:${s < 10 ? '0'+s : s}`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [team.paymentDeadline]);

    const handleCancel = async () => {
        if (!confirm("Cancel registration and start over?")) return;
        setLoading(true);
        await cancelRegistration();
        window.location.reload();
    }

    const handleCheck = async () => {
        setLoading(true);
        const res = await checkPaymentStatus(team.id);
        if (res.success) {
            // Success! Redirect to dashboard or show success message then redirect
            alert("Payment Verified! Redirecting to dashboard...");
            window.location.href = "/";
        } else {
            alert(res.message || "Not paid yet");
        }
        setLoading(false);
    }

    if (expired) {
         return (
             <div className="max-w-md mx-auto mt-10 p-8 bg-red-50 text-center rounded border border-red-200">
                 <h2 className="text-xl font-bold text-red-600 mb-2">Reservation Expired</h2>
                 <p className="text-gray-600 mb-4">Your 10 minute payment window has closed. The slot has been released.</p>
                 <Button onClick={handleCancel}>Restart Registration</Button>
             </div>
         );
    }

    return (
        <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded shadow text-center dark:bg-gray-800">
            <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Registration Successful!</h2>
            <p className="text-gray-500 mb-6">Please complete payment within 10 minutes to secure your slot.</p>
            
            <div className="text-5xl font-mono font-bold text-orange-500 my-6">{timeLeft}</div>
            
            {team.paymentUrl ? (
                 <div className="mb-6">
                     <p className="mb-4 text-gray-500">Please complete payment via YoGateway:</p>
                     <a href={team.paymentUrl} target="_blank" className="bg-brand-500 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-600 block w-full text-lg shadow-lg">PAY NOW (QRIS/E-Wallet)</a>
                     <p className="text-xs text-gray-400 mt-2">Click button above to open payment page</p>
                 </div>
            ) : (
                <>
                    <p className="mb-6 text-gray-500">Scan QR below to secure your slot</p>
                    {meta?.paymentQr && (
                        <div className="bg-white p-4 inline-block rounded border mb-6 shadow-inner">
                             <img src={meta.paymentQr} className="max-h-64 object-contain" alt="QR" /> 
                        </div>
                    )}
                </>
            )}

            <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <Button onClick={handleCheck} disabled={loading}>{loading ? "Verifying..." : "I Have Paid"}</Button>
                <button onClick={handleCancel} className="text-gray-400 text-sm hover:underline mt-2">Cancel Registration</button>
            </div>
        </div>
    );
}

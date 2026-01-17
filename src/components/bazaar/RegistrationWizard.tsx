\"use client\";
import React, { useState, useEffect, useRef } from 'react';
import { createTeamAction, cancelRegistration } from \"@/actions/team\";
import { checkPaymentStatus } from \"@/actions/payment\";
import Label from \"@/components/form/Label\";
import Input from \"@/components/form/input/InputField\";
import StudentSelect from \"@/components/form/StudentSelect\";
import { ChevronDownIcon, SearchIcon, PlusIcon } from '@/icons';

export default function RegistrationWizard({ meta, existingTeam }: { meta: any, existingTeam?: any }) {
    // If existingTeam is provided and not paid, start at Step 2 (Payment)
    const initialStep = (existingTeam && existingTeam.paymentStatus !== 'PAID') ? 2 : 1;

    const [step, setStep] = useState(initialStep);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdTeam, setCreatedTeam] = useState<any>(existingTeam || null);

    // Form State
    const [formData, setFormData] = useState({
        name: \"\",
        leaderName: \"\",
        leaderClass: \"\", 
        contactInfo: \"\",
        members: [] as { nis: string, name: string, class: string, absen?: string }[],
        category: \"JASA\",
        mainIngredientId: \"\",
        mainIngredientName: \"\", // For custom or selected name
        boothLocationId: \"\"
    });

    // Validations
    const minM = meta?.minMembers || 1;
    const maxM = meta?.maxMembers || 5;
    const totalMembers = formData.members.length + 1; // +1 Leader
    
    // Filter Ingredients based on usage (Max 2)
    const availableIngredients = meta?.ingredients?.filter((i:any) => (i.usage || 0) < 2) || [];

    const handleSubmit = async () => {
        // Final Validation
        if (!formData.name || !formData.leaderName || !formData.contactInfo) {
            setError(\"Please fill in all team and leader details.\");
            window.scrollTo(0,0);
            return;
        }
        if (totalMembers < minM || totalMembers > maxM) {
            setError(\Team size must be between \ and \ members.\);
             window.scrollTo(0,0);
            return;
        }
        if (formData.category === 'FNB' && !formData.mainIngredientName) {
            setError(\"Main ingredient is required for FNB category.\");
             window.scrollTo(0,0);
            return;
        }
        if (!formData.boothLocationId) {
             setError(\"Please select a booth location.\");
              window.scrollTo(0,0);
             return;
        }

        setLoading(true);
        setError(null);

        const payload = {
            name: formData.name,
            leaderName: formData.leaderName, 
            members: JSON.stringify(formData.members),
            contactInfo: formData.contactInfo,
            category: formData.category as any,
            mainIngredientId: formData.mainIngredientId || undefined,
            mainIngredientName: formData.mainIngredientName || undefined,
            boothLocationId: formData.boothLocationId || undefined
        };

        const res = await createTeamAction(payload);
        setLoading(false);

        if ((res as any).error) {
            setError((res as any).error);
            window.scrollTo(0,0);
        } else {
            if ((res as any).team) {
                setCreatedTeam((res as any).team);
                setStep(2); // Go to Payment
                window.scrollTo(0,0);
            } else {
                 window.location.href = \"/\";
            }
        }
    };

    // --- STEP 1: All-in-One Form ---
    if (step === 1) {
        return (
            <div className=\"max-w-3xl mx-auto mt-6\">
                <div className=\"bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden\">
                    {/* Header */}
                    <div className=\"bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-6\">
                         <h1 className=\"text-2xl font-bold text-white mb-2\">Team Registration</h1>
                         <p className=\"text-brand-100 text-sm\">Fill in the details below to register your team.</p>
                    </div>

                    {error && (
                        <div className=\"mx-8 mt-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-start gap-2\">
                             <span className=\"font-bold\">Error:</span> {error}
                        </div>
                    )}

                    <div className=\"p-8 space-y-8\">
                        
                        {/* Section 1: Team Leader */}
                        <section className=\"space-y-4\">
                            <h2 className=\"text-lg font-semibold border-b pb-2 flex items-center gap-2 text-gray-800 dark:text-gray-200\">
                                <span className=\"flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold\">1</span>
                                Leader Info
                            </h2>
                            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                                <div>
                                    <Label>Team Name</Label>
                                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder=\"e.g. The Avengers\" />
                                </div>
                                <div>
                                     <Label>WhatsApp Contact</Label>
                                     <Input value={formData.contactInfo} onChange={e => setFormData({...formData, contactInfo: e.target.value})} placeholder=\"0812...\" />
                                </div>
                                <div className=\"md:col-span-2\">
                                    <Label>Cluster Leader (Ketua)</Label>
                                    <StudentSelect 
                                        label=\"\"
                                        placeholder=\"Search student name...\"
                                        selectedStudent={formData.leaderName ? { name: formData.leaderName, nis: \"\", class: formData.leaderClass, absen: \"\" } : null}
                                        onSelect={(s) => {
                                            if(s) setFormData({...formData, leaderName: s.name, leaderClass: s.class + (s.absen ? \ - No. \\ : \"\") });
                                        }}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Members */}
                        <section className=\"space-y-4\">
                            <h2 className=\"text-lg font-semibold border-b pb-2 flex items-center gap-2 text-gray-800 dark:text-gray-200\">
                                <span className=\"flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold\">2</span>
                                Team Members ({totalMembers}/{maxM})
                            </h2>
                            
                            <div className=\"space-y-3\">
                                {formData.members.map((m, idx) => (
                                    <div key={idx} className=\"flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-700 group\">
                                        <div className=\"flex items-center gap-3\">
                                            <div className=\"w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600\">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className=\"font-medium text-gray-900 dark:text-gray-100\">{m.name}</p>
                                                <p className=\"text-xs text-gray-500\">{m.class} {m.absen ? \#\\ : ''}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={()=>setFormData(prev => ({...prev, members: prev.members.filter((_,i)=>i!==idx)}))} 
                                            className=\"text-gray-400 hover:text-red-500 transition-colors p-2\"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {totalMembers < maxM && (
                                <div className=\"mt-2\">
                                    <Label>Add Member</Label>
                                    <StudentSelect 
                                        label=\"\"
                                        placeholder=\"Search member...\"
                                        selectedStudent={null}
                                        resetOnSelect={true}
                                        onSelect={(s) => {
                                            if(s && !formData.members.find(m => m.name === s.name) && s.name !== formData.leaderName) {
                                                if (totalMembers < maxM) {
                                                    setFormData(prev => ({...prev, members: [...prev.members, { nis: s.nis, name: s.name, class: s.class, absen: s.absen }]}));
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </section>

                        {/* Section 3: Project Details */}
                        <section className=\"space-y-6\">
                            <h2 className=\"text-lg font-semibold border-b pb-2 flex items-center gap-2 text-gray-800 dark:text-gray-200\">
                                <span className=\"flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold\">3</span>
                                Project Details
                            </h2>

                            <div>
                                <Label>Category</Label>
                                <div className=\"grid grid-cols-3 gap-3 mt-2\">
                                    {[\"JASA\", \"BARANG\", \"FNB\"].map(cat => (
                                        <button 
                                            key={cat}
                                            type=\"button\" 
                                            onClick={() => setFormData({...formData, category: cat})}
                                            className={\py-3 px-4 rounded-lg font-medium border-2 transition-all \\}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {formData.category === 'FNB' && (
                                <div className=\"animate-fade-in\">
                                    <Label>Main Ingredient</Label>
                                    <p className=\"text-xs text-gray-500 mb-2\">Max 2 teams can use the same ingredient. Add a new one if yours isn't listed.</p>
                                    <MainIngredientCombobox 
                                        items={availableIngredients}
                                        selectedId={formData.mainIngredientId}
                                        selectedName={formData.mainIngredientName}
                                        onChange={(val) => setFormData({...formData, mainIngredientId: val.id || \"\", mainIngredientName: val.name })}
                                    />
                                </div>
                            )}

                             <div>
                                 <Label>Booth Selection</Label>
                                 <div className=\"grid md:grid-cols-2 gap-6 items-start mt-2\">
                                    {meta?.boothLayout && (
                                         <div className=\"border rounded-lg bg-gray-50 p-2\">
                                             <img src={meta.boothLayout} className=\"w-full h-auto rounded shadow-sm\" alt=\"Booth Map\" />
                                         </div>
                                     )}
                                     <div>
                                         <select 
                                            className=\"w-full p-3 border rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none\"
                                            value={formData.boothLocationId} 
                                            onChange={e => setFormData({...formData, boothLocationId: e.target.value})}
                                         >
                                             <option value=\"\">-- Select Booth --</option>
                                             {meta?.booths?.map((b:any) => (
                                                 <option key={b.id} value={b.id}>{b.name}</option>
                                             ))}
                                         </select>
                                         <div className=\"mt-3 p-3 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100\">
                                            <strong>Note:</strong> Booths are first-come-first-serve. Your slot is only secured after successful payment.
                                         </div>
                                     </div>
                                 </div>
                             </div>

                        </section>

                        <div className=\"pt-6 border-t flex justify-end\">
                            <button 
                                onClick={handleSubmit}
                                disabled={loading}
                                className={\
                                    py-4 px-8 rounded-lg text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all
                                    bg-gradient-to-r from-brand-600 to-brand-500
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                \}
                            >
                                {loading ? \"Processing...\" : \"Submit Registration\"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- STEP 2: Payment ---
    if (step === 2 && createdTeam) {
        return <PaymentSection team={createdTeam} meta={meta} />;
    }

    // Fallback if step 2 but no team
    if (step === 2 && !createdTeam) {
        return <div className=\"text-center p-10 text-red-500\">Error: No team data found. Please contact admin.</div>;
    }

    return null;
}

// --- SUB-COMPONENTS ---

function MainIngredientCombobox({ items, selectedId, selectedName, onChange }: any) {
    const [query, setQuery] = useState(\"\");
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync query with selectedName initially
    useEffect(() => {
        if (!isOpen && selectedName) {
            setQuery(selectedName);
        }
    }, [selectedName, isOpen]);

    useEffect(() => {
        function handleClickOutside(event: any) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                // If closed without selection, revert to selectedName
                if (selectedName) setQuery(selectedName);
                else setQuery(\"\");
            }
        }
        document.addEventListener(\"mousedown\", handleClickOutside);
        return () => document.removeEventListener(\"mousedown\", handleClickOutside);
    }, [selectedName]);

    const filteredItems = query === '' 
        ? items 
        : items.filter((item: any) => 
            item.name.toLowerCase().includes(query.toLowerCase())
          );
    
    // Check if query exactly matches an existing item
    const exactMatch = items.find((item: any) => item.name.toLowerCase() === query.toLowerCase());

    return (
        <div className=\"relative\" ref={wrapperRef}>
            <div className=\"relative\">
                <input 
                    type=\"text\"
                    className=\"w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none\"
                    placeholder=\"Search or add ingredient...\"
                    value={query}
                    onChange={(e) => {
                         setQuery(e.target.value);
                         setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <div className=\"absolute right-3 top-3 text-gray-400\">
                    <ChevronDownIcon />
                </div>
            </div>

            {isOpen && query.length > 0 && (
                <div className=\"absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-xl max-h-60 overflow-y-auto\">
                    {filteredItems.map((item: any) => (
                        <div 
                            key={item.id}
                            className=\"p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center\"
                            onClick={() => {
                                onChange({ id: item.id, name: item.name });
                                setIsOpen(false);
                            }}
                        >
                            <span className=\"font-medium text-gray-800 dark:text-gray-200\">{item.name}</span>
                            <span className=\"text-xs bg-gray-100 px-2 py-1 rounded text-gray-500\">
                                {2 - (item.usage || 0)} left
                            </span>
                        </div>
                    ))}

                    {!exactMatch && query.length > 0 && (
                        <div 
                            className=\"p-3 bg-brand-50 hover:bg-brand-100 cursor-pointer text-brand-700 font-medium flex items-center gap-2 border-t\"
                            onClick={() => {
                                onChange({ id: null, name: query }); // Send Custom Name
                                setIsOpen(false);
                            }}
                        >
                            <PlusIcon className=\"w-4 h-4\" />
                            Add \"{query}\"
                        </div>
                    )}
                    
                    {filteredItems.length === 0 && !exactMatch && (
                        <div className=\"p-3 text-sm text-gray-500 text-center\">
                            No existing matches. Click above to add.
                        </div>
                    )}
                </div>
            )}
             {isOpen && query.length === 0 && items.length > 0 && (
                 <div className=\"absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-xl max-h-60 overflow-y-auto\">
                     {items.map((item: any) => (
                        <div 
                            key={item.id}
                            className=\"p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center\"
                            onClick={() => {
                                onChange({ id: item.id, name: item.name });
                                setIsOpen(false);
                            }}
                        >
                            <span className=\"font-medium text-gray-800 dark:text-gray-200\">{item.name}</span>
                             <span className=\"text-xs bg-gray-100 px-2 py-1 rounded text-gray-500\">
                                {2 - (item.usage || 0)} left
                            </span>
                        </div>
                    ))}
                 </div>
             )}
        </div>
    );
}


// ----------------------------------------------------------------------
// PAYMENT SECTION (Internal to Wizard now)
// ----------------------------------------------------------------------

function PaymentSection({ team, meta }: { team: any, meta: any }) {
    const [timeLeft, setTimeLeft] = useState(\"\");
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
                setTimeLeft(\"00:00\");
                clearInterval(timer);
            } else {
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(\\:\\);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [team.paymentDeadline]);

    const handleCancel = async () => {
        if (!confirm(\"Cancel registration and start over?\")) return;
        setLoading(true);
        await cancelRegistration();
        window.location.reload();
    }

    const handleCheck = async () => {
        setLoading(true);
        const res = await checkPaymentStatus(team.id);
        if (res.success) {
            // Success! Redirect to dashboard or show success message then redirect
            alert(\"Payment Verified! Redirecting to dashboard...\");
            window.location.href = \"/\";
        } else {
            alert(res.message || \"Not paid yet\");
        }
        setLoading(false);
    }

    if (expired) {
         return (
             <div className=\"max-w-md mx-auto mt-10 p-8 bg-white border-2 border-red-100 rounded-xl shadow text-center\">
                 <div className=\"w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4\">
                     <span className=\"text-2xl\">⚠️</span>
                 </div>
                 <h2 className=\"text-xl font-bold text-gray-800 mb-2\">Reservation Expired</h2>
                 <p className=\"text-gray-600 mb-6\">Your 10 minute payment window has closed. The slot has been released.</p>
                 <Button onClick={handleCancel}>Restart Registration</Button>
             </div>
         );
    }

    return (
        <div className=\"max-w-2xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg text-center dark:bg-gray-800 border border-gray-100\">
            <div className=\"w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce\">
                <span className=\"text-2xl\">🎉</span>
            </div>
            <h2 className=\"text-2xl font-bold mb-2 text-gray-800 dark:text-white\">Registration Successful!</h2>
            <p className=\"text-gray-500 mb-6\">Please complete payment within 10 minutes to secure your slot.</p>
            
            <div className=\"bg-orange-50 rounded-lg p-6 mb-8 border border-orange-100\">
                <p className=\"text-sm text-orange-600 uppercase font-bold tracking-wider mb-1\">Time Remaining</p>
                <div className=\"text-5xl font-mono font-bold text-gray-800\">{timeLeft}</div>
            </div>
            
            {team.paymentUrl ? (
                 <div className=\"mb-8\">
                     <p className=\"mb-4 text-gray-500 font-medium\">Click button below to pay via QRIS / E-Wallet</p>
                     <a href={team.paymentUrl} target=\"_blank\" className=\"bg-brand-600 text-white px-8 py-5 rounded-xl font-bold hover:bg-brand-700 block w-full text-xl shadow-xl transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3\">
                        <span>💳</span> PAY NOW
                     </a>
                     <p className=\"text-xs text-gray-400 mt-3\">Secure payment via YoGateway</p>
                 </div>
            ) : (
                <>
                    <p className=\"mb-6 text-gray-500\">Scan QR below to secure your slot</p>
                    {meta?.paymentQr && (
                        <div className=\"bg-white p-4 inline-block rounded-xl border mb-6 shadow-inner\">
                             <img src={meta.paymentQr} className=\"max-h-64 object-contain\" alt=\"QR\" /> 
                        </div>
                    )}
                </>
            )}

            <div className=\"flex flex-col gap-3 max-w-xs mx-auto\">
                <Button onClick={handleCheck} disabled={loading}>{loading ? \"Verifying...\" : \"I Have Paid\"}</Button>
                <button onClick={handleCancel} className=\"text-gray-400 text-sm hover:underline mt-2\">Cancel Registration</button>
            </div>
        </div>
    );
}

function Button({ children, onClick, disabled, secondary }: any) {
    return (
        <button 
            type=\"button\"
            onClick={onClick} 
            disabled={disabled} 
            className={\px-6 py-3 rounded-lg font-bold disabled:opacity-50 transition \\}
        >
            {children}
        </button>
    )
}

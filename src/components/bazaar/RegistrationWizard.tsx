"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createTeamAction, cancelRegistration } from "@/actions/team";
import { checkPaymentStatus, updatePaymentMethod, submitManualPaymentProofAction, updatePaymentPlan } from "@/actions/payment";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import StudentSelect from "@/components/form/StudentSelect";
import { ChevronDownIcon, PlusIcon } from '@/icons';
import { useDialog } from "@/context/DialogContext";
import { useUploadWithProgress } from "@/hooks/useUploadWithProgress";

export default function RegistrationWizard({ meta, existingTeam }: { meta: any, existingTeam?: any }) {
    const { showAlert, showConfirm } = useDialog();
    // If existingTeam is provided and not paid, start at Step 2 (Payment)
    const initialStep = (existingTeam && existingTeam.paymentStatus !== 'PAID') ? 2 : 1;

    const [step, setStep] = useState(initialStep);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdTeam, setCreatedTeam] = useState<any>(existingTeam || null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        leaderName: "",
        leaderClass: "", 
        contactInfo: "",
        members: [] as { nis: string, name: string, class: string, absen?: string }[],
        category: "JASA",
        mainIngredientId: "",
        mainIngredientName: "", // For custom or selected name
        boothLocationId: ""
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
            setError("Please fill in all team and leader details.");
            window.scrollTo(0,0);
            return;
        }
        if (totalMembers < minM || totalMembers > maxM) {
            setError(`Team size must be between ${minM} and ${maxM} members.`);
            window.scrollTo(0,0);
            return;
        }
        if (formData.category === 'FNB' && !formData.mainIngredientName) {
            setError("Main ingredient is required for FNB category.");
             window.scrollTo(0,0);
            return;
        }
        if (!formData.boothLocationId) {
             setError("Please select a booth location.");
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
                 window.location.href = "/";
            }
        }
    };

    // --- STEP 1: All-in-One Form ---
    if (step === 1) {
        return (
            <div className="max-w-3xl mx-auto mt-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-6">
                         <h1 className="text-2xl font-bold text-white mb-2">Team Registration</h1>
                         <p className="text-brand-100 text-sm">Fill in the details below to register your team.</p>
                    </div>

                    {error && (
                        <div className="mx-8 mt-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-start gap-2">
                             <span className="font-bold">Error:</span> {error}
                        </div>
                    )}

                    <div className="p-8 space-y-8">
                        
                        {/* Section 1: Team Leader */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold border-b pb-2 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold">1</span>
                                Leader Info
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Team Name</Label>
                                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. The Avengers" />
                                </div>
                                <div>
                                     <Label>WhatsApp Contact</Label>
                                     <Input value={formData.contactInfo} onChange={e => setFormData({...formData, contactInfo: e.target.value})} placeholder="0812..." />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Cluster Leader (Ketua)</Label>
                                    <StudentSelect 
                                        label=""
                                        placeholder="Search student name..."
                                        selectedStudent={formData.leaderName ? { name: formData.leaderName, nis: "", class: formData.leaderClass, absen: "" } : null}
                                        onSelect={(s) => {
                                            if(s) setFormData({...formData, leaderName: s.name, leaderClass: s.class + (s.absen ? " - No. " + s.absen : "") });
                                        }}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Members */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold border-b pb-2 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold">2</span>
                                Team Members ({totalMembers}/{maxM})
                            </h2>
                            
                            <div className="space-y-3">
                                {formData.members.map((m, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-700 group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">{m.name}</p>
                                                <p className="text-xs text-gray-500">{m.class} {m.absen ? `#${m.absen}` : ''}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={()=>setFormData(prev => ({...prev, members: prev.members.filter((_,i)=>i!==idx)}))} 
                                            className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {totalMembers < maxM && (
                                <div className="mt-2">
                                    <Label>Add Member</Label>
                                    <StudentSelect 
                                        label=""
                                        placeholder="Search member..."
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
                        <section className="space-y-6">
                            <h2 className="text-lg font-semibold border-b pb-2 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold">3</span>
                                Project Details
                            </h2>

                            <div>
                                <Label>Category</Label>
                                <div className="grid grid-cols-3 gap-3 mt-2">
                                    {["JASA", "BARANG", "FNB"].map(cat => (
                                        <button 
                                            key={cat}
                                            type="button" 
                                            onClick={() => setFormData({...formData, category: cat})}
                                            className={`py-3 px-4 rounded-lg font-medium border-2 transition-all ${
                                                formData.category === cat 
                                                    ? 'border-brand-500 bg-brand-50 text-brand-700' 
                                                    : 'border-gray-200 hover:border-brand-200 dark:border-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {formData.category === 'FNB' && (
                                <div className="animate-fade-in">
                                    <Label>Main Ingredient</Label>
                                    <p className="text-xs text-gray-500 mb-2">Max 2 teams can use the same ingredient. Add a new one if yours isn't listed.</p>
                                    <MainIngredientCombobox 
                                        items={availableIngredients}
                                        selectedId={formData.mainIngredientId}
                                        selectedName={formData.mainIngredientName}
                                        onChange={(val: any) => setFormData({...formData, mainIngredientId: val.id || "", mainIngredientName: val.name })}
                                    />
                                </div>
                            )}

                             <div>
                                 <Label>Booth Selection</Label>
                                 <div className="grid md:grid-cols-2 gap-6 items-start mt-2">
                                    {meta?.boothLayout && (
                                         <div className="border rounded-lg bg-gray-50 p-2">
                                             <img src={meta.boothLayout} className="w-full h-auto rounded shadow-sm" alt="Booth Map" />
                                         </div>
                                     )}
                                     <div>
                                         <select 
                                            className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
                                            value={formData.boothLocationId} 
                                            onChange={e => setFormData({...formData, boothLocationId: e.target.value})}
                                         >
                                             <option value="">-- Select Booth --</option>
                                             {meta?.booths?.map((b:any) => (
                                                 <option key={b.id} value={b.id}>{b.name}</option>
                                             ))}
                                         </select>
                                         <div className="mt-3 p-3 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
                                            <strong>Note:</strong> Booths are first-come-first-serve. Your slot is only secured after successful payment.
                                         </div>
                                     </div>
                                 </div>
                             </div>

                        </section>

                        <div className="pt-6 border-t flex justify-end">
                            <button 
                                onClick={handleSubmit}
                                disabled={loading}
                                className={`
                                    py-4 px-8 rounded-lg text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all
                                    bg-gradient-to-r from-brand-600 to-brand-500
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                            >
                                {loading ? "Processing..." : "Submit Registration"}
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
        return <div className="text-center p-10 text-red-500">Error: No team data found. Please contact admin.</div>;
    }

    return null;
}

// --- SUB-COMPONENTS ---

function MainIngredientCombobox({ items, selectedId, selectedName, onChange }: any) {
    const [query, setQuery] = useState("");
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
                else setQuery("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [selectedName]);

    const filteredItems = query === '' 
        ? items 
        : items.filter((item: any) => 
            item.name.toLowerCase().includes(query.toLowerCase())
          );
    
    // Check if query exactly matches an existing item
    const exactMatch = items.find((item: any) => item.name.toLowerCase() === query.toLowerCase());

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <input 
                    type="text"
                    className="w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="Search or add ingredient..."
                    value={query}
                    onChange={(e) => {
                         setQuery(e.target.value);
                         setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <div className="absolute right-3 top-3 text-gray-400">
                    <ChevronDownIcon />
                </div>
            </div>

            {isOpen && query.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredItems.map((item: any) => (
                        <div 
                            key={item.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                            onClick={() => {
                                onChange({ id: item.id, name: item.name });
                                setIsOpen(false);
                            }}
                        >
                            <span className="font-medium text-gray-800 dark:text-gray-200">{item.name}</span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                                {2 - (item.usage || 0)} left
                            </span>
                        </div>
                    ))}

                    {!exactMatch && query.length > 0 && (
                        <div 
                            className="p-3 bg-brand-50 hover:bg-brand-100 cursor-pointer text-brand-700 font-medium flex items-center gap-2 border-t"
                            onClick={() => {
                                onChange({ id: null, name: query }); // Send Custom Name
                                setIsOpen(false);
                            }}
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add "{query}"
                        </div>
                    )}
                    
                    {filteredItems.length === 0 && !exactMatch && (
                        <div className="p-3 text-sm text-gray-500 text-center">
                            No existing matches. Click above to add.
                        </div>
                    )}
                </div>
            )}
             {isOpen && query.length === 0 && items.length > 0 && (
                 <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                     {items.map((item: any) => (
                        <div 
                            key={item.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                            onClick={() => {
                                onChange({ id: item.id, name: item.name });
                                setIsOpen(false);
                            }}
                        >
                            <span className="font-medium text-gray-800 dark:text-gray-200">{item.name}</span>
                             <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
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

type PaymentMethodOption = 'QRIS' | 'MANUAL_TRANSFER';
type PaymentPlanOption = 'FULL' | 'DOWN_PAYMENT';

function PaymentSection({ team, meta }: { team: any, meta: any }) {
    const { showAlert, showConfirm } = useDialog();
    const paymentMethodFromServer: PaymentMethodOption = team.paymentMethod || 'QRIS';
    const paymentOptionsFlags = meta?.paymentOptions || { qrisEnabled: true, manualEnabled: true };
    const paymentPlan = (team.paymentPlan as PaymentPlanOption | null) || null;
    const paymentPlanAcceptedAt = team.paymentPlanAcceptedAt ? new Date(team.paymentPlanAcceptedAt) : null;
    const planReady = paymentPlan === 'FULL' || (paymentPlan === 'DOWN_PAYMENT' && !!paymentPlanAcceptedAt);
    const planLabelMap: Record<PaymentPlanOption, string> = {
        FULL: 'Full Payment',
        DOWN_PAYMENT: 'Down Payment',
    };
    const registrationFee = meta?.registrationFee || 0;
    const downPaymentAmount = meta?.downPaymentAmount || 50000;
    const downPaymentDisplay = formatCurrencyId(downPaymentAmount);
    const [planTermsOpen, setPlanTermsOpen] = useState(false);
    const [pendingPlan, setPendingPlan] = useState<PaymentPlanOption | null>(null);
    const [planActionLoading, setPlanActionLoading] = useState(false);
    const termsContentRef = useRef<HTMLDivElement | null>(null);
    const planCards: Array<{ key: PaymentPlanOption; title: string; highlight: string; bullets: string[] }> = [
        {
            key: 'FULL',
            title: 'Full Payment',
            highlight: 'Pay everything now',
            bullets: [
                'Entire registration fee paid upfront',
                'No deductions from future sales',
                'Fastest verification and booth locking',
            ],
        },
        {
            key: 'DOWN_PAYMENT',
            title: 'Down Payment',
            highlight: 'Split into two phases',
            bullets: [
                `Bayar ${downPaymentDisplay} sebagai komitmen awal`,
                'Sisa biaya otomatis dipotong dari hasil bazaar resmi',
                'Status tim tertandai sebagai "Down Payment" di panel admin',
                'Wajib menyetujui ketentuan pelunasan sebelum lanjut',
            ],
        },
    ];
    const downPaymentTerms = [
        `Pembayaran down payment sebesar ${downPaymentDisplay} bersifat komitmen awal dan tidak dapat dikembalikan.`,
        'Sisa biaya registrasi akan otomatis dipotong dari hasil penjualan resmi bazaar saat proses settlement.',
        'Jika hasil penjualan tidak mencukupi, tim wajib melunasi kekurangan sebelum menerima pembagian keuntungan.',
        'Panitia dapat menahan atau memotong hasil penjualan hingga seluruh biaya registrasi terpenuhi.',
        'Keterlambatan melunasi kekurangan dapat menyebabkan penundaan distribusi keuntungan atau penangguhan partisipasi.',
        'Status pembayaran Anda akan ditandai sebagai "Down Payment" pada panel admin untuk memudahkan verifikasi.',
        'Dengan menyetujui, tim memahami bahwa hak atas booth dapat dicabut bila kewajiban pembayaran tidak dipenuhi.',
    ];

    useEffect(() => {
        if (planTermsOpen && pendingPlan === 'DOWN_PAYMENT') {
            requestAnimationFrame(() => {
                if (termsContentRef.current) {
                    termsContentRef.current.scrollTop = 0;
                }
            });
        }
    }, [planTermsOpen, pendingPlan]);

    const handlePlanSelection = async (option: PaymentPlanOption) => {
        if (planActionLoading) return;
        if (option === 'DOWN_PAYMENT') {
            setPendingPlan('DOWN_PAYMENT');
            setPlanTermsOpen(true);
            return;
        }
        if (paymentPlan === 'FULL' && planReady) {
            await showAlert('You are already on the full payment plan.', 'info');
            return;
        }
        setPlanActionLoading(true);
        const res = await updatePaymentPlan('FULL', true);
        setPlanActionLoading(false);
        if ((res as any)?.error) {
            await showAlert((res as any).error, 'error');
            return;
        }
        await showAlert('Full payment selected. You can continue to payment.', 'success');
        window.location.reload();
    };

    const handleAcceptDownPaymentTerms = async () => {
        if (planActionLoading) return;
        setPlanActionLoading(true);
        const res = await updatePaymentPlan('DOWN_PAYMENT', true);
        setPlanActionLoading(false);
        if ((res as any)?.error) {
            await showAlert((res as any).error, 'error');
            return;
        }
        setPlanTermsOpen(false);
        await showAlert('Down payment terms accepted. Continue to payment.', 'success');
        window.location.reload();
    };

    const handleClosePlanModal = () => {
        if (planActionLoading) return;
        setPlanTermsOpen(false);
        setPendingPlan(null);
    };
    const planSelectedLabel = paymentPlan ? planLabelMap[paymentPlan] : null;
    const acceptedDateLabel = paymentPlanAcceptedAt ? paymentPlanAcceptedAt.toLocaleDateString('id-ID') : null;
    const methodDefinitions: Array<{
        key: PaymentMethodOption;
        title: string;
        desc: string;
        icon: string;
        enabled: boolean;
    }> = [
        {
            key: 'QRIS',
            title: 'QRIS / Virtual Account',
            desc: 'Instant confirmation via YoGateway',
            icon: '⚡',
            enabled: !!paymentOptionsFlags.qrisEnabled,
        },
        {
            key: 'MANUAL_TRANSFER',
            title: 'Manual Bank Transfer',
            desc: 'Upload proof & wait for admin verification',
            icon: '🏦',
            enabled: !!paymentOptionsFlags.manualEnabled,
        },
    ];
    const availableMethodKeys: PaymentMethodOption[] = methodDefinitions
        .filter((method) => method.enabled || paymentMethodFromServer === method.key)
        .map((method) => method.key);
    const initialMethod: PaymentMethodOption = availableMethodKeys.includes(paymentMethodFromServer)
        ? paymentMethodFromServer
        : availableMethodKeys[0] || 'QRIS';
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption>(initialMethod);
    const [timeLeft, setTimeLeft] = useState("");
    const [expired, setExpired] = useState(false);
    const [loading, setLoading] = useState(false);
    const [switchingMethod, setSwitchingMethod] = useState(false);
    const defaultManualAmount = paymentPlan === 'DOWN_PAYMENT' ? downPaymentAmount : registrationFee;
    const [manualAmount, setManualAmount] = useState<string>(() => {
        if (typeof team.manualPaymentAmount === 'number' && team.manualPaymentAmount > 0) {
            return String(team.manualPaymentAmount);
        }
        if (defaultManualAmount > 0) return String(defaultManualAmount);
        return "";
    });
    const [manualNote, setManualNote] = useState<string>(() => {
        if (team.manualPaymentNote) return team.manualPaymentNote;
        if (paymentPlan === 'DOWN_PAYMENT') {
            return `Down payment ${downPaymentDisplay} (akan dilunasi dari hasil penjualan)`;
        }
        return "";
    });
    const [manualProofKey, setManualProofKey] = useState<string | null>(team.manualPaymentProof || null);
    const [manualProofUrl, setManualProofUrl] = useState<string | null>(team.manualPaymentProofUrl || null);
    const [manualMessage, setManualMessage] = useState<string | null>(null);
    const [submittingManual, setSubmittingManual] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { uploadFile, progress, isUploading, error: uploadError } = useUploadWithProgress();

    const manualSettings = meta?.manualPayment || {};
    const isManual = selectedMethod === 'MANUAL_TRANSFER';
    const hasManualSubmission = Boolean(team.manualPaymentProof);
    const expectedTransferAmount = paymentPlan === 'DOWN_PAYMENT' ? downPaymentAmount : registrationFee;

    useEffect(() => {
        if (!team.paymentDeadline || selectedMethod !== 'QRIS') return;
        const timer = setInterval(() => {
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
                setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [team.paymentDeadline, selectedMethod]);

    const handleCancel = async () => {
        if (!(await showConfirm("Cancel registration and start over?", "warning"))) return;
        setLoading(true);
        await cancelRegistration();
        window.location.reload();
    };

    const handleCheck = async () => {
        setLoading(true);
        const res = await checkPaymentStatus(team.id);
        if (res.success) {
            await showAlert("Payment Verified! Redirecting to dashboard...", "success");
            window.location.href = "/";
        } else {
            await showAlert(res.message || "Not paid yet", "info");
        }
        setLoading(false);
    };

    const handleMethodSelect = async (method: PaymentMethodOption) => {
        if (method === selectedMethod) return;
        if (!availableMethodKeys.includes(method)) {
            await showAlert('Payment method not available. Please contact admin.', 'warning');
            return;
        }
        setSwitchingMethod(true);
        const res = await updatePaymentMethod(method);
        setSwitchingMethod(false);
        if ((res as any)?.error) {
            await showAlert((res as any).error, "error");
            return;
        }
        await showAlert(method === 'QRIS' ? "Switched to QRIS payment" : "Switched to manual transfer", "success");
        window.location.reload();
    };

    const handleProofChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            setManualMessage(null);
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || `proof-${Date.now()}`;
            const uploadResult = await uploadFile(file, "manual-payments", `${team.id}-${safeName}`);
            setManualProofKey(uploadResult.key);
            setManualProofUrl(uploadResult.url || null);
            await showAlert("Proof uploaded successfully.", "success");
        } catch (error) {
            console.error("Manual proof upload failed", error);
            await showAlert("Failed to upload proof. Please try again.", "error");
        } finally {
            if (event.target) {
                event.target.value = "";
            }
        }
    };

    const handleManualSubmit = async () => {
        setManualMessage(null);
        if (!manualProofKey) {
            setManualMessage("Upload proof of payment before submitting.");
            return;
        }
        const amountValue = manualAmount ? parseInt(manualAmount, 10) : expectedTransferAmount;
        if (!amountValue || amountValue <= 0) {
            setManualMessage("Enter a valid transfer amount.");
            return;
        }
        const trimmedNote = manualNote.trim();
        const finalNote =
            paymentPlan === 'DOWN_PAYMENT'
                ? `[DOWN PAYMENT] ${trimmedNote || `Konfirmasi DP ${downPaymentDisplay}`}`
                : trimmedNote || undefined;
        setSubmittingManual(true);
        const res = await submitManualPaymentProofAction({
            amount: amountValue,
            note: finalNote,
            proofKey: manualProofKey,
        });
        setSubmittingManual(false);
        if ((res as any)?.error) {
            setManualMessage((res as any).error);
            return;
        }
        await showAlert("Payment proof submitted. Please wait for admin verification.", "success");
        window.location.reload();
    };

    if (selectedMethod === 'QRIS' && expired) {
        return (
            <div className="max-w-md mx-auto mt-10 p-8 bg-white border-2 border-red-100 rounded-xl shadow text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚠️</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Reservation Expired</h2>
                <p className="text-gray-600 mb-6">Your payment window has closed. Please restart registration.</p>
                <Button onClick={handleCancel}>Restart Registration</Button>
            </div>
        );
    }

    if (availableMethodKeys.length === 0) {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-xl shadow text-center">
                <h2 className="text-2xl font-bold mb-2">Payment Unavailable</h2>
                <p className="text-gray-500">No payment methods are currently enabled. Please contact the committee.</p>
                <button onClick={handleCancel} className="mt-6 text-sm text-brand-600 underline">
                    Cancel Registration
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-3xl mx-auto mt-10">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 md:p-8">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">🎉</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Registration Successful</h2>
                    <p className="text-gray-500">Choose a payment method to secure your booth.</p>
                </div>

                <section className="w-full mb-10">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Pilih Skema Pembayaran</h3>
                            <p className="text-sm text-gray-500">Tentukan apakah ingin membayar penuh atau menggunakan down payment.</p>
                        </div>
                        {planSelectedLabel && (
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Saat ini: {planSelectedLabel}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                        {planCards.map((card) => {
                            const isSelected = paymentPlan === card.key;
                            return (
                                <button
                                    key={card.key}
                                    type="button"
                                    onClick={() => handlePlanSelection(card.key)}
                                    disabled={planActionLoading}
                                    className={`text-left rounded-2xl border p-5 transition focus:outline-none ${
                                        isSelected
                                            ? 'border-brand-500 bg-brand-50 shadow-lg'
                                            : 'border-gray-200 hover:border-brand-200 dark:border-gray-700'
                                    } ${planActionLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-gray-500">{card.highlight}</p>
                                            <p className="text-xl font-semibold text-gray-800 dark:text-white">{card.title}</p>
                                        </div>
                                        {isSelected && (
                                            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-brand-600">
                                                Selected
                                            </span>
                                        )}
                                    </div>
                                    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                        {card.bullets.map((point) => (
                                            <li key={point} className="flex items-start gap-2">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-brand-500"></span>
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    {card.key === 'DOWN_PAYMENT' && (
                                        <p className="mt-3 text-xs font-medium text-orange-600">Harus menyetujui syarat & ketentuan sebelum melanjutkan.</p>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {planReady && paymentPlan && (
                        <div className="mt-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-500/40 dark:bg-green-900/20 dark:text-green-200">
                            <p className="font-semibold">Skema terpilih: {planLabelMap[paymentPlan]}</p>
                            {paymentPlan === 'DOWN_PAYMENT' ? (
                                <div className="mt-1 flex flex-wrap items-center gap-3">
                                    <span>Syarat diterima {acceptedDateLabel || '---'}.</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPendingPlan('DOWN_PAYMENT');
                                            setPlanTermsOpen(true);
                                        }}
                                        className="text-brand-600 hover:underline"
                                    >
                                        Lihat ulang syarat
                                    </button>
                                </div>
                            ) : (
                                <p className="mt-1">Anda akan menyelesaikan seluruh biaya pendaftaran sekarang.</p>
                            )}
                        </div>
                    )}
                </section>

                {!planReady && (
                    <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50 p-6 text-center text-sm text-orange-700 dark:border-orange-400/40 dark:bg-orange-950/20 dark:text-orange-200">
                        Pilih skema pembayaran terlebih dahulu untuk membuka opsi pembayaran.
                    </div>
                )}

                {planReady && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {methodDefinitions
                                .filter((option) => option.enabled || paymentMethodFromServer === option.key)
                                .map((option) => (
                                    <button
                                        key={option.key}
                                        type="button"
                                        disabled={switchingMethod || !option.enabled}
                                        onClick={() => handleMethodSelect(option.key as PaymentMethodOption)}
                                        className={`p-4 rounded-xl border text-left transition ${
                                            selectedMethod === option.key
                                                ? 'border-brand-500 bg-brand-50'
                                                : 'border-gray-200 hover:border-brand-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{option.icon}</span>
                                            <div>
                                                <p className="font-semibold text-gray-800 dark:text-white">{option.title}</p>
                                                <p className="text-sm text-gray-500">{option.desc}</p>
                                            </div>
                                        </div>
                                        {!option.enabled && paymentMethodFromServer === option.key && (
                                            <p className="text-xs text-red-500 mt-2">
                                                Disabled by admin. Please switch payment method.
                                            </p>
                                        )}
                                    </button>
                                ))}
                        </div>

                        {selectedMethod === 'QRIS' && (
                    <div className="space-y-6 text-center">
                        <div className="bg-orange-50 rounded-lg p-6 border border-orange-100">
                            <p className="text-sm text-orange-600 uppercase font-bold tracking-wider mb-1">Time Remaining</p>
                            <div className="text-5xl font-mono font-bold text-gray-800">{timeLeft || '--:--'}</div>
                        </div>

                        {team.paymentUrl ? (
                            <div>
                                <p className="mb-4 text-gray-500 font-medium">Click below to pay via QRIS / E-Wallet</p>
                                <a
                                    href={team.paymentUrl}
                                    target="_blank"
                                    className="bg-brand-600 text-white px-8 py-5 rounded-xl font-bold hover:bg-brand-700 block w-full text-xl shadow-xl transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                                >
                                    <span>💳</span> PAY NOW
                                </a>
                                <p className="text-xs text-gray-400 mt-3">Secure payment via YoGateway</p>
                            </div>
                        ) : (
                            <>
                                <p className="mb-6 text-gray-500">Scan QR below to secure your slot</p>
                                {meta?.paymentQr && (
                                    <div className="bg-white p-4 inline-block rounded-xl border mb-6 shadow-inner">
                                        <img src={meta.paymentQr} className="max-h-64 object-contain" alt="QR" />
                                    </div>
                                )}
                            </>
                        )}

                        <div className="flex flex-col gap-3 max-w-xs mx-auto">
                            <Button onClick={handleCheck} disabled={loading}>
                                {loading ? 'Verifying...' : 'I Have Paid'}
                            </Button>
                            <button onClick={handleCancel} className="text-gray-400 text-sm hover:underline mt-2">
                                Cancel Registration
                            </button>
                        </div>
                    </div>
                    )}

                    {selectedMethod === 'MANUAL_TRANSFER' && (
                    <div className="space-y-6 text-left">
                        {paymentPlan === 'DOWN_PAYMENT' && (
                            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                                Pembayaran ini akan dicatat sebagai down payment sebesar <strong>{downPaymentDisplay}</strong>. Sisa biaya otomatis dipotong saat settlement penjualan bazaar Anda.
                            </div>
                        )}
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Bank Transfer Details</h3>
                            {manualSettings.bankName || manualSettings.accountNumber ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500 uppercase text-xs">Bank</p>
                                        <p className="font-bold text-lg text-gray-900 dark:text-white">{manualSettings.bankName || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 uppercase text-xs">Account Number</p>
                                        <p className="font-bold text-lg text-gray-900 dark:text-white">{manualSettings.accountNumber || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 uppercase text-xs">Account Name</p>
                                        <p className="font-bold text-lg text-gray-900 dark:text-white">{manualSettings.accountName || '-'}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-red-500">Bank information is not configured. Please contact the committee.</p>
                            )}
                            {manualSettings.instructions && (
                                <p className="text-xs text-gray-500 mt-3 whitespace-pre-line">{manualSettings.instructions}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 border rounded-lg">
                                <p className="text-xs uppercase text-gray-500">Nominal to Transfer</p>
                                <p className="text-3xl font-bold text-gray-800">
                                    {formatCurrencyId(manualAmount ? parseInt(manualAmount, 10) : expectedTransferAmount)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {paymentPlan === 'DOWN_PAYMENT'
                                        ? `DP minimum ${downPaymentDisplay}. Sisa biaya dipotong setelah event.`
                                        : `Default fee: ${formatCurrencyId(registrationFee)}`
                                    }
                                </p>
                            </div>
                            <div>
                                <Label>Enter Transfer Amount</Label>
                                <Input
                                    type="text"
                                    value={manualAmount}
                                    onChange={(e) => setManualAmount(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder={expectedTransferAmount ? String(expectedTransferAmount) : 'e.g. 150000'}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Payment Note (optional)</Label>
                            <textarea
                                className="w-full border rounded-lg p-3 mt-1 focus:ring-2 focus:ring-brand-500 dark:bg-gray-900"
                                rows={3}
                                value={manualNote}
                                onChange={(e) => setManualNote(e.target.value)}
                                placeholder="Enter bank name, sender info, or other details"
                            />
                            {paymentPlan === 'DOWN_PAYMENT' && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Catatan akan otomatis diberi label <span className="font-semibold text-orange-600">Down Payment</span> pada panel admin.
                                </p>
                            )}
                        </div>

                        <div>
                            <Label>Upload Proof of Transfer</Label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={handleProofChange}
                            />
                            {manualProofUrl ? (
                                <div className="mt-3 space-y-3">
                                    {/\.(png|jpg|jpeg|gif|webp)$/i.test(manualProofUrl) ? (
                                        <img src={manualProofUrl} alt="Payment Proof" className="max-h-72 rounded-lg border" />
                                    ) : (
                                        <a href={manualProofUrl} target="_blank" className="text-brand-600 underline">
                                            View uploaded proof
                                        </a>
                                    )}
                                    <button
                                        type="button"
                                        className="px-4 py-2 border rounded-lg text-sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                    >
                                        Upload New Proof
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="mt-3 w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 hover:border-brand-400"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? 'Uploading...' : 'Click to upload proof'}
                                </button>
                            )}
                            {isUploading && (
                                <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div className="bg-brand-500 h-full" style={{ width: `${progress}%` }} />
                                </div>
                            )}
                            {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
                        </div>

                        {hasManualSubmission && (
                            <div className="p-4 border rounded-lg bg-green-50 text-green-800">
                                <p className="font-semibold">Proof uploaded</p>
                                <p className="text-sm">Waiting for admin verification. Status: {team.paymentStatus}</p>
                            </div>
                        )}

                        {manualMessage && <p className="text-red-500 text-sm">{manualMessage}</p>}

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <Button onClick={handleManualSubmit} disabled={submittingManual || isUploading}>
                                {submittingManual ? 'Submitting...' : 'Submit Proof for Verification'}
                            </Button>
                            <button onClick={handleCancel} className="text-gray-400 text-sm hover:underline">
                                Cancel Registration
                            </button>
                        </div>
                    </div>
                        )}
                    </>
                )}
            </div>
        </div>

            {planTermsOpen && pendingPlan === 'DOWN_PAYMENT' && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4 py-6">
                <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">Down Payment Terms</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Syarat & Ketentuan Pembayaran Sebagian</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">Baca dengan teliti sebelum melanjutkan ke halaman pembayaran.</p>
                        </div>
                        <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600"
                            onClick={handleClosePlanModal}
                            aria-label="Close terms"
                        >
                            &times;
                        </button>
                    </div>

                    <div
                        className="mt-5 space-y-4 max-h-[60vh] overflow-y-auto pr-3"
                        ref={termsContentRef}
                    >
                        {downPaymentTerms.map((term) => (
                            <div key={term} className="flex gap-3 text-sm text-gray-700 dark:text-gray-200">
                                <span className="mt-1 h-2 w-2 rounded-full bg-brand-500"></span>
                                <span>{term}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={handleClosePlanModal}
                            disabled={planActionLoading}
                            className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            Batal / Pilih opsi lain
                        </button>
                        <button
                            type="button"
                            onClick={handleAcceptDownPaymentTerms}
                            disabled={planActionLoading}
                            className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                        >
                            {planActionLoading ? 'Menyimpan...' : 'Saya setuju & lanjutkan'}
                        </button>
                    </div>
                </div>
            </div>
            )}
        </>
    );
}

function formatCurrencyId(amount: number) {
    if (!Number.isFinite(amount)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);
}

function Button({ children, onClick, disabled, secondary }: any) {
    return (
        <button 
            type="button"
            onClick={onClick} 
            disabled={disabled} 
            className={`
                px-6 py-3 rounded-lg font-bold disabled:opacity-50 transition 
                ${secondary ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-brand-600 text-white hover:bg-brand-700'}
            `}
        >
            {children}
        </button>
    )
}

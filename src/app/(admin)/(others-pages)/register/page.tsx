import { getDashboardData } from "@/actions/dashboard";
import RegistrationWizard from "@/components/bazaar/RegistrationWizard";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function RegistrationPage() {
    const data = await getDashboardData();
    if (!data) return <div>Loading...</div>;
    
    // If role is ADMIN, redirect out
    if(data.role === 'ADMIN') redirect("/");

    const team = (data as any).team;
    const meta = (data as any).meta || {};

    if (!team && meta.registrationOpen === false) {
        const message = meta.registrationCloseMessage?.trim() || "Pendaftaran SCALE telah ditutup. Nantikan informasi selanjutnya.";
        return (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Registration Closed</h1>
                <p className="max-w-xl text-gray-600 dark:text-gray-300 mb-8">{message}</p>
                <Link
                    href="/"
                    className="inline-flex items-center rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white shadow transition hover:bg-brand-600"
                >
                    Kembali ke Dashboard
                </Link>
            </div>
        );
    }

    // If user already has a team AND it's invalid/unverified, maybe they want to pay?
    // But our logic says if team exists, dashboard handles it. 
    // However, the dashboard redirects here if not paid! Circular dependency.
    
    // Fix:
    // 1. If team exists AND is PAID/VERIFIED -> Redirect to Dashboard (Done)
    // 2. If team exists AND is NOT PAID -> Show Wizard but in Payment Mode (Step 5)
    
    if (team) {
        if (team.paymentStatus === 'PAID' || team.paymentStatus === 'VERIFIED') {
             redirect("/");
        }
        // Else, render Wizard with existing team to trigger Payment Step
    }

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white text-center">Team Registration</h1>
            <RegistrationWizard meta={(data as any).meta} existingTeam={team} />
        </div>
    );
}

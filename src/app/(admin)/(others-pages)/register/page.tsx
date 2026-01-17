import { getDashboardData } from "@/actions/dashboard";
import RegistrationWizard from "@/components/bazaar/RegistrationWizard";
import { redirect } from "next/navigation";

export default async function RegistrationPage() {
    const data = await getDashboardData();
    if (!data) return <div>Loading...</div>;
    
    // If role is ADMIN, redirect out
    if(data.role === 'ADMIN') redirect("/");

    const team = (data as any).team;

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

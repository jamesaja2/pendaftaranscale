import { getDashboardData } from "@/actions/dashboard";
import { uploadSubmission } from "@/actions/dashboard";
import { redirect } from "next/navigation";
import SubmissionView from "@/components/bazaar/SubmissionView";

export default async function SubmissionsPage() {
    const data = await getDashboardData();
    if (!data || data.role === 'ADMIN') redirect("/");
    
    // Check payment status - if not paid, redirect to dashboard
    const team = (data as any).team;
    if (!team || (team.paymentStatus !== 'PAID' && team.paymentStatus !== 'VERIFIED')) {
        redirect("/");
    }

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Submission Tasks</h1>
            <SubmissionView team={team} meta={(data as any).meta} />
        </div>
    );
}

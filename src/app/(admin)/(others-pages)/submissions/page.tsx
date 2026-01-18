import { getDashboardData } from "@/actions/dashboard";
import { redirect } from "next/navigation";
import SubmissionView from "@/components/bazaar/SubmissionView";
import AdminSubmissionManager from "@/components/bazaar/AdminSubmissionManager";

export default async function SubmissionsPage() {
    const data = await getDashboardData();
    if (!data) redirect("/");

    if (data.role === 'ADMIN') {
        return (
            <div className="p-4 md:p-6 lg:p-8">
                <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Submission Management</h1>
                <AdminSubmissionManager tasks={(data as any).submissionTasks || []} />
            </div>
        );
    }
    
    // Check payment status - if not paid, redirect to dashboard
    const team = (data as any).team;
    if (!team || (team.paymentStatus !== 'PAID' && team.paymentStatus !== 'VERIFIED')) {
        redirect("/");
    }
    const tasks = (data as any).meta?.submissionTasks || [];

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Submission Tasks</h1>
            <SubmissionView teamId={team.id} tasks={tasks} />
        </div>
    );
}

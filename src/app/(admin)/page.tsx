import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/actions/dashboard";
import AdminView from "@/components/bazaar/AdminView";
import ParticipantView from "@/components/bazaar/ParticipantView";

export const metadata: Metadata = {
  title: "SCALE Dashboard | Manage Bazaar Participation",
  description: "Manage your bazaar participation",
};

export default async function DashboardPage() {
  const dashboardData = await getDashboardData();
  
  if (!dashboardData) {
    redirect("/signin");
  }

  return (
    <div className="space-y-6">      
      {dashboardData.role === 'ADMIN' ? (
        <AdminView teams={(dashboardData as any).teams} settings={(dashboardData as any).settings} />
      ) : (
        <ParticipantView team={(dashboardData as any).team} meta={(dashboardData as any).meta} />
      )}
    </div>
  );
}

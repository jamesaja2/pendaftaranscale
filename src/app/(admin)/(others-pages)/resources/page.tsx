import { getDashboardData } from "@/actions/dashboard";
import { getResources } from "@/actions/resource";
import ResourceView from "@/components/bazaar/ResourceView";

export default async function ResourcesPage() {
    const data = await getDashboardData();
    const resources = await getResources();
    
    // Only logged in
    if (!data) return <div>Access Denied</div>;

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Official Resources</h1>
            <ResourceView resources={resources} role={data.role} />
        </div>
    );
}

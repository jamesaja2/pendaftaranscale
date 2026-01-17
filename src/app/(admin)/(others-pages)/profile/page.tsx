import React from "react";
import { getUserProfile } from "@/actions/profile";
import ProfileView from "@/components/profile/ProfileView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile | Admin Dashboard",
  description: "User Profile Management",
};

export default async function ProfilePage() {
    const { user, error } = await getUserProfile();

    if (error || !user) {
        return (
            <div className="p-6 text-red-500">
                Error loading profile: {error || "Unknown error"}
            </div>
        );
    }

    return (
        <div>
           <div className="mb-6">
                <h2 className="text-2xl font-bold dark:text-white">Profile Settings</h2>
           </div>
           <ProfileView user={user} />
        </div>
    );
}

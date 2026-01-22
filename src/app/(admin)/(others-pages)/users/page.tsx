import React from "react";
import UserTable from "./UserTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function UsersPage() {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          User Management
        </h2>
      </div>

      <div className="flex flex-col gap-10">
        <UserTable />
      </div>
    </div>
  );
}

import React from "react";
import { getUsers } from "@/actions/user";
import UserTable from "./UserTable";

export default async function UsersPage() {
  const { data: users, error } = await getUsers();

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          User Management
        </h2>
      </div>

      <div className="flex flex-col gap-10">
        <UserTable users={users || []} />
      </div>
    </div>
  );
}

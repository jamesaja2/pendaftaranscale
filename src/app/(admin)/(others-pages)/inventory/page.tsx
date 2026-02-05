import React from "react";
import { Metadata } from "next";
import AdminInventoryView from "@/components/bazaar/AdminInventoryView";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export const metadata: Metadata = {
  title: "Inventaris Tim | Admin Dashboard",
  description: "Kelola inventaris barang dari semua tim peserta bazaar",
};

export default function AdminInventoryPage() {
  return (
    <>
      <PageBreadcrumb
        pageName="Inventaris Tim"
        items={[
          { name: "Dashboard", path: "/" },
          { name: "Inventaris Tim", path: "/inventory" },
        ]}
      />

      <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <AdminInventoryView />
      </div>
    </>
  );
}

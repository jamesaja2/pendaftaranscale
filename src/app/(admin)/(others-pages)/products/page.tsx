import React from "react";
import { Metadata } from "next";
import AdminProductView from "@/components/bazaar/AdminProductView";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export const metadata: Metadata = {
  title: "Katalog Produk Tim | Admin Dashboard",
  description: "Kelola katalog produk dari semua tim peserta bazaar",
};

export default function AdminProductsPage() {
  return (
    <>
      <PageBreadcrumb pageTitle="Katalog Produk Tim" />

      <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <AdminProductView />
      </div>
    </>
  );
}

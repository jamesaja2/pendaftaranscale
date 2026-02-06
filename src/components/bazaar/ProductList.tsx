"use client";

import React, { useState } from "react";
import ProductForm from "./ProductForm";
import { deleteProduct } from "@/actions/product";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stock: number | null;
  isAvailable: boolean;
  category: string | null;
  variants?: Array<{
    id?: string;
    name: string;
    additionalPrice: number;
    isRequired: boolean;
    isAvailable: boolean;
    order: number;
  }>;
  addons?: Array<{
    id?: string;
    name: string;
    price: number;
    isAvailable: boolean;
    order: number;
  }>;
}

interface ProductListProps {
  products: Product[];
  onRefresh: () => void;
  editable?: boolean;
}

export default function ProductList({ products, onRefresh, editable = true }: ProductListProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleDelete = async (productId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;

    const result = await deleteProduct(productId);
    if (result.success) {
      onRefresh();
    } else {
      alert(result.error || "Gagal menghapus produk");
    }
  };

  if (showAddForm) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <h3 className="mb-4 text-xl font-semibold text-dark dark:text-white">
          Tambah Produk Baru
        </h3>
        <ProductForm
          onSuccess={() => {
            setShowAddForm(false);
            onRefresh();
          }}
          onCancel={() => setShowAddForm(false)}
        />
      </div>
    );
  }

  if (editingProduct) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <h3 className="mb-4 text-xl font-semibold text-dark dark:text-white">
          Edit Produk
        </h3>
        <ProductForm
          product={editingProduct}
          onSuccess={() => {
            setEditingProduct(null);
            onRefresh();
          }}
          onCancel={() => setEditingProduct(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {editable && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            + Tambah Produk
          </button>
        </div>
      )}

      {products.length === 0 ? (
        <div className="rounded-lg border border-stroke bg-white p-8 text-center dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-gray-500 dark:text-gray-400">
            Belum ada produk. {editable && "Klik tombol di atas untuk menambah produk."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-lg border border-stroke bg-white shadow-sm transition hover:shadow-md dark:border-dark-3 dark:bg-gray-dark"
            >
              {/* Product Image */}
              {product.imageUrl ? (
                <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-t-lg bg-gray-100 dark:bg-dark-2">
                  <svg
                    className="h-16 w-16 text-gray-400 dark:text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}

              {/* Product Info */}
              <div className="p-5">
                <h4 className="mb-1 text-lg font-semibold text-dark dark:text-white">
                  {product.name}
                </h4>
                
                {/* Price */}
                <p className="mb-2 text-xl font-bold text-blue-600 dark:text-blue-400">
                  Rp {product.price?.toLocaleString('id-ID') || 0}
                </p>
                
                {/* Category */}
                {product.category && (
                  <span className="mb-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {product.category}
                  </span>
                )}

                {/* Variants and Addons count */}
                <div className="mb-2 flex flex-wrap gap-2">
                  {product.variants && product.variants.length > 0 && (
                    <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      {product.variants.length} varian
                    </span>
                  )}
                  {product.addons && product.addons.length > 0 && (
                    <span className="inline-block rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                      {product.addons.length} add-on
                    </span>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                    {product.description}
                  </p>
                )}

                {/* Stock and availability */}
                <div className="mb-3 flex flex-wrap gap-2">
                  {product.stock !== null && product.stock !== undefined ? (
                    <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      Stok: {product.stock}
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      Unlimited
                    </span>
                  )}
                  {!product.isAvailable && (
                    <span className="inline-block rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                      Tidak Tersedia
                    </span>
                  )}
                </div>

                {editable && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm text-white transition hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm text-white transition hover:bg-red-600"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

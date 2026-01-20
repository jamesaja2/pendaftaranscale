export default function AdminLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500/40 border-t-brand-500"></div>
      <div className="space-y-2 text-center">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Memuat dashboard…</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Mohon tunggu, data sedang dipersiapkan.</p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { getTeamVotingResults } from "@/actions/voting";

export const metadata: Metadata = {
  title: "Voting Results | SCALE Dashboard",
};

export default async function VotingResultsPage() {
  const data = await getTeamVotingResults();

  if (!data.success) {
    return (
      <div className="space-y-6">
        <header className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Voting Results</h1>
          <p className="text-gray-500 dark:text-gray-400">Tidak dapat memuat hasil voting saat ini.</p>
        </header>
        <div className="bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900/60 text-red-600 dark:text-red-300 rounded-2xl p-6">
          {data.error || "Unauthorized"}
        </div>
      </div>
    );
  }

  const { team, results } = data;

  return (
    <div className="space-y-6">
      <header className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-brand-500 font-semibold">Voting Overview</p>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Hasil Voting Tim</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Menampilkan total suara yang diterima oleh tim kamu pada setiap event voting yang telah dibuka panitia.
            </p>
          </div>
          <div className="bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/30 rounded-xl px-5 py-4 text-right">
            <p className="text-sm text-brand-600 dark:text-brand-200">Tim</p>
            <h2 className="text-2xl font-bold text-brand-900 dark:text-white">{team.name}</h2>
            <p className="text-xs text-brand-500/80 dark:text-brand-200/70">
              {team.category || "Kategori belum diatur"} {team.booth ? `• Booth ${team.booth}` : ""}
            </p>
          </div>
        </div>
      </header>

      {results.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-10 text-center text-gray-500 dark:text-gray-300">
          Belum ada event voting yang selesai atau sedang berlangsung untuk ditampilkan.
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((event) => {
            const voteShare = event.totalBallots ? Math.round((event.teamVotes / event.totalBallots) * 100) : 0;
            return (
              <section
                key={event.id}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      {new Date(event.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{event.title}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-3xl">{event.description}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      event.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {event.isActive ? "Voting Dibuka" : "Sudah Ditutup"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl p-5">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Suara untuk Tim Kamu</p>
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">{event.teamVotes}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {event.rank ? `Peringkat #${event.rank} dari ${event.totalParticipants || 0} tenant` : "Belum ada suara"}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl p-5">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Persentase Suara</p>
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">{voteShare}%</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dari total {event.totalBallots} suara</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl p-5">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Tenant Tervote</p>
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">{event.totalParticipants || 0}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tenant yang menerima suara</p>
                  </div>
                </div>

              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

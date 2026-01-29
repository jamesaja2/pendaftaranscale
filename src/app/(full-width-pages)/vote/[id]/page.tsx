import VoteClient from "./VoteClient";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type VotePageProps = {
    params: Promise<{ id: string }>;
};

async function fetchVoteData(id: string) {
    if (!id) {
        console.error("[Vote] No ID provided");
        return null;
    }

    console.log("[Vote] Fetching event with ID:", id);

    try {
        const event = await prisma.votingEvent.findUnique({
            where: { id },
        });

        console.log("[Vote] Event found:", event ? { id: event.id, title: event.title, isActive: event.isActive } : "null");

        if (!event) {
            console.error("[Vote] Event not found in database");
            return null;
        }

        if (!event.isActive) {
            console.error("[Vote] Event is not active");
            return null;
        }

        const teams = await prisma.team.findMany({
            where: {
                paymentStatus: {
                    in: ["PAID", "VERIFIED"],
                },
            },
            select: {
                id: true,
                name: true,
                category: true,
                boothLocation: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        console.log("[Vote] Teams found:", teams.length);

        return { event, teams };
    } catch (error) {
        console.error("[Vote] Database error:", error);
        return null;
    }
}

export default async function VotePage({ params }: VotePageProps) {
    const resolvedParams = await params;
    console.log("[Vote Page] Received params:", resolvedParams);
    const data = await fetchVoteData(resolvedParams.id);

    if (!data?.event) {
        console.warn("Vote event missing or inactive", { id: resolvedParams.id, hasData: !!data });
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="max-w-md text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
                    <p className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Event Tidak Ditemukan</p>
                    <p className="text-gray-700 dark:text-gray-200">Event tidak ditemukan atau belum dibuka.</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">ID: {resolvedParams.id}</p>
                </div>
            </div>
        );
    }

    const serializableEvent = {
        id: data.event.id,
        title: data.event.title,
        description: data.event.description ?? null,
    };

    const serializableTeams = data.teams.map((team) => ({
        id: team.id,
        name: team.name,
        category: team.category,
        boothLocation: team.boothLocation
            ? { name: team.boothLocation.name ?? null }
            : null,
    }));

    return (
        <VoteClient
            eventId={resolvedParams.id}
            initialEvent={serializableEvent}
            initialTeams={serializableTeams}
        />
    );
}

import { notFound } from "next/navigation";
import VoteClient from "./VoteClient";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type VotePageProps = {
    params: { id: string };
};

async function fetchVoteData(id: string) {
    if (!id) return null;

    const event = await prisma.votingEvent.findUnique({
        where: { id },
    });

    if (!event || !event.isActive) {
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

    return { event, teams };
}

export default async function VotePage({ params }: VotePageProps) {
    const data = await fetchVoteData(params.id);

    if (!data?.event) {
        notFound();
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
            eventId={params.id}
            initialEvent={serializableEvent}
            initialTeams={serializableTeams}
        />
    );
}

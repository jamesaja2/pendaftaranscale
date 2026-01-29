import { notFound } from "next/navigation";
import VoteClient from "./VoteClient";
import { getActiveVotingEvent } from "@/actions/voting";

type VotePageProps = {
    params: { id: string };
};

export default async function VotePage({ params }: VotePageProps) {
    const data = await getActiveVotingEvent(params.id);

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

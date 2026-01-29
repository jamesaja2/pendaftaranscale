import VoteClient from "./VoteClient";

type VotePageProps = {
    params: { id: string };
};

export default function VotePage({ params }: VotePageProps) {
    return <VoteClient eventId={params.id} />;
}

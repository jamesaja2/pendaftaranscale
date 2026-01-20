"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getVotingEvents() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') {
      return { success: false, error: "Unauthorized" };
  }
  
  try {
      const events = await prisma.votingEvent.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
              _count: {
                  select: { votes: true }
              }
          }
      });
      return { success: true, data: events };
  } catch(e) {
      console.error(e);
      return { success: false, error: "Failed to fetch events" };
  }
}

export async function createVotingEvent(title: string, description: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.votingEvent.create({
            data: {
                title,
                description
            }
        });
        revalidatePath("/admin/voting");
        return { success: true };
    } catch (e) {
        return { success: false, error: "Failed to create event" };
    }
}

export async function toggleVotingEvent(id: string, isActive: boolean) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
        return { success: false, error: "Unauthorized" };
    }
    
    await prisma.votingEvent.update({
        where: { id },
        data: { isActive }
    });
    revalidatePath("/admin/voting");
    return { success: true };
}

export async function deleteVotingEvent(id: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
        return { success: false, error: "Unauthorized" };
    }
    
    await prisma.votingEvent.delete({ where: { id }});
    revalidatePath("/admin/voting");
    return { success: true };
}

// Public / User Actions

export async function getActiveVotingEvent(id: string) {
    if (!id) return null;
    
    // Publicly accessible, but need to check if active
    const event = await prisma.votingEvent.findUnique({
        where: { id },
    });
    
    if(!event || !event.isActive) return null;

    // Get active teams to vote for
    const teams = await prisma.team.findMany({
        where: { paymentStatus: 'PAID' }, // Only paid teams? or all? Assuming PAID/Verified
        select: { id: true, name: true, category: true, boothLocation: true }
    });

    return { event, teams };
}

export async function castVote(eventId: string, teamId: string) {
    if (!eventId || !teamId) return { success: false, error: "Invalid parameters" };

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return { success: false, error: "Not logged in" };
    }
    
    const email = session.user.email;
    if (!email) return { success: false, error: "No email found" };
    
    // Domain Check
    const domain = email.split('@')[1];
    const allowedDomains = ["smakstlouis1sby.sch.id", "s.smakstlouis1sby.sch.id"];
    
    if (!allowedDomains.includes(domain)) {
        return { success: false, error: "Siswa/Guru only! Email domain not allowed." };
    }
    
    const userId = (session.user as any).id;
    
    try {
        // Check if event is active
        const event = await prisma.votingEvent.findUnique({ where: { id: eventId }});
        if (!event || !event.isActive) return { success: false, error: "Voting is closed" };

        // Check if already voted
        const existingVote = await prisma.vote.findUnique({
             where: {
                 eventId_userId: {
                     eventId,
                     userId
                 }
             }
        });
        
        if (existingVote) {
             return { success: false, error: "You have already voted in this event!" };
        }
        
        await prisma.vote.create({
            data: {
                eventId,
                userId,
                teamId
            }
        });
        
        revalidatePath(`/vote/${eventId}`);
        return { success: true };
        
    } catch(e) {
        console.error(e);
        return { success: false, error: "Failed to cast vote" };
    }
}

export async function getVotingAnalytics() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
        return { success: false, error: "Unauthorized" };
    }

    const events = await prisma.votingEvent.findMany({
        orderBy: { createdAt: 'desc' }
    });

    if (!events.length) {
        return { success: true, events: [] };
    }

    const eventIds = events.map((event) => event.id);
    const groupedVotes = await prisma.vote.groupBy({
        by: ["eventId", "teamId"],
        where: { eventId: { in: eventIds } },
        _count: { _all: true }
    });

    const teamIds = Array.from(new Set(groupedVotes.map((entry) => entry.teamId)));
    const teams = teamIds.length
        ? await prisma.team.findMany({
              where: { id: { in: teamIds } },
              select: {
                  id: true,
                  name: true,
                  boothLocation: {
                      select: { name: true }
                  }
              }
          })
        : [];
    const teamLookup = new Map<string, { name: string | null; boothName: string | null }>();
    teams.forEach((team) => {
        teamLookup.set(team.id, {
            name: team.name || "Tanpa Nama",
            boothName: team.boothLocation?.name || null,
        });
    });

    const analytics = events.map((event) => {
        const eventVotes = groupedVotes.filter((entry) => entry.eventId === event.id);
        const perTeam = eventVotes
            .map((entry) => {
                const lookup = teamLookup.get(entry.teamId);
                return {
                    teamId: entry.teamId,
                    teamName: lookup?.name || "Tim Tidak Dikenal",
                    boothName: lookup?.boothName || "Belum Dipetakan",
                    votes: entry._count._all,
                };
            })
            .sort((a, b) => b.votes - a.votes);

        const totalVotes = perTeam.reduce((sum, entry) => sum + entry.votes, 0);
        const zoneAccumulator = new Map<string, number>();
        perTeam.forEach((entry) => {
            const zoneKey = (entry.boothName?.[0] || 'X').toUpperCase();
            const zoneLabel = entry.boothName ? `Zona ${zoneKey}` : "Tanpa Booth";
            zoneAccumulator.set(zoneLabel, (zoneAccumulator.get(zoneLabel) || 0) + entry.votes);
        });
        const zoneSummary = Array.from(zoneAccumulator.entries())
            .map(([zone, votes]) => ({ zone, votes }))
            .sort((a, b) => b.votes - a.votes);

        return {
            id: event.id,
            title: event.title,
            description: event.description,
            isActive: event.isActive,
            createdAt: event.createdAt.toISOString(),
            totalVotes,
            perTeam,
            zoneSummary,
        };
    });

    return { success: true, events: analytics };
}

export async function getVoteAuditLog(limit = 50, eventId?: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
        return { success: false, error: "Unauthorized" };
    }

    const votes = await prisma.vote.findMany({
        take: limit,
        where: eventId ? { eventId } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
            event: { select: { title: true } },
            team: {
                select: {
                    name: true,
                    boothLocation: { select: { name: true } },
                },
            },
            user: { select: { name: true, email: true } },
        },
    });

    const formatted = votes.map((vote) => ({
        id: vote.id,
        createdAt: vote.createdAt.toISOString(),
        eventTitle: vote.event.title,
        teamName: vote.team.name || "Tanpa Nama",
        boothName: vote.team.boothLocation?.name || null,
        voterName: vote.user.name || "Pengguna",
        voterEmail: vote.user.email,
    }));

    return { success: true, votes: formatted };
}

export async function getTeamVotingResults() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { success: false, error: "Unauthorized" };
    }

    const userId = (session.user as any).id;
    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            role: true,
            team: {
                select: {
                    id: true,
                    name: true,
                    category: true,
                    paymentStatus: true,
                    boothLocation: {
                        select: { name: true }
                    }
                }
            }
        }
    });

    if (!user || !user.team) {
        return { success: false, error: "Tim kamu belum terdaftar." };
    }

    const team = user.team;
    const isPaid = team.paymentStatus === 'PAID' || team.paymentStatus === 'VERIFIED';
    if (!isPaid) {
        return { success: false, error: "Harap selesaikan pembayaran sebelum melihat hasil voting." };
    }
    const events = await prisma.votingEvent.findMany({
        orderBy: { createdAt: 'desc' }
    });

    if (!events.length) {
        return {
            success: true,
            team: {
                id: team.id,
                name: team.name,
                category: team.category,
                booth: team.boothLocation?.name || null,
            },
            results: []
        };
    }

    const eventIds = events.map((event) => event.id);
    const groupedVotes = await prisma.vote.groupBy({
        by: ["eventId", "teamId"],
        where: { eventId: { in: eventIds } },
        _count: { _all: true }
    });

    const uniqueTeamIds = Array.from(new Set(groupedVotes.map((entry) => entry.teamId)));
    const teamLookup = new Map<string, string | null>();
    if (uniqueTeamIds.length) {
        const teams = await prisma.team.findMany({
            where: { id: { in: uniqueTeamIds } },
            select: { id: true, name: true }
        });
        teams.forEach((t) => teamLookup.set(t.id, t.name));
    }

    const results = events.map((event) => {
        const eventVotes = groupedVotes
            .filter((entry) => entry.eventId === event.id)
            .sort((a, b) => b._count._all - a._count._all);

        const teamVote = eventVotes.find((entry) => entry.teamId === team.id);
        const totalBallots = eventVotes.reduce((sum, entry) => sum + entry._count._all, 0);
        const rank = teamVote ? eventVotes.findIndex((entry) => entry.teamId === team.id) + 1 : null;

        const topTeams = eventVotes.slice(0, 3).map((entry) => ({
            teamId: entry.teamId,
            teamName: teamLookup.get(entry.teamId) || "Unknown Team",
            votes: entry._count._all
        }));

        return {
            id: event.id,
            title: event.title,
            description: event.description,
            isActive: event.isActive,
            createdAt: event.createdAt.toISOString(),
            teamVotes: teamVote ? teamVote._count._all : 0,
            totalBallots,
            totalParticipants: eventVotes.length,
            rank,
            topTeams
        };
    });

    return {
        success: true,
        team: {
            id: team.id,
            name: team.name,
            category: team.category,
            booth: team.boothLocation?.name || null,
        },
        results,
    };
}

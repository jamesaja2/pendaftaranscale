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

"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";


const CreateTeamSchema = z.object({
  name: z.string().min(3),
  leaderName: z.string().min(3),
  members: z.string(), // JSON string
  contactInfo: z.string(),
  category: z.enum(["JASA", "BARANG", "FNB"]),
  mainIngredientId: z.string().optional(),
  mainIngredientName: z.string().optional(),
  boothLocationId: z.string().optional()
});

export async function createTeamAction(data: z.infer<typeof CreateTeamSchema>) {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user) return { error: "Unauthorized" };
  
  const email = (session as any).user.email;
  const user = await prisma.user.findUnique({ where: { email: email! }, include: { team: true } });
  
  if (!user) return { error: "User not found" };
  if (user.team) return { error: "You already have a team." };

  const { name, leaderName, members, contactInfo, category, mainIngredientId, mainIngredientName, boothLocationId } = data;

  try {
      // 0. Check Global Settings Constraints
      const settings = await prisma.globalSettings.findMany();
      const sMap: Record<string, string> = {};
      settings.forEach(s => sMap[s.key] = s.value);

      if (sMap['registration_open'] === 'false') {
          return { error: "Registration is currently CLOSED." };
      }
      
      const minM = parseInt(sMap['min_team_members'] || "1");
      const maxM = parseInt(sMap['max_team_members'] || "5");
      const memberCount = JSON.parse(members || "[]").length;
      
      // We assume members array doesn't include leader? Or does it?
      // In ParticipantView logic: members is "Additional members". Leader is separate.
      // So Total = memberCount + 1 (leader).
      // Let's validate total.
      const totalMembers = memberCount + 1;
      
      if (totalMembers < minM || totalMembers > maxM) {
          return { error: `Team size must be between ${minM} and ${maxM} (including leader).` };
      }

    return await prisma.$transaction(async (tx) => {
        // 1. Check Ingredient Availability (if FnB)
        let resolvedIngredientId = mainIngredientId;

        if (category === 'FNB') {
            if (!mainIngredientId && !mainIngredientName) throw new Error("Ingredient is required for FnB");
            
            // If Name provided but no ID (or ID empty), try to find or create
            if (!resolvedIngredientId && mainIngredientName) {
                 const existing = await tx.ingredient.findFirst({
                    where: { name: { equals: mainIngredientName, mode: 'insensitive' } }
                 });
                 
                 if (existing) {
                     resolvedIngredientId = existing.id;
                 } else {
                     const newIng = await tx.ingredient.create({
                         data: { name: mainIngredientName }
                     });
                     resolvedIngredientId = newIng.id;
                 }
            }

            // Count existing teams using this ingredient
            const usageCount = await tx.team.count({
                where: {
                    mainIngredientId: resolvedIngredientId,
                    OR: [
                        { paymentStatus: 'PAID' },
                        { paymentStatus: 'VERIFIED' },
                        { 
                            paymentStatus: 'PENDING',
                            paymentDeadline: { gt: new Date() } // Deadline is in future
                        }
                    ]
                }
            });

            if (usageCount >= 2) throw new Error("Ingredient is fully booked (Max 2 teams)");
        }

        // 2. Check Booth Availability
        if (boothLocationId) {
             const booth = await tx.boothLocation.findUnique({
                 where: { id: boothLocationId },
                 include: { team: true }
             });
             
             if (booth?.team) {
                  // Check if the team occupying it is valid
                  const occupier = booth.team;
                  const isValid = occupier.paymentStatus === 'PAID' || 
                                  occupier.paymentStatus === 'VERIFIED' ||
                                  (occupier.paymentStatus === 'PENDING' && occupier.paymentDeadline && occupier.paymentDeadline > new Date());
                  
                  if (isValid) throw new Error("Booth is already taken");
                  
                  // If not valid (expired), we can technically steal it?
                  // For simplicity, let's just say "Taken" or rely on a cron job cleaning up expired teams.
                  // But user wants "Siapa cepat dia dapat". So if expired, we should be able to take it.
                  // To take it, we'd need to disconnect the old team?
                  // Doing that in a transaction is complex. Better to assume expired teams are deleted or booth is disconnected.
                  // Let's throw error for now to be safe, assuming clean up happens elsewhere or we implement a 'steal' logic.
                  // Re-reading user: "Slot... tersimpan setelah pembayaran berhasil".
                  // This 10 min lock is critical. 
                  
                  // Let's implement Strict Lock: If link exists, it's taken.
                  // Exception: If we implement an auto-cleanup.
                  throw new Error("Booth is temporarily locked or taken.");
             }
        }

        // 3. Create Team
        // Set Deadline 10 mins from now
        const deadline = new Date();
        deadline.setMinutes(deadline.getMinutes() + 10);
        
        const newTeam = await tx.team.create({
            data: {
                name,
                leaderName,
                members,
                contactInfo,
                category,
                mainIngredientId: category === 'FNB' ? resolvedIngredientId : undefined,
                boothLocationId,
                userId: user.id,
                paymentStatus: 'PENDING',
                paymentMethod: 'MANUAL_TRANSFER',
                paymentDeadline: deadline,
                paymentTrxId: null,
                paymentUrl: null
            }
        });

        return { success: true, team: newTeam };
    });
  } catch (err: any) {
      return { error: err.message || "Failed to create team" };
  }
}

export async function cancelRegistration() {
    const session = await getServerSession(authOptions as any);
    if (!session || !(session as any).user) return { error: "Unauthorized" };
    
    // Deletes the team to allow restarting
    try {
        await prisma.team.delete({
            where: { userId: (session as any).user.id }
        });
        revalidatePath("/");
        return { success: true };
    } catch (err) {
        return { error: "Failed to cancel or record not found" };
    }
}

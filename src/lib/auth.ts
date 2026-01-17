import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Login Failed: Missing credentials");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { team: true },
        });

        if (!user) {
          console.log(`Login Failed: User not found for email ${credentials.email}`);
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          console.log(`Login Failed: Invalid password for user ${credentials.email}`);
          return null;
        }
        
        console.log(`Login Success: ${credentials.email}`);

        // Check if user has a team (handle array or single object)
        const hasTeam = Array.isArray(user.team) ? user.team.length > 0 : !!user.team;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          hasTeam: hasTeam
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.hasTeam = (user as any).hasTeam;
      }
      
      // Auto-refresh team status to handle post-registration updates
      if (!user && token.email) {
          try {
            const dbUser = await prisma.user.findUnique({
                where: { email: token.email },
                select: { team: true } 
            });
            if (dbUser) {
               const hasTeam = Array.isArray(dbUser.team) ? dbUser.team.length > 0 : !!dbUser.team;
               token.hasTeam = hasTeam;
            }
          } catch (error) {
              console.error("Error refreshing team status in JWT", error);
          }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).hasTeam = token.hasTeam;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/error",
  },
  session: {
    strategy: "jwt",
  },
};

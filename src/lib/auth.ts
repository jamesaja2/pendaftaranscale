import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        // Upsert user
        // We will default to role PARTICIAPANT unless logic changes.
        // The voting page will check for specific domain restrictions, 
        // allowing all google users to at least login (per requirements).
        
        let dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        
        if (!dbUser) {
           dbUser = await prisma.user.create({
             data: {
               email: user.email,
               name: user.name,
               image: user.image,
               role: 'PARTICIPANT', // Default role
               password: null, // No password for OAuth
             }
           });
        }
        
        // Pass user info to logic
        user.id = dbUser.id;
        (user as any).role = dbUser.role;
        (user as any).hasTeam = !!dbUser.team; // Prisma include needed if we want this, but for create it's false
        
        return true;
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        // Allow client to update session
        return { ...token, ...session.user };
      }

      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.hasTeam = (user as any).hasTeam;
        
        // Fetch fresh data for Google Logins to ensure role/team is correct
        if(!token.role) {
             const freshUser = await prisma.user.findUnique({ 
                 where: { email: user.email! },
                 include: { team: true } 
             });
             if(freshUser) {
                 token.id = freshUser.id;
                 token.role = freshUser.role;
                 token.hasTeam = !!freshUser.team;
             }
        }
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

import { getServerSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { AuthOptions } from "next-auth";
import type { UserRole } from "@prisma/client";
import { isAdminEmail } from "@/lib/admin";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: UserRole;
    sessionVersion?: number;
  }
}

function createLazyPrismaAdapter(prismaClient: any) {
  let adapter: any = null;

  function getAdapter() {
    if (!adapter) {
      adapter = PrismaAdapter(prismaClient);
    }
    return adapter;
  }

  return new Proxy({} as any, {
    get(target, prop) {
      const adapter = getAdapter();
      return adapter[prop];
    },
  });
}

export const authOptions: AuthOptions = {
  adapter: createLazyPrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;
        if (user.disabledAt) return null;

        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) return null;

        let role = user.role;
        if (role !== "ADMIN" && isAdminEmail(user.email)) {
          const updated = await prisma.user.update({
            where: { id: user.id },
            data: { role: "ADMIN" },
          });
          role = updated.role;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: async ({ token, user }: { token: any; user?: any }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "USER";
        token.sessionVersion = user.sessionVersion ?? 0;
        return token;
      }

      if (!token.id) return token;

      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            disabledAt: true,
            sessionVersion: true,
            email: true,
          },
        });

        if (!dbUser || dbUser.disabledAt) {
          return { ...token, id: undefined, role: undefined, sessionVersion: -1 };
        }

        let role = dbUser.role;
        if (role !== "ADMIN" && isAdminEmail(dbUser.email)) {
          await prisma.user.update({
            where: { id: token.id as string },
            data: { role: "ADMIN" },
          });
          role = "ADMIN";
        }

        if (
          typeof token.sessionVersion === "number" &&
          token.sessionVersion !== dbUser.sessionVersion
        ) {
          return { ...token, id: undefined, role: undefined, sessionVersion: -1 };
        }

        token.role = role;
        token.sessionVersion = dbUser.sessionVersion;
      } catch {
        // Keep existing token if DB briefly unavailable
      }

      return token;
    },
    session: async ({ session, token }: { session: any; token: any }) => {
      if (session.user) {
        if (!token.id) {
          // Invalidate client session when JWT was cleared (disabled / revoked)
          session.user = undefined;
          return session;
        }
        session.user.id = token.id;
        session.user.role = token.role ?? "USER";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

export const auth = async () => getServerSession(authOptions);

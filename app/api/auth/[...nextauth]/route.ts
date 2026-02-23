import NextAuth, { NextAuthOptions } from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"
import { findOrCreateSSOUser, getUserByEmail } from "@/lib/actions/auth"

// Validate environment variables
if (!process.env.MICROSOFT_CLIENT_ID) {
  console.error("❌ MICROSOFT_CLIENT_ID is missing from environment variables")
}
if (!process.env.MICROSOFT_CLIENT_SECRET) {
  console.error("❌ MICROSOFT_CLIENT_SECRET is missing from environment variables")
}
if (!process.env.AUTH_SECRET) {
  console.error("❌ AUTH_SECRET is missing from environment variables")
}

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID || "common",
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "azure-ad") return true

      if (!user.email) {
        console.error("SSO sign-in attempted without email")
        return false
      }

      // ✅ FIX #3 (optional): Restrict to company domain — uncomment if internal-only
      // if (!user.email.endsWith("@yourcompany.com")) {
      //   console.warn("SSO sign-in rejected: external domain", user.email)
      //   return false
      // }

      try {
        const profileData = profile as Record<string, unknown> | undefined
        const result = await findOrCreateSSOUser({
          email: user.email,
          name:
            user.name ??
            (profileData?.displayName as string | undefined) ??
            user.email.split("@")[0],
          microsoftId: account.providerAccountId,
          image: user.image ?? (profileData?.picture as string | undefined) ?? null,
        })

        if (!result.success || !result.user) {
          console.error("Failed to find or create SSO user:", result.error)
          // Check if it's a database connection error
          const errorMsg = result.error || ""
          if (errorMsg.includes("fetch failed") || errorMsg.includes("ECONNREFUSED") || errorMsg.includes("DATABASE_URL")) {
            console.error("Database connection error during SSO authentication")
            // Return false but NextAuth will show AccessDenied - we'll handle this in the error page
          }
          return false
        }

        return true
      } catch (err) {
        console.error("signIn callback error:", err)
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        // Check if it's a database connection error
        if (errorMessage.includes("fetch failed") || errorMessage.includes("ECONNREFUSED") || errorMessage.includes("DATABASE_URL")) {
          console.error("Database connection error during SSO authentication:", errorMessage)
        }
        return false
      }
    },

    async jwt({ token, user, account, trigger }) {
      // ✅ FIX #1: Eagerly populate token.email from user before the hydration guard,
      // so token.email is guaranteed to exist on the very first jwt() invocation
      if (user?.email) {
        token.email = user.email
      }

      const shouldHydrate =
        (user != null && account?.provider === "azure-ad") ||
        trigger === "update" ||
        (token.email != null && !token.id) // Re-hydrate if token.id is missing (handles server restart/edge cold start)

      if (shouldHydrate && token.email) {
        try {
          const dbUser = await getUserByEmail(token.email)
          if (dbUser) {
            token.id                    = dbUser.id.toString()
            token.name                  = dbUser.full_name
            token.role                  = dbUser.role
            token.business_unit_group_id = dbUser.business_unit_group_id ?? null
            token.group_name            = dbUser.group_name ?? null
            token.auth_provider         = dbUser.auth_provider ?? "microsoft"
          }
        } catch (err) {
          console.error("jwt callback DB hydration error:", err)
        }
      }

      return token
    },

    // ✅ UNCHANGED: session callback is clean as-is
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id:                      token.id ?? "",
        role:                    token.role ?? "user",
        business_unit_group_id:  token.business_unit_group_id ?? undefined,
        group_name:              token.group_name ?? undefined,
        auth_provider:           token.auth_provider ?? "microsoft",
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.AUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
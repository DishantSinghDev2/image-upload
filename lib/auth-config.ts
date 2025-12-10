import type { NextAuthConfig } from "next-auth"
import type { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: {
      id: string
      email: string
      name: string
      image?: string
      role?: string
      isUserPro?: boolean
      onboardingCompleted?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    role?: string
    isUserPro?: boolean
    onboardingCompleted?: boolean
  }
}

async function refreshAccessToken(token: JWT) {
  try {
    const response = await fetch("https://whatsyour.info/api/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.WHATSYOURINFO_CLIENT_ID,
        client_secret: process.env.WHATSYOURINFO_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    }
  } catch (error) {
    console.error("Error refreshing access token", error)
    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

const providers =
  process.env.WHATSYOURINFO_CLIENT_ID && process.env.WHATSYOURINFO_CLIENT_SECRET
    ? [
        {
          id: "wyi",
          name: "WhatsYour.Info",
          type: "oauth",
          authorization: {
            url: "https://whatsyour.info/oauth/authorize",
            params: { scope: "profile:read email:read" },
          },
          userinfo: "https://whatsyour.info/api/v1/me",
          token: {
            url: "https://whatsyour.info/api/v1/oauth/token",
            async request(context: any) {
              const response = await fetch("https://whatsyour.info/api/v1/oauth/token", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  grant_type: "authorization_code",
                  code: context.params.code,
                  redirect_uri: context.provider.callbackUrl,
                  client_id: context.provider.clientId,
                  client_secret: context.provider.clientSecret,
                }),
              })

              const tokens = await response.json()
              if (!response.ok) {
                throw new Error(tokens.error_description || "Token request failed")
              }
              return { tokens }
            },
          },
          clientId: process.env.WHATSYOURINFO_CLIENT_ID || "",
          clientSecret: process.env.WHATSYOURINFO_CLIENT_SECRET || "",
          async profile(profile: any, tokens: any) {
            return {
              id: profile._id || profile.id,
              name:
                profile.firstName && profile.lastName
                  ? `${profile.firstName} ${profile.lastName}`
                  : profile.name || profile.email,
              email: profile.email,
              image: profile.avatar || profile.picture,
              isUserPro: profile.isUserPro || profile.plan === "pro",
              emailVerified: profile.emailVerified,
            }
          },
        },
      ]
    : []

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers,
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (account && account.access_token) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.accessTokenExpires = Date.now() + (account.expires_in || 3600) * 1000
      }

      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.picture = user.image
        token.isUserPro = user.isUserPro
      }

      if (token.accessTokenExpires && Date.now() > token.accessTokenExpires) {
        return refreshAccessToken(token)
      }

      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = token.picture as string
        session.user.isUserPro = token.isUserPro as boolean
      }
      session.accessToken = token.accessToken
      return session
    },
  },
}

//app\api\auth\[...nextauth]\route.ts
import CredentialsProvider from "next-auth/providers/credentials"
import { compare, hash } from "bcryptjs"
import NextAuth from "next-auth"
import { prisma } from "@/lib/prisma"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("prisma test start");
        console.log(process.env.DATABASE_URL);
        console.log("prisma test end");
        if (!credentials?.email || !credentials?.password) {
        console.log("missing credentials");
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        console.log("user item:", user);

        if (!user) {
          // 新規ユーザー作成
          const hashedPassword = await hash(credentials.password, 12)
          const newUser = await prisma.user.create({
            data: {
              email: credentials.email,
              password: hashedPassword,
              name: credentials.email.split('@')[0],
            }
          })
          console.log(newUser)
          // プロフィールも作成
          await prisma.profile.create({
            data: {
              userId: newUser.id,
              name: newUser.name,
            }
          })

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          }
        }

        // 既存ユーザーのパスワードチェック
        if (!user.password) {
            console.log(user.password)
          return null
        }

        const isValid = await compare(credentials.password, user.password)
        
        if (!isValid) {
            console.log("IS NOT VALID");
            console.log(credentials.password);
            console.log(user.password);
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      if (session?.user) {
        session.user.id = token.sub as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

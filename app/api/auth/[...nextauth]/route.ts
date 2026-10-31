import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const backendUrl = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:4000'
).replace(/\/+$/, '');

const handler = NextAuth({
  secret:
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === 'development'
      ? 'brightloop-local-nextauth-secret-2026'
      : undefined),
  providers: [
    CredentialsProvider({
      name: 'Brightloop',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const response = await fetch(`${backendUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
        const data = await response.json();

        if (!response.ok) return null;

        return {
          ...data.user,
          apiToken: data.token,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.apiToken = (user as { apiToken?: string }).apiToken;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      (session as typeof session & { apiToken?: string; role?: string }).apiToken =
        token.apiToken as string | undefined;
      (session as typeof session & { apiToken?: string; role?: string }).role =
        token.role as string | undefined;
      return session;
    },
  },
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
});

export { handler as GET, handler as POST };

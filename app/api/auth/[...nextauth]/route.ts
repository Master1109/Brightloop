import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || 'brightloop-local-nextauth-secret-2026',
  providers: [CredentialsProvider({
    name: 'Brightloop',
    credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
    async authorize(credentials) {
      try {
        // Local backend fallback
        const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:4000';
        const response = await fetch(`${backendUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
        const body = await response.text();
        let data: { user?: Record<string, unknown>; token?: string; error?: string } = {};
        try { data = body ? JSON.parse(body) : {}; } catch { data = { error: 'The authentication service returned an invalid response.' }; }
        if (!response.ok || !data.user || !data.token) return null;
        return { id: String(data.user.id || data.user.email || 'brightloop-user'), ...data.user, apiToken: data.token };
      } catch {
        return null;
      }
    },
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.apiToken = (user as any).apiToken; token.role = (user as any).role; }
      return token;
    },
    async session({ session, token }) {
      (session as any).apiToken = token.apiToken;
      (session as any).role = token.role;
      return session;
    },
  },
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
});

export { handler as GET, handler as POST };
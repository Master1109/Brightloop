import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || 'brightloop-production-jwt-secret-2026-auth-fallback',
  providers: [CredentialsProvider({
    name: 'Brightloop',
    credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
    async authorize(credentials) {
      try {
        const rawBackend = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';
        const cleanBackend = rawBackend.replace(/\/+$/, '');
        const backendUrl = cleanBackend.startsWith('http') ? cleanBackend : `https://${cleanBackend}`;
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

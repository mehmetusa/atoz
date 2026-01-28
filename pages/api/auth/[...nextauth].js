import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '../../../utils/mongo';
import User from '../../../models/Users';
import bcrypt from 'bcryptjs';

export default NextAuth({
  // ------------------------
  // Providers
  // ------------------------
  providers: [
    // Email/password login
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await dbConnect();
        const { email, password } = credentials;

        // Admin login
        // if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        //   return { id: 'admin', name: 'Admin', email, role: 'admin' };
        // }

        // Normal user login
        const user = await User.findOne({ email });
        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role || 'user',
        };
      },
    }),

    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  // ------------------------
  // Callbacks
  // ------------------------
  callbacks: {
    // Sign in callback
    async signIn({ user, account }) {
      // Only create a user for Google login if it doesn't exist
      if (account?.provider === 'google') {
        await dbConnect();
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          await User.create({
            name: user.name,
            email: user.email,
            role: 'user',
            password: '', // blank for OAuth users
          });
        }
      }
      return true;
    },

    // JWT callback
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id || user._id?.toString() || token.id;
        token.role = user.role || 'user';
        token.email = user.email;
      }
      return token;
    },

    // Session callback
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.email = token.email;
      return session;
    },

    // Redirect callback
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      return '/'; // fallback
    },
  },

  // ------------------------
  // Custom Pages
  // ------------------------
  pages: {
    signIn: '/signin', // your custom signin page
  },

  // ------------------------
  // Session & Secret
  // ------------------------
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

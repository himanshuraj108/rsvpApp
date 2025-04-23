import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const config = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        await connectDB();

        try {
          // Check if the identifier is an email or username
          const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.identifier);
          
          // Find the user by email or username
          const searchQuery = isEmail 
            ? { email: credentials.identifier }
            : { username: credentials.identifier };
            
          const user = await User.findOne(searchQuery).select('+password');
          
          if (!user) {
            throw new Error('Invalid credentials');
          }

          // Special case for admin login
          if (user && user.role === 'admin' && 
              user.email === process.env.ADMIN_EMAIL && 
              credentials.password === process.env.ADMIN_PASSWORD) {
            console.log('Admin login via direct credentials match');
            return {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              username: user.username,
              role: 'admin',
              profilePicture: user.profilePicture || '',
              phone: user.phone || '',
              address: user.address || '',
            };
          }

          const isMatch = await bcrypt.compare(credentials.password, user.password);
          
          if (!isMatch) {
            throw new Error('Invalid credentials');
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            username: user.username,
            role: user.role,
            profilePicture: user.profilePicture || '',
            phone: user.phone || '',
            address: user.address || '',
          };
        } catch (error) {
          throw new Error(error.message);
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.profilePicture = user.profilePicture;
        token.phone = user.phone;
        token.address = user.address;
      }

      // Update token if session is updated
      if (trigger === 'update' && session) {
        // Allow updating certain fields
        if (session.name) token.name = session.name;
        if (session.email) token.email = session.email;
        if (session.username) token.username = session.username;
        if (session.profilePicture) token.profilePicture = session.profilePicture;
        if (session.phone) token.phone = session.phone;
        if (session.address) token.address = session.address;
      }
      
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.role = token.role;
      session.user.profilePicture = token.profilePicture;
      session.user.phone = token.phone;
      session.user.address = token.address;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(config); 
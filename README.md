# RSVP Event Management Platform

A full-featured event management and RSVP tracking application built with Next.js, React, and MongoDB. Create events, manage guest lists, track RSVPs, and communicate with attendees - all in one platform.

## Live Demo

Visit [https://rsvp-application.vercel.app](https://rsvp-application.vercel.app) to see the application in action.

## Features

- **User Authentication**
  - Secure email/password registration and login
  - Session management with NextAuth.js
  - Profile management and account settings
  - Role-based access control (user/admin)

- **Event Management**
  - Create, edit, and delete events
  - Set event capacity, date, time, location
  - Add event descriptions and images
  - Responsive design for all devices

- **RSVP Functionality**
  - Users can respond with "Attending", "Maybe", or "Decline"
  - Real-time capacity tracking
  - Event organizers can view guest lists
  - Email notifications for event updates

- **User Dashboard**
  - View upcoming, maybe, and past events
  - Track events you're organizing
  - Manage your RSVPs in one place
  - Edit profile and account settings

- **Admin Features**
  - Comprehensive admin dashboard
  - User management (view, edit, delete)
  - System-wide announcements
  - Event moderation and oversight
  - Chat with users for support

- **Chat Support System**
  - Users can chat with administrators
  - File attachment support
  - Real-time message updates
  - Message read status tracking

- **Notification System**
  - Admin-controlled announcements
  - Public and private notifications
  - Dismissible alerts
  - Persistent across sessions

## Tech Stack

- **Frontend**
  - Next.js 15.3+
  - React 19+
  - TailwindCSS for styling
  - React Context API for state management

- **Backend**
  - Next.js API routes
  - NextAuth.js for authentication
  - MongoDB with Mongoose ODM
  - Server-side rendering and API routes

- **Additional Technologies**
  - date-fns for date handling
  - React Hot Toast for notifications
  - LocalStorage for client-side persistence
  - Responsive design with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or Atlas)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/himanshurajora/rsvp.git
   cd rsvp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following:
   ```
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   ADMIN_EMAIL=your_admin_email@example.com
   ADMIN_PASSWORD=your_admin_password
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Admin Setup

The first time you run the application, you can register a user with the email specified in your ADMIN_EMAIL environment variable. This user will automatically have admin privileges.

## Project Structure

```
rsvp/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/             # API routes
│   │   ├── admin/           # Admin dashboard pages
│   │   ├── events/          # Event pages
│   │   ├── chat/            # Chat interface
│   │   ├── login/           # Authentication pages
│   │   ├── profile/         # User profile pages
│   │   └── ...
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # Basic UI elements
│   │   └── ...
│   ├── lib/                 # Utility functions and services
│   ├── models/              # Mongoose models
│   └── providers/           # Context providers
├── public/                  # Static assets
└── ...config files
```

## API Endpoints

- `POST /api/auth/*` - Authentication endpoints (NextAuth.js)
- `GET/POST /api/events` - List or create events
- `GET/PUT/DELETE /api/events/:id` - Fetch, update or delete an event
- `POST /api/events/:id/rsvp` - Respond to an event
- `GET/PUT /api/users/me` - Get or update current user
- `GET/POST /api/chat` - List chats or create a new chat
- `GET/POST /api/chat/:chatId/messages` - Get or send messages

## Admin Features

### Admin Dashboard
The admin dashboard provides a central hub for managing the application:
- View system statistics
- Manage users and events
- Access support chats
- Create system-wide announcements

### User Management
Admins can:
- View all registered users
- Edit user details and roles
- Delete users if necessary

### Notification System
Create and manage notifications that appear to all users:
- Set public/private visibility
- Edit notification content
- Remove notifications

## Deployment

This application is optimized for deployment on Vercel:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Configure the environment variables
4. Deploy

For other platforms, ensure you set up the environment variables and build commands appropriately.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)

## Developer

Developed by [Himanshu Raj](https://himanshur.vercel.app/)

## Acknowledgments

- Next.js team for the amazing framework
- MongoDB for the flexible database solution
- Vercel for hosting the application

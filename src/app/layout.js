import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/providers/NextAuthProvider";
import { Toaster } from "react-hot-toast";
import Footer from "../components/ui/Footer";
import { NotificationProvider } from "@/providers/NotificationProvider";
import NotificationPopup from "@/components/ui/NotificationPopup";
import AdminNotificationButton from "@/components/ui/AdminNotificationButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "RSVP App - Event Management Made Easy",
  description: "Manage events, send invitations, and track RSVPs with our advanced RSVP system.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthProvider>
          <NotificationProvider>
            <main className="min-h-screen flex flex-col">
              <div className="flex-grow">{children}</div>
              <Footer />
            </main>
            <NotificationPopup />
            <AdminNotificationButton />
            <Toaster position="top-right" />
          </NotificationProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}

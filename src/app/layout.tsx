import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { Navigation } from "@/components/ui/navigation";
import { NotificationToast } from "@/components/ui/notification-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ikimina Smart Tracker",
  description: "VSLA Financial Management System for Rwanda",
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <NotificationProvider>
            <Navigation />
            {children}
            <NotificationToast />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Pulse · Bonus, Review & Escalation Management",
  description:
    "Internal people-operations console for bonuses, performance reviews, and escalations with full audit integrity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-900 dark:selection:text-indigo-100">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: "text-sm border border-border bg-card text-card-foreground shadow-sm",
          }}
        />
      </body>
    </html>
  );
}

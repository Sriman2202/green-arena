import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ChatWidget } from "@/components/chat/chat-widget";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Green Arena — Book Turfs Near You",
  description:
    "Find and book football, cricket, badminton, and multi-sport turfs near you in seconds. Green Arena makes booking your next game effortless.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${barlowCondensed.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
          <ChatWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MapProvider } from "@/context/map-context";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Locify - AI-Native Location-Based Tour Guide",
  description: "Real-time location narration with AI-powered storytelling. Explore historical sites and landmarks with immersive audio guides and interactive visual guides.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <MapProvider>{children}</MapProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

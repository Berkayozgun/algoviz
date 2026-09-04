import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://algoviz-rho.vercel.app";
const siteDescription =
  "Algoviz is an interactive computer science visualizer. Explore algorithms, data structures, databases, security, networking, and machine learning through hands-on animations and step-by-step demos.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Algoviz — Interactive Computer Science Visualizer",
  description: siteDescription,
  openGraph: {
    title: "Algoviz — Interactive Computer Science Visualizer",
    description: siteDescription,
    url: siteUrl,
    siteName: "Algoviz",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Algoviz — Interactive Computer Science Visualizer",
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-zinc-950 text-zinc-200`}
      >
        <Sidebar />
        <main className="md:ml-64 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}

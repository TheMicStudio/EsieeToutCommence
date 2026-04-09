import type { Metadata } from "next";
import "./globals.css";
import { Outfit } from "next/font/google";
import { cn } from "@/lib/utils";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "EsieeToutCommence",
  description: "Plateforme de gestion scolaire",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={cn("font-sans", outfit.variable)}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>{children}</body>
    </html>
  );
}

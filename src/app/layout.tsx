import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import ConvexClientProvider from "../components/providers/convex-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Morph Holesky Faucet",
  description: "",
};

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <title>Morph Holesky Faucet</title>
        <meta
          name="description"
          content="Holesky faucet for claiming testnet tokens"
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-[#070E1B] text-slate-50 font-sans antialiased p-6",
          fontSans.variable
        )}
      >
        <ConvexClientProvider>
          <Header />
          {children}
          <Toaster />
        </ConvexClientProvider>
      </body>
    </html>
  );
}

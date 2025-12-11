import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PROPHET | Predict the Future, Earn Rewards",
  description: "The first memecoin with real utility. Vote on crypto predictions, prove you're an oracle, and earn $PROPHET rewards. Fair launch on Pump.fun.",
  keywords: ["memecoin", "crypto prediction", "solana", "pump.fun", "PROPHET", "earn crypto"],
  openGraph: {
    title: "PROPHET | Predict the Future, Earn Rewards",
    description: "Vote on crypto predictions and earn $PROPHET rewards. Join the revolution.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png", // We'll need to generate this
        width: 1200,
        height: 630,
        alt: "PROPHET Prediction Protocol",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PROPHET | Predict the Future",
    description: "Vote on crypto predictions and earn $PROPHET rewards.",
    creator: "@ProphetProtocol", // Replace with actual handle
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "PROPHET | The Future is Prediction",
  description: "The premier multi-outcome prediction protocol. Stake $PROPHET, predict events, and prove your foresight.",
  keywords: ["prediction market", "prophet protocol", "solana", "betting", "crypto"],
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased text-white selection:bg-purple-500/30">
        <Providers>
          <div className="fixed inset-0 bg-[#020617] -z-20" />
          <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-[#020617] to-[#020617] -z-10" />
          {children}
        </Providers>
      </body>
    </html>
  );
}

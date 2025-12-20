import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { InstallPrompt } from "@/components/InstallPrompt";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Polybet | The Future is Prediction",
  description: "The premier multi-outcome prediction protocol. Stake $POLYBET, predict events, and prove your foresight.",
  keywords: ["prediction market", "polybet", "solana", "betting", "crypto"],
  manifest: "/manifest.json",
  openGraph: {
    title: "Polybet | The Future is Prediction",
    description: "The premier multi-outcome prediction protocol on Solana.",
    url: "https://polybet.fun",
    siteName: "Polybet",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Polybet | The Future is Prediction",
    description: "Stake $POLYBET, predict events, and prove your foresight. Live on Solana.",
    images: ["/icons/icon-512x512.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Polybet",
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  }
};

export const viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          <InstallPrompt />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    }, function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    });
                  });
                }
              `,
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

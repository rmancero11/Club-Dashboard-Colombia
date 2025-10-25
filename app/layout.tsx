import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import RegisterSW from "@/app/components/RegisterSW";
import Splash from "@/app/components/Splash";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "ClubSolteros", template: "%s | ClubSolteros" },
  description: "App Agencias de Viajes",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192" },
      { url: "/icons/icon-512.png", sizes: "512x512" },
    ],
    apple: [{ url: "/icons/apple-touch-icon-180.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "ClubSolteros",
    statusBarStyle: "default",
  },
};


// Next 14: themeColor va en viewport, no en metadata
export const viewport: Viewport = {
  themeColor: "#7a1f7a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="min-h-dvh bg-gray-50 text-gray-900 antialiased">
        <RegisterSW />
        {/* <Splash /> */}
        {children}
        <noscript>
          <div className="p-4 text-center text-sm">
          </div>
        </noscript>
      </body>
    </html>
  );
}

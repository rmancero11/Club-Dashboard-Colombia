// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import RegisterSW from "./components/RegisterSW";
import Splash from "./components/Splash"; // Splash activado

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
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

// Next 14: themeColor en viewport
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
        <Splash /> {/* splash con animación */}
        {children}
      </body>
    </html>
  );
}
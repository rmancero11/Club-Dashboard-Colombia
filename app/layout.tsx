import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import RegisterSW from "./components/RegisterSW";
import Splash from "./components/Splash";

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
  themeColor: "#7a1f7a",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192" },
      { url: "/icons/icon-512.png", sizes: "512x512" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon-180.png", sizes: "180x180" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "ClubSolteros",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={${inter.variable} ${montserrat.variable}}>
      <body className="min-h-dvh bg-gray-50 text-gray-900 antialiased">
        <RegisterSW />
         <Splash />
        {children}
      </body>
    </html>
  );
}
// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400','500','600','700'], // los pesos que quieras usar
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: { default: "ClubSolteros", template: "%s | ClubSolteros" },
  description: "App Agencias de Viajes",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="min-h-dvh bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}

import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Work_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Radar Tecnológico — Telecomunicaciones CEET | SENA",
  description:
    "Radar interactivo de vigilancia científico-tecnológica del área de telecomunicaciones del Centro de Electricidad, Electrónica y Telecomunicaciones (CEET) — SENA 2626-2036.",
  keywords: [
    "radar tecnológico",
    "telecomunicaciones",
    "vigilancia tecnológica",
    "5G",
    "6G",
    "IA",
    "SENA",
    "CEET",
    "GICS",
  ],
  authors: [{ name: "Mauricio Alexander Vargas Rodríguez" }],
  icons: {
    icon: "/favicon/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Radar Tech",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#39a900",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${workSans.variable} ${jetbrainsMono.variable} font-work-sans antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}

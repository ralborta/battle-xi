import type { Metadata, Viewport } from "next";
import { Russo_One, Bebas_Neue, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const russo = Russo_One({
  weight: "400",
  variable: "--font-russo",
  subsets: ["latin"],
  display: "swap",
});

const bebas = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-default",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Battle XI · Coleccioná. Competí. Conquistá la copa.",
  description:
    "Escaneá tus figuritas, transformalas en cartas digitales, potenciá tu equipo y competí por la copa. Battle XI: el universo donde tus figuritas cobran vida.",
  applicationName: "Battle XI",
  keywords: [
    "Battle XI",
    "figuritas",
    "cartas",
    "fútbol",
    "juego",
    "coleccionar",
    "torneo",
    "batalla",
  ],
  authors: [{ name: "Battle XI" }],
  openGraph: {
    title: "Battle XI",
    description: "Tus figuritas cobran vida. Coleccioná, competí, conquistá la copa.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#03040c",
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
    <html
      lang="es"
      className={`${russo.variable} ${bebas.variable} ${manrope.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-void text-text-primary">
        {children}
      </body>
    </html>
  );
}

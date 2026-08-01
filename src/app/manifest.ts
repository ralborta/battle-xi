import { siteDescription, siteName } from "@/lib/site";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteName} · Tus figuritas cobran vida`,
    short_name: siteName,
    description: siteDescription,
    // Instalada, la app abre directo en el juego: si todavía no hay sesión,
    // /jugar manda al login.
    start_url: "/jugar",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#03040c",
    theme_color: "#03040c",
    lang: "es-AR",
    categories: ["games", "sports"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

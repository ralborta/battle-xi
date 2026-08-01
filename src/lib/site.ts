/**
 * URL pública del juego. Se usa para armar los links absolutos que necesitan
 * WhatsApp y demás al compartir. Cuando se mude a un dominio propio alcanza con
 * cambiar APP_URL en el panel, sin tocar código.
 */
export const siteUrl = (
  process.env.APP_URL ?? "https://battlexi-web.wd75db.easypanel.host"
).replace(/\/$/, "");

export const siteName = "Battle XI";

export const siteDescription =
  "Escaneá tus figuritas, convertilas en cartas y batallá contra otros jugadores.";

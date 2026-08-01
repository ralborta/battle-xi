import type { Position } from "@/components/PlayerCard";
import type { Rarity } from "@/lib/rarity";

export interface CatalogSeed {
  slug: string;
  playerName: string;
  countryCode: string;
  countryFlag: string;
  position: Position;
  compatible: Position[];
  rarity: Rarity;
  rating: number;
  ability: string;
  vel: number;
  tir: number;
  pas: number;
  reg: number;
  def: number;
  fis: number;
}

const AVATAR = "/avatars/player-default.svg";

function p(
  slug: string,
  playerName: string,
  countryCode: string,
  countryFlag: string,
  position: Position,
  compatible: Position[],
  rarity: Rarity,
  rating: number,
  ability: string,
  stats: [number, number, number, number, number, number],
): CatalogSeed {
  const [vel, tir, pas, reg, def, fis] = stats;
  return {
    slug,
    playerName,
    countryCode,
    countryFlag,
    position,
    compatible,
    rarity,
    rating,
    ability,
    vel,
    tir,
    pas,
    reg,
    def,
    fis,
  };
}

/**
 * Catálogo inicial (~48 fichas). Después se amplía a ~300.
 * Stats Battle XI propias (no vienen de la API).
 */
export const CATALOG_SEED: CatalogSeed[] = [
  // Argentina
  p("ar-dibu", "Dibu", "AR", "🇦🇷", "POR", [], "elite", 88, "muro", [48, 22, 62, 40, 90, 84]),
  p("ar-cuti", "Cuti", "AR", "🇦🇷", "DEF", ["MC"], "rare", 84, "muro", [72, 48, 70, 62, 86, 82]),
  p("ar-depaul", "De Paul", "AR", "🇦🇷", "MC", ["EXT"], "rare", 83, "cerebro", [76, 74, 86, 80, 68, 78]),
  p("ar-enzo", "Enzo", "AR", "🇦🇷", "MC", ["DEF"], "elite", 85, "recuperador", [74, 72, 84, 78, 76, 80]),
  p("ar-messi", "Messi", "AR", "🇦🇷", "DEL", ["EXT", "MC"], "legend", 93, "goleador", [86, 92, 91, 95, 38, 68]),
  p("ar-alvarez", "Julián", "AR", "🇦🇷", "DEL", ["EXT"], "elite", 86, "goleador", [88, 86, 74, 84, 42, 76]),
  // Brasil
  p("br-alisson", "Alisson", "BR", "🇧🇷", "POR", [], "elite", 89, "muro", [50, 24, 68, 42, 91, 82]),
  p("br-militao", "Militão", "BR", "🇧🇷", "DEF", ["MC"], "rare", 84, "muro", [82, 46, 68, 64, 85, 84]),
  p("br-casemiro", "Casemiro", "BR", "🇧🇷", "MC", ["DEF"], "elite", 86, "recuperador", [68, 70, 78, 72, 88, 90]),
  p("br-vinicius", "Vini Jr", "BR", "🇧🇷", "EXT", ["DEL"], "legend", 91, "velocista", [96, 84, 78, 92, 36, 74]),
  p("br-rodrygo", "Rodrygo", "BR", "🇧🇷", "EXT", ["DEL", "MC"], "elite", 86, "velocista", [90, 82, 80, 88, 40, 70]),
  p("br-richarlison", "Richarlison", "BR", "🇧🇷", "DEL", ["EXT"], "rare", 81, "goleador", [84, 82, 70, 78, 44, 80]),
  // Francia
  p("fr-lloris", "Lloris", "FR", "🇫🇷", "POR", [], "pro", 78, "muro", [44, 20, 60, 38, 82, 76]),
  p("fr-upamecano", "Upamecano", "FR", "🇫🇷", "DEF", [], "rare", 82, "muro", [86, 42, 66, 60, 84, 88]),
  p("fr-tchouameni", "Tchouaméni", "FR", "🇫🇷", "MC", ["DEF"], "elite", 85, "recuperador", [76, 68, 82, 76, 84, 86]),
  p("fr-griezmann", "Griezmann", "FR", "🇫🇷", "DEL", ["MC", "EXT"], "elite", 87, "cerebro", [80, 86, 88, 86, 48, 74]),
  p("fr-mbappe", "Mbappé", "FR", "🇫🇷", "DEL", ["EXT"], "legend", 92, "velocista", [97, 90, 80, 90, 36, 78]),
  p("fr-dembele", "Dembélé", "FR", "🇫🇷", "EXT", ["DEL"], "rare", 84, "velocista", [93, 78, 76, 90, 34, 68]),
  // España
  p("es-simon", "Unai Simón", "ES", "🇪🇸", "POR", [], "rare", 83, "muro", [46, 22, 64, 40, 86, 80]),
  p("es-carvajal", "Carvajal", "ES", "🇪🇸", "DEF", ["MC"], "rare", 84, "lider", [80, 58, 78, 74, 82, 80]),
  p("es-rodri", "Rodri", "ES", "🇪🇸", "MC", ["DEF"], "legend", 90, "cerebro", [70, 74, 90, 82, 86, 88]),
  p("es-pedri", "Pedri", "ES", "🇪🇸", "MC", ["EXT"], "elite", 87, "cerebro", [78, 72, 90, 90, 64, 70]),
  p("es-yamal", "Yamal", "ES", "🇪🇸", "EXT", ["DEL"], "champion", 88, "velocista", [92, 80, 82, 91, 32, 66]),
  p("es-morata", "Morata", "ES", "🇪🇸", "DEL", [], "pro", 79, "goleador", [80, 82, 68, 72, 40, 82]),
  // Inglaterra
  p("en-pickford", "Pickford", "EN", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "POR", [], "rare", 82, "muro", [48, 24, 58, 40, 84, 80]),
  p("en-stones", "Stones", "EN", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "DEF", ["MC"], "rare", 84, "muro", [74, 50, 80, 70, 86, 80]),
  p("en-bellingham", "Bellingham", "EN", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "MC", ["DEL"], "legend", 90, "lider", [84, 84, 86, 86, 76, 86]),
  p("en-foden", "Foden", "EN", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "MC", ["EXT", "DEL"], "elite", 87, "cerebro", [86, 82, 88, 90, 52, 70]),
  p("en-kane", "Kane", "EN", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "DEL", [], "legend", 90, "goleador", [74, 92, 84, 80, 48, 84]),
  p("en-saka", "Saka", "EN", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "EXT", ["DEL", "MC"], "elite", 87, "velocista", [90, 82, 84, 88, 42, 72]),
  // Portugal
  p("pt-costa", "Diogo Costa", "PT", "🇵🇹", "POR", [], "rare", 83, "muro", [50, 22, 66, 42, 85, 80]),
  p("pt-dias", "Rúben Dias", "PT", "🇵🇹", "DEF", [], "elite", 87, "muro", [70, 44, 74, 62, 90, 86]),
  p("pt-bruno", "Bruno F.", "PT", "🇵🇹", "MC", ["EXT"], "elite", 86, "cerebro", [72, 84, 88, 84, 66, 76]),
  p("pt-bernardo", "Bernardo", "PT", "🇵🇹", "MC", ["EXT", "DEL"], "elite", 87, "cerebro", [80, 80, 90, 92, 48, 68]),
  p("pt-ronaldo", "CR7", "PT", "🇵🇹", "DEL", ["EXT"], "legend", 88, "goleador", [84, 91, 76, 82, 40, 86]),
  p("pt-leao", "Leão", "PT", "🇵🇹", "EXT", ["DEL"], "elite", 86, "velocista", [94, 82, 74, 88, 34, 74]),
  // Uruguay / Colombia / Países Bajos / Alemania (variedad)
  p("uy-rocchetto", "Rochet", "UY", "🇺🇾", "POR", [], "pro", 76, "muro", [44, 20, 56, 36, 80, 78]),
  p("uy-araujo", "Araújo", "UY", "🇺🇾", "DEF", [], "elite", 86, "muro", [88, 48, 68, 66, 88, 90]),
  p("uy-valverde", "Valverde", "UY", "🇺🇾", "MC", ["DEF", "EXT"], "elite", 87, "recuperador", [88, 80, 82, 80, 78, 88]),
  p("uy-nunez", "Nuñez", "UY", "🇺🇾", "DEL", ["EXT"], "rare", 83, "goleador", [92, 84, 68, 78, 40, 84]),
  p("co-vargas", "C. Vargas", "CO", "🇨🇴", "POR", [], "pro", 77, "muro", [46, 20, 58, 38, 81, 76]),
  p("co-mina", "Mina", "CO", "🇨🇴", "DEF", [], "pro", 78, "muro", [72, 50, 64, 58, 82, 86]),
  p("co-james", "James", "CO", "🇨🇴", "MC", ["EXT"], "rare", 82, "cerebro", [74, 80, 88, 86, 52, 68]),
  p("co-diaz", "L. Díaz", "CO", "🇨🇴", "EXT", ["DEL"], "elite", 86, "velocista", [94, 80, 76, 88, 36, 76]),
  p("nl-verbruggen", "Verbruggen", "NL", "🇳🇱", "POR", [], "pro", 78, "muro", [48, 22, 62, 40, 80, 76]),
  p("nl-van-dijk", "Van Dijk", "NL", "🇳🇱", "DEF", [], "legend", 89, "lider", [76, 52, 78, 68, 92, 88]),
  p("nl-de-jong", "F. de Jong", "NL", "🇳🇱", "MC", ["DEF"], "elite", 86, "cerebro", [80, 70, 90, 88, 74, 78]),
  p("nl-gakpo", "Gakpo", "NL", "🇳🇱", "EXT", ["DEL", "MC"], "rare", 83, "goleador", [86, 82, 78, 84, 42, 76]),
  p("de-neuer", "Neuer", "DE", "🇩🇪", "POR", [], "champion", 87, "muro", [52, 28, 74, 48, 88, 82]),
  p("de-rudiger", "Rüdiger", "DE", "🇩🇪", "DEF", [], "elite", 85, "muro", [84, 46, 66, 60, 86, 90]),
  p("de-kroos", "Kroos", "DE", "🇩🇪", "MC", [], "legend", 88, "cerebro", [58, 80, 94, 84, 68, 70]),
  p("de-musiala", "Musiala", "DE", "🇩🇪", "MC", ["EXT", "DEL"], "champion", 88, "cerebro", [86, 82, 86, 92, 48, 72]),
];

export const DEFAULT_AVATAR = AVATAR;

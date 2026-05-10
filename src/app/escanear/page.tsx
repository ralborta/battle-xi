import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import { Camera, ScanLine, CircleCheck } from "lucide-react";

export default function EscanearPage() {
  return (
    <>
      <PageShell title="Escanear figurita" subtitle="Acomodá la figurita dentro del marco" back="/jugar">
        <div className="relative aspect-[2/3] max-w-xs mx-auto mb-6">
          <div className="absolute inset-0 rounded-3xl bg-bg-deep border border-border-soft overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, transparent 0%, rgba(34,211,238,0.05) 50%, transparent 100%)",
              }}
            />
            <div
              className="absolute left-4 right-4 h-[3px] rounded-full"
              style={{
                top: "50%",
                background:
                  "linear-gradient(90deg, transparent, #22d3ee 30%, #a855f7 70%, transparent)",
                boxShadow: "0 0 18px rgba(34,211,238,0.9), 0 0 36px rgba(168,85,247,0.6)",
                animation: "scan 2.4s ease-in-out infinite",
              }}
            />
          </div>

          {[
            "top-0 left-0 rounded-tl-3xl border-t-2 border-l-2",
            "top-0 right-0 rounded-tr-3xl border-t-2 border-r-2",
            "bottom-0 left-0 rounded-bl-3xl border-b-2 border-l-2",
            "bottom-0 right-0 rounded-br-3xl border-b-2 border-r-2",
          ].map((pos, i) => (
            <div
              key={i}
              className={`absolute w-10 h-10 ${pos} border-cyan-300 pointer-events-none`}
              style={{
                boxShadow: "0 0 14px rgba(34,211,238,0.7)",
              }}
            />
          ))}

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
            <ScanLine className="w-14 h-14 text-cyan-300/80 mb-3" />
            <p className="font-display text-lg text-text-primary">
              Centrá tu figurita
            </p>
            <p className="text-xs text-text-tertiary mt-1 max-w-[160px]">
              Asegurate de que se vea el nombre y la foto del jugador
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {[
            "Buena luz, sin reflejos",
            "Figurita completa dentro del marco",
            "Texto del jugador legible",
          ].map((tip) => (
            <div key={tip} className="flex items-center gap-2 text-xs text-text-tertiary">
              <CircleCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              {tip}
            </div>
          ))}
        </div>

        <Button variant="cyan" size="xl" fullWidth icon={<Camera className="w-5 h-5" />}>
          Capturar
        </Button>
        <p className="mt-3 text-center text-[11px] text-text-muted">
          La IA validará y transformará tu figurita en una carta única.
        </p>
      </PageShell>
      <BottomNav />

      <style>{`
        @keyframes scan {
          0%, 100% { top: 12%; opacity: 0.4; }
          50% { top: 88%; opacity: 1; }
        }
      `}</style>
    </>
  );
}

"use client";

import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import { cn } from "@/lib/cn";
import { Camera, ScanLine, CircleCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function EscanearContent() {
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const start = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Tu dispositivo no permite usar la cámara desde acá.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
    } catch {
      setError("Activá la cámara en los permisos del navegador y reintentá.");
    }
  };

  return (
    <>
      <PageShell
        title="Escanear figurita"
        subtitle="Acomodá la figurita dentro del marco"
        back="/jugar"
      >
        <div className="relative aspect-[2/3] max-w-xs mx-auto mb-6 rounded-3xl overflow-hidden border border-border-soft bg-bg-deep">
          <video
            ref={videoRef}
            className={cn(
              "absolute inset-0 h-full w-full object-cover",
              active ? "opacity-100" : "opacity-0",
            )}
            playsInline
            muted
            autoPlay
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, rgba(34,211,238,0.05) 50%, transparent 100%)",
            }}
          />
          <div
            className="absolute left-4 right-4 h-[3px] rounded-full z-[1]"
            style={{
              top: "50%",
              background:
                "linear-gradient(90deg, transparent, #22d3ee 30%, #a855f7 70%, transparent)",
              boxShadow: "0 0 18px rgba(34,211,238,0.9), 0 0 36px rgba(168,85,247,0.6)",
              animation: "scanline 2.4s ease-in-out infinite",
            }}
          />

          {[
            "top-0 left-0 rounded-tl-3xl border-t-2 border-l-2",
            "top-0 right-0 rounded-tr-3xl border-t-2 border-r-2",
            "bottom-0 left-0 rounded-bl-3xl border-b-2 border-l-2",
            "bottom-0 right-0 rounded-br-3xl border-b-2 border-r-2",
          ].map((pos, i) => (
            <div
              key={i}
              className={`absolute w-10 h-10 z-[1] ${pos} border-cyan-300 pointer-events-none`}
              style={{
                boxShadow: "0 0 14px rgba(34,211,238,0.7)",
              }}
            />
          ))}

          {!active && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-[2] bg-bg-deep/90">
              <ScanLine className="w-14 h-14 text-cyan-300/80 mb-3" />
              <p className="font-display text-lg text-text-primary">Prepará la cámara</p>
              <p className="text-xs text-text-tertiary mt-1 max-w-[200px] font-body">
                Tocá el botón abajo para ver la imagen en vivo y encuadrar tu figurita.
              </p>
            </div>
          )}

          {active && (
            <div className="absolute bottom-3 left-3 right-3 z-[2] flex items-center justify-center gap-2 rounded-xl bg-black/55 backdrop-blur-sm py-2">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] font-display uppercase tracking-wider text-cyan-100">
                En vivo
              </span>
            </div>
          )}
        </div>

        {error && (
          <p className="mb-4 text-center text-sm text-red-400 font-body px-1">{error}</p>
        )}

        {!active ? (
          <Button variant="cyan" size="lg" fullWidth icon={<Camera className="w-5 h-5" />} onClick={start}>
            Encender cámara
          </Button>
        ) : (
          <Button variant="outline" size="md" fullWidth onClick={start} className="mb-3">
            Reiniciar cámara
          </Button>
        )}

        <div className="space-y-2 mb-6 mt-6">
          {[
            "Buena luz, sin reflejos",
            "Figurita completa dentro del marco",
            "Texto del jugador legible",
          ].map((tip) => (
            <div key={tip} className="flex items-center gap-2 text-xs text-text-tertiary font-body">
              <CircleCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              {tip}
            </div>
          ))}
        </div>

        <Button
          variant="cyan"
          size="xl"
          fullWidth
          icon={<Camera className="w-5 h-5" />}
          disabled={!active}
        >
          Capturar
        </Button>
        <p className="mt-3 text-center text-[11px] text-text-muted font-body">
          La IA validará y transformará tu figurita en una carta única.
        </p>
      </PageShell>
      <BottomNav />

      <style>{`
        @keyframes scanline {
          0%, 100% { top: 12%; opacity: 0.4; }
          50% { top: 88%; opacity: 1; }
        }
      `}</style>
    </>
  );
}

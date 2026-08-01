"use client";

import { BottomNav } from "@/components/BottomNav";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import { POSITIONS } from "@/lib/card-generator";
import type { Position } from "@/components/PlayerCard";
import { cn } from "@/lib/cn";
import { Camera, ScanLine, CircleCheck, RotateCcw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const FLAGS = ["🇦🇷", "🇧🇷", "🇺🇾", "🇨🇱", "🇨🇴", "🇵🇾", "🇵🇪", "🇲🇽", "🇪🇸", "🇫🇷", "🇵🇹", "🇮🇹", "🇩🇪", "🇳🇱", "🇬🇧"];

const POSITION_LABELS: Record<Position, string> = {
  POR: "Arquero",
  DEF: "Defensor",
  MC: "Mediocampo",
  DC: "Delantero centro",
  DEL: "Delantero",
  EXT: "Extremo",
};

/**
 * El OCR devuelve el texto entero de la figurita (club, número, publicidad).
 * Nos quedamos con la línea que más se parece a un nombre propio.
 */
function guessPlayerName(text: string): string {
  const candidates = text
    .split("\n")
    .map((line) => line.replace(/[^\p{L}\s.'-]/gu, " ").replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 3 && line.length <= 32)
    .filter((line) => /\p{L}{3,}/u.test(line));

  if (candidates.length === 0) return "";

  const best = candidates.reduce((a, b) => {
    const score = (line: string) =>
      line.length + (line === line.toUpperCase() ? 6 : 0);
    return score(b) > score(a) ? b : a;
  });

  return best
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function EscanearContent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [reading, setReading] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [position, setPosition] = useState<Position>("DEL");
  const [flag, setFlag] = useState(FLAGS[0]);
  const [saving, setSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.url);
    };
  }, [photo]);

  const start = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Tu dispositivo no permite usar la cámara desde acá.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
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

  const runOcr = async (blob: Blob) => {
    setReading(true);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("spa");
      const { data } = await worker.recognize(blob);
      await worker.terminate();
      setOcrText(data.text);
      const guess = guessPlayerName(data.text);
      if (guess) setPlayerName(guess);
    } catch {
      // Si el OCR falla igual puede escribir el nombre a mano.
    } finally {
      setReading(false);
    }
  };

  const capture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob) {
      setError("No pudimos tomar la foto. Probá de nuevo.");
      return;
    }

    stop();
    setPhoto({ blob, url: URL.createObjectURL(blob) });
    void runOcr(blob);
  };

  const retake = () => {
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto(null);
    setOcrText("");
    setPlayerName("");
    setError(null);
    void start();
  };

  const save = async () => {
    if (!photo) return;
    setError(null);
    setSaving(true);
    try {
      const form = new FormData();
      form.append("image", photo.blob, "figurita.jpg");
      form.append("playerName", playerName.trim());
      form.append("position", position);
      form.append("countryFlag", flag);
      form.append("ocrText", ocrText);

      const res = await fetch("/api/scans", { method: "POST", body: form });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setError(data?.error ?? "No pudimos guardar la carta. Probá de nuevo.");
        return;
      }

      router.push("/coleccion");
      router.refresh();
    } catch {
      setError("No pudimos conectarnos. Revisá tu internet y reintentá.");
    } finally {
      setSaving(false);
    }
  };

  const canSave = playerName.trim().length >= 2 && !saving && !reading;

  return (
    <>
      <PageShell
        title="Escanear figurita"
        subtitle={photo ? "Revisá los datos antes de fichar" : "Acomodá la figurita dentro del marco"}
        back="/jugar"
      >
        <div className="relative aspect-[2/3] max-w-xs mx-auto mb-6 rounded-3xl overflow-hidden border border-border-soft bg-bg-deep">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.url} alt="Figurita escaneada" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
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
          )}

          {!photo && (
            <>
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
            </>
          )}

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

          {!active && !photo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-[2] bg-bg-deep/90">
              <ScanLine className="w-14 h-14 text-cyan-300/80 mb-3" />
              <p className="font-display text-lg text-text-primary">Prepará la cámara</p>
              <p className="text-xs text-text-tertiary mt-1 max-w-[200px] font-body">
                Tocá el botón abajo para ver la imagen en vivo y encuadrar tu figurita.
              </p>
            </div>
          )}

          {active && !photo && (
            <div className="absolute bottom-3 left-3 right-3 z-[2] flex items-center justify-center gap-2 rounded-xl bg-black/55 backdrop-blur-sm py-2">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] font-display uppercase tracking-wider text-cyan-100">
                En vivo
              </span>
            </div>
          )}

          {reading && (
            <div className="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm">
              <Sparkles className="w-10 h-10 text-cyan-300 animate-pulse" />
              <p className="font-display text-sm text-cyan-100">Leyendo el nombre…</p>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {error && (
          <p className="mb-4 text-center text-sm text-red-400 font-body px-1">{error}</p>
        )}

        {!photo ? (
          <>
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
              onClick={() => void capture()}
            >
              Capturar
            </Button>
            <p className="mt-3 text-center text-[11px] text-text-muted font-body">
              Leemos el nombre de la figurita y lo convertimos en tu carta.
            </p>
          </>
        ) : (
          <div className="space-y-5">
            <label className="block">
              <span className="text-[11px] font-display tracking-widest uppercase text-text-tertiary">
                Nombre del jugador
              </span>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={reading ? "Leyendo…" : "ej. Martínez"}
                maxLength={32}
                className="mt-1 w-full h-12 rounded-xl bg-bg-deep border border-border-soft px-4 text-text-primary font-body placeholder:text-text-muted focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_14px_rgba(34,211,238,0.3)] transition"
              />
              <span className="mt-1 block text-[11px] text-text-muted font-body">
                Si no lo leímos bien, corregilo acá.
              </span>
            </label>

            <div>
              <span className="text-[11px] font-display tracking-widest uppercase text-text-tertiary">
                Posición
              </span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setPosition(pos)}
                    className={cn(
                      "h-11 rounded-xl border text-xs font-display uppercase tracking-wider transition",
                      pos === position
                        ? "bg-cyan-400/15 border-cyan-400/60 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                        : "bg-white/5 border-border-soft text-text-tertiary hover:bg-white/10",
                    )}
                  >
                    {pos}
                  </button>
                ))}
              </div>
              <span className="mt-1 block text-[11px] text-text-muted font-body">
                {POSITION_LABELS[position]}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-display tracking-widest uppercase text-text-tertiary">
                País
              </span>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {FLAGS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFlag(option)}
                    className={cn(
                      "shrink-0 h-11 w-11 rounded-xl border text-xl transition",
                      option === flag
                        ? "bg-cyan-400/15 border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                        : "bg-white/5 border-border-soft hover:bg-white/10",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="cyan"
              size="xl"
              fullWidth
              icon={<Sparkles className="w-5 h-5" />}
              disabled={!canSave}
              onClick={() => void save()}
            >
              {saving ? "Fichando…" : "Fichar carta"}
            </Button>

            <Button
              variant="ghost"
              size="md"
              fullWidth
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={retake}
              disabled={saving}
            >
              Sacar otra foto
            </Button>
          </div>
        )}
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

"use client";

import { BattleLogo } from "@/components/BattleLogo";
import { Button } from "@/components/Button";
import { isOnboarded, persistOnboarding } from "@/lib/onboarding-storage";
import { cn } from "@/lib/cn";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ScanLine,
  Shield,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const STEPS = 4 as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  /** Queda true si en algún momento hubo preview (no depende del stream al terminar el paso 4). */
  const cameraEverGrantedRef = useRef(false);

  useEffect(() => {
    if (isOnboarded()) {
      router.replace("/jugar");
    }
  }, [router]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreamActive(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  /** Al salir del paso cámara, apagamos el stream para ahorrar batería */
  useEffect(() => {
    if (step !== 3) stopCamera();
  }, [step, stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Tu navegador no permite usar la cámara aquí. Probá desde el celular o usá Chrome o Safari actualizado.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreamActive(true);
      cameraEverGrantedRef.current = true;
    } catch {
      setCameraError(
        "No pudimos activar la cámara. Revisá los permisos del navegador o del sistema y tocá Reintentar.",
      );
    }
  };

  const canGoProfile = streamActive;
  const canFinish =
    nickname.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim());

  const finish = () => {
    persistOnboarding({
      nickname: nickname.trim(),
      parentEmail: parentEmail.trim().toLowerCase(),
      cameraGranted: cameraEverGrantedRef.current,
    });
    stopCamera();
    router.push("/jugar");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-stadium pb-safe">
      <div className="absolute inset-0 grid-arena opacity-25 pointer-events-none" />

      <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col px-5 pt-8 pb-10">
        <div className="flex items-center gap-2 mb-6">
          {Array.from({ length: STEPS }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                i + 1 <= step
                  ? "bg-gradient-to-r from-cyan-400 to-violet-500 shadow-[0_0_12px_rgba(34,211,238,0.5)]"
                  : "bg-white/10",
              )}
            />
          ))}
        </div>

        <div className="flex justify-center mb-4">
          <BattleLogo size="md" />
        </div>

        {step === 1 && (
          <div className="flex-1 flex flex-col animate-[rise_0.5s_ease-out_both]">
            <p className="text-center text-[11px] font-display tracking-[0.25em] uppercase text-cyan-300/90 mb-2">
              Paso 1 de {STEPS}
            </p>
            <h1 className="font-display text-3xl text-text-primary text-center leading-tight">
              Bienvenido al club
            </h1>
            <p className="mt-3 text-center text-sm text-text-tertiary font-body">
              En Battle XI tus figuritas se convierten en cartas épicas. Vas a
              escanear, coleccionar y competir por la copa.
            </p>
            <div className="mt-8 space-y-3 rounded-2xl border border-border-soft bg-white/5 p-4">
              {[
                { icon: ScanLine, text: "Escaneá figuritas reales con la cámara" },
                { icon: Sparkles, text: "Las transformamos en cartas únicas" },
                { icon: Swords, text: "Batallá y subí en el ranking" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 border border-cyan-400/40">
                    <Icon className="h-5 w-5 text-cyan-300" />
                  </div>
                  <p className="text-sm text-text-secondary font-body pt-2">{text}</p>
                </div>
              ))}
            </div>
            <div className="flex-1 min-h-4" />
            <Button
              variant="cyan"
              size="lg"
              fullWidth
              className="mt-6"
              icon={<ChevronRight className="h-5 w-5" />}
              iconRight
              onClick={() => setStep(2)}
            >
              Siguiente
            </Button>
            <Link
              href="/"
              className="mt-4 text-center text-sm text-text-tertiary hover:text-cyan-300 transition"
            >
              Volver al inicio
            </Link>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col animate-[rise_0.5s_ease-out_both]">
            <p className="text-center text-[11px] font-display tracking-[0.25em] uppercase text-cyan-300/90 mb-2">
              Paso 2 de {STEPS}
            </p>
            <h1 className="font-display text-3xl text-text-primary text-center leading-tight">
              Cómo empezás
            </h1>
            <p className="mt-3 text-center text-sm text-text-tertiary font-body">
              Tres cosas simples. Después te pedimos la cámara para tu primer
              escaneo.
            </p>
            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-4 flex gap-3">
                <div className="text-3xl font-display text-cyan-200">1</div>
                <div>
                  <p className="font-display text-lg text-text-primary">Escaneá</p>
                  <p className="text-sm text-text-tertiary font-body mt-1">
                    Poné la figurita bien iluminada y alineala con el marco.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-transparent p-4 flex gap-3">
                <div className="text-3xl font-display text-violet-200">2</div>
                <div>
                  <p className="font-display text-lg text-text-primary">Fichá</p>
                  <p className="text-sm text-text-tertiary font-body mt-1">
                    Tu jugador entra a la colección como carta digital.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-transparent p-4 flex gap-3">
                <div className="text-3xl font-display text-amber-200">3</div>
                <div>
                  <p className="font-display text-lg text-text-primary flex items-center gap-2">
                    Competí <Trophy className="h-5 w-5 text-amber-300 inline" />
                  </p>
                  <p className="text-sm text-text-tertiary font-body mt-1">
                    Mejorá tu equipo y ganá gemas en batallas y torneos.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-4" />
            <div className="flex gap-3 mt-6">
              <Button
                variant="ghost"
                size="lg"
                className="flex-1"
                icon={<ChevronLeft className="h-5 w-5" />}
                onClick={() => setStep(1)}
              >
                Atrás
              </Button>
              <Button
                variant="cyan"
                size="lg"
                className="flex-[2]"
                icon={<ChevronRight className="h-5 w-5" />}
                iconRight
                onClick={() => setStep(3)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col animate-[rise_0.5s_ease-out_both]">
            <p className="text-center text-[11px] font-display tracking-[0.25em] uppercase text-cyan-300/90 mb-2">
              Paso 3 de {STEPS}
            </p>
            <h1 className="font-display text-3xl text-text-primary text-center leading-tight">
              Activá la cámara
            </h1>
            <p className="mt-3 text-center text-sm text-text-tertiary font-body">
              Necesitamos permiso para escanear figuritas. No grabamos audio:
              solo usamos la imagen cuando vos tocás capturar.
            </p>

            <div className="mt-6 relative aspect-[3/4] max-w-[260px] mx-auto w-full rounded-3xl overflow-hidden border-2 border-cyan-400/50 bg-bg-deep shadow-[0_0_30px_rgba(34,211,238,0.25)]">
              <video
                ref={videoRef}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover",
                  streamActive ? "opacity-100" : "opacity-0",
                )}
                playsInline
                muted
                autoPlay
              />
              {!streamActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <Camera className="h-14 w-14 text-cyan-300/70 mb-3" />
                  <p className="font-display text-sm text-text-secondary">
                    Tocá el botón de abajo
                  </p>
                  <p className="text-xs text-text-muted font-body mt-1">
                    Vas a ver tu cámara acá cuando aceptes el permiso
                  </p>
                </div>
              )}
              {streamActive && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 rounded-xl bg-black/60 backdrop-blur-sm py-2 px-3">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[11px] font-display uppercase tracking-wider text-cyan-100">
                    Cámara lista
                  </span>
                </div>
              )}
            </div>

            {cameraError && (
              <p className="mt-4 text-center text-sm text-red-400 font-body px-2">
                {cameraError}
              </p>
            )}

            <div className="flex-1 min-h-4" />

            {!streamActive ? (
              <Button
                variant="cyan"
                size="lg"
                fullWidth
                className="mt-6"
                icon={<Camera className="h-5 w-5" />}
                onClick={startCamera}
              >
                Permitir cámara
              </Button>
            ) : (
              <Button
                variant="outline"
                size="md"
                fullWidth
                className="mt-4"
                onClick={startCamera}
              >
                Reintentar cámara
              </Button>
            )}

            <div className="flex gap-3 mt-4">
              <Button
                variant="ghost"
                size="lg"
                className="flex-1"
                icon={<ChevronLeft className="h-5 w-5" />}
                onClick={() => setStep(2)}
              >
                Atrás
              </Button>
              <Button
                variant="violet"
                size="lg"
                className="flex-[2]"
                icon={<ChevronRight className="h-5 w-5" />}
                iconRight
                disabled={!canGoProfile}
                onClick={() => setStep(4)}
              >
                Continuar
              </Button>
            </div>
            {!canGoProfile && (
              <p className="mt-2 text-center text-[11px] text-text-muted font-body">
                Activá la cámara para seguir al siguiente paso.
              </p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="flex-1 flex flex-col animate-[rise_0.5s_ease-out_both]">
            <p className="text-center text-[11px] font-display tracking-[0.25em] uppercase text-cyan-300/90 mb-2">
              Paso 4 de {STEPS}
            </p>
            <h1 className="font-display text-3xl text-text-primary text-center leading-tight">
              Tu cuenta
            </h1>
            <p className="mt-3 text-center text-sm text-text-tertiary font-body">
              Elegí un apodo épico. El email es de un adulto para recuperar la
              cuenta si hace falta.
            </p>

            <div className="mt-8 space-y-4 rounded-2xl border border-border-soft bg-white/5 p-5">
              <label className="block">
                <span className="text-[11px] font-display tracking-widest uppercase text-text-tertiary">
                  Tu apodo
                </span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="ej. ElCapitán11"
                  maxLength={24}
                  autoComplete="username"
                  className="mt-1 w-full h-12 rounded-xl bg-bg-deep border border-border-soft px-4 text-text-primary font-body placeholder:text-text-muted focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_14px_rgba(34,211,238,0.3)] transition"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-display tracking-widest uppercase text-text-tertiary flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-violet-300" />
                  Email del adulto
                </span>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="mama@ejemplo.com"
                  autoComplete="email"
                  className="mt-1 w-full h-12 rounded-xl bg-bg-deep border border-border-soft px-4 text-text-primary font-body placeholder:text-text-muted focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_14px_rgba(34,211,238,0.3)] transition"
                />
              </label>
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                variant="ghost"
                size="lg"
                className="flex-1"
                icon={<ChevronLeft className="h-5 w-5" />}
                onClick={() => setStep(3)}
              >
                Atrás
              </Button>
              <Button
                variant="cyan"
                size="lg"
                className="flex-[2]"
                disabled={!canFinish}
                onClick={finish}
              >
                Entrar al juego
              </Button>
            </div>
            {!canFinish && (
              <p className="mt-3 text-center text-[11px] text-text-muted font-body">
                Apodo de al menos 2 letras y un email válido.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

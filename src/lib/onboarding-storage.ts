/**
 * Estado de onboarding y perfil local (client-only).
 * Más adelante se sincroniza con backend / sesión.
 */

export const ONBOARDED_KEY = "battlexi_onboarded_v1";
export const PROFILE_KEY = "battlexi_profile_v1";

export type LocalProfile = {
  nickname: string;
  parentEmail: string;
  cameraGranted: boolean;
  onboardedAt: string;
};

export function isOnboarded(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ONBOARDED_KEY) === "1";
}

export function getLocalProfile(): LocalProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalProfile;
  } catch {
    return null;
  }
}

export function persistOnboarding(profile: Omit<LocalProfile, "onboardedAt">): void {
  if (typeof window === "undefined") return;
  const full: LocalProfile = {
    ...profile,
    onboardedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(full));
  window.localStorage.setItem(ONBOARDED_KEY, "1");
}

/** Solo para desarrollo / soporte */
export function clearOnboarding(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ONBOARDED_KEY);
  window.localStorage.removeItem(PROFILE_KEY);
}

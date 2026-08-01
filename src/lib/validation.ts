export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 24;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PIN_RE = /^\d{4}$/;

export function parseNickname(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const nickname = value.trim();
  if (nickname.length < NICKNAME_MIN || nickname.length > NICKNAME_MAX) return null;
  return nickname;
}

export function parseEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return EMAIL_RE.test(email) ? email : null;
}

export function parsePin(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const pin = value.trim();
  return PIN_RE.test(pin) ? pin : null;
}

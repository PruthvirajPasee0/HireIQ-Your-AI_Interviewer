import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.INVITE_TOKEN_SECRET;

function b64url(input: Buffer | string) {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlDecode(s: string): Buffer {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

function getSecret(): string {
  if (!SECRET || SECRET.length < 16) {
    throw new Error(
      "INVITE_TOKEN_SECRET must be set (>= 16 chars) for invite tokens"
    );
  }
  return SECRET;
}

export interface InvitePayload {
  sessionId: string;
  candidateEmail: string;
  exp: number;
}

export function signInviteToken(payload: InvitePayload): string {
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", getSecret()).update(body).digest();
  return `${body}.${b64url(sig)}`;
}

export function verifyInviteToken(token: string): InvitePayload | null {
  if (!token || !token.includes(".")) return null;
  const [body, sigB64] = token.split(".");

  const expected = createHmac("sha256", getSecret()).update(body).digest();
  const provided = b64urlDecode(sigB64);
  if (expected.length !== provided.length) return null;
  if (!timingSafeEqual(expected, provided)) return null;

  try {
    const payload = JSON.parse(b64urlDecode(body).toString("utf8")) as InvitePayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000)
      return null;
    return payload;
  } catch {
    return null;
  }
}

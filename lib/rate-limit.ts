import { db } from "@/firebase/admin";

type EnforceRateLimitParams = {
  namespace: string;
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
  resetAtMs: number;
};

function normalizeDocPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 180);
}

export async function enforceRateLimit(
  params: EnforceRateLimitParams
): Promise<RateLimitDecision> {
  const { namespace, key, limit, windowMs } = params;
  const now = Date.now();
  const bucket = Math.floor(now / windowMs);
  const resetAtMs = (bucket + 1) * windowMs;

  const safeNamespace = normalizeDocPart(namespace);
  const safeKey = normalizeDocPart(key);
  const docId = `${safeNamespace}__${safeKey}__${bucket}`;
  const ref = db.collection("__rate_limits").doc(docId);

  let allowed = false;
  let nextCount = 0;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const currentCount = snap.exists ? Number(snap.data()?.count ?? 0) : 0;

    if (currentCount >= limit) {
      allowed = false;
      nextCount = currentCount;
      return;
    }

    allowed = true;
    nextCount = currentCount + 1;

    tx.set(
      ref,
      {
        namespace,
        key: safeKey,
        count: nextCount,
        windowStartMs: bucket * windowMs,
        windowMs,
        updatedAt: new Date(now).toISOString(),
        expiresAtMs: resetAtMs + windowMs,
      },
      { merge: true }
    );
  });

  return {
    allowed,
    retryAfterSeconds: allowed
      ? 0
      : Math.max(1, Math.ceil((resetAtMs - now) / 1000)),
    remaining: Math.max(0, limit - nextCount),
    resetAtMs,
  };
}

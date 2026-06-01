/**
 * Brevo (Sendinblue) transactional email helper. NO-OPS gracefully when
 * BREVO_API_KEY isn't set so the rest of the app keeps working without
 * email configured.
 *
 * Uses Brevo's REST API directly (no SDK) — one fetch call per email.
 *
 * To enable:
 *   1. Sign up at https://brevo.com (free: 300 emails/day)
 *   2. Verify a sender at Senders & IP → Senders → "Add a sender"
 *   3. Set in .env.local:
 *        BREVO_API_KEY=xkeysib-...
 *        BREVO_FROM_EMAIL=you@yourdomain.com   (must be verified)
 *        BREVO_FROM_NAME="Hireiq.ai"
 *        NEXT_PUBLIC_APP_URL=https://yourdomain.com   (optional)
 */

const KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL ?? "noreply@hireiq.ai";
const FROM_NAME = process.env.BREVO_FROM_NAME ?? "Hireiq.ai";
// Email is rendered server-side (UTC on Vercel), so an unqualified
// toLocaleString showed the wrong time. Format explicitly in the recruiter's
// timezone (IST by default) and label it so the candidate is never confused.
const INVITE_TZ = process.env.INVITE_TIMEZONE ?? "Asia/Kolkata";
const INVITE_TZ_LABEL = process.env.INVITE_TIMEZONE_LABEL ?? "IST";

export function emailConfigured(): boolean {
  return !!KEY;
}

interface SendInviteParams {
  to: string;
  candidateName: string;
  agentName: string;
  scheduledAt: string;
  meetLink: string;
  inviteUrl: string;
}

export async function sendCandidateInvite(
  params: SendInviteParams,
): Promise<{ sent: boolean; reason?: string }> {
  if (!KEY) return { sent: false, reason: "BREVO_API_KEY not set" };

  const when =
    new Date(params.scheduledAt).toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: INVITE_TZ,
    }) + ` ${INVITE_TZ_LABEL}`;

  const subject = `Your AI interview is scheduled — ${when}`;

  const textContent = `Hi ${params.candidateName.split(" ")[0]},

You've been invited to an AI-powered interview.

When: ${when}
Interviewer: ${params.agentName}

Join the interview here:
${params.inviteUrl}

Or go straight to the Google Meet:
${params.meetLink}

Tips:
- Use Chrome or Edge for best results
- Allow microphone access when prompted
- The AI interviewer is conversational — speak naturally

Good luck!
— Hireiq.ai`;

  const htmlContent = `<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111;">
  <div style="margin-bottom: 24px;">
    <span style="font-size: 14px; color: #6366f1; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Hireiq.ai</span>
  </div>
  <h1 style="font-size: 24px; margin: 0 0 16px;">Your interview is scheduled</h1>
  <p style="font-size: 16px; line-height: 1.6;">Hi ${escapeHtml(
    params.candidateName.split(" ")[0],
  )}, you've been invited to an AI-powered interview.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
    <tr><td style="padding: 8px 0; color: #666;">When</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(when)}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Interviewer</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(params.agentName)}</td></tr>
  </table>
  <a href="${escapeAttr(params.inviteUrl)}" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: 600;">Open interview page</a>
  <p style="font-size: 13px; color: #666; margin-top: 32px; line-height: 1.6;">
    Or go straight to the Google Meet: <a href="${escapeAttr(params.meetLink)}" style="color: #4f46e5;">${escapeHtml(params.meetLink)}</a>
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
  <ul style="font-size: 13px; color: #666; padding-left: 20px; line-height: 1.7;">
    <li>Use Chrome or Edge for best results.</li>
    <li>Allow microphone access when prompted.</li>
    <li>Your interviewer is an AI agent. Speak naturally.</li>
  </ul>
  <p style="font-size: 12px; color: #999; margin-top: 32px;">— Hireiq.ai</p>
</body></html>`;

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: params.to, name: params.candidateName }],
        subject,
        htmlContent,
        textContent,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Brevo send failed (${res.status}):`, body);
      return { sent: false, reason: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (err) {
    console.error("Brevo send failed", err);
    return {
      sent: false,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

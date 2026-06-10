/**
 * Outbound email via Brevo's transactional HTTP API.
 *
 * Deliberately dependency-free — a plain `fetch` to Brevo's REST endpoint, so
 * there is no SMTP library to install and nothing to verify at build time.
 * Configured entirely through environment variables, so delivery stays under
 * the operator's control:
 *
 *   BREVO_API_KEY       – transactional API key (required to actually send)
 *   BREVO_SENDER_EMAIL  – verified sender address (required)
 *   BREVO_SENDER_NAME   – display name shown to recipients (optional)
 *
 * When the key or sender are absent the mailer is a transparent NO-OP: it logs
 * a warning and returns `{ ok:false, skipped:true }` without throwing. This
 * mirrors the optional-Redis cache pattern already used in the codebase, so
 * dev, CI and `next build` never need a provider and importing this module can
 * never crash a serverless cold start.
 */

export interface MailMessage {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface MailResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  id?: string;
}

const SENDER_NAME_FALLBACK = 'Pragati';
// Brevo's transactional endpoint. Overridable so integration tests and smoke
// runs can point the mailer at a local mock and assert the exact payload that
// would have gone out — production deployments never set this.
const DEFAULT_API_URL = 'https://api.brevo.com/v3/smtp/email';

function apiUrl(): string {
  return process.env.BREVO_API_URL?.trim() || DEFAULT_API_URL;
}

/* ── Provider seam ─────────────────────────────────────────────────────────
   MAIL_PROVIDER selects the outbound transport (default 'brevo'):

     brevo    – Brevo transactional HTTP API (BREVO_API_KEY + BREVO_SENDER_EMAIL)
     resend   – Resend HTTP API            (RESEND_API_KEY + MAIL_SENDER_EMAIL)
     webhook  – ANY relay the operator owns (MAIL_WEBHOOK_URL [+ MAIL_WEBHOOK_TOKEN])

   'webhook' is the bring-your-own answer for organisations that already run
   mail infrastructure (M365/Exchange, internal SMTP gateways): we POST a
   plain JSON envelope {to,toName,subject,html,text,senderName} and their
   tiny relay (a Graph API call, a Lambda, an Apps Script) does the send on
   infrastructure they already pay for — unlimited volume, zero cost here. */
export type MailProvider = 'brevo' | 'resend' | 'webhook';

export function mailProvider(): MailProvider {
  const p = (process.env.MAIL_PROVIDER || 'brevo').trim().toLowerCase();
  return p === 'resend' || p === 'webhook' ? p : 'brevo';
}

/** True when the selected provider has everything it needs to actually send. */
export function mailerConfigured(): boolean {
  switch (mailProvider()) {
    case 'resend':
      return !!(process.env.RESEND_API_KEY && process.env.MAIL_SENDER_EMAIL);
    case 'webhook':
      return !!process.env.MAIL_WEBHOOK_URL;
    default:
      return !!(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
  }
}

/** The configured sender address (or '' when unconfigured) — surfaced read-only
 *  in the admin setup checklist so an operator can confirm what's wired up. */
export function configuredSender(): string {
  switch (mailProvider()) {
    case 'resend':
      return process.env.MAIL_SENDER_EMAIL || '';
    case 'webhook':
      return process.env.MAIL_SENDER_EMAIL || 'via your relay';
    default:
      return process.env.BREVO_SENDER_EMAIL || '';
  }
}

export async function sendEmail(msg: MailMessage): Promise<MailResult> {
  const provider = mailProvider();
  if (!mailerConfigured()) {
    console.warn(`[mailer] ${provider} not configured — skipping email to`, msg.to);
    return { ok: false, skipped: true };
  }

  const senderName = process.env.MAIL_SENDER_NAME || process.env.BREVO_SENDER_NAME || SENDER_NAME_FALLBACK;

  let url: string;
  let headers: Record<string, string>;
  let body: Record<string, unknown>;

  if (provider === 'resend') {
    url = process.env.MAIL_API_URL?.trim() || 'https://api.resend.com/emails';
    headers = { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' };
    body = {
      from: `${senderName} <${process.env.MAIL_SENDER_EMAIL}>`,
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
      ...(msg.text ? { text: msg.text } : {}),
    };
  } else if (provider === 'webhook') {
    url = process.env.MAIL_WEBHOOK_URL!;
    headers = {
      'content-type': 'application/json',
      ...(process.env.MAIL_WEBHOOK_TOKEN
        ? { authorization: `Bearer ${process.env.MAIL_WEBHOOK_TOKEN}` }
        : {}),
    };
    body = {
      to: msg.to,
      toName: msg.toName || '',
      subject: msg.subject,
      html: msg.html,
      text: msg.text || '',
      senderName,
    };
  } else {
    url = apiUrl();
    headers = {
      'api-key': process.env.BREVO_API_KEY!,
      'content-type': 'application/json',
      accept: 'application/json',
    };
    body = {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: senderName },
      to: [{ email: msg.to, ...(msg.toName ? { name: msg.toName } : {}) }],
      subject: msg.subject,
      htmlContent: msg.html,
      ...(msg.text ? { textContent: msg.text } : {}),
    };
  }

  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[mailer] ${provider} send failed`, res.status, text.slice(0, 300));
      return { ok: false, error: `${provider}_${res.status}` };
    }
    const data = (await res.json().catch(() => ({}))) as { messageId?: string; id?: string };
    return { ok: true, id: data?.messageId || data?.id };
  } catch (e: any) {
    console.error(`[mailer] ${provider} send error`, e?.message);
    return { ok: false, error: e?.message || 'send_error' };
  }
}

/** The "Email me my plan" email: payload shape, validation and HTML rendering. Shared by the
 * Vercel function (api/plan-email.ts), the Vite dev proxy and the client (which builds the payload). */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type PlanEmailTiming = 'first' | 'mid' | 'last' | 'night';

export interface PlanEmailStop {
  name: string;
  branch: string | null;
  startTime: string;
  addressEn: string | null;
  subway: string | null;
  hint: string | null;
  bookingUrl: string | null;
  priceFromUsd: number | null;
}

export interface PlanEmailRoutine {
  title: string;
  promise: string;
  timing: PlanEmailTiming;
  totalMinutes: number;
  stops: PlanEmailStop[];
}

/** A trimmed copy of the Glow Up plan — only what the email shows. */
export interface PlanEmailPayload {
  email: string;
  city: string;
  tripDays: string;
  routines: PlanEmailRoutine[];
}

const TIMINGS: PlanEmailTiming[] = ['first', 'mid', 'last', 'night'];

// Same labels as TIMING_LABEL in src/data/glowUpRoutines.ts.
const TIMING_LABEL: Record<PlanEmailTiming, string> = {
  first: 'First days',
  mid: 'Mid-trip',
  last: 'Last days',
  night: 'Any night',
};

const MAX_ROUTINES = 8;
const MAX_STOPS = 6;

function str(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** Only Creatrip listings get a booking button — anything else is dropped, so the endpoint
 * can't be used to mail arbitrary links. */
function creatripUrl(v: unknown): string | null {
  const s = str(v, 500);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' && (u.hostname === 'creatrip.com' || u.hostname.endsWith('.creatrip.com')) ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Returns a clean payload, or an error message for a 400. */
export function validatePlanPayload(body: unknown): { ok: true; payload: PlanEmailPayload } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid body' };
  const b = body as Record<string, unknown>;

  const email = str(b.email, 254);
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: 'Please enter a valid email address.' };
  if (!Array.isArray(b.routines) || b.routines.length === 0) return { ok: false, error: 'Plan has no routines' };

  const routines: PlanEmailRoutine[] = [];
  for (const raw of b.routines.slice(0, MAX_ROUTINES)) {
    const r = (raw ?? {}) as Record<string, unknown>;
    const timing = TIMINGS.includes(r.timing as PlanEmailTiming) ? (r.timing as PlanEmailTiming) : 'mid';
    const stops: PlanEmailStop[] = (Array.isArray(r.stops) ? r.stops : []).slice(0, MAX_STOPS).flatMap((rawStop) => {
      const s = (rawStop ?? {}) as Record<string, unknown>;
      const name = str(s.name, 120);
      if (!name) return [];
      return [
        {
          name,
          branch: str(s.branch, 80),
          startTime: str(s.startTime, 5) ?? '',
          addressEn: str(s.addressEn, 200),
          subway: str(s.subway, 120),
          hint: str(s.hint, 200),
          bookingUrl: creatripUrl(s.bookingUrl),
          priceFromUsd: num(s.priceFromUsd),
        },
      ];
    });
    if (stops.length === 0) continue;
    routines.push({
      title: str(r.title, 80) ?? 'Your routine',
      promise: str(r.promise, 200) ?? '',
      timing,
      totalMinutes: num(r.totalMinutes) ?? 0,
      stops,
    });
  }
  if (routines.length === 0) return { ok: false, error: 'Plan has no routines' };

  return {
    ok: true,
    payload: { email, city: str(b.city, 40) ?? 'Seoul', tripDays: str(b.tripDays, 40) ?? '', routines },
  };
}

// ---- rendering ----

const INK = '#2b2523';
const ACCENT = '#E2637F';
const MUTED = '#8C8380';
const LINE = '#EEEAEA';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function duration(minutes: number): string {
  if (minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

const stopName = (s: PlanEmailStop) => (s.branch ? `${s.name} (${s.branch})` : s.name);

function groupByTiming(routines: PlanEmailRoutine[]) {
  return TIMINGS.map((timing) => ({ timing, routines: routines.filter((r) => r.timing === timing) })).filter((g) => g.routines.length > 0);
}

function stopHtml(s: PlanEmailStop): string {
  const details = [s.addressEn, s.subway && `🚇 ${s.subway}`, s.priceFromUsd != null && `From $${s.priceFromUsd}`]
    .filter(Boolean)
    .map((d) => `<div style="font-size:13px;color:${MUTED};line-height:1.5;">${esc(String(d))}</div>`)
    .join('');
  const hint = s.hint ? `<div style="margin-top:4px;font-size:12.5px;color:${ACCENT};">${esc(s.hint)}</div>` : '';
  const book = s.bookingUrl
    ? `<a href="${esc(s.bookingUrl)}" style="display:inline-block;margin-top:10px;padding:8px 16px;border-radius:999px;background:${INK};color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">Book on Creatrip</a>`
    : '';
  return `<tr>
  <td valign="top" style="width:52px;padding:14px 0;font-size:13px;font-weight:600;color:${INK};">${esc(s.startTime)}</td>
  <td valign="top" style="padding:14px 0;border-bottom:1px solid ${LINE};">
    <div style="font-size:15px;font-weight:600;color:${INK};">${esc(stopName(s))}</div>
    ${details}${hint}${book}
  </td>
</tr>`;
}

function routineHtml(r: PlanEmailRoutine): string {
  const meta = [`${r.stops.length} stop${r.stops.length === 1 ? '' : 's'}`, duration(r.totalMinutes)].filter(Boolean).join(' · ');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid ${LINE};border-radius:16px;">
<tr><td style="padding:18px 20px 4px;">
  <div style="font-size:18px;font-weight:700;color:${INK};">${esc(r.title)}</div>
  ${r.promise ? `<div style="margin-top:4px;font-size:13.5px;color:${MUTED};">${esc(r.promise)}</div>` : ''}
  <div style="margin-top:6px;font-size:12px;color:${MUTED};">${esc(meta)}</div>
</td></tr>
<tr><td style="padding:0 20px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${r.stops.map(stopHtml).join('')}</table></td></tr>
</table>`;
}

export function renderPlanEmail(p: PlanEmailPayload): { subject: string; html: string; text: string } {
  const subject = `Your ${p.city} Glow Up plan ✦ MIYEON`;
  const sub = [p.city, p.tripDays].filter(Boolean).join(' · ');

  const sections = groupByTiming(p.routines)
    .map(
      (g) => `<div style="margin:28px 0 12px;font-size:12px;font-weight:700;letter-spacing:0.14em;color:${ACCENT};">${esc(TIMING_LABEL[g.timing].toUpperCase())}</div>
${g.routines.map(routineHtml).join('')}`,
    )
    .join('');

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f6f1f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1f1;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;">
<tr><td style="padding:28px 24px 8px;background:#F9DDE4;border-radius:20px 20px 0 0;">
  <div style="font-size:11px;font-weight:600;letter-spacing:0.18em;color:#CF3F61;">✦ YOUR GLOW UP PLAN</div>
  <div style="margin-top:8px;font-size:26px;font-weight:700;line-height:1.25;color:${INK};">${esc(p.city)} called,<br>your K-glow is on</div>
  ${sub ? `<div style="margin:10px 0 18px;font-size:13.5px;color:${MUTED};">${esc(sub)}</div>` : ''}
</td></tr>
<tr><td style="padding:0 24px 24px;">
${sections}
  <div style="margin-top:24px;font-size:12px;line-height:1.5;color:${MUTED};">Booking through these links may earn MIYEON a small commission — at no extra cost to you. Prices and availability can change; check the Creatrip page before you go.</div>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    `YOUR GLOW UP PLAN — ${sub}`,
    '',
    ...groupByTiming(p.routines).flatMap((g) => [
      `== ${TIMING_LABEL[g.timing]} ==`,
      ...g.routines.flatMap((r) => [
        '',
        r.title,
        ...(r.promise ? [r.promise] : []),
        ...r.stops.map((s) =>
          [`  ${s.startTime}  ${stopName(s)}`, s.addressEn && `         ${s.addressEn}`, s.bookingUrl && `         Book: ${s.bookingUrl}`]
            .filter(Boolean)
            .join('\n'),
        ),
      ]),
      '',
    ]),
    'Booking through these links may earn MIYEON a small commission — at no extra cost to you.',
  ].join('\n');

  return { subject, html, text };
}

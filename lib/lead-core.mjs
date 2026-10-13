/**
 * Shared lead-handling logic, used by both hosts:
 *   Cloudflare Worker  -> worker.js      (config from `env`)
 *   Vercel function    -> api/lead.mjs   (config from process.env)
 *
 * LEAD_PAGE names the source page in the email heading, so leads from
 * several landing pages are distinguishable at a glance.
 *
 * Optional: with CRM_INGEST_URL and CRM_INGEST_TOKEN both set, every valid
 * lead is also stored in the CPS dashboard, alongside the email. Without them
 * nothing changes.
 *
 * Runtime-agnostic: only uses standard fetch, available in Workers and Node 18+.
 */

const FIELDS = [
  ['name', 'Name'],
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['Property ZIP', 'Property ZIP'],
  ['Repair Type', 'Repair type'],
  ['message', 'Message'],
  ['Lead Source', 'Lead source'],
];

const PHONE_DISPLAY = '(856) 516-1347';

const CRM_TIMEOUT_MS = 8000;

// Ad parameters worth keeping from the URL the visitor submitted from.
const AD_PARAMS = [
  'gclid', 'gbraid', 'wbraid', 'gad_source', 'fbclid',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// The dashboard's own, stricter email check (Dashboard shared/phone.ts).
const CRM_EMAIL_RE = /^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[a-z]{2,}$/i;

export function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function list(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildEmail(body, config = {}) {
  const pageName = String(config.LEAD_PAGE || '').trim() || 'Home Inspection Repairs Landing Page';
  const present = FIELDS.filter((pair) => String(body[pair[0]] || '').trim());

  const rows = present
    .map(([key, label]) => {
      const raw = String(body[key]).trim();
      let value = esc(raw);
      if (key === 'phone') {
        value = `<a href="tel:${esc(raw.replace(/[^\d+]/g, ''))}" style="color:#C94A00;text-decoration:none">${value}</a>`;
      }
      if (key === 'email') {
        value = `<a href="mailto:${value}" style="color:#C94A00;text-decoration:none">${value}</a>`;
      }
      if (key === 'message') value = value.replace(/\n/g, '<br>');
      return (
        '<tr>' +
        `<td style="padding:10px 0;border-bottom:1px solid #E2DDD7;color:#69625A;font-size:13px;width:150px;vertical-align:top">${esc(label)}</td>` +
        `<td style="padding:10px 0;border-bottom:1px solid #E2DDD7;color:#1A1511;font-size:15px;font-weight:600;vertical-align:top">${value}</td>` +
        '</tr>'
      );
    })
    .join('');

  const html =
    '<div style="background:#FCFAF6;padding:28px 16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif">' +
      '<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E2DDD7;border-radius:12px;overflow:hidden">' +
        '<div style="background:#18120F;padding:20px 28px">' +
          `<div style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-.01em">${esc(pageName)}</div>` +
          '<div style="color:#ABA39B;font-size:13px;margin-top:5px">New repair estimate request &middot; Certified Property Services LLC</div>' +
        '</div>' +
        '<div style="padding:8px 28px 24px">' +
          `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${rows}</table>` +
          '<p style="margin:22px 0 0;color:#69625A;font-size:13px;line-height:1.6">Reply to this email to reach the customer directly, or call the number above.</p>' +
        '</div>' +
      '</div>' +
    '</div>';

  const text = [`${pageName}`, '']
    .concat(present.map(([key, label]) => `${label}: ${String(body[key]).trim()}`))
    .join('\n');

  return { html, text };
}

/**
 * Ad attribution for the dashboard, from the raw Referer and Cookie headers
 * (plain strings, so both hosts can use it). The form posts from the page the
 * visitor is on, so the Referer carries that page's ad parameters. Google's and
 * Meta's first-party cookies, set by their tags on an ad click, cover visitors
 * who clicked an ad on an earlier visit.
 * Returns { page, attribution }: processLead's optional `meta` argument.
 */
export function leadMeta(referer, cookie) {
  const attribution = {};
  let page = '';
  try {
    const url = new URL(String(referer || ''));
    for (const key of AD_PARAMS) {
      const value = url.searchParams.get(key);
      if (value) attribution[key] = value.slice(0, 200);
    }
    page = (url.pathname + url.search).slice(0, 300);
  } catch {
    // No or malformed Referer: cookies only.
  }

  const cookies = {};
  for (const part of String(cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) cookies[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  if (cookies._gcl_aw) attribution.gcl_aw = cookies._gcl_aw.slice(0, 200);
  if (cookies._gcl_gb) attribution.gcl_gb = cookies._gcl_gb.slice(0, 200);
  if (cookies._fbc) attribution.fbc = cookies._fbc.slice(0, 200);
  if (page) attribution.page = page;

  return { page, attribution };
}

function crmTarget(config) {
  const url = String(config.CRM_INGEST_URL || '').trim();
  const token = String(config.CRM_INGEST_TOKEN || '').trim();
  return url && token ? { url, token } : null;
}

function newId() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  // Node 18 has no global crypto. The id only has to be unique for this site.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

// Trimmed text, cut to `max` characters. '' when missing.
function clip(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

/**
 * Store the lead in the CPS dashboard: POST CRM_INGEST_URL with
 * `Authorization: Bearer CRM_INGEST_TOKEN`. `meta` is leadMeta()'s result and
 * is optional. Returns { ok, error? } — never throws. Logs only the lead's id
 * and the status or error, never the token or the customer's details.
 */
export async function pushToCrm(body, config, meta) {
  const crm = crmTarget(config || {});
  if (!crm) return { ok: false, error: 'not configured' };

  const id = newId();
  try {
    const email = clip(body.email, 254);
    const lead = {
      site: 'home_inspection',
      external_id: id,
      name: clip(body.name, 200),
      phone: clip(body.phone, 40),
      // An address the dashboard would refuse could get the whole lead
      // rejected, so leave it out; the email still shows it.
      email: CRM_EMAIL_RE.test(email) ? email : '',
      zip: clip(body['Property ZIP'], 100),
      service: clip(body['Repair Type'], 120),
      message: clip(body.message, 4000),
      source: clip(body['Lead Source'], 200),
      page: clip(meta && meta.page, 300),
      submitted_at: new Date().toISOString(),
    };
    for (const key of Object.keys(lead)) if (!lead[key]) delete lead[key];

    const attribution = {};
    for (const [key, value] of Object.entries((meta && meta.attribution) || {})) {
      const text = clip(value, 200);
      if (text) attribution[key] = text;
    }
    if (Object.keys(attribution).length) lead.attribution = attribution;

    const response = await fetch(crm.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${crm.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(CRM_TIMEOUT_MS),
    });
    // Require an explicit { ok: true }. A 200 HTML page (wrong URL, a login
    // screen) must not count as a stored lead.
    const reply = await response.json().catch(() => null);
    if (!response.ok || !reply || reply.ok !== true) {
      const error = `HTTP ${response.status}${response.ok ? ' without { ok: true }' : ''}`;
      console.error('CRM push failed', id, error);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (err) {
    // Node's fetch echoes a malformed header value (the token) in its error text.
    const error = String(err).split(crm.token).join('[token]');
    console.error('CRM push failed', id, error);
    return { ok: false, error };
  }
}

/** Email the lead through Resend. Resolves true once Resend accepts it — never throws. */
async function sendEmail(body, config, { apiKey, to, from }) {
  const name = String(body.name || '').trim();
  const content = buildEmail(body, config);
  const payload = {
    from,
    to,
    subject: `${String(config.LEAD_SUBJECT || 'New Repair Estimate Request')} — ${name}`,
    html: content.html,
    text: content.text,
  };
  const bcc = list(config.LEAD_BCC);
  if (bcc.length) payload.bcc = bcc;
  const replyTo = String(body.email || '').trim();
  if (EMAIL_RE.test(replyTo)) payload.reply_to = replyTo;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error('Resend error', response.status, await response.text());
      return false;
    }
  } catch (err) {
    console.error('Resend request failed', err);
    return false;
  }
  return true;
}

/**
 * Validate the submission, then email it through Resend and store it in the
 * dashboard, side by side, for whichever of the two are configured. The visitor
 * sees success when either one has the lead.
 * `meta` (optional) is leadMeta()'s { page, attribution }, used by the dashboard only.
 * Returns { status, success, message } — never throws.
 */
export async function processLead(body, config, meta) {
  // Honeypot: report success so bots stop retrying, but send nothing.
  if (String(body.botcheck || '').trim()) {
    return { status: 200, success: true };
  }

  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  if (!name || phone.replace(/\D/g, '').length < 10) {
    return { status: 400, success: false, message: 'Please include your name and a valid phone number.' };
  }

  const apiKey = String(config.RESEND_API_KEY || '').trim();
  const to = list(config.LEAD_TO);
  const from = String(config.LEAD_FROM || '').trim();
  const emailReady = Boolean(apiKey && to.length && from);
  if (!emailReady) {
    const missing = [!apiKey && 'RESEND_API_KEY', !to.length && 'LEAD_TO', !from && 'LEAD_FROM']
      .filter(Boolean)
      .join(', ');
    console.error('Lead form misconfigured. Missing:', missing);
  }

  const crmReady = Boolean(crmTarget(config));
  if (!crmReady && (config.CRM_INGEST_URL || config.CRM_INGEST_TOKEN)) {
    console.debug('Dashboard hand-off is off: set both CRM_INGEST_URL and CRM_INGEST_TOKEN.');
  }

  if (!emailReady && !crmReady) {
    return {
      status: 503,
      success: false,
      message: `Online form is being set up. Please call us at ${PHONE_DISPLAY}.`,
    };
  }

  const [emailed, stored] = await Promise.all([
    emailReady ? sendEmail(body, config, { apiKey, to, from }) : false,
    crmReady ? pushToCrm(body, config, meta) : { ok: false },
  ]);
  if (!emailed && !stored.ok) {
    return { status: 502, success: false, message: `We could not send your request. Please call ${PHONE_DISPLAY}.` };
  }

  return { status: 200, success: true };
}

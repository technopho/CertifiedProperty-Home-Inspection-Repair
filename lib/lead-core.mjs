/**
 * Shared lead-handling logic, used by both hosts:
 *   Cloudflare Worker  -> worker.js      (config from `env`)
 *   Vercel function    -> api/lead.mjs   (config from process.env)
 *
 * LEAD_PAGE names the source page in the email heading, so leads from
 * several landing pages are distinguishable at a glance.
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
 * Validate the submission and, when configured, email it through Resend.
 * Returns { status, success, message } — never throws.
 */
export async function processLead(body, config) {
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
  if (!apiKey || !to.length || !from) {
    const missing = [!apiKey && 'RESEND_API_KEY', !to.length && 'LEAD_TO', !from && 'LEAD_FROM']
      .filter(Boolean)
      .join(', ');
    console.error('Lead form misconfigured. Missing:', missing);
    return {
      status: 503,
      success: false,
      message: `Online form is being set up. Please call us at ${PHONE_DISPLAY}.`,
    };
  }

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
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(replyTo)) payload.reply_to = replyTo;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error('Resend error', response.status, await response.text());
      return { status: 502, success: false, message: `We could not send your request. Please call ${PHONE_DISPLAY}.` };
    }
  } catch (err) {
    console.error('Resend request failed', err);
    return { status: 502, success: false, message: `We could not send your request. Please call ${PHONE_DISPLAY}.` };
  }

  return { status: 200, success: true };
}

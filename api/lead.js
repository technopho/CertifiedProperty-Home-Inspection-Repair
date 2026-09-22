/**
 * Lead form handler — sends the enquiry by email through Resend.
 *
 * Required environment variables (set in Vercel → Settings → Environment Variables):
 *   RESEND_API_KEY  Your Resend API key (re_...). Server-side only, never exposed.
 *   LEAD_TO         Where leads are delivered. Comma-separate for several recipients,
 *                   e.g. "njeliteco@gmail.com, leads@technopho.com"
 *   LEAD_FROM       Verified Resend sender, e.g. "Website Leads <leads@yourdomain.com>"
 *
 * Optional:
 *   LEAD_BCC        Silent copy, comma-separated.
 *   LEAD_SUBJECT    Subject prefix (default: "New Repair Estimate Request").
 *
 * Accepts JSON (from the page's fetch) and urlencoded (no-JS form post).
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

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function list(value) {
  return String(value || '')
    .split(',')
    .map(function (item) { return item.trim(); })
    .filter(Boolean);
}

function buildEmail(body) {
  const rows = FIELDS
    .filter(function (pair) { return String(body[pair[0]] || '').trim(); })
    .map(function (pair) {
      const label = pair[1];
      const raw = String(body[pair[0]]).trim();
      let value = esc(raw);
      if (pair[0] === 'phone') value = '<a href="tel:' + esc(raw.replace(/[^\d+]/g, '')) + '" style="color:#C94A00;text-decoration:none">' + value + '</a>';
      if (pair[0] === 'email') value = '<a href="mailto:' + value + '" style="color:#C94A00;text-decoration:none">' + value + '</a>';
      if (pair[0] === 'message') value = value.replace(/\n/g, '<br>');
      return (
        '<tr>' +
        '<td style="padding:10px 0;border-bottom:1px solid #E2DDD7;color:#69625A;font-size:13px;width:150px;vertical-align:top">' + esc(label) + '</td>' +
        '<td style="padding:10px 0;border-bottom:1px solid #E2DDD7;color:#1A1511;font-size:15px;font-weight:600;vertical-align:top">' + value + '</td>' +
        '</tr>'
      );
    })
    .join('');

  const html =
    '<div style="background:#FCFAF6;padding:28px 16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif">' +
      '<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E2DDD7;border-radius:12px;overflow:hidden">' +
        '<div style="background:#18120F;padding:20px 28px">' +
          '<div style="color:#fff;font-size:17px;font-weight:700;letter-spacing:-.01em">New repair estimate request</div>' +
          '<div style="color:#ABA39B;font-size:13px;margin-top:4px">Certified Property Services LLC &middot; homeinspection.certifiedpropertyservicesllc.com</div>' +
        '</div>' +
        '<div style="padding:8px 28px 24px">' +
          '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">' + rows + '</table>' +
          '<p style="margin:22px 0 0;color:#69625A;font-size:13px;line-height:1.6">Reply to this email to reach the customer directly, or call the number above.</p>' +
        '</div>' +
      '</div>' +
    '</div>';

  const text = FIELDS
    .filter(function (pair) { return String(body[pair[0]] || '').trim(); })
    .map(function (pair) { return pair[1] + ': ' + String(body[pair[0]]).trim(); })
    .join('\n');

  return { html: html, text: text };
}

module.exports = async function handler(req, res) {
  const wantsJson = String(req.headers['content-type'] || '').indexOf('application/json') !== -1;
  const done = function (status, payload, redirect) {
    if (wantsJson) return res.status(status).json(payload);
    if (redirect) { res.writeHead(303, { Location: redirect }); return res.end(); }
    return res.status(status).send(payload.message || 'Error');
  };

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return done(405, { success: false, message: 'Method not allowed' });
  }

  const body = (req.body && typeof req.body === 'object') ? req.body : {};

  // Honeypot: silently accept so bots believe they succeeded.
  if (String(body.botcheck || '').trim()) {
    return done(200, { success: true }, '/thanks.html');
  }

  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  if (!name || phone.replace(/\D/g, '').length < 10) {
    return done(400, { success: false, message: 'Please include your name and a valid phone number.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = list(process.env.LEAD_TO);
  const from = String(process.env.LEAD_FROM || '').trim();
  if (!apiKey || !to.length || !from) {
    console.error('Lead form misconfigured. Missing:', [
      !apiKey && 'RESEND_API_KEY', !to.length && 'LEAD_TO', !from && 'LEAD_FROM',
    ].filter(Boolean).join(', '));
    return done(503, { success: false, message: 'Online form is being set up. Please call us at (856) 516-1347.' });
  }

  const content = buildEmail(body);
  const payload = {
    from: from,
    to: to,
    subject: (process.env.LEAD_SUBJECT || 'New Repair Estimate Request') + ' — ' + name,
    html: content.html,
    text: content.text,
  };
  const bcc = list(process.env.LEAD_BCC);
  if (bcc.length) payload.bcc = bcc;
  const replyTo = String(body.email || '').trim();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(replyTo)) payload.reply_to = replyTo;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error('Resend error', response.status, detail);
      return done(502, { success: false, message: 'We could not send your request. Please call (856) 516-1347.' });
    }
  } catch (err) {
    console.error('Resend request failed', err);
    return done(502, { success: false, message: 'We could not send your request. Please call (856) 516-1347.' });
  }

  return done(200, { success: true }, '/thanks.html');
};

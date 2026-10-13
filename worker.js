/**
 * Cloudflare Worker entry point.
 *
 * Serves the static site from the ASSETS binding and handles the lead form
 * at POST /api/lead. Because this Worker has a script (not assets only),
 * Cloudflare allows runtime variables and secrets:
 *
 *   Secret:    RESEND_API_KEY
 *   Variables: LEAD_TO, LEAD_FROM   (optional: LEAD_BCC, LEAD_SUBJECT)
 *
 * Optional, to also store every lead in the CPS dashboard (both Secrets, the
 * URL too, so a deploy never wipes it; nothing changes until both are set):
 *   Secrets:   CRM_INGEST_URL, CRM_INGEST_TOKEN
 *
 * Set them in Workers & Pages -> the Worker -> Settings -> Variables and Secrets,
 * or with: npx wrangler secret put RESEND_API_KEY
 */

import { leadMeta, processLead } from './lib/lead-core.mjs';

async function readBody(request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    return { body: await request.json().catch(() => ({})), wantsJson: true };
  }
  const form = await request.formData().catch(() => null);
  const body = {};
  if (form) for (const [key, value] of form.entries()) body[key] = value;
  return { body, wantsJson: false };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/lead') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
      }

      const { body, wantsJson } = await readBody(request);
      // Ad attribution (Referer params + ad cookies) for the dashboard.
      const meta = leadMeta(request.headers.get('referer'), request.headers.get('cookie'));
      const result = await processLead(body, env, meta);

      if (wantsJson) {
        return Response.json(
          result.success ? { success: true } : { success: false, message: result.message },
          { status: result.status },
        );
      }
      // No-JavaScript form post: redirect to the thank-you page on success.
      if (result.success) {
        return Response.redirect(new URL('/thanks.html', url).toString(), 303);
      }
      return new Response(result.message, { status: result.status });
    }

    return env.ASSETS.fetch(request);
  },
};

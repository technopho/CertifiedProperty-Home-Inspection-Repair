/**
 * Vercel serverless function for the lead form.
 * Shares all logic with the Cloudflare Worker via lib/lead-core.mjs.
 *
 * Environment variables (Vercel -> Settings -> Environment Variables):
 *   RESEND_API_KEY, LEAD_TO, LEAD_FROM   (optional: LEAD_BCC, LEAD_SUBJECT)
 *   optional, to also store every lead in the CPS dashboard: CRM_INGEST_URL, CRM_INGEST_TOKEN
 */

import { leadMeta, processLead } from '../lib/lead-core.mjs';

export default async function handler(req, res) {
  const wantsJson = String(req.headers['content-type'] || '').includes('application/json');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return wantsJson
      ? res.status(405).json({ success: false, message: 'Method not allowed' })
      : res.status(405).send('Method not allowed');
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const meta = leadMeta(req.headers.referer, req.headers.cookie);
  const result = await processLead(body, process.env, meta);

  if (wantsJson) {
    return res
      .status(result.status)
      .json(result.success ? { success: true } : { success: false, message: result.message });
  }
  // No-JavaScript form post: redirect to the thank-you page on success.
  if (result.success) {
    res.writeHead(303, { Location: '/thanks.html' });
    return res.end();
  }
  return res.status(result.status).send(result.message);
}

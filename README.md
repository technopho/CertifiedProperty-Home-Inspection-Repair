# Home Inspection Repairs — Landing Page (v2)
**Client:** Certified Property Services LLC · Woodbury Heights, NJ · (856) 516-1347
**Built by:** TechnoPHO LLC

High-converting Google Ads landing page for home inspection repair services in
South Jersey & the tri-state area. UI matches the approved design direction
(charcoal ink + burnt orange + cream, Archivo/Barlow) — rebuilt as pure static
HTML for maximum speed and SEO.

## Tech stack (and why)

**Pure static HTML + inline CSS + vanilla JS. No framework, no build step.**

- **Speed:** ~180 KB critical render path, self-hosted fonts (Archivo variable +
  Barlow, ~82 KB total), WebP images lazy-loaded below the fold, zero
  third-party requests until the Google tag is enabled. Lighthouse 95–100 —
  which feeds straight into Google Ads Quality Score and lower CPC.
- **SEO:** semantic HTML5, exact-length title/description, `GeneralContractor`
  JSON-LD with **verified** rating, hours and geo data, `FAQPage` JSON-LD (11
  Q&As), robots.txt + sitemap.xml, keyword coverage: repair addendum, punch
  list, lender-required (FHA/VA) repairs, pre-listing repairs, re-inspection
  documentation, township CO items.
- **Hosting:** deploy the folder as-is — see Deployment below.

## Files

| File | Purpose |
|---|---|
| `index.html` | The landing page (2 lead forms: hero + bottom) |
| `lib/lead-core.mjs` | Shared form logic: validation, email building, Resend send |
| `worker.js` + `wrangler.toml` | Cloudflare Worker: serves the site, handles `/api/lead` |
| `api/lead.mjs` | Vercel serverless function for the same endpoint |
| `.assetsignore` | Keeps source files and secrets out of the public asset bundle |
| `thanks.html` | Post-submit page — Google Ads form conversion fires here |
| `privacy.html` | Privacy policy (required by Google Ads destination rules) |
| `assets/img/` | Optimized WebP images (see provenance below) |
| `assets/fonts/` | Self-hosted Archivo (variable) + Barlow (400/500/600) |
| `robots.txt`, `sitemap.xml` | SEO plumbing — update domain before launch |

## Verified data used on the page (researched 2026-09-02)

- **Google Business Profile:** 4.9 stars, 18 reviews (17×5★, 1×4★), hours
  Mon–Sat 8 AM–8 PM (in schema), exact geo 39.8081, -75.1467. Categories:
  Contractor, Concrete, Drainage, Fence, General contractor.
- **Networx:** 5.0 displayed, 63 verified reviews (53×5★, 8×4★, 2×3★).
- **"70 5-star client reviews"** = 53 Networx + 17 Google five-star reviews.
- **Testimonials** are verbatim real reviews: Stefano O. (Google — deck work
  that "helped me pass my inspection"), Al M. (Google/Networx — drainage),
  Kisha M. (Google — patio/fence craftsmanship).
- **"Fully insured"** appears on the client's own Facebook marketing flyers;
  "12+ years / 500+ projects / 99%" are the client's own site claims.
- **Service area**: client confirmed they do NOT serve Philadelphia — copy says "South Jersey & the tri-state area". (A Networx review exists from
  Upper Darby, PA, but per the client philly jobs are declined.)

### Image provenance

- `fb-deck.webp`, `fb-drainage.webp` — **real job photos** from the client's
  Facebook page (deck restoration; underground downspout routing).
- `work-porch-yard.webp` — **real before/after** from the client's site gallery.
- `hero-inspector.webp`, `og-image.jpg` — illustrative image from the approved
  design reference (used as a dark atmospheric backdrop, not presented as the
  client's own work).
- `tech-approved.webp` — stock trade photo already used on the client's site.
- `logo-crest-white.png` — client's crest, background removed.

## 🚫 Launch blockers (do these before spending ad money)

1. ~~**NJ HIC number**~~ — **DONE**: `NJ HIC #13VH13784400 · Licensed & Fully
   Insured` is displayed in the footer, satisfying N.J.A.C. 13:45A-16.2 for
   contractor advertising. (Client-supplied; not published on any of their
   own profiles.)
2. **Form backend — Resend config.** ✅ *Done on Cloudflare.* Both forms post
   to `/api/lead`, handled by `worker.js` on Cloudflare (or `api/lead.mjs` on
   Vercel), which emails the lead through [Resend](https://resend.com).
   `RESEND_API_KEY` is a Cloudflare **Secret**; `LEAD_TO` / `LEAD_FROM` /
   `LEAD_PAGE` live in `wrangler.toml` under `[vars]` (see Deployment for why).
   On Vercel these are all Environment Variables instead:

   | Variable | Example | Notes |
   |---|---|---|
   | `RESEND_API_KEY` | `re_xxxxxxxx` | From resend.com → API Keys. Server-side only. |
   | `LEAD_TO` | `njeliteco@gmail.com, leads@technopho.com` | Where leads go. Comma-separate for several. |
   | `LEAD_FROM` | `Website Leads <leads@yourdomain.com>` | Must be a **verified domain** in Resend. |
   | `LEAD_PAGE` | `Home Inspection Repairs Landing Page` | Heading in the lead email, so leads from different landing pages are distinguishable. Defaults to this value. |
   | `LEAD_BCC` | `archive@technopho.com` | Optional silent copy. |
   | `LEAD_SUBJECT` | `New Repair Estimate Request` | Optional prefix; the lead's name is appended. |

   Verify a sending domain in Resend first (Domains → Add → DNS records).
   Until the vars are set the form shows a friendly "call us" message.
   Redeploy after adding or changing any variable — they are read at runtime.

   Each lead email is a branded summary with a readable "Lead Source" line —
   "Google Ads (campaign name)" for ad clicks, "Website" otherwise — and
   `Reply-To` set to the customer, so replying reaches them directly.
3. **Google Ads conversions — the GTM container is EMPTY. Nothing reaches
   Google Ads until you build the tags inside it.**

   > 🚨 Verified by fetching `gtm.js?id=GTM-MWLGQFCL`: `"tags":[]`,
   > `"predicates":[]`, and no `AW-` id anywhere in the container. The page
   > pushes its events correctly, but they land nowhere. Point ads at this
   > build and every click is billed while Ads records **zero** conversions —
   > and because the old `AW-18263829709` site tag was removed, the `_gcl_aw`
   > attribution cookie and remarketing collection are gone too. Build these
   > three tags in GTM first, then confirm with GTM Preview that a real submit
   > sends a request to `googleads.g.doubleclick.net`:
   >
   > 1. **Google Tag / Conversion Linker** for `AW-18263829709`, trigger All Pages.
   > 2. **Google Ads Conversion Tracking** — Form lead label, trigger Custom
   >    Event `generate_lead`, enhanced conversions mapped to `user_phone` /
   >    `user_email`, Transaction ID set to `transaction_id`.
   > 3. **Google Ads Conversion Tracking** — Phone clicks label, trigger Custom
   >    Event `phone_click`.

   Container **GTM-MWLGQFCL** is live on index, thanks and privacy. The pages
   push these events to `dataLayer`; build the Google Ads conversion tags in
   GTM triggered on them:

   | Event | Fired when | Useful variables |
   |---|---|---|
   | `generate_lead` | form submitted successfully, on the landing page | `lead_service`, `user_phone` (E.164), `user_email` (lowercased), `transaction_id` |
   | `phone_click` | any tap-to-call link, on the landing and thank-you pages | `link_url` |
   | `sms_click` | the "text the report" link on the thank-you page | `link_url` |

   Set the Google Ads tag's **Transaction ID** to `transaction_id` so a repeat
   submission of the same lead is de-duplicated. Turn on **enhanced conversions
   for leads** and map `user_phone` / `user_email` (the privacy policy discloses
   this sharing — keep that in place).

   > ⚠️ **Never add a conversion trigger to thanks.html.** The lead conversion
   > already fires on the landing page at submit-success, which is what makes
   > the customer's phone and email available for enhanced conversions. A tag on
   > the thank-you page would count every lead twice.

   Known gap: a visitor with JavaScript disabled submits via a native form post,
   so the lead is emailed but no `generate_lead` fires. Volume is negligible.

4. ~~Final URL~~ — **DONE**: canonical, OG, schema, sitemap and robots all
   point to https://homeinspection.certifiedpropertyservicesllc.com/.
   Submit `sitemap.xml` in Google Search Console once the domain resolves.

## ⚠️ Confirm with the client

- **Workmanship warranty** (trust strip + checklist) — from the approved
  design draft; confirm the client actually offers one.
- **Repair scope:** roofing, structural, interior punch-list and insurance
  claim work are advertised (their FB cover lists "REO/Construction ·
  Inspection Repair · Remodeling") — confirm all trades are taken.
- **aggregateRating in schema** uses the live Google values (4.9/18). Keep it
  updated, or remove it if the client prefers not to maintain it.
- **Hours** in schema are from their Google profile (Mon–Sat 8–8); their
  Facebook says "Always open" — confirm which is right.

## Deployment

The page is static, but the lead form needs a server endpoint (`/api/lead`),
so the host must run code as well as serve files. Both options below do that
from this same repo, with no build step.

### Cloudflare Workers (current)

`wrangler.toml` defines a Worker (`worker.js`) that serves the site from the
assets binding and handles `POST /api/lead`. This is what makes runtime
variables possible: a Worker with **only** static assets cannot have variables
or secrets, which is why the dashboard greys those panels out.

1. Push to GitHub. If Workers Builds is connected, it redeploys automatically;
   otherwise run `npx wrangler deploy`.
2. **Where each setting lives — do not mix the two.**

   | Setting | Where | Why |
   |---|---|---|
   | `RESEND_API_KEY` | **Secret** only (`npx wrangler secret put RESEND_API_KEY`, or dashboard → type Secret) | It is a credential. Secrets are stored encrypted and survive every deploy. |
   | `LEAD_TO`, `LEAD_FROM`, `LEAD_PAGE` | **`[vars]` in `wrangler.toml`** | Every deploy runs `wrangler deploy`, which makes `wrangler.toml` the source of truth for plain-text vars and **deletes any that exist only in the dashboard**. Keeping them in the file is what stops the form breaking after each push. |

   > ⚠️ **A name must never exist as both a Secret and a `[vars]` entry.** The
   > duplicate binding either fails the deploy or silently resolves to one of
   > them, so leads quietly keep going to the old address. To change where
   > leads go: edit `wrangler.toml`, commit, push.

   > 🔓 These vars put the lead inbox and sending address in this repo. The
   > repo is public — consider making it private (GitHub → Settings → General
   > → Change visibility), which is appropriate for client work anyway.

3. Redeploy after changing anything above.
4. Custom domain: Worker → Settings → Domains & Routes → Add custom domain →
   `homeinspectionrepairs.certifiedpropertyservicesllc.com`. Cloudflare creates
   the DNS record and certificate automatically.

Local development:

```bash
npx wrangler dev --persist-to /tmp/wstate    # http://127.0.0.1:8788
```

Put test values in `.dev.vars` (gitignored, and excluded from asset upload).
The `--persist-to` flag keeps Wrangler's state out of the asset directory;
without it the file watcher reload-loops, because assets are served from `./`.

### Vercel (also supported)

`api/lead.mjs` is the same endpoint for Vercel, sharing `lib/lead-core.mjs`.
Framework preset **Other**, empty build command, output `./`. Set the same
environment variables under Settings → Environment Variables.

> **Pick one canonical host.** Running both means the same page answers on two
> URLs, which splits SEO signals. The `canonical`, `og:url`, schema and
> `sitemap.xml` currently all point at
> `https://homeinspection.certifiedpropertyservicesllc.com/`. If Cloudflare
> becomes the live host, update those to the Cloudflare domain and redirect the
> old one.

**GitHub:** repo initialized locally with remote
`git@github.com:technopho/CertifiedProperty-Home-Inspection-Repair.git` (SSH, authenticates
as `technopho` on this Mac). Create the empty repo under the technopho account
(no README/gitignore), then `git push -u origin main`.

## Local preview

```bash
npx --yes http-server -p 8741 -c-1 .
```

Then open http://127.0.0.1:8741

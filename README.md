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
| `api/lead.js` | Serverless function: validates the form, emails via Resend |
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

1. **NJ HIC number.** NJ law (N.J.A.C. 13:45A-16.2) requires the Home
   Improvement Contractor registration number in contractor advertising. It is
   NOT published on any of the client's profiles (checked). Get the `13VH…`
   number and uncomment the prepared line in the footer of `index.html`.
2. **Form backend — Resend env vars.** Both forms post to `/api/lead`
   (a Vercel serverless function) which emails the lead through
   [Resend](https://resend.com). In **Vercel → Settings → Environment
   Variables**, add for all environments:

   | Variable | Example | Notes |
   |---|---|---|
   | `RESEND_API_KEY` | `re_xxxxxxxx` | From resend.com → API Keys. Server-side only. |
   | `LEAD_TO` | `njeliteco@gmail.com, leads@technopho.com` | Where leads go. Comma-separate for several. |
   | `LEAD_FROM` | `Website Leads <leads@yourdomain.com>` | Must be a **verified domain** in Resend. |
   | `LEAD_BCC` | `archive@technopho.com` | Optional silent copy. |
   | `LEAD_SUBJECT` | `New Repair Estimate Request` | Optional prefix; the lead's name is appended. |

   Verify a sending domain in Resend first (Domains → Add → DNS records).
   Until the vars are set the form shows a friendly "call us" message.
   Redeploy after adding or changing any variable — they are read at runtime.

   Each lead email is a branded summary with a readable "Lead Source" line —
   "Google Ads (campaign name)" for ad clicks, "Website" otherwise — and
   `Reply-To` set to the customer, so replying reaches them directly.
3. **Google Ads conversions — BOTH actions.** Create **Form lead** (fires on
   `thanks.html`) and **Phone click** conversion actions; replace
   `AW-XXXXXXXXXX` + labels in `index.html` and `thanks.html` and uncomment
   the gtag blocks (phone-click listener is already written).
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

## Deployment — recommendation: **Vercel** (or Cloudflare Pages)

Vercel is what this project uses: free, global CDN, auto-SSL, and it runs
`api/lead.js` as a serverless function alongside the static page with zero
config. A pure static host would work for the page but could not run the
form endpoint.

**Vercel steps:**
1. Push this repo to GitHub (see below).
2. vercel.com → Add New → Project → Import the GitHub repo.
3. Framework preset: **Other**. Build command: *(empty)*. Output dir: `./`.
4. Deploy → add the custom domain, e.g. `repairs.certifiedpropertyservicesllc.com`
   (CNAME to `cname.vercel-dns.com`), or run it on the main domain as a
   subdirectory via their WordPress host instead.
5. After the domain is live, update the canonical/OG/sitemap URLs (blocker #4)
   and submit `sitemap.xml` in Google Search Console.

**GitHub:** repo initialized locally with remote
`git@github.com:technopho/CertifiedProperty-Home-Inspection-Repair.git` (SSH, authenticates
as `technopho` on this Mac). Create the empty repo under the technopho account
(no README/gitignore), then `git push -u origin main`.

## Local preview

```bash
npx --yes http-server -p 8741 -c-1 .
```

Then open http://127.0.0.1:8741

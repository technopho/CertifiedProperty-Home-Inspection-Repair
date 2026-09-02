# Home Inspection Repairs — Landing Page
**Client:** Certified Property Services LLC · Woodbury Heights, NJ · (856) 516-1347
**Built by:** TechnoPHO LLC

A single-purpose, high-converting landing page for Google Ads traffic targeting
home inspection repair services in South Jersey.

## Tech stack (and why)

**Pure static HTML + inline CSS + vanilla JS. No framework, no build step.**

- **Speed:** ~130 KB critical render path (HTML + one self-hosted font + logo).
  All photos are WebP, lazy-loaded, below the fold. Zero third-party requests
  until the Google tag is enabled. Scores 95–100 on Lighthouse out of the box,
  which directly improves Google Ads Quality Score and lowers CPC.
- **SEO:** Semantic HTML5, full meta/OG tags, `GeneralContractor` + `FAQPage`
  JSON-LD, robots.txt, sitemap.xml, and keyword-targeted copy: repair addendum,
  punch list, lender-required (FHA/VA) repairs, pre-listing repairs, township
  CO / resale inspection, re-inspection documentation, NJ fire certificate.
- **Hosting:** deploy the folder as-is to Netlify, Vercel, Cloudflare Pages,
  or a subdirectory of the existing WordPress site.

## Files

| File | Purpose |
|---|---|
| `index.html` | The landing page (all CSS/JS inline) |
| `thanks.html` | Post-submit page — Google Ads form conversion fires here |
| `privacy.html` | Privacy policy (required by Google Ads destination rules) |
| `assets/img/` | Optimized WebP images from the client's own site |
| `assets/fonts/` | Self-hosted Manrope variable font (24 KB) |
| `robots.txt`, `sitemap.xml` | SEO plumbing — update domain before launch |

## 🚫 Launch blockers (do these before spending ad money)

1. **NJ HIC number.** NJ law (N.J.A.C. 13:45A-16.2) requires the Home
   Improvement Contractor registration number in contractor advertising.
   Get the client's `13VH…` number and uncomment the prepared line in the
   footer bar of `index.html`. If they can't produce it, soften the
   "Licensed" claims before launch.
2. **Form backend (2 minutes).** Create a free access key at
   [web3forms.com](https://web3forms.com) (use the inbox that should receive
   leads — confirm with the client; their published address is
   `njeliteco@gmail.com`) and paste it into the hidden
   `<input name="access_key" id="f-access">` inside the form. The form posts
   natively even without JS once the key is set. Until configured, the form
   politely tells visitors to call instead.
   - Leads arrive with `gclid`, `utm_source`, `utm_campaign` auto-attached.
3. **Google Ads conversion tracking — BOTH actions.**
   - Create **Form lead** (fires on `thanks.html`) and **Phone click**
     conversion actions.
   - Replace `AW-XXXXXXXXXX` (+ labels) in `index.html` and `thanks.html`
     and uncomment the gtag blocks. The phone-click listener is already
     written into the commented block in `index.html`. Calls will likely be
     the majority conversion for this service — do not launch form-only.
4. **Final URL.** Update `canonical`, `og:url`, `og:image`, and the schema
   `url`/`image`/`logo` in `index.html`, plus `sitemap.xml` and `robots.txt`.

## ⚠️ Confirm with the client

- **Repair scope:** electrical, plumbing, roofing items are shown (matches
  their site's imagery and "one-stop solution" copy) — confirm they take
  these trades directly or via licensed subs. Same for **lender-required
  (FHA/VA) repairs** and **township CO/resale inspection repairs**.
- **Service area:** Burlington County towns (Marlton, Moorestown, Mount
  Laurel) are listed; reviews confirm work in Gloucester, Camden and
  Burlington (Maple Shade) counties, but confirm the radius.
- **24-hour quotes:** every mention is hedged ("typically") — if the client
  will commit to a hard 24-hour SLA, the copy can be strengthened.
- **Business hours:** not published anywhere; if available, add them to the
  NAP card and as `openingHoursSpecification` in the JSON-LD.
- **Stats used:** "5.0 Networx (63 reviews)" verified real; "5.0 Google"
  shown without a count (real count is ~17 — the site's "6.8k" badge is
  wrong and deliberately not used). "500+ projects / 12+ years" are the
  client's own homepage claims.
- **Testimonials:** verbatim 5-star Networx reviews (Al/Woodbury,
  Harry/Magnolia, Julie/Sewell). Diff against
  networx.com/c.certified-property-services-llc before launch if you want
  word-for-word certainty.

## SEO notes

- **Subdirectory deploys:** robots.txt only works at the domain root — see
  the note inside the file. Submit `sitemap.xml` in Search Console either way.
- **Internal links matter:** add a link to this page from the WordPress
  site's Services menu with anchor text "Home Inspection Repairs" (not
  "click here"). An orphan page will not rank on content alone.
- **FAQ schema:** valid and useful for content understanding, but since
  Google's 2023 change FAQ rich results only display for government/health
  sites — don't promise the client FAQ snippets in SERPs.

## Google Ads tips

- **Message match:** ad headlines like "Home Inspection Repairs — Fast" /
  "Fix Your Inspection List Before Closing" mirror the H1.
- Keyword themes on the page: *home inspection repair contractor, fix
  inspection report items, repair addendum contractor, punch list repairs,
  lender-required repairs, pre-listing repairs NJ, CO inspection repairs*.
- Enable **call extensions** with (856) 516-1347 — the page has a sticky
  mobile call bar to match.
- Send traffic with UTM tags; the form captures them automatically.

## Local preview

```bash
npx --yes http-server -p 8741 -c-1 .
```

Then open http://127.0.0.1:8741

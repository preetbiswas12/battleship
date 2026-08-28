# Battleships Online

A free browser Battleships game vs a random-firing AI, built as plain HTML/CSS/JS
(static site — no build step, no dependencies). Structured to meet Google AdSense
site-approval requirements.

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Home — original intro content, features, CTA |
| `game.html` | The playable game (10×10 grid vs AI using `Math.random()`) |
| `how-to-play.html` | Rules + strategy guide (original long-form content) |
| `about.html` | About us |
| `contact.html` | Contact form (mailto fallback) |
| `privacy-policy.html` | Privacy Policy incl. Google AdSense cookie disclosure |
| `terms-and-conditions.html` | Terms & Conditions |

Shared assets: `css/style.css`, `js/game.js` (engine + UI), `js/main.js` (nav/year),
`favicon.svg`, `robots.txt`, `sitemap.xml`.

## Run it locally

Just open `index.html` in a browser, or serve the folder:

```
python -m http.server 8000
# then visit http://localhost:8000
```

## Verify game logic

```
node tests/test.js
```

Runs self-checks on fleet placement validity (no overlap, in bounds, contiguous),
randomness, hit/miss/sunk handling, win detection, and coordinate labels.

## Before you publish — REQUIRED edits

1. **Verify the contact email** `quide04@gmail.com` is a mailbox you check. It
   appears in: `contact.html` (form action, hint text, JS), and links in
   `privacy-policy.html` and `terms-and-conditions.html`.
2. **Replace `www.YOURDOMAIN.com`** in `sitemap.xml` with your real domain, then
   uncomment/add the `Sitemap:` line in `robots.txt`.
3. **Terms §11 (Governing Law):** replace "the jurisdiction in which the Site operator
   resides" with your actual country/state.
4. **Rename the brand** if you don't want "Battleships Online" (search-and-replace across
   all HTML files).
5. **Set your publisher ID in `ads.txt`** — replace `pub-0000000000000000` with the ID
   from AdSense → Account → Settings. Ads will not serve until this file is correct.

## After your domain is live

6. Deploy (GitHub Pages / Netlify / Cloudflare Pages are free and fine for AdSense).
   HTTPS is effectively expected by reviewers.
7. Submit the site to **Google Search Console**, request indexing of all 7 pages, and
   submit the sitemap URL (`https://YOURDOMAIN.com/sitemap.xml`) under Sitemaps.
8. Verify `https://YOURDOMAIN.com/ads.txt` loads in a browser before enabling ads.
9. Only then apply at https://adsense.google.com — approval usually takes days to ~2 weeks.

## Adding ads once approved

Search for `AD SLOT` comments in the HTML files — four prepared slots exist:
home, game, how-to-play, about. Paste each ad unit's code inside those comments'
location. Placement rules already respected:

- No ads on empty/non-content pages (policy: no ad-only pages).
- No ads inside or immediately around the game board area (avoids accidental clicks,
  which is an invalid-traffic risk).
- No labels other than "Advertisement"/"Sponsored Links".

## Do NOT do these after launch (account killers)

- Don't click your own ads or ask friends/family to.
- Don't buy traffic from click exchanges or PTC sites.
- Don't add more scraped/copied content — everything here is original; keep it that way.

## Custom domain note

AdSense approves faster with a real top-level domain (e.g. `.com`) rather than a free
subdomain like `yoursite.netlify.app`. A custom domain (~$10/yr) is worth it.

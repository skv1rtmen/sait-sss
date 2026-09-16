# baustern.ch website migration — 2026-09-14

User expressly authorized replacing the old website, preserving email.

## Rollback records (read in GoDaddy before any changes)

| Type | Host | Original data | TTL |
|---|---|---|---|
| A | @ | 216.198.79.1 | 3600 |
| CNAME | www | e586b4c177c0f234.vercel-dns-017.com. | 3600 |

GoDaddy shows 20 records. Name servers ns77.domaincontrol.com / ns78.domaincontrol.com. Google Workspace MX: aspmx.l.google.com priority 1; alt1/alt2 priority 5; alt3/alt4 priority 10. SPF: v=spf1 include:_spf.google.com -all. Google DKIM and _dmarc, Bing/Google/Lovable verifications are present and must remain unchanged. No AAAA or CAA records were shown.

Target: Netlify site 225f9043-7ff5-4dc2-a1ed-15f71a999079, www primary, baustern.ch automatic apex redirect. A @ -> 75.2.60.5; CNAME www -> leafy-bublanina-48b840.netlify.app.

## Applied and verified

- Production deploy: `6aa7cc3b001cc91b941ab3eb`, 2026-09-14 10:28 UTC.
- GoDaddy: edited only the existing A @ and CNAME www. Both new values visible after save; still 20 records. No forwarding, nameserver, mail or verification records changed.
- 10:34 UTC: ns77 authoritative DNS confirmed both targets and all five original Google Workspace MX records.
- 10:38 UTC: public 1.1.1.1 (apex) and 8.8.8.8 (www) resolved the new targets.
- Netlify UI: Let's Encrypt certificate covers baustern.ch and www.baustern.ch, created/updated September 14 at 13:35 local (10:35 UTC), auto-renews before December 13.
- 10:40 UTC: standard Node HTTPS requests (no DNS override, no certificate bypass) returned Netlify HTTP 200 at www, 301 apex -> www, 301 HTTP -> HTTPS, 404 for a nonexistent route, and HTTP 200 for robots.txt and sitemap.xml.
- Final public-domain verification: `prod-release.json`, `prod-assets.json`, `prod-content.json` in this directory. All 31 routes, 11 source hashes, 16 versioned asset headers and selected content hashes passed.
- Some existing Chrome/curl connections still saw cached Vercel DNS immediately after migration. This did not reproduce in a fresh Playwright browser or standard Node requests. Old DNS TTL was 3600 seconds; no local DNS override or certificate bypass was introduced.
- Subsequent standard requests briefly alternated between old/new DNS, so successful isolated requests were not treated as universal propagation. Cleared only the transient Windows DNS cache (no DNS-server configuration change). At 10:47 UTC `prod-domain.json` passed all redirects, 31 canonical routes, trusted TLS and CRM preflight; shortly afterward the new first screen was visually confirmed in the existing user Chrome tab.
- Netlify UI removes the need for a duplicate explicit apex alias: www primary already provides the automatic apex redirect.

## Hosting capacity gate

Netlify Free, 300 credits/month. At 10:40 UTC the billing UI showed 26.6 credits remaining, expiry October 9; 240 consumed by 16 production deploys, 6.6 by requests, 26.8 by bandwidth. No payment card saved. Owner asked to choose and purchase a paid plan. No purchase or auto-recharge was performed. Avoid repeated production deploys (15 credits each); finish changes in draft and publish once.

Reference: https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/

## Hosting upgrade confirmed later on 14 September 2026

Owner purchased Personal. The authenticated billing screen subsequently showed the Personal plan effective 14 September, $9, a paid receipt, and 1000/1000 credits. Auto-recharge was not enabled by the agent. The earlier Free-plan credit blocker is resolved. No payment details are copied into this report.

# BauStern — spatial desktop restoration and mobile cinema

## Scope and release status

User rejected the white desktop tabs/detail dock, requested silent playback, then supplied iPhone 15 screenshots and confirmed the existing mobile videos do play. The four new issues were: unusable before/after slider, no readable hold between clips and sheets, excessively long information sections, and severe portrait cropping.

Local implementation, functional verification and isolated hardware performance verification are complete. Verified draft `6aa7f6ee8cb751d625dafd0a` was followed by production `6aa7f9ee490a2ee08c6f22be`, published through Netlify CLI on 14 September 2026. The new code was confirmed on https://www.baustern.ch at 13:43 UTC.

## Changes

- Desktop room navigation is a transparent vertical dot rail again. Original object-linked labels, thin leaders and dots replace the white right dock. Safe-zone placement avoids titles, navigation, plan and comparison control. Labels remain clickable at 1000 px through 4K.
- Fixed initial placement while ScrollTrigger temporarily unpins the stage during refresh; invalidate layout after the title settles and observe stage dimensions. WebKit hotspot activation explicitly restores keyboard focus, so Escape works after a pointer click.
- Removed the sound button, M shortcut, AudioContext engine and all sound calls. Videos remain muted. No sound setting is offered.
- Mobile uses the existing full-width `m3/` or economical `m3l/` clips and uncut `s13/` stills in a 16:9 cinema window. `object-fit:contain` replaces portrait centre-cropping. No images or videos were artificially regenerated; existing rooms remain consistent between moving and held frames. A native full-image dialog supports a larger view and landscape orientation.
- Seven rooms precede the information sections on mobile. Each has 165svh of native scroll space, explicit previous/next controls, and a one-room vertical swipe over the picture. Finishing a clip does not advance the page or cover the hold with a sheet. Scrolling elsewhere remains native; `Infos & Ablauf` bypasses the tour and `Offerte anfragen` opens the request page.
- Mobile Rückblende automatically runs through the seven existing `mat5/` photographic stages over 6.2 seconds. Only two compositor images are visible at once; no mobile canvas loop, draggable divider or particle pool. Pause/resume/replay and a persistent completed room replace the slider.
- Five main information sections and four supplementary FAQ/company/region/PDF sections become native disclosures on mobile. The request form remains outside a collapsed disclosure. Promise/situation/reference/review lists are compact horizontal lists, the works grid has two columns, repeated marquee review copies are hidden. Desktop DOM order and hidden attributes are restored on unmount.
- Internal anchors open a containing disclosure before scroll measurement. Details and enlarged images use native dialogs with Escape, contained focus and background scroll lock.
- Visual inspection caught white text on white category buttons in the home request form. Both unselected and selected colors are now explicitly scoped to the dark home sections and contrast-tested.

## Files

Production sources: `site/js/film.js`, `film-fx.js`, `film-mobile.js`, `pages.js`, `app.js`; `site/css/site.css`, `mobile-film.css`. Generated route HTML, sitemap and redirects were rebuilt. Media originals, CRM endpoints, DNS and analytics configuration are unchanged.

Regression additions: `spatial-interaction-test.js`, `mobile-room-cinema-test.js`, `mobile-camera-swipe-test.js`, `mobile-home-form-test.js`. Existing mobile tests now expect automatic transformation and full-composition video; form tests open the new disclosures before interacting. Desktop slider placement checks nonintersection with the vertical rail instead of assuming a horizontal nav. The jsdom baseline logic was not changed.

## Verified locally

- Build: 11 JavaScript files, 4 stylesheets, 31 routes plus real 404, zero lint/build errors.
- jsdom smoke: zero errors and missing assets; video-flight lifecycle passes.
- Desktop visual/state matrix: Chromium and WebKit, 7 sizes from 1000×700 to 3840×2160, 196 scene/return records, no failures or console errors.
- Spatial interaction tests: 42 scene cases across both engines; no heading/hint collision; detail open/close/Escape/outside, real route navigation/back, no sound engine or toggle, all videos muted.
- Mobile room matrix: 126 scene records across Chromium/WebKit at 320×568, 360×640, 375×667, 390×844, 393×852, 412×915, 430×932, 768×1024 and 812×375. Entire frames, 44px controls, detail dialogs, materialization, stable holds, disclosures, anchors and route cleanup verified.
- Native touch dispatch in Chromium: 8 one-room swipes at 320/375/393/430; completed clips stay in the destination room with no sheet obscuring it.
- All 31 routes at 375 px: no JS/HTTP failures, horizontal overflow or reported small controls. Targeted home accessibility check at 390 px: no axe violations; menu/callback/lightbox interactions pass.
- General form/network/idempotency suite: 69 assertions per engine, 138 total, zero JS errors; all 16 submissions intercepted as mocks. Home form additionally checked for contrast, native validation, axe and mocked receipt in both engines. No real CRM record or manager notification was created.
- Desktop material-control keyboard/tap/drag regression verified, including a standalone WebKit 4K retry after a parallel-load timeout. Slider text contrast: 5.87:1 against the worst-case white backdrop, handle icon: 6.85:1.
- Home form category contrast: 11.99:1 unselected, 6.85:1 selected, both engines. Native submit validation and mocked confirmed receipt pass.
- Existing mobile-cinema suite: 7 rooms and 4 fallback conditions per engine at 375 px, including reduced motion, data saving, missing video and autoplay denial.
- Isolated hardware-backed Chrome/GTX 1080: all twelve motion samples at 1440/1920/3840 meet p95 ≤16.8 ms. Actual p95 5.6–16.7 ms; >33.4 ms frames ranged 0–2.0%. Idle canvas draws: zero. This is a timing regression budget, not a physical-screen or universal FPS guarantee.
- Simulated 47px top/34px bottom safe areas at 390×667 in WebKit: CTA stays reachable and opens contacts. The stage can scroll internally on unusually short usable viewports instead of permanently clipping controls.

Reports: `core/dev/reports/spatial-restore-2026-09-14/`, `desktop-polish-spatial-restore-{chromium,webkit}/`, `spatial-restore-mobile-matrix-targeted-chromium/`, `spatial-restore-a11y-mobile-matrix-targeted-chromium/`.

## Deployment verification

Draft: https://6aa7f6ee8cb751d625dafd0a--leafy-bublanina-48b840.netlify.app — created by Netlify CLI, ready at 13:30:42 UTC on 14 September 2026. The interrupted terminal session did not invalidate the deployment; its status was confirmed before proceeding, with no duplicate draft created.

- All 31 routes return the prerendered shell; all 11 deployed JS/CSS hashes exactly match local production sources.
- Sixteen versioned media assets have correct MIME, byte length and `Cache-Control: public,max-age=31536000,immutable`. Four full media/PDF content hashes and current prerender markers match.
- Chromium at 320/390/430: real wide-video playback, six clickable Flur details, no horizontal overflow, obsolete-media requests, Netlify badge or browser errors.
- WebKit at 390×844: all seven rooms, automatic materialization with pause/resume, complete frames, dialogs, five disclosures, anchors and return navigation pass on the actual draft host.
- Desktop Chromium at 1440×900: 14 forward/reverse/return records, no placement failures or console errors. Draft screenshots were visually inspected.

Evidence: `draft-mobile.json`, `draft-assets.json`, `draft-content.json`, `draft/mobile-webkit/report.json` under this release's report directory, plus `desktop-polish-spatial-restore-draft/report.json`.

Production: https://www.baustern.ch — immutable deploy https://6aa7f9ee490a2ee08c6f22be--leafy-bublanina-48b840.netlify.app.

- HTTP and apex-domain redirects reach HTTPS/www; certificate valid for both names. All 31 canonical routes, 29 sitemap entries plus two legal routes, robots and the real 404 pass.
- Sixteen media asset headers/lengths and four full asset/PDF hashes pass on production. Prerender contains current picture wrappers, film effects and v13 paths.
- CRM CORS preflight returns 204 for the production origin and POST; no actual lead was submitted in this UI release.
- Post-publication production check: all 31 routes and 11 JS/CSS hashes pass. Chromium at 320/390/430 plays the wide clips without browser errors, horizontal overflow, obsolete media or a Netlify badge.
- Post-publication WebKit at 390×844 passes all seven scenes, pause/resume of the automatic transformation, stable completed frames, dialogs, five compact disclosures, calculator anchor and route-return cleanup. Desktop Chromium at 1440×900 passes all 14 forward/reverse/return states with zero placement failures or console errors.

Production evidence: `prod-mobile.json`, `prod-assets.json`, `prod-content.json`, `prod-domain.json`, `production/mobile-webkit/report.json` in `core/dev/reports/spatial-restore-2026-09-14/`, plus `core/dev/reports/desktop-polish-spatial-restore-production/report.json`. No failed production check remains in this UI release's protocol. Physical-device visual acceptance and the separate operational limits below remain explicitly unverified.

## Acceptance limits

The user confirmed playback on their physical iPhone 15 for the preceding release. This new framing and interaction release still requires their visual check on that same device. Playwright WebKit is not physical iOS. Passing local rAF timing is not a guarantee of 60 displayed video frames on every device, temperature, battery mode or network. This release deliberately shows a complete wide image inside the portrait page instead of promising a full-bleed portrait frame without cropping or fabricating its surroundings.

No changes to customer-retention policy, CRM backup subscription, legal approval or real lead delivery were made in this UI task. Those prior operational decisions remain separate; this report is not a claim that every launch risk is closed.

## Reproduce

From `core/dev`: `npm run build`, `node jsdom-smoke.js`, `node mobile-room-cinema-test.js` (then `ENGINE=webkit`), `node spatial-interaction-test.js`, `node mobile-home-form-test.js`.

For isolated performance: stop other automated browser runs, set `REPORT_DIR=reports/spatial-restore-2026-09-14` and `TAG=spatial-restore`, then run `node frame-budget-acceptance.js`. This requires the hardware-backed installed Chrome channel.

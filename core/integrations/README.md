# Website → CRM

Production intake: `POST https://n8n.baucrm.net/webhook/web-anfrage`.

- Active intake workflow: `y1AXsm72Z0wgLGpu` (BauStern — Web Anfragen).
- CRM UI workflow: `HiUVHr3einwA4VAr` (Baustern - CRM Ansicht); only card/attachment and viewer code were changed.
- Supabase project: `ebnlafxzsjinngfbmoxc`, function `public.crm_web_anfrage_v2(jsonb)`.
- Execute is server-only. Existing n8n credentials are reused; no service key is embedded in the website.
- Apply migrations in timestamp order. The second migration corrects `crm_fotos.quelle` to an allowed value and is the current implementation.
- A successful HTTP response requires committed customer, lead and files. Retries of one `extern_id` return the existing number without duplicating email or attachments.
- `*-before.json` files are pre-change backups, not current deployment instructions. `*-after.json` files capture the published workflow/code state.
- `web-confirmation-v2.js` contains the verified production PDF URL at `https://www.baustern.ch/downloads/baustern-referenzen-v1.pdf` (domain migrated September 14). Never overwrite an immutable PDF version.
- Live tests send actual notifications and create marked internal records. Use mocked tests for normal regression. Seven SYSTEMTEST records (WEB-260912-003 through 009) were retained for user acceptance.

## September 14 notification repair

- `WEB-260914-010`: owner-authorized real test with one attachment; committed record and full-size attachment visually verified in signed-in CRM. Customer Gmail confirmation SENT. Telegram returned a connection error despite the overall execution being green.
- Published workflow repair: Telegram retryOnFail, 3 attempts / 1500 ms; independent `Team E-Mail` branch to `info@baustern.ch`, same retry settings. Team email fails the execution if all attempts fail; Telegram is no longer the only team notification channel. Existing duplicate guard in `TG Text` prevents duplicate notifications for the same request ID.
- `WEB-260914-011`: owner separately authorized exactly one retest from `https://www.baustern.ch`. One POST, one lead, one attachment. Execution `37017`: CRM success, customer Gmail SENT, Telegram API `ok:true` (message 2379), team Gmail SENT. No third test is authorized.
- `web-notifications-before-20260914.json` is the redacted pre-change backup. `web-notifications-after-20260914.json` captures only modified nodes, NOT an entire-workflow restore payload. Never overwrite the whole live graph from that partial file.
- Evidence: `../dev/reports/release-fixes-2026-09-14/notification-retest-proof.json`, both write-once live-test ledgers and confirmation screenshots. Provider acceptance is not a claim that a human opened an email, nor a future delivery guarantee.

See the root `CRM-60FPS-RELEASE-2026-09-12.md` for evidence, remaining physical-device/login limitations and release details. Do not treat successful DB tests as proof of a logged-in human UI review or guaranteed inbox delivery.

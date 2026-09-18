-- BauStern · Bewertungs-Einladungen: Fenster weiten (Etappe 11, vorbereitet 18.09.2026)
--
-- BEFUND
-- Die Maschine läuft: n8n «BauStern — Bewertungen» ist aktiv, crm_review_faellige(),
-- crm_review_antwort() und das Portal existieren. review_einladungen ist trotzdem leer.
-- Grund: crm_review_faellige() nimmt nur Aufträge, deren Abschluss zwischen 24 Stunden und
-- 7 TAGEN zurückliegt. Wer in dieser Woche nicht erwischt wird, fällt für immer heraus.
-- Stand 18.09: genau zwei Aufträge mit E-Mail sind je fertig geworden — einer (MAN-260917-014)
-- ist seit dem 09.09 an der 7-Tage-Decke vorbei und bekommt nie eine Einladung.
--
-- ÄNDERUNG
-- Obergrenze von 7 Tagen auf 60 Tage. Untergrenze (24 h) bleibt: niemand wird am Tag der
-- Übergabe angeschrieben. Doppelte Einladungen sind weiter durch den Unique-Index auf
-- anfrage_id ausgeschlossen, es kann also nichts zweimal rausgehen.
--
-- ACHTUNG vor dem Ausführen
-- Beim ersten Lauf nach der Änderung geht die Einladung an ALLE Aufträge der letzten 60 Tage
-- auf einmal raus. Heute sind das zwei — unkritisch. Werden vorher die 39 Aufträge aus
-- «AuftragBestaetigt» nachgepflegt, sind es entsprechend mehr. Dann zuerst die Vorschau
-- unten laufen lassen und erst danach die Funktion ändern.

-- 1) VORSCHAU (nur lesen, ändert nichts): wer bekäme mit 60 Tagen eine Einladung?
with geschlossen as (
  select a.id, k.email, coalesce(a.anfragenummer, a.renovero_task_uid) as nummer,
         coalesce((select max(h.created_at) from status_historie h
                    where h.entity_type='anfrage_pipeline' and h.entity_id=a.id
                      and h.neuer_status='Abgeschlossen'),
                  a.arbeitsende_at, a.updated_at) as geschlossen_am
  from anfragen a join kunden k on k.id=a.kunden_id
  where a.pipeline_status in ('Abgeschlossen','Rechnung','Bezahlt')
    and coalesce(k.email,'') like '%@%' and a.deleted_at is null)
select nummer, email, geschlossen_am
from geschlossen g
where g.geschlossen_am between now() - interval '60 days' and now() - interval '24 hours'
  and not exists (select 1 from review_einladungen r where r.anfrage_id = g.id)
order by geschlossen_am;

-- 2) ÄNDERUNG (erst nach der Vorschau ausführen)
-- In public.crm_review_faellige() diese eine Zeile ersetzen:
--   where g.geschlossen_am between now() - interval '7 days'  and now() - interval '24 hours'
-- durch:
--   where g.geschlossen_am between now() - interval '60 days' and now() - interval '24 hours'
-- Der Rest der Funktion bleibt unverändert.

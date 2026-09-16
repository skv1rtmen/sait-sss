-- Website-Eingang: Antrag und Anlagen werden in EINER Transaktion gespeichert.
-- Nur der vorhandene n8n-Service-Zugang darf diese Funktion ausführen.
create or replace function public.crm_web_anfrage_v2(p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare
  v_id uuid; v_kunde uuid; v_nr text; v_seq bigint; v_existing public.anfragen%rowtype;
  v_key text := btrim(coalesce(p_payload->>'extern_id',''));
  v_name text := btrim(coalesce(p_payload->>'name',''));
  v_phone text := btrim(coalesce(p_payload->>'telefon',''));
  v_email text := lower(btrim(coalesce(p_payload->>'email','')));
  v_gewerk text := btrim(coalesce(p_payload->>'gewerk',''));
  v_text text := btrim(coalesce(p_payload->>'nachricht',''));
  v_ort text := btrim(coalesce(p_payload->>'ort',''));
  v_plz text; v_foto jsonb; v_bytes bytea; v_data text; v_mime text;
  v_fotos jsonb := coalesce(p_payload->'fotos','[]'::jsonb);
  v_i integer := 0; v_sum bigint := 0; v_vor text; v_typ public.kunden_typ;
begin
  if current_user not in ('service_role','postgres') then
    raise insufficient_privilege using message='Nur serverseitiger Zugriff';
  end if;
  if jsonb_typeof(p_payload)<>'object' or v_key !~ '^web-[A-Za-z0-9-]{8,100}$'
    or length(v_name)>200 or length(v_text)>12000 or length(v_gewerk)>180
    or length(v_email)>254 or length(v_ort)>240 or length(v_phone)>40
    or (v_name='' or (v_phone='' and v_email='')) or v_gewerk=''
    or (v_phone<>'' and (v_phone !~ '^[+0-9][0-9 ().-]*$' or length(regexp_replace(v_phone,'[^0-9]','','g')) not between 9 and 15))
    or (v_email<>'' and v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    return jsonb_build_object('ok',false,'error','Bitte Kontaktdaten prüfen','code','VALIDATION');
  end if;
  if coalesce(p_payload->>'webseite','')<>'' then
    return jsonb_build_object('ok',false,'code','VALIDATION','error','Eingabe nicht akzeptiert');
  end if;
  if jsonb_typeof(v_fotos)<>'array' or jsonb_array_length(v_fotos)>3 then
    return jsonb_build_object('ok',false,'code','VALIDATION','error','Höchstens drei Anlagen');
  end if;
  -- Validieren, bevor Kunden/Anfragen angelegt werden; PDF nur als Bewerbung.
  for v_foto in select value from jsonb_array_elements(v_fotos) loop
    v_data:=coalesce(v_foto->>'daten','');
    if length(v_data)>12000000 or v_data !~ '^data:(image/(jpeg|png|webp)|application/pdf);base64,[A-Za-z0-9+/=\r\n]+$' then
      raise exception 'INVALID_ATTACHMENT';
    end if;
    v_mime:=split_part(split_part(v_data,';',1),':',2);
    v_bytes:=decode(split_part(v_data,',',2),'base64');
    if octet_length(v_bytes)>8388608 or octet_length(v_bytes)<8 then raise exception 'INVALID_ATTACHMENT'; end if;
    if (v_mime='image/jpeg' and encode(substring(v_bytes from 1 for 3),'hex')<>'ffd8ff')
      or (v_mime='image/png' and encode(substring(v_bytes from 1 for 8),'hex')<>'89504e470d0a1a0a')
      or (v_mime='image/webp' and (encode(substring(v_bytes from 1 for 4),'hex')<>'52494646' or encode(substring(v_bytes from 9 for 4),'hex')<>'57454250'))
      or (v_mime='application/pdf' and (v_gewerk not like 'Bewerbung%' or encode(substring(v_bytes from 1 for 5),'hex')<>'255044462d')) then
      raise exception 'INVALID_ATTACHMENT';
    end if;
    v_sum:=v_sum+octet_length(v_bytes);
    if v_sum>12582912 then raise exception 'INVALID_ATTACHMENT'; end if;
  end loop;
  -- Serialisiert Website-Nummern und gleichzeitige Wiederholungen ohne andere Kanäle zu ändern.
  perform pg_advisory_xact_lock(73140,260912);
  select * into v_existing from public.anfragen where externe_id=v_key;
  if found then
    if v_existing.lead_quelle<>'website' then raise exception 'REQUEST_ID_CONFLICT'; end if;
    return jsonb_build_object('ok',true,'id',v_existing.id,'nr',v_existing.anfragenummer,'doppelt',true,
      'fotos',(select count(*) from public.crm_fotos where anfrage_id=v_existing.id and quelle='website'));
  end if;
  select id into v_kunde from public.kunden where deleted_at is null
    and ((v_email<>'' and lower(email)=v_email) or (v_phone<>'' and regexp_replace(telefon,'[^0-9]','','g')=regexp_replace(v_phone,'[^0-9]','','g')))
    order by case when v_email<>'' and lower(email)=v_email then 0 else 1 end,created_at limit 1;
  v_plz:=substring(v_ort from '^([0-9]{4})(?:[[:space:]]|$)');
  if v_plz is not null then v_ort:=btrim(regexp_replace(v_ort,'^[0-9]{4}[[:space:]]*','')); end if;
  if v_kunde is null then
    v_vor:=split_part(v_name,' ',1);
    v_typ:=case p_payload->>'kundentyp' when 'Hausverwaltung' then 'verwaltung'::public.kunden_typ
      when 'Generalunternehmer' then 'generalunternehmer'::public.kunden_typ when 'Gewerbe' then 'firma'::public.kunden_typ else 'privat'::public.kunden_typ end;
    insert into public.kunden(typ,firma,vorname,nachname,telefon,email,plz,ort)
      values(v_typ,nullif(left(p_payload->>'firma',200),''),v_vor,nullif(btrim(substr(v_name,length(v_vor)+1)),''),nullif(v_phone,''),nullif(v_email,''),v_plz,nullif(v_ort,'')) returning id into v_kunde;
  end if;
  select coalesce(max(substring(anfragenummer from '([0-9]+)$')::bigint),0)+1 into v_seq from public.anfragen where anfragenummer ~ '^WEB-[0-9]+-[0-9]+$';
  v_nr:='WEB-'||to_char(now(),'YYMMDD')||'-'||lpad(v_seq::text,greatest(3,length(v_seq::text)),'0');
  perform set_config('app.status_grund','Website: Antrag und Anlagen bestätigt',true);
  insert into public.anfragen(anfragenummer,titel,beschreibung,kunden_id,kontakt_telefon,ort,plz,renovero_art,
    arbeitsbeginn,budget,pipeline_status,farbe,status,lead_quelle,externe_id,nehmen_wir,offerte_status,
    eingegangen_am,letzte_nachricht_am,ausgeblendet,utm_source,utm_campaign,utm_term,gclid)
  values(v_nr,left(v_gewerk||' — '||coalesce(nullif(v_text,''),'Website-Anfrage'),140),
    v_text||case when coalesce(p_payload->>'seite','')<>'' then E'\n\nSeite: '||left(p_payload->>'seite',1000) else '' end,
    v_kunde,nullif(v_phone,''),nullif(v_ort,''),v_plz,v_gewerk,nullif(left(p_payload->>'zeitrahmen',200),''),
    nullif(p_payload->>'budget','')::numeric,'NeuerLead',coalesce((select farbe from public.status_farben where status='NeuerLead' limit 1),'#3B82F6'),
    'INCOMING'::public.anfrage_status,'website',v_key,'Offen','Offen',now(),now(),false,
    nullif(left(p_payload->>'utm_source',300),''),nullif(left(p_payload->>'utm_campaign',300),''),nullif(left(p_payload->>'utm_term',300),''),nullif(left(p_payload->>'gclid',300),'')) returning id into v_id;
  for v_foto in select value from jsonb_array_elements(v_fotos) loop
    insert into public.crm_fotos(anfrage_id,phase,titel,daten,bytes,sortierung,quelle)
    values(v_id,'vorher',left(coalesce(v_foto->>'titel','Anlage'),120),v_foto->>'daten',octet_length(decode(split_part(v_foto->>'daten',',',2),'base64')),v_i,'website');
    v_i:=v_i+1;
  end loop;
  return jsonb_build_object('ok',true,'id',v_id,'nr',v_nr,'kunde_id',v_kunde,'doppelt',false,'fotos',v_i);
exception when others then
  -- Dieser Block rollt auch die Kundenanlage zurück; keine halbe Erfolgsantwort.
  if sqlerrm='INVALID_ATTACHMENT' then return jsonb_build_object('ok',false,'code','VALIDATION','error','Anlage nicht lesbar oder zu gross'); end if;
  raise;
end $function$;
revoke all on function public.crm_web_anfrage_v2(jsonb) from public,anon,authenticated;
grant execute on function public.crm_web_anfrage_v2(jsonb) to service_role;

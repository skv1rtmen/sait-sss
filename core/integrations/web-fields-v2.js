/* n8n Code-Knoten: Eingaben normalisieren; die Datenbank prüft und speichert atomar. */
const wh=$input.first().json||{},b=wh.body&&typeof wh.body==='object'?wh.body:{};
const S=v=>v==null?'':String(v).trim();
const name=S(b.name||b.kunde_name),email=S(b.email||b.mail),telefon=S(b.telefon||b.phone||b.tel);
const nachricht=S(b.nachricht||b.message||b.beschreibung||b.text),gewerk=S(b.service||b.gewerk||b.leistung||b.betreff);
const ort=S(b.ort||b.plz_ort||b.plz)||((nachricht.match(/(?:^|\n)Ort:\s*([^\n]+)/)||[])[1]||'');
const honig=S(b.webseite||b.website_url||b.hp);
const spam=!!honig;
let requestId=S(b.request_id);
if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)){
  // Alte Tabs ohne Request-ID: volle Nachricht statt der früheren ersten 80 Zeichen.
  const key=[name,email,telefon,gewerk,nachricht,ort,Math.floor(Date.now()/3600000)].join('|');let a=2166136261,c=5381;
  for(let i=0;i<key.length;i++){a=Math.imul(a^key.charCodeAt(i),16777619);c=Math.imul(c,33)^key.charCodeAt(i);}
  requestId='legacy-'+(a>>>0).toString(16)+'-'+(c>>>0).toString(16);
}
const fotos=Array.isArray(b.fotos)?b.fotos:[];
const budget=Number.parseFloat(S(b.budget).replace(/[^0-9.]/g,''));
return [{json:{spam,extern_id:'web-'+requestId,name,email,telefon,ort,gewerk,nachricht,
  titel:(gewerk+' — '+nachricht).slice(0,140),budget:Number.isFinite(budget)?budget:null,fotos,
  kundentyp:S(b.kundentyp),firma:S(b.firma),objekt:S(b.objekt),zeitrahmen:S(b.zeitrahmen),
  datenschutz:b.datenschutz===true,webseite:honig,utm_source:S(b.utm_source),utm_campaign:S(b.utm_campaign),
  utm_term:S(b.utm_term||b.keyword),gclid:S(b.gclid),seite:S(b.seite||b.page||(wh.headers||{}).referer)}}];

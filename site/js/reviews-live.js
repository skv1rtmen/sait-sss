/* Live-Sync (Task 3): ueberschreibt die 4 handkuratierten REVIEWS aus data.js mit frisch synchronisierten
   Google-Rezensionen, sobald der n8n-Workflow "BauStern — Google Reviews Sync" einmal gelaufen ist und
   Zeilen in google_reviews_cache liegen (taeglicher Places-API-Sync, siehe n8n-workflows/google-reviews-sync.json).
   Bis dahin (Tabelle leer, oder API nicht erreichbar) bleiben die statischen REVIEWS unveraendert sichtbar --
   kein Fehlerzustand, kein Ladehinweis noetig, die Seite rendert so oder so sofort mit den Daten aus data.js. */
(function(){
  if(typeof REVIEWS_LIVE==='undefined'||!REVIEWS_LIVE.enabled)return;
  var SUPABASE_URL='https://ebnlafxzsjinngfbmoxc.supabase.co';
  var ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVibmxhZnh6c2ppbm5nZmJtb3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwOTA0NzUsImV4cCI6MjEwMjY2NjQ3NX0.sT2nzMwsoSYm20iofj00Xl0jrDfMVv8h-dgHEy_x2nU';
  var min=(typeof MIN_REVIEW_RATING!=='undefined')?MIN_REVIEW_RATING:4;
  var url=SUPABASE_URL+'/rest/v1/google_reviews_cache?select=review_id,autor,sterne,text&sterne=gte.'+min+'&order=zeit_unix.desc&limit=8';
  if(typeof fetch!=='function')return;
  /* Etappe 10: Nur holen, wenn auf dieser Seite überhaupt Stimmen stehen. Vorher lief die Anfrage auf
     JEDER Route (auch /impressum, /404) — unnötiger Request, und bei nicht erreichbarem Supabase eine
     Konsolenmeldung auf jeder Seite, die jede Abnahme zumüllte. */
  var started=false;
  function maybeStart(){
    if(started)return;
    if(!document.querySelector('.w-reviews'))return;
    started=true;load();
  }
  document.addEventListener('bs:route',function(){setTimeout(maybeStart,0);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(maybeStart,0);});
  else setTimeout(maybeStart,0);
  setTimeout(maybeStart,1200);          /* SPA baut die Startseite manchmal erst nach dem Router-Ereignis */

  function load(){
  fetch(url,{headers:{apikey:ANON_KEY,Authorization:'Bearer '+ANON_KEY}})
    .then(function(r){return r.ok?r.json():[];})
    .then(function(rows){
      if(!Array.isArray(rows)||!rows.length||typeof REVIEWS==='undefined')return;
      var mapped=rows.filter(function(r){return r&&r.text;}).map(function(r){
        return {q:r.text,who:r.autor||'Google-Nutzer',role:'Google-Rezension',src:'Google',rating:r.sterne};
      });
      if(!mapped.length)return;
      REVIEWS.length=0; mapped.forEach(function(r){REVIEWS.push(r);});
      repaint();   /* Etappe 10: Die Seite ist zu diesem Zeitpunkt oft schon gebaut — sonst sehen
                      Besucherinnen die statischen Karten, obwohl die frischen längst da sind. */
    })
    .catch(function(){/* offline/Fehler: statische REVIEWS aus data.js bleiben stehen */});
  }

  /* Baut die beiden Laufspalten neu — gleiche Auszeichnung wie in pages.js (#stimmen). */
  function repaint(){
    var host=document.querySelector('.w-reviews .rv-cols');if(!host)return;
    var esc=function(t){var d=document.createElement('div');d.textContent=String(t==null?'':t);return d.innerHTML;};
    var shown=REVIEWS.filter(function(r){return (r.rating||5)>=min;});
    if(!shown.length)return;
    var card=function(r){return '<article class="review"><p class="q">'+esc(r.q)+'</p><div class="who"><b>'+
      esc(r.who)+'</b><span>'+esc(r.role)+'</span><em>'+esc(r.src)+'</em></div></article>';};
    var A=shown.map(card),B=shown.slice(1).concat(shown.slice(0,1)).map(card);
    var col=function(cards,rev){return '<div class="rv-col'+(rev?' rv-col--rev':'')+'" aria-hidden="'+(rev?'true':'false')+
      '"><div class="rv-track">'+cards.join('')+cards.join('')+'</div></div>';};
    host.style.setProperty('--dur',Math.max(26,shown.length*11)+'s');
    host.innerHTML=col(A,false)+col(B,true);
  }
})();

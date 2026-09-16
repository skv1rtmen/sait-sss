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
  fetch(url,{headers:{apikey:ANON_KEY,Authorization:'Bearer '+ANON_KEY}})
    .then(function(r){return r.ok?r.json():[];})
    .then(function(rows){
      if(!Array.isArray(rows)||!rows.length||typeof REVIEWS==='undefined')return;
      var mapped=rows.filter(function(r){return r&&r.text;}).map(function(r){
        return {q:r.text,who:r.autor||'Google-Nutzer',role:'Google-Rezension',src:'Google',rating:r.sterne};
      });
      if(!mapped.length)return;
      REVIEWS.length=0; mapped.forEach(function(r){REVIEWS.push(r);});
    })
    .catch(function(){/* offline/Fehler: statische REVIEWS aus data.js bleiben stehen */});
})();

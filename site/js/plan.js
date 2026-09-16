/* BauStern — Mini-Grundriss für den Rundgang (schematisch, passend zum Film; kein realer Objektplan).
   v15 «Berghaus»: Brücke → Eingang → Galerie entlang des Felsens (flur) → Küche / Bad / Schlafzimmer → Wohnen (Glaspavillon).
   Koordinaten im 240×170-Raster. PLAN.rooms[k] = {id, label, d (SVG-Pfad), cx, cy}; PLAN.cam[szene] = Kameraposition + Blickrichtung (Grad). */
const PLAN={
  w:240,h:170,
  rooms:[
    {id:'ankunft',  label:'Brücke',      d:'M4 78 H40 V92 H4 Z',        cx:22, cy:85},
    {id:'eingang',  label:'Eingang',     d:'M40 60 H84 V110 H40 Z',     cx:62, cy:85},
    {id:'flur',     label:'Galerie',     d:'M84 12 H112 V158 H84 Z',    cx:98, cy:85},
    {id:'kueche',   label:'Küche',       d:'M112 12 H228 V70 H112 Z',   cx:170,cy:41},
    {id:'bad',      label:'Bad',         d:'M40 12 H84 V60 H40 Z',      cx:62, cy:36},
    {id:'schlaf',   label:'Schlafzimmer',d:'M40 110 H84 V158 H40 Z',    cx:62, cy:134},
    {id:'wohnen',   label:'Wohnen',      d:'M112 70 H228 V158 H112 Z',  cx:170,cy:114},
  ],
  /* Szene -> Raum + Kamera (x,y) + Blickrichtung (Grad, 0 = nach oben, im Uhrzeigersinn) */
  cam:[
    {room:'ankunft',x:8,  y:85, a:90},   // 0 Ankunft: auf der Brücke, Blick zum Haus
    {room:'flur',   x:98, y:150,a:0},    // 1 Schwelle: Galerie entlang des Felsens
    {room:'kueche', x:124,y:62, a:40},   // 2 Küche: Insel, Panoramafenster
    {room:'bad',    x:62, y:56, a:0},    // 3 Bad: Wanne vor dem Fenster
    {room:'schlaf', x:62, y:114,a:180},  // 4 Schlafzimmer
    {room:'wohnen', x:124,y:150,a:45},   // 5 Wohnen: Eckverglasung
    {room:'wohnen', x:124,y:150,a:45},   // 6 Rückblende: derselbe Blickwinkel im Rohbau
    {room:'eingang',x:48, y:100,a:40},   // 7 Eingang: Konsole, Spiegel, Schlüssel
  ]
};

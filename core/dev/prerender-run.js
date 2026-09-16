/* Startet site/_tools/prerender.js mit dem Playwright aus core/dev/node_modules (site/ hat kein eigenes node_modules). */
const Module=require('module');const orig=Module._resolveFilename;
const PW=require.resolve('playwright');   /* einmal vorab auflösen (im Hook selbst würde require.resolve rekursiv den Hook rufen) */
Module._resolveFilename=function(req,...a){if(req==='playwright')return PW;return orig.call(this,req,...a);};
require('../../site/_tools/prerender.js');

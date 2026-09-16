/* Independent clock-rate regression. No browser/device FPS claims. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{},document:{},console,performance};
vm.createContext(context);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../../site/js/film-fx.js'),'utf8'),context);
const samples=[];
for(const hz of [30,60,120,180]){
 const i=context.window.FilmFX.Inertial(0);i.follow(.8);
 for(let n=0;n<hz/5;n++)i.tick(1/hz);
 const at200=i.get();for(let n=0;n<hz*2;n++)i.tick(1/hz);
 assert(i.settled());assert.equal(i.get(),.8);samples.push({hz,at200,final:i.get()});
}
assert(samples.every(s=>Math.abs(s.at200-samples[0].at200)<1e-8));
const drag=context.window.FilmFX.Inertial(.5);drag.down(.5,0);drag.move(.9,16);drag.up();
for(let n=0;n<600;n++)assert(Number.isFinite(drag.tick(1/120)));
assert(drag.settled());assert(drag.get()>=0&&drag.get()<=1);
drag.down(.4,1000);drag.move(.7,1016);drag.up();drag.follow(.6);
for(let n=0;n<180;n++)drag.tick(1/60);
assert.equal(drag.get(),.6);assert(drag.settled(),'Scroll target must cancel drag velocity and release the idle rAF loop');
console.log(JSON.stringify({passed:true,samples,dragSettles:true},null,2));

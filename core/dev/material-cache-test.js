const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch();try{const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await p.goto('http://localhost:8099');
 const r=await p.evaluate(async()=>{const m=FilmFX.Materialize(FILM.scenes[5].mat);await m.load();const cv=document.createElement('canvas');cv.width=640;cv.height=360;const ctx=cv.getContext('2d');let draws=0;const draw=ctx.drawImage.bind(ctx);ctx.drawImage=(...a)=>{draws++;return draw(...a);};
 m.render(cv,ctx,.5);const first=draws;m.render(cv,ctx,.5);const repeated=draws;cv.__filmMaterial=null;m.render(cv,ctx,.5);const restored=draws;m.render(cv,ctx,.7);const changed=draws;
 const fx=document.createElement('canvas');const dust=m.dustDraw(fx,fx.getContext('2d'),0,.016);return {first,repeated,restored,changed,dust,particles:FILM.scenes[5].mat.particles};});
 console.log(JSON.stringify(r));if(r.first!==1||r.repeated!==1||r.restored!==2||r.changed!==3||r.dust!==false||r.particles!==0)throw Error('Materialize cache regression');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

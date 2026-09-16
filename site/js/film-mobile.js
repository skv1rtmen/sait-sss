/* BauStern — immersive mobile rooms, a quiet hold after every flight,
   automatic concrete-to-interior sequence and compact sections after the seven-room tour. */
(function(){
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  let introSeen=false;
  function mount(root,api){
    const {S,F,fillScene,countUp,goRoute}=api;
    const W=root.querySelector('#wohnung');if(!W)return null;
    const stage=W.querySelector('#wStage'),cam=W.querySelector('.w-cam'),ov=W.querySelector('#wOv');
    const rooms=[...W.querySelectorAll('.w-room')],sheets=[...W.querySelectorAll('.w-sheet')],stills=[...W.querySelectorAll('.w-still')];
    if(!stage||!rooms.length)return null;
    W.classList.add('is-lite','is-cinema');W.classList.remove('is-full','is-plain');W.style.setProperty('--reveal','1');
    const flow=W.querySelector('#wFlow'),flowOrder=[...flow.childNodes],disclosures=[];
    flow.append(...rooms,...sheets);
    const sectionNames=['Leistungen & Versprechen','Kosten einschätzen','Arbeiten ansehen','Referenz & Kundenstimmen','So läuft Ihr Umbau'];
    sheets.filter(sh=>!sh.classList.contains('w-sheet--final')).forEach((sh,i)=>{
      const children=[...sh.childNodes],box=document.createElement('details'),summary=document.createElement('summary');box.className='m-section';
      summary.innerHTML=`<span class="m-section-n">0${i+1}</span><span>${sectionNames[i]}</span><i aria-hidden="true">+</i>`;box.append(summary);children.forEach(child=>box.append(child));sh.append(box);disclosures.push({sh,box,children});
    });
    const extraSections=[];W.querySelectorAll('.w-sheet--final .w-paper > .sec:not(:first-child):not(.m-keep)').forEach(section=>{const heading=section.querySelector('h2');if(!heading)return;const box=document.createElement('details'),summary=document.createElement('summary');box.className='m-section m-section-extra';const title=document.createElement('span');title.textContent=heading.textContent;summary.append(title);const icon=document.createElement('i');icon.textContent='+';icon.setAttribute('aria-hidden','true');summary.append(icon);section.before(box);box.append(summary,section);extraSections.push({section,box});});
    const duplicateReviews=[];W.querySelectorAll('.rv-track').forEach(track=>[...track.children].slice(track.children.length/2).forEach(review=>{duplicateReviews.push({review,hidden:review.hidden});review.hidden=true;}));
    const oldHot=W.querySelector('#wHot');oldHot.replaceChildren();oldHot.hidden=true;
    const cameraChildren=[...cam.childNodes],plane=document.createElement('div');plane.className='m-camera-plane';plane.append(...cameraChildren);cam.append(plane);
    let alive=true,cur=-1,raf=0,gen=0,playing=false,covered=false,lockedTo=-1,lockTimer=0,revealTimer=0,mediaTimer=0,currentDetails=[],matRaf=0,matProgress=0,matStarted=0,matPaused=false;
    const timers=new Set(),later=(fn,ms)=>{const t=setTimeout(()=>{timers.delete(t);if(alive)fn();},ms);timers.add(t);return t;};
    const connection=navigator.connection||{};
    const autoVideo=!connection.saveData&&!/^(slow-)?2g$/.test(connection.effectiveType||'');
    let eco=!!(connection.saveData||/^(slow-)?[23]g$/.test(connection.effectiveType||''));
    const bar=document.createElement('nav');bar.className='m-tour';bar.setAttribute('aria-label','Wohnungsrundgang');
    bar.innerHTML='<div class="m-tour-head"><span class="m-tour-index">01 / 07</span><span class="m-tour-room">Küche</span><button type="button" class="m-tour-play" aria-label="Kamerafahrt pausieren">Ⅱ</button><button type="button" class="m-tour-prev" aria-label="Vorheriger Raum">←</button><button type="button" class="m-tour-next" aria-label="Nächster Raum">→</button></div><div class="m-tour-track">'+S.map((s,i)=>`<button type="button" data-room="${i}" aria-label="${i+1}. ${s.navLabel}"><i></i></button>`).join('')+'</div>';
    const details=document.createElement('div');details.className='m-details';
    details.innerHTML='<div class="m-details-caption"><span>Details entdecken</span><span class="m-details-count"></span></div><div class="m-details-list" role="group" aria-label="Details zu diesem Raum"></div><dialog class="m-detail-card" id="mDetailCard" aria-label="Raumdetails" hidden></dialog>';
    stage.append(bar,details);
    const footer=document.createElement('div');footer.className='m-tour-footer';footer.innerHTML='<span class="m-film-status" role="status">Raum entdecken · weiterwischen</span><button type="button" class="m-tour-skip">Infos & Ablauf ↓</button><a class="m-tour-offer" href="/kontakt">Offerte anfragen →</a>';stage.append(footer);
    footer.querySelector('a').onclick=e=>{e.preventDefault();goRoute('kontakt');};
    const status=footer.querySelector('.m-film-status');
    footer.querySelector('button').onclick=()=>{resetVideo();const first=sheets[0];window.scrollTo({top:first.getBoundingClientRect().top+scrollY-72,behavior:'smooth'});};
    const list=details.querySelector('.m-details-list'),card=details.querySelector('.m-detail-card'),playButton=bar.querySelector('.m-tour-play');
    const cmp=W.querySelector('#wCmp');if(cmp)cmp.hidden=true;
    const matScene=S.findIndex(s=>s.mat),material=matScene>=0&&window.FilmFX?FilmFX.Materialize(S[matScene].mat):null;
    const expand=document.createElement('button');expand.type='button';expand.className='m-frame-expand';expand.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>';expand.setAttribute('aria-label','Vollständiges Raumbild vergrössern');stage.append(expand);
    const preview=document.createElement('dialog');preview.className='m-frame-preview';preview.innerHTML='<button type="button" aria-label="Bild schliessen">×</button><img alt=""><p>Der ganze Raum · zum Vergrössern können Sie das Telefon drehen.</p>';stage.after(preview);
    expand.onclick=()=>{if(playing)playButton.click();const image=preview.querySelector('img');image.src=cur===matScene?S[cur].mat.compositeDir+'step'+Math.round(matProgress*6)+'.webp':F.stillDir+'st'+cur+'.jpg';image.alt=S[cur].navLabel+' — vollständige Raumansicht';preview.showModal();};
    preview.querySelector('button').onclick=()=>preview.close();preview.addEventListener('click',e=>{if(e.target===preview)preview.close();});preview.addEventListener('close',()=>expand.focus({preventScroll:true}));
    const video=document.createElement('video');video.className='m-film';video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='auto';video.setAttribute('muted','');video.setAttribute('playsinline','');video.setAttribute('aria-hidden','true');video.disablePictureInPicture=true;plane.append(video);
    const warm=document.createElement('video');warm.className='m-film-buffer';warm.muted=true;warm.playsInline=true;warm.preload='auto';warm.setAttribute('playsinline','');warm.setAttribute('aria-hidden','true');
    // Vorpuffer bleibt ausserhalb des DOM; nie mehr als zwei Medien-Elemente, nur eines spielt.
    let warmSrc='';
    const portrait=()=>innerWidth<600&&innerHeight>innerWidth;
    let wasPortrait=portrait();
    const focal=[.54,.5,.36,.5,.48,.53,.5];let pan=.5,panRange=0,panRaf=0;
    function paintPan(){panRaf=0;plane.style.transform='translate3d('+(-panRange*pan).toFixed(1)+'px,0,0)';}
    function sizePan(){const w=cam.clientWidth,h=cam.clientHeight,wide=Math.max(w,h*16/9);panRange=Math.max(0,wide-w);plane.style.width=wide+'px';paintPan();}
    const cameraResize=new ResizeObserver(sizePan);cameraResize.observe(cam);
    const mediaURL=(i,dir=1)=>{
      const V=F.mobileVideo;const folder=eco?V.fallbackDir:V.dir;
      if(i===0)return folder+'intro.mp4';
      const sc=dir>0?S[i]:S[i+1];
      return sc&&sc.clip?folder+sc.clip+(dir>0?'.fwd':'.rev')+'.mp4':null;
    };
    function preload(i){if(!autoVideo||document.hidden||!alive||!F.mobileVideo)return;const src=mediaURL(i);if(!src||src===warmSrc)return;warmSrc=src;warm.src=src;warm.load();}
    function loadStill(i){const s=stills[i];if(!s)return;const im=s.querySelector('img');
      s.querySelectorAll('source').forEach(x=>x.remove());if(im){im.removeAttribute('data-src');const u=S[i].mat?S[i].mat.compositeDir+'step0.webp':F.stillDir+'st'+i+(eco?'-1280':'')+'.jpg';if(im.getAttribute('src')!==u)im.src=u;im.loading='eager';}return im;
    }
    function setStill(i){loadStill(i);stills.forEach((el,k)=>el.classList.toggle('on',i===k));}
    function closeDetail(restore=false){if(card.open)card.close();card.hidden=true;const active=list.querySelector('[aria-expanded="true"]');if(active){active.setAttribute('aria-expanded','false');if(restore)active.focus({preventScroll:true});}}
    card.addEventListener('cancel',e=>{e.preventDefault();closeDetail(true);});card.addEventListener('click',e=>{const r=card.getBoundingClientRect();if(e.target===card&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))closeDetail(true);});
    function fillDetails(sc){closeDetail();currentDetails=sc.ann?[...sc.ann].sort((a,b)=>+a.no-+b.no).map(a=>({t:a.t,l:[a.f,a.hero?sc.offer:''],go:a.go})):sc.hot||[];
      list.replaceChildren();currentDetails.forEach((h,i)=>{const b=document.createElement('button');b.type='button';b.className='m-detail';b.dataset.detail=i;b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls','mDetailCard');b.innerHTML=`<span class="m-detail-no">${String(i+1).padStart(2,'0')}</span><span>${h.t}</span><span class="m-detail-plus" aria-hidden="true">+</span>`;list.append(b);});
      details.querySelector('.m-details-count').textContent=String(currentDetails.length).padStart(2,'0')+' Details';list.scrollLeft=0;
    }
    function reveal(){clearTimeout(revealTimer);ov.classList.add('show');if(S[cur]&&S[cur].counters)countUp(ov,.9);}
    function resetVideo(){gen++;clearTimeout(mediaTimer);cancelAnimationFrame(matRaf);matRaf=0;matPaused=false;material?.hide();video.pause();video.classList.remove('on');playing=false;W.classList.remove('is-mobile-playing');playButton.textContent='↻';playButton.setAttribute('aria-label','Kamerafahrt abspielen');}
    function finish(token){if(!alive||token!==gen)return;setStill(cur);resetVideo();reveal();status.textContent='Seitlich wischen · den Raum entdecken';later(()=>preload(cur+1),600);}
    function materialTick(now){matRaf=0;if(!alive||cur!==matScene||covered||document.hidden||matPaused)return;
      matProgress=clamp((now-matStarted)/6200,0,1);material.present(matProgress);W.dataset.materialProgress=matProgress.toFixed(3);
      const phase=matProgress<.15?'Rohbau':matProgress<.35?'Technik':matProgress<.7?'Ausbau':'Möbel & Licht';if(status.textContent!==phase)status.textContent=phase;
      if(matProgress<1)matRaf=requestAnimationFrame(materialTick);else{playing=false;W.classList.remove('is-mobile-playing');playButton.textContent='↻';playButton.setAttribute('aria-label','Verwandlung wiederholen');status.textContent='Fertig. In Ruhe ansehen.';}
    }
    function playMaterial(){resetVideo();setStill(matScene);reveal();if(!material)return;const token=gen;status.textContent='Verwandlung wird vorbereitet …';matProgress=0;W.dataset.materialProgress='0';
      const begin=()=>{if(!alive||token!==gen||cur!==matScene||covered||document.hidden)return;clearTimeout(mediaTimer);material.present(0);playing=true;matPaused=false;W.classList.add('is-mobile-playing');playButton.textContent='Ⅱ';playButton.setAttribute('aria-label','Verwandlung pausieren');matStarted=performance.now();matRaf=requestAnimationFrame(materialTick);};
      if(material.mount(plane,begin))begin();else mediaTimer=setTimeout(()=>{if(token===gen){status.textContent='Bild bereit · Verwandlung erneut starten';playing=false;}},6500);
    }
    function playScene(i,dir=1,explicit=false){
      if(i===matScene){playMaterial();return;}
      resetVideo();const src=mediaURL(i,dir);if(!src||(!autoVideo&&!explicit)||document.hidden||covered){setStill(i);reveal();later(()=>preload(i+1),200);return;}
      W.dataset.videoFps=eco?'30':String(F.mobileVideo.fps||60);
      const token=gen;video.src=src;video.load();
      video.onplaying=()=>{if(token!==gen)return;clearTimeout(mediaTimer);mediaTimer=setTimeout(()=>finish(token),i===0?6500:4800);playing=true;status.textContent='Kamerafahrt · danach in Ruhe entdecken';W.classList.add('is-mobile-playing');video.classList.add('on');playButton.textContent='Ⅱ';playButton.setAttribute('aria-label','Kamerafahrt pausieren');setStill(i);};
      video.onended=()=>{if(token!==gen)return;const q=video.getVideoPlaybackQuality?.();
        // Bei nachhaltigen Decoder-Verlusten wird erst der NÄCHSTE Clip sparsamer, nie mitten in einer Fahrt.
        if(!eco&&q&&q.totalVideoFrames>=90&&q.droppedVideoFrames/q.totalVideoFrames>.12){eco=true;warmSrc='';}
        finish(token);};
      video.onerror=()=>{if(token!==gen)return;if(!eco&&F.mobileVideo.fallbackDir){eco=true;warmSrc='';playScene(i,dir,explicit);}else finish(token);};
      // Der Decoder darf bei schlechtem Netz nicht endlos auf Daten warten. Standbild und Beschriftung bleiben bedienbar.
      clearTimeout(mediaTimer);mediaTimer=setTimeout(()=>finish(token),2500);
      const p=video.play();if(p&&p.catch)p.catch(()=>finish(token));
      revealTimer=setTimeout(()=>{if(alive&&token===gen)reveal();},i===0?80:650);
    }
    function show(i,{explicit=false}={}){if(i===cur&&!explicit)return;const prev=cur,first=prev<0;resetVideo();clearTimeout(revealTimer);cur=i;W.dataset.scene=i;
      pan=focal[i]??.5;sizePan();
      loadStill(i);loadStill(i+1);fillScene(ov,S[i]);fillDetails(S[i]);ov.classList.remove('show');
      if(i===0){ov.querySelector('.w-kicker-t').textContent='Sechs Gewerke. Ein Ansprechpartner.';ov.querySelector('.w-d').textContent='Ihr Umbau. Klar geplant und sauber umgesetzt — bis zur Schlüsselübergabe.';}
      bar.querySelector('.m-tour-index').textContent=String(i+1).padStart(2,'0')+' / '+String(S.length).padStart(2,'0');bar.querySelector('.m-tour-room').textContent=S[i].navLabel;
      bar.querySelector('.m-tour-prev').disabled=i===0;const next=bar.querySelector('.m-tour-next');next.disabled=false;next.textContent=i===S.length-1?'↓':'→';next.setAttribute('aria-label',i===S.length-1?'Weiter zu Leistungen und Kontakt':'Nächster Raum');
      bar.querySelectorAll('[data-room]').forEach((b,k)=>{b.tabIndex=-1;b.setAttribute('aria-hidden','true');b.classList.toggle('visited',k<i);b.classList.toggle('current',k===i);if(k===i)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
      if(cmp)cmp.hidden=true;status.textContent='Raum entdecken · weiterwischen';delete W.dataset.materialProgress;
      if(i===matScene-1&&material)later(()=>material.mount(plane),600);
      const sig=W.querySelector('.w-sig');if(S[i].sig&&sig){[...sig.querySelectorAll('path')].forEach((p,k)=>{p.style.transition='none';p.style.strokeDashoffset='0';p.animate([{opacity:0},{opacity:1}],{duration:950,delay:450+k*110,fill:'backwards'});});}
      try{document.dispatchEvent(new CustomEvent('bs:event',{detail:{name:'tour_room',params:{room:S[i].room,index:i}}}));}catch(e){}
      const adjacent=Math.abs(i-prev)===1;
      if(first&&i===0){setStill(i);reveal();if(!introSeen&&autoVideo){introSeen=true;later(()=>{if(cur===0)playScene(0);},250);}else later(()=>preload(1),1000);}
      else if(i===matScene||explicit||adjacent){playScene(i,i<prev?-1:1,explicit);}
      else{setStill(i);reveal();later(()=>preload(i+1),800);}
    }
    function goto(i){i=clamp(i,0,rooms.length-1);if(i===cur)return;lockedTo=i;clearTimeout(lockTimer);
      const y=rooms[i].getBoundingClientRect().top+scrollY;window.scrollTo({top:y,behavior:'instant'});covered=false;W.classList.remove('is-covered');show(i,{explicit:true});
      lockTimer=setTimeout(()=>{lockedTo=-1;kick();},300);
    }
    const onBar=e=>{const b=e.target.closest('button');if(!b)return;
      if(b.dataset.room!=null)goto(+b.dataset.room);else if(b.classList.contains('m-tour-prev'))goto(cur-1);else if(b.classList.contains('m-tour-next')){if(cur===S.length-1)footer.querySelector('button').click();else goto(cur+1);}
      else if(b===playButton){if(playing){video.pause();playing=false;W.classList.remove('is-mobile-playing');playButton.textContent='▶';playButton.setAttribute('aria-label','Kamerafahrt fortsetzen');clearTimeout(mediaTimer);}
        else if(cur===matScene&&matPaused){matPaused=false;playing=true;W.classList.add('is-mobile-playing');playButton.textContent='Ⅱ';playButton.setAttribute('aria-label','Verwandlung pausieren');matStarted=performance.now()-matProgress*6200;matRaf=requestAnimationFrame(materialTick);}
        else if(video.classList.contains('on')&&video.currentTime>0&&!video.ended){video.play().catch(()=>finish(gen));mediaTimer=setTimeout(()=>finish(gen),6500);}
        else playScene(cur,1,true);}
      if(b===playButton&&cur===matScene&&!playing&&matProgress<1){cancelAnimationFrame(matRaf);matRaf=0;matPaused=true;playButton.setAttribute('aria-label','Verwandlung fortsetzen');}
    };
    const onDetail=e=>{const b=e.target.closest('[data-detail]');if(!b)return;const isOpen=b.getAttribute('aria-expanded')==='true';closeDetail();if(isOpen)return;
      const h=currentDetails[+b.dataset.detail];b.setAttribute('aria-expanded','true');card.innerHTML=`<button type="button" class="m-detail-close" aria-label="Detail schliessen">×</button><span class="m-detail-eyebrow">${S[cur].navLabel} · Detail ${+b.dataset.detail+1}</span><h3>${h.t}</h3><p>${h.l[0]||''}</p>${h.l[1]?`<p class="m-detail-sub">${h.l[1]}</p>`:''}${h.go?'<button type="button" class="m-detail-link">Mehr dazu <span aria-hidden="true">→</span></button>':''}`;card.hidden=false;
      card.querySelector('.m-detail-close').onclick=()=>closeDetail(true);const link=card.querySelector('.m-detail-link');if(link)link.onclick=()=>goRoute(h.go);
      card.showModal();card.querySelector('.m-detail-close').focus({preventScroll:true});
    };
    const onOutside=e=>{if(!details.contains(e.target))closeDetail();};
    const onKey=e=>{if(e.key==='Escape')closeDetail(true);};
    // Touch-Ende aktiviert Raumsteuerungen sofort; den verzögerten Kompatibilitätsklick nicht doppelt ausführen.
    let controlTouch=null,lastControl=null,lastControlTime=0;
    const controlDown=e=>{const b=e.target.closest('button');if(e.pointerType!=='touch'){controlTouch=null;lastControl=null;}else if(e.isPrimary&&b&&!b.disabled)controlTouch={b,x:e.clientX,y:e.clientY};};
    const controlUp=e=>{const t=controlTouch;controlTouch=null;if(!t||e.target.closest('button')!==t.b||Math.hypot(e.clientX-t.x,e.clientY-t.y)>12)return;e.preventDefault();lastControl=t.b;lastControlTime=performance.now();onBar(e);};
    const controlCancel=()=>{controlTouch=null;};
    const controlClick=e=>{if(e.detail>0&&e.target.closest('button')===lastControl&&performance.now()-lastControlTime<700){e.preventDefault();return;}onBar(e);};
    bar.addEventListener('pointerdown',controlDown);bar.addEventListener('pointerup',controlUp);bar.addEventListener('pointercancel',controlCancel);bar.addEventListener('click',controlClick);list.addEventListener('click',onDetail);document.addEventListener('click',onOutside);document.addEventListener('keydown',onKey);
    const start=W.querySelector('#wStart'),onStart=()=>goto(1);if(start)start.addEventListener('click',onStart);
    const hint=W.querySelector('#wScrollHint');if(hint){hint.classList.remove('hide');const t=hint.querySelector('span');if(t)t.textContent='Weiterwischen · Räume entdecken';}
    function render(){raf=0;if(!alive)return;const vh=innerHeight;let best=-1,dist=Infinity;
      rooms.forEach((r,i)=>{const b=r.getBoundingClientRect(),d=Math.abs(b.top+b.height*.4-vh*.5);if(b.top<vh*.6&&b.bottom>vh*.2&&d<dist){dist=d;best=i;}});
      const sheetTop=sheets[0].getBoundingClientRect().top,nextCovered=sheetTop<vh*.6;
      if(covered!==nextCovered){covered=nextCovered;W.classList.toggle('is-covered',covered);if(covered){resetVideo();setStill(cur);reveal();closeDetail();}else if(cur===matScene){if(matProgress>=1)material?.present(1);else playMaterial();}if(typeof syncNav==='function')syncNav();}
      if(lockedTo<0&&best>=0&&best!==cur)show(best);
      const fade=clamp((vh-sheetTop)/Math.max(1,vh*.4),0,1);stage.style.setProperty('--cov',fade.toFixed(3));stage.style.setProperty('--ovo',(1-fade).toFixed(3));
      const pinned=W.getBoundingClientRect().bottom>vh;W.classList.toggle('is-pinned',pinned);
      if(!covered&&rooms[cur]){const b=rooms[cur].getBoundingClientRect(),p=clamp(-b.top/Math.max(b.height,1),-.25,1);stage.style.setProperty('--m-drift',p.toFixed(3));}
      if(hint)hint.classList.toggle('hide',scrollY>80||cur!==0);
    }
    function kick(){if(!raf)raf=requestAnimationFrame(render);}
    const onVisibility=()=>{if(document.hidden){resetVideo();setStill(cur);reveal();}else{if(cur===matScene&&!covered){if(matProgress>=1)material?.present(1);else playMaterial();}kick();}};
    const onTouch=()=>{lockedTo=-1;clearTimeout(lockTimer);};
    let swipe=null;
    const swipeStart=e=>{if(e.pointerType==='touch'&&e.isPrimary&&!e.target.closest('button'))swipe={x:e.clientX,y:e.clientY,pan};};
    const swipeMove=e=>{if(!swipe||playing||!panRange)return;const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)){pan=clamp(swipe.pan-dx/panRange,0,1);if(!panRaf)panRaf=requestAnimationFrame(paintPan);}};
    const swipeEnd=e=>{if(!swipe)return;const dy=e.clientY-swipe.y,dx=e.clientX-swipe.x;swipe=null;if(Math.abs(dy)>40&&Math.abs(dy)>Math.abs(dx)){if(dy<0&&cur===S.length-1)footer.querySelector('button').click();else goto(cur+(dy<0?1:-1));}};
    const swipeCancel=()=>{swipe=null;};cam.addEventListener('pointerdown',swipeStart);cam.addEventListener('pointermove',swipeMove);cam.addEventListener('pointerup',swipeEnd);cam.addEventListener('pointercancel',swipeCancel);
    const onResize=()=>{if(wasPortrait!==portrait()){wasPortrait=portrait();resetVideo();setStill(cur);reveal();warmSrc='';later(()=>preload(cur+1),300);}kick();};
    addEventListener('scroll',kick,{passive:true});addEventListener('resize',onResize);document.addEventListener('visibilitychange',onVisibility);addEventListener('touchstart',onTouch,{passive:true});
    show(0);kick();
    return ()=>{alive=false;gen++;timers.forEach(clearTimeout);clearTimeout(lockTimer);clearTimeout(revealTimer);clearTimeout(mediaTimer);if(raf)cancelAnimationFrame(raf);
      video.onplaying=video.onended=video.onerror=null;for(const v of [video,warm]){v.pause();v.removeAttribute('src');v.load();v.remove();}
      cancelAnimationFrame(matRaf);material?.destroy();closeDetail();bar.remove();details.remove();footer.remove();expand.remove();preview.close();preview.remove();if(cmp)cmp.hidden=true;oldHot.hidden=false;
      cameraResize.disconnect();cancelAnimationFrame(panRaf);cam.append(...cameraChildren);plane.remove();cam.removeEventListener('pointerdown',swipeStart);cam.removeEventListener('pointermove',swipeMove);cam.removeEventListener('pointerup',swipeEnd);cam.removeEventListener('pointercancel',swipeCancel);
      bar.removeEventListener('pointerdown',controlDown);bar.removeEventListener('pointerup',controlUp);bar.removeEventListener('pointercancel',controlCancel);bar.removeEventListener('click',controlClick);
      extraSections.forEach(({section,box})=>{box.before(section);box.remove();});duplicateReviews.forEach(({review,hidden})=>{review.hidden=hidden;});disclosures.forEach(({sh,box,children})=>{children.forEach(child=>sh.append(child));box.remove();});flow.replaceChildren(...flowOrder);
      removeEventListener('scroll',kick);removeEventListener('resize',onResize);removeEventListener('touchstart',onTouch);document.removeEventListener('visibilitychange',onVisibility);document.removeEventListener('click',onOutside);document.removeEventListener('keydown',onKey);if(start)start.removeEventListener('click',onStart);
      delete W.dataset.materialProgress;W.classList.remove('is-lite','is-cinema','is-covered','is-pinned','is-mobile-playing');W.style.removeProperty('--reveal');};
  }
  window.MobileFilm={mount};
})();

/* MAISON DULCE 8.0 — one scroll timeline, quiet parallax, purposeful microinteractions.
   All behavior is additive and respects reduced motion, keyboard navigation and touch. */
(() => {
  'use strict';
  function start() {
    if (document.body.dataset.v8Ready === 'true') return;
    document.body.dataset.v8Ready = 'true';
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => Array.from(document.querySelectorAll(s));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const precisePointer = window.matchMedia('(hover:hover) and (pointer:fine)');
    const lowPower = Boolean(navigator.connection?.saveData);
    const smooth = () => !reduce.matches && !lowPower;
    const clamp = (v,a,b) => Math.max(a, Math.min(b,v));
    const chapters = [
      {id:'inicio',name:'Portada'},
      {id:'coleccion',name:'Colección'},
      {id:'historia',name:'Nuestra esencia'},
      {id:'pedidos',name:'Personaliza'}
    ];
    const sections = chapters.map(x => document.getElementById(x.id)).filter(Boolean);
    if (sections.length !== 4) return;

    // A small progress navigator gives context to an otherwise long cinematic page.
    const chapterNav = document.createElement('nav');
    chapterNav.className = 'v8-chapters';
    chapterNav.setAttribute('aria-label','Secciones de Maison Dulce');
    chapterNav.innerHTML = '<span class="v8-chapters__head">Explorar</span>' + chapters.map(c =>
      `<a class="v8-chapters__link" href="#${c.id}"><span class="v8-chapters__dot" aria-hidden="true"></span><span>${c.name}</span></a>`
    ).join('');
    document.body.appendChild(chapterNav);
    const navLinks = $$('.v8-chapters__link');
    const hero = $('#inicio'), story = $('#historia'), collection = $('#coleccion'), orders = $('#pedidos');
    const disc = $('.story-v6__art-disc'), outline = $('.story-v6__art-outline');
    const featureWord = $('.collection-feature__watermark');
    const orderArt = $('.order-panel__art img');
    const orderHalo = $('.order-experience');
    let raf = 0;
    let lastSection = -1;
    let lastY = -1;

    const active = (index) => {
      if(index === lastSection) return;
      lastSection = index;
      navLinks.forEach((node,i) => {
        if(i === index) node.setAttribute('aria-current','location');
        else node.removeAttribute('aria-current');
      });
      sections.forEach((section,i)=>section.classList.toggle('v8-chapter-active',i===index));
      const footer = $('.site-footer');
      if(footer) footer.classList.toggle('v8-chapter-active',index===3);
    };
    // Keep every computation in a single requestAnimationFrame; no perpetual loop.
    const render = () => {
      raf = 0;
      const y = window.scrollY;
      if(y === lastY && !smooth()) return;
      lastY = y;
      const middle = window.innerHeight * .45;
      let index = 0;
      const rects = sections.map(s=>s.getBoundingClientRect());
      for(let i=0;i<rects.length;i++) if(rects[i].top <= middle) index=i;
      active(index);
      const showNav = y > Math.min(300, hero.offsetHeight*.43);
      chapterNav.classList.toggle('is-visible',showNav);
      if (!smooth()) {
        if(disc) disc.style.removeProperty('--v8-disc-drift');
        if(outline) outline.style.removeProperty('--v8-type-drift');
        if(featureWord) featureWord.style.removeProperty('--v8-collection-drift');
        if(orderHalo) orderHalo.style.removeProperty('--v8-order-drift');
        if(orderArt) orderArt.style.removeProperty('--v8-order-cake-drift');
        return;
      }
      const centered = (r) => clamp((middle-(r.top+r.height*.5))/Math.max(r.height,1),-1,1);
      const c = centered(rects[1]), s = centered(rects[2]), o = centered(rects[3]);
      const strength = window.innerWidth < 700 ? .48 : 1;
      if(featureWord) featureWord.style.setProperty('--v8-collection-drift',`${(c*22*strength).toFixed(2)}px`);
      if(disc) disc.style.setProperty('--v8-disc-drift',`${(s*-25*strength).toFixed(2)}px`);
      if(outline) outline.style.setProperty('--v8-type-drift',`${(s*15*strength).toFixed(2)}px`);
      if(orderHalo) orderHalo.style.setProperty('--v8-order-drift',`${(o*18*strength).toFixed(2)}px`);
      if(orderArt) orderArt.style.setProperty('--v8-order-cake-drift',`${(o*-16*strength).toFixed(2)}px`);
    };
    const schedule = () => { if(!raf) raf = window.requestAnimationFrame(render); };
    document.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();},{passive:true});
    reduce.addEventListener?.('change',schedule);
    schedule();

    // Headline masking, only after the observer is installed. It never hides content
    // for people requesting reduced motion or browsers without IntersectionObserver.
    const headings = $$('.collection-intro__title, .collection-browse__heading, .story-v6__lead h2, .order-lead h2');
    if('IntersectionObserver' in window && smooth()) {
      const headingObserver = new IntersectionObserver(entries => {
        for(const entry of entries){
          if(entry.isIntersecting){ entry.target.classList.add('v8-seen'); headingObserver.unobserve(entry.target); }
        }
      },{rootMargin:'0px 0px -3% 0px',threshold:.08});
      headings.forEach(h=>{h.classList.add('v8-heading');headingObserver.observe(h)});
      document.body.classList.add('v8-motion-on');
    }

    // On desktop, the spotlight follows the pointer without changing image sharpness.
    const spotlights = $$('.collection-card__picture, .story-v6__card-art, .order-panel');
    const magnetics = $$('.collection-feature__cta, .light-button, .ghost-light-button, .footer-back, .collection-card__add');
    let finePointerInitialized = false;
    function initFinePointer(){
      if(finePointerInitialized || !precisePointer.matches || !smooth())return;
      finePointerInitialized = true;
      spotlights.forEach(el=>{
        let pending = 0, ex=50,ey=50;
        el.addEventListener('pointermove',e=>{
          if(e.pointerType!=='mouse')return;
          const r=el.getBoundingClientRect();
          ex=clamp((e.clientX-r.left)/r.width*100,0,100);ey=clamp((e.clientY-r.top)/r.height*100,0,100);
          if(!pending)pending=requestAnimationFrame(()=>{pending=0;el.style.setProperty('--v8-px',ex+'%');el.style.setProperty('--v8-py',ey+'%');});
        },{passive:true});
        el.addEventListener('pointerleave',()=>{el.style.removeProperty('--v8-px');el.style.removeProperty('--v8-py')},{passive:true});
      });
      magnetics.forEach(el=>{
        el.classList.add('v8-magnetic');
        el.addEventListener('pointermove',e=>{
          if(e.pointerType!=='mouse')return;
          const r=el.getBoundingClientRect();
          const dx=clamp((e.clientX-r.left-r.width/2)/r.width,-.5,.5);
          const dy=clamp((e.clientY-r.top-r.height/2)/r.height,-.5,.5);
          el.style.setProperty('--v8-mx',(dx*12).toFixed(1)+'px');
          el.style.setProperty('--v8-my',(dy*8).toFixed(1)+'px');
        },{passive:true});
        el.addEventListener('pointerleave',()=>{el.style.removeProperty('--v8-mx');el.style.removeProperty('--v8-my')},{passive:true});
      });
    }
    initFinePointer();
    precisePointer.addEventListener?.('change',initFinePointer);

    // A tiny physical response on CTA activation, with no event interception.
    const rippleTargets = $$('.collection-feature__cta, .light-button, .ghost-light-button, .footer-back, .collection-card__add');
    rippleTargets.forEach(btn=>{
      btn.classList.add('v8-ripple-container');
      btn.addEventListener('pointerdown',e=>{
        if(!smooth() || e.pointerType==='touch') return;
        const rect=btn.getBoundingClientRect();
        const ripple=document.createElement('span');
        ripple.className='v8-ripple';ripple.setAttribute('aria-hidden','true');
        ripple.style.setProperty('--v8-rx',(e.clientX-rect.left)+'px');
        ripple.style.setProperty('--v8-ry',(e.clientY-rect.top)+'px');
        btn.appendChild(ripple);
        ripple.addEventListener('animationend',()=>ripple.remove(),{once:true});
      },{passive:true});
    });
    // Rebuild active state when the user moves through anchors via keyboard.
    chapterNav.addEventListener('click',e=>{
      const link=e.target.closest('a[href^="#"]');
      if(link) requestAnimationFrame(schedule);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();

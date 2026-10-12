/* Chololoy — tiny progressive enhancement (no framework, no libraries).
   v1.4: content is visible without JS; JS only adds motion. Scroll work is rAF-throttled and passive. */
(function(){
  var d=document,w=window; d.documentElement.classList.add('js'); d.documentElement.classList.remove('no-js');
  var RM=w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SDA=!!(w.CSS&&CSS.supports&&CSS.supports('animation-timeline: view()'));
  var header=d.querySelector('.site-header'),n=d.getElementById('site-nav');
  if(header){
    /* sticky header: hairline once scrolled; slides away while scrolling down, back on the first scroll up */
    var lastY=w.scrollY,hid=false,tick=false;
    var onS=function(){tick=false;var y=w.scrollY;header.classList.toggle('is-stuck',y>8);
      if(!RM){var open=n&&n.classList.contains('is-open');
        if(y>lastY+6&&y>180&&!hid&&!open){hid=true;header.classList.add('is-hidden')}
        else if((y<lastY-6||y<180)&&hid){hid=false;header.classList.remove('is-hidden')}}
      lastY=y};
    onS();w.addEventListener('scroll',function(){if(!tick){tick=true;w.requestAnimationFrame(onS)}},{passive:true});
    header.addEventListener('focusin',function(){hid=false;header.classList.remove('is-hidden')});
  }
  var t=d.querySelector('.menu-toggle');
  if(t&&n){t.addEventListener('click',function(){var o=n.classList.toggle('is-open');t.setAttribute('aria-expanded',o)})}
  /* reveals: with CSS scroll-driven animations nothing is hidden by JS at all. Otherwise only elements that
     start BELOW the fold get .rv-wait (hidden) and fade in when they arrive — the first screen is never hidden. */
  var els=d.querySelectorAll('.reveal');
  if('IntersectionObserver' in w){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -6% 0px',threshold:.01});
    var vh=w.innerHeight,wait=[];
    if(!RM&&!SDA) els.forEach(function(el){if(el.getBoundingClientRect().top>vh) wait.push(el)});
    wait.forEach(function(el){el.classList.add('rv-wait')});
    els.forEach(function(el){io.observe(el)});
  } else els.forEach(function(el){el.classList.add('is-in')});
  d.querySelectorAll('[data-filters]').forEach(function(bar){
    var grid=d.getElementById(bar.getAttribute('data-filters'));
    bar.addEventListener('click',function(ev){
      var b=ev.target.closest('button'); if(!b) return;
      bar.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',x===b)});
      var f=b.getAttribute('data-filter');
      grid.querySelectorAll('[data-cat]').forEach(function(c){c.hidden=!(f==='all'||c.getAttribute('data-cat').split(' ').indexOf(f)>-1)});
    });
  });
  d.querySelectorAll('[data-preview-form]').forEach(function(f){
    f.addEventListener('submit',function(e){e.preventDefault();var m=f.querySelector('.form-msg');if(m){m.hidden=false;m.scrollIntoView({block:'center',behavior:'smooth'})}});
  });
})();
/* product: variant pills, gallery, qty */
(function(){
  var d=document;
  d.querySelectorAll('[data-qty]').forEach(function(b){b.addEventListener('click',function(){var i=b.parentNode.querySelector('input');var v=Math.max(1,(parseInt(i.value,10)||1)+parseInt(b.getAttribute('data-qty'),10));i.value=Math.min(v,99);i.classList.remove('is-bump');void i.offsetWidth;i.classList.add('is-bump')})});
  d.querySelectorAll('[data-product]').forEach(function(root){
    var show=function(id){root.querySelectorAll('[data-media-id]').forEach(function(f){f.hidden=String(f.getAttribute('data-media-id'))!==String(id)});root.querySelectorAll('[data-thumb]').forEach(function(t){t.setAttribute('aria-pressed',String(t.getAttribute('data-thumb'))===String(id))})};
    root.querySelectorAll('[data-thumb]').forEach(function(t){t.addEventListener('click',function(){show(t.getAttribute('data-thumb'))})});
    var form=root.querySelector('[data-product-form]'); if(!form) return;
    var vj=form.querySelector('[data-variants]'),sj=form.querySelector('[data-strings]'); if(!vj) return;
    var variants=JSON.parse(vj.textContent),S=sj?JSON.parse(sj.textContent):{};
    var idIn=form.querySelector('[data-variant-id]'),atc=form.querySelector('[data-atc]'),lab=form.querySelector('[data-atc-label]'),pv=root.querySelector('[data-price-value]');
    form.addEventListener('change',function(e){
      if(!e.target.hasAttribute('data-option')) return;
      var sel=[];form.querySelectorAll('[data-option]:checked').forEach(function(r){sel[parseInt(r.getAttribute('data-option'),10)-1]=r.value});
      var v=variants.find(function(x){return x.options.every(function(o,i){return o===sel[i]})});
      if(!v){atc.disabled=true;lab.textContent=S.unavailable||'';return}
      idIn.value=v.id; atc.disabled=!v.available; lab.textContent=v.available?S.add:S.sold;
      if(pv) pv.textContent=v.price;
      if(v.media) show(v.media);
      if(history.replaceState){var u=new URL(location.href);u.searchParams.set('variant',v.id);history.replaceState({},'',u)}
    });
  });
})();
/* AJAX add to cart with confirmation + recipe search */
(function(){
  var d=document;
  d.querySelectorAll('[data-product-form]').forEach(function(form){
    if(!window.fetch||!window.FormData) return;
    var sj=form.querySelector('[data-strings]'),S=sj?JSON.parse(sj.textContent):{};
    var atc=form.querySelector('[data-atc]'),lab=form.querySelector('[data-atc-label]'),st=form.querySelector('[data-status]');
    form.addEventListener('submit',function(e){
      if(!S.add_url) return; e.preventDefault(); atc.disabled=true; atc.classList.add('is-busy');
      fetch(S.add_url+'.js',{method:'POST',headers:{'Accept':'application/json'},body:new FormData(form)})
        .then(function(r){if(!r.ok) throw r; return fetch(S.cart_url+'.js',{headers:{'Accept':'application/json'}})})
        .then(function(r){return r.json()})
        .then(function(cart){
          var link=d.querySelector('.cart-link');
          if(link){var c=link.querySelector('.cart-link__count');if(!c){c=d.createElement('span');c.className='cart-link__count';link.appendChild(c)}c.textContent=cart.item_count;link.classList.remove('is-bump');void link.offsetWidth;link.classList.add('is-bump')}
          atc.classList.add('is-added'); lab.textContent=S.added;
          if(st) st.innerHTML='<a href="'+S.cart_url+'">'+S.view_cart+' →</a>';
          setTimeout(function(){atc.classList.remove('is-added');lab.textContent=S.add},2600);
        })
        .catch(function(){if(st) st.textContent=S.error})
        .then(function(){atc.disabled=false;atc.classList.remove('is-busy')});
    });
  });
  var fold=function(s){return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')};
  d.querySelectorAll('[data-recipe-search]').forEach(function(inp){
    var grid=d.getElementById(inp.getAttribute('data-recipe-search')); if(!grid) return;
    var empty=inp.parentNode.querySelector('[data-recipe-empty]');
    inp.addEventListener('input',function(){
      var q=fold(inp.value.trim()),n=0;
      var bar=d.querySelector('[data-filters="'+grid.id+'"]');
      if(bar&&q){bar.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',x.getAttribute('data-filter')==='all')})}
      grid.querySelectorAll('[data-search]').forEach(function(c){var ok=!q||fold(c.getAttribute('data-search')).indexOf(q)>-1;c.hidden=!ok;if(ok){n++;c.classList.add('is-in')}});
      if(empty) empty.hidden=n>0;
    });
  });
})();
/* v1.2 kinetic layer: split text, scroll-lit quote, odometer, velocity marquee, cursor label, magnetic buttons.
   Vanilla, ~3 KB. Everything is skipped when the visitor prefers reduced motion. */
(function(){
  var d=document,w=window;
  var RM=w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE=w.matchMedia&&w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if(RM) return;
  d.documentElement.classList.add('kinetic');
  /* split words, keeping inline markup such as <em> */
  function split(el){
    var n=0,walk=function(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(c){
        if(c.nodeType===3){
          var parts=c.textContent.split(/(\s+)/),f=d.createDocumentFragment();
          parts.forEach(function(p){
            if(!p) return;
            if(/^\s+$/.test(p)){f.appendChild(d.createTextNode(' '));return}
            var o=d.createElement('span');o.className='w';var i=d.createElement('span');i.className='w__i';i.style.setProperty('--i',n++);i.textContent=p;o.appendChild(i);f.appendChild(o);
          });
          c.parentNode.replaceChild(f,c);
        } else if(c.nodeType===1&&c.tagName!=='BR'&&c.tagName!=='SUP') walk(c);
      });
    };
    walk(el); el.classList.add('is-split'); return n;
  }
  /* v1.4: only headings that start below the fold are split (never the hero H1 / LCP text) */
  var vh0=w.innerHeight;
  d.querySelectorAll('[data-split]').forEach(function(el){if(el.getAttribute('data-split')==='scrub'||el.getBoundingClientRect().top>vh0) split(el)});
  var rafOnce=function(fn){var q=false;return function(){if(!q){q=true;w.requestAnimationFrame(function(){q=false;fn()})}}};
  /* scroll-lit quote: words light up as it crosses the viewport */
  var scrubs=[].slice.call(d.querySelectorAll('[data-split="scrub"]')).map(function(el){return{el:el,ws:el.querySelectorAll('.w'),lit:-1}});
  function scrub(){
    var vh=w.innerHeight;
    scrubs.forEach(function(s){
      var r=s.el.getBoundingClientRect(); if(r.bottom<0||r.top>vh) return;
      var p=Math.min(1,Math.max(0,(vh*.85-r.top)/(vh*.55))),k=Math.round(p*s.ws.length);
      if(k===s.lit) return; s.lit=k;
      for(var i=0;i<s.ws.length;i++) s.ws[i].classList.toggle('is-lit',i<k);
    });
  }
  if(scrubs.length){scrub();w.addEventListener('scroll',rafOnce(scrub),{passive:true});w.addEventListener('resize',rafOnce(scrub))}
  /* odometer digits for numeric stats */
  d.querySelectorAll('[data-odometer]').forEach(function(el){
    var t=el.firstChild; if(!t||t.nodeType!==3) return;
    var val=t.textContent.trim(); if(!/^\d+$/.test(val)) return;
    var vis=d.createElement('span');vis.className='odo';vis.setAttribute('aria-hidden','true');
    val.split('').forEach(function(ch,i){
      var dg=d.createElement('span');dg.className='odo__d';var s=d.createElement('span');s.className='odo__s';
      s.style.setProperty('--d',ch);s.style.setProperty('--i',i);
      for(var k=0;k<10;k++){var x=d.createElement('span');x.textContent=k;s.appendChild(x)}
      var ph=d.createElement('span');ph.className='odo__ph';ph.textContent=ch;
      dg.appendChild(ph);dg.appendChild(s);vis.appendChild(dg);
    });
    var sr=d.createElement('span');sr.className='visually-hidden';sr.textContent=val;
    el.replaceChild(vis,t);el.insertBefore(sr,vis);
  });
  /* marquee: drifts constantly, speeds up and flips direction with scroll */
  d.querySelectorAll('[data-marquee]').forEach(function(m){
    var tr=m.querySelector('.marquee__track'),g=m.querySelector('.marquee__group'); if(!tr||!g) return;
    var x=0,dir=1,vel=0,lastY=w.scrollY,on=false,raf=0,W=g.offsetWidth;
    w.addEventListener('resize',function(){W=g.offsetWidth});
    w.addEventListener('scroll',function(){var y=w.scrollY,dy=y-lastY;lastY=y;if(Math.abs(dy)>1)dir=dy>0?1:-1;vel=Math.min(40,vel+Math.abs(dy)*.25)},{passive:true});
    function tick(){
      vel*=.92; x-= (0.6+vel*0.35)*dir;
      if(W){if(x<=-W)x+=W;if(x>0)x-=W}
      tr.style.transform='translate3d('+x+'px,0,0)';
      m.style.setProperty('--skew',(Math.min(vel,24)*dir*-.25).toFixed(2)+'deg');
      raf=on?w.requestAnimationFrame(tick):0;
    }
    if('IntersectionObserver' in w){new IntersectionObserver(function(es){on=es[0].isIntersecting;if(on&&!raf)raf=w.requestAnimationFrame(tick)}).observe(m)}
    else{on=true;tick()}
  });
  /* v1.5 ritual story spoon: pour handled via [data-ritual-story] + chololoy:slide (see slider below) */
  if(!FINE) return;
  /* cursor-follow label on recipe cards */
  var targets=d.querySelectorAll('[data-cursor]');
  if(targets.length){
    var lab=d.createElement('div');lab.className='cursor-label';lab.setAttribute('aria-hidden','true');d.body.appendChild(lab);
    var cx=0,cy=0,tx=0,ty=0,run=false;
    var loop=function(){cx+=(tx-cx)*.2;cy+=(ty-cy)*.2;lab.style.transform='translate3d('+cx.toFixed(1)+'px,'+cy.toFixed(1)+'px,0)';if(Math.abs(tx-cx)+Math.abs(ty-cy)>.3)w.requestAnimationFrame(loop);else run=false};
    d.addEventListener('pointermove',function(e){tx=e.clientX;ty=e.clientY;if(!run){run=true;w.requestAnimationFrame(loop)}},{passive:true});
    targets.forEach(function(t){
      t.addEventListener('pointerenter',function(e){lab.textContent=t.getAttribute('data-cursor');if(!lab.classList.contains('is-on')){cx=tx=e.clientX;cy=ty=e.clientY}lab.classList.add('is-on')});
      t.addEventListener('pointerleave',function(){lab.classList.remove('is-on')});
    });
  }
  /* recipe / product cards: gentle 3D tilt that follows the pointer (desktop only, transform only) */
  d.querySelectorAll('.card,.pcard').forEach(function(c){
    var m=c.querySelector('.card__media,.pcard__media');if(!m)return;var rx=0,ry=0,q=0;
    c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();ry=((e.clientX-r.left)/r.width-.5)*7;rx=-((e.clientY-r.top)/r.height-.5)*7;
      if(!q)q=w.requestAnimationFrame(function(){q=0;m.style.transform='perspective(900px) rotateX('+rx.toFixed(2)+'deg) rotateY('+ry.toFixed(2)+'deg)'})});
    c.addEventListener('pointerleave',function(){if(q){w.cancelAnimationFrame(q);q=0}m.style.transform=''});
  });
  /* magnetic buttons */
  d.querySelectorAll('.btn,.link-arrow').forEach(function(b){
    b.classList.add('is-magnetic');
    b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();b.style.translate=((e.clientX-r.left-r.width/2)*.22).toFixed(1)+'px '+((e.clientY-r.top-r.height/2)*.35).toFixed(1)+'px'});
    b.addEventListener('pointerleave',function(){b.style.translate=''});
  });
})();
/* v1.3 layer: quote slider, size switch, product tabs, sticky add-to-cart, filter counts, pairing tap */
(function(){
  var d=document,w=window;
  var RM=w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* quote slider (native scroll-snap; buttons, dots, counter, autoplay paused on hover/focus/offscreen) */
  d.querySelectorAll('[data-slider]').forEach(function(s){
    var tr=s.querySelector('[data-track]'),sl=[].slice.call(s.querySelectorAll('[data-slide]')),dots=s.querySelectorAll('[data-dot]'),idx=s.querySelector('[data-idx]'),cur=0,timer=0,hold=false,vis=false;
    if(!tr||!sl.length) return;
    function mark(i){var prev=cur;cur=i;if(idx)idx.textContent=i+1;dots.forEach(function(x,k){x.classList.toggle('is-on',k===i)});sl.forEach(function(x,k){x.classList.toggle('is-on',k===i)});if(prev!==i){var n=sl.length,fwd=(i===(prev+1)%n),back=(i===(prev-1+n)%n),dir=fwd?1:back?-1:(i>prev?1:-1);try{s.dispatchEvent(new CustomEvent('chololoy:slide',{detail:{index:i,prev:prev,dir:dir}}))}catch(e){}}}
    function go(i){i=(i+sl.length)%sl.length;tr.scrollTo({left:sl[i].offsetLeft-tr.offsetLeft,behavior:RM?'auto':'smooth'});mark(i)}
    var pb=s.querySelector('[data-prev]'),nb=s.querySelector('[data-next]');
    if(pb)pb.addEventListener('click',function(){go(cur-1)});
    if(nb)nb.addEventListener('click',function(){go(cur+1)});
    tr.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();go(cur+1)}if(e.key==='ArrowLeft'){e.preventDefault();go(cur-1)}});
    var st=0;tr.addEventListener('scroll',function(){clearTimeout(st);st=setTimeout(function(){var x=tr.scrollLeft,b=0,bd=1e9;sl.forEach(function(el,k){var dd=Math.abs(el.offsetLeft-tr.offsetLeft-x);if(dd<bd){bd=dd;b=k}});mark(b)},80)},{passive:true});
    mark(0);
    var ms=parseInt(s.getAttribute('data-autoplay'),10);
    if(ms&&!RM&&sl.length>1){
      ['pointerenter','focusin'].forEach(function(ev){s.addEventListener(ev,function(){hold=true})});
      ['pointerleave','focusout'].forEach(function(ev){s.addEventListener(ev,function(){hold=false})});
      if('IntersectionObserver' in w) new IntersectionObserver(function(es){vis=es[0].isIntersecting}).observe(s); else vis=true;
      timer=setInterval(function(){if(!hold&&vis&&!d.hidden)go(cur+1)},ms);
    }
  });

  /* v1.5.0 · ritual story spoon (no bowl): each swipe/arrow RIGHT tips the spoon and pours Chololoy powder over the banner */
  d.querySelectorAll('[data-ritual-story]').forEach(function(r){
    var pourTimer=0;
    function pour(){
      if(RM) return;
      r.classList.remove('is-pouring');
      void r.offsetWidth;
      r.classList.add('is-pouring');
      clearTimeout(pourTimer);
      pourTimer=setTimeout(function(){r.classList.remove('is-pouring')},2000);
    }
    r.addEventListener('chololoy:slide',function(e){
      var dt=e.detail||{};
      if(dt.dir>0) pour();
    });
  });

  /* shop by size: audience switch */
  d.querySelectorAll('[data-sizes]').forEach(function(s){
    s.addEventListener('click',function(e){
      var b=e.target.closest('[data-size-filter]');if(!b)return;
      var f=b.getAttribute('data-size-filter');
      s.querySelectorAll('[data-size-filter]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});
      s.querySelectorAll('[data-for]').forEach(function(c){var a=c.getAttribute('data-for');c.classList.toggle('is-dim',!(f==='all'||a==='both'||a===f))});
    });
  });
  /* product info tabs with sliding ink + arrow keys */
  d.querySelectorAll('[data-tabs]').forEach(function(t){
    var tabs=[].slice.call(t.querySelectorAll('[role="tab"]')),ink=t.querySelector('.ptabs__ink');
    function ink2(b){if(ink&&b){ink.style.width=b.offsetWidth+'px';ink.style.transform='translateX('+b.offsetLeft+'px)'}}
    function sel(b,focus){tabs.forEach(function(x){var on=x===b;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;var p=d.getElementById(x.getAttribute('aria-controls'));if(p)p.hidden=!on});ink2(b);if(focus)b.focus()}
    tabs.forEach(function(b,i){
      b.addEventListener('click',function(){sel(b)});
      b.addEventListener('keydown',function(e){var k=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(k){e.preventDefault();sel(tabs[(i+k+tabs.length)%tabs.length],true)}});
    });
    var first=tabs.filter(function(x){return x.getAttribute('aria-selected')==='true'})[0]||tabs[0];
    ink2(first);w.addEventListener('resize',function(){ink2(tabs.filter(function(x){return x.getAttribute('aria-selected')==='true'})[0])});
  });
  /* sticky add-to-cart: shows once the main button scrolls away */
  d.querySelectorAll('[data-sticky-atc]').forEach(function(bar){
    var root=bar.closest('section'),form=root&&root.querySelector('[data-product-form]'),atc=form&&form.querySelector('[data-atc]'),go=bar.querySelector('[data-sticky-go]');
    if(!form||!atc||!('IntersectionObserver' in w)) return;
    var foot=d.querySelector('.footer'),atcGone=false,footIn=false;
    function upd(){var on=atcGone&&!footIn;bar.classList.toggle('is-on',on);bar.setAttribute('aria-hidden',!on);go.tabIndex=on?0:-1}
    new IntersectionObserver(function(es){atcGone=!es[0].isIntersecting&&es[0].boundingClientRect.top<0;upd()}).observe(atc);
    if(foot) new IntersectionObserver(function(es){footIn=es[0].isIntersecting;upd()}).observe(foot);
    go.addEventListener('click',function(){if(form.requestSubmit)form.requestSubmit(atc);else atc.click()});
    form.addEventListener('change',function(){
      var sel=[];form.querySelectorAll('[data-option]:checked').forEach(function(r){sel.push(r.value)});
      var v=bar.querySelector('[data-sticky-variant]'),pv=root.querySelector('[data-price-value]');
      if(v&&sel.length){v.innerHTML='';v.appendChild(d.createTextNode(sel.join(' / ')));if(pv){v.appendChild(d.createTextNode(' · '+pv.textContent))}}
      go.disabled=atc.disabled;
    });
  });
  /* filter chips: counts, staggered re-entry, remembered in the URL hash */
  d.querySelectorAll('[data-filters]').forEach(function(bar){
    var grid=d.getElementById(bar.getAttribute('data-filters'));if(!grid)return;
    var items=[].slice.call(grid.querySelectorAll('[data-cat]'));
    bar.querySelectorAll('button').forEach(function(b){
      var f=b.getAttribute('data-filter'),n=f==='all'?items.length:items.filter(function(c){return c.getAttribute('data-cat').split(' ').indexOf(f)>-1}).length;
      var s=d.createElement('sup');s.className='filters__n';s.textContent=n;b.appendChild(s);
    });
    bar.addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b)return;
      var k=0;items.forEach(function(c){if(!c.hidden){c.classList.remove('is-pop');void c.offsetWidth;c.style.setProperty('--k',k++);c.classList.add('is-pop','is-in')}});
      if(grid.id==='recipe-grid'&&history.replaceState){var f=b.getAttribute('data-filter');history.replaceState(null,'',f==='all'?location.pathname+location.search:'#'+f)}
    });
    if(grid.id==='recipe-grid'&&location.hash.length>1){var hb=bar.querySelector('[data-filter="'+location.hash.slice(1).replace(/[^a-z0-9-]/gi,'')+'"]');if(hb)hb.click()}
  });
  /* pairing tiles: first tap flips on touch screens, second tap follows the link */
  if(!(w.matchMedia&&w.matchMedia('(hover: hover)').matches)){
    d.querySelectorAll('.pair__inner').forEach(function(a){a.addEventListener('click',function(e){if(!a.classList.contains('is-flip')){e.preventDefault();d.querySelectorAll('.pair__inner.is-flip').forEach(function(x){x.classList.remove('is-flip')});a.classList.add('is-flip')}})});
  }

  /* v1.5 story video: poster first, load media only on play */
  d.querySelectorAll('[data-story-video]').forEach(function(frame){
    var btn=frame.querySelector('[data-story-video-play]');
    var tpl=frame.querySelector('template');
    if(!btn||!tpl) return;
    btn.addEventListener('click',function(){
      var node=tpl.content.cloneNode(true);
      var poster=frame.querySelector('.story-video__poster, img');
      if(poster) poster.remove();
      btn.remove();
      frame.appendChild(node);
      var v=frame.querySelector('video');
      if(v){ try{v.play()}catch(e){} }
    });
  });
})();
/* v1.6 · Recipe video reel + recipe-page video. Performance contract:
   - preview <video>s get their src only when a card is ~300px from the viewport (preload="none" until then);
   - previews play only while ≥60% visible (max 4 desktop / 1 phone) and pause off-screen, in hidden tabs and under the modal;
   - no autoplay at all with prefers-reduced-motion, Save-Data or 2G;
   - the full MP4 is attached only when the player opens and detached (download aborted) when it closes. */
(function(){
  var d=document,w=window;
  var RM=w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cn=navigator.connection||{};
  var AUTO=!RM&&!cn.saveData&&!/(^|-)2g$/.test(cn.effectiveType||'');
  var mqPhone=w.matchMedia('(max-width:700px)');
  var HOVER=w.matchMedia('(hover:hover)').matches;
  var pad=function(n){return(n<10?'0':'')+n};

  d.querySelectorAll('[data-rv]').forEach(function(root){
    var track=root.querySelector('[data-rv-track]'); if(!track) return;
    var cards=[].slice.call(root.querySelectorAll('[data-rv-card]'));
    var modal=root.querySelector('[data-rv-modal]'),mv=root.querySelector('[data-rv-video]');
    var bar=root.querySelector('[data-rv-bar]'),cur=root.querySelector('[data-rv-current]'),hint=root.querySelector('[data-rv-hint]');
    var nav=root.querySelector('[data-rv-nav]'),prev=root.querySelector('[data-rv-prev]'),next=root.querySelector('[data-rv-next]');
    var ratios=new Map(),hovered=null,modalOpen=false,idx=0;

    /* ---------- previews ---------- */
    var vidOf=function(c){return c.querySelector('.rv-card__preview')};
    var attach=function(c){var v=vidOf(c);if(v&&!v.src&&v.dataset.src){v.src=v.dataset.src}};
    var play=function(c){var v=vidOf(c);if(!v)return;attach(c);
      if(!v._b){v._b=1;v.addEventListener('playing',function(){c.classList.add('is-playing')});v.addEventListener('pause',function(){c.classList.remove('is-playing')})}
      if(v.paused){var p=v.play();if(p&&p.catch)p.catch(function(){})}};
    var stop=function(c){var v=vidOf(c);if(v&&!v.paused)v.pause()};
    var sync=function(){
      if(!AUTO||modalOpen||d.hidden){cards.forEach(stop);return}
      var cap=mqPhone.matches?1:4,on=[];
      cards.map(function(c){return[c,ratios.get(c)||0]}).filter(function(x){return x[1]>=.6})
        .sort(function(a,b){return b[1]-a[1]}).slice(0,cap).forEach(function(x){on.push(x[0])});
      if(hovered&&on.indexOf(hovered)<0)on.push(hovered);
      cards.forEach(function(c){on.indexOf(c)>-1?play(c):stop(c)});
    };
    if('IntersectionObserver' in w){
      if(AUTO){
        var near=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){attach(e.target);near.unobserve(e.target)}})},{rootMargin:'300px'});
        var vis=new IntersectionObserver(function(es){es.forEach(function(e){ratios.set(e.target,e.isIntersecting?e.intersectionRatio:0)});sync()},{threshold:[0,.6,.9]});
        cards.forEach(function(c){if(vidOf(c)){near.observe(c);vis.observe(c)}});
      }
    }
    if(AUTO&&HOVER){cards.forEach(function(c){
      c.addEventListener('mouseenter',function(){hovered=c;sync()});
      c.addEventListener('mouseleave',function(){if(hovered===c)hovered=null;sync()});
    })}
    d.addEventListener('visibilitychange',sync);

    /* ---------- rail: counter, progress, arrows, hint ---------- */
    var step=function(){var it=track.children[0];if(!it)return 1;var g=parseFloat(getComputedStyle(track).columnGap)||0;return it.getBoundingClientRect().width+g};
    var tick=false;
    var onScroll=function(){tick=false;
      var max=track.scrollWidth-track.clientWidth,x=track.scrollLeft,p=max>0?x/max:1;
      var f=Math.min(1,track.clientWidth/track.scrollWidth);
      if(bar)bar.style.transform='scaleX('+(f+(1-f)*p).toFixed(4)+')';
      var i=Math.round(x/step());
      i=Math.max(0,Math.min(cards.length-1,p>.995?cards.length-1:i));
      if(cur)cur.textContent=pad(i+1);
      if(nav){nav.hidden=max<4;if(prev)prev.disabled=x<4;if(next)next.disabled=x>max-4}
    };
    track.addEventListener('scroll',function(){if(!tick){tick=true;w.requestAnimationFrame(onScroll)}
      if(hint&&!hint.classList.contains('is-gone'))hint.classList.add('is-gone')},{passive:true});
    w.addEventListener('resize',function(){w.requestAnimationFrame(onScroll)},{passive:true});
    onScroll();
    var by=function(dir){var s=step(),n=Math.max(1,Math.floor(track.clientWidth/s)-1);track.scrollBy({left:dir*s*n,behavior:RM?'auto':'smooth'})};
    if(prev)prev.addEventListener('click',function(){by(-1)});
    if(next)next.addEventListener('click',function(){by(1)});

    /* ---------- modal player ---------- */
    if(!modal||!mv||typeof modal.showModal!=='function') return; /* old browsers: the card link opens the MP4 directly */
    var mt=modal.querySelector('[data-rv-m-title]'),mm=modal.querySelector('[data-rv-m-meta]'),ml=modal.querySelector('[data-rv-m-link]');
    var mp=modal.querySelector('[data-rv-mprev]'),mn=modal.querySelector('[data-rv-mnext]');
    var lastFocus=null;
    var load=function(i){
      idx=(i+cards.length)%cards.length;var c=cards[idx];
      mt.textContent=c.dataset.title||'';mm.textContent=c.dataset.meta||'';mm.hidden=!c.dataset.meta;
      if(c.dataset.recipe){ml.href=c.dataset.recipe;ml.hidden=false}else ml.hidden=true;
      var po=c.querySelector('.rv-card__poster');mv.poster=po?(po.currentSrc||po.src):'';
      mv.src=c.dataset.full;var p=mv.play();if(p&&p.catch)p.catch(function(){});
      if(mp)mp.hidden=cards.length<2;if(mn)mn.hidden=cards.length<2;
    };
    var open=function(i){lastFocus=d.activeElement;modalOpen=true;sync();
      modal.showModal();d.documentElement.classList.add('rv-lock');load(i);
      w.requestAnimationFrame(function(){modal.classList.add('is-open')});
    };
    var close=function(){if(!modalOpen)return;modalOpen=false;modal.classList.remove('is-open');
      mv.pause();mv.removeAttribute('src');mv.load();
      var done=function(){modal.close();d.documentElement.classList.remove('rv-lock');
        var it=track.children[idx];if(it){var L=mqPhone.matches?it.offsetLeft-(track.clientWidth-it.offsetWidth)/2:it.offsetLeft-(parseFloat(getComputedStyle(track).scrollPaddingLeft)||0);track.scrollTo({left:Math.max(0,L),behavior:'auto'})}
        if(lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true});sync()};
      RM?done():setTimeout(done,260);
    };
    cards.forEach(function(c,i){var a=c.querySelector('[data-rv-open]');if(a)a.addEventListener('click',function(e){e.preventDefault();open(i)})});
    modal.querySelector('[data-rv-close]').addEventListener('click',close);
    if(mp)mp.addEventListener('click',function(){load(idx-1)});
    if(mn)mn.addEventListener('click',function(){load(idx+1)});
    modal.addEventListener('cancel',function(e){e.preventDefault();close()});
    modal.addEventListener('click',function(e){if(e.target===modal)close()});
    modal.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){load(idx+1)}else if(e.key==='ArrowLeft'){load(idx-1)}});
    /* phones: swipe up = next, swipe down = previous (or close on the first video) */
    var sy=0,sx=0;
    modal.addEventListener('touchstart',function(e){var t=e.changedTouches[0];sy=t.clientY;sx=t.clientX},{passive:true});
    modal.addEventListener('touchend',function(e){var t=e.changedTouches[0],dy=t.clientY-sy,dx=t.clientX-sx;
      if(Math.abs(dy)>70&&Math.abs(dy)>Math.abs(dx)*1.4&&t.clientY<w.innerHeight-90){dy<0?load(idx+1):(idx===0?close():load(idx-1))}},{passive:true});
  });

  /* recipe page: poster → inline player on click (nothing loads before) */
  d.querySelectorAll('[data-recipe-video]').forEach(function(f){
    var b=f.querySelector('[data-recipe-video-play]');if(!b)return;
    b.addEventListener('click',function(e){e.preventDefault();
      var v=d.createElement('video');v.controls=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';
      v.src=f.getAttribute('data-src');var po=f.querySelector('img');if(po)v.poster=po.currentSrc||po.src;
      f.appendChild(v);f.classList.add('is-live');b.remove();var p=v.play();if(p&&p.catch)p.catch(function(){});v.focus({preventScroll:true});
    });
  });
})();

/* ───────── v2 · cinematic hero, numbered chapters, card hover previews, buy bar ───────── */
(function(){
  var d=document,w=window;
  var reduce=w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn=navigator.connection||{};var lite=!!conn.saveData||/(^|-)2g$/.test(conn.effectiveType||'');

  /* "07 — Label" → <b>07</b><span>Label</span> */
  d.querySelectorAll('.sec-num').forEach(function(el){
    var m=(el.textContent||'').trim().match(/^(\d{1,2})\s*[—–-]\s*(.+)$/);if(!m||el.children.length)return;
    el.textContent='';var b=d.createElement('b');b.textContent=m[1];var s=d.createElement('span');s.textContent=m[2];
    el.appendChild(b);el.appendChild(s);el.classList.add('is-numbered');el.setAttribute('aria-label',m[1]+' — '+m[2]);
  });

  /* cinematic hero: poster first; the loop gets its src after load (never with reduced motion / Save-Data / 2G) */
  d.querySelectorAll('[data-cine]').forEach(function(sec){
    var v=sec.querySelector('.cine__video'),tg=sec.querySelector('[data-cine-toggle]');if(!v||reduce||lite)return;
    var mq=w.matchMedia('(max-width: 767px)'),paused=false,started=false,vis=true;
    function start(){if(started)return;started=true;v.src=v.getAttribute(mq.matches?'data-src-mobile':'data-src-desktop');
      v.addEventListener('playing',function(){sec.classList.add('is-playing')},{once:true});play();if(tg)tg.hidden=false;}
    function play(){if(paused||!vis)return;var p=v.play();if(p&&p.catch)p.catch(function(){});}
    var go=function(){(w.requestIdleCallback||function(f){setTimeout(f,200)})(start,{timeout:1500})};
    var dl=mq.matches?2500:300; /* phones: poster carries the first seconds; the loop starts once the page is idle */
    if(d.readyState==='complete')setTimeout(go,dl);else w.addEventListener('load',function(){setTimeout(go,dl)},{once:true});
    if('IntersectionObserver' in w)new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(!started)return;vis?play():v.pause()},{threshold:.15}).observe(sec);
    if(tg)tg.addEventListener('click',function(){paused=!paused;tg.setAttribute('aria-pressed',paused?'true':'false');paused?v.pause():play()});
  });

  /* recipe cards: muted preview loop on hover (desktop, fine pointer only; created on first hover) */
  if(!reduce&&!lite&&w.matchMedia('(hover: hover) and (pointer: fine)').matches){
    d.querySelectorAll('.card[data-preview]').forEach(function(c){
      var media=c.querySelector('.card__media'),v=null,t=0;if(!media)return;
      c.addEventListener('mouseenter',function(){clearTimeout(t);t=setTimeout(function(){
        if(!v){v=d.createElement('video');v.className='card__preview';v.muted=true;v.loop=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';v.setAttribute('aria-hidden','true');v.src=c.getAttribute('data-preview');media.appendChild(v);}
        var p=v.play();if(p&&p.catch)p.catch(function(){});c.classList.add('is-previewing');},120)});
      c.addEventListener('mouseleave',function(){clearTimeout(t);c.classList.remove('is-previewing');if(v)v.pause()});
    });
  }

  /* recipe page: sticky "Where to buy / For chefs" bar on phones, after the hero image and before the buy section */
  var bar=d.querySelector('[data-buy-bar]'),path=d.querySelector('.buy-path'),start=d.querySelector('.recipe-content')||d.querySelector('.recipe__body');
  if(bar&&path&&start){bar.hidden=false;var tk=false;
    var upd=function(){tk=false;var a=start.getBoundingClientRect().top,b=path.getBoundingClientRect().top;bar.classList.toggle('is-on',a<0&&b>w.innerHeight)};
    w.addEventListener('scroll',function(){if(!tk){tk=true;requestAnimationFrame(upd)}},{passive:true});upd();
  }

  /* v3 · phones: sticky "Request samples / Call" bar after the first screen, hidden over the footer */
  var lb=d.querySelector('[data-lead-bar]'),foot=d.querySelector('footer.footer');
  if(lb){lb.hidden=false;var lt=false,footIn=false;
    var lupd=function(){lt=false;lb.classList.toggle('is-on',w.scrollY>w.innerHeight*.8&&!footIn)};
    if(foot&&'IntersectionObserver' in w)new IntersectionObserver(function(e){footIn=e[0].isIntersecting;lupd()}).observe(foot);
    w.addEventListener('scroll',function(){if(!lt){lt=true;requestAnimationFrame(lupd)}},{passive:true});lupd();
  }

  /* v3 · contact form: ?interest=samples|pricing|custom|distribution and ?role=chef|distributor|institution|home preselect the selects */
  var cf=d.getElementById('ContactForm');
  if(cf&&w.URLSearchParams){var q=new URLSearchParams(w.location.search);
    [['interest','ContactForm-interest'],['role','ContactForm-role']].forEach(function(p){var v=q.get(p[0]),sel=d.getElementById(p[1]);
      if(!v||!sel)return;for(var i=0;i<sel.options.length;i++)if(sel.options[i].getAttribute('data-k')===v){sel.selectedIndex=i;break}});
  }
})();

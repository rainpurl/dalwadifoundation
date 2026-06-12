// Pull staff-edited content from the API and patch the page (font + copy + links).
// Baked HTML/CSS is the fallback, so the page is fully usable if the API is unreachable.
(function(){
  "use strict";
  function get(obj: any, path: string){ return path.split('.').reduce(function(o, k){ return (o == null ? o : o[k]); }, obj); }
  function setText(el: Element, v: any){ if (typeof v === 'string') (el as HTMLElement).textContent = v; }
  function setBody(el: Element, arr: any){
    if (!Array.isArray(arr)) return;
    el.innerHTML = '';
    arr.forEach(function(p){ if (typeof p !== 'string') return; var n = document.createElement('p'); n.textContent = p; el.appendChild(n); });
  }
  function applyFont(f: any){
    if (!f || !f.stack) return;
    var fam = (f.family || '').trim();
    if (fam){
      var id = 'font-' + fam.replace(/\s+/g, '-');
      if (!document.getElementById(id)){
        var l = document.createElement('link'); l.id = id; l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=' + fam.replace(/\s+/g, '+') + ':wght@300;400;500;600;700&display=swap';
        document.head.appendChild(l);
      }
    }
    document.documentElement.style.setProperty('--font', f.stack);
  }
  function applyLogo(src: any){
    if (!src || typeof src !== 'string') return;
    Array.prototype.forEach.call(document.querySelectorAll('.brandmark, .foundation__logo img'), function(img){ img.setAttribute('src', src); });
    var link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (!link){ link = document.createElement('link'); link.setAttribute('rel', 'icon'); document.head.appendChild(link); }
    link.setAttribute('href', src);
  }
  function reveal(){ document.documentElement.classList.remove('content-loading'); }
  // Whitelist-sanitize staff rich text before putting it on the public page: keep only basic
  // inline tags, drop every attribute except a safe href on links. Parsed with DOMParser, whose
  // document is inert (no scripts run, no image/onerror loads fire) so parsing is itself safe.
  function sanitizeRich(html: string){
    var root = new DOMParser().parseFromString(html || '', 'text/html').body;
    if (!root) return '';
    var ok: any = { B: 1, STRONG: 1, I: 1, EM: 1, U: 1, A: 1, P: 1, BR: 1, SPAN: 1 };
    Array.prototype.slice.call(root.querySelectorAll('*')).forEach(function(el: any){
      if (!el.parentNode) return;
      if (!ok[el.tagName]){
        while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
        el.parentNode.removeChild(el);
        return;
      }
      Array.prototype.slice.call(el.attributes).forEach(function(at: any){
        var n = at.name.toLowerCase();
        if (el.tagName === 'A' && n === 'href'){
          if (!/^(https?:|mailto:)/i.test(at.value || '')) el.removeAttribute(at.name);
        } else {
          el.removeAttribute(at.name);
        }
      });
      if (el.tagName === 'A'){ el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer'); }
    });
    return root.innerHTML;
  }
  function run(){
  fetch('/api/content').then(function(r){ return r.ok ? r.json() : null; }).then(function(data){
    if (!data){ reveal(); return; }
    if (data.settings && data.settings.font) applyFont(data.settings.font);
    if (data.settings && data.settings.logo) applyLogo(data.settings.logo);
    Array.prototype.forEach.call(document.querySelectorAll('[data-c]'), function(el){
      var path = el.getAttribute('data-c'); var v = get(data, path);
      if (path.split('.').pop() === 'body') setBody(el, v); else setText(el, v);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-href]'), function(el){
      var v = get(data, el.getAttribute('data-href')); if (typeof v === 'string') el.setAttribute('href', v);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-mailto]'), function(el){
      var v = get(data, el.getAttribute('data-mailto')); if (typeof v === 'string') el.setAttribute('href', 'mailto:' + v);
    });
    // Staff-added rich text sections on the About page.
    var secBox = document.getElementById('about-sections');
    if (secBox && data.about && Array.isArray(data.about.sections)){
      secBox.innerHTML = '';
      data.about.sections.forEach(function(s: any){
        if (!s) return;
        if (s.heading){ var h = document.createElement('h2'); h.className = 'section-h'; h.textContent = s.heading; secBox.appendChild(h); }
        var body = document.createElement('div'); body.className = 'prose section-prose';
        body.innerHTML = sanitizeRich(s.html || '');
        secBox.appendChild(body);
      });
    }
    if (Array.isArray(data.pillars)){
      // Match each baked column to its saved pillar by the column's key, falling back to
      // its position. Position is the reliable invariant: editing a pillar's name used to
      // change its saved key, which then stopped matching the baked data-p key and left the
      // whole column (label, title, body, links) un-patched. Index keeps it working.
      var byKey: any = {}; data.pillars.forEach(function(p: any){ if (p && p.key) byKey[p.key] = p; });
      Array.prototype.forEach.call(document.querySelectorAll('.tower[data-i]'), function(tw: any){
        var p = byKey[tw.getAttribute('data-pillar')] || data.pillars[+tw.getAttribute('data-i')];
        if (!p) return;
        Array.prototype.forEach.call(tw.querySelectorAll('[data-p]'), function(el: any){
          setText(el, p[el.getAttribute('data-p').split('.').pop()]);
        });
        Array.prototype.forEach.call(tw.querySelectorAll('[data-plink]'), function(el: any){
          var parts = el.getAttribute('data-plink').split('.'); var link = p.links && p.links[+parts[1]];
          if (!link) return;
          if (parts[2] === 'href') el.setAttribute('href', link.href); else setText(el, link.label);
        });
      });
      // About page: rebuild the pillar cards from the same data so they stay in sync with
      // the columns, including when a pillar is added or removed in the portal.
      var grid = document.querySelector('.pillar-grid');
      if (grid){
        grid.innerHTML = '';
        data.pillars.forEach(function(p: any){
          if (!p) return;
          var card = document.createElement('div'); card.className = 'pcard';
          var h = document.createElement('h3'); h.textContent = p.title || '';
          var b = document.createElement('p'); b.textContent = p.body || '';
          card.appendChild(h); card.appendChild(b); grid.appendChild(card);
        });
      }
    }
    if (Array.isArray(data.team)){
      var tbox = document.getElementById('team');
      if (tbox){
        tbox.innerHTML = '';
        data.team.forEach(function(m: any){
          var art = document.createElement('article'); art.className = 'member';
          var ph = document.createElement('div'); ph.className = 'member__photo';
          if (m && m.photo){ var img = document.createElement('img'); img.src = m.photo; img.alt = m.name || ''; ph.appendChild(img); }
          else { var sp = document.createElement('span'); sp.className = 'member__ph'; sp.setAttribute('aria-hidden', 'true'); ph.appendChild(sp); }
          var nm = document.createElement('h3'); nm.className = 'member__name'; nm.textContent = (m && m.name) || '';
          var ti = document.createElement('p'); ti.className = 'member__title'; ti.textContent = (m && m.title) || '';
          var bi = document.createElement('p'); bi.className = 'member__bio'; bi.textContent = (m && m.bio) || '';
          art.appendChild(ph); art.appendChild(nm); art.appendChild(ti); art.appendChild(bi);
          tbox.appendChild(art);
        });
      }
    }
    reveal();
  }).catch(reveal);
  }
  // ---- About-page side galleries ----
  function shuffle(a: any[]){
    for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  // Build one side from exactly PER tiles (photos plus silver/blue filler). The set is rendered
  // twice so the vertical scroll loops forever with no seam; PER is large enough that one set is
  // taller than the viewport, so a tile is never on screen at the same time as its duplicate.
  function buildSide(track: HTMLElement | null, tiles: any[]){
    if (!track) return;
    track.innerHTML = '';
    if (!tiles.length) return;
    var rots = tiles.map(function(){ return (Math.random() * 60 - 30).toFixed(1); });
    tiles.concat(tiles).forEach(function(t: any, i: number){
      var el: HTMLElement;
      if (t && t.type === 'photo'){
        var im = document.createElement('img');
        im.className = 'gimg'; im.loading = 'lazy'; im.alt = '';
        im.src = '/api/gallery/' + encodeURIComponent(t.id);
        el = im;
      } else {
        el = document.createElement('div'); el.className = 'gph';
      }
      el.style.setProperty('--rot', rots[i % tiles.length] + 'deg');
      track.appendChild(el);
    });
  }
  function loadGallery(){
    var left = document.getElementById('gallery-left');
    var right = document.getElementById('gallery-right');
    if (!left && !right) return; // only the About page carries these
    fetch('/api/gallery').then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
      var arr = (d && d.gallery) || [];
      var speed = d && typeof d.speed === 'number' ? d.speed : null;
      if (speed) document.documentElement.style.setProperty('--gallery-dur', speed + 's');
      var TOTAL = 30, PER = 15;
      // Real photos (capped), split evenly so the same photo never lands on both sides.
      var leftTiles: any[] = [], rightTiles: any[] = [];
      arr.slice(0, TOTAL).forEach(function(g: any, i: number){
        if (!g || !g.id) return;
        (i % 2 === 0 ? leftTiles : rightTiles).push({ type: 'photo', id: g.id });
      });
      // Pad each side to PER with filler tiles, then mix so photos and filler are interspersed.
      while (leftTiles.length < PER) leftTiles.push({ type: 'ph' });
      while (rightTiles.length < PER) rightTiles.push({ type: 'ph' });
      buildSide(left, shuffle(leftTiles));
      buildSide(right, shuffle(rightTiles));
    }).catch(function(){});
  }
  // View Transitions: modules run once, so patch on every page load (initial + nav).
  document.addEventListener('astro:page-load', run);
  document.addEventListener('astro:page-load', loadGallery);
})();

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
        l.href = 'https://fonts.googleapis.com/css2?family=' + fam.replace(/\s+/g, '+') + ':wght@400;500;600;700&display=swap';
        document.head.appendChild(l);
      }
    }
    document.documentElement.style.setProperty('--font', f.stack);
  }
  fetch('/api/content').then(function(r){ return r.ok ? r.json() : null; }).then(function(data){
    if (!data) return;
    if (data.settings && data.settings.font) applyFont(data.settings.font);
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
    if (Array.isArray(data.pillars)){
      var byKey: any = {}; data.pillars.forEach(function(p: any){ byKey[p.key] = p; });
      Array.prototype.forEach.call(document.querySelectorAll('[data-p]'), function(el){
        var parts = el.getAttribute('data-p').split('.'); var p = byKey[parts[0]]; if (!p) return;
        setText(el, p[parts[1]]);
      });
      Array.prototype.forEach.call(document.querySelectorAll('[data-plink]'), function(el){
        var parts = el.getAttribute('data-plink').split('.'); var p = byKey[parts[0]]; if (!p || !p.links || !p.links[+parts[1]]) return;
        var link = p.links[+parts[1]];
        if (parts[2] === 'href') el.setAttribute('href', link.href); else setText(el, link.label);
      });
    }
  }).catch(function(){ /* keep baked content */ });
})();

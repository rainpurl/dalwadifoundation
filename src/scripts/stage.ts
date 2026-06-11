// THE DALWADI FOUNDATION - landing stage: intro timeline + pillar interactions.
// The cursor turn (left/right, plus the moving glare) lives in the hover pass below.
// Because the tower button is pointer-events:none (so the revealed panel buttons stay
// clickable and shimmer), desktop hover is detected geometrically by which column the
// cursor is over.
//
// View Transitions note: module scripts run once, so init() is (re)run on every
// 'astro:page-load'. A per-instance data flag stops double-init, and an AbortController
// tears down window/document listeners before each re-init so they never accumulate.
(function(){
  "use strict";
  var controller: AbortController | null = null;

  function init(){
    var app = document.getElementById('app');
    if (!app) return;                                   // not the homepage
    if (app.getAttribute('data-staged') === '1') return; // already wired this instance
    app.setAttribute('data-staged', '1');

    // First genuine page load vs. an in-site slide. The nav script sets
    // window.__dalwadiClientNav on the first client navigation; if that has happened,
    // we arrived here by sliding, so skip the splash and show the settled layout.
    var firstLoad = !(window as any).__dalwadiClientNav;

    if (controller) controller.abort();
    controller = new AbortController();
    var signal = controller.signal;

    var towersWrap = document.getElementById('towers');
    var towers = Array.prototype.slice.call(document.querySelectorAll('.tower'));
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    function isPhone(){ return window.matchMedia('(max-width: 560px)').matches; }

    // ---- intro ----
    if (!firstLoad){
      app.classList.remove('is-intro');
      app.classList.add('no-splash', 'is-settled', 'is-revealed');
    } else if (reduce){
      app.classList.remove('is-intro');
      app.classList.add('is-settled', 'is-revealed');
    } else {
      var HOLD = 1100, GAP = 450;
      requestAnimationFrame(function(){
        setTimeout(function(){
          app.classList.remove('is-intro'); app.classList.add('is-settled');
          setTimeout(function(){ app.classList.add('is-revealed'); }, GAP);
        }, HOLD);
      });
    }

    // ---- centered card (phones) ----
    var veilEl = document.getElementById('pick-veil');
    var modalEl = document.getElementById('pillar-modal');
    var modalContent = document.getElementById('pillar-modal-content');
    function showModal(){ if (veilEl) veilEl.classList.add('is-on'); if (modalEl){ modalEl.classList.add('is-on'); modalEl.setAttribute('aria-hidden', 'false'); } }
    function hideModal(){ if (veilEl) veilEl.classList.remove('is-on'); if (modalEl){ modalEl.classList.remove('is-on'); modalEl.setAttribute('aria-hidden', 'true'); } }
    function fillModal(t: any){ var panel = t.querySelector('.tower__panel'); if (panel && modalContent) modalContent.innerHTML = panel.innerHTML; }

    function clearHover(){ for (var i = 0; i < towers.length; i++) towers[i].classList.remove('is-hover'); }
    function closeTowers(){
      towers.forEach(function(t: any){ t.classList.remove('is-open'); t.style.transform = '';
        var b = t.querySelector('.tower__btn'); if (b) b.setAttribute('aria-expanded', 'false'); });
      if (towersWrap) towersWrap.classList.remove('is-solo');
      hideModal();
    }
    function openTower(t: any){
      closeTowers(); t.classList.add('is-open');
      var b = t.querySelector('.tower__btn'); if (b) b.setAttribute('aria-expanded', 'true');
      if (isPhone()){ fillModal(t); showModal(); }
      else {
        if (towersWrap) towersWrap.classList.add('is-solo');
        var r = t.getBoundingClientRect();
        t.style.transform = 'translateX(' + ((window.innerWidth / 2) - (r.left + r.width / 2)).toFixed(1) + 'px)';
      }
    }

    // ---- desktop: the cursor turns each column left/right (--ry) and slides its
    //      glare (--shine); hover (which column the cursor is over) is detected by the
    //      same geometry pass - one listener, one rAF. ----
    if (hoverCapable && !reduce){
      var hraf = 0, hx = -1, hy = -1;
      var TILT_MAX = 14; // degrees of left/right turn at the screen edge (gentler)
      var setTilt = function(t: any, ry: string, shine: string){ t.style.setProperty('--ry', ry); t.style.setProperty('--shine', shine); };
      var restTilt = function(){ for (var k = 0; k < towers.length; k++) setTilt(towers[k], '-10deg', '50%'); };
      var hoverTest = function(){
        hraf = 0;
        if (!app!.classList.contains('is-revealed') || app!.classList.contains('is-intro')){ clearHover(); restTilt(); return; }
        var halfW = (window.innerWidth / 2) || 1, hit: any = null;
        for (var i = 0; i < towers.length; i++){
          var r = towers[i].getBoundingClientRect();
          var nx = (hx - (r.left + r.width / 2)) / halfW; if (nx > 1) nx = 1; if (nx < -1) nx = -1;
          setTilt(towers[i], (nx * TILT_MAX).toFixed(2) + 'deg', (50 + nx * 38).toFixed(1) + '%');
          // exclude the bottom strip so hovering the nav bar doesn't sink a column
          if (hx >= r.left && hx <= r.right && hy >= r.top && hy <= r.bottom - 72){ hit = towers[i]; }
        }
        for (var j = 0; j < towers.length; j++) towers[j].classList.toggle('is-hover', towers[j] === hit);
      };
      window.addEventListener('pointermove', function(e){ hx = e.clientX; hy = e.clientY; if (!hraf) hraf = requestAnimationFrame(hoverTest); }, { passive: true, signal: signal });
      document.addEventListener('mouseleave', function(){ clearHover(); restTilt(); }, { signal: signal });
    }

    // ---- touch / phone: tap a column to lift it + show the centered card ----
    function towerAtX(x: number){
      for (var i = 0; i < towers.length; i++){ var r = towers[i].getBoundingClientRect(); if (x >= r.left - 6 && x <= r.right + 6) return towers[i]; }
      return null;
    }
    if (!hoverCapable){
      app.addEventListener('click', function(e: any){
        if (!app!.classList.contains('is-revealed')) return;
        if (e.target.closest('.pillar-modal') || e.target.closest('.foundation') || e.target.closest('.tp__actions')) return;
        var t = towerAtX(e.clientX), within = false;
        if (t){ var r = t.getBoundingClientRect(); within = e.clientY >= r.top && e.clientY <= r.bottom; }
        if (t && within){ t.classList.contains('is-open') ? closeTowers() : openTower(t); }
        else closeTowers();
      }, { signal: signal });
    }

    // ---- keyboard aria (CSS :focus-within drives the sink) ----
    towers.forEach(function(t: any){
      var b = t.querySelector('.tower__btn'); if (!b) return;
      t.addEventListener('focusin', function(){ b.setAttribute('aria-expanded', 'true'); }, { signal: signal });
      t.addEventListener('focusout', function(){ if (!t.contains(document.activeElement)) b.setAttribute('aria-expanded', 'false'); }, { signal: signal });
    });
    var closeBtn = document.getElementById('pillar-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeTowers, { signal: signal });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape'){ clearHover(); closeTowers(); } }, { signal: signal });
  }

  if (!(window as any).__stageWired){ (window as any).__stageWired = true; document.addEventListener('astro:page-load', init); }
  init(); // also run for the navigation that introduced this script (guarded by data-staged)
})();

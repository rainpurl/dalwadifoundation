// THE DALWADI FOUNDATION — landing stage: intro timeline + pillar interactions.
// The cursor turn (left/right, plus the moving glare) lives in the hover pass below.
// Because the tower button is pointer-events:none (so the revealed panel buttons stay
// clickable and shimmer), desktop hover is detected geometrically by which column the
// cursor is over.
(function(){
  "use strict";
  var app = document.getElementById('app');
  if (!app) return;
  var towersWrap = document.getElementById('towers');
  var towers = Array.prototype.slice.call(document.querySelectorAll('.tower'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function isPhone(){ return window.matchMedia('(max-width: 560px)').matches; }

  // ---- intro: play on every load EXCEPT when arriving back from a sub-page.
  // Sub-pages (about/contribute) set a session flag; a reload always wins (shows). ----
  var fromSub = false;
  try { fromSub = sessionStorage.getItem('dalwadi_from_sub') === '1'; sessionStorage.removeItem('dalwadi_from_sub'); } catch (e) {}
  var navType = '';
  try { var navEntry: any = performance.getEntriesByType('navigation')[0]; navType = navEntry ? navEntry.type : ''; } catch (e) {}
  if (fromSub && navType !== 'reload') {
    app.classList.remove('is-intro');
    app.classList.add('no-splash', 'is-settled', 'is-revealed');
  } else {
    var HOLD = reduce ? 150 : 1100, GAP = reduce ? 60 : 450;
    window.addEventListener('load', function(){
      requestAnimationFrame(function(){
        setTimeout(function(){
          app.classList.remove('is-intro'); app.classList.add('is-settled');
          setTimeout(function(){ app.classList.add('is-revealed'); }, GAP);
        }, HOLD);
      });
    });
  }

  // ---- centered card (phones) ----
  var veilEl = document.getElementById('pick-veil');
  var modalEl = document.getElementById('pillar-modal');
  var modalContent = document.getElementById('pillar-modal-content');
  function showModal(){ if (veilEl) veilEl.classList.add('is-on'); if (modalEl){ modalEl.classList.add('is-on'); modalEl.setAttribute('aria-hidden', 'false'); } }
  function hideModal(){ if (veilEl) veilEl.classList.remove('is-on'); if (modalEl){ modalEl.classList.remove('is-on'); modalEl.setAttribute('aria-hidden', 'true'); } }
  function fillModal(t){ var panel = t.querySelector('.tower__panel'); if (panel && modalContent) modalContent.innerHTML = panel.innerHTML; }

  function clearHover(){ for (var i = 0; i < towers.length; i++) towers[i].classList.remove('is-hover'); }
  function closeTowers(){
    towers.forEach(function(t){ t.classList.remove('is-open'); t.style.transform = '';
      var b = t.querySelector('.tower__btn'); if (b) b.setAttribute('aria-expanded', 'false'); });
    if (towersWrap) towersWrap.classList.remove('is-solo');
    hideModal();
  }
  function openTower(t){
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
  //      same geometry pass — one listener, one rAF. ----
  if (hoverCapable && !reduce){
    var hraf = 0, hx = -1, hy = -1;
    var TILT_MAX = 20; // degrees of left/right turn at the screen edge
    function setTilt(t, ry, shine){ t.style.setProperty('--ry', ry); t.style.setProperty('--shine', shine); }
    function restTilt(){ for (var k = 0; k < towers.length; k++) setTilt(towers[k], '-10deg', '50%'); }
    function hoverTest(){
      hraf = 0;
      if (!app.classList.contains('is-revealed') || app.classList.contains('is-intro')){ clearHover(); restTilt(); return; }
      var halfW = (window.innerWidth / 2) || 1, hit = null;
      for (var i = 0; i < towers.length; i++){
        var r = towers[i].getBoundingClientRect();
        var nx = (hx - (r.left + r.width / 2)) / halfW; if (nx > 1) nx = 1; if (nx < -1) nx = -1;
        setTilt(towers[i], (nx * TILT_MAX).toFixed(2) + 'deg', (50 + nx * 38).toFixed(1) + '%');
        // exclude the bottom strip so hovering the nav bar doesn't sink a column
        if (hx >= r.left && hx <= r.right && hy >= r.top && hy <= r.bottom - 72){ hit = towers[i]; }
      }
      for (var j = 0; j < towers.length; j++) towers[j].classList.toggle('is-hover', towers[j] === hit);
    }
    window.addEventListener('pointermove', function(e){ hx = e.clientX; hy = e.clientY; if (!hraf) hraf = requestAnimationFrame(hoverTest); }, { passive: true });
    document.addEventListener('mouseleave', function(){ clearHover(); restTilt(); });
  }

  // ---- touch / phone: tap a column to lift it + show the centered card ----
  function towerAtX(x){
    for (var i = 0; i < towers.length; i++){ var r = towers[i].getBoundingClientRect(); if (x >= r.left - 6 && x <= r.right + 6) return towers[i]; }
    return null;
  }
  if (!hoverCapable){
    app.addEventListener('click', function(e){
      if (!app.classList.contains('is-revealed')) return;
      if (e.target.closest('.pillar-modal') || e.target.closest('.foundation') || e.target.closest('.tp__actions')) return;
      var t = towerAtX(e.clientX), within = false;
      if (t){ var r = t.getBoundingClientRect(); within = e.clientY >= r.top && e.clientY <= r.bottom; }
      if (t && within){ t.classList.contains('is-open') ? closeTowers() : openTower(t); }
      else closeTowers();
    });
  }

  // ---- keyboard aria (CSS :focus-within drives the sink) ----
  towers.forEach(function(t){
    var b = t.querySelector('.tower__btn'); if (!b) return;
    t.addEventListener('focusin', function(){ b.setAttribute('aria-expanded', 'true'); });
    t.addEventListener('focusout', function(){ if (!t.contains(document.activeElement)) b.setAttribute('aria-expanded', 'false'); });
  });
  var closeBtn = document.getElementById('pillar-modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeTowers);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape'){ clearHover(); closeTowers(); } });
})();

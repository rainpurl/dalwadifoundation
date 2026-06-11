// THE DALWADI FOUNDATION — landing stage: intro timeline, horizontal cursor tilt,
// staggered idle wave (desktop), and the touch / phone pillar interactions.
(function(){
  "use strict";
  var app = document.getElementById('app');
  if (!app) return;
  var towersWrap = document.getElementById('towers');
  var towers = Array.prototype.slice.call(document.querySelectorAll('.tower'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function isPhone(){ return window.matchMedia('(max-width: 560px)').matches; }

  // ---- intro ----
  var HOLD = reduce ? 150 : 1800, GAP = reduce ? 60 : 700;
  window.addEventListener('load', function(){
    requestAnimationFrame(function(){
      setTimeout(function(){
        app.classList.remove('is-intro'); app.classList.add('is-settled');
        setTimeout(function(){ app.classList.add('is-revealed'); }, GAP);
      }, HOLD);
    });
  });

  // ---- cursor tilt (horizontal only; desktop) ----
  var centers = [];
  function measure(){ centers = towers.map(function(t){ var r = t.getBoundingClientRect(); return { x: r.left + r.width / 2 }; }); }
  var MAXY = 20, raf = 0, mx = 0;
  function applyTilt(){
    raf = 0; var halfW = window.innerWidth / 2;
    for (var i = 0; i < towers.length; i++){
      var c = centers[i]; if (!c) continue;
      var nx = (mx - c.x) / halfW; if (nx > 1) nx = 1; if (nx < -1) nx = -1;
      towers[i].style.setProperty('--ry', (nx * MAXY).toFixed(2) + 'deg');
      towers[i].style.setProperty('--shine', (50 + nx * 38).toFixed(1) + '%');
    }
  }
  function onMove(e){ mx = e.clientX; if (!raf) raf = requestAnimationFrame(applyTilt); }
  function resetTilt(){ towers.forEach(function(t){ t.style.setProperty('--ry', '-10deg'); t.style.setProperty('--shine', '50%'); }); }
  if (hoverCapable && !reduce){
    measure();
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseleave', resetTilt);
    window.addEventListener('resize', measure);
    window.addEventListener('load', function(){ setTimeout(measure, 80); setTimeout(measure, 2700); });
  }

  // ---- centered card (phones) ----
  var veilEl = document.getElementById('pick-veil');
  var modalEl = document.getElementById('pillar-modal');
  var modalContent = document.getElementById('pillar-modal-content');
  function showModal(){ if (veilEl) veilEl.classList.add('is-on'); if (modalEl){ modalEl.classList.add('is-on'); modalEl.setAttribute('aria-hidden', 'false'); } }
  function hideModal(){ if (veilEl) veilEl.classList.remove('is-on'); if (modalEl){ modalEl.classList.remove('is-on'); modalEl.setAttribute('aria-hidden', 'true'); } }
  function fillModal(t){ var panel = t.querySelector('.tower__panel'); if (panel && modalContent) modalContent.innerHTML = panel.innerHTML; }

  // ---- open / close ----
  function closeTowers(){
    towers.forEach(function(t){ t.classList.remove('is-open'); t.style.transform = '';
      var b = t.querySelector('.tower__btn'); if (b) b.setAttribute('aria-expanded', 'false'); });
    if (towersWrap) towersWrap.classList.remove('is-solo');
    hideModal();
  }
  function openTower(t){
    closeTowers(); t.classList.add('is-open');
    var b = t.querySelector('.tower__btn'); if (b) b.setAttribute('aria-expanded', 'true');
    if (isPhone()){
      fillModal(t); showModal();                       // lift + centered card
    } else {
      if (towersWrap) towersWrap.classList.add('is-solo'); // tablet: solo + sink-reveal
      var r = t.getBoundingClientRect();
      t.style.transform = 'translateX(' + ((window.innerWidth / 2) - (r.left + r.width / 2)).toFixed(1) + 'px)';
    }
  }

  if (!hoverCapable){
    towers.forEach(function(t){
      var b = t.querySelector('.tower__btn'); if (!b) return;
      b.addEventListener('click', function(e){ e.stopPropagation(); t.classList.contains('is-open') ? closeTowers() : openTower(t); });
    });
  }
  var closeBtn = document.getElementById('pillar-modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeTowers);

  // keyboard aria
  towers.forEach(function(t){
    var b = t.querySelector('.tower__btn'); if (!b) return;
    t.addEventListener('focusin', function(){ b.setAttribute('aria-expanded', 'true'); });
    t.addEventListener('focusout', function(){ if (!t.contains(document.activeElement)) b.setAttribute('aria-expanded', 'false'); });
  });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeTowers(); });
  app.addEventListener('click', function(e){
    if (e.target.closest('.tower') || e.target.closest('.foundation') || e.target.closest('.pillar-modal')) return;
    closeTowers(); // also closes when tapping the backdrop
  });
})();

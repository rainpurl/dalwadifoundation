// Move each metallic button's highlight toward the cursor, slightly (damped toward center).
// Re-binds on every 'astro:page-load' so buttons added by a view-transition navigation
// still light up; a per-node flag prevents binding the same element twice.
(function(){
  "use strict";
  function bind(el: Element){
    var node = el as HTMLElement;
    if (node.getAttribute('data-metal') === '1') return;
    node.setAttribute('data-metal', '1');
    node.addEventListener('pointermove', function(e){
      var r = node.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      node.style.setProperty('--mx', (50 + (x * 100 - 50) * 0.7).toFixed(1) + '%');
      node.style.setProperty('--my', (50 + (y * 100 - 50) * 0.7).toFixed(1) + '%');
    }, { passive: true });
    node.addEventListener('pointerleave', function(){
      node.style.setProperty('--mx', '50%'); node.style.setProperty('--my', '28%');
    });
  }
  function bindAll(){ Array.prototype.forEach.call(document.querySelectorAll('.metal'), bind); }
  document.addEventListener('astro:page-load', bindAll);
})();

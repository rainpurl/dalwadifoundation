// Move each metallic button's highlight toward the cursor — slightly (damped toward center).
(function(){
  "use strict";
  function bind(el: Element){
    var node = el as HTMLElement;
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
  Array.prototype.forEach.call(document.querySelectorAll('.metal'), bind);
})();

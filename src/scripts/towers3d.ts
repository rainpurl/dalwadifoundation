// THE DALWADI FOUNDATION — silver mirrored towers in WebGL (Three.js).
// One small scene per <canvas>: a RoundedBox with a real reflective (PMREM)
// silver environment, a label baked onto its front face (so it turns with the
// box), and a gentle cursor turn. CSS owns layout, the idle bob, and the sink.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

(function () {
  "use strict";
  var canvases = Array.prototype.slice.call(document.querySelectorAll(".tower__canvas"));
  if (!canvases.length) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // ---- tuning knobs ----
  var TILT = 0.18;          // max left/right turn toward cursor (was 0.32 — reduced)
  var REST_Y = -0.1;        // resting turn
  var PITCH = 0.13;         // top-down view (keeps the flat square top visible)
  var DEPTH_FRAC = 1.08;    // depth ~= width -> square prism
  var RADIUS_FRAC = 0.085;  // subtle edge fillet
  var COLOR = 0xdfe3ea;     // light silver base (bright even before reflections)
  var METAL = 0.55, ROUGH = 0.22, ENV_I = 1.1;
  var LABEL_COLOR = "#0c1a40"; // navy label (reads on silver)
  function drawLabel(canvas: HTMLCanvasElement, text: string) {
    var W = canvas.width, H = canvas.height;
    var g = canvas.getContext("2d")!;
    g.clearRect(0, 0, W, H);
    g.fillStyle = LABEL_COLOR; g.textAlign = "center"; g.textBaseline = "middle";
    var size = 96;
    g.font = "600 " + size + 'px "Literata", Georgia, serif';
    while (g.measureText(text).width > W * 0.88 && size > 24) { size -= 4; g.font = "600 " + size + 'px "Literata", Georgia, serif'; }
    g.fillText(text, W / 2, H / 2 + size * 0.05);
  }

  var ctrls: any[] = [];

  function build(canvasEl: HTMLCanvasElement) {
    var tower = canvasEl.closest(".tower") as HTMLElement;
    if (!tower) return null;
    var renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true }); }
    catch (e) { return null; }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    var scene = new THREE.Scene();
    // real studio reflections (reliable + bright) — this is what makes it silver
    var pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 5000);
    camera.position.set(0, 0, 1500); camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xc2c9d6, 0.4));
    var key = new THREE.DirectionalLight(0xffffff, 0.5);
    key.position.set(-2.4, 3.6, 3); scene.add(key);

    var mat = new THREE.MeshStandardMaterial({ color: COLOR, metalness: METAL, roughness: ROUGH, envMapIntensity: ENV_I });
    var mesh = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1, 1, 0.2), mat);
    mesh.rotation.x = PITCH; mesh.rotation.y = REST_Y; scene.add(mesh);

    // label baked onto the front face — child of the box, so it turns with it
    var labelCanvas = document.createElement("canvas"); labelCanvas.width = 512; labelCanvas.height = 224;
    var nameEl = tower.querySelector(".tower__name") as HTMLElement | null;
    var nameText = nameEl ? (nameEl.textContent || "") : "";
    drawLabel(labelCanvas, nameText);
    var labelTex = new THREE.CanvasTexture(labelCanvas);
    labelTex.colorSpace = THREE.SRGBColorSpace; labelTex.anisotropy = 4;
    var label = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, depthWrite: false }));
    mesh.add(label);
    if (nameEl) nameEl.style.display = "none"; // 3D label replaces the DOM one

    var shownFallbackHidden = false;
    function size() {
      var w = canvasEl.clientWidth, h = canvasEl.clientHeight;
      if (!w || !h) return false;
      renderer.setSize(w, h, false);
      camera.left = -w / 2; camera.right = w / 2; camera.top = h / 2; camera.bottom = -h / 2;
      camera.updateProjectionMatrix();
      var tw = tower.clientWidth, th = tower.clientHeight;
      var d = tw * DEPTH_FRAC, r = Math.min(tw * RADIUS_FRAC, d * 0.45);
      mesh.geometry.dispose(); mesh.geometry = new RoundedBoxGeometry(tw, th, d, 4, r);
      var lw = tw * 0.86, lh = lw * (224 / 512);
      label.geometry.dispose(); label.geometry = new THREE.PlaneGeometry(lw, lh);
      label.position.set(0, 0, d / 2 + 1.5);
      return true;
    }
    function render() { renderer.render(scene, camera); }
    function update() {
      if (size()) { render(); if (!shownFallbackHidden) { shownFallbackHidden = true; var fb = tower.querySelector(".tower__fallback") as HTMLElement | null; if (fb) fb.style.display = "none"; } }
    }
    function redrawLabel() { drawLabel(labelCanvas, nameText); labelTex.needsUpdate = true; render(); }

    return { tower: tower, el: canvasEl, setRy: function (ry: number) { mesh.rotation.y = ry; render(); }, update: update, redrawLabel: redrawLabel };
  }

  for (var i = 0; i < canvases.length; i++) { var c = build(canvases[i]); if (c) ctrls.push(c); }
  if (!ctrls.length) return; // WebGL unavailable -> CSS fallback boxes stay

  function updateAll() { for (var i = 0; i < ctrls.length; i++) ctrls[i].update(); }
  // render once layout is real — robust to lazy-load timing (fixes the
  // "2D gradient until you move the cursor" bug on back-navigation)
  requestAnimationFrame(function () { updateAll(); requestAnimationFrame(updateAll); });
  setTimeout(updateAll, 250);
  if (window.ResizeObserver) { var ro = new ResizeObserver(updateAll); ctrls.forEach(function (c) { ro.observe(c.el); }); }
  else { window.addEventListener("resize", updateAll); }
  if (document.fonts && (document.fonts as any).ready) { (document.fonts as any).ready.then(function () { ctrls.forEach(function (c: any) { c.redrawLabel(); }); }); }

  // ---- turn toward cursor (reduced) ----
  var raf = 0, mx = 0;
  function frame() {
    raf = 0; var halfW = window.innerWidth / 2;
    for (var i = 0; i < ctrls.length; i++) {
      var r = ctrls[i].tower.getBoundingClientRect();
      var nx = (mx - (r.left + r.width / 2)) / halfW; if (nx > 1) nx = 1; if (nx < -1) nx = -1;
      ctrls[i].setRy(nx * TILT);
    }
  }
  if (hoverCapable && !reduce) {
    window.addEventListener("pointermove", function (e) { mx = e.clientX; if (!raf) raf = requestAnimationFrame(frame); }, { passive: true });
    document.addEventListener("mouseleave", function () { ctrls.forEach(function (c) { c.setRy(REST_Y); }); });
  }
})();

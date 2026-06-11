// THE DALWADI FOUNDATION — rounded-glass towers in WebGL (Three.js).
// One small scene per <canvas>: a RoundedBox with reflective silvery-glass
// material + a gradient environment. CSS owns layout, the idle bob, and the
// sink; this draws the box and turns it left/right toward the cursor.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

(function () {
  "use strict";
  var canvases = Array.prototype.slice.call(document.querySelectorAll(".tower__canvas"));
  if (!canvases.length) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // ---- tuning knobs ----
  var TILT = 0.32;          // max left/right turn (radians)
  var REST_Y = -0.15;       // resting turn
  var PITCH = 0.13;         // top-down view (keeps a flat, square-ish top visible)
  var DEPTH_FRAC = 1.08;    // box depth ~= width -> square prism
  var RADIUS_FRAC = 0.085;  // edge fillet as a fraction of width (smaller = sharper corners)
  var COLOR = 0xdfe3ea;     // bright silver (mirror tint)
  var METAL = 1.0, ROUGH = 0.08, ENV_I = 1.5;

  // shared reflective environment: silvery sky with a bright reflection band,
  // deepening to navy. Drives the "reflective frosted glass" look.
  var envCanvas = document.createElement("canvas");
  envCanvas.width = 8; envCanvas.height = 160;
  var ectx = envCanvas.getContext("2d")!;
  var grad = ectx.createLinearGradient(0, 0, 0, 160);
  grad.addColorStop(0.0, "#ffffff");
  grad.addColorStop(0.18, "#e7eaf0");
  grad.addColorStop(0.34, "#ffffff");   // bright reflection streak
  grad.addColorStop(0.46, "#c2c7d2");
  grad.addColorStop(0.7, "#8a91a1");
  grad.addColorStop(1.0, "#3a4150");    // dark steel floor
  ectx.fillStyle = grad; ectx.fillRect(0, 0, 8, 160);

  var ctrls: any[] = [];

  function build(canvas: HTMLCanvasElement) {
    var tower = canvas.closest(".tower") as HTMLElement;
    if (!tower) return null;
    var renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true }); }
    catch (e) { return null; }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    var scene = new THREE.Scene();
    var env = new THREE.CanvasTexture(envCanvas);
    env.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = env;

    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 5000);
    camera.position.set(0, 0, 1500);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xeef4ff, 0x18233f, 0.55));
    var key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(-2.4, 3.6, 3); scene.add(key);

    var mat = new THREE.MeshStandardMaterial({ color: COLOR, metalness: METAL, roughness: ROUGH, envMapIntensity: ENV_I });
    var mesh = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1, 1, 0.2), mat);
    mesh.rotation.x = PITCH;
    mesh.rotation.y = REST_Y;
    scene.add(mesh);

    function size() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.left = -w / 2; camera.right = w / 2; camera.top = h / 2; camera.bottom = -h / 2;
      camera.updateProjectionMatrix();
      var tw = tower.clientWidth, th = tower.clientHeight;
      var d = tw * DEPTH_FRAC;
      var r = Math.min(tw * RADIUS_FRAC, d * 0.45);
      mesh.geometry.dispose();
      mesh.geometry = new RoundedBoxGeometry(tw, th, d, 4, r);
    }
    function render() { renderer.render(scene, camera); }
    size(); render();

    return {
      tower: tower,
      setRy: function (ry: number) { mesh.rotation.y = ry; render(); },
      resize: function () { size(); render(); },
    };
  }

  for (var i = 0; i < canvases.length; i++) {
    var c = build(canvases[i]);
    if (c) { ctrls.push(c); (c.tower.querySelector(".tower__fallback") as HTMLElement).style.display = "none"; }
  }
  if (!ctrls.length) return; // WebGL unavailable -> CSS fallback boxes stay

  // ---- turn toward the cursor (left/right only) ----
  var raf = 0, mx = 0;
  function frame() {
    raf = 0;
    var halfW = window.innerWidth / 2;
    for (var i = 0; i < ctrls.length; i++) {
      var r = ctrls[i].tower.getBoundingClientRect();
      var nx = (mx - (r.left + r.width / 2)) / halfW;
      if (nx > 1) nx = 1; if (nx < -1) nx = -1;
      ctrls[i].setRy(nx * TILT);
    }
  }
  if (hoverCapable && !reduce) {
    window.addEventListener("pointermove", function (e) { mx = e.clientX; if (!raf) raf = requestAnimationFrame(frame); }, { passive: true });
    document.addEventListener("mouseleave", function () { ctrls.forEach(function (c) { c.setRy(REST_Y); }); });
  }
  var rz: any;
  function resizeAll() { ctrls.forEach(function (c) { c.resize(); }); }
  window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(resizeAll, 140); });
  window.addEventListener("load", function () { setTimeout(resizeAll, 150); });
})();

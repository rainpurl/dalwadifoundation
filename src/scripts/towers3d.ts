// THE DALWADI FOUNDATION — rounded-glass towers in WebGL (Three.js).
// One small scene per <canvas> (a real RoundedBox with lighting + a reflective
// blue-glass environment). CSS still owns layout, the idle bob, and the sink;
// this only draws the box and turns it left/right toward the cursor.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

(function () {
  "use strict";
  var canvases = Array.prototype.slice.call(document.querySelectorAll(".tower__canvas"));
  if (!canvases.length) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // ---- tuning knobs ----
  var TILT = 0.34;          // max left/right turn (radians, ~20°)
  var REST_Y = -0.16;       // resting turn
  var PITCH = 0.13;         // constant top-down view so the rounded top shows
  var COLOR = 0x1b3c79;     // glass blue
  var METAL = 0.5, ROUGH = 0.24;

  // shared gradient used for reflections (blue glass: light sky -> deep navy)
  var envCanvas = document.createElement("canvas");
  envCanvas.width = 8; envCanvas.height = 128;
  var ectx = envCanvas.getContext("2d")!;
  var grad = ectx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0.0, "#e3edfb");
  grad.addColorStop(0.32, "#9bb8e6");
  grad.addColorStop(0.6, "#395fa3");
  grad.addColorStop(1.0, "#0a1838");
  ectx.fillStyle = grad; ectx.fillRect(0, 0, 8, 128);

  var ctrls: any[] = [];

  function build(canvas: HTMLCanvasElement) {
    var tower = canvas.closest(".tower") as HTMLElement;
    if (!tower) return null;
    var renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    } catch (e) { return null; }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var env = new THREE.CanvasTexture(envCanvas);
    env.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = env;

    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 5000);
    camera.position.set(0, 0, 1500);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xe6f0ff, 0x0a1530, 0.75));
    var key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(-2.2, 4, 3); scene.add(key);
    var rim = new THREE.DirectionalLight(0xbfd4ff, 0.4);
    rim.position.set(2, 1.5, -2); scene.add(rim);

    var mat = new THREE.MeshStandardMaterial({ color: COLOR, metalness: METAL, roughness: ROUGH, envMapIntensity: 1.15 });
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
      // rebuild box at the tower's pixel dimensions
      var tw = tower.clientWidth, th = tower.clientHeight;
      var d = tw * 0.46;
      var r = Math.min(d, tw, th) * 0.42;
      mesh.geometry.dispose();
      mesh.geometry = new RoundedBoxGeometry(tw, th, d, 6, r);
    }
    function render() { renderer.render(scene, camera); }
    size(); render();

    return {
      tower: tower,
      setRy: function (ry: number) { mesh.rotation.y = ry; render(); },
      resize: function () { size(); render(); },
      render: render,
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
  window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { ctrls.forEach(function (c) { c.resize(); }); }, 120); });
  window.addEventListener("load", function () { setTimeout(function () { ctrls.forEach(function (c) { c.resize(); }); }, 120); });
})();

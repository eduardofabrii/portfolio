/* Hairline 0.5.1, Copyright (c) 2026 Lucas Marques. MIT license: vendor/hairline-LICENSE.txt. Adapted for Eduardo Fabri: portrait, keyboard animation and floating camera. */

// ../../../../../private/tmp/hairline-source/packages/hairline/src/core/iso.ts
var clamp = (v, a, b) => Math.max(a, Math.min(b, v));
var rad = (d) => d * Math.PI / 180;
var r2 = (n) => Math.round(n * 100) / 100;
var poly = (pts) => "M" + pts.map((p) => r2(p[0]) + " " + r2(p[1])).join("L") + "Z";
var open = (pts) => pts.length < 2 ? "" : "M" + pts.map((p) => r2(p[0]) + " " + r2(p[1])).join("L");
var Cam = (azDeg, k, S) => ({ az: rad(azDeg), k, S, ox: 0, oy: 0 });
function proj(C) {
  const c = Math.cos(C.az), s = Math.sin(C.az), zf = Math.sqrt(1 - C.k * C.k);
  return (x, y, z) => {
    const X = x * c - y * s, Y = x * s + y * c;
    return [C.ox + C.S * X, C.oy + C.S * (Y * C.k - z * zf)];
  };
}
function fit(C, pts, cx, cy) {
  C.ox = 0;
  C.oy = 0;
  const P = proj(C);
  let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
  for (const p of pts) {
    const q = P(p[0], p[1], p[2]);
    a = Math.min(a, q[0]);
    b = Math.max(b, q[0]);
    c = Math.min(c, q[1]);
    d = Math.max(d, q[1]);
  }
  C.ox = cx - (a + b) / 2;
  C.oy = cy - (c + d) / 2;
}
function rrect(u0, v0, u1, v1, r, n = 4) {
  r = Math.max(0, Math.min(r, (u1 - u0) / 2, (v1 - v0) / 2));
  const out = [];
  for (const [cu, cv, a0] of [[u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180], [u1 - r, v0 + r, 270]])
    for (let k = 0; k <= n; k++) {
      const a = rad(a0 + 90 * k / n), ca = Math.cos(a), sa = Math.sin(a);
      out.push({ u: cu + r * ca, v: cv + r * sa, nu: ca, nv: sa });
    }
  return out;
}
function hull(input) {
  const pts = input.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const x = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of pts) {
    while (lo.length > 1 && x(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (up.length > 1 && x(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  lo.pop();
  up.pop();
  return lo.concat(up);
}
var ringAt = (P, ring, z) => ring.map((q) => P(q.u, q.v, z));
var facing = (C) => {
  const s = Math.sin(C.az), c = Math.cos(C.az);
  return (q) => q.nu * s + q.nv * c >= -1e-6;
};
function run(ring, keep) {
  const n = ring.length;
  let s = -1;
  for (let i = 0; i < n; i++) if (keep(ring[i]) && !keep(ring[(i + n - 1) % n])) {
    s = i;
    break;
  }
  if (s < 0) return keep(ring[0]) ? ring.slice() : [];
  const out = [];
  for (let k = 0; k < n && keep(ring[(s + k) % n]); k++) out.push(ring[(s + k) % n]);
  return out;
}
function prism(P, front, ring, inner, z0, z1) {
  return {
    sil: poly(hull(ringAt(P, ring, z1).concat(ringAt(P, ring, z0)))),
    crease: inner ? open(ringAt(P, run(inner, front), z1)) : ""
  };
}
var rings = (x0, y0, x1, y1, r, b) => [
  rrect(x0, y0, x1, y1, r),
  rrect(x0 + b, y0 + b, x1 - b, y1 - b, Math.max(0.3, r - b))
];

// ../../../../../private/tmp/hairline-source/packages/hairline/src/core/motion.ts
var reduced = false;
var setReducedMotion = (on) => {
  reduced = on;
};
var reducedMotion = () => reduced;
function spring(x, o = {}) {
  return { x, v: 0, t: x, k: o.k ?? 100, c: o.c ?? 18, m: o.m ?? 1, eps: o.eps ?? 0.01 };
}
function stepS(sp, dt) {
  if (reduced) {
    sp.x = sp.t;
    sp.v = 0;
    return false;
  }
  const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
  for (let i = 0; i < n; i++) {
    const a = (-sp.k * (sp.x - sp.t) - sp.c * sp.v) / sp.m;
    sp.v += a * h;
    sp.x += sp.v * h;
  }
  if (Math.abs(sp.x - sp.t) < sp.eps && Math.abs(sp.v) < sp.eps * 10) {
    sp.x = sp.t;
    sp.v = 0;
    return false;
  }
  return true;
}
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (u) => ((ax * u + bx) * u + cx) * u;
  const Y = (u) => ((ay * u + by) * u + cy) * u;
  const dX = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let u = t;
    for (let i = 0; i < 8; i++) {
      const e = X(u) - t;
      if (Math.abs(e) < 1e-5) break;
      const d = dX(u);
      if (Math.abs(d) < 1e-6) break;
      u -= e / d;
    }
    if (!(u >= 0 && u <= 1) || Math.abs(X(u) - t) > 1e-4) {
      let lo = 0, hi = 1;
      u = t;
      for (let i = 0; i < 24; i++) {
        if (X(u) < t) lo = u;
        else hi = u;
        u = (lo + hi) / 2;
      }
    }
    return Y(u);
  };
}
var EASE_LIFT = bezier(0.32, 0.72, 0, 1);

// ../../../../../private/tmp/hairline-source/packages/hairline/src/core/stage.ts
var NS = "http://www.w3.org/2000/svg";
function mk(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(e);
  return e;
}
function solid(parent) {
  const g = mk("g", {}, parent);
  return { g, sil: mk("path", { class: "sil" }, g), cr: mk("path", { class: "nf lo" }, g) };
}
var put = (el, s) => {
  el.sil.setAttribute("d", s.sil);
  el.cr.setAttribute("d", s.crease);
};
var boards = [];
var byStage = /* @__PURE__ */ new Map();
var raf = 0;
var last = 0;
var io = null;
var rm = null;
function frame() {
  const now = performance.now();
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1e3));
  last = now;
  let any = false;
  for (const b of boards.slice()) if (b.vis && b.awake) {
    try {
      b.awake = !!b.tick(dt, now);
    } catch (err) {
      b.awake = false;
      setTimeout(() => {
        throw err;
      });
    }
    any = any || b.awake;
  }
  raf = any ? requestAnimationFrame(frame) : 0;
}
function wake(b) {
  b.awake = true;
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
}
var onMotion = () => {
  setReducedMotion(!!rm?.matches);
  boards.forEach(wake);
};
function start() {
  if (io) return;
  io = new IntersectionObserver((es) => {
    for (const e of es) {
      const set = byStage.get(e.target);
      if (!set) continue;
      for (const b of set) {
        b.vis = e.isIntersecting;
        if (b.vis) wake(b);
      }
    }
  }, { rootMargin: "80px" });
  rm = matchMedia("(prefers-reduced-motion: reduce)");
  setReducedMotion(rm.matches);
  rm.addEventListener("change", onMotion);
}
function stop() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  io?.disconnect();
  io = null;
  rm?.removeEventListener("change", onMotion);
  rm = null;
}
function register(stage2, tick) {
  start();
  const b = { stage: stage2, tick, vis: false, awake: true };
  boards.push(b);
  const peers = byStage.get(stage2);
  if (peers) {
    for (const p of peers) b.vis = p.vis;
    peers.add(b);
    if (b.vis) wake(b);
  } else {
    byStage.set(stage2, /* @__PURE__ */ new Set([b]));
    io.observe(stage2);
  }
  tick(0, performance.now());
  let gone = false;
  return {
    wake: () => {
      if (!gone) wake(b);
    },
    unregister: () => {
      if (gone) return;
      gone = true;
      boards = boards.filter((x) => x !== b);
      const set = byStage.get(stage2);
      if (set) {
        set.delete(b);
        if (!set.size) {
          byStage.delete(stage2);
          io?.unobserve(stage2);
        }
      }
      if (!boards.length) stop();
    }
  };
}
var handlers = /* @__PURE__ */ new WeakMap();
var touring = /* @__PURE__ */ new WeakMap();
function pointer(stage2, on) {
  handlers.set(stage2, on);
  let tm = 0;
  const pt = (e) => {
    const r = stage2.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width * 400, (e.clientY - r.top) / r.height * 320];
  };
  const move = (e) => {
    clearTimeout(tm);
    touring.get(stage2)?.hold();
    on.move(pt(e), e);
  };
  const down = (e) => {
    clearTimeout(tm);
    touring.get(stage2)?.hold();
    if (e.pointerType !== "mouse") stage2.releasePointerCapture?.(e.pointerId);
    if (on.down) on.down(pt(e), e);
    else on.move(pt(e), e);
  };
  const leave = (e) => {
    clearTimeout(tm);
    tm = window.setTimeout(() => {
      on.leave(e);
      touring.get(stage2)?.release();
    }, e.pointerType === "mouse" ? 0 : 1400);
  };
  stage2.addEventListener("pointermove", move);
  stage2.addEventListener("pointerdown", down);
  stage2.addEventListener("pointerleave", leave);
  return () => {
    clearTimeout(tm);
    if (handlers.get(stage2) === on) handlers.delete(stage2);
    stage2.removeEventListener("pointermove", move);
    stage2.removeEventListener("pointerdown", down);
    stage2.removeEventListener("pointerleave", leave);
  };
}
function disposer() {
  let fns = [];
  return {
    add: (fn) => {
      fns.push(fn);
    },
    on: (target, type, fn, opts) => {
      const h = fn;
      target.addEventListener(type, h, opts);
      fns.push(() => target.removeEventListener(type, h, opts));
    },
    dispose: () => {
      const run2 = fns;
      fns = [];
      for (let i = run2.length - 1; i >= 0; i--) run2[i]();
    }
  };
}

// ../../../../../private/tmp/hairline-source/packages/hairline/src/figures/laptop.ts
var W = 150;
var D = 106;
var HB = 4;
var T = 2.4;
var HZ = HB + T / 2;
var R = 7;
var B = 1.1;
var MIN = 15;
var REST = 100;
var BZ = 4.2;
var CHIN = 7.5;
var KU = 8.6;
var KY = 6;
var lidAt = (th) => {
  const c = Math.cos(rad(th)), s = Math.sin(rad(th));
  return (u, v, w) => [u, v * c - w * s, HZ + v * s + w * c];
};
function keys() {
  const out = [], x0 = (W - 14.5 * KU) / 2;
  const row = (y2, h2, widths) => {
    let x = x0;
    for (const w of widths) {
      out.push([x, y2, x + w * KU, y2 + h2]);
      x += w * KU;
    }
  };
  const ones = (n) => Array(n).fill(1);
  row(KY, KU * 0.6, Array(14).fill(14.5 / 14));
  let y = KY + KU * 0.6;
  for (const w of [[...ones(13), 1.5], [1.5, ...ones(13)], [1.75, ...ones(11), 1.75], [2.25, ...ones(10), 2.25]]) {
    row(y, KU, w);
    y += KU;
  }
  row(y, KU, [1, 1, 1, 1.25, 5, 1.25, 1]);
  const ax = x0 + 11.5 * KU, h = KU / 2;
  out.push([ax, y + h, ax + KU, y + KU], [ax + KU, y, ax + 2 * KU, y + h], [ax + KU, y + h, ax + 2 * KU, y + KU], [ax + 2 * KU, y + h, ax + 3 * KU, y + KU]);
  return { out, y1: y + KU, x0 };
}
var mount = ({ stage: stage2, svg, read }, value) => {
  const bag = disposer();
  let intensity = 1;
  const C = Cam(45, 0.5, 1.48), pts = [[0, 0, 0], [W, 0, 0], [0, D, 0], [W, D, 0]];
  for (const th of [MIN, 90, REST, 125]) for (const u of [0, W]) for (const v of [0, D]) for (const w of [-T / 2, T / 2]) pts.push(lidAt(th)(u, v, w));
  fit(C, pts, 200, 166);
  let P = proj(C), front = facing(C);
  let eye = [];
  function updateEye() {
    const o = P(0, 0, 0), ex = P(1, 0, 0), ey = P(0, 1, 0), ez = P(0, 0, 1);
    const a = [ex[0] - o[0], ey[0] - o[0], ez[0] - o[0]], b = [ex[1] - o[1], ey[1] - o[1], ez[1] - o[1]];
    eye = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    if (eye[2] < 0) eye = eye.map((n) => -n);
  }
  updateEye();
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const g = mk("g", {}, svg);
  const [br, bi] = rings(0, 0, W, D, R, B);
  const base = solid(g);
  put(base, prism(P, front, br, bi, 0, HB));
  const top = (q) => poly(q.map((s) => P(s.u, s.v, HB)));
  const kb = keys();
  const caps = kb.out.map(([a, b, c, d]) => {
    const [outer, inner] = rings(a + 0.65, b + 0.65, c - 0.65, d - 0.65, 1.2, 0.35);
    const body = solid(g);
    body.g.classList.add("portrait-key");
    return { outer, inner, body, center: [(a + c) / 2, (b + d) / 2], at: P((a + c) / 2, (b + d) / 2, HB + 3.4), spring: spring(0, { k: 360, c: 25, eps: 5e-3 }), drawn: NaN };
  });
  const keyboardWell = mk("path", { class: "nf", d: top(rrect(kb.x0 - 1.6, KY - 1.6, W - kb.x0 + 1.6, kb.y1 + 1.6, 3, 4)) }, g);
  const trackpad = mk("path", { class: "nf", d: top(rrect(W / 2 - 35, D - 45, W / 2 + 35, D - 5, 3.2, 4)) }, g);
  const lidG = mk("g", {}, g), lid = solid(lidG), scr = mk("g", {}, lidG);
  lid.sil.classList.add("hi");
  const [lr, li] = rings(0, 0, W, D, R, B);
  const disp = mk("path", { class: "nf" }, scr);
  const defs = mk("defs", {}, svg);
  const clip = mk("clipPath", { id: "hairline-portrait-clip" }, defs);
  mk("rect", { width: 230, height: 155, rx: 4 }, clip);
  const photograph = mk("g", { "clip-path": "url(#hairline-portrait-clip)" }, scr);
  mk("image", { href: new URL("../img/img-cafe.jpg", document.baseURI).href, width: 230, height: 155, preserveAspectRatio: "xMidYMid slice", class: "hairline-portrait-photo" }, photograph);
  const VT = D - BZ;
  let faced = null, drawn = NaN;
  function drawLid(th) {
    if (th === drawn) return;
    drawn = th;
    const f = lidAt(th), c = Math.cos(rad(th)), s = Math.sin(rad(th));
    const at = (u, v, w) => P(...f(u, v, w)), on = (u, v) => at(u, v, -T / 2);
    const plane = (q, w) => q.map((p) => at(p.u, p.v, w));
    const shows = dot([0, s, -c], eye) > 0, wf = shows ? -T / 2 : T / 2;
    const wall = (q) => dot([q.nu, q.nv * c, q.nv * s], eye) > 0;
    put(lid, { sil: poly(hull(plane(lr, -T / 2).concat(plane(lr, T / 2)))), crease: open(plane(run(li, wall), wf)) });
    if (shows !== faced) {
      faced = shows;
      if (shows) lid.g.after(scr);
      else lid.g.before(scr);
    }
    const face = (q) => poly(q.map((p) => on(p.u, p.v)));
    disp.setAttribute("d", face(rrect(BZ, CHIN, W - BZ, VT, 3, 4)));
    const tl = on(BZ, VT), tr = on(W - BZ, VT), bl = on(BZ, CHIN);
    photograph.setAttribute("transform", `matrix(${(tr[0] - tl[0]) / 230} ${(tr[1] - tl[1]) / 230} ${(bl[0] - tl[0]) / 155} ${(bl[1] - tl[1]) / 155} ${tl[0]} ${tl[1]})`);
  }
  drawLid(REST);
  let point = null, clock = 0, keyboardPulse = -1;
  let ripple = null;
  let keyboardUntil = 0;
  const nearest = (p) => {
    if (!p) return -1;
    let best = -1, distance = 15;
    caps.forEach((key, i) => {
      const d = Math.hypot(p[0] - key.at[0], p[1] - key.at[1]);
      if (d < distance) {
        distance = d;
        best = i;
      }
    });
    return best;
  };
  const yaw = spring(45, { k: 40, c: 13, eps: 3e-3 });
  const tilt = spring(0.5, { k: 40, c: 13, eps: 1e-4 });
  let pose = "";
  let drag = null;
  const board = register(stage2, (dt) => {
    clock += dt;
    const reduced2 = reducedMotion();
    yaw.t = reduced2 || !drag ? 45 : 45 + clamp(drag.dx / 100, -1, 1) * 20;
    tilt.t = reduced2 || !drag ? 0.5 : 0.5 + clamp(drag.dy / 100, -1, 1) * 0.08;
    stepS(yaw, dt);
    stepS(tilt, dt);
    const bob = 0;
    const nextPose = `${yaw.x.toFixed(3)}:${tilt.x.toFixed(4)}:${bob.toFixed(2)}`;
    if (nextPose !== pose) {
      pose = nextPose;
      C.az = rad(yaw.x);
      C.k = tilt.x;
      fit(C, pts, 200, 166 + bob);
      P = proj(C);
      front = facing(C);
      updateEye();
      put(base, prism(P, front, br, bi, 0, HB));
      keyboardWell.setAttribute("d", top(rrect(kb.x0 - 1.6, KY - 1.6, W - kb.x0 + 1.6, kb.y1 + 1.6, 3, 4)));
      trackpad.setAttribute("d", top(rrect(W / 2 - 35, D - 45, W / 2 + 35, D - 5, 3.2, 4)));
      drawn = NaN;
      drawLid(REST);
      caps.forEach((key) => {
        key.at = P(key.center[0], key.center[1], HB + 3.4);
        key.drawn = NaN;
      });
    }
    const hover = nearest(point);
    const typing = !point && !reduced2 && keyboardPulse < 0;
    const autoKey = typing ? (Math.floor(clock / 0.48) * 23 + 17) % caps.length : -1;
    const autoPress = typing ? Math.sin(Math.PI * Math.min(1, clock % 0.48 / 0.24)) : 0;
    if (clock > keyboardUntil) keyboardPulse = -1;
    if (ripple && clock - ripple.start > 0.85) ripple = null;
    let moving = false;
    caps.forEach((key, i) => {
      let press = i === hover || i === keyboardPulse ? 1 : 0;
      if (hover >= 0) {
        const h = caps[hover].at;
        press = Math.max(press, Math.max(0, 1 - Math.hypot(key.at[0] - h[0], key.at[1] - h[1]) / 18) * 0.7);
      }
      if (autoKey === i) press = Math.max(press, autoPress);
      if (ripple && !reduced2) {
        const distance = Math.hypot(key.at[0] - ripple.at[0], key.at[1] - ripple.at[1]);
        const wave = Math.max(0, 1 - Math.abs(distance - (clock - ripple.start) * 150) / 18);
        press = Math.max(press, wave * Math.max(0, 1 - (clock - ripple.start) / 0.85));
      }
      key.spring.t = press * 2.8 * intensity;
      moving = stepS(key.spring, dt) || moving;
      if (key.drawn !== key.spring.x) {
        key.drawn = key.spring.x;
        put(key.body, prism(P, front, key.outer, key.inner, HB + 0.15, HB + 3.4 - key.spring.x));
      }
    });
    return moving || !!ripple || !reduced2 || keyboardPulse >= 0;
  });
  bag.add(board.unregister);
  bag.add(pointer(stage2, {
    move: (p, e) => {
      if (drag && e.pointerId === drag.id) { drag.dx = p[0] - drag.x; drag.dy = p[1] - drag.y; }
      point = p;
      board.wake();
    },
    down: (p, e) => {
      if (e.button !== 0) return;
      drag = { id: e.pointerId, x: p[0], y: p[1], dx: 0, dy: 0 };
      stage2.dataset.dragging = "true";
      if (e.pointerType === "mouse") stage2.setPointerCapture(e.pointerId);
      point = p;
      if (nearest(p) >= 0) ripple = { at: p, start: clock };
      board.wake();
    },
    leave: () => {
      if (drag) return;
      point = null;
      board.wake();
    }
  }));
  const releaseDrag = () => {
    drag = null;
    delete stage2.dataset.dragging;
    point = null;
    board.wake();
  };
  bag.on(stage2, "pointerup", releaseDrag);
  bag.on(stage2, "pointercancel", releaseDrag);
  bag.on(stage2, "lostpointercapture", releaseDrag);
  bag.on(stage2, "keydown", (e) => {
    if (e.key.length !== 1 && !e.key.startsWith("Arrow")) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    keyboardPulse = e.key.charCodeAt(0) % caps.length;
    keyboardUntil = clock + 0.2;
    ripple = { at: caps[keyboardPulse].at, start: clock };
    board.wake();
  });
  bag.on(stage2, "blur", () => {
    releaseDrag();
    point = null;
    keyboardPulse = -1;
    board.wake();
  });
  bag.add(() => svg.replaceChildren());
  return { set: (v) => {
    intensity = clamp(v, 0.3, 1);
    board.wake();
  }, destroy: bag.dispose };
};

// ../../../../../private/tmp/hairline-source/packages/hairline/src/core/styles.ts
var LIGHT = { plate: "#ffffff", hi: "#232327", edge: "#a4a4ac", mid: "#c3c3c9", lo: "#e0e0e4" };
var DARK = { plate: "#08090a", hi: "#d0d6e0", edge: "#5b5d64", mid: "#3e3e44", lo: "#29292d" };
var KEYS = ["plate", "hi", "edge", "mid", "lo"];
var vars = (p) => KEYS.map((k) => `--hl-${k}:var(--hairline-${k},${p[k]});`).join("");
var EASE = "cubic-bezier(0.5,0,0.1,1)";
var SVG = ":where([data-hairline]>svg)";
function css(lightDark) {
  const both = Object.fromEntries(KEYS.map((k) => [k, `light-dark(${LIGHT[k]},${DARK[k]})`]));
  return [
    // the box, and the palette: light unless something below says otherwise
    `:where([data-hairline]){display:block;position:relative;aspect-ratio:5/4;touch-action:pan-y;user-select:none;-webkit-user-select:none;--hl-sw:var(--hairline-stroke,0.9);${vars(LIGHT)}}`,
    // the page's color-scheme
    lightDark ? `:where([data-hairline]){${vars(both)}}` : "",
    // an ancestor that says dark
    `:where(.dark,[data-theme="dark"]) :where([data-hairline]){${vars(DARK)}}`,
    // the figure's own theme option
    `:where([data-hairline][data-hairline-theme="light"]){${vars(LIGHT)}}`,
    `:where([data-hairline][data-hairline-theme="dark"]){${vars(DARK)}}`,
    `:where([data-hairline]:focus-visible){outline:1.5px solid var(--hl-hi);outline-offset:2px}`,
    `${SVG}{position:absolute;inset:0;width:100%;height:100%;display:block}`,
    // Riffle's live region: read, not seen
    `:where([data-hairline]>[data-hairline-live]){position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}`,
    // the drawing: plates are filled with the plate colour and painted back to front
    `${SVG} :where(path,polygon,ellipse,line){fill:var(--hl-plate);stroke:var(--hl-mid);stroke-width:var(--hl-sw);vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round;transition:stroke 260ms ${EASE}}`,
    `${SVG} :where(.nf){fill:none}`,
    `${SVG} :where(.fo){stroke:none}`,
    `${SVG} :where(.sil){stroke:var(--hl-edge)}`,
    `${SVG} :where(.hi){stroke:var(--hl-hi)}`,
    `${SVG} :where(.lo){stroke:var(--hl-lo)}`,
    `${SVG} :where(.dash){stroke-dasharray:1 3}`,
    `${SVG} :where(.dot){stroke:none;fill:var(--hl-hi);transition:fill 260ms ${EASE}}`,
    `${SVG} :where(.dot.m){fill:var(--hl-edge)}`,
    `${SVG} :where(.dot.off){fill:var(--hl-lo)}`,
    `${SVG} :where(.ghost path){fill:none;stroke:var(--hl-mid)}`
  ].join("");
}
var done = /* @__PURE__ */ new WeakSet();
function inject(root) {
  if (done.has(root)) return;
  done.add(root);
  const doc = root.nodeType === 9 ? root : root.ownerDocument;
  const win = doc.defaultView;
  const text = css(!!win?.CSS?.supports?.("color", "light-dark(#000,#fff)"));
  if (win && "adoptedStyleSheets" in root) {
    try {
      const sheet = new win.CSSStyleSheet();
      sheet.replaceSync(text);
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
      return;
    } catch {
    }
  }
  const style = doc.createElement("style");
  style.setAttribute("data-hairline-style", "");
  style.textContent = text;
  (root.nodeType === 9 ? doc.head ?? doc.documentElement : root).appendChild(style);
}

// ../../../../../private/tmp/hairline-source/portrait-entry.ts
var stage = document.querySelector("[data-portrait-laptop]");
if (stage) {
  const svg = stage.querySelector("svg");
  stage.dataset.hairline = "laptop";
  stage.dataset.hairlineTheme = "dark";
  inject(document);
  svg.replaceChildren();
  mount({ stage, svg, read: { textContent: "" } }, 125);
}

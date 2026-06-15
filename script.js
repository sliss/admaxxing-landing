/* ============================================================
   ADMAXXING v3
   - A real Windows 98 "3D Pipes" screensaver (canvas)
   - The live product chyron
   - An odometer earnings counter
   ============================================================ */

/* ============================================================
   1) 3D PIPES SCREENSAVER
   Pipes grow cell-by-cell through a 3D grid, turning at random
   right angles with shiny ball joints, drawn with a slowly
   rotating perspective camera. Resets when the space fills up.
   ============================================================ */
(function () {
  var canvas = document.getElementById('pipes');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  // Grid + look
  var GW = 13, GH = 9, GD = 13;
  var SPACING = 30;
  var FOCAL = 720, CAM = 640;
  var TILT = 0.30;                 // fixed x-axis tilt
  var ROT_SPEED = 0.0022;          // y-axis auto-rotation per frame
  var PIPE_W = 30;                 // base pixel width (scaled by depth)
  var MAX_SEGMENTS = 320;          // grow this many, then reset
  var GROW_MS = 65;                // one segment every N ms

  var DIRS = [
    {x: 1, y: 0, z: 0}, {x: -1, y: 0, z: 0},
    {x: 0, y: 1, z: 0}, {x: 0, y: -1, z: 0},
    {x: 0, y: 0, z: 1}, {x: 0, y: 0, z: -1}
  ];

  var occupied, segments, joints, active, total, angle;
  var cw, ch, cx, cy, dpr;

  function key(p) { return p.x + ',' + p.y + ',' + p.z; }
  function inBounds(p) { return p.x >= 0 && p.x < GW && p.y >= 0 && p.y < GH && p.z >= 0 && p.z < GD; }

  function randColor() {
    var h = Math.floor(Math.random() * 360);
    return {
      base: 'hsl(' + h + ',62%,55%)',
      hi:   'hsl(' + h + ',72%,80%)',
      lo:   'hsl(' + h + ',58%,30%)'
    };
  }

  function freeDirs(p) {
    var out = [];
    for (var i = 0; i < DIRS.length; i++) {
      var n = {x: p.x + DIRS[i].x, y: p.y + DIRS[i].y, z: p.z + DIRS[i].z};
      if (inBounds(n) && !occupied[key(n)]) out.push(DIRS[i]);
    }
    return out;
  }

  function startPipe() {
    // find a random free cell with at least one free neighbour
    for (var tries = 0; tries < 240; tries++) {
      var p = {
        x: Math.floor(Math.random() * GW),
        y: Math.floor(Math.random() * GH),
        z: Math.floor(Math.random() * GD)
      };
      if (occupied[key(p)]) continue;
      if (freeDirs(p).length === 0) continue;
      occupied[key(p)] = true;
      active = {pos: p, dir: null, color: randColor()};
      joints.push({p: {x: p.x, y: p.y, z: p.z}, color: active.color}); // start cap
      return true;
    }
    return false; // space is full
  }

  function reset() {
    occupied = {};
    segments = [];
    joints = [];
    total = 0;
    active = null;
    startPipe();
  }

  function grow() {
    if (!active) { if (!startPipe()) { reset(); } return; }
    if (total >= MAX_SEGMENTS) { reset(); return; }

    var p = active.pos;
    var options = freeDirs(p);
    if (options.length === 0) {
      // dead end — cap it and sprout a fresh pipe elsewhere
      if (!startPipe()) reset();
      return;
    }

    var dir;
    var straightOk = active.dir && options.indexOf(active.dir) !== -1;
    if (straightOk && Math.random() > 0.30) {
      dir = active.dir;                 // keep going straight
    } else {
      dir = options[Math.floor(Math.random() * options.length)];
    }

    if (active.dir && (dir.x !== active.dir.x || dir.y !== active.dir.y || dir.z !== active.dir.z)) {
      joints.push({p: {x: p.x, y: p.y, z: p.z}, color: active.color}); // elbow ball
    }

    var next = {x: p.x + dir.x, y: p.y + dir.y, z: p.z + dir.z};
    segments.push({a: {x: p.x, y: p.y, z: p.z}, b: next, color: active.color});
    occupied[key(next)] = true;
    active.pos = next;
    active.dir = dir;
    total++;
  }

  // 3D -> 2D with Y-rotation + fixed tilt + perspective
  function project(p) {
    var x = (p.x - (GW - 1) / 2) * SPACING;
    var y = (p.y - (GH - 1) / 2) * SPACING;
    var z = (p.z - (GD - 1) / 2) * SPACING;

    var cosY = Math.cos(angle), sinY = Math.sin(angle);
    var x1 = x * cosY + z * sinY;
    var z1 = -x * sinY + z * cosY;

    var cosX = Math.cos(TILT), sinX = Math.sin(TILT);
    var y1 = y * cosX - z1 * sinX;
    var z2 = y * sinX + z1 * cosX;

    var scale = FOCAL / (FOCAL + CAM + z2);
    return {x: cx + x1 * scale, y: cy + y1 * scale, scale: scale, depth: z2};
  }

  function render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);

    var items = [];
    var i, s, a, b, j, pp;

    for (i = 0; i < segments.length; i++) {
      s = segments[i];
      a = project(s.a); b = project(s.b);
      items.push({t: 'pipe', a: a, b: b, color: s.color, depth: (a.depth + b.depth) / 2, scale: (a.scale + b.scale) / 2});
    }
    for (i = 0; i < joints.length; i++) {
      j = joints[i];
      pp = project(j.p);
      items.push({t: 'joint', p: pp, color: j.color, depth: pp.depth, scale: pp.scale});
    }

    // painter's algorithm: far (larger depth) first
    items.sort(function (m, n) { return n.depth - m.depth; });

    ctx.lineCap = 'round';
    for (i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.t === 'pipe') {
        var w = Math.max(2, PIPE_W * it.scale);
        ctx.strokeStyle = it.color.lo;
        ctx.lineWidth = w;
        line(it.a, it.b);
        ctx.strokeStyle = it.color.base;
        ctx.lineWidth = w * 0.66;
        line(it.a, it.b);
        ctx.strokeStyle = it.color.hi;
        ctx.lineWidth = w * 0.24;
        line(it.a, it.b);
      } else {
        var r = Math.max(2.5, PIPE_W * 0.62 * it.scale);
        var g = ctx.createRadialGradient(
          it.p.x - r * 0.35, it.p.y - r * 0.35, r * 0.1,
          it.p.x, it.p.y, r
        );
        g.addColorStop(0, it.color.hi);
        g.addColorStop(0.5, it.color.base);
        g.addColorStop(1, it.color.lo);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(it.p.x, it.p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function line(a, b) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    cw = rect.width; ch = rect.height;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = cw / 2; cy = ch / 2;
  }

  var lastGrow = 0;
  function frame(t) {
    angle += ROT_SPEED;
    if (t - lastGrow >= GROW_MS) { grow(); lastGrow = t; }
    render();
    requestAnimationFrame(frame);
  }

  // boot
  angle = 0;
  resize();
  window.addEventListener('resize', resize);
  reset();
  // seed a few segments so it doesn't start empty
  for (var k = 0; k < 18; k++) grow();
  requestAnimationFrame(frame);
})();


/* ============================================================
   2) LIVE PRODUCT CHYRON
   Real, friendly sample messages (the toolbar in action).
   ============================================================ */
(function () {
  var el = document.getElementById('chyronContent');
  if (!el) return;
  var ADS = [
    "Crater — ship your app to the edge in one command",
    "Sentinel catches the bug before your users do",
    "Quanta: serverless Postgres that scales to zero",
    "Relay — one API gateway for all your microservices",
    "Add login in 5 minutes with Keycard auth + SSO",
    "Ledgerline — accept payments in three lines of code",
    "Beacon: trace every request, sleep through the night",
    "Cortex vector DB — ship AI features this week",
    "Glyph — the cloud IDE you can code from anywhere",
    "Standup — daily team syncs without the meeting",
    "Capital — fee-free banking built for startups",
    "Probe runs your whole test suite in 90 seconds"
  ];
  var html = '';
  for (var i = 0; i < ADS.length; i++) {
    html += ADS[i] + ' <span class="sep">◆</span> ';
  }
  el.innerHTML = html + html; // seamless loop
})();


/* ============================================================
   3) ODOMETER EARNINGS COUNTER
   Mechanical roll-up digits for the live "earned today" balance.
   ============================================================ */
(function () {
  var host = document.getElementById('earnOdo');
  if (!host) return;
  var built = '';      // current character template ("$0.0000")
  var digitEls = [];   // strip elements aligned to template positions

  function build(str) {
    host.innerHTML = '';
    digitEls = [];
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch >= '0' && ch <= '9') {
        var d = document.createElement('span');
        d.className = 'odo-digit';
        var strip = document.createElement('span');
        strip.className = 'odo-strip';
        for (var n = 0; n <= 9; n++) {
          var s = document.createElement('span');
          s.textContent = n;
          strip.appendChild(s);
        }
        d.appendChild(strip);
        host.appendChild(d);
        digitEls.push(strip);
      } else {
        var stat = document.createElement('span');
        stat.className = 'odo-static';
        stat.textContent = ch;
        host.appendChild(stat);
        digitEls.push(null);
      }
    }
    built = str;
  }

  function set(str) {
    if (str.length !== built.length) build(str);
    for (var i = 0; i < str.length; i++) {
      var strip = digitEls[i];
      if (!strip) continue;
      var d = parseInt(str[i], 10);
      strip.style.transform = 'translateY(' + (-d * 22) + 'px)';
    }
  }

  var earned = 0;
  build('$0.0000');
  set('$0.0000');
  setInterval(function () {
    earned += 0.0002 + Math.random() * 0.0004;
    set('$' + earned.toFixed(4));
  }, 220);
})();


/* ============================================================
   4) SIGN UP
   Demo handler: confirms inline without a backend. To actually
   collect emails, point the <form> at a form endpoint (e.g.
   Formspree) and delete this preventDefault handler — see notes.
   ============================================================ */
function signup(e) {
  e.preventDefault();
  var note = document.getElementById('signupNote');
  var email = document.getElementById('signupEmail');
  if (note) {
    note.textContent = "✓ You're on the list! We'll email your download link at launch.";
    note.style.color = '#0a7d1a';
    note.style.fontWeight = 'bold';
  }
  if (email) { email.value = ''; email.blur(); }
  return false;
}
window.signup = signup;

/* ============================================================
   ADMAXXING — The Attention Standard
   Tasteful motion: scroll reveals, metric count-ups,
   a single calm chyron, a quietly climbing balance.
   ============================================================ */

// ---- The single, considered message (premium chyron) ----
var MESSAGES = [
  ['A new chapter of ', 'Aria', ' — the novel a million readers are savoring this summer.'],
  ['', 'Equinox', ' linen. Made to last a decade. Considered for your taste in quiet craft.'],
  ['The ', 'Lyric', ' electric — the first car designed entirely around stillness.'],
  ['', 'Field Notes', ' from the Atacama Observatory. A documentary worth your evening.'],
  ['', 'Meridian', ' single-origin, roasted the morning it ships. For the unhurried cup.'],
  ['', 'Halcyon', ' headphones. Engineered to disappear, so the music can arrive.'],
];

function buildChyron() {
  var el = document.getElementById('chyronLine');
  if (!el) return;
  var i = 0;

  function show(idx) {
    var m = MESSAGES[idx];
    el.innerHTML = m[0] + '<span class="accent">' + m[1] + '</span>' + m[2];
    // gentle drift from right, settle, hold, fade
    var w = el.parentElement.offsetWidth;
    el.style.transition = 'none';
    el.style.opacity = '0';
    el.style.transform = 'translateX(' + (w * 0.5) + 'px)';
    // next frame
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.style.transition = 'transform 1.6s cubic-bezier(.2,.8,.2,1), opacity .8s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateX(0)';
      });
    });
  }

  show(0);
  setInterval(function () {
    var el2 = document.getElementById('chyronLine');
    el2.style.transition = 'opacity .6s ease, transform 1.2s ease';
    el2.style.opacity = '0';
    el2.style.transform = 'translateX(-40px)';
    setTimeout(function () {
      i = (i + 1) % MESSAGES.length;
      show(i);
    }, 650);
  }, 5200);
}

// ---- Quietly climbing balance ----
function tickEarnings() {
  var el = document.getElementById('earn');
  if (!el) return;
  var v = 0;
  setInterval(function () {
    v += 0.0001 + Math.random() * 0.00015;
    el.textContent = v.toFixed(4);
  }, 140);
}

// ---- Scroll reveal ----
function setupReveal() {
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (e) { e.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry, idx) {
      if (entry.isIntersecting) {
        // small stagger for grouped elements
        var delay = (entry.target.dataset.delay || 0);
        setTimeout(function () { entry.target.classList.add('in'); }, delay);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  // stagger siblings within a grid
  els.forEach(function (el) {
    var siblings = Array.prototype.indexOf.call(el.parentElement.children, el);
    el.dataset.delay = Math.min(siblings, 4) * 80;
    io.observe(el);
  });
}

// ---- Metric count-ups ----
function animateMetric(el) {
  var target = parseFloat(el.dataset.target);
  var decimals = parseInt(el.dataset.decimals || '0', 10);
  var prefix = el.dataset.prefix || '';
  var suffix = el.dataset.suffix || '';
  var dur = 1400;
  var start = null;

  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  function frame(ts) {
    if (start === null) start = ts;
    var p = Math.min((ts - start) / dur, 1);
    var val = target * ease(p);
    el.textContent = prefix + val.toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(frame);
    else el.textContent = prefix + target.toFixed(decimals) + suffix;
  }
  requestAnimationFrame(frame);
}

function setupMetrics() {
  var metrics = document.querySelectorAll('.metric-num');
  if (!('IntersectionObserver' in window)) {
    metrics.forEach(animateMetric);
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateMetric(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  metrics.forEach(function (m) { io.observe(m); });
}

// ---- Waitlist ----
function joinWaitlist(e) {
  e.preventDefault();
  var fine = document.getElementById('ctaFine');
  var input = e.target.querySelector('input');
  if (fine) {
    fine.textContent = 'Thank you — you’re on the list. We’ll bring you aboard shortly. ✦';
    fine.style.color = '#f0a85a';
  }
  if (input) { input.value = ''; input.blur(); }
  return false;
}
window.joinWaitlist = joinWaitlist;

// ---- Boot ----
document.addEventListener('DOMContentLoaded', function () {
  buildChyron();
  tickEarnings();
  setupReveal();
  setupMetrics();
});

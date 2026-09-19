/* R & K Hardware and Construction Co. - shared scripts (loaded at end of <body>) */
(function () {
  'use strict';

  /* Footer year */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* Mobile menu */
  var menuBtn = document.getElementById('menuBtn');
  var navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    var setOpen = function (open) {
      navLinks.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    menuBtn.addEventListener('click', function () { setOpen(!navLinks.classList.contains('open')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) { setOpen(false); menuBtn.focus(); }
    });
  }

  /* Reveal on scroll (content is visible by default if JS or IntersectionObserver is unavailable) */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Quote form: thank-you state on the same page ---------- */
  var form = document.getElementById('quoteForm');
  var thanks = document.getElementById('formThanks');
  function showThanks() {
    if (!form || !thanks) return;
    form.hidden = true;
    thanks.hidden = false;
    thanks.setAttribute('tabindex', '-1');
    thanks.focus();
    thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (form && thanks) {
    // FormSubmit redirects back to contact.html?sent=1 (the _next field) after a normal POST
    if (/[?&]sent=1(&|$)/.test(window.location.search)) showThanks();

    // Enhancement: send in the background so the visitor never leaves the page
    form.addEventListener('submit', function (e) {
      if (!window.fetch || !window.FormData) return; // fall back to normal POST + _next redirect
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var err = document.getElementById('formError');
      if (err) err.hidden = true;
      if (btn) { btn.disabled = true; btn.textContent = 'Sending\u2026'; }
      fetch(form.getAttribute('data-ajax'), {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function (r) {
        if (!r.ok) throw new Error('bad status');
        return r.json();
      }).then(function () {
        showThanks();
      }).catch(function () {
        // Background send failed: submit normally so the _next redirect still runs
        form.submit();
      });
    });
  }

  /* ---------- Material estimator ---------- */
  var card = document.querySelector('.est-card');
  if (!card) return;

  var delIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>';

  // Round away floating-point noise (e.g. 6.6 / 2.2 = 3.0000000000000004) before rounding up
  function ceil(n) { return Math.ceil(Math.round(n * 1e6) / 1e6); }

  function resultItem(label, value, unit) {
    return '<div class="res-item"><div class="ri-lbl">' + label + '</div>' +
           '<div class="ri-val">' + value + '<span>' + unit + '</span></div></div>';
  }

  function renderTileResults(el, area, type) {
    if (area <= 0) {
      el.innerHTML = '<div class="est-placeholder">Enter dimensions to see instant estimates.</div>';
      return;
    }
    var tileArea = area * 1.10;
    var tiles = ceil(tileArea);
    var adhesive = ceil(area / 2.2);
    var grout = ceil(area / 8);

    var packRow = '';
    if (type === 'floor') {
      var sizeSel = document.getElementById('floorTileSize');
      var parts = sizeSel.value.split('|').map(Number);
      var packs = ceil(tileArea / parts[0]);
      packRow = resultItem('Packs needed (' + parts[0] + ' m\u00b2/pack)', packs, 'packs') +
                resultItem('Total pieces', packs * parts[1], 'pcs');
    }

    el.innerHTML =
      '<div class="res-total"><div class="rt-lbl">Total area</div><div class="rt-val">' + area.toFixed(2) + '<span>m\u00b2</span></div></div>' +
      resultItem('Tile area needed (incl. 10% waste)', tiles, 'm\u00b2') +
      packRow +
      resultItem('Tile adhesive (20 kg bags)', adhesive, 'bags') +
      resultItem('Grout (5 kg packs)', grout, 'packs');
  }

  function calcArea(type) {
    var wrap = card.querySelector('[data-rooms="' + type + '-rooms"]');
    var total = 0;
    wrap.querySelectorAll('.est-room').forEach(function (room) {
      var a = parseFloat(room.querySelector('.a-inp').value) || 0;
      var b = parseFloat(room.querySelector('.b-inp').value) || 0;
      total += a * b;
    });
    return total;
  }

  function recalc(type) {
    renderTileResults(card.querySelector('[data-results="' + type + '"]'), calcArea(type), type);
  }

  function renumber(type) {
    var label = type === 'wall' ? 'Wall area' : 'Room';
    card.querySelectorAll('[data-rooms="' + type + '-rooms"] .est-room').forEach(function (room, i) {
      room.querySelector('.room-num').textContent = label + ' ' + (i + 1);
    });
  }

  function bindRoom(room, type) {
    room.querySelectorAll('.est-inp').forEach(function (inp) {
      inp.addEventListener('input', function () { recalc(type); });
    });
    var delBtn = room.querySelector('.rm-del');
    if (delBtn) delBtn.addEventListener('click', function () {
      room.remove(); renumber(type); recalc(type);
    });
  }

  card.querySelectorAll('.est-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      card.querySelectorAll('.est-tab').forEach(function (t) { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); t.setAttribute('tabindex', '-1'); });
      card.querySelectorAll('.est-panel').forEach(function (p) { p.classList.remove('active'); });
      tab.classList.add('active'); tab.setAttribute('aria-selected', 'true'); tab.setAttribute('tabindex', '0');
      card.querySelector('[data-panel="' + tab.dataset.tab + '"]').classList.add('active');
    });
    // Arrow-key navigation between tabs
    tab.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var tabs = Array.prototype.slice.call(card.querySelectorAll('.est-tab'));
      var next = tabs[(tabs.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus(); next.click();
    });
  });

  card.querySelectorAll('.est-add').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var type = btn.dataset.type;
      var wrap = card.querySelector('[data-rooms="' + type + '-rooms"]');
      var clone = wrap.querySelector('.est-room').cloneNode(true);
      clone.querySelectorAll('.est-inp').forEach(function (i) { i.value = ''; });
      if (!clone.querySelector('.rm-del')) {
        var del = document.createElement('button');
        del.type = 'button'; del.className = 'rm-del'; del.setAttribute('aria-label', 'Remove this measurement');
        del.innerHTML = delIcon;
        clone.appendChild(del);
      }
      wrap.appendChild(clone);
      renumber(type);
      bindRoom(clone, type);
    });
  });

  ['floor', 'wall'].forEach(function (type) {
    card.querySelectorAll('[data-rooms="' + type + '-rooms"] .est-room').forEach(function (room) { bindRoom(room, type); });
  });

  var floorSizeSel = document.getElementById('floorTileSize');
  if (floorSizeSel) floorSizeSel.addEventListener('change', function () { recalc('floor'); });
})();

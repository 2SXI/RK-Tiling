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
    // Close on tapping a link, tapping outside the menu, scrolling, or resizing up to desktop
    navLinks.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('click', function (e) {
      if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !menuBtn.contains(e.target)) setOpen(false);
    });
    window.addEventListener('scroll', function () { if (navLinks.classList.contains('open')) setOpen(false); }, { passive: true });
    window.addEventListener('resize', function () { if (window.innerWidth > 1060) setOpen(false); });
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

  /* ---------- Newsletter sign-up (footer + catalogue band) ---------- */
  var newsForms = document.querySelectorAll('form[data-newsletter]');
  var SUB_KEY = 'rk_subscribed';
  function newsThanks(form) { return form.parentNode.querySelector('.news-thanks'); }
  function showNewsThanks(form, focus) {
    var t = newsThanks(form);
    if (!t) return;
    form.hidden = true;
    t.hidden = false;
    if (focus) { t.setAttribute('tabindex', '-1'); t.focus(); }
  }
  function rememberSubscribed() { try { window.localStorage.setItem(SUB_KEY, '1'); } catch (e) { /* storage unavailable */ } }
  function isRemembered() { try { return window.localStorage.getItem(SUB_KEY) === '1'; } catch (e) { return false; } }

  if (newsForms.length) {
    // Returning subscribers (or the no-JS redirect from FormSubmit) see the thank-you / download state
    var cameBack = /[?&]subscribed=1(&|$)/.test(window.location.search);
    if (cameBack) rememberSubscribed();
    if (cameBack || isRemembered()) {
      newsForms.forEach(function (f) { showNewsThanks(f, false); });
      if (cameBack) {
        var firstThanks = newsThanks(newsForms[0]);
        if (firstThanks) firstThanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    newsForms.forEach(function (form) {
      form.addEventListener('submit', function (e) {
        if (!window.fetch || !window.FormData) return; // fall back to normal POST + _next redirect
        e.preventDefault();
        var btn = form.querySelector('button[type="submit"]');
        var err = form.querySelector('.form-error');
        var label = btn ? btn.textContent : '';
        if (err) err.hidden = true;
        if (btn) { btn.disabled = true; btn.textContent = 'Subscribing\u2026'; }
        fetch(form.getAttribute('data-ajax'), {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        }).then(function (r) {
          if (!r.ok) throw new Error('bad status');
          return r.json();
        }).then(function () {
          rememberSubscribed();
          newsForms.forEach(function (f) { showNewsThanks(f, f === form); });
        }).catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = label; }
          if (err) err.hidden = false;
        });
      });
    });
  }

  /* ---------- Gallery: category filter + lightbox (photos and video) ---------- */
  var galleryRoot = document.querySelector('[data-gallery]');
  if (galleryRoot) {
    var photoGrid = galleryRoot.querySelector('.g-photos');

    // Filter chips (hidden in the HTML so the page works without JS)
    var filterBar = galleryRoot.querySelector('.g-filters');
    if (filterBar && photoGrid) {
      var chips = filterBar.querySelectorAll('.g-chip');
      var status = galleryRoot.querySelector('.g-status');
      filterBar.hidden = false;
      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          var cat = chip.getAttribute('data-filter');
          var shown = 0;
          chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
          photoGrid.querySelectorAll('.g-item').forEach(function (it) {
            var match = cat === 'all' || it.getAttribute('data-cat') === cat;
            it.hidden = !match;
            if (match) shown++;
          });
          if (status) status.textContent = shown + (shown === 1 ? ' photo shown' : ' photos shown');
        });
      });
    }

    // Lightbox: native <dialog>, so focus trapping and Esc come for free. Without it, links just open the file.
    var probe = document.createElement('dialog');
    if (typeof probe.showModal === 'function') {
      var icon = {
        close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
        prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
        next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
      };
      var dlg = document.createElement('dialog');
      dlg.className = 'lightbox';
      dlg.setAttribute('aria-label', 'Gallery viewer');
      dlg.innerHTML =
        '<div class="lb-inner"><div class="lb-stage"></div><p class="lb-cap"></p></div>' +
        '<button type="button" class="lb-btn lb-close" aria-label="Close">' + icon.close + '</button>' +
        '<button type="button" class="lb-btn lb-prev" aria-label="Previous">' + icon.prev + '</button>' +
        '<button type="button" class="lb-btn lb-next" aria-label="Next">' + icon.next + '</button>';
      document.body.appendChild(dlg);

      var stage = dlg.querySelector('.lb-stage');
      var capEl = dlg.querySelector('.lb-cap');
      var prevBtn = dlg.querySelector('.lb-prev');
      var nextBtn = dlg.querySelector('.lb-next');
      var group = [];
      var idx = 0;

      var render = function () {
        var a = group[idx];
        var type = a.getAttribute('data-type') || 'image';
        var fig = a.closest('.g-item');
        var capNode = fig && fig.querySelector('figcaption');
        var caption = capNode ? capNode.textContent : '';
        var thumb = a.querySelector('img');
        stage.innerHTML = '';
        if (type === 'video') {
          var v = document.createElement('video');
          v.controls = true; v.autoplay = true; v.playsInline = true; v.preload = 'metadata';
          v.src = a.getAttribute('href');
          if (a.getAttribute('data-poster')) v.poster = a.getAttribute('data-poster');
          stage.appendChild(v);
        } else if (type === 'youtube') {
          var f = document.createElement('iframe');
          f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(a.getAttribute('data-youtube')) + '?autoplay=1&rel=0';
          f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
          f.setAttribute('allowfullscreen', '');
          f.title = caption || 'Video';
          stage.appendChild(f);
        } else {
          var im = document.createElement('img');
          im.src = a.getAttribute('href');
          im.alt = thumb ? thumb.alt : caption;
          stage.appendChild(im);
        }
        capEl.innerHTML = '';
        capEl.appendChild(document.createTextNode(caption));
        if (group.length > 1) {
          var count = document.createElement('span');
          count.className = 'lb-count';
          count.textContent = (idx + 1) + ' / ' + group.length;
          capEl.appendChild(count);
        }
        prevBtn.hidden = nextBtn.hidden = group.length < 2;
      };
      var step = function (d) { idx = (idx + d + group.length) % group.length; render(); };

      galleryRoot.addEventListener('click', function (e) {
        var a = e.target.closest('a.g-link');
        if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        var grid = a.closest('.g-grid');
        group = Array.prototype.filter.call(grid.querySelectorAll('.g-item'), function (it) { return !it.hidden; })
          .map(function (it) { return it.querySelector('a.g-link'); });
        idx = Math.max(0, group.indexOf(a));
        render();
        document.body.classList.add('lb-open');
        dlg.showModal();
      });
      prevBtn.addEventListener('click', function () { step(-1); });
      nextBtn.addEventListener('click', function () { step(1); });
      dlg.querySelector('.lb-close').addEventListener('click', function () { dlg.close(); });
      dlg.addEventListener('click', function (e) {
        // click on the dark area around the media closes the viewer
        if (e.target === dlg || e.target.classList.contains('lb-inner') || e.target.classList.contains('lb-stage')) dlg.close();
      });
      dlg.addEventListener('keydown', function (e) {
        if (group.length < 2) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      });
      dlg.addEventListener('close', function () {
        stage.innerHTML = ''; // removes <video>/<iframe> so playback stops
        document.body.classList.remove('lb-open');
      });
    }
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

  // Wall tiles are sold by the box: 1 box covers 1.44 m\u00b2
  var WALL_BOX_M2 = 1.44;

  function renderTileResults(el, area, type) {
    if (area <= 0) {
      el.innerHTML = '<div class="est-placeholder">Enter dimensions to see instant estimates.</div>';
      return;
    }
    var tileArea = area * 1.10;
    var tiles = ceil(tileArea);
    var adhesive = ceil(area / 2.2);
    var grout = ceil(area / 20);   // 5 kg grout covers 20 m\u00b2
    var bonding = ceil(area / 4);  // 5 L bonding liquid covers 20 m\u00b2 (0.25 L per m\u00b2)

    var packRow = '';
    if (type === 'floor') {
      var sizeSel = document.getElementById('floorTileSize');
      var parts = sizeSel.value.split('|').map(Number);
      var packs = ceil(tileArea / parts[0]);
      packRow = resultItem('Packs needed (' + parts[0] + ' m\u00b2/pack)', packs, 'packs') +
                resultItem('Total pieces', packs * parts[1], 'pcs');
    }

    if (type === 'wall') {
      packRow = resultItem('Boxes needed (' + WALL_BOX_M2 + ' m\u00b2 per box)', ceil(tileArea / WALL_BOX_M2), 'boxes');
    }

    el.innerHTML =
      '<div class="res-total"><div class="rt-lbl">Total area</div><div class="rt-val">' + area.toFixed(2) + '<span>m\u00b2</span></div></div>' +
      resultItem('Tile area needed (incl. 10% waste)', tiles, 'm\u00b2') +
      packRow +
      resultItem('Tile adhesive (20 kg bags)', adhesive, 'bags') +
      resultItem('Grout (5 kg packs)', grout, 'packs') +
      resultItem('Bonding liquid', bonding, 'litres');
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

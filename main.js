/**
 * RK Hardware & Construction — main.js
 * Clean, bug-free build. All features intact.
 */
(function () {
  'use strict';

  /* ─────────────────────────────────────
     HELPERS
  ───────────────────────────────────── */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  /* ─────────────────────────────────────
     SCROLL PROGRESS BAR
  ───────────────────────────────────── */
  var progressBar = qs('#scrollProgress');

  function updateProgress() {
    if (!progressBar) return;
    var scrolled = window.scrollY || document.documentElement.scrollTop;
    var total    = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (total > 0 ? (scrolled / total) * 100 : 0).toFixed(1) + '%';
  }

  /* ─────────────────────────────────────
     NAVBAR — Frosted glass on scroll
  ───────────────────────────────────── */
  var navbar = qs('#navbar');

  function updateNavbar() {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }

  /* ─────────────────────────────────────
     FLOATING BUTTON — Hide near footer
  ───────────────────────────────────── */
  var floatBtn = qs('#floatBtn');
  var footer   = qs('.footer');

  function updateFloatBtn() {
    if (!floatBtn || !footer) return;
    var footerTop = footer.getBoundingClientRect().top;
    floatBtn.classList.toggle('hidden', footerTop < window.innerHeight - 10);
  }

  /* ─────────────────────────────────────
     ACTIVE NAV LINK — Scroll spy
  ───────────────────────────────────── */
  var sections = qsa('section[id]');
  var navLinks = qsa('.nav-link');

  function updateActiveLink() {
    var scrollPos = window.scrollY + (navbar ? navbar.offsetHeight : 68) + 24;
    var current = '';
    sections.forEach(function (sec) {
      if (sec.offsetTop <= scrollPos) current = sec.id;
    });
    navLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      link.classList.toggle('active', href === '#' + current);
    });
  }

  /* ─────────────────────────────────────
     COMBINED SCROLL HANDLER
  ───────────────────────────────────── */
  function onScroll() {
    updateProgress();
    updateNavbar();
    updateFloatBtn();
    updateActiveLink();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  /* ─────────────────────────────────────
     MOBILE MENU
  ───────────────────────────────────── */
  var hamburger  = qs('#hamburger');
  var mobileMenu = qs('#mobileMenu');

  function closeMenu() {
    if (!hamburger || !mobileMenu) return;
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    // Close on any link click inside menu
    qsa('a', mobileMenu).forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (navbar && !navbar.contains(e.target)) closeMenu();
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeMenu(); hamburger.focus(); }
    });
  }

  /* ─────────────────────────────────────
     SMOOTH SCROLL — Anchor links
  ───────────────────────────────────── */
  qsa('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (!href || href === '#') return;
      var target = qs(href);
      if (!target) return;
      e.preventDefault();
      var offset = (navbar ? navbar.offsetHeight : 68) + 8;
      var top    = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ─────────────────────────────────────
     SCROLL REVEAL
  ───────────────────────────────────── */
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

  qsa('.reveal').forEach(function (el) { revealObs.observe(el); });

  /* ─────────────────────────────────────
     COUNTER ANIMATION
  ───────────────────────────────────── */
  function animateCount(el, target, duration) {
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var e = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.textContent = Math.floor(e * target).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString();
    }
    requestAnimationFrame(step);
  }

  var counterObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el  = entry.target;
      var tgt = parseInt(el.getAttribute('data-target'), 10);
      if (!isNaN(tgt)) animateCount(el, tgt, 1800);
      counterObs.unobserve(el);
    });
  }, { threshold: 0.5 });

  qsa('[data-target]').forEach(function (el) { counterObs.observe(el); });

  /* ─────────────────────────────────────
     TRADING HOURS — Highlight today
  ───────────────────────────────────── */
  var todayIndex = new Date().getDay(); // 0=Sun … 6=Sat
  qsa('.hours-row').forEach(function (row) {
    var days = row.getAttribute('data-days');
    if (!days) return;
    var arr = days.split(',').map(Number);
    if (arr.indexOf(todayIndex) !== -1) row.classList.add('today');
  });

  /* ─────────────────────────────────────
     PRODUCT CARD — 3D tilt on hover
  ───────────────────────────────────── */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion) {
    qsa('.prod-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width  - 0.5) * 6;
        var y = ((e.clientY - r.top)  / r.height - 0.5) * 6;
        card.style.transform = 'translateY(-4px) rotateX(' + (-y) + 'deg) rotateY(' + x + 'deg)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });

    /* WHY cards — parallax number */
    qsa('.why-card').forEach(function (card) {
      var num = card.querySelector('.why-num');
      if (!num) return;
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width  - 0.5) * 14;
        var y = ((e.clientY - r.top)  / r.height - 0.5) * 14;
        num.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      card.addEventListener('mouseleave', function () { num.style.transform = ''; });
    });

    /* Hero card float animation */
    var hcFront = qs('.card-front');
    var hcBack  = qs('.card-back');
    var hcMid   = qs('.card-mid');
    if (hcFront && hcBack && hcMid) {
      var t = 0;
      (function floatLoop() {
        t += 0.008;
        hcFront.style.transform = 'translate(-50%, calc(-50% + ' + (Math.sin(t) * 5) + 'px))';
        hcBack.style.transform  = 'rotate(4deg) translateY('  + (Math.sin(t + 1) * 3.5) + 'px)';
        hcMid.style.transform   = 'rotate(-3deg) translateY(' + (Math.sin(t + 2) * 3.5) + 'px)';
        requestAnimationFrame(floatLoop);
      })();
    }
  }

  /* ─────────────────────────────────────
     TICKER — Pause on hover
  ───────────────────────────────────── */
  var tickerRow = qs('.ticker-row');
  if (tickerRow) {
    tickerRow.addEventListener('mouseenter', function () { tickerRow.style.animationPlayState = 'paused'; });
    tickerRow.addEventListener('mouseleave', function () { tickerRow.style.animationPlayState = 'running'; });
  }

  /* ─────────────────────────────────────
     MAP — Keyboard accessible
  ───────────────────────────────────── */
  var mapFrame = qs('.map-frame');
  if (mapFrame) {
    mapFrame.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.open('https://www.google.com/maps/search/15+Walsall+Rd+Bulawayo+Zimbabwe', '_blank', 'noopener');
      }
    });
  }

  /* ─────────────────────────────────────
     LOGO — Back to top
  ───────────────────────────────────── */
  var logoLink = qs('.nav-logo');
  if (logoLink) {
    logoLink.addEventListener('click', function (e) {
      if (window.scrollY > 100) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  /* ─────────────────────────────────────
     NEWSLETTER — Success state
  ───────────────────────────────────── */
  var nlForm    = qs('#nlForm');
  var nlInput   = qs('#nlInput');
  var nlBtn     = qs('#nlBtn');
  var nlSuccess = qs('#nlSuccess');

  function handleNewsletter() {
    if (!nlInput) return;
    var val = nlInput.value.trim();
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(val)) {
      nlInput.style.borderColor = 'var(--red)';
      nlInput.focus();
      setTimeout(function () { nlInput.style.borderColor = ''; }, 2000);
      return;
    }
    if (nlForm)    nlForm.style.display    = 'none';
    if (nlSuccess) nlSuccess.classList.add('show');
    setTimeout(function () {
      if (nlForm)    nlForm.style.display    = '';
      if (nlSuccess) nlSuccess.classList.remove('show');
      nlInput.value = '';
    }, 5000);
  }

  if (nlBtn)   nlBtn.addEventListener('click', handleNewsletter);
  if (nlInput) nlInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleNewsletter(); });

  /* ─────────────────────────────────────
     PROJECT ESTIMATOR
  ───────────────────────────────────── */

  /* SVG icons used in results */
  var ICO = {
    tile:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/></svg>',
    bag:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>',
    grout:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    underlay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>',
    skirting: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    del:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>'
  };

  /* Build a result item row */
  function resultItem(ico, label, value, unit) {
    return '<div class="res-item">' +
      '<div class="ri-ico">' + ico + '</div>' +
      '<div><div class="ri-lbl">' + label + '</div>' +
      '<div class="ri-val">' + value + '<span>' + unit + '</span></div></div>' +
      '</div>';
  }

  /* Render tile / wall results */
  function renderTiles(el, area) {
    if (area <= 0) { el.innerHTML = ''; return; }
    var tiles    = Math.ceil(area * 1.10);
    var adhesive = Math.ceil(area / 2.2);
    var grout    = Math.ceil(area / 8);
    el.innerHTML =
      '<div class="res-total"><div class="rt-lbl">Total Area</div>' +
      '<div class="rt-val">' + area.toFixed(2) + '<span>m²</span></div></div>' +
      resultItem(ICO.tile,     'Tiles needed (incl. 10% waste)',  tiles,    'm²') +
      resultItem(ICO.bag,      'Tile adhesive (20 kg bags)',       adhesive, 'bags') +
      resultItem(ICO.grout,    'Grout (5 kg packs)',               grout,    'packs');
  }

  /* Render laminate / vinyl results */
  function renderLam(el, area) {
    if (area <= 0) { el.innerHTML = ''; return; }
    var skirting = Math.ceil(area * 0.37);
    el.innerHTML =
      '<div class="res-total"><div class="rt-lbl">Total Floor Area</div>' +
      '<div class="rt-val">' + area.toFixed(2) + '<span>m²</span></div></div>' +
      resultItem(ICO.underlay, 'Underlay required',                area.toFixed(2), 'm²') +
      resultItem(ICO.skirting, 'Skirting board (linear metres)',   skirting,        'm');
  }

  /* Calc total area for a panel */
  function calcArea(panelId, isWall) {
    var rooms = qsa('.est-room', qs('#' + panelId));
    var total = 0;
    rooms.forEach(function (room) {
      var aEl = room.querySelector(isWall ? '.h-inp' : '.w-inp');
      var bEl = room.querySelector('.l-inp');
      var a   = parseFloat(aEl ? aEl.value : 0) || 0;
      var b   = parseFloat(bEl ? bEl.value : 0) || 0;
      total  += a * b;
    });
    return total;
  }

  /* Debounced recalculate */
  var calcTimers = {};
  function recalc(type) {
    clearTimeout(calcTimers[type]);
    calcTimers[type] = setTimeout(function () {
      if (type === 'floor') {
        var el = qs('#floor-res');
        if (el) renderTiles(el, calcArea('floor-rooms', false));
      } else if (type === 'wall') {
        var el2 = qs('#wall-res');
        if (el2) renderTiles(el2, calcArea('wall-rooms', true));
      } else if (type === 'lam') {
        var el3 = qs('#lam-res');
        if (el3) renderLam(el3, calcArea('lam-rooms', false));
      }
    }, 150);
  }

  /* Attach input listeners to a room */
  function bindRoom(room, type) {
    qsa('.est-inp', room).forEach(function (inp) {
      inp.addEventListener('input', function () { recalc(type); });
    });
    var delBtn = room.querySelector('.rm-del');
    if (delBtn) {
      delBtn.addEventListener('click', function () {
        room.style.opacity    = '0';
        room.style.transform  = 'translateY(-5px)';
        room.style.transition = 'opacity .2s, transform .2s';
        setTimeout(function () {
          room.remove();
          renumber(type);
          recalc(type);
        }, 200);
      });
    }
  }

  /* Renumber room labels */
  function renumber(type) {
    var prefix = type === 'wall' ? 'Wall Area' : 'Room';
    qsa('.est-room', qs('#' + type + '-rooms')).forEach(function (r, i) {
      var lbl = r.querySelector('.room-num');
      if (lbl) lbl.textContent = prefix + ' ' + (i + 1);
    });
  }

  /* Bind existing (first) rooms */
  ['floor', 'wall', 'lam'].forEach(function (type) {
    var listId = type + '-rooms';
    var list   = qs('#' + listId);
    if (!list) return;
    qsa('.est-room', list).forEach(function (room) { bindRoom(room, type); });
  });

  /* Add-room buttons */
  qsa('.est-add').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var type    = this.getAttribute('data-type');
      var listEl  = qs('#' + type + '-rooms');
      if (!listEl) return;

      var count  = qsa('.est-room', listEl).length + 1;
      var prefix = type === 'wall' ? 'Wall Area' : 'Room';
      var isWall = type === 'wall';

      var room = document.createElement('div');
      room.className = 'est-room';
      room.innerHTML =
        '<div class="est-room-head">' +
          '<span class="room-num">' + prefix + ' ' + count + '</span>' +
          '<button class="rm-del" type="button" aria-label="Remove ' + prefix + ' ' + count + '">' + ICO.del + '</button>' +
        '</div>' +
        '<div class="est-fields">' +
          '<div class="est-field">' +
            '<label>' + (isWall ? 'Height (m)' : 'Width (m)') + '</label>' +
            '<input type="number" class="est-inp ' + (isWall ? 'h-inp' : 'w-inp') + '" min="0.1" step="0.1" placeholder="e.g. 4.0">' +
          '</div>' +
          '<div class="est-field">' +
            '<label>Length (m)</label>' +
            '<input type="number" class="est-inp l-inp" min="0.1" step="0.1" placeholder="e.g. 5.5">' +
          '</div>' +
        '</div>';

      listEl.appendChild(room);
      bindRoom(room, type);

      /* Focus first input */
      var firstInp = room.querySelector('.est-inp');
      if (firstInp) setTimeout(function () { firstInp.focus(); }, 40);

      room.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });

  /* Tab switching — pure CSS class, no hidden attribute */
  qsa('.est-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var targetPanelId = 'tp-' + this.getAttribute('data-tab');

      qsa('.est-tab').forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      qsa('.est-panel').forEach(function (p) {
        p.classList.remove('active');
      });

      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');

      var panel = qs('#' + targetPanelId);
      if (panel) panel.classList.add('active');
    });
  });

  /* ─────────────────────────────────────
     FONT PRELOAD
  ───────────────────────────────────── */
  if ('fonts' in document) {
    Promise.all([
      document.fonts.load('800 1rem "Playfair Display"'),
      document.fonts.load('400 1rem "DM Sans"')
    ]).then(function () {
      document.body.classList.add('fonts-loaded');
    }).catch(function () {});
  }

  /* ─────────────────────────────────────
     CONSOLE SIGNATURE
  ───────────────────────────────────── */
  console.log(
    '%c RK Hardware & Construction %c Bulawayo, Zimbabwe ',
    'background:#C0390B;color:#fff;font-weight:700;padding:6px 12px;border-radius:4px 0 0 4px;font-family:serif',
    'background:#0A0A0A;color:#fff;padding:6px 12px;border-radius:0 4px 4px 0;font-size:11px'
  );

})();

/* ─────────────────────────────────────
   AVAILABILITY MODAL
───────────────────────────────────── */
(function initModal() {
  var overlay      = document.getElementById('availModal');
  var closeBtn     = document.getElementById('modalClose');
  var productLabel = document.getElementById('modal-title');
  var waLink       = document.getElementById('modalWhatsapp');
  var quoteLinkBtn = document.getElementById('modalQuoteLink');

  if (!overlay) return;

  function openModal(productName) {
    // Set product name in modal heading
    if (productLabel) productLabel.textContent = productName;

    // Pre-fill WhatsApp message
    if (waLink) {
      var msg = 'Hi RK Hardware! I\u2019d like to check availability and pricing for: ' + productName + '. Please advise. Thank you.';
      waLink.href = 'https://wa.me/263783167524?text=' + encodeURIComponent(msg);
    }

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus the close button for accessibility
    setTimeout(function () { if (closeBtn) closeBtn.focus(); }, 80);
  }

  function closeModal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Open on every "Check availability" link
  document.querySelectorAll('.check-avail').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var product = this.getAttribute('data-product') || 'Our Products';
      openModal(product);
    });
  });

  // Close on X button
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Close on overlay background click
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  // "Request a written quote" link inside modal — close modal and scroll
  if (quoteLinkBtn) {
    quoteLinkBtn.addEventListener('click', function (e) {
      e.preventDefault();
      closeModal();
      var quoteSection = document.getElementById('quote');
      if (quoteSection) {
        var navH = document.getElementById('navbar');
        var offset = (navH ? navH.offsetHeight : 68) + 8;
        var top = quoteSection.getBoundingClientRect().top + window.pageYOffset - offset;
        setTimeout(function () { window.scrollTo({ top: top, behavior: 'smooth' }); }, 200);
      }
    });
  }
})();

/* ─────────────────────────────────────
   GET A QUOTE FORM
───────────────────────────────────── */
(function initQuoteForm() {
  var form      = document.getElementById('quoteForm');
  var successEl = document.getElementById('qfSuccess');
  var resetBtn  = document.getElementById('qfReset');

  if (!form) return;

  var qName    = document.getElementById('qName');
  var qPhone   = document.getElementById('qPhone');
  var qProduct = document.getElementById('qProduct');
  var qMsg     = document.getElementById('qMsg');

  function clearErr(el) {
    if (el) el.classList.remove('err');
  }
  [qName, qPhone, qProduct].forEach(function (el) {
    if (el) el.addEventListener('input', function () { clearErr(this); });
    if (el) el.addEventListener('change', function () { clearErr(this); });
  });

  function validate() {
    var ok = true;
    if (!qName || !qName.value.trim()) {
      if (qName) { qName.classList.add('err'); qName.focus(); }
      ok = false;
    }
    if (!qPhone || !qPhone.value.trim()) {
      if (qPhone && ok) { qPhone.classList.add('err'); qPhone.focus(); }
      ok = false;
    }
    if (!qProduct || !qProduct.value) {
      if (qProduct && ok) { qProduct.classList.add('err'); qProduct.focus(); }
      ok = false;
    }
    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    var name    = (qName    ? qName.value.trim()    : '');
    var phone   = (qPhone   ? qPhone.value.trim()   : '');
    var product = (qProduct ? qProduct.value        : '');
    var details = (qMsg     ? qMsg.value.trim()     : '');

    // Build WhatsApp message
    var lines = [
      '*Quote Request \u2014 RK Hardware & Construction*',
      '',
      '*Name:* ' + name,
      '*Phone:* ' + phone,
      '*Product / Category:* ' + product
    ];
    if (details) lines.push('*Project Details:* ' + details);
    lines.push('', '_Sent from rkhardware.co.zw_');

    var msg = lines.join('\n');
    var waUrl = 'https://wa.me/263783167524?text=' + encodeURIComponent(msg);

    // Open WhatsApp in new tab
    window.open(waUrl, '_blank', 'noopener');

    // Show success state
    form.style.display = 'none';
    if (successEl) successEl.classList.add('show');
  });

  // "Send via Email" fallback — mailto with pre-filled body
  var emailBtn = form.querySelector('a[href^="mailto"]');
  if (emailBtn) {
    emailBtn.addEventListener('click', function (e) {
      if (!validate()) { e.preventDefault(); return; }
      var name    = (qName    ? qName.value.trim()    : '');
      var phone   = (qPhone   ? qPhone.value.trim()   : '');
      var product = (qProduct ? qProduct.value        : '');
      var details = (qMsg     ? qMsg.value.trim()     : '');
      var body    = 'Name: ' + name + '\nPhone: ' + phone + '\nProduct: ' + product + (details ? '\n\nDetails: ' + details : '');
      var subject = 'Quote Request: ' + product;
      this.href = 'mailto:rkhardware2013@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }

  // Reset form
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (successEl) successEl.classList.remove('show');
      form.style.display = '';
      form.reset();
      if (qName) qName.focus();
    });
  }
})();

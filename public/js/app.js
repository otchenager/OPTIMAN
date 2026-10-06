/* OPTIMAN · app: хедер, бургер, reveal, тарифы и отзывы из CONFIG, sticky-бар, таймер акции, аналитика, UTM */
(function () {
  'use strict';
  var C = window.CONFIG, d = document;
  d.documentElement.classList.add('js');

  var NBSP = ' ';
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) + NBSP + '₸'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function waLink(text) { return 'https://wa.me/' + C.whatsapp + (text ? '?text=' + encodeURIComponent(text) : ''); }
  function perDay(t) { return money(Math.round(t.price / t.days)); }
  function ico(id) { return '<svg class="ico" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }
  function picture(img, alt, w, h, cls) {
    return '<picture><source srcset="/public/img/' + img + '.webp" type="image/webp">' +
      '<img src="/public/img/' + img + '.png" alt="' + esc(alt) + '" width="' + w + '" height="' + h + '" loading="lazy" decoding="async"' + (cls ? ' class="' + cls + '"' : '') + '></picture>';
  }
  var IMG_SIZE = { 'pack-single': [1215, 997], 'pack-trio': [1114, 822], 'pack-six': [1272, 808], 'pack-duo': [1256, 713] };

  /* ——— аналитика: молчит, если ID пустые ——— */
  var A = C.analytics || {};
  function addScript(src) { var s = d.createElement('script'); s.async = true; s.src = src; d.head.appendChild(s); }
  function loadAnalytics() {
    if (A.metaPixel) {
      var f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
      f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
      addScript('https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', A.metaPixel); window.fbq('track', 'PageView');
    }
    if (A.ga4) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', A.ga4);
      addScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(A.ga4));
    }
    if (A.yandex) {
      window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
      window.ym.l = Date.now();
      addScript('https://mc.yandex.ru/metrika/tag.js');
      window.ym(A.yandex, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true });
    }
  }
  var FB_STD = { submit_lead: 'Lead', open_form: 'InitiateCheckout' };
  function track(name, params) {
    params = params || {};
    try {
      if (A.metaPixel && window.fbq) FB_STD[name] ? window.fbq('track', FB_STD[name], params) : window.fbq('trackCustom', name, params);
      if (A.ga4 && window.gtag) window.gtag('event', name, params);
      if (A.yandex && window.ym) window.ym(A.yandex, 'reachGoal', name, params);
    } catch (e) { /* аналитика не должна ломать страницу */ }
  }

  /* ——— UTM и referrer: в sessionStorage, всё в try/catch ——— */
  function saveUtm() {
    try {
      var p = new URLSearchParams(location.search), o = {}, has = false;
      p.forEach(function (v, k) { if (/^utm_[a-z_]{1,20}$/.test(k)) { o[k] = v.slice(0, 120); has = true; } });
      if (has) sessionStorage.setItem('op_utm', JSON.stringify(o));
      if (sessionStorage.getItem('op_ref') === null) sessionStorage.setItem('op_ref', d.referrer || '');
    } catch (e) { /* приватный режим */ }
  }
  function getUtm() { try { return JSON.parse(sessionStorage.getItem('op_utm') || '{}') || {}; } catch (e) { return {}; } }
  function getRef() { try { var r = sessionStorage.getItem('op_ref'); return r === null ? d.referrer : r; } catch (e) { return d.referrer; } }

  window.OP = { money: money, esc: esc, waLink: waLink, track: track, getUtm: getUtm, getRef: getRef, ico: ico, picture: picture, IMG_SIZE: IMG_SIZE };

  /* ——— привязка данных из CONFIG к разметке ——— */
  function bind() {
    $$('[data-money]').forEach(function (el) { var t = C.tiers[el.getAttribute('data-money')]; if (t) el.textContent = money(t.price); });
    $$('[data-wa]').forEach(function (el) {
      el.href = waLink(el.getAttribute('data-wa'));
      el.target = '_blank'; el.rel = 'noopener';
      el.addEventListener('click', function () { track('click_whatsapp', { place: el.getAttribute('data-place') || '' }); });
    });
    $$('[data-tel]').forEach(function (el) {
      el.href = 'tel:' + C.phone;
      if (!el.textContent.trim()) el.textContent = C.phoneDisplay;
      el.addEventListener('click', function () { track('click_phone'); });
    });
    $$('[data-email]').forEach(function (el) { el.href = 'mailto:' + C.email; el.textContent = C.email; });
    $$('[data-hours]').forEach(function (el) { el.textContent = C.hours; });
    $$('[data-sgr]').forEach(function (el) {
      if (C.sgr) { el.hidden = false; var v = $('[data-sgr-value]', el); if (v) v.textContent = C.sgr; }
    });
    if (C.telegram) $$('[data-tg]').forEach(function (el) {
      el.hidden = false; el.href = 'https://t.me/' + C.telegram.replace(/^@/, ''); el.target = '_blank'; el.rel = 'noopener';
    });
  }

  /* ——— тарифы ——— */
  var COPY = {
    start:   { latin: 'START', caption: 'Знакомство с формулой', btn: 'Выбрать «Старт»', alt: 'Одна упаковка OPTIMAN',
               items: ['Доставка по тарифу', 'Гарантия 30 дней'] },
    legion:  { latin: 'LEGIO', caption: 'Полный курс по инструкции', btn: 'Начать курс', alt: 'Три упаковки OPTIMAN и блистер с капсулами',
               items: ['<b>Бесплатная доставка</b>', 'Гарантия 30 дней', 'Консультация куратора в WhatsApp'] },
    emperor: { latin: 'IMPERATOR', caption: 'Два курса подряд', btn: 'Выбрать «Император»', alt: 'Шесть упаковок OPTIMAN',
               items: ['<b>Бесплатная доставка</b>', 'Гарантия 30 дней', 'Личный куратор', 'Приоритетная отправка'] }
  };
  window.OP.COPY = COPY;
  function renderTiers() {
    var box = $('#tiers'); if (!box) return;
    box.innerHTML = Object.keys(C.tiers).map(function (key) {
      var t = C.tiers[key], c = COPY[key] || { latin: '', caption: '', btn: 'Выбрать', alt: t.name, items: [] }, s = IMG_SIZE[t.img] || [800, 600];
      return '<article class="tier' + (t.featured ? ' tier--featured' : '') + ' reveal" data-tier="' + key + '">' +
        (t.featured ? '<div class="tier__ribbon">ВЫБОР ЛЕГИОНА · ПОЛНЫЙ КУРС</div>' : '') +
        '<div class="tier__media">' + picture(t.img, c.alt, s[0], s[1]) + '</div>' +
        '<div class="tier__body">' +
          '<p class="tier__name">' + c.latin + '</p>' +
          '<h3 class="tier__title">' + esc(t.name) + '</h3>' +
          '<p class="tier__caption">' + c.caption + '</p>' +
          '<p class="tier__comp">' + t.packs + ' ' + plural(t.packs, 'упаковка', 'упаковки', 'упаковок') + ' · ' + t.caps + ' капсул · ' + t.days + ' дней</p>' +
          '<div class="tier__prices">' +
            '<s class="tier__old"><span class="sr-only">Старая цена: </span>' + money(t.old) + '</s>' +
            '<span class="tier__price"><span class="sr-only">Цена: </span>' + money(t.price) + '</span>' +
            '<p class="tier__day">' + perDay(t) + ' в день</p>' +
          '</div>' +
          '<ul class="tier__list">' + c.items.map(function (i) { return '<li>' + ico('check') + '<span>' + i + '</span></li>'; }).join('') + '</ul>' +
          '<button type="button" class="btn ' + (t.featured ? 'btn--gold' : 'btn--ghost') + ' btn--block" data-order="' + key + '">' + c.btn + '</button>' +
        '</div></article>';
    }).join('');
  }
  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }

  /* ——— отзывы: только реальные; пустой массив — секция скрыта ——— */
  function renderReviews() {
    var sec = $('#reviews'), box = $('#reviews-list');
    var list = Array.isArray(C.reviews) ? C.reviews.filter(function (r) { return r && r.name && r.text; }) : [];
    if (!sec) return;
    if (!list.length) { sec.hidden = true; $$('[data-nav="reviews"]').forEach(function (a) { a.hidden = true; }); return; }
    sec.hidden = false;
    box.innerHTML = list.map(function (r) {
      var meta = [r.city, r.age ? r.age + ' лет' : ''].filter(Boolean).join(', ');
      return '<figure class="review reveal"><blockquote class="review__text">' + esc(r.text) + '</blockquote>' +
        (r.screenshot ? '<img class="review__shot" src="' + esc(r.screenshot) + '" alt="Скриншот отзыва — ' + esc(r.name) + '" loading="lazy" decoding="async">' : '') +
        '<figcaption class="review__who"><span class="review__ava" aria-hidden="true">' + esc(String(r.name).trim().charAt(0).toUpperCase()) + '</span>' +
        '<span><span class="review__name">' + esc(r.name) + '</span><br><span class="review__meta">' + esc(meta) + '</span></span></figcaption></figure>';
    }).join('');
  }

  /* ——— хедер и бургер ——— */
  function header() {
    var h = $('.header'), burger = $('.burger'), menu = $('#mnav');
    function onScroll() { if (h) h.classList.toggle('is-solid', window.scrollY > 40); }
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    if (!burger || !menu) return;
    function set(open) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      menu.hidden = !open; d.body.style.overflow = open ? 'hidden' : '';
      if (open) h.classList.add('is-solid'); else onScroll();
    }
    burger.addEventListener('click', function () { set(burger.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { set(false); burger.focus(); } });
    window.matchMedia('(min-width:1024px)').addEventListener('change', function (m) { if (m.matches) set(false); });
  }

  /* ——— скролл к тарифам с подсветкой набора ——— */
  function scrollers() {
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-scroll-tier]'); if (!b) return;
      e.preventDefault();
      var key = b.getAttribute('data-scroll-tier'), sec = $('#pricing');
      if (sec) sec.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      var card = $('.tier[data-tier="' + key + '"]');
      if (card) { $$('.tier').forEach(function (c) { c.classList.remove('is-picked'); }); card.classList.add('is-picked'); }
      track('select_tier', { tier: key, place: 'scroll' });
    });
  }

  /* ——— reveal ——— */
  function reveal() {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ——— sticky-бар: виден, когда hero ушёл, прячется над тарифами и финалом ——— */
  function stickyBar() {
    var bar = $('#sticky-bar'); if (!bar || !('IntersectionObserver' in window)) return;
    var state = {}, ids = ['hero', 'pricing', 'final'];
    function upd() {
      var show = state.hero === false && !state.pricing && !state.final && !d.body.classList.contains('modal-open');
      bar.classList.toggle('is-visible', show); bar.setAttribute('aria-hidden', String(!show));
      bar.inert = !show;
      d.body.classList.toggle('has-sticky', show);
    }
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { state[x.target.id] = x.isIntersecting; }); upd(); });
    ids.forEach(function (id) { var el = d.getElementById(id); if (el) io.observe(el); });
    d.addEventListener('op:modal', upd);
    var seen = false, pr = $('#pricing');
    if (pr) new IntersectionObserver(function (en, o) { if (!seen && en[0].isIntersecting) { seen = true; track('view_pricing'); o.disconnect(); } }, { threshold: .25 }).observe(pr);
  }

  /* ——— таймер: только при реальной дате окончания акции ——— */
  function promo() {
    var box = $('#promo'); if (!box || !C.promoEnd) return;
    var end = new Date(C.promoEnd).getTime(); if (!isFinite(end) || end <= Date.now()) return;
    var dateStr = new Date(end).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Asia/Almaty' });
    $('[data-promo-date]', box).textContent = dateStr;
    box.hidden = false;
    var dd = $('[data-t="d"]', box), hh = $('[data-t="h"]', box), mm = $('[data-t="m"]', box);
    function pad(n) { return String(n).padStart(2, '0'); }
    function tick() {
      var left = end - Date.now();
      if (left <= 0) { box.hidden = true; clearInterval(iv); return; }
      var m = Math.floor(left / 60000);
      dd.textContent = pad(Math.floor(m / 1440)); hh.textContent = pad(Math.floor(m / 60) % 24); mm.textContent = pad(m % 60);
    }
    var iv = setInterval(tick, 15000); tick();
  }

  /* ——— FAQ: aria-expanded у summary ——— */
  function faq() {
    $$('.qa').forEach(function (qa) {
      var s = $('summary', qa);
      function upd() { s.setAttribute('aria-expanded', String(qa.open)); }
      upd(); qa.addEventListener('toggle', upd);
    });
  }

  saveUtm();
  bind();
  renderTiers();
  renderReviews();
  header();
  scrollers();
  reveal();
  stickyBar();
  promo();
  faq();
  if (A.metaPixel || A.ga4 || A.yandex) window.addEventListener('load', loadAnalytics);
})();

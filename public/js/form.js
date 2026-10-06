/* OPTIMAN · форма заказа: модалка/bottom sheet, выбор набора, маска телефона, отправка в /api/order */
(function () {
  'use strict';
  var C = window.CONFIG, OP = window.OP, d = document;
  var modal = d.getElementById('order-modal'); if (!modal || !OP) return;
  var panel = modal.querySelector('.modal__panel');
  var form = modal.querySelector('#order-form');
  var views = { form: modal.querySelector('[data-view="form"]'), success: modal.querySelector('[data-view="success"]'), error: modal.querySelector('[data-view="error"]') };
  var submitBtn = form.querySelector('[type="submit"]');
  var MIN_FILL_MS = 3000;
  var startedAt = 0, lastFocus = null, sending = false, closeTimer = null;
  var PAY = { kaspi: 'Kaspi', cod: 'При получении' };

  /* ——— выбор набора ——— */
  var pick = form.querySelector('#tpick-list');
  pick.innerHTML = Object.keys(C.tiers).map(function (k) {
    var t = C.tiers[k];
    return '<label class="tp"><input type="radio" name="tier" value="' + k + '"' + (t.featured ? ' checked' : '') + '>' +
      '<img src="/public/img/' + t.img + '.webp" alt="" width="48" height="48" loading="lazy">' +
      '<span class="tp__info"><span class="tp__name">' + OP.esc(t.name) + '</span><br><span class="tp__meta">' + t.packs + ' уп. · ' + t.days + ' дней</span></span>' +
      '<span class="tp__price">' + OP.money(t.price) + '<small>' + (t.freeShip ? 'доставка бесплатно' : 'доставка по тарифу') + '</small></span></label>';
  }).join('');

  function tierKey() { var r = form.querySelector('input[name="tier"]:checked'); return r ? r.value : 'legion'; }
  function syncTier() {
    var t = C.tiers[tierKey()];
    form.querySelector('[data-sum]').textContent = OP.money(t.price);
    form.querySelector('[data-ship]').textContent = t.freeShip ? 'Доставка бесплатно' : 'Доставка по тарифу';
    submitBtn.textContent = 'Подтвердить заказ — ' + OP.money(t.price);
    Array.prototype.forEach.call(pick.querySelectorAll('.tp'), function (l) { l.classList.toggle('is-checked', l.querySelector('input').checked); });
  }
  pick.addEventListener('change', function () { syncTier(); OP.track('select_tier', { tier: tierKey(), place: 'form' }); });

  /* ——— город: «Другой» открывает текстовое поле ——— */
  var citySel = form.querySelector('#f-city'), cityOther = form.querySelector('#f-city-other-wrap');
  citySel.addEventListener('change', function () {
    cityOther.hidden = citySel.value !== 'other';
    if (!cityOther.hidden) cityOther.querySelector('input').focus();
  });

  /* ——— маска +7 (7__) ___-__-__ ——— */
  var phone = form.querySelector('#f-phone');
  function phoneDigits(v) {
    var x = String(v || '').replace(/\D/g, '');
    if (x[0] === '8') x = '7' + x.slice(1);
    if (x && x[0] !== '7') x = '7' + x;
    return x.slice(0, 11);
  }
  function formatPhone(x) {
    var r = x.slice(1);
    if (!x) return '';
    var out = '+7 (' + r.slice(0, 3);
    if (r.length >= 3) out += ') ' + r.slice(3, 6);
    if (r.length >= 6) out += '-' + r.slice(6, 8);
    if (r.length >= 8) out += '-' + r.slice(8, 10);
    return out;
  }
  var prevDigits = '';
  phone.addEventListener('input', function (e) {
    var x = phoneDigits(phone.value);
    // удалили только символ маски — убираем и цифру перед ним
    if (e.inputType && e.inputType.indexOf('delete') === 0 && x === prevDigits && x.length > 1) x = x.slice(0, -1);
    phone.value = x.length <= 1 && e.inputType && e.inputType.indexOf('delete') === 0 ? '' : formatPhone(x);
    prevDigits = phoneDigits(phone.value);
  });
  phone.addEventListener('paste', function (e) {
    var t = (e.clipboardData || window.clipboardData);
    if (!t) return;
    e.preventDefault();
    var raw = t.getData('text').replace(/\D/g, '');
    if (raw.length === 10 && raw[0] === '7') raw = '7' + raw;  // вставили номер без кода страны
    phone.value = formatPhone(phoneDigits(raw));
    prevDigits = phoneDigits(phone.value);
  });
  phone.addEventListener('focus', function () { if (!phone.value) { phone.value = '+7 ('; prevDigits = '7'; } });
  phone.addEventListener('blur', function () { if (phoneDigits(phone.value).length <= 1) { phone.value = ''; prevDigits = ''; } });

  /* ——— валидация: ошибки под полем ——— */
  function setErr(name, msg) {
    var f = form.querySelector('[data-field="' + name + '"]'); if (!f) return;
    f.classList.toggle('has-error', !!msg);
    var e = f.querySelector('.field__err'); if (e) e.textContent = msg || '';
    var inp = f.querySelector('input:not([type="radio"]),select');
    if (inp) inp.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function collect() {
    var city = citySel.value === 'other' ? form.querySelector('#f-city-other').value.trim() : citySel.value;
    var pay = form.querySelector('input[name="payment"]:checked');
    return {
      name: form.querySelector('#f-name').value.trim(),
      phone: phoneDigits(phone.value),
      city: city, tier: tierKey(), payment: pay ? pay.value : '',
      website: form.querySelector('#f-website').value
    };
  }
  function validate(v) {
    var err = {};
    if (v.name.length < 2 || v.name.length > 60) err.name = 'Укажите имя — от 2 до 60 символов';
    if (!/^77\d{9}$/.test(v.phone)) err.phone = 'Введите номер полностью: +7 (7XX) XXX-XX-XX';
    if (!v.city || v.city.length < 2) err.city = citySel.value === 'other' ? 'Напишите ваш город' : 'Выберите город';
    if (!PAY[v.payment]) err.payment = 'Выберите способ оплаты';
    ['name', 'phone', 'city', 'payment'].forEach(function (k) { setErr(k, err[k]); });
    return err;
  }
  form.addEventListener('input', function (e) {
    var f = e.target.closest('[data-field]');
    if (f && f.classList.contains('has-error')) setErr(f.getAttribute('data-field'), '');
  });

  /* ——— экраны ——— */
  function show(name) {
    Object.keys(views).forEach(function (k) { views[k].hidden = k !== name; });
    panel.scrollTop = 0;
    var h = views[name].querySelector('[data-focus]') || views[name].querySelector('.modal__title');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  function orderText(v, num) {
    var t = C.tiers[v.tier];
    return (num ? 'Здравствуйте! Мой заказ ' + num + ': ' + t.name + ', ' + v.city
      : 'Здравствуйте! Хочу оформить заказ OPTIMAN: набор «' + t.name + '» (' + t.packs + ' уп., ' + OP.money(t.price) + ')' +
        (v.name ? '. Имя: ' + v.name : '') + (v.phone.length === 11 ? '. Телефон: +' + v.phone : '') +
        (v.city ? '. Город: ' + v.city : '') + (PAY[v.payment] ? '. Оплата: ' + PAY[v.payment] : ''));
  }
  function localOrderNumber() {
    var kz = new Date(Date.now() + 5 * 3600 * 1000);
    return 'OP-' + String(kz.getUTCDate()).padStart(2, '0') + String(kz.getUTCMonth() + 1).padStart(2, '0') + '-' + Math.floor(1000 + Math.random() * 9000);
  }
  function success(v, num) {
    num = num || localOrderNumber();
    views.success.querySelector('[data-order-num]').textContent = num;
    var wa = views.success.querySelector('[data-wa-success]');
    wa.href = OP.waLink(orderText(v, num));
    OP.track('lead_success', { tier: v.tier, value: C.tiers[v.tier].price, currency: 'KZT' });
    show('success');
  }
  function failure(v) {
    views.error.querySelector('[data-wa-error]').href = OP.waLink(orderText(v));
    OP.track('lead_error', { tier: v.tier });
    show('error');
  }

  /* ——— отправка: успех только при 200 ——— */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    var v = collect(), err = validate(v), keys = Object.keys(err);
    if (keys.length) {
      var first = form.querySelector('[data-field="' + keys[0] + '"] input, [data-field="' + keys[0] + '"] select');
      if (first) first.focus();
      return;
    }
    sending = true; submitBtn.disabled = true; submitBtn.textContent = 'Отправляем…';
    OP.track('submit_lead', { tier: v.tier, value: C.tiers[v.tier].price, currency: 'KZT' });
    var wait = Math.max(0, MIN_FILL_MS + 200 - (Date.now() - startedAt));
    setTimeout(function () {
      var payload = {
        name: v.name, phone: v.phone, city: v.city, tier: v.tier, payment: v.payment,
        website: v.website, elapsed: Date.now() - startedAt,
        utm: OP.getUtm(), referrer: OP.getRef(), page: location.href.slice(0, 300)
      };
      var ok = false, status = 0;
      fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { status = r.status; ok = r.status === 200; return r.json().catch(function () { return null; }); })
        .then(function (j) {
          if (ok && j && j.ok) return success(v, j.order);
          if (status === 422 && j && j.fields) {
            Object.keys(j.fields).forEach(function (k) { setErr(k === 'tier' ? 'name' : k, j.fields[k]); });
            return;
          }
          failure(v);
        })
        .catch(function () { failure(v); })
        .then(function () { sending = false; submitBtn.disabled = false; syncTier(); });
    }, wait);
  });

  /* ——— открытие / закрытие, focus-trap, Esc ——— */
  function focusables() {
    return Array.prototype.filter.call(panel.querySelectorAll('a[href],button:not([disabled]),input:not([type="hidden"]):not([tabindex="-1"]),select,textarea,[tabindex]:not([tabindex="-1"])'),
      function (el) { return el.offsetParent !== null && !el.closest('.hp'); });
  }
  function open(key) {
    clearTimeout(closeTimer);
    if (key && C.tiers[key]) { var r = form.querySelector('input[name="tier"][value="' + key + '"]'); if (r) r.checked = true; }
    syncTier(); show('form');
    lastFocus = d.activeElement;
    startedAt = Date.now();
    modal.hidden = false;
    d.body.classList.add('modal-open');
    requestAnimationFrame(function () { requestAnimationFrame(function () { modal.classList.add('is-open'); }); });
    var title = views.form.querySelector('.modal__title');
    title.setAttribute('tabindex', '-1'); title.focus({ preventScroll: true });
    d.dispatchEvent(new CustomEvent('op:modal'));
    OP.track('open_form', { tier: tierKey() });
  }
  function close() {
    modal.classList.remove('is-open');
    d.body.classList.remove('modal-open');
    closeTimer = setTimeout(function () { modal.hidden = true; }, 400);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    d.dispatchEvent(new CustomEvent('op:modal'));
  }
  modal.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) { e.preventDefault(); close(); }
    if (e.target.closest('[data-retry]')) { e.preventDefault(); show('form'); }
    if (e.target.closest('[data-wa-success],[data-wa-error]')) OP.track('click_whatsapp', { place: 'form' });
  });
  d.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    var f = focusables(); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (d.activeElement === first || !panel.contains(d.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (d.activeElement === last || !panel.contains(d.activeElement))) { e.preventDefault(); first.focus(); }
  });
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-order]'); if (!b || modal.contains(b)) return;
    e.preventDefault();
    var key = b.getAttribute('data-order');
    if (key) OP.track('select_tier', { tier: key, place: b.getAttribute('data-place') || 'card' });
    open(key);
  });

  window.OP.openOrder = open;
  syncTier();
})();

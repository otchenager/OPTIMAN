# OPTIMAN — продолжение редизайна (новая сессия)

Ты в репозитории лендинга OPTIMAN (Казахстан, Vercel: optiman-three.vercel.app), Windows, PowerShell.
Полное ТЗ — `CLAUDE_CODE_PROMPT.md` в корне. **Прочитай его целиком перед началом.** Это единственный источник требований: дизайн-система, тексты, воронка, юридические запреты, CONFIG, проверки. Brainstorming с вопросами не нужен — ТЗ утверждено.

## Где остановилась прошлая сессия

Готово, НЕ переделывай (только читай при необходимости):
- `_archive/index-v1.html` — старая версия, токен из неё вырезан
- `api/order.js` — serverless-функция Vercel для заявок
- `server.js` — статика + `POST /api/order` для локального запуска
- `.env.example`, `.gitignore`
- Готовые ассеты: `public/brand/*.svg` (логотип, фавикон), `public/img/pack-*.webp|png` (фото пачек без фона), `public/fonts/*` + `fonts.css`, `components/pack3d.html` (3D-пачка), `oferta.html`, `privacy.html`, `public/legal.css`

НЕ сделано: новый `index.html`. Сейчас в корне лежит **старый** `index.html` (146 КБ). Его нужно заменить новым по ТЗ.

Прошлая сессия дважды упала с `API Error: Connection lost mid-response`, когда пыталась записать весь `index.html` одним ответом. Поэтому правила ниже обязательны.

## Правила работы


2. Пиши файлы инструментами Write/Edit, **не** через `cat <<EOF`, `echo >` или `Set-Content` — в PowerShell это портит кодировку и кавычки. Все файлы — UTF-8 без BOM.
3. Shell-команды — в синтаксисе PowerShell (`Get-ChildItem`, `Select-String`, `Test-Path`, `;` вместо `&&` если PowerShell 5). Для поиска по файлам лучше используй встроенный Grep.
4. Если соединение оборвалось — при продолжении сначала проверь, какие файлы уже существуют, и продолжай со следующего незаконченного шага. Готовое не переписывай.
5. После каждого шага — одна короткая строка: что готово.
6. Git: создай ветку `redesign-legion` (если её нет) и коммить после этапов 2, 4, 6. **Не делай `git push` и не деплой.**

## План (по шагам)

**Шаг 1. Разбор 3D-пачки.** Вынеси из `components/pack3d.html`:
- стили → `public/css/pack3d.css`
- скрипт → `public/js/pack3d.js`
- разметку оставь в компоненте как образец, в index.html вставишь её на шаге 5.
Ничего в оформлении пачки не меняй.

**Шаг 2. CSS** 
- `public/css/base.css` — токены `:root` из раздела 3 ТЗ, reset, типографика (Cinzel только латиница, Cormorant Garamond — кириллические заголовки, Manrope — текст), кнопки, контейнер, eyebrow с римскими цифрами, reveal-анимация, reduced-motion.
- `public/css/sections.css` — блоки 0–8 ТЗ (полоса, хедер, hero, доверие, честный разговор, формула, курс, легион, отзывы).
- `public/css/sections2.css` — блоки 9–15 (тарифы, гарантия с печатью, доставка, FAQ, финальный CTA, футер, sticky-бар) + модалка/bottom sheet формы.

**Шаг 3. JS:**
- `public/js/config.js` — объект `CONFIG` точно по разделу 6 ТЗ (`window.CONFIG = {...}`).
- `public/js/app.js` — хедер/бургер, reveal, рендер тарифов и отзывов из CONFIG, цена за день, sticky-бар, таймер только при `promoEnd`, FAQ, модалка с выбором набора, маска `+7 (7__) ___-__-__`, отправка `fetch('/api/order')` — успех только при 200, иначе экран ошибки с WhatsApp, номер заказа `OP-ДДММ-XXXX`, UTM в sessionStorage (try/catch), `track()` (молчит без ID). Если файл > 15 КБ — дели на `app.js` + `form.js`.
- Сверь поля, которые шлёт форма, с тем, что ожидает `api/order.js` (прочитай его). Имена полей должны совпадать.

**Шаг 4. `index.html` — каркас.** Перезапиши старый файл новым минимальным:
- `<head>`: title/description из раздела 7 ТЗ, `theme-color #0B0908`, favicon, preload двух шрифтов, подключение `fonts.css`, `base.css`, `sections.css`, `sections2.css`, `pack3d.css`, OG-теги, JSON-LD Product (без aggregateRating).
- `<body>`: пустые секции-заглушки с id: `topbar, header, hero, trust, problem, formula, course, legion, reviews, pricing, guarantee, delivery, faq, final, footer, sticky-bar, order-modal`.
- Скрипты в конце: `config.js`, `pack3d.js`, `app.js` (и `form.js`, если есть) с `defer`.

**Шаг 5. Наполнение `index.html` через Edit**, по 2–3 секции за ответ, тексты — дословно из раздела 4 ТЗ:
- 5a: topbar, header, hero (с разметкой 3D-пачки)
- 5b: trust, problem, formula
- 5c: course, legion, reviews (контейнер, рендер из CONFIG)
- 5d: pricing (контейнер карточек, рендер из CONFIG), guarantee (SVG-печать с textPath `XXX DIES · FIDES · OPTIMAN`)
- 5e: delivery, faq, final
- 5f: footer, sticky-bar, order-modal (форма, экран успеха, экран ошибки)

**Шаг 6. OG-картинка** `public/og.jpg` 1200×630 (логотип + `pack-trio.png` на `#0B0908`). Если нет инструмента для сборки картинки — пропусти и отметь в отчёте.

**Шаг 7. Проверки (раздел 8 ТЗ):**
- `node server.js` в фоне → скриншоты Playwright 390×844 и 1440×900 (вся страница, hero, тарифы, форма, успех, ошибка) в `_screens/`. Если Playwright не установлен: `npx playwright install chromium`. Посмотри каждый скриншот сам и исправь, что выглядит дёшево или сломано.
- Grep по `index.html` и `public/js/*.js` на запрещённые слова из раздела 2 ТЗ — 0 совпадений (кроме «не является лекарственным средством»).
- Grep `href="#"` — 0. Grep `api.telegram.org` в `index.html` и `public/js` — 0.
- Цены в карточках, sticky-баре, форме и CTA совпадают с CONFIG.
- Нет горизонтального скролла на 360px.
- `POST /api/order` без токена → ошибка и экран WhatsApp.

## Финальный отчёт
Коротко: какие файлы созданы, что прошло проверки, что ждёт данных от владельца (СГР, реальные отзывы, Telegram менеджера, ID пикселей, новый токен бота в Vercel env: `TG_BOT_TOKEN`, `TG_CHAT_ID`).

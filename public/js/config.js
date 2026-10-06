/* OPTIMAN · CONFIG — единственный источник цен, наборов и контактов.
   Ключи tiers держать в синхроне с TIERS в api/order.js (белый список наборов). */
window.CONFIG = {
  phone: '+77751426674', phoneDisplay: '+7 775 142 66 74',
  whatsapp: '77751426674',            // проверить, что WhatsApp есть на этом номере
  telegram: '',                       // @username менеджера, если есть
  email: 'resurs.rk.kz@gmail.com',
  hours: '09:00–21:00',
  promoEnd: null,                     // напр. '2026-10-31T23:59:59+05:00'; null = без таймера
  sgr: null,                          // номер СГР ЕАЭС, когда будет
  tiers: {
    start:   { name:'Старт',     packs:1, caps:10, days:10, price:18990, old:29900, freeShip:false, img:'pack-single' },
    legion:  { name:'Легион',    packs:3, caps:30, days:30, price:49990, old:79900, freeShip:true,  img:'pack-trio', featured:true },
    emperor: { name:'Император', packs:6, caps:60, days:60, price:99990, old:149900, freeShip:true, img:'pack-six' },
  },
  reviews: [],                        // только реальные отзывы: {name, city, age, text, screenshot?}
  analytics: { metaPixel:'', ga4:'', yandex:'' } // пустое = скрипты не подключаются
};

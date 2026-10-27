"""Build Ozon rich-content JSON (attribute 11254) for OPTIMAN from rendered banners."""
import json, sys

BASE = "https://www.optiman.kz/public/ozon/optiman-"
SIZES = {"banner": (1080, 1350), "numeri": (1080, 1340), "formula": (1080, 1760),
         "disciplina": (1080, 1300), "origo": (1080, 1100)}


def text(*lines):
    items = []
    for i, line in enumerate(lines):
        if i:
            items.append({"type": "br"})
        items.append({"type": "text", "content": line})
    return items


def billboard(slide, alt, title, *lines):
    w, h = SIZES[slide]
    block = {
        "imgLink": "",
        "img": {"src": f"{BASE}{slide}-d.jpg", "srcMobile": f"{BASE}{slide}-m.jpg", "alt": alt,
                "position": "width_full", "positionMobile": "width_full",
                "widthMobile": w, "heightMobile": h},
        "title": {"items": text(title), "size": "size5", "align": "left", "color": "color1"},
        "text": {"size": "size2", "align": "left", "color": "color1", "items": text(*lines)},
    }
    return {"widgetName": "raShowcase", "type": "billboard", "blocks": [block]}


content = [
    billboard("banner", "OPTIMAN — комплекс из 5 растительных компонентов для мужчин",
              "OPTIMAN · VENI · VIDI · VICI",
              "Биологически активная добавка к пище — источник флавоноидов и гинсенозидов.",
              "В упаковке 10 капсул по 350 мг."),
    billboard("numeri", "Формула в цифрах: 5 компонентов, 350 мг, 1 капсула в день, 70 мг флавоноидов, 30 мг гинсенозидов",
              "NUMERI · Формула в цифрах",
              "В 1 капсуле: флавоноиды (в пересчёте на рутин) — 70 мг, 233% от адекватного уровня потребления; гинсенозиды — 30 мг, 600% от адекватного уровня потребления.",
              "Не превышает верхний допустимый уровень потребления. По данным этикетки."),
    billboard("formula", "Состав: горянка стрелолистная, кордицепс китайский, эврикома длиннолистная, женьшень обыкновенный, мака перуанская",
              "FORMULA · Пять компонентов состава",
              "I. Горянка стрелолистная (Epimedium sagittatum) — экстракт надземной части. Растение традиционной китайской фитокультуры.",
              "II. Кордицепс китайский (Cordyceps sinensis) — экстракт мицелия. Гриб, известный по высокогорьям Тибета.",
              "III. Эврикома длиннолистная, тонгкат али (Eurycoma longifolia) — экстракт корня. Растение тропических лесов Юго-Восточной Азии, в том числе Малайзии.",
              "IV. Женьшень обыкновенный (Panax ginseng) — экстракт корня. Одно из самых известных растений восточноазиатской традиции.",
              "V. Мака перуанская (Lepidium meyenii) — порошок корня. Корнеплод высокогорий Анд, растёт на высоте около 4000 м.",
              "Также в составе: оболочка капсулы (гидроксипропилметилцеллюлоза), мальтодекстрин."),
    billboard("disciplina", "Курс на 1 месяц: 1 капсула в день, 3 упаковки по 10 капсул",
              "DISCIPLINA · Как принимать",
              "Взрослым по 1 капсуле в день во время еды. Не превышайте рекомендуемую суточную дозу.",
              "Продолжительность приёма — 1 месяц: 30 капсул, то есть 3 упаковки по 10 капсул. Одной упаковки хватает на 10 дней.",
              "При необходимости приём можно повторить."),
    billboard("origo", "Производство — Малайзия, импортёр — ТОО «РЕСУРС РК»",
              "ORIGO · Происхождение",
              "Производитель: PHYTES BIOTEK SDN. BHD, LOT 21, Jalan U1/19, Section U1, Hicom Glenmarie Industrial Park, 40150 Shah Alam, Selangor, Малайзия.",
              "Импортёр: ТОО «РЕСУРС РК», Алматы, Казахстан.",
              "Свидетельство о государственной регистрации: AM.01.22.01.003.R.000139.06.26. Срок годности — 3 года."),
    {
        "widgetName": "raTextBlock",
        "title": {"content": ["NOTA BENE · Важно знать"], "size": "size5", "align": "left", "color": "color1"},
        "theme": "default",
        "padding": "type2",
        "gapSize": "m",
        "text": {"size": "size2", "align": "left", "color": "color1", "content": [
            "БАД. Не является лекарственным средством.",
            "Противопоказания: индивидуальная непереносимость компонентов, беременность, кормление грудью. Перед применением рекомендуется проконсультироваться с врачом.",
            "Условия хранения: в сухом, защищённом от прямых солнечных лучей и недоступном для детей месте при температуре от 0 до +25 °С.",
        ]},
    },
]

json.dump({"content": content, "version": 0.3}, open(sys.argv[1], "w", encoding="utf-8"), ensure_ascii=False, indent=1)

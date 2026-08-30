/* Menu — multi-market configuration (Arabic-first). SA is default. */
(function (global) {
  "use strict";

  var MARKETS = {
    SA: {
      code: "SA",
      name_ar: "السعودية",
      name_en: "Saudi Arabia",
      flag: "🇸🇦",
      currency: "SAR",
      currency_ar: "ر.س",
      dial: "+966",
      language: "ar",
      region_label: "المنطقة",
      region_placeholder: "الرياض · مكة · الشرقية…",
      city_placeholder: "الرياض · جدة · الدمام…",
      area_label: "الحي",
      area_placeholder: "الملز · العليا…"
    },
    SD: {
      code: "SD",
      name_ar: "السودان",
      name_en: "Sudan",
      flag: "🇸🇩",
      currency: "SDG",
      currency_ar: "ج.س",
      dial: "+249",
      language: "ar",
      region_label: "الولاية",
      region_placeholder: "الخرطوم · الجزيرة · البحر الأحمر…",
      city_placeholder: "الخرطوم · أم درمان · بورتسودان…",
      area_label: "المنطقة",
      area_placeholder: "الرياض · المعمورة…"
    },
    EG: {
      code: "EG",
      name_ar: "مصر",
      name_en: "Egypt",
      flag: "🇪🇬",
      currency: "EGP",
      currency_ar: "ج.م",
      dial: "+20",
      language: "ar",
      region_label: "المحافظة",
      region_placeholder: "القاهرة · الجيزة · الإسكندرية…",
      city_placeholder: "القاهرة · الجيزة · الإسكندرية…",
      area_label: "المنطقة",
      area_placeholder: "الزمالك · المعادي…"
    },
    AE: {
      code: "AE",
      name_ar: "الإمارات",
      name_en: "UAE",
      flag: "🇦🇪",
      currency: "AED",
      currency_ar: "د.إ",
      dial: "+971",
      language: "ar",
      region_label: "الإمارة",
      region_placeholder: "دبي · أبوظبي · الشارقة…",
      city_placeholder: "دبي · أبوظبي · الشارقة…",
      area_label: "المنطقة",
      area_placeholder: "المرجان · الخالدية…"
    },
    QA: {
      code: "QA",
      name_ar: "قطر",
      name_en: "Qatar",
      flag: "🇶🇦",
      currency: "QAR",
      currency_ar: "ر.ق",
      dial: "+974",
      language: "ar",
      region_label: "البلدية",
      region_placeholder: "الدوحة · الريان…",
      city_placeholder: "الدوحة · الوكرة…",
      area_label: "المنطقة",
      area_placeholder: "اللؤلؤة · الخليج الغربي…"
    },
    KW: {
      code: "KW",
      name_ar: "الكويت",
      name_en: "Kuwait",
      flag: "🇰🇼",
      currency: "KWD",
      currency_ar: "د.ك",
      dial: "+965",
      language: "ar",
      region_label: "المحافظة",
      region_placeholder: "العاصمة · حولي · الفروانية…",
      city_placeholder: "الكويت · السالمية…",
      area_label: "المنطقة",
      area_placeholder: "الشرق · الجابرية…"
    },
    BH: {
      code: "BH",
      name_ar: "البحرين",
      name_en: "Bahrain",
      flag: "🇧🇭",
      currency: "BHD",
      currency_ar: "د.ب",
      dial: "+973",
      language: "ar",
      region_label: "المحافظة",
      region_placeholder: "العاصمة · المحرق · الشمالية…",
      city_placeholder: "المنامة · المحرق…",
      area_label: "المنطقة",
      area_placeholder: "الجفير · السيف…"
    },
    OM: {
      code: "OM",
      name_ar: "عُمان",
      name_en: "Oman",
      flag: "🇴🇲",
      currency: "OMR",
      currency_ar: "ر.ع",
      dial: "+968",
      language: "ar",
      region_label: "المحافظة",
      region_placeholder: "مسقط · ظفار · الباطنة…",
      city_placeholder: "مسقط · صلالة…",
      area_label: "المنطقة",
      area_placeholder: "القرم · الخوض…"
    }
  };

  var DEFAULT = "SA";
  var ORDER = ["SA", "SD", "EG", "AE", "QA", "KW", "BH", "OM"];

  function get(code) {
    var c = (code || DEFAULT).toUpperCase();
    return MARKETS[c] || MARKETS[DEFAULT];
  }

  function list() {
    return ORDER.map(function (c) {
      return MARKETS[c];
    });
  }

  function label(code) {
    var m = get(code);
    return m.flag + " " + m.name_ar;
  }

  function currencyLabel(code) {
    var m = get(code);
    return m.currency_ar + " · " + m.currency;
  }

  function fillSelect(selectEl, selected) {
    if (!selectEl) return;
    var cur = (selected || DEFAULT).toUpperCase();
    selectEl.innerHTML = list()
      .map(function (m) {
        return (
          '<option value="' +
          m.code +
          '"' +
          (m.code === cur ? " selected" : "") +
          ">" +
          m.flag +
          " " +
          m.name_ar +
          "</option>"
        );
      })
      .join("");
  }

  global.MENU_MARKETS = {
    MARKETS: MARKETS,
    DEFAULT: DEFAULT,
    ORDER: ORDER,
    get: get,
    list: list,
    label: label,
    currencyLabel: currencyLabel,
    fillSelect: fillSelect
  };
})(typeof window !== "undefined" ? window : globalThis);

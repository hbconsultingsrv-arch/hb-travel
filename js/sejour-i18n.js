/* Traductions des séjours (contenu Supabase) + badges */

(function mergeSejourLocales() {
  const packs = {
    fr: {
      'tag.bestSeller': 'Best-seller',
      'tag.famille': 'Famille',
      'tag.plage': 'Plage',
      'tag.decouverte': 'Découverte',
      'sejour.omra.title': 'Omra Premium — Makkah & Madinah',
      'sejour.omra.desc': '10 jours · Hôtel 5★ face au Haram · Guide inclus',
      'sejour.turquie.title': 'Turquie — Istanbul & Cappadoce',
      'sejour.turquie.desc': '8 jours · Hôtels halal · Excursions culturelles',
      'sejour.maldives.title': 'Maldives — Resort halal-friendly',
      'sejour.maldives.desc': '7 jours · Plage privée · Spa & détente',
      'sejour.maroc.title': 'Maroc — Marrakech & Essaouira',
      'sejour.maroc.desc': '6 jours · Riad authentique · Cuisine locale halal',
      'slide.hotel.chip': 'Hôtel 5★',
      'slide.halal.chip': 'Voyage halal',
      'slide.famille.chip': 'Famille',
      'slide.plage.chip': 'Plage privée'
    },
    en: {
      'tag.bestSeller': 'Best seller',
      'tag.famille': 'Family',
      'tag.plage': 'Beach',
      'tag.decouverte': 'Discovery',
      'sejour.omra.title': 'Premium Umrah — Makkah & Madinah',
      'sejour.omra.desc': '10 days · 5★ hotel facing the Haram · Guide included',
      'sejour.turquie.title': 'Turkey — Istanbul & Cappadocia',
      'sejour.turquie.desc': '8 days · Halal hotels · Cultural excursions',
      'sejour.maldives.title': 'Maldives — Halal-friendly resort',
      'sejour.maldives.desc': '7 days · Private beach · Spa & relaxation',
      'sejour.maroc.title': 'Morocco — Marrakech & Essaouira',
      'sejour.maroc.desc': '6 days · Authentic riad · Local halal cuisine',
      'slide.hotel.chip': '5★ Hotel',
      'slide.halal.chip': 'Halal travel',
      'slide.famille.chip': 'Family',
      'slide.plage.chip': 'Private beach'
    },
    ar: {
      'tag.bestSeller': 'الأكثر مبيعاً',
      'tag.famille': 'عائلة',
      'tag.plage': 'شاطئ',
      'tag.decouverte': 'اكتشاف',
      'sejour.omra.title': 'عمرة مميزة — مكة والمدينة',
      'sejour.omra.desc': '10 أيام · فندق 5★ أمام الحرم · مرشد شامل',
      'sejour.turquie.title': 'تركيا — إسطنبول وكابادوكيا',
      'sejour.turquie.desc': '8 أيام · فنادق حلal · رحلات ثقافية',
      'sejour.maldives.title': 'المالديف — منتجع حلal',
      'sejour.maldives.desc': '7 أيام · شاطئ خاص · سبا واسترخاء',
      'sejour.maroc.title': 'المغرب — مراكش والصويرة',
      'sejour.maroc.desc': '6 أيام · رiad أصيل · مطبخ محلي حلal',
      'slide.hotel.chip': 'فندق 5★',
      'slide.halal.chip': 'سفر حلal',
      'slide.famille.chip': 'عائلة',
      'slide.plage.chip': 'شاطئ خاص'
    },
    es: {
      'tag.bestSeller': 'Más vendido',
      'tag.famille': 'Familia',
      'tag.plage': 'Playa',
      'tag.decouverte': 'Descubrimiento',
      'sejour.omra.title': 'Umrah Premium — La Meca y Medina',
      'sejour.omra.desc': '10 días · Hotel 5★ frente al Haram · Guía incluido',
      'sejour.turquie.title': 'Turquía — Estambul y Capadocia',
      'sejour.turquie.desc': '8 días · Hoteles halal · Excursiones culturales',
      'sejour.maldives.title': 'Maldivas — Resort halal',
      'sejour.maldives.desc': '7 días · Playa privada · Spa y relax',
      'sejour.maroc.title': 'Marruecos — Marrakech y Essaouira',
      'sejour.maroc.desc': '6 días · Riad auténtico · Cocina halal local',
      'slide.hotel.chip': 'Hotel 5★',
      'slide.halal.chip': 'Viaje halal',
      'slide.famille.chip': 'Familia',
      'slide.plage.chip': 'Playa privada'
    },
    de: {
      'tag.bestSeller': 'Bestseller',
      'tag.famille': 'Familie',
      'tag.plage': 'Strand',
      'tag.decouverte': 'Entdeckung',
      'sejour.omra.title': 'Premium-Umrah — Mekka & Medina',
      'sejour.omra.desc': '10 Tage · 5★-Hotel am Haram · Guide inklusive',
      'sejour.turquie.title': 'Türkei — Istanbul & Kappadokien',
      'sejour.turquie.desc': '8 Tage · Halal-Hotels · Kulturelle Ausflüge',
      'sejour.maldives.title': 'Malediven — Halal-Resort',
      'sejour.maldives.desc': '7 Tage · Privatstrand · Spa & Entspannung',
      'sejour.maroc.title': 'Marokko — Marrakesch & Essaouira',
      'sejour.maroc.desc': '6 Tage · Authentisches Riad · Halal-Küche',
      'slide.hotel.chip': '5★ Hotel',
      'slide.halal.chip': 'Halal-Reise',
      'slide.famille.chip': 'Familie',
      'slide.plage.chip': 'Privatstrand'
    },
    tr: {
      'tag.bestSeller': 'Çok satan',
      'tag.famille': 'Aile',
      'tag.plage': 'Plaj',
      'tag.decouverte': 'Keşif',
      'sejour.omra.title': 'Premium Umre — Mekke & Medine',
      'sejour.omra.desc': '10 gün · Haram\'a bakan 5★ otel · Rehber dahil',
      'sejour.turquie.title': 'Türkiye — İstanbul & Kapadokya',
      'sejour.turquie.desc': '8 gün · Helal oteller · Kültür turları',
      'sejour.maldives.title': 'Maldivler — Helal resort',
      'sejour.maldives.desc': '7 gün · Özel plaj · Spa & dinlenme',
      'sejour.maroc.title': 'Fas — Marakeş & Essaouira',
      'sejour.maroc.desc': '6 gün · Otantik riad · Yerel helal mutfak',
      'slide.hotel.chip': '5★ Otel',
      'slide.halal.chip': 'Helal seyahat',
      'slide.famille.chip': 'Aile',
      'slide.plage.chip': 'Özel plaj'
    }
  };

  Object.entries(packs).forEach(([lang, entries]) => {
    if (HB_TRANSLATIONS[lang]) Object.assign(HB_TRANSLATIONS[lang], entries);
  });
})();

const HB_SEJOUR_TAG_MAP = {
  'best-seller': 'tag.bestSeller',
  'best seller': 'tag.bestSeller',
  'famille': 'tag.famille',
  'family': 'tag.famille',
  'plage': 'tag.plage',
  'beach': 'tag.plage',
  'découverte': 'tag.decouverte',
  'decouverte': 'tag.decouverte',
  'discovery': 'tag.decouverte'
};

function translateSejourField(sejour, field) {
  const slug = sejour.slug;
  const key = field === 'description' ? `sejour.${slug}.desc` : `sejour.${slug}.${field}`;
  if (typeof t === 'function') {
    const val = t(key);
    if (val && val !== key) return val;
  }
  return sejour[field];
}

const HB_SEJOUR_TAG_BY_SLUG = {
  omra: 'tag.bestSeller',
  turquie: 'tag.famille',
  maldives: 'tag.plage',
  maroc: 'tag.decouverte'
};

const HB_SEJOUR_FALLBACK_IMAGES = {
  omra: 'https://images.unsplash.com/photo-1579305796538-03268c05b65c?w=800&q=85&auto=format&fit=crop',
  turquie: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=85&auto=format&fit=crop',
  maldives: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=85&auto=format&fit=crop',
  maroc: 'https://images.unsplash.com/photo-1560769629-847638654886?w=800&q=85&auto=format&fit=crop'
};

function normalizeTagKey(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getSejourImageUrl(sejour) {
  const slug = sejour.slug;
  const url = (sejour.image_url || '').trim();
  if (!url || /1591604120669|1580418827493|370153677687/.test(url)) {
    return HB_SEJOUR_FALLBACK_IMAGES[slug] || HB_SEJOUR_FALLBACK_IMAGES.omra;
  }
  return url;
}

function translateSejourTag(sejourOrTag) {
  const sejour = typeof sejourOrTag === 'object' ? sejourOrTag : null;
  const tag = sejour ? sejour.tag : sejourOrTag;

  if (sejour?.slug && HB_SEJOUR_TAG_BY_SLUG[sejour.slug] && typeof t === 'function') {
    return t(HB_SEJOUR_TAG_BY_SLUG[sejour.slug]);
  }

  if (!tag) return '';
  const normalized = normalizeTagKey(tag);
  const key = HB_SEJOUR_TAG_MAP[normalized];
  if (key && typeof t === 'function') {
    const val = t(key);
    if (val && val !== key) return val;
  }
  return tag;
}

function translateSejourTitle(sejour) {
  return translateSejourField(sejour, 'title');
}

function translateSejourDescription(sejour) {
  return translateSejourField(sejour, 'description');
}

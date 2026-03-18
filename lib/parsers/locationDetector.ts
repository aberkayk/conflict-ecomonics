export interface DetectedLocation {
  lat: number;
  lng: number;
  country: string;
}

// Ordered most-specific first (cities/regions before countries)
const LOCATION_MAP: Array<{
  keywords: string[];
  lat: number;
  lng: number;
  country: string;
}> = [
  // Ukraine — cities
  {
    keywords: [
      "kyiv", "kiev", "kharkiv", "kherson", "mariupol", "zaporizhzhia",
      "odesa", "odessa", "bakhmut", "avdiivka", "dnipro",
    ],
    lat: 49.0, lng: 32.0, country: "Ukraine",
  },
  { keywords: ["ukraine", "ukrainian"], lat: 49.0, lng: 32.0, country: "Ukraine" },

  // Russia
  { keywords: ["moscow", "st. petersburg", "belgorod", "kursk"], lat: 55.75, lng: 37.62, country: "Russia" },
  { keywords: ["russia", "russian"], lat: 61.52, lng: 105.32, country: "Russia" },

  // Gaza / Palestine
  { keywords: ["gaza", "rafah", "khan younis", "hamas"], lat: 31.35, lng: 34.31, country: "Gaza" },
  { keywords: ["west bank", "ramallah", "jenin", "nablus", "hebron"], lat: 31.9, lng: 35.2, country: "West Bank" },

  // Israel
  { keywords: ["tel aviv", "haifa", "jerusalem", "israel", "israeli", "idf"], lat: 31.05, lng: 34.85, country: "Israel" },

  // Lebanon
  { keywords: ["beirut", "hezbollah", "lebanon", "lebanese"], lat: 33.89, lng: 35.5, country: "Lebanon" },

  // Syria
  { keywords: ["damascus", "aleppo", "idlib", "deir ez-zor", "syria", "syrian"], lat: 34.8, lng: 38.9, country: "Syria" },

  // Iran
  { keywords: ["tehran", "iran", "iranian", "irgc"], lat: 32.43, lng: 53.69, country: "Iran" },

  // Iraq
  { keywords: ["baghdad", "mosul", "basra", "fallujah", "iraq", "iraqi"], lat: 33.22, lng: 43.68, country: "Iraq" },

  // Yemen
  { keywords: ["sanaa", "sana'a", "aden", "hodeidah", "houthi", "yemen", "yemeni"], lat: 15.55, lng: 48.52, country: "Yemen" },

  // Sudan
  { keywords: ["khartoum", "darfur", "omdurman", "rsf", "sudan", "sudanese"], lat: 12.86, lng: 30.22, country: "Sudan" },

  // Ethiopia
  { keywords: ["addis ababa", "tigray", "amhara", "ethiopia", "ethiopian"], lat: 9.14, lng: 40.49, country: "Ethiopia" },

  // Somalia
  { keywords: ["mogadishu", "al-shabaab", "al shabaab", "somalia", "somali"], lat: 5.15, lng: 46.2, country: "Somalia" },

  // Nigeria
  { keywords: ["abuja", "boko haram", "niger delta", "nigeria", "nigerian"], lat: 9.08, lng: 8.68, country: "Nigeria" },

  // Mali
  { keywords: ["bamako", "mali", "malian", "sahel"], lat: 17.57, lng: -3.99, country: "Mali" },

  // Libya
  { keywords: ["tripoli", "benghazi", "misrata", "libya", "libyan"], lat: 26.33, lng: 17.23, country: "Libya" },

  // DR Congo
  { keywords: ["kinshasa", "goma", "kivu", "m23", "drc", "congo", "congolese"], lat: -4.04, lng: 21.76, country: "DR Congo" },

  // Myanmar
  { keywords: ["naypyidaw", "yangon", "rangoon", "myanmar", "burma", "burmese"], lat: 19.76, lng: 96.08, country: "Myanmar" },

  // Afghanistan
  { keywords: ["kabul", "kandahar", "taliban", "afghanistan", "afghan"], lat: 33.93, lng: 67.71, country: "Afghanistan" },

  // Pakistan
  { keywords: ["islamabad", "karachi", "peshawar", "balochistan", "pakistan", "pakistani"], lat: 30.38, lng: 69.35, country: "Pakistan" },

  // India
  { keywords: ["kashmir", "manipur"], lat: 20.59, lng: 78.96, country: "India" },

  // North Korea
  { keywords: ["pyongyang", "north korea", "north korean", "dprk"], lat: 40.34, lng: 127.51, country: "North Korea" },

  // Taiwan
  { keywords: ["taipei", "taiwan", "taiwanese"], lat: 23.7, lng: 120.96, country: "Taiwan" },

  // Venezuela
  { keywords: ["caracas", "venezuela", "venezuelan", "maduro"], lat: 6.42, lng: -66.59, country: "Venezuela" },

  // Haiti
  { keywords: ["port-au-prince", "haiti", "haitian"], lat: 18.97, lng: -72.29, country: "Haiti" },

  // Mexico
  { keywords: ["juarez", "culiacan", "sinaloa cartel", "cartel", "mexico city"], lat: 23.63, lng: -102.55, country: "Mexico" },
  { keywords: ["mexico", "mexican"], lat: 23.63, lng: -102.55, country: "Mexico" },

  // Colombia
  { keywords: ["bogota", "cali", "farc", "eln", "colombia", "colombian"], lat: 4.57, lng: -74.3, country: "Colombia" },
];

// Fallback country-name → coordinates for GDELT sourcecountry
const COUNTRY_FALLBACK: Record<string, { lat: number; lng: number; country: string }> = {
  ukraine: { lat: 49.0, lng: 32.0, country: "Ukraine" },
  russia: { lat: 61.52, lng: 105.32, country: "Russia" },
  israel: { lat: 31.05, lng: 34.85, country: "Israel" },
  "palestina": { lat: 31.35, lng: 34.31, country: "Palestine" },
  iran: { lat: 32.43, lng: 53.69, country: "Iran" },
  iraq: { lat: 33.22, lng: 43.68, country: "Iraq" },
  syria: { lat: 34.8, lng: 38.9, country: "Syria" },
  lebanon: { lat: 33.89, lng: 35.5, country: "Lebanon" },
  yemen: { lat: 15.55, lng: 48.52, country: "Yemen" },
  sudan: { lat: 12.86, lng: 30.22, country: "Sudan" },
  ethiopia: { lat: 9.14, lng: 40.49, country: "Ethiopia" },
  somalia: { lat: 5.15, lng: 46.2, country: "Somalia" },
  nigeria: { lat: 9.08, lng: 8.68, country: "Nigeria" },
  mali: { lat: 17.57, lng: -3.99, country: "Mali" },
  libya: { lat: 26.33, lng: 17.23, country: "Libya" },
  myanmar: { lat: 19.76, lng: 96.08, country: "Myanmar" },
  afghanistan: { lat: 33.93, lng: 67.71, country: "Afghanistan" },
  pakistan: { lat: 30.38, lng: 69.35, country: "Pakistan" },
};

export function detectLocation(
  title: string,
  description = "",
  sourceCountry?: string
): DetectedLocation | null {
  const text = `${title} ${description}`.toLowerCase();

  for (const entry of LOCATION_MAP) {
    for (const keyword of entry.keywords) {
      if (text.includes(keyword)) {
        return { lat: entry.lat, lng: entry.lng, country: entry.country };
      }
    }
  }

  // Fall back to the GDELT sourcecountry field
  if (sourceCountry) {
    const key = sourceCountry.toLowerCase().trim();
    const found = COUNTRY_FALLBACK[key];
    if (found) return found;
  }

  return null;
}

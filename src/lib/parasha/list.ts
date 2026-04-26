export interface Parasha {
  id: string;
  hebrewName: string;
  englishName: string;
  book: "Genesis" | "Exodus" | "Leviticus" | "Numbers" | "Deuteronomy";
  sefariaRef: string;
}

export const PARASHIOT: Parasha[] = [
  { id: "bereshit",      hebrewName: "בראשית",       englishName: "Bereshit",        book: "Genesis",     sefariaRef: "Genesis 1:1-6:8" },
  { id: "noach",         hebrewName: "נח",           englishName: "Noach",           book: "Genesis",     sefariaRef: "Genesis 6:9-11:32" },
  { id: "lech-lecha",    hebrewName: "לך לך",         englishName: "Lech Lecha",      book: "Genesis",     sefariaRef: "Genesis 12:1-17:27" },
  { id: "vayera",        hebrewName: "וירא",          englishName: "Vayera",          book: "Genesis",     sefariaRef: "Genesis 18:1-22:24" },
  { id: "chayei-sarah",  hebrewName: "חיי שרה",       englishName: "Chayei Sara",     book: "Genesis",     sefariaRef: "Genesis 23:1-25:18" },
  { id: "toldot",        hebrewName: "תולדות",        englishName: "Toldot",          book: "Genesis",     sefariaRef: "Genesis 25:19-28:9" },
  { id: "vayetzei",      hebrewName: "ויצא",          englishName: "Vayetzei",        book: "Genesis",     sefariaRef: "Genesis 28:10-32:3" },
  { id: "vayishlach",    hebrewName: "וישלח",         englishName: "Vayishlach",      book: "Genesis",     sefariaRef: "Genesis 32:4-36:43" },
  { id: "vayeshev",      hebrewName: "וישב",          englishName: "Vayeshev",        book: "Genesis",     sefariaRef: "Genesis 37:1-40:23" },
  { id: "miketz",        hebrewName: "מקץ",           englishName: "Miketz",          book: "Genesis",     sefariaRef: "Genesis 41:1-44:17" },
  { id: "vayigash",      hebrewName: "ויגש",          englishName: "Vayigash",        book: "Genesis",     sefariaRef: "Genesis 44:18-47:27" },
  { id: "vayechi",       hebrewName: "ויחי",          englishName: "Vayechi",         book: "Genesis",     sefariaRef: "Genesis 47:28-50:26" },

  { id: "shemot",        hebrewName: "שמות",          englishName: "Shemot",          book: "Exodus",      sefariaRef: "Exodus 1:1-6:1" },
  { id: "vaera",         hebrewName: "וארא",          englishName: "Vaera",           book: "Exodus",      sefariaRef: "Exodus 6:2-9:35" },
  { id: "bo",            hebrewName: "בא",            englishName: "Bo",              book: "Exodus",      sefariaRef: "Exodus 10:1-13:16" },
  { id: "beshalach",     hebrewName: "בשלח",          englishName: "Beshalach",       book: "Exodus",      sefariaRef: "Exodus 13:17-17:16" },
  { id: "yitro",         hebrewName: "יתרו",          englishName: "Yitro",           book: "Exodus",      sefariaRef: "Exodus 18:1-20:23" },
  { id: "mishpatim",     hebrewName: "משפטים",        englishName: "Mishpatim",       book: "Exodus",      sefariaRef: "Exodus 21:1-24:18" },
  { id: "terumah",       hebrewName: "תרומה",         englishName: "Terumah",         book: "Exodus",      sefariaRef: "Exodus 25:1-27:19" },
  { id: "tetzaveh",      hebrewName: "תצוה",          englishName: "Tetzaveh",        book: "Exodus",      sefariaRef: "Exodus 27:20-30:10" },
  { id: "ki-tisa",       hebrewName: "כי תשא",        englishName: "Ki Tisa",         book: "Exodus",      sefariaRef: "Exodus 30:11-34:35" },
  { id: "vayakhel",      hebrewName: "ויקהל",         englishName: "Vayakhel",        book: "Exodus",      sefariaRef: "Exodus 35:1-38:20" },
  { id: "pekudei",       hebrewName: "פקודי",         englishName: "Pekudei",         book: "Exodus",      sefariaRef: "Exodus 38:21-40:38" },

  { id: "vayikra",       hebrewName: "ויקרא",         englishName: "Vayikra",         book: "Leviticus",   sefariaRef: "Leviticus 1:1-5:26" },
  { id: "tzav",          hebrewName: "צו",            englishName: "Tzav",            book: "Leviticus",   sefariaRef: "Leviticus 6:1-8:36" },
  { id: "shemini",       hebrewName: "שמיני",         englishName: "Shemini",         book: "Leviticus",   sefariaRef: "Leviticus 9:1-11:47" },
  { id: "tazria",        hebrewName: "תזריע",         englishName: "Tazria",          book: "Leviticus",   sefariaRef: "Leviticus 12:1-13:59" },
  { id: "metzora",       hebrewName: "מצורע",         englishName: "Metzora",         book: "Leviticus",   sefariaRef: "Leviticus 14:1-15:33" },
  { id: "achrei-mot",    hebrewName: "אחרי מות",      englishName: "Achrei Mot",      book: "Leviticus",   sefariaRef: "Leviticus 16:1-18:30" },
  { id: "kedoshim",      hebrewName: "קדושים",        englishName: "Kedoshim",        book: "Leviticus",   sefariaRef: "Leviticus 19:1-20:27" },
  { id: "emor",          hebrewName: "אמור",          englishName: "Emor",            book: "Leviticus",   sefariaRef: "Leviticus 21:1-24:23" },
  { id: "behar",         hebrewName: "בהר",           englishName: "Behar",           book: "Leviticus",   sefariaRef: "Leviticus 25:1-26:2" },
  { id: "bechukotai",    hebrewName: "בחוקתי",        englishName: "Bechukotai",      book: "Leviticus",   sefariaRef: "Leviticus 26:3-27:34" },

  { id: "bamidbar",      hebrewName: "במדבר",         englishName: "Bamidbar",        book: "Numbers",     sefariaRef: "Numbers 1:1-4:20" },
  { id: "naso",          hebrewName: "נשא",           englishName: "Nasso",           book: "Numbers",     sefariaRef: "Numbers 4:21-7:89" },
  { id: "behaalotcha",   hebrewName: "בהעלותך",       englishName: "Beha'alotcha",    book: "Numbers",     sefariaRef: "Numbers 8:1-12:16" },
  { id: "shlach",        hebrewName: "שלח",           englishName: "Sh'lach",         book: "Numbers",     sefariaRef: "Numbers 13:1-15:41" },
  { id: "korach",        hebrewName: "קרח",           englishName: "Korach",          book: "Numbers",     sefariaRef: "Numbers 16:1-18:32" },
  { id: "chukat",        hebrewName: "חקת",           englishName: "Chukat",          book: "Numbers",     sefariaRef: "Numbers 19:1-22:1" },
  { id: "balak",         hebrewName: "בלק",           englishName: "Balak",           book: "Numbers",     sefariaRef: "Numbers 22:2-25:9" },
  { id: "pinchas",       hebrewName: "פנחס",          englishName: "Pinchas",         book: "Numbers",     sefariaRef: "Numbers 25:10-30:1" },
  { id: "matot",         hebrewName: "מטות",          englishName: "Matot",           book: "Numbers",     sefariaRef: "Numbers 30:2-32:42" },
  { id: "masei",         hebrewName: "מסעי",          englishName: "Masei",           book: "Numbers",     sefariaRef: "Numbers 33:1-36:13" },

  { id: "devarim",       hebrewName: "דברים",         englishName: "Devarim",         book: "Deuteronomy", sefariaRef: "Deuteronomy 1:1-3:22" },
  { id: "vaetchanan",    hebrewName: "ואתחנן",        englishName: "Va'etchanan",     book: "Deuteronomy", sefariaRef: "Deuteronomy 3:23-7:11" },
  { id: "eikev",         hebrewName: "עקב",           englishName: "Eikev",           book: "Deuteronomy", sefariaRef: "Deuteronomy 7:12-11:25" },
  { id: "reeh",          hebrewName: "ראה",           englishName: "Re'eh",           book: "Deuteronomy", sefariaRef: "Deuteronomy 11:26-16:17" },
  { id: "shoftim",       hebrewName: "שופטים",        englishName: "Shoftim",         book: "Deuteronomy", sefariaRef: "Deuteronomy 16:18-21:9" },
  { id: "ki-teitzei",    hebrewName: "כי תצא",        englishName: "Ki Teitzei",      book: "Deuteronomy", sefariaRef: "Deuteronomy 21:10-25:19" },
  { id: "ki-tavo",       hebrewName: "כי תבוא",       englishName: "Ki Tavo",         book: "Deuteronomy", sefariaRef: "Deuteronomy 26:1-29:8" },
  { id: "nitzavim",      hebrewName: "נצבים",         englishName: "Nitzavim",        book: "Deuteronomy", sefariaRef: "Deuteronomy 29:9-30:20" },
  { id: "vayelech",      hebrewName: "וילך",          englishName: "Vayeilech",       book: "Deuteronomy", sefariaRef: "Deuteronomy 31:1-30" },
  { id: "haazinu",       hebrewName: "האזינו",        englishName: "Ha'Azinu",        book: "Deuteronomy", sefariaRef: "Deuteronomy 32:1-52" },
  { id: "vezot-haberacha", hebrewName: "וזאת הברכה",  englishName: "V'Zot HaBerachah", book: "Deuteronomy", sefariaRef: "Deuteronomy 33:1-34:12" },
];

export function findParashaById(id: string): Parasha | undefined {
  return PARASHIOT.find((p) => p.id === id);
}

export function findParashaByEnglishName(englishName: string): Parasha | undefined {
  const normalized = englishName.trim().toLowerCase();
  return PARASHIOT.find(
    (p) =>
      p.englishName.toLowerCase() === normalized ||
      p.englishName.toLowerCase().replace(/['']/g, "") === normalized.replace(/['']/g, ""),
  );
}

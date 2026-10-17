/* Shared by isolated content scripts and Node tests. No network or dependencies. */
(() => {
  "use strict";

  const defaults = Object.freeze({ enabled: true, pairs: true, participles: true, disabledHosts: [] });
  const data = globalThis.EntgendertDictionary ?? { counts: { persons: 0 }, irregular: "", regular: "", adjectival: "" };
  // Unknown compounds use their last known part: "Stammkund:innen" → "Stammkunden".
  const minPrefix = 2;
  const minHead = 4;
  const minAdjectiveHead = 5;

  // German has no locale-specific case rules, so the faster default mapping suffices.
  const upper = (text) => text.toUpperCase();
  const lower = (text) => text.toLowerCase();
  const capitalize = (text) => upper(text[0]) + lower(text.slice(1));
  const hasLowercase = /\p{Ll}/u;
  function styleOf(word) {
    if (!hasLowercase.test(word)) return "upper";
    return hasLowercase.test(word[0]) ? "lower" : "title";
  }
  // Forms are stored capitalised; carry over the casing of the text.
  function restyle(form, word, key, style) {
    if (style === "upper") return upper(form);
    if (style === "lower") return lower(form);
    return form.startsWith(key) ? word + form.slice(key.length) : form;
  }

  let lexicon = null;
  function load() {
    if (lexicon) return lexicon;
    const decode = (base, code = "") => code === "" ? base : code[0] === "+" ? base + code.slice(1) : code;
    const persons = new Map();
    for (const line of data.irregular.split(";")) {
      if (!line) continue;
      const [stem, a, b, c, flag] = line.split(",");
      const singular = decode(stem, a);
      const plural = decode(singular, b);
      persons.set(stem, { singular, plural, dative: decode(plural, c), adjectival: flag === "a" });
    }
    for (const stem of data.regular.split(";")) {
      if (stem) persons.set(stem, { singular: stem, plural: stem, dative: `${stem}n`, adjectival: false });
    }
    lexicon = { persons, adjectives: new Set(data.adjectival.split(";").filter(Boolean)) };
    return lexicon;
  }

  // Masculine forms for a feminine stem such as "Ärzt", "Stammkund" or "Lehrer".
  function findPerson(key, guess) {
    const { persons } = load();
    const exact = persons.get(key);
    if (exact) return exact;
    for (let i = minPrefix; i <= key.length - minHead; i++) {
      const head = persons.get(capitalize(key.slice(i)));
      if (!head) continue;
      const prefix = key.slice(0, i);
      const join = (form) => prefix + lower(form[0]) + form.slice(1);
      return { singular: join(head.singular), plural: join(head.plural), dative: join(head.dative), adjectival: head.adjectival };
    }
    // Most person nouns on "-er" are regular, so marked unknown ones are safe to convert.
    if (guess && key.length >= 4 && key.endsWith("er")) return { singular: key, plural: key, dative: `${key}n`, adjectival: false };
    return null;
  }
  function isAdjectivalNoun(key) {
    const { adjectives } = load();
    if (adjectives.has(key)) return true;
    for (let i = minPrefix; i <= key.length - minAdjectiveHead; i++) {
      if (adjectives.has(capitalize(key.slice(i)))) return true;
    }
    return false;
  }

  const boundary = "[\\p{L}\\p{M}\\p{N}_@]";
  const letters = "[\\p{L}\\p{M}]";
  // "Lehrer:innen", "Ärzt*in", "Kolleg/-innen", "Autor(innen)", "LeserInnen"
  const markedPattern = new RegExp(`(?<!${boundary})(?:(?=(${letters}{2,}))\\1(?:(,|[*:_·]|\\/-?)(innen|in|INNEN|IN)|\\((innen|in|INNEN|IN)\\))|(${letters}+?\\p{Ll})(Innen|In))(?!${boundary})`, "gu");
  // "Vorsitzende*r", "Angestellte:n", "jede/r", "eine*n"
  const adjectivePattern = new RegExp(`(?<!${boundary})(${letters}+[eE])(?:(,|[*:_·]|\\/-?)([rnRN])|\\(([rnRN])\\))(?!${boundary})`, "gu");
  const pairPattern = /(?<![\p{L}\p{M}\p{N}_@])([\p{L}\p{M}]+)[ \t]+(?:und|oder|&)[ \t]+([\p{L}\p{M}]+)(?![\p{L}\p{M}\p{N}_@])/gu;
  const neutral = new Map([
    ["Studierende", ["Studenten", "Studenten"]],
    ["Studierenden", ["Studenten", "Studenten"]],
    ["Studierender", ["Student", "Student"]],
    ["Mitarbeitende", ["Mitarbeiter", "Mitarbeitern"]],
    ["Teilnehmende", ["Teilnehmer", "Teilnehmern"]],
    ["Lesende", ["Leser", "Lesern"]],
    ["Lehrende", ["Lehrer", "Lehrern"]]
  ]);
  const neutralPattern = /(?<![\p{L}\p{M}\p{N}_@])(?:Studierende[nr]?|Mitarbeitende|Teilnehmende|Lesende|Lehrende)(?![\p{L}\p{M}\p{N}_@])/gu;
  // Only explicit local dative cues; this is intentionally not a grammar parser.
  function isDative(text, offset) {
    return /(?:\b(?:mit|bei|von|zu|aus|nach|gegenüber)(?:\s+(?:den|allen|vielen|wenigen|einigen|mehreren|unseren|diesen))?|\bden)\s+$/iu.test(text.slice(Math.max(0, offset - 80), offset));
  }
  // Determiners before which adjectival nouns take weak endings: "die Beamten".
  function isWeak(text, offset) {
    return /(?:^|[^\p{L}])(?:die|der|den|diese[nr]?|jene[nr]?|alle[nr]?|sämtliche[nr]?|keine[nr]?|meine[nr]?|deine[nr]?|seine[nr]?|ihre[nr]?|unsere[nr]?|eure[nr]?|welche[nr]?|beide[nr]?)\s+$/iu.test(text.slice(Math.max(0, offset - 40), offset));
  }

  function replaceMarked(match, word, separator, ending1, ending2, binnenStem, binnenI, offset, source) {
    const stem = word ?? binnenStem;
    const ending = ending1 ?? ending2 ?? binnenI;
    const style = styleOf(stem);
    if (binnenI ? style === "upper" : (style === "upper") !== (ending[0] === "I")) return match;
    const key = capitalize(stem);
    // Comma forms and lowercase words are only converted for known words.
    const forms = findPerson(key, style !== "lower" && separator !== ",");
    if (!forms) return match;
    let form;
    if (ending.length === 2) form = forms.adjectival && isWeak(source, offset) ? forms.singular.slice(0, -1) : forms.singular;
    else if (isDative(source, offset)) form = forms.dative;
    else form = forms.adjectival && isWeak(source, offset) ? `${forms.plural}n` : forms.plural;
    return restyle(form, stem, key, style);
  }
  function replaceAdjective(match, base, separator, ending1, ending2) {
    const ending = ending1 ?? ending2;
    const style = styleOf(base);
    if ((style === "upper") !== (ending === "R" || ending === "N")) return match;
    // "/n" and "(n)" often mark optional plurals ("Seite(n)"), so these need a known word.
    const optionalPlural = (separator === undefined || separator[0] === "/") && lower(ending) === "n";
    if ((separator === "," || optionalPlural) && (style === "lower" || !isAdjectivalNoun(capitalize(base)))) return match;
    return base + ending;
  }
  function replacePair(match, left, right) {
    for (const [female, male] of [[left, right], [right, left]]) {
      const ending = female.slice(-5);
      const stem = female.slice(0, -5);
      if (stem.length < 2 || (ending !== "innen" && ending !== "INNEN")) continue;
      const style = styleOf(stem);
      if ((style === "upper") !== (ending === "INNEN")) continue;
      const key = capitalize(stem);
      const forms = findPerson(key, style !== "lower");
      if (!forms) continue;
      const options = [forms.plural, forms.dative, forms.adjectival ? `${forms.plural}n` : forms.plural];
      if (options.some((form) => restyle(form, stem, key, style) === male)) return male;
    }
    return match;
  }

  function transformSegment(text, settings) {
    let result = text;
    if (/[*:_/·,(]-?(?:in|IN)|\p{Ll}In/u.test(result)) result = result.replace(markedPattern, replaceMarked);
    if (/[eE][*:_/·,(]-?[rnRN]/u.test(result)) result = result.replace(adjectivePattern, replaceAdjective);
    if (settings.pairs && /\b(?:und|oder)\b|&/u.test(result)) {
      result = result.replace(pairPattern, replacePair);
    }
    if (settings.participles && /Studierend|Mitarbeitende|Teilnehmende|Lesende|Lehrende/u.test(result)) {
      result = result.replace(neutralPattern, (match, offset, source) => {
        // Clearly feminine singular contexts need article/adjective rewriting.
        if (/\b(?:eine|einer|der)\s+$/iu.test(source.slice(Math.max(0, offset - 80), offset))) return match;
        return neutral.get(match)[isDative(source, offset) ? 1 : 0];
      });
    }
    return result;
  }
  function transform(text, options = {}) {
    const settings = { ...defaults, ...options };
    if (!settings.enabled || !text) return text;
    // Treat visible URLs and email addresses as opaque, too.
    return text.split(/((?:https?:\/\/|www\.)[^\s<>]+|(?<![\p{L}\p{N}._%+*:/-])[\p{L}\p{N}._%+*:/-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,})/giu)
      .map((part, index) => index % 2 ? part : transformSegment(part, settings)).join("");
  }
  globalThis.Entgendert = Object.freeze({ transform, defaults, dictionarySize: data.counts.persons });
})();

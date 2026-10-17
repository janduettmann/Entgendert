/* Shared by isolated content scripts and Node tests. No network or dependencies. */
(() => {
  "use strict";

  const defaults = Object.freeze({ enabled: true, pairs: true, participles: true, disabledHosts: [] });
  const data = globalThis.EntgendertDictionary ?? { counts: { persons: 0 }, irregular: "", regular: "", adjectival: "", rules: "" };
  // Unknown compounds use their last known part: "Stammkund:innen" → "Stammkunden".
  const minPrefix = 2;
  const minHead = 4;
  const minAdjectiveHead = 5;
  const maxRuleSuffix = 5;

  // Participles only become agent nouns where the meaning matches. A general
  // "-ende" → "-er" rule would turn "Blutende" into "Bluter", "Führende" into
  // "Führer" and "das Entscheidende" into "das Entscheider". The inflected forms
  // come from the dictionary. Entries starting with "-" only apply as the last
  // part of a compound: "Radfahrende" changes, "Fahrende" does not.
  const participles = new Map(Object.entries({
    Abonnierend: "Abonnent", Absolvierend: "Absolvent", Antragstellend: "Antragsteller",
    Arbeitgebend: "Arbeitgeber", Arbeitnehmend: "Arbeitnehmer", Beratend: "Berater",
    Benutzend: "Benutzer", Besuchend: "Besucher", Betreuend: "Betreuer", Dozierend: "Dozent",
    Forschend: "Forscher", Herausgebend: "Herausgeber", Konsumierend: "Konsument",
    Lehrend: "Lehrer", Lesend: "Leser", Mitarbeitend: "Mitarbeiter", Nutzend: "Nutzer",
    Pflegend: "Pfleger", Referierend: "Referent", Rezensierend: "Rezensent", Spendend: "Spender",
    Studierend: "Student", Teilnehmend: "Teilnehmer", Unterstützend: "Unterstützer",
    Veranstaltend: "Veranstalter", Wählend: "Wähler", Zuhörend: "Zuhörer", Zuschauend: "Zuschauer",
    "-Fahrend": "Fahrer", "-Leitend": "Leiter", "-Zahlend": "Zahler"
  }));

  // Gendered determiners and pronouns as [feminine, masculine] of the same case.
  const genderPairs = new Map();
  const conjunctionWords = new Set();
  function addPairs(list, allowConjunction) {
    for (const [feminine, masculine] of list) {
      genderPairs.set(`${feminine}|${masculine}`, masculine);
      genderPairs.set(`${masculine}|${feminine}`, masculine);
      if (allowConjunction) conjunctionWords.add(feminine).add(masculine);
    }
  }
  const caseForms = (fem, nom, prefix) => [[`${fem}e`, nom], [`${fem}e`, `${prefix}en`], [`${fem}er`, `${prefix}em`], [`${fem}er`, `${prefix}es`]];
  // "der oder die Vorsitzende" is a pair form; "er oder sie" may mean two people.
  addPairs([["die", "der"], ["die", "den"], ["der", "dem"], ["der", "des"]], true);
  for (const stem of ["ein", "kein"]) addPairs(caseForms(stem, stem, stem), true);
  for (const stem of ["dies", "jen", "jed", "welch"]) addPairs(caseForms(stem, `${stem}er`, stem), true);
  for (const stem of ["mein", "dein", "sein", "ihr", "unser"]) addPairs(caseForms(stem, stem, stem), false);
  addPairs([...caseForms("eur", "euer", "eur"), ["deren", "dessen"], ["sie", "er"], ["sie", "ihn"], ["ihr", "ihm"]], false);
  addPairs(["", "e", "en", "em", "es", "er"].map((ending) => [`ihr${ending}`, `sein${ending}`]), false);
  const pronounWords = [...new Set([...genderPairs.keys()].flatMap((key) => key.split("|")))].sort((a, b) => b.length - a.length).join("|");
  // Determiners that may take "/n" or "(n)": "eine/n Mitarbeiter/in".
  const determinerBases = new Set(["eine", "keine", "meine", "deine", "seine", "ihre", "unsere", "eure", "jede", "diese", "jene", "welche", "solche", "manche"]);

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
  // Same casing as the first word of the original text: "Der*die" → "Der".
  function likeFirst(word, original) {
    if (original.length > 1 && !hasLowercase.test(original)) return upper(word);
    return hasLowercase.test(original[0]) ? word : capitalize(word);
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
    const rules = new Map();
    for (const entry of (data.rules ?? "").split(";")) {
      const [suffix, rule] = entry.split("=");
      if (suffix) rules.set(suffix, rule === "!" ? null : rule.split(","));
    }
    lexicon = { persons, rules, adjectives: new Set(data.adjectival.split(";").filter(Boolean)) };
    return lexicon;
  }

  // Masculine forms for a feminine stem such as "Ärzt", "Stammkund" or "Lehrer".
  // guess: true for all learned endings, "er" only for words on "-er", false for none.
  const cache = new Map();
  function cached(name, lookup) {
    if (!cache.has(name)) {
      if (cache.size > 5000) cache.clear();
      cache.set(name, lookup());
    }
    return cache.get(name);
  }
  const findPerson = (key, guess) => cached(`${guess}|${key}`, () => lookupPerson(key, guess));
  function lookupPerson(key, guess) {
    const { persons, rules } = load();
    const exact = persons.get(key);
    if (exact) return exact;
    for (let i = minPrefix; i <= key.length - minHead; i++) {
      const head = persons.get(capitalize(key.slice(i)));
      if (!head) continue;
      const prefix = key.slice(0, i);
      const join = (form) => prefix + lower(form[0]) + form.slice(1);
      return { singular: join(head.singular), plural: join(head.plural), dative: join(head.dative), adjectival: head.adjectival };
    }
    if (!guess || key.length < 4 || (guess === "er" && !key.endsWith("er"))) return null;
    // Unknown words: endings learned from the dictionary, e.g. "-ist" → "-isten".
    for (let n = Math.min(maxRuleSuffix, key.length - 1); n >= 2; n--) {
      const ending = lower(key.slice(-n));
      if (!rules.has(ending)) continue;
      const rule = rules.get(ending);
      return rule && { singular: key + rule[0], plural: key + rule[1], dative: key + rule[2], adjectival: false };
    }
    return null;
  }
  // Oblique singular: "dem Teilnehmer", but "dem Studenten".
  const oblique = (forms) => forms.plural === `${forms.singular}en` || forms.plural === `${forms.singular}n` ? forms.plural : forms.singular;
  function isAdjectivalNoun(key) {
    const { adjectives } = load();
    if (adjectives.has(key)) return true;
    for (let i = minPrefix; i <= key.length - minAdjectiveHead; i++) {
      if (adjectives.has(capitalize(key.slice(i)))) return true;
    }
    return false;
  }
  const findParticiple = (base) => cached(`participle|${base}`, () => lookupParticiple(base));
  function lookupParticiple(base) {
    const key = capitalize(base);
    let agent = participles.get(key);
    let prefix = "";
    for (let i = minPrefix; !agent && i <= key.length - 4; i++) {
      const head = capitalize(key.slice(i));
      agent = participles.get(head) ?? participles.get(`-${head}`);
      prefix = base.slice(0, i);
    }
    const forms = agent && findPerson(agent, false);
    if (!forms || !prefix) return forms;
    const join = (form) => prefix + lower(form[0]) + form.slice(1);
    return { singular: join(forms.singular), plural: join(forms.plural), dative: join(forms.dative), adjectival: false };
  }

  const boundary = "[\\p{L}\\p{M}\\p{N}_@]";
  const letters = "[\\p{L}\\p{M}]";
  // "der*die", "die/der", "sie*er", "ihr/sein", "der oder die Vorsitzende"
  const pronounPattern = new RegExp(`(?<!${boundary})(${pronounWords})(?:([*:_·]|[ \\t]?\\/-?[ \\t]?)|[ \\t]+(oder|bzw\\.)[ \\t]+)(${pronounWords})(?!${boundary})(?![*:_·/][ \\t]?(?:das|es)(?!${boundary}))`, "giu");
  // "ein*e", "kein/e", "Ihr(e)"
  const shortPattern = new RegExp(`(?<!${boundary})(ein|kein|mein|dein|sein|ihr|unser)(?:(?:[*:_·]|\\/-?)(e)|\\((e)\\))(?!${boundary})`, "giu");
  // "Lehrer:innen", "Ärzt*in", "Kolleg/-innen", "Autor(innen)", "LeserInnen"
  const markedPattern = new RegExp(`(?<!${boundary})(?:(?=(${letters}{2,}))\\1(?:(,|[*:_·]|\\/-?)(innen|in|INNEN|IN)|\\((innen|in|INNEN|IN)\\))|(${letters}+?\\p{Ll})(Innen|In))(?!${boundary})`, "gu");
  // "Vorsitzende*r", "Angestellte:n", "jede/r", "eine*n"
  const adjectivePattern = new RegExp(`(?<!${boundary})(${letters}+[eE])(?:(,|[*:_·]|\\/-?)([rnRN])|\\(([rnRN])\\))(?!${boundary})`, "gu");
  // "Lehrerinnen und Lehrer", "die Lehrerin oder der Lehrer", "Schülerinnen/Schüler"
  const determiner = "(?:[dD](?:er|ie|en|em|es)|(?:[eE]in|[kK]ein|[mM]ein|[dD]ein|[sS]ein|[iI]hr|[uU]nser)(?:e[nmrs]?)?|[eE]ure[nmrs]?|[eE]uer|(?:[dD]ies|[jJ]en|[jJ]ed|[wW]elch)e[nmrs]?)";
  const pairPattern = new RegExp(`(?<!${boundary})(?:(${determiner})[ \\t]+)?(${letters}+)(?:[ \\t]+(und|oder|&)[ \\t]+|[ \\t]?\\/[ \\t]?)(?:(${determiner})[ \\t]+)?(${letters}+)(?!${boundary})`, "gu");
  const participlePattern = new RegExp(`(?<!${boundary})(\\p{Lu}${letters}*?(?:end|END))(e[nr]?|E[NR]?)(?!${boundary})`, "gu");

  const before = (text, offset, length = 40) => text.slice(Math.max(0, offset - length), offset);
  const dativeSingular = /^(?:d|ein|kein|mein|dein|sein|ihr|unser|eur|dies|jen|jed|welch)em$/u;
  const accusativeSingular = /^(?:d|ein|kein|mein|dein|sein|ihr|unser|eur|dies|jen|jed|welch)en$/u;
  const isSpace = (code) => code === 32 || (code >= 9 && code <= 13) || code === 160 || code === 0x1680 ||
    (code >= 0x2000 && code <= 0x200a) || code === 0x2028 || code === 0x2029 || code === 0x202f ||
    code === 0x205f || code === 0x3000 || code === 0xfeff;
  // The two whitespace-separated tokens before a word, lowercased. A backwards
  // scan is much cheaper than regular expressions anchored at the end.
  function tokensBefore(text, offset) {
    const limit = Math.max(0, offset - 80);
    const tokens = ["", ""];
    let position = offset;
    for (let slot = 1; slot >= 0; slot--) {
      let end = position;
      while (end > limit && isSpace(text.charCodeAt(end - 1))) end--;
      if (end === position || end === limit) break;
      let start = end;
      while (start > limit && !isSpace(text.charCodeAt(start - 1))) start--;
      tokens[slot] = lower(text.slice(start, end));
      position = start;
    }
    return tokens;
  }
  const trailingLetters = (token) => /\p{L}+$/u.exec(token)?.[0] ?? "";
  const lastWord = (text, offset) => trailingLetters(tokensBefore(text, offset)[1]);
  const prepositions = new Set(["mit", "bei", "von", "zu", "aus", "nach", "gegenüber"]);
  const pluralDeterminers = new Set(["den", "allen", "vielen", "wenigen", "einigen", "mehreren", "unseren", "diesen"]);
  // Only explicit local dative cues; this is intentionally not a grammar parser.
  function isDative(text, offset) {
    const [previous, last] = tokensBefore(text, offset).map(trailingLetters);
    return last === "den" || prepositions.has(last) || (pluralDeterminers.has(last) && prepositions.has(previous));
  }
  // Determiners before which adjectival nouns take weak endings: "die Beamten".
  const weakDeterminer = /^(?:die|der|den|diese[nr]?|jene[nr]?|alle[nr]?|sämtliche[nr]?|keine[nr]?|meine[nr]?|deine[nr]?|seine[nr]?|ihre[nr]?|unsere[nr]?|eure[nr]?|welche[nr]?|beide[nr]?)$/u;
  const isWeak = (text, offset) => weakDeterminer.test(lastWord(text, offset));
  // Definite determiners for a masculine singular: "der Vorsitzende", "jede*r Angestellte".
  const isDefiniteSingular = (text, offset) =>
    /(?:^|[^\p{L}])(?:der|(?:dies|jen|jed|welch)e(?:r|[*:_·]r|\/-?r|\(r\)))$/u.test(tokensBefore(text, offset)[1]);

  function replacePronoun(match, first, separator, conjunction, second, offset, source) {
    const masculine = genderPairs.get(`${lower(first)}|${lower(second)}`);
    if (!masculine) return match;
    if (conjunction && (!conjunctionWords.has(lower(first)) || !/^[ \t]+\p{Lu}/u.test(source.slice(offset + match.length)))) return match;
    return likeFirst(masculine, first);
  }
  function replaceShort(match, stem, ending1, ending2) {
    const ending = ending1 ?? ending2;
    return (styleOf(stem) === "upper") === (ending === "E") ? stem : match;
  }
  function replaceMarked(match, word, separator, ending1, ending2, binnenStem, binnenI, offset, source) {
    const stem = word ?? binnenStem;
    const ending = ending1 ?? ending2 ?? binnenI;
    const style = styleOf(stem);
    if (binnenI ? style === "upper" : (style === "upper") !== (ending[0] === "I")) return match;
    const key = capitalize(stem);
    // Comma forms and lowercase words are only converted for known words. A
    // singular Binnen-I is common in product names ("PlugIn"), so only "-er" is guessed.
    const guess = style === "lower" || separator === "," ? false : binnenI === "In" ? "er" : true;
    const forms = findPerson(key, guess);
    if (!forms) return match;
    let form;
    if (ending.length === 2) {
      if (forms.adjectival) form = isWeak(source, offset) ? forms.singular.slice(0, -1) : forms.singular;
      // Dative or accusative singular: "dem Kollegen", "den Studenten".
      else {
        const word = lastWord(source, offset);
        form = dativeSingular.test(word) || accusativeSingular.test(word) ? oblique(forms) : forms.singular;
      }
    }
    else if (isDative(source, offset)) form = forms.dative;
    else form = forms.adjectival && isWeak(source, offset) ? `${forms.plural}n` : forms.plural;
    return restyle(form, stem, key, style);
  }
  function replaceAdjective(match, base, separator, ending1, ending2, offset, source) {
    const ending = ending1 ?? ending2;
    const style = styleOf(base);
    if ((style === "upper") !== (ending === "R" || ending === "N")) return match;
    // "/n" and "(n)" often mark optional plurals ("Seite(n)"), so these need a known word.
    const optionalPlural = (separator === undefined || separator[0] === "/") && lower(ending) === "n";
    const known = determinerBases.has(lower(base)) || (style !== "lower" && isAdjectivalNoun(capitalize(base)));
    if ((separator === "," || optionalPlural) && !known) return match;
    // Weak ending after "der" or "jede*r": "der Vorsitzende", not "der Vorsitzender".
    if (lower(ending) === "r" && isDefiniteSingular(source, offset)) return base;
    return base + ending;
  }
  function pairReplacement(firstDeterminer, firstNoun, conjunction, secondDeterminer, secondNoun) {
    for (const [femaleNoun, maleNoun, femaleDeterminer, maleDeterminer] of [
      [firstNoun, secondNoun, firstDeterminer, secondDeterminer],
      [secondNoun, firstNoun, secondDeterminer, firstDeterminer]
    ]) {
      const plural = /(?:innen|INNEN)$/u.test(femaleNoun);
      if (!plural && !/(?:in|IN)$/u.test(femaleNoun)) continue;
      // "Lehrerin und Lehrer" may mean two people; only alternatives are merged.
      if (!plural && (conjunction === "und" || conjunction === "&")) continue;
      const stem = femaleNoun.slice(0, plural ? -5 : -2);
      if (stem.length < 2) continue;
      const style = styleOf(stem);
      if ((style === "upper") !== (femaleNoun.endsWith("IN") || femaleNoun.endsWith("INNEN"))) continue;
      const key = capitalize(stem);
      const forms = findPerson(key, style !== "lower");
      if (!forms) continue;
      const options = plural
        ? [forms.plural, forms.dative, forms.adjectival ? `${forms.plural}n` : forms.plural]
        : [forms.singular, oblique(forms), forms.adjectival ? forms.singular.slice(0, -1) : forms.singular];
      if (!options.some((form) => restyle(form, stem, key, style) === maleNoun)) continue;
      const determinerText = maleDeterminer ?? (plural ? femaleDeterminer : undefined);
      // A lone feminine article cannot be fixed in the singular: "die Lehrerin oder Lehrer".
      if (!maleDeterminer && !plural && femaleDeterminer) return null;
      if (!determinerText) return maleNoun;
      return `${firstDeterminer ? likeFirst(determinerText, firstDeterminer) : determinerText} ${maleNoun}`;
    }
    return null;
  }
  function replacePairs(text) {
    let result = "";
    let last = 0;
    pairPattern.lastIndex = 0;
    for (let match; (match = pairPattern.exec(text));) {
      const replacement = pairReplacement(match[1], match[2], match[3], match[4], match[5]);
      if (replacement === null) {
        // Retry after the first noun: "Kinder und Lehrerinnen und Lehrer".
        pairPattern.lastIndex = match.index + (match[1] ? match[1].length + match[0].slice(match[1].length).indexOf(match[2]) : 0) + match[2].length;
        continue;
      }
      result += text.slice(last, match.index) + replacement;
      last = pairPattern.lastIndex;
    }
    return result + text.slice(last);
  }
  function replaceParticiple(match, base, casedEnding, offset, source) {
    const ending = lower(casedEnding);
    if ((casedEnding !== ending) === hasLowercase.test(base)) return match;
    const forms = findParticiple(base);
    if (!forms) return match;
    const word = lastWord(source, offset);
    let form;
    if (ending === "er") form = forms.singular;
    else if (ending === "e") {
      // "die Studierende" and "eine Studierende" are feminine singular.
      if (/^(?:die|das|eine|keine|meine|deine|seine|ihre|unsere|eure|diese|jene|jede|welche)$/u.test(word)) return match;
      if (/^(?:der|dieser|jener|jeder|welcher)$/u.test(word)) form = forms.singular;
      else form = isDative(source, offset) ? forms.dative : forms.plural;
    } else {
      // "der Studierenden" and "des Studierenden" need a genitive or feminine form.
      if (/^(?:der|einer|keiner|meiner|deiner|seiner|ihrer|unserer|eurer|des|eines|keines|meines|deines|seines|ihres|unseres|eures|dieses|jenes|jedes)$/u.test(word)) return match;
      // "meinen Studierenden" may be dative plural; "einen" and "jeden" are singular.
      if (dativeSingular.test(word) || word === "einen" || word === "jeden") form = oblique(forms);
      else form = isDative(source, offset) ? forms.dative : forms.plural;
    }
    return hasLowercase.test(base) ? form : upper(form);
  }

  function transformSegment(text, settings) {
    let result = text;
    if (/[*:_·/(][ \t]?(?:d(?:er|ie|en|em|es)|ein|kein|mein|dein|sein|ihr|unser|eur|dies|jen|jed|welch|sie|er|ihn|ihm|e(?!\p{L}))|[ \t](?:oder|bzw\.)[ \t]/iu.test(result)) {
      result = result.replace(pronounPattern, (...args) => args[3] && !settings.pairs ? args[0] : replacePronoun(...args));
      result = result.replace(shortPattern, replaceShort);
    }
    // Determiners first, so "unsere*n Kolleg*in" sees "unseren" before the noun.
    if (/[eE][*:_/·,(]-?[rnRN]/u.test(result)) result = result.replace(adjectivePattern, replaceAdjective);
    if (/[*:_/·,(]-?(?:in|IN)|\p{Ll}In/u.test(result)) result = result.replace(markedPattern, replaceMarked);
    // A pair needs a feminine form next to "und", "oder", "&" or "/".
    if (settings.pairs && /(?:in|IN|nen|NEN)(?:[ \t]+(?:und|oder|&)[ \t]+|[ \t]?\/)|(?:[ \t](?:und|oder|&)[ \t]+|\/[ \t]?)(?:\p{L}+[ \t]+)?\p{L}+(?:in|IN|nen|NEN)(?!\p{L})/u.test(result)) result = replacePairs(result);
    if (settings.participles && /\p{Lu}\p{L}*(?:ende|ENDE)/u.test(result)) result = result.replace(participlePattern, replaceParticiple);
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

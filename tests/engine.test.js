import test from "node:test";
import assert from "node:assert/strict";
import "../extension/dictionary.js";
import "../extension/engine.js";

const { transform } = globalThis.Entgendert;
const examples = [
  ["Lehrer:innen", "Lehrer"], ["Schüler*innen", "Schüler"],
  ["Bürger_innen", "Bürger"], ["LeserInnen", "Leser"],
  ["Nutzer/-innen", "Nutzer"], ["Teilnehmer/innen", "Teilnehmer"],
  ["Mitarbeiter(innen)", "Mitarbeiter"], ["Lehrer·innen", "Lehrer"],
  ["Student:innen", "Studenten"], ["Ärzt:innen", "Ärzte"],
  ["Kolleg*innen", "Kollegen"], ["Expert:innen", "Experten"],
  ["Anwält:innen", "Anwälte"], ["Ärzt:in", "Arzt"],
  ["Kolleg:in", "Kollege"], ["Autor*innen", "Autoren"],
  ["Köch*innen", "Köche"], ["LEHRER:INNEN", "LEHRER"],
  ["lehrer:innen", "lehrer"], ["mit den Bürger*innen", "mit den Bürgern"],
  ["von Ärzt:innen", "von Ärzten"], ["den Schüler*innen helfen", "den Schülern helfen"],
  ["Paketzusteller*innen", "Paketzusteller"],
  ["Die Paketzusteller*innen kommen.", "Die Paketzusteller kommen."],
  ["Mit den Paketzusteller*innen sprechen.", "Mit den Paketzustellern sprechen."],
  ["von Paketzusteller*innen", "von Paketzustellern"],
  ["Paketzusteller:in", "Paketzusteller"],
  ["PaketzustellerInnen", "Paketzusteller"],
  ["Paketzustellerinnen und Paketzusteller", "Paketzusteller"],
  ["Die Lehrerinnen und Lehrer kommen.", "Die Lehrer kommen."],
  ["Lehrer und Lehrerinnen", "Lehrer"],
  ["Studentinnen oder Studenten", "Studenten"],
  ["Ärztinnen und Ärzte", "Ärzte"],
  ["mit Ärztinnen und Ärzten", "mit Ärzten"],
  ["Studierende lernen.", "Studenten lernen."],
  ["die Studierenden", "die Studenten"], ["ein Studierender", "ein Student"],
  ["Mitarbeitende und Teilnehmende", "Mitarbeiter und Teilnehmer"],
  ["Lehrer:innen,\nÄrzt*innen!", "Lehrer,\nÄrzte!"],
  [
    "Sprechen Sie alle Geschlechter durch die Nutzung des Gendersterns an (Studenten, Dozenten, Vorsitzende*r, Mitarbeiter etc.)",
    "Sprechen Sie alle Geschlechter durch die Nutzung des Gendersterns an (Studenten, Dozenten, Vorsitzender, Mitarbeiter etc.)"
  ],
  ["Vorsitzende*r", "Vorsitzender"], ["Vorsitzende:r", "Vorsitzender"],
  ["Vorsitzende_r", "Vorsitzender"], ["Vorsitzende/r", "Vorsitzender"],
  ["Vorsitzende/-r", "Vorsitzender"], ["Vorsitzende·r", "Vorsitzender"],
  ["Vorsitzende(r)", "Vorsitzender"], ["Vorsitzende*n", "Vorsitzenden"],
  ["VORSITZENDE*R", "VORSITZENDER"], ["Angestellte:r", "Angestellter"],
  ["Beschäftigte*r", "Beschäftigter"], ["Abgeordnete/r", "Abgeordneter"],
  ["Auszubildende*r", "Auszubildender"], ["Datenschutzbeauftragte*r", "Datenschutzbeauftragter"],
  ["stellvertretende*r Vorsitzende*r", "stellvertretender Vorsitzender"],
  ["Gesucht: Angestellte*r im Vertrieb", "Gesucht: Angestellter im Vertrieb"],
  ["Vorsitzende*r: Frau Meier", "Vorsitzender: Frau Meier"],
  ["Studierende*r", "Student"], ["Studierende:n", "Studenten"],
  ["Lehrende*r", "Lehrer"], ["Mitarbeitende:r", "Mitarbeiter"],
  ["Teilnehmende(r)", "Teilnehmer"], ["Kreisvorsitzende*r", "Kreisvorsitzender"],
  ["Superlehrer:innen", "Superlehrer"]
];
for (const [input, expected] of examples) {
  test(`${input} → ${expected}`, () => assert.equal(transform(input), expected));
}
for (const separator of ["/", ",", "_", ":"]) {
  test(`Trennzeichen ${separator}: verschiedene Wortstämme und Flexionen`, () => {
    for (const [stem, singular, plural, dative] of [
      ["Lehrer", "Lehrer", "Lehrer", "Lehrern"],
      ["Student", "Student", "Studenten", "Studenten"],
      ["Ärzt", "Arzt", "Ärzte", "Ärzten"],
      ["Kolleg", "Kollege", "Kollegen", "Kollegen"],
      ["Paketzusteller", "Paketzusteller", "Paketzusteller", "Paketzustellern"]
    ]) {
      assert.equal(transform(`${stem}${separator}in`), singular);
      assert.equal(transform(`Die ${stem}${separator}innen kommen.`), `Die ${plural} kommen.`);
      assert.equal(transform(`Mit den ${stem}${separator}innen sprechen.`), `Mit den ${dative} sprechen.`);
      assert.equal(transform(`${stem.toLowerCase()}${separator}innen`), plural.toLowerCase());
      assert.equal(transform(`${stem.toUpperCase()}${separator}INNEN`), plural.toUpperCase());
    }
  });
}
for (const text of [
  "Berlin innen beginnen LinkedIn Login PlugIn", "Lehrerinnen und Schüler", "Ärztin",
  "Studentinnen", "Bürgerinitiative", "Lehrer:innenzimmer",
  "Paketzustellerinnen", "Paketzusteller*innenstreik",
  "Lehrer, innen und außen", "Lehrer,innenpolitisch", "Uhrzeit: innen",
  "Admin:innen", "innen", "user:input", "eine Studierende", "einer Studierenden",
  "studierende Kinder", "teilnehmende Personen", "LehrendePerson",
  "https://example.org/Lehrer:innen", "www.example.org/Studierende", "Lehrer:innen@example.org",
  "Die Teilnehmerinnen haben gewonnen.", "Studierende\u0301", "123Lehrer:innen", "",
  "Vorsitzende", "Die Vorsitzende er\u00f6ffnet.", "Vorsitzende: Frau Meier", "Vorsitzende, Kassenwart",
  "Vorsitzende/Referentin", "Vorsitzende*rin", "Vorsitzende*rn",
  "Vorsitzende*R", "https://example.org/Vorsitzende*r"
]) {
  test(`Unverändert: ${text}`, () => assert.equal(transform(text), text));
}
for (const separator of ["*", ":", "_", "/", "/-", "·", ","]) {
  test(`Substantivierte Adjektive mit Trennzeichen ${separator}`, () => {
    for (const word of ["Vorsitzende", "Angestellte", "Beschäftigte", "Verantwortliche", "Jugendliche"]) {
      assert.equal(transform(`${word}${separator}r`), `${word}r`);
      assert.equal(transform(`${word}${separator}n`), `${word}n`);
      assert.equal(transform(`Mit ${word}${separator}r sprechen.`), `Mit ${word}r sprechen.`);
      if (separator !== ",") assert.equal(transform(`${word.toLowerCase()}${separator}r`), `${word.toLowerCase()}r`);
      assert.equal(transform(`${word.toUpperCase()}${separator}R`), `${word.toUpperCase()}R`);
    }
  });
}
test("Partizipien mit Genderzeichen werden nicht verstümmelt", () => {
  for (const word of ["Studierende", "Lehrende", "Mitarbeitende", "Teilnehmende", "Lesende"]) {
    for (const options of [{}, { participles: false }]) {
      const result = transform(`${word}*r`, options);
      assert.doesNotMatch(result, /[*:_/·(]/u, `${word}*r → ${result}`);
    }
  }
  assert.equal(transform("Studierende*r", { participles: false }), "Studierender");
  assert.equal(transform("Mitarbeitende:r", { participles: false }), "Mitarbeitender");
});
test("Wörterbuch aus Wiktionary ist geladen", () => {
  assert.ok(globalThis.Entgendert.dictionarySize > 4000, `nur ${globalThis.Entgendert.dictionarySize} Einträge`);
});
for (const [input, expected] of [
  // Unregelmäßige Formen aus dem Wörterbuch
  ["Bäuer:innen", "Bauern"], ["Französ*innen", "Franzosen"], ["Jüd:innen", "Juden"],
  ["Pol:innen", "Polen"], ["Russ*innen", "Russen"], ["Zauber:innen", "Zauberer"],
  ["Gött*innen", "Götter"], ["Rät:innen", "Räte"], ["Köch:in", "Koch"], ["Pat*in", "Pate"],
  ["Soldat*innen", "Soldaten"], ["Polizist:innen", "Polizisten"], ["Muslim:innen", "Muslime"],
  ["Kund*innen", "Kunden"], ["Chef:innen", "Chefs"], ["Wähler*innen", "Wähler"],
  ["Zahnärzt:innen", "Zahnärzte"], ["mit den Zahnärzt:innen", "mit den Zahnärzten"],
  ["Bürgermeister*innen", "Bürgermeister"], ["Erzieher:innen", "Erzieher"],
  // Adjektivisch deklinierte männliche Form
  ["Beamt*innen kommen", "Beamte kommen"], ["Die Beamt*innen kommen", "Die Beamten kommen"],
  ["mit den Beamt:innen", "mit den Beamten"], ["ein Beamt:in", "ein Beamter"],
  ["der*die Beamt:in", "der Beamte"], ["Polizeibeamt*innen", "Polizeibeamte"],
  // Unbekannte Zusammensetzungen über den bekannten letzten Wortteil
  ["Stammkund:innen", "Stammkunden"], ["Hausärzt*innen", "Hausärzte"],
  ["Finanzexpert:innen", "Finanzexperten"], ["Arbeitskolleg*innen", "Arbeitskollegen"],
  ["Lieblingskolleg:in", "Lieblingskollege"],
  // Unbekannte Wörter auf -er
  ["Influencer*innen", "Influencer"], ["Softwareentwickler:innen", "Softwareentwickler"],
  ["Social-Media-Manager*innen", "Social-Media-Manager"], ["KI-Forscher:innen", "KI-Forscher"],
  ["mit den Influencer*innen", "mit den Influencern"], ["SOFTWAREENTWICKLER:INNEN", "SOFTWAREENTWICKLER"],
  ["ManagerInnen", "Manager"], ["Absender/in", "Absender"],
  // Großschreibung und Kleinschreibung
  ["ZAHNÄRZT:INNEN", "ZAHNÄRZTE"], ["kund:innen", "kunden"], ["Kund(innen)", "Kunden"],
  // Pronomen und Adjektive mit Genderzeichen
  ["jede*r", "jeder"], ["eine*n", "einen"], ["keine:r", "keiner"], ["neue*r Kolleg*in", "neuer Kollege"],
  ["Liebe*r Leser*in", "Lieber Leser"],
  // Mehrdeutige Schreibweisen nur bei bekannten substantivierten Adjektiven
  ["Angestellte(n)", "Angestellten"], ["Vorsitzende/n", "Vorsitzenden"],
  ["Kreisvorsitzende(n)", "Kreisvorsitzenden"], ["Beschäftigte,r", "Beschäftigter"],
  // Paarformen mit Wörterbuch
  ["Kundinnen und Kunden", "Kunden"], ["Beamtinnen und Beamte", "Beamte"],
  ["die Beamtinnen und Beamten", "die Beamten"], ["Polizistinnen oder Polizisten", "Polizisten"],
  ["Zahnärztinnen und Zahnärzte", "Zahnärzte"], ["Influencerinnen und Influencer", "Influencer"]
]) {
  test(`Wörterbuch: ${input} → ${expected}`, () => assert.equal(transform(input), expected));
}
for (const text of [
  // Optionale Plurale sind keine Genderformen
  "Seite(n)", "Anlage/n", "Arbeitsweise(n)", "Alternative(n)", "die ausgewählte(n) Datei(en)",
  "Stunde/n",
  // Komma ohne Leerzeichen nur bei bekannten Personenbezeichnungen
  "Wasser,in", "aber,in Berlin", "Sommer,innen", "Fenster,in",
  // Kleinschreibung nur bei bekannten Wörtern
  "über/in", "oder:in", "filter:innen",
  // Unbekannte Wörter ohne -er
  "Admin:innen", "Xyzabc:innen",
  // Unpassende Paare
  "Lehrerinnen und Ärzte", "Innen und Außen", "Gewinnen oder Verlieren"
]) {
  test(`Wörterbuch unverändert: ${text}`, () => assert.equal(transform(text), text));
}
const grammar = [
  // Artikel und Begleiter mit Genderzeichen
  ["der*die Vorsitzende", "der Vorsitzende"], ["Die*der Vorsitzende", "Der Vorsitzende"],
  ["DER/DIE VORSITZENDE", "DER VORSITZENDE"], ["der/die Lehrer*in", "der Lehrer"],
  ["für den/die Bewerber*in", "für den Bewerber"], ["mit dem/der Kolleg*in", "mit dem Kollegen"],
  ["des*der Vorsitzenden", "des Vorsitzenden"], ["ein*e Lehrer*in", "ein Lehrer"],
  ["Ein:e Kolleg:in", "Ein Kollege"], ["ein(e) Ärzt(in)", "ein Arzt"], ["kein*e Kund*in", "kein Kunde"],
  ["einem*einer Kolleg*in", "einem Kollegen"], ["eine*n Angestellte*n", "einen Angestellten"],
  ["eine/n Mitarbeiter/in", "einen Mitarbeiter"], ["eine(n) Mitarbeiter(in)", "einen Mitarbeiter"],
  ["ein*e Vorsitzende*r", "ein Vorsitzender"], ["der*die Vorsitzende*r", "der Vorsitzende"],
  ["jede*r Vorsitzende*r", "jeder Vorsitzende"], ["jede*r Mitarbeiter*in", "jeder Mitarbeiter"],
  ["diese*r Teilnehmer*in", "dieser Teilnehmer"],
  ["Ihr*e Ansprechpartner*in", "Ihr Ansprechpartner"], ["Sprechen Sie mit Ihrem*Ihrer Ansprechpartner*in", "Sprechen Sie mit Ihrem Ansprechpartner"],
  ["unsere*n Kolleg*in", "unseren Kollegen"],
  // Pronomen
  ["sie*er", "er"], ["Er/Sie", "Er"], ["ihn/sie", "ihn"], ["ihr/ihm", "ihm"],
  ["seine/ihre Kinder", "seine Kinder"], ["ihr*sein Auto", "sein Auto"], ["dessen/deren", "dessen"],
  // Artikel als Paarform vor einem Nomen
  ["der oder die Vorsitzende", "der Vorsitzende"], ["Die oder der Beauftragte", "Der Beauftragte"],
  ["einen oder eine Beauftragte(n)", "einen Beauftragten"],
  // Schwache Nomen nach Begleitern im Dativ und Akkusativ
  ["dem Kolleg*in", "dem Kollegen"], ["den Student:in", "den Studenten"], ["einem Lehrer*in", "einem Lehrer"],
  ["Sie können Kolleg*in werden", "Sie können Kollege werden"],
  // Paarformen mit Artikeln und Schrägstrich
  ["die Lehrerin oder der Lehrer", "der Lehrer"], ["Die Lehrerin oder der Lehrer", "Der Lehrer"],
  ["der Lehrer oder die Lehrerin", "der Lehrer"], ["die Lehrerinnen und die Lehrer", "die Lehrer"],
  ["den Schülerinnen und den Schülern", "den Schülern"], ["einer Ärztin oder einem Arzt", "einem Arzt"],
  ["der Kollegin oder dem Kollegen", "dem Kollegen"], ["eine Beamtin oder ein Beamter", "ein Beamter"],
  ["Schülerinnen/Schüler", "Schüler"], ["Lehrerin/Lehrer", "Lehrer"], ["Ärztinnen / Ärzte", "Ärzte"],
  ["Kinder und Lehrerinnen und Lehrer", "Kinder und Lehrer"],
  ["die Schüler und die Lehrerinnen und die Lehrer", "die Schüler und die Lehrer"],
  // Gelernte Endungsregeln für unbekannte Wörter
  ["Blablaist*innen", "Blablaisten"], ["Quuxent:innen", "Quuxenten"], ["Fantasiolog*innen", "Fantasiologen"],
  ["Fantasiolog*in", "Fantasiologe"], ["Zorgeur:innen", "Zorgeure"], ["mit den Zorgeur:innen", "mit den Zorgeuren"],
  ["Youtuber*innen", "Youtuber"], ["Podcaster:innen", "Podcaster"],
  // Partizipien mit allen Beugungen und als letzter Wortteil
  ["die Mitarbeitenden", "die Mitarbeiter"], ["mit den Teilnehmenden", "mit den Teilnehmern"],
  ["dem Teilnehmenden", "dem Teilnehmer"], ["dem Studierenden", "dem Studenten"],
  ["einen Studierenden", "einen Studenten"], ["der Studierende", "der Student"],
  ["Teilnehmender", "Teilnehmer"], ["Kursteilnehmende", "Kursteilnehmer"],
  ["Lehramtsstudierende", "Lehramtsstudenten"], ["Projektmitarbeitende", "Projektmitarbeiter"],
  ["Radfahrende", "Radfahrer"], ["Projektleitende", "Projektleiter"], ["Steuerzahlende", "Steuerzahler"],
  ["STUDIERENDE", "STUDENTEN"], ["Mitarbeiter*innen und Mitarbeitende", "Mitarbeiter und Mitarbeiter"]
];
for (const [input, expected] of grammar) {
  test(`Grammatik: ${input} → ${expected}`, () => assert.equal(transform(input), expected));
}
for (const [participle, plural] of [
  ["Abonnierende", "Abonnenten"], ["Absolvierende", "Absolventen"], ["Antragstellende", "Antragsteller"],
  ["Arbeitgebende", "Arbeitgeber"], ["Arbeitnehmende", "Arbeitnehmer"], ["Beratende", "Berater"],
  ["Benutzende", "Benutzer"], ["Besuchende", "Besucher"], ["Betreuende", "Betreuer"], ["Dozierende", "Dozenten"],
  ["Forschende", "Forscher"], ["Herausgebende", "Herausgeber"], ["Konsumierende", "Konsumenten"],
  ["Lehrende", "Lehrer"], ["Lesende", "Leser"], ["Mitarbeitende", "Mitarbeiter"], ["Nutzende", "Nutzer"],
  ["Pflegende", "Pfleger"], ["Referierende", "Referenten"], ["Rezensierende", "Rezensenten"],
  ["Spendende", "Spender"], ["Studierende", "Studenten"], ["Teilnehmende", "Teilnehmer"],
  ["Unterstützende", "Unterstützer"], ["Veranstaltende", "Veranstalter"], ["Wählende", "Wähler"],
  ["Zuhörende", "Zuhörer"], ["Zuschauende", "Zuschauer"], ["Autofahrende", "Autofahrer"],
  ["Kursleitende", "Kursleiter"], ["Beitragszahlende", "Beitragszahler"]
]) {
  test(`Partizip: ${participle} → ${plural}`, () => {
    assert.equal(transform(participle), plural);
    assert.notEqual(transform(`mit den ${participle}n`), `mit den ${participle}n`);
    assert.notEqual(transform(`ein ${participle}r`), `ein ${participle}r`);
  });
}
for (const text of [
  // Artikel und Pronomen ohne Genderbezug
  "der/die/das Beste", "er/sie/es", "er oder sie", "Ob der oder die gewinnt", "Sie/Ihr", "und/oder",
  "die Lehrerin oder Lehrer", "die Lehrerin und der Lehrer", "Lehrerin und Lehrer",
  // Produktnamen mit Binnen-I und gesperrte Endungen
  "PlugIn", "BlogIn", "CheckIn", "Quuxier:innen", "Blablaar:innen",
  // Partizipien mit eigener Bedeutung oder weiblichem Bezug
  "das Entscheidende", "Blutende", "Führende", "Sehende", "Hörende", "Spannende", "Lernende",
  "Fahrende", "Leitende", "Auszubildende", "Reisende", "die Studierende", "der Studierenden",
  "des Mitarbeitenden", "einer Teilnehmenden"
]) {
  test(`Grammatik unverändert: ${text}`, () => assert.equal(transform(text), text));
}
test("Artikel-Paarform mit „oder“ folgt der Paarform-Option", () => {
  assert.equal(transform("der oder die Vorsitzende", { pairs: false }), "der oder die Vorsitzende");
  assert.equal(transform("der*die Vorsitzende", { pairs: false }), "der Vorsitzende");
  assert.equal(transform("die Lehrerin oder der Lehrer", { pairs: false }), "die Lehrerin oder der Lehrer");
});
test("Partizipien mit Option ausgeschaltet", () => {
  assert.equal(transform("die Mitarbeitenden", { participles: false }), "die Mitarbeitenden");
  assert.equal(transform("Kursteilnehmende", { participles: false }), "Kursteilnehmende");
});
test("Regeln separat ausschaltbar", () => {
  assert.equal(transform("Studierende und Lehrer:innen", { participles: false }), "Studierende und Lehrer");
  assert.equal(transform("Lehrerinnen und Lehrer", { pairs: false }), "Lehrerinnen und Lehrer");
  assert.equal(transform("Lehrer:innen", { enabled: false }), "Lehrer:innen");
});
test("Ersetzung ist idempotent", () => {
  for (const [input] of [...examples, ...grammar]) assert.equal(transform(transform(input)), transform(input));
});
test("Keine Markup-Erzeugung", () => {
  assert.equal(transform('<img src="x"> Lehrer:innen'), '<img src="x"> Lehrer');
});
test("Lange Wörter ohne E-Mail-Adresse bleiben unverändert", () => {
  const text = "a".repeat(49000) + " Lehrer:innen";
  assert.equal(transform(text), "a".repeat(49000) + " Lehrer");
});

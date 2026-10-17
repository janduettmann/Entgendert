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
  ["Lehrende*r", "Lehrender"], ["Mitarbeitende:r", "Mitarbeitender"],
  ["Teilnehmende(r)", "Teilnehmender"], ["Kreisvorsitzende*r", "Kreisvorsitzender"],
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
  ["der*die Beamt:in", "der*die Beamte"], ["Polizeibeamt*innen", "Polizeibeamte"],
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
  "eine(n)", "Stunde/n",
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
test("Regeln separat ausschaltbar", () => {
  assert.equal(transform("Studierende und Lehrer:innen", { participles: false }), "Studierende und Lehrer");
  assert.equal(transform("Lehrerinnen und Lehrer", { pairs: false }), "Lehrerinnen und Lehrer");
  assert.equal(transform("Lehrer:innen", { enabled: false }), "Lehrer:innen");
});
test("Ersetzung ist idempotent", () => {
  for (const [input] of examples) assert.equal(transform(transform(input)), transform(input));
});
test("Keine Markup-Erzeugung", () => {
  assert.equal(transform('<img src="x"> Lehrer:innen'), '<img src="x"> Lehrer');
});
test("Lange Wörter ohne E-Mail-Adresse bleiben unverändert", () => {
  const text = "a".repeat(49000) + " Lehrer:innen";
  assert.equal(transform(text), "a".repeat(49000) + " Lehrer");
});

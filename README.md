# Entgendert

Eine lokale Browser-Erweiterung für Firefox und Chrome, die bekannte deutsche
Genderformen in eine persönliche Leseansicht im generischen Maskulinum umwandelt.
Kein Server, keine KI-API, keine Laufzeit-Abhängigkeiten. Code MIT-lizenziert,
Wörterbuchdaten aus Wiktionary unter CC BY-SA 4.0 (siehe [Wörterbuch](#wörterbuch)).

**Status: testbare Version (0.3.0).** Regelbasiert, keine vollständige
deutsche Grammatikprüfung. Firefox-Paket und Chrome-Paket werden aus denselben
Quelldateien gebaut.

| Ausgangstext | Leseansicht |
| --- | --- |
| Lehrer:innen, Schüler*innen, LeserInnen | Lehrer, Schüler, Leser |
| Student:innen, Kolleg*innen | Studenten, Kollegen |
| Ärzt:innen, Anwält:innen | Ärzte, Anwälte |
| mit den Bürger*innen | mit den Bürgern |
| Zahnärzt:innen, Stammkund*innen | Zahnärzte, Stammkunden |
| Vorsitzende*r, Angestellte:n | Vorsitzender, Angestellten |
| ein*e Kolleg*in, der*die Vorsitzende | ein Kollege, der Vorsitzende |
| Lehrerinnen und Lehrer, die Lehrerin oder der Lehrer | Lehrer, der Lehrer |
| Studierende, die Mitarbeitenden | Studenten, die Mitarbeiter |

Paarformen und Partizipformen sind standardmäßig aktiv und im Popup separat
abschaltbar. Das Popup zeigt außerdem, wie viele Wörter auf der aktuellen Seite
ersetzt wurden; die Zahl wird nur beim Öffnen des Popups lokal gezählt. Ist
Entgendert ausgeschaltet, sind die übrigen Einstellungen gesperrt. Die Website-Ausnahme gilt für den exakten Hostnamen (beispielsweise
`www.example.org`, nicht automatisch auch für `example.org` oder Subdomains).
Beim Abschalten werden Originaltexte wiederhergestellt, soweit die Seite sie
inzwischen nicht selbst geändert hat.

## Lokal installieren

Voraussetzung: Node.js 22 oder neuer. Der Build selbst benötigt keine Pakete.

```sh
npm run build
```

Chrome (ab Version 120):

1. `chrome://extensions` öffnen und den Entwicklermodus aktivieren.
2. „Entpackte Erweiterung laden“ wählen.
3. Den Ordner `dist/chrome` auswählen.
4. Bereits offene Webseiten neu laden und Entgendert bei Bedarf an die Symbolleiste heften.

Firefox (ab Version 142):

1. `about:debugging#/runtime/this-firefox` öffnen.
2. „Temporäres Add-on laden“ wählen.
3. `dist/firefox/manifest.json` auswählen.
4. Bereits offene Webseiten neu laden.

Die temporäre Firefox-Installation endet beim Browser-Neustart. Für eine
dauerhafte Installation in regulären Firefox-Versionen muss das Add-on von
Mozilla signiert werden. Eine ZIP-Datei auf GitHub allein ersetzt diese
Signierung nicht. Siehe [Mozillas Distributionsanleitung](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/).

Die Firefox-Konfiguration enthält eine feste Add-on-ID und die Erklärung,
dass keine Daten gesammelt werden, gemäß der
[Manifest-Dokumentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings).

## Erkennung und Grenzen

Die Erkennung kombiniert ein Wörterbuch mit allgemeinen Regeln. Unterstützt
werden `*`, `:`, `_`, `/`, `/-`, `·`, `,`, Klammern und Binnen-I. Die Zeichen
müssen direkt zwischen Wortstamm und Endung stehen; normale Zeichensetzung wie
„Lehrer, innen und außen“ bleibt unverändert. Reguläre feminine Formen wie
„Lehrerinnen“ bleiben alleine unverändert.

1. **Wörterbuch:** rund 4.500 Personenbezeichnungen aus Wiktionary, darunter
   unregelmäßige wie `Ärzt:innen` → „Ärzte“, `Bäuer*innen` → „Bauern“ oder
   `Beamt:innen` → „Beamte“ (nach „die“: „Beamten“).
2. **Zusammensetzungen:** Unbekannte Komposita werden über ihren bekannten
   letzten Wortteil umgewandelt, etwa `Stammkund*innen` → „Stammkunden“.
3. **Endungsregeln:** Für unbekannte Wörter lernt das Generator-Skript aus dem
   Wörterbuch, welche Endungen sich zuverlässig verhalten, etwa „-ist“ →
   „-isten“, „-log“ → „-loge/-logen“ oder „-er“ → unverändert. Die 42 Regeln
   stimmen bei 98,8 % der Wörterbucheinträge. Gemischte Endungen wie „-ier“
   (Offiziere, aber Algerier) werden gesperrt statt geraten.
4. **Artikel, Begleiter und Pronomen:** `der*die` → „der“, `den/die` → „den“,
   `ein*e` → „ein“, `eine/n` → „einen“, `jede*r` → „jeder“, `Ihr*e` → „Ihr“,
   `sie/er` → „er“, `seine/ihre` → „seine“. Danach richten sich schwache Formen:
   `der*die Vorsitzende*r` → „der Vorsitzende“, `dem Kolleg*in` → „dem Kollegen“.
   „der/die/das“ und „er/sie/es“ bleiben stehen.
5. **Substantivierte Adjektive:** `Vorsitzende*r` → „Vorsitzender“,
   `Angestellte:n` → „Angestellten“.
6. **Paarformen** (abschaltbar): „Lehrerinnen und Lehrer“, „Schülerinnen/Schüler“,
   „die Lehrerin oder der Lehrer“ und „der oder die Vorsitzende“ werden zur
   männlichen Form. Singular-Paare mit „und“ („die Lehrerin und der Lehrer“)
   bleiben stehen, weil sie zwei Personen meinen können.

Vorsichtsregeln gegen Fehltreffer: Formen mit Komma (`Lehrer,innen`) und
kleingeschriebene Wörter werden nur bei bekannten Wörtern umgewandelt, damit
Tippfehler wie „aber,in Berlin“ stehen bleiben. `/n` und `(n)` kennzeichnen oft
optionale Plurale („Seite(n)“, „Anlage/n“); sie werden nur bei bekannten
substantivierten Adjektiven und Begleitern wie `Angestellte(n)` oder `eine(n)`
umgewandelt. Ein Binnen-I im Singular steckt oft in Produktnamen („PlugIn“);
dort werden unbekannte Wörter nur auf „-er“ umgewandelt.

Die Partizipregel (abschaltbar) wandelt 31 neutrale Partizipien in die
entsprechende Personenbezeichnung um, etwa `Studierende` → „Studenten“,
`die Mitarbeitenden` → „die Mitarbeiter“, `dem Teilnehmenden` → „dem
Teilnehmer“, auch in Zusammensetzungen wie `Kursteilnehmende`. Diese Liste ist
bewusst ausgewählt und nicht aus Daten abgeleitet: Eine allgemeine Regel
„-ende“ → „-er“ würde „Blutende“ zu „Bluter“, „Führende“ zu „Führer“ und „das
Entscheidende“ zu „das Entscheider“ machen. Die gebeugten Formen kommen aus dem
Wörterbuch. Weibliche Singular-Kontexte wie „die Studierende“ oder „einer
Studierenden“ bleiben stehen. **Partizipien können eine andere Bedeutung
haben**: Ein Lehrender ist nicht zwangsläufig ein Lehrer.

Keine vollständige Grammatikgarantie: Genitive im Singular („des Lehrer*in“),
Adjektive vor dem Nomen („die neue Lehrer:in“) und mehrdeutige Satzkontexte
werden nicht umfassend umformuliert. Der Dativ Plural wird nur aus einfachen
benachbarten Hinweisen wie „mit den“ oder „den“ abgeleitet. Über mehrere
HTML-Textknoten verteilte Wörter bleiben unverändert.

Weitere Grenzen:

- Eingabefelder, Editoren, Code, SVG, MathML, `translate="no"` und Elemente mit
  `data-entgendert-ignore` werden ausgelassen. Bereiche mit explizit anderer
  Sprache als Deutsch ebenfalls; Seiten ohne Sprachangabe werden verarbeitet.
- Attribute wie `href`, `title` und `aria-label` bleiben unverändert. Sichtbare
  HTTP(S)-URLs und E-Mail-Adressen werden ebenfalls ausgelassen.
- Kein Zugriff auf Browser-Systemseiten, geschützte Store-Seiten, PDF-Viewer,
  Shadow DOM oder eingebettete Frames. Es wird nur das Hauptdokument verarbeitet.
- Einzelne Textknoten über 50.000 Zeichen bleiben aus Performancegründen stehen.
- Websites mit komplexen Editoren oder Frameworks können Sonderfälle enthalten;
  dort lässt sich Entgendert pro Website deaktivieren.

## Performance und Technik

Manifest V3 mit isoliertem Content-Script; kein dauerhaft laufender
Hintergrundprozess. Ein `MutationObserver` meldet neue und geänderte Inhalte.
Die Warteschlange wird in Portionen von höchstens 500 Textknoten und einem
Zeitbudget von ungefähr 6 ms abgearbeitet; eine einzelne Textersetzung kann
dieses Budget überschreiten. Bei großen Änderungswellen wird die Warteschlange
begrenzt und ein gemeinsamer Durchlauf eingeplant. Kein regelmäßiges Polling.

Text wird ausschließlich über `Text.data` ersetzt, nicht über `innerHTML`.
Elemente und Event-Listener bleiben erhalten. Originale stehen in einer
`WeakMap`; selbst verursachte Ersetzungen werden aus der Beobachtung gefiltert.
Nach dem Ausschalten endet die Beobachtung, sobald die Wiederherstellung
abgeschlossen ist.

```sh
npm ci
npm run check          # Syntax, Textregeln und beide Builds
npm run lint:firefox   # Mozilla-Paketprüfung
npx playwright install chromium
npm run test:browser  # Echte Chromium-Erweiterung, DOM, Popup, Optionen
npm run bench         # Reproduzierbarer Text-Engine-Benchmark
npm run dictionary    # Wörterbuch aus Wiktionary-Daten neu erzeugen (lädt ~20 MB)
npm run package       # ZIP-Dateien für beide Browser
npm run release:verify # Paketinhalt, Icons, Bildmaße und Prüfsummen
```

## Wörterbuch

`extension/dictionary.js` wird von `npm run dictionary` erzeugt und nicht von
Hand bearbeitet. Das Skript lädt eine fest angegebene, per SHA-256 geprüfte
Version von [german-nouns](https://github.com/gambolputty/german-nouns), einer
Auswertung des deutschen Wiktionary, in den Ordner `.cache/`. Daraus ordnet es
jeder weiblichen Form auf „-in“ die männliche Form samt Plural und Dativplural
zu. Zusammensetzungen, die sich aus ihrem letzten Wortteil ergeben, werden
weggelassen. Zum Schluss prüft das Skript jeden Eintrag mit der echten Engine.
Die Erweiterung selbst lädt nichts aus dem Netz.

Die Wörterbuchdaten stammen aus dem [Wiktionary](https://de.wiktionary.org)
und stehen unter [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/);
`extension/dictionary.js` ist ein bearbeiteter Auszug unter derselben Lizenz.
Der übrige Code steht unter der MIT-Lizenz.

Benchmark-Ergebnisse hängen von Gerät und Laufzeit ab. Sie messen die reine
Text-Engine, nicht die Reaktionszeit beliebiger Webseiten. Die Browser-Tests
prüfen auch einen Schub mit 2.500 neuen Textknoten.

## Auf GitHub veröffentlichen

README, MIT-Lizenz, [Datenschutzhinweise](PRIVACY.md),
[Beitragsanleitung](CONTRIBUTING.md), Tests und eine GitHub-Actions-Prüfung
sind enthalten. Quellcode und `package-lock.json` versionieren; `node_modules`,
lokale Profile und generierte Build-Verzeichnisse sind ausgeschlossen.
Die CI erstellt ZIP-Artefakte, veröffentlicht jedoch nicht automatisch.

Für ein Release die geprüften Dateien aus `artifacts/` als Release-Anhänge
verwenden. [Store-Anleitung](store/README.md), Icons, Werbegrafiken, echte
Vorher-/Nachher-Screenshots, fertige Einreichungstexte und eine statische
Datenschutzseite sind enthalten. `npm run test:firefox` prüft die echte
Erweiterung mit Firefox und geckodriver in einem temporären Profil.

Die Datenschutzseite unter `docs/privacy.html` lässt sich über GitHub Pages
veröffentlichen. Das Repository und die erzeugten Pakete sind noch keine
Veröffentlichung in einem Browser-Store; Kontoeinrichtung, öffentliches Hosting
der Datenschutzhinweise und Einreichung bleiben separate Schritte.

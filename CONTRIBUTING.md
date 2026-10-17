# Beitragen

Voraussetzung: Node.js 22 oder neuer, npm und Git.

```sh
npm ci
npm run check
npm run lint:firefox
npx playwright install chromium
npm run test:browser
npm run bench
```

Mit vorhandenem Chromium unter Linux:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

`extension/dictionary.js` wird mit `npm run dictionary` aus Wiktionary-Daten
erzeugt und nicht von Hand bearbeitet. Fehlt ein Wort oder ist eine Form falsch,
am besten den Eintrag im [Wiktionary](https://de.wiktionary.org) ergänzen und
die Datenquelle in `scripts/build-dictionary.js` aktualisieren; Regeländerungen
gehören in `extension/engine.js`. Bitte mindestens einen positiven Test und einen
ähnlichen Fall, der unverändert bleiben muss, in `tests/engine.test.js`
hinzufügen. Keine pauschale Entfernung von `innen`: Sie beschädigt reguläre
Wörter und ignoriert Flexionen.

Bei Fehlerberichten bitte Ausgangstext, tatsächliches und erwartetes Ergebnis,
Browser-Version und die aktivierten Optionen angeben. Vertrauliche Texte vorab
anonymisieren. Für DOM-Probleme möglichst ein kleines HTML-Beispiel ergänzen.

Die Browser-Tests laden das echte Chrome-Paket in ein temporäres, isoliertes
Profil. `npm run test:firefox` installiert das echte Firefox-Add-on in ein
Wegwerfprofil und prüft es über geckodriver. Details zu Browserpfaden und
Voraussetzungen stehen in `store/README.md`. `lint:firefox` prüft das Paket
zusätzlich statisch. Die GitHub-CI führt zunächst die Chromium-Tests aus;
den Firefox-Test vor Releases separat ausführen.

Vor einem Release Versionsnummern in `package.json` und
`extension/manifest.json` gemeinsam erhöhen, Lockfile mit `npm install`
aktualisieren und alle Prüfungen ausführen. ZIP-Dateien entstehen mit
`npm run package` in `artifacts/`. Die GitHub-Aktion erzeugt diese ebenfalls,
veröffentlicht aber kein Release und lädt nichts in Browser-Stores hoch.

Store-Materialien: `store/README.md` enthält die Upload-Zuordnung, fertige Texte
und Anweisungen zur Datenschutzseite. `npm run store:assets` erzeugt Icons und
echte Screenshots neu; `npm run privacy:build` baut die Datenschutz-HTML-Seite
aus `PRIVACY.md`. Nach dem Paketieren prüft `npm run release:verify` unter
anderem Bildmaße, eingebundene Icons, Paketversionen und enthaltenen Quellcode.

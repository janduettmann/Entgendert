# Entgendert im Store einreichen

## Dateien für den Upload

Alles zusammen: `artifacts/entgendert-<version>-store-kit.zip`. Dieses Archiv zuerst
entpacken; im Store ausschließlich das jeweilige enthaltene Browser-ZIP
hochladen, nicht das gesamte Store-Kit. Die folgenden Pfade beziehen sich auf
das Repository; im Store-Kit liegen die Browser-ZIPs unter `chrome/` und
`firefox/`, die Icons unter `icons/` und die Datenschutzseite als `privacy.html`.
`<version>` ist die Version aus `extension/manifest.json`, zurzeit 0.3.0.

| Zweck | Datei |
| --- | --- |
| Chrome-Erweiterung | `artifacts/chrome/entgendert-<version>-chrome.zip` |
| Firefox-Erweiterung | `artifacts/firefox/entgendert-<version>-firefox.zip` |
| Quellcode für Reviewer (bei Mozilla mit hochladen, weil `dictionary.js` erzeugt wird) | `artifacts/entgendert-<version>-source.zip` |
| Chrome-Icon / allgemeines Store-Icon | `extension/icons/icon-128.png` |
| Zusätzliches großes Icon | `extension/icons/icon-256.png` |
| Chrome-Werbegrafik, 440 × 280 | `store/images/promo-440x280.png` |
| Optionale große Werbegrafik, 1400 × 560 | `store/images/marquee-1400x560.png` |
| Screenshot 1, 1280 × 800 | `store/images/02-entgendert-1280x800.png` |
| Screenshot 2, 1280 × 800 | `store/images/01-original-1280x800.png` |
| Texte zum Kopieren | `store/listing-de.md` |
| Testhinweise für Reviewer | `store/reviewer-notes.md` |
| Öffentliche Datenschutzseite | `docs/privacy.html` |

Die Screenshots zeigen eine gekennzeichnete fiktive Demoseite mit der echten
Erweiterung in Chromium. Screenshot 1 zeigt die aktivierte Leseansicht,
Screenshot 2 die über das echte Popup deaktivierte Erweiterung. Für Firefox
können sie dieselbe Funktion illustrieren; sie sind keine Firefox-Aufnahmen.
`popup.png` ist nur eine zusätzliche Aufnahme der direkt geöffneten Popup-Seite,
kein Screenshot im Store-Format. Sie hat ohne Toolbar-Klick keine temporäre
Berechtigung für die Website und ist daher nicht für das Listing vorgesehen.

Vorschlag für Bildunterschriften:

- Screenshot 1: „Entgendert aktiviert: bekannte Genderformen werden lokal vereinfacht. Eingabefelder bleiben unverändert.“
- Screenshot 2: „Originalansicht derselben Demoseite nach dem Ausschalten von Entgendert.“

## Vorbereiten und prüfen

```sh
npm ci
npm run check
npm run lint:firefox
npx playwright install chromium
npm run test:browser
npm run privacy:build
npm run package
npm run release:verify
```

Der Firefox-Funktionstest benötigt zusätzlich Firefox und geckodriver:

```sh
FIREFOX_PATH=/pfad/zu/firefox GECKODRIVER_PATH=/pfad/zu/geckodriver npm run test:firefox
```

Alternativ kann mit `npx playwright install firefox` ein separater Testbrowser
geladen werden; ohne `FIREFOX_PATH` verwendet der Test diesen Browser. Der Test
installiert das echte Add-on temporär in ein Wegwerfprofil. Das Ergebnis steht
in `artifacts/firefox-test-report.json`. Es ist kein Test jeder unterstützten
Firefox-Version und kein Android-Test.

Bei Änderungen am Design:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run store:assets
```

`CHROMIUM_PATH` ist optional, wenn der Playwright-Chromium installiert wurde.
Alle Bilder werden aus `assets/logo.svg`, `store/promo.html` und der realen
Erweiterung erzeugt. Neue Icons/Screenshots anschließend mit versionieren.

## Datenschutzseite veröffentlichen

1. Quellcode einschließlich `docs/privacy.html` im öffentlichen GitHub-Repository
   veröffentlichen. `PRIVACY.md` ist die Textquelle; nach Änderungen
   `npm run privacy:build` ausführen.
2. In GitHub unter **Settings → Pages → Build and deployment** die Quelle
   **Deploy from a branch**, Branch `main`, Ordner `/docs` auswählen.
3. Nach dem erfolgreichen Pages-Deployment
   `https://janduettmann.github.io/Entgendert/privacy.html` ohne Anmeldung öffnen.
4. Erst die tatsächlich erreichbare Adresse in den Stores eintragen.

Alternativ den öffentlich erreichbaren GitHub-Link zur `PRIVACY.md` verwenden.
Das Erzeugen der HTML-Datei veröffentlicht sie noch nicht. GitHub-Push,
Pages-Aktivierung und Store-Einreichung sind separate Schritte.

## Chrome

1. Entwicklerkonto im [Chrome-Dashboard](https://chrome.google.com/webstore/devconsole)
   einrichten, Kontaktadresse bestätigen und die angezeigte Registrierungsgebühr
   bezahlen. Erforderliche Kontosicherheits- und Profilangaben vervollständigen.
2. Neues Element anlegen und ausschließlich das Chrome-ZIP hochladen.
3. Texte aus `listing-de.md` übernehmen, Bilder hochladen und Datenschutz-Link
   sowie Begründungen für Berechtigungen eintragen.
4. Falls ein Quellcode-/Testfeld angeboten wird, `reviewer-notes.md` verwenden.
5. Sichtbarkeit auswählen und zur Prüfung einreichen.

## Firefox

1. Im [Mozilla Developer Hub](https://addons.mozilla.org/de/developers/) anmelden.
2. Neues Add-on einreichen, **Auf dieser Website / On this site** wählen.
3. Firefox-ZIP hochladen, Validierung prüfen und zunächst Desktop-Plattformen
   auswählen. Keine Android-Unterstützung allein aus dem Desktop-Test ableiten.
4. Beschreibung, Support-Website, Icons/Screenshots, Datenschutzhinweise und
   MIT-Lizenz eintragen. Für den lesbaren Paketcode ist normalerweise kein
   zusätzlicher Quellcode nötig; falls verlangt, das Source-ZIP verwenden.
5. Reviewer-Hinweise übernehmen und einreichen. Die feste Add-on-ID
   `entgendert@jandu.github` nach der ersten Einreichung beibehalten.

Das Add-on nach der Einreichung nicht löschen: AMO gibt die IDs gelöschter
Add-ons nie wieder frei, ein erneuter Upload scheitert dann mit „Doppelte
Add-on-ID gefunden“.

## Was der Kontoinhaber noch selbst ausfüllt

Kontakt-E-Mail, gegebenenfalls Identitäts-/Herausgeberangaben, die im Dashboard
geforderten Erklärungen und die gewählte Sichtbarkeit. Diese Angaben lassen
sich nicht aus dem Quellcode ableiten. Die Support-Website ist bereits auf das
GitHub-Projekt eingestellt. Verfügbarkeit der Store-Namen/Add-on-ID wird erst
bei der Einreichung bestätigt.

## Spätere Updates

`version` in `package.json` und `extension/manifest.json` erhöhen, Lockfile mit
`npm install` aktualisieren, neu prüfen und paketieren. Das neue ZIP jeweils
beim bestehenden Store-Eintrag hochladen, keinen zweiten Eintrag anlegen.

## Offizielle Referenzen

- [Chrome: Bilder und Abmessungen](https://developer.chrome.com/docs/webstore/images)
- [Chrome: Veröffentlichung](https://developer.chrome.com/docs/webstore/publish)
- [Mozilla: Add-on einreichen](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)
- [Mozilla: Quellcode-Anforderungen](https://extensionworkshop.com/documentation/publish/source-code-submission/)

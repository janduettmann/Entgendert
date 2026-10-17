# Prüfstand für Entgendert 0.3.0

Lokal geprüft am 17. Oktober 2026:

- Text-Engine: 326 Tests erfolgreich, einschließlich Wörterbuchformen,
  Artikeln und Pronomen, Paarformen, Endungsregeln, Partizipien und
  unveränderter Gegenbeispiele. Beim Erzeugen des Wörterbuchs wird jeder
  Eintrag gegen die Engine geprüft.
- Chromium 152.0.7977.82: neun Tests mit der tatsächlich installierten
  Erweiterung erfolgreich; Wörterbuchformen, DOM-Erhalt, geschützte Inhalte,
  dynamische Updates, Wiederherstellung, Optionen, gesperrte Einstellungen im
  ausgeschalteten Zustand, Wortzähler mit Live-Aktualisierung und ein Schub
  von 2.500 Textknoten.
- Firefox 146.0.1 (Playwright-Testbrowser), geckodriver 0.36.0 und 0.37.1: acht
  Prüfungen mit dem tatsächlich temporär installierten Add-on erfolgreich;
  Textregeln, Wörterbuchformen und Artikel, geschützte Inhalte, dynamische
  Texte/Trennzeichen, Wortzähler, gesperrte Einstellungen, Popup-Aus-/Einschalten
  sowie über einen Reload persistierende Website-Ausnahme.
- Mozilla addons-linter: keine Fehler, Warnungen oder Hinweise.
- Paketprüfung: Manifest-Versionen, Ressourcen, aktuelle Quelldateien,
  PNG-Abmessungen, Icon-Verweise, Lizenz und Quellcodearchiv geprüft.
- Store-Grafiken, das Popup in hellem und dunklem Modus und die aktivierte
  Leseansicht visuell kontrolliert.

Das belegt die aufgeführten Fälle in diesen Browser-Versionen. Es ist keine
Garantie für jede Website, jede deutsche Formulierung, ältere unterstützte
Browser-Versionen oder Android. Die automatisierten Popup-Tests öffnen die
Erweiterungsseite direkt; ein echter Toolbar-Klick und das Betriebssystem-UI
sind damit nicht vollständig abgedeckt. Die Firefox-Tests benötigen für den
Zugriff auf die Erweiterungsseite UI-Automatisierung im isolierten Testprofil.

Vor einem Release nach weiteren Änderungen die betroffenen Prüfungen erneut
ausführen. Die ausführbaren Befehle stehen in `store/README.md`.

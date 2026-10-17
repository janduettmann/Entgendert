# Prüfstand für Entgendert 0.1.0

Lokal geprüft am 13. Oktober 2026:

- Text-Engine: 74 Tests erfolgreich, einschließlich Schreibvarianten,
  Flexionen und unveränderter Gegenbeispiele.
- Chromium 152.0.7977.82: sieben Tests mit der tatsächlich installierten
  Erweiterung erfolgreich; DOM-Erhalt, geschützte Inhalte, dynamische Updates,
  Wiederherstellung, Optionen und ein Schub von 2.500 Textknoten.
- Firefox 157.0 (Playwright-Testbrowser), geckodriver 0.36.0: sechs Prüfungen mit
  dem tatsächlich temporär installierten Add-on erfolgreich; Textregeln,
  geschützte Inhalte, dynamische Texte/Trennzeichen, Popup-Aus-/Einschalten
  sowie über einen Reload persistierende Website-Ausnahme.
- Mozilla addons-linter: keine Fehler, Warnungen oder Hinweise.
- Paketprüfung: Manifest-Versionen, Ressourcen, aktuelle Quelldateien,
  PNG-Abmessungen, Icon-Verweise, Lizenz und Quellcodearchiv geprüft.
- Store-Grafiken und die aktivierte Leseansicht visuell kontrolliert.

Das belegt die aufgeführten Fälle in diesen Browser-Versionen. Es ist keine
Garantie für jede Website, jede deutsche Formulierung, ältere unterstützte
Browser-Versionen oder Android. Die automatisierten Popup-Tests öffnen die
Erweiterungsseite direkt; ein echter Toolbar-Klick und das Betriebssystem-UI
sind damit nicht vollständig abgedeckt. Die Firefox-Tests benötigen für den
Zugriff auf die Erweiterungsseite UI-Automatisierung im isolierten Testprofil.

Vor einem Release nach weiteren Änderungen die betroffenen Prüfungen erneut
ausführen. Die ausführbaren Befehle stehen in `store/README.md`.

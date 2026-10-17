# Fertige Store-Texte

Die folgenden Texte beziehen sich auf Version 0.1.0. Titel und Kurzbeschreibung
können in beiden Stores verwendet werden. Bei abweichenden Formularbezeichnungen
die inhaltlich passenden Felder auswählen.

## Titel

Entgendert – Genderformen lokal vereinfachen

## Kurzbeschreibung

Vereinfacht bekannte Genderformen auf Webseiten. Lokal, abschaltbar und ohne Datenübertragung.

## Ausführliche Beschreibung

Entgendert ist deine persönliche Leseansicht für deutsche Webseiten. Die
Erweiterung wandelt bekannte Genderformen lokal im Browser in das generische
Maskulinum um.

Beispiele:

- Lehrer:innen → Lehrer
- Student_innen → Studenten
- Ärzt*innen → Ärzte
- mit den Paketzusteller*innen → mit den Paketzustellern
- ein*e Kolleg*in → ein Kollege
- der*die Vorsitzende → der Vorsitzende
- Lehrerinnen und Lehrer → Lehrer
- die Mitarbeitenden → die Mitarbeiter

Du entscheidest, welche Regeln aktiv sind: Paarformen und ausgewählte
Partizipformen lassen sich einzeln abschalten. Entgendert kann außerdem global
oder für einzelne Websites pausiert werden. Beim Abschalten werden die
Originaltexte wiederhergestellt, soweit die Website sie nicht zwischenzeitlich
selbst verändert hat.

Entgendert verarbeitet auch nachgeladene Texte. Eingabefelder, bearbeitbare
Bereiche und Code werden ausgelassen. Es gibt keine KI-API, keine Telemetrie
und keine Datenübertragung durch die Erweiterung. Einstellungen und
deaktivierte Hostnamen werden ausschließlich lokal gespeichert.

Grenzen transparent erklärt: Die Erkennung basiert auf einem Wörterbuch mit
rund 4.500 Personenbezeichnungen aus Wiktionary und daraus gelernten Regeln für
Zusammensetzungen und Wortendungen. Artikel wie „der*die“ oder „ein*e“ werden
angepasst. Unsichere Fälle bleiben unverändert. Es handelt sich
nicht um eine vollständige deutsche Grammatikprüfung; Artikel und Satzbau
werden nicht umfassend angepasst. Die optionalen Partizip-Ersetzungen können
die Bedeutung verändern. Browser-Systemseiten, PDF-Viewer, eingebettete Frames
und Shadow DOM werden nicht verarbeitet.

Nach der Installation bereits geöffnete Webseiten einmal neu laden.
Quelloffen unter der MIT-Lizenz; Wörterbuchdaten aus Wiktionary unter CC BY-SA 4.0.

## Zweck der Erweiterung / Single purpose

Entgendert bietet eine persönliche Leseansicht, indem bekannte deutsche
Genderformen auf Webseiten lokal und regelbasiert vereinfacht werden.

## Begründung: storage

Speichert den Aktivierungsstatus, Regeloptionen und vom Nutzer deaktivierte
Hostnamen im lokalen Browserprofil. Kein Cloud-Sync und keine Übertragung.

## Begründung: activeTab

Erkennt beim Öffnen des Popups die aktuelle Website, um Entgendert für deren
Hostnamen ein- oder auszuschalten, den Verarbeitungsstatus und die Zahl der
ersetzten Wörter auf dieser Seite anzuzeigen.

## Begründung: Zugriff auf HTTP- und HTTPS-Seiten / Content-Scripts

Die Kernfunktion liest und verändert Textknoten auf geöffneten HTTP- und
HTTPS-Webseiten. Die Verarbeitung erfolgt automatisch und vollständig lokal,
einschließlich nachgeladener Texte. Eingabefelder und bearbeitbare Bereiche
werden ausgelassen. Dieser Zugriff ist für die Leseansicht erforderlich.

## Remote Code

Es wird kein extern gehosteter Programmcode ausgeführt. JavaScript, CSS und
Bilder befinden sich vollständig im Erweiterungspaket.

## Datenschutzangaben

Die Erweiterung sammelt oder überträgt keine Nutzerdaten an den Entwickler
oder Dritte. Seitentexte werden lokal verarbeitet. Einstellungen und
deaktivierte Hostnamen bleiben im lokalen Browserprofil. Die Angaben beziehen
sich auf die Erweiterung, nicht auf den Besuch der GitHub-Projektseite.

Im Chrome-Formular die Datenkategorien anhand der dortigen Definitionen
beantworten; keine Serverübertragung, Analyse oder Weitergabe behaupten, die
der Code nicht ausführt. Die Datenschutzhinweise vollständig lesen und die
geforderten Erklärungen als Kontoinhaber selbst bestätigen.

## Links

- Projekt-Website: https://github.com/janduettmann/Entgendert
- Support-Website: https://github.com/janduettmann/Entgendert/issues
- Datenschutz, nach Aktivierung von GitHub Pages: https://janduettmann.github.io/Entgendert/privacy.html
- Alternative, nach Veröffentlichung der Datei im öffentlichen Repository: https://github.com/janduettmann/Entgendert/blob/main/PRIVACY.md

Die Datenschutz-Links sind vorbereitete Zieladressen. Vor der Einreichung
öffentlich erreichbar machen und ohne Anmeldung öffnen. Keine noch nicht
erreichbare Adresse ins Store-Formular übernehmen.

## Weitere Formularfelder

- Standardsprache: Deutsch / de
- Kategorie: die im jeweiligen Store angebotene Kategorie für Lesehilfen,
  Barrierefreiheit oder Produktivität wählen
- Lizenz bei Mozilla: MIT
- Unterstützte Plattformen: zunächst Desktop; keine Android-Kompatibilität
  behaupten, solange diese nicht getestet wurde
- Support-E-Mail und Herausgeberprofil: mit den eigenen, erreichbaren und
  bestätigten Kontaktdaten ausfüllen

## Versionshinweise 0.1.0

Erste Veröffentlichung. Lokale Umwandlung bekannter Genderformen, optionale
Paar- und Partizipregeln, Website-Ausnahmen und Wiederherstellung der
Originaltexte. Unterstützt dynamisch nachgeladene Seiteninhalte.

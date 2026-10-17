# Datenschutz

Entgendert verarbeitet Seitentexte ausschließlich lokal im Browser. Die
Erweiterung enthält keine Analysewerkzeuge, Werbung, Telemetrie, externen
Dienste oder Netzwerkaufrufe. Weder Texte noch besuchte URLs werden übertragen.

Globaler Aktivierungsstatus, die beiden Regeloptionen und die manuell
deaktivierten Hostnamen werden über `storage.local` im lokalen Browserprofil
gespeichert. Diese Daten werden nicht über `storage.sync` synchronisiert.

Originaltexte veränderter Textknoten werden vorübergehend im Arbeitsspeicher
gehalten, um die Ansicht zurücksetzen zu können. Entfernte DOM-Knoten werden
durch die Speicherung in einer `WeakMap` nicht dauerhaft festgehalten.

`activeTab` erlaubt dem Popup, nach dem Anklicken das aktuelle Tab zu erkennen
und den Schalter für dessen Website anzuzeigen. Das Content-Script läuft auf
HTTP- und HTTPS-Seiten, damit die Leseansicht automatisch funktioniert. Die
Erweiterung benötigt deshalb Zugriff auf deren Seiteninhalte.

Die Leseansicht ändert Textknoten im DOM. Wie jede solche DOM-Änderung kann sie
von Skripten der geöffneten Website wahrgenommen werden. Entgendert sendet diese
Änderungen selbst an keinen Server.

Beim Deinstallieren entfernt der Browser die gespeicherten Einstellungen.
Bereits geöffnete Seiten bei Bedarf neu laden, um die Originalansicht zu erhalten.

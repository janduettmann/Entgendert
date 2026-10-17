# Reviewer notes (Chrome and Firefox)

Entgendert provides a local, rule-based reading view for German web pages.
There are no accounts, subscriptions, external APIs, remote code, analytics,
or extension-originated network requests. No credentials are required.

The content script runs in the top-level document on HTTP/HTTPS pages and
modifies text nodes only. Original text is retained in a WeakMap for restoring
the view. Inputs, editable areas, code blocks, explicit non-German language
regions, and opted-out elements are excluded. Settings and user-selected host
exceptions are stored in storage.local. activeTab is used by the popup for the
current website control.

## Reproduce

1. Install the browser-specific package.
2. Start the included fixture server from the source checkout:
   `node tests/server.js`.
3. Open `http://127.0.0.1:4173` after installation. If prompted, allow the
   extension access to this page.
4. The first paragraph changes from “Lehrer:innen treffen Student*innen und
   Studierende.” to “Lehrer treffen Studenten und Studenten.”
5. The textarea, input, editable block, code block, and English language block
   retain their original text.
6. Open Entgendert using its actual toolbar button. Turn the global switch off:
   the original wording returns. Turn it back on: the reading view returns.
7. Disable the current website. Reload the page: original wording remains.
   Re-enable the site, then verify the pair and participle switches separately.
8. Dynamic example, from the page developer console:
   `document.getElementById('dynamic').textContent = 'Mit den Paketzusteller*innen sprechen.'`
   With the extension enabled, this becomes “Mit den Paketzustellern sprechen.”

## Source and build

The package contains readable, unminified JavaScript with no runtime libraries.
No transpilation or JavaScript bundling occurs. The build copies the extension
files and creates a browser-specific manifest; icons are included as PNGs.
The Chrome manifest omits Firefox-specific metadata.

`dictionary.js` is generated data, not code: `npm run dictionary`
(`scripts/build-dictionary.js`) derives it from a pinned, SHA-256-verified CSV
of the german-nouns project (German Wiktionary, CC BY-SA 4.0) and checks every
entry against the engine. It is committed, so building the extension needs no
download.

With Node.js 22 or newer:

```sh
npm ci
npm run check
npm run lint:firefox
npm run package
```

The included source archive contains the source, lockfile, scripts and tests.
The PNGs are committed source assets, so rebuilding an extension package does
not require a browser or image-generation service. Asset regeneration is
optional and uses Playwright/Chromium (`npm run store:assets`).

## Limitations

The dictionary covers about 4,500 person nouns. Unknown compounds use their
last known part, and unknown marked words ending in "-er" are treated as
regular; other unknown words are intentionally left alone. This is not a full German grammar engine; participle substitutions can
change meaning and are separately configurable. Frames, shadow DOM, browser
pages and PDF viewers are not processed. Individual text nodes over 50,000
characters are skipped to limit main-thread work.

# Eksport av how-to-scenene til MP4 + poster

To veier til de samme 36 filene. Begge rendrer de eksisterende scenene fra
`animations.jsx` + `howto-scenes.jsx` og steppes med motorens egen
`data-om-seek-to-time-frame`-protokoll. Ingenting i scenene er endret.

## 1. Terminal (anbefalt — gir garantert riktig fil)

Krav: Node 18+, `ffmpeg` på PATH.

```bash
npm i playwright && npx playwright install chromium
node export/export-videos.mjs            # alle 18
node export/export-videos.mjs loop       # bare ett tema
```

Filene havner i `videos/` med navnene `howto-<tema>-<sprak>.mp4` og
`howto-<tema>-<sprak>.jpg`. Skriptet skriver ut størrelse per fil, totalen,
og PSNR mellom første og siste ramme for «loop»-scenen.

Spesifikasjonen skriptet bruker:

| krav | verdi |
|---|---|
| oppløsning | 1920 × 1080 (deviceScaleFactor 1,5 over 1280 × 720-scenen → vektorskarp tekst) |
| bildefrekvens | 30 fps konstant (`-r 30`, én skjermdump per ramme) |
| kodek | libx264, Main profile, level 4.0, `yuv420p` |
| bitrate | `min(2,3 Mbps, 3,7 MB × 8 / varighet)` — 34 s-klippet får ~870 kbps for å holde 4 MB-taket |
| faststart | `-movflags +faststart` |
| lyd | `-an` (scenene er stumme) |
| nøkkelrammer | hver 2. sekund |
| poster | rammen 15 % inn i klippet, JPG, kvalitet trappes ned til ≤ 250 kB |
| første ramme | samples 0,55 s inn (etter innfaden) så ramme 1 aldri er svart |

## 2. Nettleser (`Video Exporter.dc.html`)

Samme pipeline i WebCodecs + en MP4-mukser uten avhengigheter
(`exporter-core.js`), som laster ned alt som én zip med `videos/`-mappa ferdig
navngitt. Åpne siden fra et ekte origin — `python3 -m http.server` i
prosjektmappa, så `http://localhost:8000/Video%20Exporter.dc.html` — i Chrome
eller Edge.

Den fungerer **ikke** i forhåndsvisningen her: siden kjører på et opaque
origin, og da forurenses canvasen av `foreignObject`-rendringen, slik at
pikslene ikke kan leses tilbake (`getImageData`/`VideoFrame` blokkeres).
På localhost er den restriksjonen borte.

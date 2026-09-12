# MIRACLE ARENA

Action RPG mobile isometrico in landscape. Questa branch introduce il primo renderer 3D reale di The Yard, mantenendo il gameplay già presente.

## Avvio
Servire `dist/` via HTTP (per esempio `python3 -m http.server 8000 --directory dist`) e aprire l'indirizzo nel browser. I moduli JavaScript richiedono HTTP.

## Contenuto implementato
- Renderer 3D WebGL con Three.js, camera prospettica/isometrica, luci dinamiche, nebbia, ombre, particelle e ambiente The Yard.
- Personaggi 3D procedurali per Boxer, Wrestler, avversari e boss The Gatekeeper.
- Animazioni base di movimento, colpo, telegraph nemico e feedback dei danni.
- Tre scontri progressivi e boss The Gatekeeper.
- Joystick multitouch, attacco continuo, schivata con invulnerabilità e abilità.
- HUD salute/Momentum, pausa automatica, progressione e allenamento.
- Salvataggio locale di stile, livello e reputazione.
- Controlli desktop: WASD/frecce, J attacco, E abilità, spazio schivata, Esc pausa.

## Stato qualità
Questa è una vertical-slice tecnica 3D, non ancora il prodotto commerciale finale. La base gameplay è funzionante e i test automatici del motore passano. Restano da validare in modo diretto su iPhone/Safari le prestazioni WebGL, il layout touch e la fluidità su dispositivo reale.

## Verifica
`node --test tests/engine.test.mjs`

Copre cooldown, skill energy, schivata/invulnerabilità, vittoria/sconfitta, boss, progressione, salvataggio e limiti di movimento.

## Direzione consolidata
Action RPG Combat; hub The Yard; Academy/clan; Combat Mastery; Fight DNA; Warrior Mind; Legacy; Reputation; Adaptive AI; The Coach; The Arena Remembers.

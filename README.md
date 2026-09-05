# MIRACLE ARENA

Action RPG mobile, isometrico e solo landscape. Primo prototipo tecnico web eseguibile senza dipendenze, pensato per verificare il combattimento su iPhone/iPad.

## Avvio
Servire `dist/` via HTTP (per esempio `python3 -m http.server 8000 --directory dist`) e aprire l'indirizzo nel browser. I moduli JavaScript richiedono HTTP: non aprire index.html con file://.

## Contenuto implementato
- The Yard, Boxer e Wrestler con velocità, colpi e abilità differenti.
- Tre scontri progressivi e boss The Gatekeeper.
- Joystick multitouch a sinistra, attacco continuo, schivata con invulnerabilità e abilità a destra.
- Attacchi nemici anticipati da un indicatore, HUD salute/Momentum, pausa automatica quando la pagina perde visibilità.
- Allenamento tra scontri: 40 reputazione per livello, salute e danno aumentano.
- Salvataggio locale di stile, livello e reputazione; audio sintetizzato attivabile.
- Computer: WASD/frecce, J attacco, E abilità, spazio schivata, Esc pausa.

## Limiti espliciti
Demo tecnica breve, non ancora la vertical slice da 20–30 minuti. Grafica geometrica provvisoria: non rappresenta la qualità realistica finale. Il Wrestler usa per ora danno ad area e interruzione, non una simulazione di prese. Nessun multiplayer, backend, account o sincronizzazione dei salvataggi. Nessuna build iOS nativa. I progressi restano nel browser e si perdono cancellandone i dati.

## Direzione consolidata
Action RPG Combat; hub The Yard; Academy/clan; Combat Mastery; Fight DNA; Warrior Mind; Legacy; Reputation; Adaptive AI; The Coach; The Arena Remembers. Questi sistemi, salvo la reputazione di base e l'allenamento, sono obiettivi futuri e non sono implementati nella demo.

## Verifica
`node --test tests/engine.test.mjs`

Controlli automatici su combattimento, schivata, cooldown, progressione e boss. Compatibilità reale Safari/iOS e bilanciamento da verificare sul dispositivo. Non è stata eseguita una sessione di gioco su iPhone.

# Webnix – Sito statico (HTML + CSS + JS puro)

⚠️ **Tecnologie usate: SOLO HTML5, CSS3 e JavaScript Vanilla. Nessun framework (niente Tailwind), nessun WordPress, nessun altro linguaggio.**

## File del progetto
| File | Ruolo |
|---|---|
| `index.html` | Struttura semantica ID-based, tutte le 8 sezioni del funnel (Problema → Agitazione → Soluzione → Azione) |
| `style.css` | Design system in `:root` con la palette brand estratta (#e81cff, #40c9ff, #0d1117…). Stile prevalentemente via `#id`, responsive desktop+smartphone (breakpoint 900px / 600px) |
| `config.js` | **Unico punto di verità**: Firebase, contatti, social, limiti recensioni (max caratteri uniformato a 1000) |
| `script.js` | Menu mobile, scroll fluido con offset header, filtro portfolio, lettura/invio recensioni Firebase (con fallback locale demo), form contatti → WhatsApp precompilato |

## Immagini richieste (da inserire nelle cartelle create)
- `loghi/WEBNIX.png` — logo header
- `WEBNIX-Logo-Solo-Simbolo-(1).png` — logo footer
- `favicon.ico` (+ eventuali `favicon-96x96.png`, `favicon.svg`, `apple-touch-icon.png`)
- `assets/images/portfolio-*.webp` — 6 immagini portfolio in **WebP** ottimizzate
Finché le immagini mancano, il layout resta integro (le card mostrano lo spazio con fondo brand).

## Recensioni (Firebase Realtime Database)
Struttura dati salvata per ogni recensione:
```json
{ "name": "Mario Rossi", "text": "…", "url": "", "stars": 5, "timestamp": 1762000000000 }
```
1. Compila `firebase:{...}` in `config.js` con le chiavi del tuo progetto.
2. Se i segnaposto non vengono sostituiti, il sito mostra automaticamente 2 recensioni demo locali (senza errori in console) e **non scarica nemmeno l'SDK Firebase** (iniettato da un micro-script solo quando le chiavi sono valide).
3. Il contatore caratteri ora è **coerente: 1000** sia nel codice che nel commento/config.

## Regole d'oro del progetto (vincoli voluti)
- **Solo HTML + CSS + JavaScript vanilla**: niente Tailwind, niente framework, niente build step.
- **Zero classi CSS**: tutto lo stile passa da `#id` (o selettori di struttura/attributo come `[attivo="si"]`, `[nascosto="si"]`, `[stato="ok"]`). Lo stato del menu mobile, dei filtri portfolio, delle stelle e dei feedback è gestito con attributi HTML, mai con `classList`.
- **Responsive by design**: breakpoint 900px (tablet) e 600px (smartphone), menu hamburger, griglie fluide, input a 16px su mobile (anti-zoom iOS).

## Social uniformati
Instagram è **`https://www.instagram.com/webnix.it`** ovunque (JSON-LD, footer, config.js) — risolta l'incoerenza con `webnix_italia`.

## Deploy
Hosting statico consigliato: **Netlify** o **GitHub Pages** (trascina la cartella / pusha il repo: funziona così com'è).

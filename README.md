# Webnix – Digital Agency

Sito vetrina **100% statico**: solo **HTML5 + CSS vanilla + JavaScript puro**.
Nessun framework, nessun build step, nessuna dipendenza (unica eccezione: Font Awesome via CDN per le icone, marker tecnici `fa-solid`/`fa-brands`).

**Palette brand:** `#e81cff` (viola neon) → `#40c9ff` (ciano neon) su `#0d1117`.
Design system centralizzato in `:root` dentro `style.css`.

---

## Struttura del progetto

```
.
├── index.html          # Home: funnel Hero→Problema→Soluzione→Come Funziona→Servizi→Portfolio→Recensioni→Contatti→CTA→Footer
├── servizi.html        # Dettaglio pacchetti (include/esclude trasparenti)
├── faq.html            # Accordion nativo <details>/<summary>
├── assistenza.html     # Pacchetti post-lancio + stato servizio + canali
├── chi-siamo.html      # Storia e valori
├── contatti.html       # Modulo funzionante (→ WhatsApp precompilato)
├── admin.html          # Area riservata (demo; in prod usare Firebase Auth)
├── style.css           # Design system :root + tutto lo stile (solo #id e attributi)
├── script.js           # Loader, menu, reveal scroll, filtri, recensioni, form→WhatsApp
├── config.js           # UNICO PUNTO DI VERITÀ: Firebase, contatti, social, limiti
├── loghi/
│   ├── WEBNIX.png          # Wordmark gradiente brand, sfondo trasparente
│   └── WEBNIX-Simbolo.png  # Simbolo circolare per footer
└── assets/images/          # Placeholder portfolio (sostituire con screenshot reali .webp)
```

## Regole architetturali (vincolanti)

- **Zero classi proprie**: ogni stile aggancia a `#id` o a selettori di struttura/attributo
  (`[aperto="si"]`, `[attivo="si"]`, `[visible="si"]`, `[piena="si"]`, `[stato="ok"]`, `[nascosto="si"]`,
  `[pagina-corrente="si"]`, `[menu-aperto="si"]`, `[reveal="si"]`, `data-filtro`, `data-categoria`, `data-lista`).
  Uniche eccezioni: i marker tecnici `fa-*` di Font Awesome.
- Lo stato UI è sempre portato da **attributi HTML**, mai da `classList`.
- Anti-XSS recensioni: i testi utente entrano nel DOM **solo** con `createElement` + `textContent` (mai `innerHTML`).

## Configurazione Firebase (recensioni reali)

1. Crea un progetto su [Firebase Console](https://console.firebase.google.com/) → **Realtime Database**.
2. In `config.js` sostituisci i segnaposto `LA_TUA_API_KEY` / `IL_TUO_PROGETTO` con le chiavi vere
   (Project settings → Your apps → SDK setup).
3. Regole database consigliate:

```json
{
  "rules": {
    "recensioni": { ".read": true, ".write": true }
  }
}
```

Finché i segnaposto restano invariati, **nessun download esterno** avviene: la sezione recensioni usa il
**fallback demo** (2 recensioni locali + salvataggio in `localStorage`) senza errori in console.
Limite recensione uniformato a **1000 caratteri** (leggi `WEBNIX_CONFIG.recensioni.maxCaratteri`).

## Funzionalità principali

| Funzione | Dove | Note |
|---|---|---|
| Loader globale `#global-loader2` | tutte le 7 pagine | anello `conic-gradient` viola/ciano, barra progresso fino al 100%, dissolvenza + `display:none`, scroll lock, timeout sicurezza 5s, `prefers-reduced-motion` |
| Menu mobile | ≤900px | hamburger → drawer laterale vetro-blur + overlay scuro; chiusura tap-outside/ESC/link; scroll lock; header `fixed` z-index 110 sotto drawer (200) |
| Hero full-bleed | index | `calc(100vh - header)` desktop, `100svh` mobile, gradiente brand −45° |
| `#bottone1` Bozza Gratuita | hero | pillola 280×60, fondo `rgb(31,31,31)`, 3 layer animati bianco→`#17f1d1`→`#008dc7`, delay scalati `cubic-bezier(0.19,1,0.22,1)`, testo scorrevole in hover, stato `[attivo]` touch |
| Reveal allo scroll | tutte | IntersectionObserver one-shot + `[visible="si"]`, 0.8s `cubic-bezier(0.22,1,0.36,1)`, translateY(46px)→0, delay a cascata, fallback senza IO/reduced-motion |
| Filtri portfolio | index | attributi `data-filtro`/`data-categoria`/`[nascosto]` |
| Recensioni | index | Firebase Realtime DB + fallback demo, contatore 1000 caratteri |
| Form → WhatsApp | index + contatti.html | messaggio precompilato con nome, attività, email, telefono |
| Scroll offset | tutte | `scroll-padding-top: 90px` → la CTA `#contatti` non resta sotto l'header fisso |

## Test rapidi

```bash
node --check script.js && node --check config.js   # sintassi JS
python3 -m http.server 8000                          # anteprima locale
```

## Hosting

Essendo 100% statico: Netlify, GitHub Pages o Vercel. Trascina la cartella su Netlify Drop ed è online.

---

© 2026 Webnix – Genova · webnixit@gmail.com · [@webnix.it](https://www.instagram.com/webnix.it)

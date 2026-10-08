/* ============================================================
   WEBNIX – script.js (JavaScript Vanilla puro, nessun framework)
   Funzioni:
   1. Loader globale #global-loader2 (barra di progresso + dissolvenza)
   2. Menu mobile: hamburger → drawer laterale a vetro + overlay
   3. Scroll fluido con offset header fisso + nav "pagina corrente"
   4. Reveal allo scroll: IntersectionObserver one-shot [visible="si"]
   5. Filtri portfolio via attributi data-* / [nascosto="si"]
   6. Recensioni Firebase Realtime DB con fallback demo locale
      (anti-XSS: createElement + textContent, mai innerHTML con dati utenza)
   7. Form contatti → WhatsApp precompilato
   Stato UI sempre tramite ATTRIBUTI HTML ([aperto="si"], [attivo="si"],
   [piena="si"]…): mai classList, per rispettare la regola "zero classi".
   ============================================================ */

"use strict";

(function () {

  /* ------------------------------------------------------------------
     Riferimenti centralizzati (config.js è l'unico punto di verità)
  ------------------------------------------------------------------ */
  const CFG = (typeof WEBNIX_CONFIG !== "undefined") ? WEBNIX_CONFIG : null;
  const firebaseUrl = CFG ? CFG.firebase.databaseURL : "";
  const whatsappBase = CFG ? CFG.contatti.whatsapp.split("?")[0] : "https://wa.me/14132259397";
  const MAX_REV = CFG ? CFG.recensioni.maxCaratteri : 1000;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==================================================================
     1. LOADER GLOBALE (#global-loader2)
     Anello conic-gradient viola/ciano + WEBNIX nel cerchio + barra di
     progresso che arriva al 100%, poi dissolvenza e rimozione dal DOM
     (fix display:none post-dissolvenza). Scroll lock durante il caricamento.
  ================================================================== */
  function initLoader() {
    const loader = document.getElementById("global-loader2");
    if (!loader) return;

    const barra = document.getElementById("loader2-progresso");

    // Scroll lock finché il loader è visibile
    document.body.style.overflow = "hidden";

    let pct = 0;
    let finito = false;

    function chiudi() {
      if (finito) return;
      finito = true;
      clearInterval(tick);
      if (barra) barra.style.width = "100%";
      // Piccolo pause per far vedere il 100%, poi dissolvenza
      setTimeout(function () {
        loader.setAttribute("scomparso", "si");           // opacity → 0
        document.body.style.overflow = "";               // sblocca lo scroll
        setTimeout(function () {
          loader.setAttribute("finito", "si");           // display:none definitivo
        }, reducedMotion ? 0 : 650);                     // dopo la transizione CSS
      }, reducedMotion ? 0 : 250);
    }

    // Riduci animazioni: chiudi subito
    if (reducedMotion) { chiudi(); return; }

    // Progressione simulata ma legata anche al load reale
    const tick = setInterval(function () {
      pct = Math.min(pct + Math.random() * 14 + 4, document.readyState === "complete" ? 100 : 92);
      if (barra) barra.style.width = pct + "%";
      if (pct >= 100) chiudi();
    }, 120);

    // Timeout di sicurezza: mai bloccare la pagina più di 5 secondi
    setTimeout(chiudi, 5000);
    window.addEventListener("load", function () {
      setTimeout(chiudi, 600);
    });
  }

  /* ==================================================================
     2. MENU MOBILE — hamburger → drawer laterale + overlay
     Chiusura: tap outside (overlay), ESC, click su link.
     Il drawer è attivo solo ≤900px (gestito in CSS); qui si apre/chiude
     SOLO se l'hamburger è effettivamente visibile.
  ================================================================== */
  function initMenuMobile() {
    const toggle = document.getElementById("menu-toggle");
    const drawer = document.getElementById("nav-mobile");
    const overlay = document.getElementById("menu-overlay");
    if (!toggle || !drawer) return;

    function isOpen() {
      // Selettore stato aperto irrobustito: controlla tutti i marker
      return drawer.getAttribute("aperto") === "si" ||
             document.body.getAttribute("menu-aperto") === "si";
    }

    function apri() {
      // Drawer attivo solo sotto i 900px: niente apertura "fantasma" su desktop
      if (window.innerWidth > 900) return;
      drawer.setAttribute("aperto", "si");
      document.body.setAttribute("menu-aperto", "si");   // scroll lock via CSS
      if (overlay) overlay.setAttribute("aperto", "si");
      toggle.setAttribute("aperto", "si");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Chiudi menu");
    }

    function chiudi() {
      drawer.removeAttribute("aperto");
      document.body.removeAttribute("menu-aperto");
      if (overlay) overlay.removeAttribute("aperto");
      toggle.removeAttribute("aperto");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Apri menu");
    }

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      isOpen() ? chiudi() : apri();
    });

    // Tap outside → chiudi
    if (overlay) overlay.addEventListener("click", chiudi);

    // ESC → chiudi
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) chiudi();
    });

    // Click su un link del drawer → chiudi (la navigazione fa il resto)
    drawer.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", chiudi);
    });

    // Se si torna large mentre il drawer è aperto, richiudilo
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900 && isOpen()) chiudi();
    });
  }

  /* ==================================================================
     3. SCROLL FLUIDO + NAV PAGINA CORRENTE
     L'offset dell'header fisso è gestito da scroll-padding-top in CSS;
     qui aggiungiamo la marcatura della pagina attiva nella nav desktop.
  ================================================================== */
  function initNavCorrente() {
    const pagina = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    const mappa = {
      "": "index.html",
      "index.html": "#link-home",
      "servizi.html": "#link-servizi",
      "faq.html": "#link-faq",
      "assistenza.html": "#link-assistenza",
      "chi-siamo.html": "#link-chisiamo",
      "contatti.html": "#link-contatti",
      "admin.html": "#link-admin"
    };
    const id = mappa[pagina];
    if (!id) return;
    const el = document.querySelector(id);
    if (el) el.setAttribute("pagina-corrente", "si");
  }

  /* ==================================================================
     4. REVEAL ALLO SCROLL — IntersectionObserver one-shot
     Le sezioni e gli elementi interni marcati [reveal="si"] entrano con
     translateY(46px)→0, 0.8s cubic-bezier(0.22,1,0.36,1), delay a cascata.
     Fallback: senza IO o con JS disattivato tutto resta visibile.
  ================================================================== */
  function markRevealTargets() {
    // Marca automaticamente le principali sezioni del funnel
    const bersagli = [
      "#titolo-problema", "#sottotitolo-problema", "#card-problema-1", "#card-problema-2", "#card-problema-3",
      "#titolo-soluzione", "#sottotitolo-soluzione", "#confronto-altri", "#confronto-noi", "#soluzione-note",
      "#titolo-comefunziona", "#sottotitolo-comefunziona", "#step-1", "#step-2", "#step-3", "#step-4", "#bottone-timeline",
      "#titolo-servizi", "#sottotitolo-servizi", "#card-servizio-base", "#card-servizio-completo", "#card-servizio-brand", "#card-servizio-deploy", "#servizi-more",
      "#titolo-portfolio", "#sottotitolo-portfolio", "#filtri-portfolio", "#work-1", "#work-2", "#work-3", "#work-4", "#work-5", "#work-6",
      "#titolo-recensioni", "#sottotitolo-recensioni", "#form-recensione",
      "#titolo-contatti", "#sottotitolo-contatti", "#contatti-info", "#form-contatti",
      // Pagine interne
      "#hero-page", "#titolo-servizi-page", "#sottotitolo-servizi", "#card-page-base", "#card-page-completo", "#card-page-brand", "#card-page-deploy",
      "#titolo-faq", "#sottotitolo-faq", "#faq-lista",
      "#titolo-assistenza", "#sottotitolo-assistenza", "#card-assistenza-1", "#card-assistenza-2", "#card-assistenza-3", "#assistenza-stato", "#assistenza-contatti",
      "#titolo-chisiamo", "#sottotitolo-chisiamo", "#chisiamo-testo", "#valore-1", "#valore-2", "#valore-3",
      "#titolo-contatti-page", "#sottotitolo-contatti-page", "#contatti-page-info", "#form-contatti-page",
      "#titolo-admin", "#sottotitolo-admin", "#admin-box"
    ];
    bersagli.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.setAttribute("reveal", "si");
      });
    });

    // Delay a cascata per i gruppi (card della stessa griglia)
    const cascate = [
      ["#card-problema-1", "#card-problema-2", "#card-problema-3"],
      ["#step-1", "#step-2", "#step-3", "#step-4"],
      ["#card-servizio-base", "#card-servizio-completo", "#card-servizio-brand", "#card-servizio-deploy"],
      ["#work-1", "#work-2", "#work-3", "#work-4", "#work-5", "#work-6"],
      ["#card-page-base", "#card-page-completo", "#card-page-brand", "#card-page-deploy"],
      ["#card-assistenza-1", "#card-assistenza-2", "#card-assistenza-3"],
      ["#valore-1", "#valore-2", "#valore-3"]
    ];
    cascate.forEach(function (gruppo) {
      gruppo.forEach(function (sel, i) {
        const el = document.querySelector(sel);
        if (el) el.style.setProperty("--reveal-delay", (i * 0.12) + "s");
      });
    });
  }

  function initReveal() {
    const elementi = document.querySelectorAll('[reveal="si"]');
    if (!elementi.length) return;

    // Fallback 1: reduced motion → mostra tutto subito
    if (reducedMotion) {
      elementi.forEach(function (el) { el.setAttribute("visible", "si"); });
      return;
    }
    // Fallback 2: IntersectionObserver non supportato → mostra tutto
    if (!("IntersectionObserver" in window)) {
      elementi.forEach(function (el) { el.setAttribute("visible", "si"); });
      return;
    }

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.setAttribute("visible", "si");
          io.unobserve(entry.target);                    // one-shot: mai più nascosto
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    elementi.forEach(function (el) { io.observe(el); });
  }

  /* ==================================================================
     5. FILTRI PORTFOLIO (solo index.html)
     Stato attivo via attributo [attivo="si"], hiding via [nascosto="si"].
  ================================================================== */
  function initFiltriPortfolio() {
    const bottoni = document.querySelectorAll("#filtri-portfolio button[data-filtro]");
    const lavori = document.querySelectorAll("#portfolio-grid figure[data-categoria]");
    if (!bottoni.length || !lavori.length) return;

    bottoni.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const filtro = btn.dataset.filtro;

        bottoni.forEach(function (b) { b.removeAttribute("attivo"); });
        btn.setAttribute("attivo", "si");

        lavori.forEach(function (w) {
          const ok = (filtro === "tutti") || (w.dataset.categoria === filtro);
          if (ok) w.removeAttribute("nascosto");
          else w.setAttribute("nascosto", "si");
        });
      });
    });
  }

  /* ==================================================================
     6. RECENSIONI — Firebase con fallback demo locale
     Anti-XSS: ogni testo utente entra nel DOM SOLO tramite
     createElement + textContent (mai innerHTML interpolato).
  ================================================================== */

  // Due recensioni demo mostrate quando Firebase non è configurato
  const DEMO_RECENSIONS = [
    { name: "Giulia Bianchi", text: "Avevo appena aperto il mio studio di estetica e nessuno mi trovava online. In due giorni mi hanno mandato la bozza gratis, identica a quello che volevo. Prezzi chiari, zero sorprese.", url: "https://www.instagram.com/webnix.it", stars: 5, timestamp: Date.now() - 86400000 * 12 },
    { name: "Marco Rinaldi", text: "Provato con Wix e WordPress prima di Webnix: lentissimi e pieni di costi nascosti. Qui ho pagato una volta sola e il sito vola. Assistenza veloce anche dopo la pubblicazione.", url: "", stars: 5, timestamp: Date.now() - 86400000 * 45 }
  ];

  function firebaseConfigurato() {
    // Considera Firebase attivo solo se le chiavi segnaposto sono state sostituite
    return !!CFG &&
           !/LA_TUA_API_KEY|IL_TUO_PROGETTO/.test(CFG.firebase.apiKey) &&
           !/IL_TUO_PROGETTO/.test(CFG.firebase.databaseURL) &&
           typeof firebase !== "undefined" &&
           typeof firebase.initializeApp === "function";
  }

  function formattaData(ts) {
    try {
      const d = new Date(Number(ts));
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) { return ""; }
  }

  function inizialeNome(nome) {
    const s = String(nome || "?").trim();
    return s ? s.charAt(0).toUpperCase() : "?";
  }

  /* Costruisce la card recensione in modo sicuro:createElement+textContent */
  function creaCardRecrizione(r) {
    const art = document.createElement("article");

    // Rigra testa: avatar + nome + data
    const head = document.createElement("div");

    const avatar = document.createElement("span");
    avatar.textContent = inizialeNome(r.name);
    head.appendChild(avatar);

    const meta = document.createElement("div");
    const nomeEl = document.createElement("div");
    nomeEl.textContent = String(r.name || "Anonimo");            // textContent = anti-XSS
    const dataEl = document.createElement("div");
    dataEl.textContent = formattaData(r.timestamp);
    meta.appendChild(nomeEl);
    meta.appendChild(dataEl);
    head.appendChild(meta);
    art.appendChild(head);

    // Stelle
    const stelle = document.createElement("div");
    const n = Math.max(1, Math.min(5, parseInt(r.stars, 10) || 5));
    stelle.textContent = "★".repeat(n) + "☆".repeat(5 - n);
    art.appendChild(stelle);

    // Testo recensione
    const p = document.createElement("p");
    p.textContent = String(r.text || "");                        // textContent = anti-XSS
    art.appendChild(p);

    // Link facoltativo (solo http/https)
    if (r.url && /^https?:\/\//i.test(String(r.url))) {
      const a = document.createElement("a");
      a.href = String(r.url);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "Visita sito/social";
      art.appendChild(a);
    }

    return art;
  }

  function dipingiRecensioni(lista, containerId) {
    const container = document.getElementById(containerId || "lista-recensioni");
    const vuote = document.getElementById("recensioni-vuote");
    if (!container) return;

    container.textContent = "";                                  // svuota in sicurezza
    if (!lista || lista.length === 0) {
      if (vuote) vuote.removeAttribute("hidden");
      return;
    }
    if (vuote) vuote.setAttribute("hidden", "");
    lista.forEach(function (r) { container.appendChild(creaCardRecrizione(r)); });
  }

  function normalizzaLista(raw) {
    let arr = [];
    if (Array.isArray(raw)) arr = raw.slice();
    else if (raw && typeof raw === "object") arr = Object.keys(raw).map(function (k) { return raw[k]; });
    arr.sort(function (a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
    return arr;
  }

  async function caricaRecensioni() {
    const loader = document.getElementById("recensioni-loader");
    const container = document.getElementById("lista-recensioni");
    if (!container) return;                       // pagina senza sezione recensioni

    if (loader) loader.removeAttribute("hidden");

    if (firebaseConfigurato()) {
      try {
        const resp = await fetch(firebaseUrl + "/" + CFG.recensioni.path + ".json");
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const data = await resp.json();
        const lista = normalizzaLista(data);
        dipingiRecensioni(lista);
        if (loader) loader.setAttribute("hidden", "");
        return;
      } catch (err) {
        console.warn("Firebase non raggiungibile, uso recensioni demo:", err.message);
      }
    }

    // FALLBACK DEMO: due recensioni locali, senza errori in console
    dipingiRecensioni(DEMO_RECENSIONS);
    if (loader) loader.setAttribute("hidden", "");
  }

  function inviaRecensione(rec) {
    if (firebaseConfigurato()) {
      return fetch(firebaseUrl + "/" + CFG.recensioni.path + ".json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rec)
      }).then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.json();
      });
    }
    // Modalità demo: salvataggio locale + aggiornamento visivo immediato
    return new Promise(function (resolve) {
      try {
        const locale = JSON.parse(localStorage.getItem("webnix_recensioni_demo") || "[]");
        locale.push(rec);
        localStorage.setItem("webnix_recensioni_demo", JSON.stringify(locale));
      } catch (e) { /* storage pieno o negato: ignora */ }
      setTimeout(resolve, 400);
    });
  }

  function initFormRecensione() {
    const form = document.getElementById("form-recensione");
    if (!form) return;

    const inputNome = document.getElementById("rev-nome");
    const inputUrl = document.getElementById("rev-url");
    const inputTesto = document.getElementById("rev-testo");
    const contatore = document.getElementById("rev-contatore");
    const feedback = document.getElementById("rev-feedback");
    const submitBtn = document.getElementById("rev-submit");
    const stelle = [1, 2, 3, 4, 5].map(function (i) { return document.getElementById("stella-" + i); });
    let valutazione = 0;

    function aggiornaStelle(n) {
      valutazione = n;
      stelle.forEach(function (b, i) {
        if (i < n) b.setAttribute("piena", "si");
        else b.removeAttribute("piena");
      });
    }

    stelle.forEach(function (b) {
      if (!b) return;
      b.addEventListener("click", function () {
        aggiornaStelle(parseInt(b.dataset.valore, 10));
      });
    });

    // Contatore caratteri coerente con config (maxCaratteri = 1000)
    function aggiornaContatore() {
      if (!contatore || !inputTesto) return;
      const restanti = MAX_REV - inputTesto.value.length;
      contatore.textContent = restanti + " caratteri disponibili";
    }
    if (inputTesto) {
      inputTesto.maxLength = MAX_REV;
      inputTesto.addEventListener("input", aggiornaContatore);
      aggiornaContatore();
    }

    function diFeedback(msg, tipo) {
      if (!feedback) return;
      feedback.textContent = msg;
      feedback.setAttribute("stato", tipo);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const nome = (inputNome && inputNome.value.trim() || "").slice(0, 60);
      const url = (inputUrl && inputUrl.value.trim() || "").slice(0, 200);
      const testo = (inputTesto && inputTesto.value.trim() || "").slice(0, MAX_REV);

      if (!nome) { diFeedback("Inserisci il tuo nome.", "errore"); return; }
      if (valutazione < 1) { diFeedback("Seleziona un numero di stelle.", "errore"); return; }
      if (testo.length < 10) { diFeedback("Scrivi almeno 10 caratteri.", "errore"); return; }
      if (url && !/^https?:\/\//i.test(url)) { diFeedback("Il link deve iniziare con http:// o https://", "errore"); return; }

      const rec = {
        name: nome,
        text: testo,
        url: url,
        stars: valutazione,
        timestamp: Date.now()
      };

      if (submitBtn) submitBtn.disabled = true;
      diFeedback("Pubblicazione in corso…", "");

      inviaRecensione(rec).then(function () {
        // Aggiorna la vista immediatamente (demo o realtime refresh)
        const container = document.getElementById("lista-recensioni");
        if (container) container.insertBefore(creaCardRecrizione(rec), container.firstChild);
        const vuote = document.getElementById("recensioni-vuote");
        if (vuote) vuote.setAttribute("hidden", "");

        diFeedback(firebaseConfigurato()
          ? "Grazie! La tua recensione è stata pubblicata."
          : "Grazie! Recensione salvata in modalità demo (Firebase non configurato).", "ok");
        form.reset();
        aggiornaStelle(0);
        aggiornaContatore();
      }).catch(function (err) {
        console.warn("Invio recensione fallito:", err.message);
        diFeedback("Errore nella pubblicazione. Riprova o scrivici su WhatsApp.", "errore");
      }).finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }

  /* ==================================================================
     7. FORM CONTATTI → WHATSAPP PRECOMPILATO
     Funziona sia in home (#form-contatti) sia in contatti.html
     (#form-contatti-page): stesso handler, id diversi.
  ================================================================== */
  function initFormWhatsApp() {
    ["form-contatti", "form-contatti-page"].forEach(function (fid) {
      const form = document.getElementById(fid);
      if (!form) return;

      const feedback = document.getElementById(fid === "form-contatti" ? "ct-feedback" : "ct-feedback-page");

      function diFeedback(msg, tipo) {
        if (!feedback) return;
        feedback.textContent = msg;
        feedback.setAttribute("stato", tipo);
      }

      form.addEventListener("submit", function (e) {
        e.preventDefault();

        const nome = document.getElementById(fid === "form-contatti" ? "ct-nome" : "cp-nome");
        const attivita = document.getElementById(fid === "form-contatti" ? "ct-attivita" : "cp-attivita");
        const email = document.getElementById(fid === "form-contatti" ? "ct-email" : "cp-email");
        const tel = document.getElementById(fid === "form-contatti" ? "ct-telefono" : "cp-telefono");
        const msg = document.getElementById(fid === "form-contatti" ? "ct-messaggio" : "cp-messaggio");

        const vNome = nome ? nome.value.trim() : "";
        const vAtt = attivita ? attivita.value.trim() : "";
        const vMail = email ? email.value.trim() : "";
        const vTel = tel ? tel.value.trim() : "";
        const vMsg = msg ? msg.value.trim() : "";

        if (!vNome) { diFeedback("Inserisci il tuo nome.", "errore"); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vMail)) {
          diFeedback("Inserisci un'email valida.", "errore"); return;
        }
        if (!vTel) { diFeedback("Inserisci un telefono/WhatsApp.", "errore"); return; }

        const testo =
          "Ciao Webnix! Vorrei la bozza gratuita.\n\n" +
          "Nome: " + vNome + "\n" +
          (vAtt ? "Attività: " + vAtt + "\n" : "") +
          "Email: " + vMail + "\n" +
          "Telefono: " + vTel + "\n" +
          (vMsg ? "Richiesta: " + vMsg : "");

        diFeedback("Ti stiamo aprendo WhatsApp… se non si apre, scrivici a " + (CFG ? CFG.contatti.email : "webnixit@gmail.com"), "ok");

        window.open(whatsappBase + "?text=" + encodeURIComponent(testo), "_blank", "noopener");
        form.reset();
      });
    });
  }

  /* ==================================================================
     8. BOTTONE CTA #bottone1 — stato [attivo] per il touch
     Su dispositivi touch non c'è :hover: replicchiamo l'effetto
     scorrimento testo con un attributo rimosso dopo la transizione.
  ================================================================== */
  function initBottoneTouch() {
    const btn = document.getElementById("bottone1");
    if (!btn) return;
    btn.addEventListener("touchstart", function () {
      btn.setAttribute("attivo", "si");
    }, { passive: true });
    btn.addEventListener("touchend", function () {
      setTimeout(function () { btn.removeAttribute("attivo"); }, 350);
    }, { passive: true });
  }

  /* ---------- Avvio ---------- */
  function avvio() {
    initLoader();
    initMenuMobile();
    initNavCorrente();
    markRevealTargets();
    initReveal();
    initFiltriPortfolio();
    initFormRecensione();
    initFormWhatsApp();
    initBottoneTouch();
    caricaRecensioni();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", avvio);
  } else {
    avvio();
  }

})();

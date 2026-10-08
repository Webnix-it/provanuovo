/* ============================================================
   WEBNIX – script.js
   JavaScript Vanilla puro (nessun framework, nessuna libreria).
   Funzionalità:
     1. Menu mobile (hamburger)
     2. Scroll fluido con offset header
     3. Filtro portfolio
     4. Recensioni: lettura da Firebase Realtime Database
        (fallback a recensioni locali se config.js non è compilato)
     5. Recensioni: invio con struttura dati esatta
        { name, text, url, stars, timestamp }
     6. Form contatti → apertura WhatsApp con messaggio precompilato
   ============================================================ */

"use strict";

/* ------------------------------------------------------------
   0. Piccoli helper DOM
------------------------------------------------------------ */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ------------------------------------------------------------
   1. MENU MOBILE
------------------------------------------------------------ */
(function initMenuMobile() {
  const toggle = $("#menu-toggle");
  const nav    = $("#nav-mobile");
  if (!toggle || !nav) return;

  function chiudiMenu() {
    nav.removeAttribute("aperto");
    toggle.removeAttribute("aperto");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Apri menu");
  }

  toggle.addEventListener("click", () => {
    const aperto = toggle.getAttribute("aperto") !== "si";
    if (aperto) {
      nav.setAttribute("aperto", "si");
      toggle.setAttribute("aperto", "si");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Chiudi menu");
    } else {
      chiudiMenu();
    }
  });

  // Chiude il menu quando si clicca un link
  $$("a", nav).forEach(link => link.addEventListener("click", chiudiMenu));
})();

/* ------------------------------------------------------------
   2. SCROLL FLUIDO CON OFFSET HEADER
   (html{scroll-behavior:smooth} copre i casi base; qui
    gestiamo l'offset del menu sticky e la compatibilità JS)
------------------------------------------------------------ */
(function initScrollFluido() {
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", (e) => {
      const id = anchor.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      const target = document.getElementById(id.slice(1));
      if (!target) return;

      e.preventDefault();
      const header = $("#header");
      const offset = header ? header.offsetHeight + 12 : 0;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({ top, behavior: "smooth" });
      history.replaceState(null, "", id);
    });
  });
})();

/* ------------------------------------------------------------
   3. FILTRO PORTFOLIO
------------------------------------------------------------ */
(function initFiltroPortfolio() {
  const botoni = [
    $("#filtro-tutti"), $("#filtro-siti"),
    $("#filtro-loghi"), $("#filtro-grafica")
  ].filter(Boolean);
  const works = [
    $("#work-1"), $("#work-2"), $("#work-3"),
    $("#work-4"), $("#work-5"), $("#work-6")
  ].filter(Boolean);
  if (!botoni.length || !works.length) return;

  botoni.forEach(btn => {
    btn.addEventListener("click", () => {
      botoni.forEach(b => b.removeAttribute("attivo"));
      btn.setAttribute("attivo", "si");

      const filtro = btn.dataset.filtro; // "tutti" | "siti" | "loghi" | "grafica"
      works.forEach(w => {
        const mostra = filtro === "tutti" || w.dataset.categoria === filtro;
        if (mostra) w.removeAttribute("nascosto");
        else w.setAttribute("nascosto", "si");
      });
    });
  });
})();

/* ------------------------------------------------------------
   4. RECENSIONI – Lettura
   Struttura dati nel DB (node "recensioni"):
   { name: string, text: string, url: string, stars: number, timestamp: number }
------------------------------------------------------------ */
const firebaseConfig = (typeof WEBNIX_CONFIG !== "undefined") ? WEBNIX_CONFIG.firebase : null;
const MAX_CARATTERI  = (typeof WEBNIX_CONFIG !== "undefined") ? WEBNIX_CONFIG.recensioni.maxCaratteri : 1000;

// True se config.js contiene ancora i segnaposto → useremo i dati locali
const configCompilata =
  firebaseConfig &&
  firebaseConfig.apiKey &&
  !/LA_TUA_API_KEY|IL_TUO_PROGETTO/.test(firebaseConfig.databaseURL + firebaseConfig.apiKey);

/* Recensione di fallback locale (visibile subito, senza Firebase).
   Sostituiscila / eliminandola quando avrai le tue recensioni reali. */
const recensioniLocali = [
  {
    name: "Laura B.",
    text: "Avevo appena aperto il mio studio e nessuno mi trovava su Google. Bozza arrivata in due giorni, sito online in una settimana. Onesti sul prezzo, zero sorprese.",
    url: "",
    stars: 5,
    timestamp: Date.now() - 86400000 * 9
  },
  {
    name: "Marco T.",
    text: "Pensavo al sito come a un costo infinito di canoni. Con Webnix ho pagato una volta sola e il codice è mio. Site velocissimo sul telefono.",
    url: "",
    stars: 5,
    timestamp: Date.now() - 86400000 * 21
  }
];

function formattaData(ts) {
  try {
    return new Date(ts).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  } catch (e) {
    return "";
  }
}

function creaCardRecensione(r) {
  /* Costruita solo con createElement: nessuna classe, lo stile
     arriva da style.css tramite la struttura sotto #lista-recensioni */
  const card = document.createElement("article");

  const nome = (r.name || "Anonimo").trim();
  const iniziale = nome.charAt(0).toUpperCase();
  const stelle = Math.max(1, Math.min(5, parseInt(r.stars, 10) || 5));
  const testo = (r.text || "").slice(0, MAX_CARATTERI);

  // Header: avatar + nome + data
  const header = document.createElement("div");
  const avatar = document.createElement("span");
  avatar.textContent = iniziale;
  const info = document.createElement("div");
  const elNome = document.createElement("div");
  elNome.textContent = nome;              // testo puro, sicuro
  const elData = document.createElement("div");
  elData.textContent = formattaData(r.timestamp);
  info.appendChild(elNome);
  info.appendChild(elData);
  header.appendChild(avatar);
  header.appendChild(info);

  // Stelle
  const elStelle = document.createElement("div");
  elStelle.textContent = "★".repeat(stelle) + "☆".repeat(5 - stelle);

  // Testo
  const elTesto = document.createElement("p");
  elTesto.textContent = testo;            // testo puro, sicuro

  card.appendChild(header);
  card.appendChild(elStelle);
  card.appendChild(elTesto);

  if (r.url) {
    const link = document.createElement("a");
    link.href = r.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Visita il sito ↗";
    card.appendChild(link);
  }
  return card;
}

function svuotaEInserisci(recs) {
  const lista = $("#lista-recensioni");
  const loader = $("#recensioni-loader");
  const vuote = $("#recensioni-vuote");
  if (!lista) return;

  lista.innerHTML = "";
  if (loader) loader.hidden = true;

  if (!recs || recs.length === 0) {
    if (vuote) vuote.hidden = false;
    return;
  }
  if (vuote) vuote.hidden = true;

  recs
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .forEach(r => lista.appendChild(creaCardRecensione(r)));
}

(function initLetturaRecensioni() {
  const loader = $("#recensioni-loader");
  if (loader) loader.hidden = false;

  if (configCompilata && typeof firebase !== "undefined") {
    // ---- Modalità Firebase ----
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    db.ref(WEBNIX_CONFIG.recensioni.path).once("value")
      .then(snap => {
        const data = snap.val() || {};
        const arr = Object.values(data);
        svuotaEInserisci(arr);
      })
      .catch(() => svuotaEInserisci(recensioniLocali));
  } else {
    // ---- Fallback locale (senza Firebase configurato) ----
    setTimeout(() => svuotaEInserisci(recensioniLocali), 300);
  }
})();

/* ------------------------------------------------------------
   5. FORM RECENSIONE – Invio
------------------------------------------------------------ */
(function initFormRecensione() {
  const form = $("#form-recensione");
  if (!form) return;

  const nomeInput   = $("#rev-nome");
  const urlInput    = $("#rev-url");
  const testoInput  = $("#rev-testo");
  const contatore   = $("#rev-contatore");
  const feedback    = $("#rev-feedback");
  const submitBtn   = $("#rev-submit");
  const stelleBox   = $("#rev-stelle");
  let stelleScelte  = 0;

  // Aggiorna contatore caratteri (limite reale = MAX_CARATTERI, coerente col commento)
  function aggiornaContatore() {
    const restanti = MAX_CARATTERI - testoInput.value.length;
    contatore.textContent = `${restanti} caratteri disponibili`;
    contatore.style.color = restanti < 50 ? "var(--error)" : "";
  }
  testoInput.addEventListener("input", aggiornaContatore);
  aggiornaContatore();

  // Selezione stelle (elementi raggiunti per id, stato via attributo)
  const stelleEl = [1, 2, 3, 4, 5].map(i => $("#stella-" + i)).filter(Boolean);
  function disegnaStelle(n) {
    stelleEl.forEach(s => {
      if (Number(s.dataset.valore) <= n) s.setAttribute("piena", "si");
      else s.removeAttribute("piena");
    });
  }
  stelleEl.forEach(s => {
    s.addEventListener("click", () => {
      stelleScelte = Number(s.dataset.valore);
      disegnaStelle(stelleScelte);
    });
    s.addEventListener("mouseenter", () => disegnaStelle(Number(s.dataset.valore)));
  });
  stelleBox.addEventListener("mouseleave", () => disegnaStelle(stelleScelte));

  function mostraFeedback(msg, ok) {
    feedback.textContent = msg;
    feedback.setAttribute("stato", ok ? "ok" : "errore");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = nomeInput.value.trim();
    const testo = testoInput.value.trim();

    if (!nome)          return mostraFeedback("Inserisci il tuo nome.", false);
    if (!testo)         return mostraFeedback("Scrivi la tua recensione.", false);
    if (stelleScelte < 1) return mostraFeedback("Seleziona da 1 a 5 stelle.", false);

    const recensione = {
      name: nome,
      text: testo.slice(0, MAX_CARATTERI),
      url: urlInput.value.trim(),          // se vuoto salva ''
      stars: stelleScelte,
      timestamp: Date.now()
    };

    submitBtn.disabled = true;

    if (configCompilata && typeof firebase !== "undefined") {
      firebase.database().ref(WEBNIX_CONFIG.recensioni.path).push(recensione)
        .then(() => {
          mostraFeedback("Grazie! La tua recensione è stata pubblicata.", true);
          form.reset();
          stelleScelte = 0;
          disegnaStelle(0);
          aggiornaContatore();
        })
        .catch(() => mostraFeedback("Errore di invio. Riprova più tardi.", false))
        .finally(() => (submitBtn.disabled = false));
    } else {
      // Fallback demo: aggiunge alla lista locale (non persistente)
      recensioniLocali.push(recensione);
      svuotaEInserisci(recensioniLocali);
      mostraFeedback("Recensione aggiunta (demo locale). Configura Firebase per salvarla online.", true);
      form.reset();
      stelleScelte = 0;
      disegnaStelle(0);
      aggiornaContatore();
      submitBtn.disabled = false;
    }
  });
})();

/* ------------------------------------------------------------
   6. FORM CONTATTI → WhatsApp
   (HTML/CSS/JS puro: nessun backend richiesto. Se in futuro
    vorrai una mail vera, basta puntare l'invio a un servizio
    tipo Formspree restando in vanilla JS.)
------------------------------------------------------------ */
(function initFormContatti() {
  const form = $("#form-contatti");
  if (!form) return;

  const feedback = $("#ct-feedback");
  const whatsappUrl = (typeof WEBNIX_CONFIG !== "undefined")
    ? WEBNIX_CONFIG.contatti.whatsapp
    : "https://wa.me/14132259397";

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome     = $("#ct-nome").value.trim();
    const attivita = $("#ct-attivita").value.trim();
    const email    = $("#ct-email").value.trim();
    const tel      = $("#ct-telefono").value.trim();
    const msg      = $("#ct-messaggio").value.trim();

    if (!nome) { feedback.textContent = "Inserisci il nome."; feedback.setAttribute("stato", "errore"); return; }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      feedback.textContent = "Inserisci un'email valida."; feedback.setAttribute("stato", "errore"); return;
    }
    if (!tel) { feedback.textContent = "Inserisci un telefono/WhatsApp."; feedback.setAttribute("stato", "errore"); return; }

    const testo =
      `Ciao Webnix! Vorrei la bozza gratuita.%0A%0A` +
      `*Nome:* ${encodeURIComponent(nome)}%0A` +
      (attivita ? `*Attività:* ${encodeURIComponent(attivita)}%0A` : "") +
      `*Email:* ${encodeURIComponent(email)}%0A` +
      `*Telefono:* ${encodeURIComponent(tel)}%0A` +
      (msg ? `*Richiesta:* ${encodeURIComponent(msg)}` : "");

    feedback.textContent = "Ti stiamo aprendo WhatsApp… se non si apre, scrivici a webnixit@gmail.com";
    feedback.setAttribute("stato", "ok");

    window.open(`${whatsappUrl.split("?")[0]}?text=${testo}`, "_blank", "noopener");
    form.reset();
  });
})();

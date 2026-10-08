/* ============================================================
   WEBNIX – config.js
   Configurazione centralizzata: Firebase, contatti, social,
   limiti recensioni. Unico punto di verità: usato sia per
   LEGGERE che per SCRIVERE le recensioni.
   Solo JavaScript vanilla, nessuna dipendenza esterna obbligatoria.
   ============================================================ */

const WEBNIX_CONFIG = {

  /* ---------- BRAND ---------- */
  brand: {
    nome: "Webnix",
    nomeCompleto: "Webnix Digital Agency",
    annoCopyright: 2026
  },

  /* ---------- CONTATTI ---------- */
  contatti: {
    email: "webnixit@gmail.com",
    telefono: "+14132259397",
    whatsapp: "https://wa.me/14132259397?text=Ciao%20Webnix!%20Vorrei%20la%20bozza%20gratuita%20del%20mio%20sito.",
    citta: "Genova",
    regione: "Liguria",
    orari: "Lunedì - Venerdì, 09:00 - 18:00"
  },

  /* ---------- SOCIAL (uniformati: Instagram è webnix.it) ---------- */
  social: {
    instagram: "https://www.instagram.com/webnix.it",
    facebook: "https://www.facebook.com/people/Webnix-Digital-Agency/61582890411506/"
  },

  /* ---------- FIREBASE (Realtime Database) ----------
     ⚠️ Sostituisci i valori qui sotto con le chiavi del TUO progetto
     Firebase (Console → Project settings → Your apps → SDK setup).
     La configurazione non è "segreta": è visibile nel bundle client,
     MA la sicurezza reale va messa nelle REGOLE del database.
     Regole consigliate (Database Rules):
       {
         "rules": {
           "recensioni": {
             ".read": true,
             ".write": true   // valuta un rate-limit o token se serve
           }
         }
       }
  ---------------------------------------------------- */
  firebase: {
    apiKey: "LA_TUA_API_KEY",
    authDomain: "IL_TUO_PROGETTO.firebaseapp.com",
    databaseURL: "https://IL_TUO_PROGETTO-default-rtdb.firebaseio.com",
    projectId: "IL_TUO_PROGETTO",
    storageBucket: "IL_TUO_PROGETTO.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:xxxxxxxxxxxxxxxx"
  },

  /* ---------- RECENSIONI ---------- */
  recensioni: {
    path: "recensioni",        // nodo del Realtime Database
    maxCaratteri: 1000,        // uniforme al codice (il vecchio commento diceva 200)
    minStelle: 1,
    maxStelle: 5
  }
};

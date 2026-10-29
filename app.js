"use strict";

/* ===== Listes des réglages ===== */

const TYPES = [
  { id: "mapa", label: "Situer le pays sur la carte" },
  { id: "pais_capital", label: "Pays vers capitale" },
  { id: "capital_pais", label: "Capitale vers pays" },
  { id: "gentilicio", label: "Habitants (masculin et féminin)" },
  { id: "pais_dirigente", label: "Pays vers chef du gouvernement" },
  { id: "dirigente_pais", label: "Chef du gouvernement vers pays" },
];

const ZONES = [
  { id: "sur", label: "Amérique du Sud" },
  { id: "central", label: "Mexique et Amérique centrale" },
  { id: "caribe", label: "Caraïbes" },
  { id: "europa_africa", label: "Espagne et Guinée équatoriale" },
];

/* Texte des questions (en espagnol) */
const ENONCES = {
  mapa: (p) => `¿Dónde está ${p.nombre}?`,
  pais_capital: (p) => `¿Cuál es la capital de ${p.nombre}?`,
  capital_pais: (p) => `¿De qué país es capital ${p.capital}?`,
  gentilicio: (p) => `¿Cómo se llaman los habitantes de ${p.nombre}? (masculino y femenino)`,
  pais_dirigente: (p) => `¿Quién dirige el gobierno de ${p.nombre}?`,
  dirigente_pais: (p) => `¿Qué país dirige ${p.dirigente}?`,
};

const CLE_STOCKAGE = "quizHispano.reglages";
const $ = (sel) => document.querySelector(sel);

let reglages = chargerReglages();
let partie = null;

/* ===== Outils pour comparer les réponses écrites ===== */

// Met un texte sous une forme comparable : minuscules, ponctuation et espaces
// en trop retirés, accents conservés. "  LA HABANA. " devient "la habana".
function normaliser(texte) {
  return String(texte)
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúüñ]+/g, " ")
    .trim();
}

// Accepte la réponse seulement si elle est identique à l'une des bonnes réponses :
// orthographe et accents exacts, mais majuscules et ponctuation libres.
function verifier(saisie, bonnes) {
  const s = normaliser(saisie);
  return s !== "" && bonnes.some((bonne) => normaliser(bonne) === s);
}

/* ===== Réponses attendues ===== */

const nomsPays = (p) => [p.nombre, ...(p.otrosNombres || [])];
const capitales = (p) => [p.capital, ...(p.otrasCapitales || [])];
const dirigeants = (p) => [p.dirigente, ...p.apellidos];
const gentilicio = (p) => `${p.gentilicio[0]}, ${p.gentilicio[1]}`;

// Valeur courte (utilisée pour les choix multiples)
function valeur(type, p) {
  if (type === "pais_capital") return p.capital;
  if (type === "gentilicio") return gentilicio(p);
  if (type === "pais_dirigente") return p.dirigente;
  return p.nombre;
}

// Bonne réponse complète (affichée dans la correction)
function bonneReponse(type, p) {
  if (type === "pais_capital") return p.detalleCapital ? `${p.capital} (${p.detalleCapital})` : p.capital;
  if (type === "pais_dirigente") return `${p.dirigente} (${p.cargo})`;
  return valeur(type, p);
}

// Réponses acceptées en mode écrit (un seul champ)
function reponsesAcceptees(type, p) {
  if (type === "pais_capital") return capitales(p);
  if (type === "pais_dirigente") return dirigeants(p);
  return nomsPays(p);
}

/* ===== Outils divers ===== */

function melanger(liste) {
  const t = liste.slice();
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}

function el(balise, attributs = {}, texte) {
  const e = document.createElement(balise);
  for (const [k, v] of Object.entries(attributs)) e.setAttribute(k, v);
  if (texte !== undefined) e.textContent = texte;
  return e;
}

function afficherEcran(nom) {
  for (const id of ["reglages", "quiz", "resultats"]) {
    $(`#ecran-${id}`).hidden = id !== nom;
  }
  window.scrollTo(0, 0);
}

/* ===== Réglages ===== */

function chargerReglages() {
  const defaut = {
    types: TYPES.map((t) => t.id),
    mode: "choix",
    zones: ZONES.map((z) => z.id),
    nombre: "10",
  };
  try {
    const sauve = JSON.parse(localStorage.getItem(CLE_STOCKAGE));
    if (sauve && Array.isArray(sauve.types) && Array.isArray(sauve.zones)) return { ...defaut, ...sauve };
  } catch (e) { /* pas de sauvegarde possible : on garde les valeurs par défaut */ }
  return defaut;
}

function sauverReglages() {
  try { localStorage.setItem(CLE_STOCKAGE, JSON.stringify(reglages)); } catch (e) { /* ignoré */ }
}

function creerCases(conteneur, liste, nom, coches) {
  for (const item of liste) {
    const label = el("label", { class: "case" });
    const input = el("input", { type: "checkbox", name: nom, value: item.id });
    input.checked = coches.includes(item.id);
    label.append(input, " " + item.label);
    conteneur.append(label);
  }
}

function lireReglages() {
  const form = $("#form-reglages");
  reglages = {
    types: [...form.querySelectorAll("input[name=types]:checked")].map((i) => i.value),
    mode: form.querySelector("input[name=mode]:checked").value,
    zones: [...form.querySelectorAll("input[name=zones]:checked")].map((i) => i.value),
    nombre: form.querySelector("input[name=nombre]:checked").value,
  };
  sauverReglages();
}

function toutesLesQuestions() {
  const pays = PAISES.filter((p) => reglages.zones.includes(p.zona));
  return reglages.types.flatMap((type) => pays.map((p) => ({ type, pays: p })));
}

function mettreAJourInfo() {
  lireReglages();
  const info = $("#info-nombre");
  const total = toutesLesQuestions().length;
  let message = "";
  if (reglages.types.length === 0) message = "Choisis au moins un type de questions.";
  else if (reglages.zones.length === 0) message = "Choisis au moins une zone.";
  info.classList.toggle("erreur", total === 0);
  if (total > 0) {
    const demande = reglages.nombre === "tout" ? total : Number(reglages.nombre);
    message = `${total} questions possibles avec ces réglages.`;
    if (demande > total) message += ` Le quiz en posera ${total}.`;
  }
  info.textContent = message;
  $("#commencer").disabled = total === 0;
}

function initialiserReglages() {
  creerCases($("#choix-types"), TYPES, "types", reglages.types);
  creerCases($("#choix-zones"), ZONES, "zones", reglages.zones);
  const form = $("#form-reglages");
  (form.querySelector(`input[name=mode][value="${reglages.mode}"]`) || form.querySelector("input[name=mode]")).checked = true;
  (form.querySelector(`input[name=nombre][value="${reglages.nombre}"]`) || form.querySelector("input[name=nombre]")).checked = true;
  form.addEventListener("change", mettreAJourInfo);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    lireReglages();
    lancerNouvellesQuestions();
  });
  mettreAJourInfo();
}

/* ===== Carte ===== */

const Carte = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const chemins = {};
  let svgAmeriques = null;
  let quandChoisi = null;

  function creer(region, conteneur) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", region.vue);
    svg.setAttribute("class", "carte-svg");
    const [x, y, w, h] = region.vue.split(" ").map(Number);
    const mer = document.createElementNS(NS, "rect");
    Object.entries({ class: "mer", x: x - 5000, y: y - 5000, width: w + 10000, height: h + 10000 })
      .forEach(([k, v]) => mer.setAttribute(k, v));
    svg.append(mer);
    const fond = document.createElementNS(NS, "path");
    fond.setAttribute("class", "fond");
    fond.setAttribute("d", region.fond);
    svg.append(fond);
    for (const [code, d] of Object.entries(region.pays)) {
      const chemin = document.createElementNS(NS, "path");
      chemin.setAttribute("class", "pays");
      chemin.setAttribute("d", d);
      chemin.dataset.code = code;
      chemins[code] = chemin;
      svg.append(chemin);
    }
    svg.addEventListener("click", (e) => {
      const cible = e.target.closest(".pays");
      if (cible && quandChoisi && $("#carte").classList.contains("actif")) quandChoisi(cible.dataset.code);
    });
    conteneur.append(svg);
    return svg;
  }

  function changerVue(zoom) {
    svgAmeriques.setAttribute("viewBox", zoom ? CARTE.am.zoom : CARTE.am.vue);
    for (const b of document.querySelectorAll("#choix-vue button")) {
      b.setAttribute("aria-pressed", String((b.dataset.vue === "zoom") === zoom));
    }
  }

  return {
    initialiser() {
      svgAmeriques = creer(CARTE.am, $("#carte-am"));
      creer(CARTE.eu, $("#carte-eu"));
      creer(CARTE.af, $("#carte-af"));
      for (const b of document.querySelectorAll("#choix-vue button")) {
        b.addEventListener("click", () => changerVue(b.dataset.vue === "zoom"));
      }
    },
    preparer(fonction) {
      quandChoisi = fonction;
      for (const c of Object.values(chemins)) c.classList.remove("ok", "faux");
      $("#carte").classList.add("actif");
      changerVue(false);
    },
    marquer(choisi, bon) {
      $("#carte").classList.remove("actif");
      chemins[bon].classList.add("ok");
      if (choisi && choisi !== bon) chemins[choisi].classList.add("faux");
      // Les petits pays se voient mieux avec le zoom
      const p = PAISES.find((x) => x.codigo === bon);
      if ((p.zona === "central" || p.zona === "caribe") && p.codigo !== "MX") changerVue(true);
    },
  };
})();

/* ===== Déroulement du quiz ===== */

function lancerNouvellesQuestions() {
  const toutes = melanger(toutesLesQuestions());
  const n = reglages.nombre === "tout" ? toutes.length : Math.min(Number(reglages.nombre), toutes.length);
  demarrer(toutes.slice(0, n));
}

function demarrer(questions) {
  partie = { questions, index: 0, score: 0, erreurs: [], repondu: false, mode: reglages.mode };
  afficherEcran("quiz");
  poserQuestion();
}

function poserQuestion() {
  const q = partie.questions[partie.index];
  const n = partie.questions.length;
  partie.repondu = false;

  $("#progression-texte").textContent = `Question ${partie.index + 1} sur ${n}`;
  $("#score").textContent = `Score : ${partie.score}`;
  $("#barre-remplie").style.width = `${(partie.index / n) * 100}%`;
  $("#enonce").textContent = ENONCES[q.type](q.pays);
  $("#correction").hidden = true;
  $("#suivant").hidden = true;

  // Photo du dirigeant avec la question "Chef du gouvernement vers pays"
  const photo = $("#photo-question");
  photo.hidden = q.type !== "dirigente_pais";
  if (!photo.hidden) photo.src = q.pays.foto.archivo;

  const zone = $("#reponses");
  zone.innerHTML = "";
  $("#carte").hidden = q.type !== "mapa";

  if (q.type === "mapa") {
    $("#consigne").textContent = "Clique sur le pays. Utilise le zoom pour les petits pays.";
    Carte.preparer((code) => {
      if (partie.repondu) return;
      Carte.marquer(code, q.pays.codigo);
      const choisi = PAISES.find((p) => p.codigo === code);
      repondre(code === q.pays.codigo, choisi.nombre);
    });
  } else if (partie.mode === "choix") {
    $("#consigne").textContent = "Choisis la bonne réponse.";
    afficherChoix(q, zone);
  } else {
    $("#consigne").textContent = "Écris ta réponse. Les accents sont obligatoires, utilise les boutons si besoin.";
    afficherChampEcrit(q, zone);
  }
}

function afficherChoix(q, zone) {
  const bonne = valeur(q.type, q.pays);
  const autresValeurs = melanger(
    [...new Set(PAISES.filter((p) => p !== q.pays).map((p) => valeur(q.type, p)))].filter((v) => v !== bonne)
  );
  const options = melanger([bonne, ...autresValeurs.slice(0, 3)]);
  const grille = el("div", { class: "options", lang: "es" });
  for (const option of options) {
    const bouton = el("button", { type: "button" }, option);
    bouton.addEventListener("click", () => {
      if (partie.repondu) return;
      for (const b of grille.querySelectorAll("button")) {
        b.disabled = true;
        if (b.textContent === bonne) b.classList.add("ok");
      }
      if (option !== bonne) bouton.classList.add("faux");
      repondre(option === bonne, option);
    });
    grille.append(bouton);
  }
  zone.append(grille);
}

function creerChamp(etiquette) {
  const label = el("label", {}, etiquette);
  const input = el("input", {
    type: "text", lang: "es", autocomplete: "off", autocapitalize: "off",
    autocorrect: "off", spellcheck: "false", enterkeyhint: "done",
  });
  label.append(input);
  return { label, input };
}

function afficherChampEcrit(q, zone) {
  const form = el("form", { class: "ecrit" });
  let champs;
  if (q.type === "gentilicio") {
    champs = [creerChamp("Masculin"), creerChamp("Féminin")];
  } else {
    champs = [creerChamp("Ta réponse")];
  }
  champs.forEach((c) => form.append(c.label));

  // Boutons pour taper les lettres accentuées dans le dernier champ utilisé
  const lettres = el("div", { class: "lettres", role: "group", "aria-label": "Lettres accentuées" });
  let dernierChamp = champs[0].input;
  champs.forEach((c) => c.input.addEventListener("focus", () => { dernierChamp = c.input; }));
  for (const lettre of ["á", "é", "í", "ó", "ú", "ü", "ñ"]) {
    const bouton = el("button", { type: "button", lang: "es" }, lettre);
    // Empêche le champ de perdre le curseur (et le clavier du téléphone de se fermer)
    bouton.addEventListener("pointerdown", (e) => e.preventDefault());
    bouton.addEventListener("click", () => {
      const champ = dernierChamp;
      if (champ.disabled) return;
      const debut = champ.selectionStart ?? champ.value.length;
      const fin = champ.selectionEnd ?? champ.value.length;
      champ.setRangeText(lettre, debut, fin, "end");
      champ.focus();
    });
    lettres.append(bouton);
  }
  form.append(lettres);

  const actions = el("div", { class: "actions" });
  const valider = el("button", { type: "submit", class: "bouton principal" }, "Valider");
  const passer = el("button", { type: "button", class: "bouton" }, "Je ne sais pas");
  actions.append(valider, passer);
  form.append(actions);
  zone.append(form);
  champs[0].input.focus();

  const corriger = (abandon) => {
    if (partie.repondu) return;
    let resultats;
    if (q.type === "gentilicio") {
      const [m, f] = q.pays.gentilicio;
      resultats = [
        verifier(champs[0].input.value, [m]),
        verifier(champs[1].input.value, [f]),
      ];
    } else {
      resultats = [verifier(champs[0].input.value, reponsesAcceptees(q.type, q.pays))];
    }
    if (abandon) resultats = resultats.map(() => false);
    champs.forEach((c, i) => {
      c.input.disabled = true;
      c.input.classList.add(resultats[i] ? "ok" : "faux");
    });
    valider.disabled = true;
    passer.disabled = true;
    lettres.querySelectorAll("button").forEach((b) => { b.disabled = true; });
    const saisie = champs.map((c) => c.input.value.trim()).filter(Boolean).join(", ");
    repondre(resultats.every(Boolean), abandon ? "" : saisie);
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (champs.every((c) => !c.input.value.trim())) { champs[0].input.focus(); return; }
    corriger(false);
  });
  passer.addEventListener("click", () => corriger(true));
}

function repondre(juste, saisie) {
  partie.repondu = true;
  const q = partie.questions[partie.index];
  const n = partie.questions.length;
  if (juste) partie.score++;
  else partie.erreurs.push({ question: q, saisie });

  const correction = $("#correction");
  correction.className = juste ? "ok" : "faux";
  correction.innerHTML = "";
  correction.append(
    el("strong", {}, juste ? "Bonne réponse" : "Mauvaise réponse"),
    "Réponse : ",
    el("span", { lang: "es" }, bonneReponse(q.type, q.pays))
  );
  // Photo du dirigeant dans la correction de "Pays vers chef du gouvernement"
  if (q.type === "pais_dirigente") {
    correction.append(el("img", { class: "photo", src: q.pays.foto.archivo, alt: q.pays.dirigente }));
  }
  correction.hidden = false;

  $("#score").textContent = `Score : ${partie.score}`;
  $("#barre-remplie").style.width = `${((partie.index + 1) / n) * 100}%`;
  const suivant = $("#suivant");
  suivant.textContent = partie.index + 1 < n ? "Question suivante" : "Voir le résultat";
  suivant.hidden = false;
  suivant.focus({ preventScroll: true });
  correction.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function questionSuivante() {
  partie.index++;
  if (partie.index < partie.questions.length) poserQuestion();
  else afficherResultats();
}

/* ===== Résultats ===== */

function afficherResultats() {
  const n = partie.questions.length;
  const pourcentage = Math.round((partie.score / n) * 100);
  $("#score-final").textContent = `${partie.score} / ${n}`;
  $("#pourcentage").textContent = `(${pourcentage} %)`;

  let message = "Continue à t'entraîner, tu vas progresser.";
  if (pourcentage === 100) message = "Parfait, aucune erreur.";
  else if (pourcentage >= 80) message = "Très bien, encore quelques révisions.";
  else if (pourcentage >= 50) message = "Pas mal, rejoue tes erreurs pour les retenir.";
  $("#message-final").textContent = message;

  const liste = $("#liste-erreurs");
  liste.innerHTML = "";
  for (const { question, saisie } of partie.erreurs) {
    const li = el("li");
    li.append(el("div", { class: "question", lang: "es" }, ENONCES[question.type](question.pays)));
    const detail = el("div", { class: "detail" });
    detail.append("Ta réponse : ", el("b", { lang: "es" }, saisie || "aucune"));
    detail.append(el("br"), "Bonne réponse : ", el("b", { lang: "es" }, bonneReponse(question.type, question.pays)));
    li.append(detail);
    liste.append(li);
  }
  const aDesErreurs = partie.erreurs.length > 0;
  $("#titre-erreurs").hidden = !aDesErreurs;
  liste.hidden = !aDesErreurs;
  $("#rejouer-erreurs").hidden = !aDesErreurs;
  afficherEcran("resultats");
}

/* ===== Démarrage ===== */

function afficherCredits() {
  const liste = $("#liste-credits");
  for (const p of PAISES) {
    const li = el("li");
    const lien = el("a", { href: p.foto.fuente, target: "_blank", rel: "noopener" }, p.dirigente);
    li.append(lien, ` (${p.nombre}) : ${p.foto.autor}, ${p.foto.licencia}`);
    liste.append(li);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initialiserReglages();
  afficherCredits();
  Carte.initialiser();
  $("#suivant").addEventListener("click", questionSuivante);
  $("#quitter").addEventListener("click", () => afficherEcran("reglages"));
  $("#rejouer-erreurs").addEventListener("click", () => {
    demarrer(melanger(partie.erreurs.map((e) => e.question)));
  });
  $("#nouvelles-questions").addEventListener("click", lancerNouvellesQuestions);
  $("#modifier-reglages").addEventListener("click", () => afficherEcran("reglages"));
});

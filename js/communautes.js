"use strict";

/* ================================================================
   QUIZ DES COMMUNAUTÉS AUTONOMES
   Situer les communautés et 20 grandes villes sur la carte.
   Les données sont dans js/espagne.js, la carte dans js/carte-espagne.js.
   ================================================================ */

const Communautes = (() => {
  const TYPES_ESP = [
    { id: "comunidad", label: "Situer la communauté autonome (et Ceuta, Melilla)" },
    { id: "ciudad", label: "Situer l'une des 20 grandes villes" },
    { id: "nom_comunidad", label: "Écrire le nom de la communauté en couleur" },
    { id: "nom_ciudad", label: "Écrire le nom de la ville marquée" },
  ];
  const AVEC_COMUNIDAD = ["comunidad", "nom_comunidad"];
  const CLE = "quizHispano.espagne";
  const TOLERANCE_KM = 50; // une ville est juste si le clic est à moins de 50 km
  const NS = "http://www.w3.org/2000/svg";
  const P = CARTE_ESPAGNE.projection;
  const VUE = { x: -740, y: -4415, l: 1090, h: 1130 };
  // Encadré des Canaries (coordonnées de la carte)
  const CANARIAS = { x: -724, y: -3500, l: 390, h: 200 };
  // Ceuta et Melilla sont minuscules : un rond cliquable est placé juste au sud de chacune
  const RONDS = [
    { codigo: "18", lat: 35.889, lon: -5.32, decalage: 40 },
    { codigo: "19", lat: 35.292, lon: -2.938, decalage: 40 },
  ];

  let reglages = charger();
  let partie = null;
  let svg = null;
  let couche = null; // points et traits ajoutés pendant la correction
  const zonas = {}; // code : éléments cliquables
  let quandClic = null;

  const nomComunidad = (codigo) => COMUNIDADES.find((c) => c.codigo === codigo).nombre;

  /* ----- Réglages ----- */

  function charger() {
    const defaut = { types: TYPES_ESP.map((t) => t.id), nombre: "10" };
    try {
      const sauve = JSON.parse(localStorage.getItem(CLE));
      if (sauve && Array.isArray(sauve.types)) return { ...defaut, ...sauve };
    } catch (e) { /* valeurs par défaut */ }
    return defaut;
  }

  function sauver() {
    try { localStorage.setItem(CLE, JSON.stringify(reglages)); } catch (e) { /* ignoré */ }
  }

  function lire() {
    const form = $("#esp-form");
    reglages = {
      types: [...form.querySelectorAll("input[name=esp-types]:checked")].map((i) => i.value),
      nombre: form.querySelector("input[name=esp-nombre]:checked").value,
    };
    sauver();
  }

  function toutesLesQuestions() {
    const qs = [];
    for (const type of reglages.types) {
      const liste = AVEC_COMUNIDAD.includes(type) ? COMUNIDADES : CIUDADES;
      liste.forEach((item) => qs.push({ type, item }));
    }
    return qs;
  }

  function mettreAJour() {
    lire();
    const total = toutesLesQuestions().length;
    const info = $("#esp-info");
    let message = "Choisis au moins un type de questions.";
    if (total > 0) {
      const demande = reglages.nombre === "tout" ? total : Number(reglages.nombre);
      message = `${total} questions possibles avec ces réglages.`;
      if (demande > total) message += ` Le quiz en posera ${total}.`;
    }
    info.textContent = message;
    info.classList.toggle("erreur", total === 0);
    $("#esp-form button[type=submit]").disabled = total === 0;
  }

  function afficherEcran(nom) {
    for (const id of ["reglages", "quiz", "resultats"]) $(`#esp-ecran-${id}`).hidden = id !== nom;
    window.scrollTo(0, 0);
  }

  /* ----- Carte ----- */

  // Latitude et longitude vers coordonnées de la carte (les Canaries vont dans l'encadré)
  function projeter(lat, lon) {
    const canarias = lon < -12;
    return {
      x: lon * P.kx + (canarias ? P.canarias.dx : 0),
      y: -lat * P.ky + (canarias ? P.canarias.dy : 0),
    };
  }

  function deprojeter(x, y) {
    const c = CANARIAS;
    const canarias = x >= c.x && x <= c.x + c.l && y >= c.y && y <= c.y + c.h;
    return {
      lon: (x - (canarias ? P.canarias.dx : 0)) / P.kx,
      lat: -(y - (canarias ? P.canarias.dy : 0)) / P.ky,
    };
  }

  // Distance à vol d'oiseau en km
  function distanceKm(a, b) {
    const rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad;
    const dLon = (b.lon - a.lon) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(h));
  }

  const creerSvg = (balise, attributs) => {
    const e = document.createElementNS(NS, balise);
    for (const [k, v] of Object.entries(attributs)) e.setAttribute(k, v);
    return e;
  };

  // Nombre d'unités de la carte pour un pixel de l'écran
  function unitesParPixel() {
    const m = svg.getScreenCTM();
    return m && m.a > 0 ? 1 / m.a : 2;
  }

  // Dessine la carte de l'Espagne (aussi utilisée par l'onglet Révision).
  // Renvoie le svg et, pour chaque code, ses éléments cliquables.
  function construireCarte() {
    const carte = creerSvg("svg", { viewBox: `${VUE.x} ${VUE.y} ${VUE.l} ${VUE.h}`, class: "carte-svg" });
    const elements = {};
    carte.append(creerSvg("rect", { class: "mer", x: VUE.x - 500, y: VUE.y - 500, width: VUE.l + 1000, height: VUE.h + 1000 }));
    const c = CANARIAS;
    carte.append(creerSvg("rect", { class: "cadre-canarias", x: c.x, y: c.y, width: c.l, height: c.h, rx: 6 }));
    for (const [code, d] of Object.entries(CARTE_ESPAGNE.zonas)) {
      const chemin = creerSvg("path", { d, class: code === "20" ? "gibraltar" : "zona" });
      if (code !== "20") {
        chemin.dataset.code = code;
        (elements[code] = elements[code] || []).push(chemin);
      }
      carte.append(chemin);
    }
    for (const r of RONDS) {
      const vrai = projeter(r.lat, r.lon);
      carte.append(creerSvg("line", { class: "repere-ville", x1: vrai.x, y1: vrai.y, x2: vrai.x, y2: vrai.y + r.decalage }));
      const rond = creerSvg("circle", { class: "zona rond", cx: vrai.x, cy: vrai.y + r.decalage, r: 14 });
      rond.dataset.code = r.codigo;
      elements[r.codigo].push(rond);
      carte.append(rond);
    }
    return { svg: carte, zonas: elements };
  }

  // Taille des ronds de Ceuta et Melilla dans une carte : assez gros pour un doigt
  function ajusterRondsDe(carte) {
    const m = carte.getScreenCTM();
    if (!m || !m.a) return;
    const r = Math.min(30, Math.max(12, 11 / m.a));
    carte.querySelectorAll("circle.rond").forEach((c) => c.setAttribute("r", r.toFixed(1)));
  }

  function creerCarte() {
    const carte = construireCarte();
    svg = carte.svg;
    Object.assign(zonas, carte.zonas);
    couche = creerSvg("g", {});
    svg.append(couche);
    svg.addEventListener("click", (e) => {
      if (!quandClic || !$("#esp-carte").classList.contains("actif")) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      const zone = e.target.closest(".zona");
      quandClic({ x: p.x, y: p.y, code: zone ? zone.dataset.code : null });
    });
    $("#esp-carte").append(svg);
  }

  // Taille des ronds de Ceuta et Melilla : assez gros pour un doigt sur téléphone
  function ajusterRonds() {
    ajusterRondsDe(svg);
  }

  function preparerCarte(mode, fonction) {
    couche.innerHTML = "";
    svg.querySelectorAll(".zona").forEach((z) => z.classList.remove("ok", "faux", "cible"));
    const carte = $("#esp-carte");
    // Questions « écrire le nom » : la carte sert seulement à montrer le lieu
    carte.classList.toggle("actif", mode === "comunidad" || mode === "ciudad");
    carte.classList.toggle("mode-zona", mode === "comunidad");
    carte.classList.toggle("mode-ville", mode === "ciudad");
    ajusterRonds();
    quandClic = fonction;
  }

  function colorier(code, classe) {
    (zonas[code] || []).forEach((z) => z.classList.add(classe));
  }

  function point(x, y, classe) {
    couche.append(creerSvg("circle", { class: `point ${classe}`, cx: x, cy: y, r: (6 * unitesParPixel()).toFixed(1) }));
  }

  /* ----- Questions ----- */

  function enonce(q) {
    if (q.type === "nom_ciudad") return "¿Cómo se llama esta ciudad?";
    if (q.type === "nom_comunidad") {
      return q.item.codigo === "18" || q.item.codigo === "19"
        ? "¿Cómo se llama esta ciudad autónoma?"
        : "¿Cómo se llama esta comunidad autónoma?";
    }
    if (q.type === "ciudad") return `¿Dónde está la ciudad de ${q.item.nombre}?`;
    if (q.item.codigo === "18" || q.item.codigo === "19") return `¿Dónde está la ciudad autónoma de ${q.item.nombre}?`;
    const art = q.item.articulo;
    if (art === "las" || art === "los") return `¿Dónde están ${art} ${q.item.nombre}?`;
    return art ? `¿Dónde está ${art} ${q.item.nombre}?` : `¿Dónde está ${q.item.nombre}?`;
  }

  function texteIndice(q) {
    if (q.type === "ciudad") return `Communauté autonome : ${nomComunidad(q.item.comunidad)}`;
    if (q.type === "comunidad") return q.item.situacion;
    return null; // questions « écrire le nom » : l'indice montre les lettres
  }

  // Seul le nom espagnol est accepté, avec ou sans article (la Región de Murcia)
  function nomsAcceptes(item) {
    return item.articulo ? [item.nombre, `${item.articulo} ${item.nombre}`] : [item.nombre];
  }

  // Champ de réponse avec les lettres accentuées, comme dans le quiz des pays
  function afficherChamp(q) {
    const zone = $("#esp-reponses");
    const form = el("form", { class: "ecrit" });
    const { label, input } = creerChamp("Nom en espagnol");
    form.append(label);
    const lettres = el("div", { class: "lettres", role: "group", "aria-label": "Lettres accentuées" });
    for (const lettre of ["á", "é", "í", "ó", "ú", "ü", "ñ"]) {
      const bouton = el("button", { type: "button", lang: "es" }, lettre);
      bouton.addEventListener("pointerdown", (e) => e.preventDefault());
      bouton.addEventListener("click", () => {
        if (input.disabled) return;
        const debut = input.selectionStart ?? input.value.length;
        const fin = input.selectionEnd ?? input.value.length;
        input.setRangeText(lettre, debut, fin, "end");
        input.focus();
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

    const corriger = (abandon) => {
      if (partie.repondu) return;
      const saisie = abandon ? "" : input.value.trim();
      const juste = !abandon && verifier(saisie, nomsAcceptes(q.item));
      input.disabled = true;
      input.classList.add(juste ? "ok" : "faux");
      [valider, passer, ...lettres.querySelectorAll("button")].forEach((b) => { b.disabled = true; });
      svg.querySelectorAll(".cible").forEach((c) => {
        c.classList.remove("cible");
        c.classList.add(juste ? "ok" : "faux");
      });
      terminer(juste, { saisie });
    };
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!input.value.trim()) { input.focus(); return; }
      corriger(false);
    });
    passer.addEventListener("click", () => corriger(true));
    input.focus({ preventScroll: true });
  }

  function lancerNouvelles() {
    const toutes = melanger(toutesLesQuestions());
    const n = reglages.nombre === "tout" ? toutes.length : Math.min(Number(reglages.nombre), toutes.length);
    demarrer(toutes.slice(0, n));
  }

  function demarrer(questions) {
    partie = { questions, index: 0, score: 0, erreurs: [], repondu: false, indice: false, avecIndice: 0 };
    afficherEcran("quiz");
    poser();
  }

  function poser() {
    const q = partie.questions[partie.index];
    const n = partie.questions.length;
    partie.repondu = false;
    partie.indice = false;
    $("#esp-indice").disabled = false;
    $("#esp-texte-indice").hidden = true;
    $("#esp-correction").hidden = true;
    $("#esp-suivant").hidden = true;
    $("#esp-progression").textContent = `Question ${partie.index + 1} sur ${n}`;
    $("#esp-score").textContent = `Score : ${formaterScore(partie.score)}`;
    $("#esp-barre").style.width = `${(partie.index / n) * 100}%`;
    $("#esp-enonce").textContent = enonce(q);
    $("#esp-reponses").innerHTML = "";
    const consignes = {
      ciudad: `Clique à l'endroit où se trouve la ville : juste à moins de ${TOLERANCE_KM} km. Les Canaries sont dans l'encadré.`,
      comunidad: "Clique sur la communauté. Les Canaries sont dans l'encadré, Ceuta et Melilla sont représentées par un rond.",
      nom_comunidad: "Écris le nom en espagnol de la zone en couleur. Les accents sont obligatoires.",
      nom_ciudad: "Écris le nom en espagnol de la ville marquée d'un point. Les accents sont obligatoires.",
    };
    $("#esp-consigne").textContent = consignes[q.type];

    if (q.type === "nom_comunidad" || q.type === "nom_ciudad") {
      preparerCarte(q.type, null);
      if (q.type === "nom_comunidad") {
        colorier(q.item.codigo, "cible");
      } else {
        const p = projeter(q.item.lat, q.item.lon);
        point(p.x, p.y, "cible");
      }
      afficherChamp(q);
      return;
    }

    preparerCarte(q.type, (clic) => {
      if (partie.repondu) return;
      if (q.type === "comunidad") {
        if (!clic.code) return; // clic dans la mer : on attend un clic sur une communauté
        colorier(q.item.codigo, "ok");
        if (clic.code !== q.item.codigo) colorier(clic.code, "faux");
        terminer(clic.code === q.item.codigo, { choisi: nomComunidad(clic.code) });
      } else {
        const vrai = projeter(q.item.lat, q.item.lon);
        const km = Math.round(distanceKm(deprojeter(clic.x, clic.y), q.item));
        const juste = km <= TOLERANCE_KM;
        if (!juste) couche.append(creerSvg("line", { class: "ecart", x1: clic.x, y1: clic.y, x2: vrai.x, y2: vrai.y }));
        point(clic.x, clic.y, juste ? "ok" : "faux");
        point(vrai.x, vrai.y, "vrai");
        terminer(juste, { km });
      }
    });
  }

  function utiliserIndice() {
    if (partie.repondu || partie.indice) return;
    partie.indice = true;
    $("#esp-indice").disabled = true;
    const zone = $("#esp-texte-indice");
    zone.innerHTML = "";
    zone.append(el("strong", {}, "Indice : "));
    const q = partie.questions[partie.index];
    const texte = texteIndice(q);
    if (texte) {
      zone.append(texte);
    } else {
      // Première et dernière lettre de chaque mot : "Z _ _ _ _ _ _ a"
      const motif = el("span", { class: "motif", lang: "es" });
      q.item.nombre.split(" ").forEach((mot, i) => {
        if (i > 0) motif.append("  ");
        motif.append(el("span", { class: "mot" }, masquer(mot)));
      });
      zone.append(motif);
    }
    zone.hidden = false;
  }

  function terminer(juste, detail) {
    partie.repondu = true;
    $("#esp-carte").classList.remove("actif");
    $("#esp-indice").disabled = true;
    const q = partie.questions[partie.index];
    const n = partie.questions.length;
    if (juste && partie.indice) {
      partie.score += 0.5;
      partie.avecIndice++;
    } else if (juste) {
      partie.score += 1;
    } else {
      partie.erreurs.push({ question: q, detail });
    }

    let titre = juste ? "Bonne réponse" : "Mauvaise réponse";
    if (juste && partie.indice) titre = "Bonne réponse avec indice (0,5 point)";
    const correction = $("#esp-correction");
    correction.className = `correction ${juste ? "ok" : "faux"}`;
    correction.innerHTML = "";
    correction.append(el("strong", {}, titre));
    if (q.type === "nom_comunidad" || q.type === "nom_ciudad") {
      correction.append("Réponse : ", el("span", { lang: "es" }, q.item.nombre));
      if (q.type === "nom_ciudad") correction.append(" (", el("span", { lang: "es" }, nomComunidad(q.item.comunidad)), ")");
      if (!juste && detail.saisie) correction.append(el("br"), "Tu as écrit : ", el("span", { lang: "es" }, detail.saisie));
    } else if (q.type === "comunidad") {
      correction.append("Réponse : ", el("span", { lang: "es" }, q.item.oficial));
      if (!juste) correction.append(el("br"), "Tu as sélectionné : ", el("span", { lang: "es" }, detail.choisi));
    } else {
      correction.append(
        "Tu as cliqué à ", el("b", {}, `${detail.km} km`), " de ",
        el("span", { lang: "es" }, q.item.nombre), " (",
        el("span", { lang: "es" }, nomComunidad(q.item.comunidad)), ").",
        el("br"), "Le point foncé montre la vraie position."
      );
    }
    correction.hidden = false;

    $("#esp-score").textContent = `Score : ${formaterScore(partie.score)}`;
    $("#esp-barre").style.width = `${((partie.index + 1) / n) * 100}%`;
    const suivant = $("#esp-suivant");
    suivant.textContent = partie.index + 1 < n ? "Question suivante" : "Voir le résultat";
    suivant.hidden = false;
    suivant.focus({ preventScroll: true });
    correction.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function suivante() {
    partie.index++;
    if (partie.index < partie.questions.length) poser();
    else resultats();
  }

  /* ----- Résultats ----- */

  function resultats() {
    const n = partie.questions.length;
    const pourcentage = Math.round((partie.score / n) * 100);
    $("#esp-score-final").textContent = `${formaterScore(partie.score)} / ${n}`;
    let message = "Continue à t'entraîner, tu vas progresser.";
    if (pourcentage === 100) message = "Parfait, aucune erreur.";
    else if (partie.erreurs.length === 0) message = "Aucune erreur. Essaie maintenant sans indice.";
    else if (pourcentage >= 80) message = "Très bien, encore quelques révisions.";
    else if (pourcentage >= 50) message = "Pas mal, rejoue tes erreurs pour les retenir.";
    const k = partie.avecIndice;
    if (k > 0) message += k === 1 ? " 1 bonne réponse avec indice." : ` ${k} bonnes réponses avec indice.`;
    $("#esp-message").textContent = message;

    const liste = $("#esp-erreurs");
    liste.innerHTML = "";
    for (const { question: q, detail } of partie.erreurs) {
      const li = el("li");
      li.append(el("div", { class: "question", lang: "es" }, enonce(q)));
      const d = el("div", { class: "detail" });
      if (q.type === "nom_comunidad" || q.type === "nom_ciudad") {
        d.append("Ta réponse : ", el("b", { lang: "es" }, detail.saisie || "aucune"));
        d.append(el("br"), "Bonne réponse : ", el("b", { lang: "es" }, q.item.nombre));
      } else if (q.type === "comunidad") {
        d.append("Ta réponse : ", el("b", { lang: "es" }, detail.choisi));
        d.append(el("br"), "Bonne réponse : ", el("b", { lang: "es" }, q.item.oficial));
      } else {
        d.append("Ton clic : ", el("b", {}, `à ${detail.km} km`));
        d.append(el("br"), "Communauté autonome : ", el("b", { lang: "es" }, nomComunidad(q.item.comunidad)));
      }
      li.append(d);
      liste.append(li);
    }
    const aDesErreurs = partie.erreurs.length > 0;
    $("#esp-titre-erreurs").hidden = !aDesErreurs;
    liste.hidden = !aDesErreurs;
    $("#esp-rejouer-erreurs").hidden = !aDesErreurs;
    afficherEcran("resultats");
    animerJauge($("#esp-jauge"), partie.score / n, (a) => {
      $("#esp-pourcentage").textContent = Math.round(pourcentage * a);
    });
  }

  /* ----- Démarrage ----- */

  function initialiser() {
    creerCases($("#esp-types"), TYPES_ESP, "esp-types", reglages.types);
    const form = $("#esp-form");
    (form.querySelector(`input[name=esp-nombre][value="${reglages.nombre}"]`) ||
      form.querySelector("input[name=esp-nombre]")).checked = true;
    form.addEventListener("change", mettreAJour);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      lire();
      lancerNouvelles();
    });
    mettreAJour();
    creerCarte();
    window.addEventListener("resize", () => { if (svg) ajusterRonds(); });
    $("#esp-indice").addEventListener("click", utiliserIndice);
    $("#esp-suivant").addEventListener("click", suivante);
    $("#esp-quitter").addEventListener("click", () => afficherEcran("reglages"));
    $("#esp-rejouer-erreurs").addEventListener("click", () => demarrer(melanger(partie.erreurs.map((e) => e.question))));
    $("#esp-nouvelles").addEventListener("click", lancerNouvelles);
    $("#esp-modifier").addEventListener("click", () => afficherEcran("reglages"));
  }

  return { initialiser, projeter, construireCarte, ajusterRondsDe };
})();

document.addEventListener("DOMContentLoaded", () => Communautes.initialiser());

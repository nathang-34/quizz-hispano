"use strict";

/* ================================================================
   QUIZ DES COMMUNAUTÉS AUTONOMES
   Situer les communautés et les 20 plus grandes villes sur la carte.
   Les données sont dans js/espagne.js, la carte dans js/carte-espagne.js.
   ================================================================ */

const Communautes = (() => {
  const TYPES_ESP = [
    { id: "comunidad", label: "Situer la communauté autonome (et Ceuta, Melilla)" },
    { id: "ciudad", label: "Situer l'une des 20 plus grandes villes" },
  ];
  const CLE = "quizHispano.espagne";
  const TOLERANCE_KM = 50; // une ville est juste si le clic est à moins de 50 km
  const NS = "http://www.w3.org/2000/svg";
  const P = CARTE_ESPAGNE.projection;
  const VUE = { x: -740, y: -4395, l: 1090, h: 1110 };
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
    if (reglages.types.includes("comunidad")) COMUNIDADES.forEach((c) => qs.push({ type: "comunidad", item: c }));
    if (reglages.types.includes("ciudad")) CIUDADES.forEach((c) => qs.push({ type: "ciudad", item: c }));
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

  function creerCarte() {
    svg = creerSvg("svg", { viewBox: `${VUE.x} ${VUE.y} ${VUE.l} ${VUE.h}`, class: "carte-svg" });
    svg.append(creerSvg("rect", { class: "mer", x: VUE.x - 500, y: VUE.y - 500, width: VUE.l + 1000, height: VUE.h + 1000 }));
    const c = CANARIAS;
    svg.append(creerSvg("rect", { class: "cadre-canarias", x: c.x, y: c.y, width: c.l, height: c.h, rx: 6 }));
    for (const [code, d] of Object.entries(CARTE_ESPAGNE.zonas)) {
      const chemin = creerSvg("path", { d, class: code === "20" ? "gibraltar" : "zona" });
      if (code !== "20") {
        chemin.dataset.code = code;
        (zonas[code] = zonas[code] || []).push(chemin);
      }
      svg.append(chemin);
    }
    for (const r of RONDS) {
      const vrai = projeter(r.lat, r.lon);
      svg.append(creerSvg("line", { class: "repere-ville", x1: vrai.x, y1: vrai.y, x2: vrai.x, y2: vrai.y + r.decalage }));
      const rond = creerSvg("circle", { class: "zona rond", cx: vrai.x, cy: vrai.y + r.decalage, r: 14 });
      rond.dataset.code = r.codigo;
      zonas[r.codigo].push(rond);
      svg.append(rond);
    }
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
    const r = Math.min(30, Math.max(12, 11 * unitesParPixel()));
    svg.querySelectorAll("circle.rond").forEach((c) => c.setAttribute("r", r.toFixed(1)));
  }

  function preparerCarte(mode, fonction) {
    couche.innerHTML = "";
    svg.querySelectorAll(".zona").forEach((z) => z.classList.remove("ok", "faux"));
    const carte = $("#esp-carte");
    carte.classList.add("actif");
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
    if (q.type === "ciudad") return `¿Dónde está la ciudad de ${q.item.nombre}?`;
    if (q.item.codigo === "18" || q.item.codigo === "19") return `¿Dónde está la ciudad autónoma de ${q.item.nombre}?`;
    const art = q.item.articulo;
    if (art === "las" || art === "los") return `¿Dónde están ${art} ${q.item.nombre}?`;
    return art ? `¿Dónde está ${art} ${q.item.nombre}?` : `¿Dónde está ${q.item.nombre}?`;
  }

  function texteIndice(q) {
    if (q.type === "ciudad") return `Communauté autonome : ${nomComunidad(q.item.comunidad)}`;
    return q.item.situacion;
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
    $("#esp-consigne").textContent = q.type === "ciudad"
      ? `Clique à l'endroit où se trouve la ville : juste à moins de ${TOLERANCE_KM} km. Les Canaries sont dans l'encadré.`
      : "Clique sur la communauté. Les Canaries sont dans l'encadré, Ceuta et Melilla sont représentées par un rond.";

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
    zone.append(el("strong", {}, "Indice : "), texteIndice(partie.questions[partie.index]));
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
    if (q.type === "comunidad") {
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
      if (q.type === "comunidad") {
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

  return { initialiser, projeter };
})();

document.addEventListener("DOMContentLoaded", () => Communautes.initialiser());

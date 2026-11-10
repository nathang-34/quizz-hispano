"use strict";

/*
  Menu d'accueil : affiche la partie choisie selon l'adresse.
  index.html#pays ouvre le quiz des pays, index.html#conjugaison la conjugaison.
  Le bouton retour du téléphone ramène donc au menu.
*/
(() => {
  const PARTIES = {
    accueil: { sousTitre: "Choisis ce que tu veux travailler.", titre: "Révisions d'espagnol" },
    pays: { sousTitre: "Les 20 pays où l'espagnol est langue officielle", titre: "Pays hispanophones" },
    espagne: { sousTitre: "Les communautés autonomes et les 20 plus grandes villes d'Espagne", titre: "Communautés autonomes" },
    conjugaison: { sousTitre: "Évaluations de conjugaison", titre: "Conjugaison" },
  };

  function afficherPartie() {
    const demande = location.hash.slice(1);
    const nom = demande in PARTIES ? demande : "accueil";
    document.body.dataset.partie = nom;
    document.querySelector("#accueil").hidden = nom !== "accueil";
    document.querySelector("#partie-pays").hidden = nom !== "pays";
    document.querySelector("#partie-espagne").hidden = nom !== "espagne";
    document.querySelector("#partie-conjugaison").hidden = nom !== "conjugaison";
    document.querySelector("#pied-pays").hidden = nom !== "pays";
    document.querySelector("#pied-espagne").hidden = nom !== "espagne";
    document.querySelector("#bouton-menu").hidden = nom === "accueil";
    document.querySelector("#sous-titre").textContent = PARTIES[nom].sousTitre;
    document.title = nom === "accueil" ? PARTIES.accueil.titre : `${PARTIES[nom].titre} | Révisions d'espagnol`;
    window.scrollTo(0, 0);
  }

  // Silhouette de l'Amérique (tirée de la carte du quiz) en fond de la carte « Pays »
  function dessinerSilhouette() {
    const zone = document.querySelector("#silhouette-carte");
    if (!zone || typeof CARTE === "undefined") return;
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", CARTE.am.vue);
    for (const d of [CARTE.am.fond, ...Object.values(CARTE.am.pays)]) {
      const chemin = document.createElementNS(NS, "path");
      chemin.setAttribute("d", d);
      svg.append(chemin);
    }
    zone.append(svg);
  }

  // Silhouette de l'Espagne (sans les Canaries) en fond de la carte « Communautés autonomes »
  function dessinerEspagne() {
    const zone = document.querySelector("#silhouette-espagne");
    if (!zone || typeof CARTE_ESPAGNE === "undefined") return;
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "-720 -4390 1060 800");
    for (const [code, d] of Object.entries(CARTE_ESPAGNE.zonas)) {
      if (code === "05") continue;
      const chemin = document.createElementNS(NS, "path");
      chemin.setAttribute("d", d);
      svg.append(chemin);
    }
    zone.append(svg);
  }

  window.addEventListener("hashchange", afficherPartie);
  document.addEventListener("DOMContentLoaded", () => {
    dessinerSilhouette();
    dessinerEspagne();
    afficherPartie();
  });
})();

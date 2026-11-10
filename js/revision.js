"use strict";

/* ================================================================
   ONGLETS RÉVISION
   Cartes à explorer pour les Pays hispanophones et les Communautés
   autonomes : un clic sur un lieu affiche sa fiche.
   ================================================================ */

const Revision = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const creerSvg = (balise, attributs = {}) => {
    const e = document.createElementNS(NS, balise);
    for (const [k, v] of Object.entries(attributs)) e.setAttribute(k, v);
    return e;
  };
  const nombreFr = (n) => n.toLocaleString("fr-FR");

  /* ----- Onglets Quiz / Révision ----- */

  // partie : le bloc de la partie ; ecranQuiz : l'écran des questions.
  // Pendant un quiz, l'onglet Révision est bloqué (comme pendant une évaluation de conjugaison).
  function creerOnglets(partie, ecranQuiz, quandRevision) {
    const boutons = [...partie.querySelectorAll(".onglets [role=tab]")];
    const message = partie.querySelector(".verrou");
    const bloque = () => !ecranQuiz.hidden;

    function majVerrou() {
      const b = bloque();
      boutons.forEach((x) => { if (x.dataset.onglet === "revision") x.setAttribute("aria-disabled", String(b)); });
      if (!b) message.hidden = true;
    }

    function afficher(nom) {
      if (nom === "revision" && bloque()) {
        message.hidden = false;
        return;
      }
      boutons.forEach((x) => x.setAttribute("aria-selected", String(x.dataset.onglet === nom)));
      partie.querySelectorAll("[data-panneau]").forEach((p) => { p.hidden = p.dataset.panneau !== nom; });
      window.scrollTo(0, 0);
      if (nom === "revision") quandRevision();
    }

    boutons.forEach((b) => b.addEventListener("click", () => afficher(b.dataset.onglet)));
    // L'écran des questions s'affiche ou se cache : on met à jour le verrou
    new MutationObserver(majVerrou).observe(ecranQuiz, { attributes: true, attributeFilter: ["hidden"] });
    majVerrou();
  }

  // Liste de boutons (pastilles) : un clic ouvre la fiche
  function pastilles(zone, elements, quandClic) {
    const boutons = [];
    for (const item of elements) {
      const b = el("button", { type: "button", lang: "es", "aria-pressed": "false" }, item.label);
      b.addEventListener("click", () => quandClic(item.id));
      b.dataset.id = item.id;
      zone.append(b);
      boutons.push(b);
    }
    return (id) => boutons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
  }

  function ligne(dl, terme, ...valeur) {
    dl.append(el("dt", {}, terme));
    const dd = el("dd");
    dd.append(...valeur);
    dl.append(dd);
  }

  const es = (texte) => el("span", { lang: "es" }, texte);

  /* ----- Pays hispanophones ----- */

  const Pays = (() => {
    const chemins = {};
    let svgAm = null;
    let marquerListe = null;

    function creer(region, conteneur) {
      const svg = creerSvg("svg", { viewBox: region.vue, class: "carte-svg" });
      const [x, y, w, h] = region.vue.split(" ").map(Number);
      svg.append(creerSvg("rect", { class: "mer", x: x - 5000, y: y - 5000, width: w + 10000, height: h + 10000 }));
      svg.append(creerSvg("path", { class: "fond", d: region.fond }));
      for (const [code, d] of Object.entries(region.pays)) {
        const chemin = creerSvg("path", { class: "pays", d });
        chemin.dataset.code = code;
        chemins[code] = chemin;
        svg.append(chemin);
      }
      svg.addEventListener("click", (e) => {
        const cible = e.target.closest(".pays");
        if (cible) ouvrir(cible.dataset.code, false);
      });
      conteneur.append(svg);
      return svg;
    }

    function changerVue(zoom) {
      svgAm.setAttribute("viewBox", zoom ? CARTE.am.zoom : CARTE.am.vue);
      document.querySelectorAll("#rev-pays-vue button").forEach((b) => {
        b.setAttribute("aria-pressed", String((b.dataset.vue === "zoom") === zoom));
      });
    }

    function ouvrir(code, depuisListe) {
      const p = PAISES.find((x) => x.codigo === code);
      Object.values(chemins).forEach((c) => c.classList.toggle("choisi", c.dataset.code === code));
      // Petits pays : le zoom aide à les voir quand on les choisit dans la liste
      if (depuisListe && (p.zona === "central" || p.zona === "caribe") && p.codigo !== "MX") changerVue(true);
      marquerListe(code);

      const fiche = $("#rev-pays-fiche");
      fiche.innerHTML = "";
      const texte = el("div");
      texte.append(el("h3", { lang: "es" }, p.nombre));
      const dl = el("dl");
      ligne(dl, "Capitale", es(p.detalleCapital ? `${p.capital} (${p.detalleCapital})` : p.capital));
      ligne(dl, "Habitants", es(`${p.gentilicio[0]}, ${p.gentilicio[1]}`));
      ligne(dl, "Chef du gouvernement", es(`${p.dirigente} (${p.cargo})`));
      ligne(dl, "Zone", ZONES.find((z) => z.id === p.zona).label);
      texte.append(dl);
      fiche.append(texte, el("img", { class: "photo", src: p.foto.archivo, alt: p.dirigente }));
      fiche.classList.add("remplie");
      if (depuisListe) fiche.scrollIntoView({ block: "nearest", behavior: mouvementReduit() ? "auto" : "smooth" });
    }

    function initialiser() {
      svgAm = creer(CARTE.am, $("#rev-pays-am"));
      creer(CARTE.eu, $("#rev-pays-eu"));
      creer(CARTE.af, $("#rev-pays-af"));
      document.querySelectorAll("#rev-pays-vue button").forEach((b) => {
        b.addEventListener("click", () => changerVue(b.dataset.vue === "zoom"));
      });
      $("#rev-pays-fiche").append(el("p", { class: "aide" }, "Aucun pays choisi pour l'instant."));

      // Liste des pays, rangés par zone
      const liste = $("#rev-pays-liste");
      const marqueurs = [];
      for (const z of ZONES) {
        liste.append(el("h3", {}, z.label));
        const groupe = el("div", { class: "filtres" });
        liste.append(groupe);
        const pays = PAISES.filter((p) => p.zona === z.id).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        marqueurs.push(pastilles(groupe, pays.map((p) => ({ id: p.codigo, label: p.nombre })), (code) => ouvrir(code, true)));
      }
      marquerListe = (code) => marqueurs.forEach((m) => m(code));
      creerOnglets($("#partie-pays"), $("#ecran-quiz"), () => {});
    }

    return { initialiser };
  })();

  /* ----- Communautés autonomes ----- */

  const Espagne = (() => {
    let svg = null;
    let zonas = {};
    const points = {};
    let etiquettes = null;
    let noms = "comunidades";
    let marquerComunidades = null;
    let marquerCiudades = null;
    let redessinerMini = null; // mini-carte de la fiche ouverte, à redessiner si l'écran change de taille

    // Coupe un nom long en deux lignes : "Comunidad / Valenciana"
    function lignes(nom) {
      const mots = nom.split(" ");
      if (nom.length <= 12 || mots.length < 2) return [nom];
      let meilleur = 1;
      for (let i = 1; i < mots.length; i++) {
        const ecart = Math.abs(mots.slice(0, i).join(" ").length - mots.slice(i).join(" ").length);
        const ecartMeilleur = Math.abs(mots.slice(0, meilleur).join(" ").length - mots.slice(meilleur).join(" ").length);
        if (ecart < ecartMeilleur) meilleur = i;
      }
      return [mots.slice(0, meilleur).join(" "), mots.slice(meilleur).join(" ")];
    }

    // Écrit les noms sur la carte, à une taille lisible quelle que soit la largeur de l'écran
    function dessinerNoms() {
      if (!svg) return;
      const m = svg.getScreenCTM();
      if (!m || !m.a) return; // carte cachée
      const upp = 1 / m.a; // unités de la carte par pixel
      Communautes.ajusterRondsDe(svg);
      Object.values(points).forEach((c) => c.setAttribute("r", (5 * upp).toFixed(1)));
      etiquettes.innerHTML = "";
      // Points des villes : cachés quand on lit les noms des communautés, pour alléger la carte
      Object.values(points).forEach((c) => { c.style.display = noms === "comunidades" ? "none" : ""; });
      const etroit = svg.getBoundingClientRect().width < 500; // téléphone
      const taille = (etroit ? 9.5 : 11.5) * upp;
      if (noms === "comunidades") {
        for (const c of COMUNIDADES) {
          const [lat, lon, ancre] = c.etiqueta;
          const p = Communautes.projeter(lat, lon);
          const parties = lignes(c.nombre);
          const texte = creerSvg("text", {
            x: p.x, y: p.y - ((parties.length - 1) * taille) / 2,
            "font-size": taille.toFixed(1), "text-anchor": ancre || "middle", "dominant-baseline": "middle",
            class: "nom-carte nom-comunidad", lang: "es",
          });
          parties.forEach((t, i) => {
            const ts = creerSvg("tspan", { x: p.x, dy: i === 0 ? 0 : taille.toFixed(1) });
            ts.textContent = t;
            texte.append(ts);
          });
          etiquettes.append(texte);
        }
      } else if (noms === "ciudades") {
        for (const v of CIUDADES) {
          const p = Communautes.projeter(v.lat, v.lon);
          const decalage = 8 * upp;
          // Nom à droite du point, à gauche ("end"), au-dessus ("haut") ou en dessous ("bas")
          let x = p.x + decalage;
          let y = p.y;
          let alignement = "start";
          if (v.ancre === "end") { x = p.x - decalage; alignement = "end"; }
          if (v.ancre === "haut") { x = p.x; y = p.y - 11 * upp; alignement = "middle"; }
          if (v.ancre === "bas") { x = p.x; y = p.y + 12 * upp; alignement = "middle"; }
          const texte = creerSvg("text", {
            x, y, "font-size": taille.toFixed(1), "text-anchor": alignement, "dominant-baseline": "middle",
            class: "nom-carte nom-ciudad", lang: "es",
          });
          texte.textContent = v.nombre;
          etiquettes.append(texte);
        }
      }
    }

    function choisir(id) {
      svg.querySelectorAll(".choisi").forEach((x) => x.classList.remove("choisi"));
      if (id.startsWith("c")) {
        (zonas[id.slice(1)] || []).forEach((z) => z.classList.add("choisi"));
      } else {
        points[id].classList.add("choisi");
      }
      marquerComunidades(id);
      marquerCiudades(id);
    }

    function ouvrirComunidad(codigo, depuisListe) {
      const c = COMUNIDADES.find((x) => x.codigo === codigo);
      choisir("c" + codigo);
      const fiche = $("#rev-esp-fiche");
      fiche.innerHTML = "";
      const texte = el("div");
      texte.append(el("h3", { lang: "es" }, c.nombre));
      const dl = el("dl");
      ligne(dl, "Nom officiel", es(c.oficial));
      ligne(dl, "Situation", c.situacion.replace(" (dans l'encadré)", ""));
      const villes = CIUDADES.filter((v) => v.comunidad === codigo);
      if (villes.length) {
        const ul = el("ul", { class: "villes-fiche" });
        villes.forEach((v) => {
          const li = el("li");
          li.append(es(v.nombre));
          if (v.capital.startsWith("Oui")) li.append(" (capitale)");
          ul.append(li);
        });
        ligne(dl, villes.length > 1 ? "Grandes villes" : "Grande ville", ul);
      }
      texte.append(dl);
      fiche.append(texte);
      fiche.classList.add("remplie");
      // Carte de la communauté avec ses villes (seulement s'il y a des villes)
      redessinerMini = villes.length ? miniCarte(fiche, c, villes) : null;
      if (depuisListe) fiche.scrollIntoView({ block: "nearest", behavior: mouvementReduit() ? "auto" : "smooth" });
    }

    // Petite carte zoomée sur une communauté, avec l'emplacement exact de ses villes
    function miniCarte(fiche, c, villes) {
      const b = zonas[c.codigo][0].getBBox();
      const marge = Math.max(12, Math.max(b.width, b.height) * 0.1);
      const vue = [b.x - marge, b.y - marge, b.width + 2 * marge, b.height + 2 * marge];
      const mini = creerSvg("svg", {
        viewBox: vue.map((n) => n.toFixed(1)).join(" "), class: "carte-svg mini-carte",
        role: "img", "aria-label": `Carte de ${c.nombre} et de ses villes`,
      });
      mini.append(creerSvg("rect", { class: "mer", x: vue[0] - 500, y: vue[1] - 500, width: vue[2] + 1000, height: vue[3] + 1000 }));
      // Les communautés voisines en gris, celle de la fiche en couleur
      for (const [code, d] of Object.entries(CARTE_ESPAGNE.zonas)) {
        mini.append(creerSvg("path", { d, class: code === c.codigo ? "zona choisi" : "voisin" }));
      }
      const couche = creerSvg("g");
      mini.append(couche);
      const figure = el("figure", { class: "mini" });
      figure.append(mini);
      fiche.append(figure);

      // Points et noms à une taille fixe à l'écran, quelle que soit la taille de la communauté
      const dessiner = () => {
        const m = mini.getScreenCTM();
        if (!m || !m.a) return;
        const upp = 1 / m.a;
        couche.innerHTML = "";
        for (const v of villes) {
          const p = Communautes.projeter(v.lat, v.lon);
          couche.append(creerSvg("circle", { class: "ville", cx: p.x, cy: p.y, r: (5 * upp).toFixed(2) }));
          const texte = creerSvg("text", {
            x: p.x + 8 * upp, y: p.y,
            "font-size": (12 * upp).toFixed(2), "text-anchor": "start",
            "dominant-baseline": "middle", class: "nom-carte nom-ciudad", lang: "es",
          });
          texte.textContent = v.nombre;
          couche.append(texte);
          // Le nom doit rester dans la carte : à droite du point, sinon à gauche, sinon en dessous
          const largeur = texte.getComputedTextLength();
          if (p.x + 8 * upp + largeur > vue[0] + vue[2]) {
            if (p.x - 8 * upp - largeur >= vue[0]) {
              texte.setAttribute("x", p.x - 8 * upp);
              texte.setAttribute("text-anchor", "end");
            } else {
              const x = Math.min(Math.max(p.x, vue[0] + largeur / 2 + 4 * upp), vue[0] + vue[2] - largeur / 2 - 4 * upp);
              texte.setAttribute("x", x);
              texte.setAttribute("y", p.y + 14 * upp);
              texte.setAttribute("text-anchor", "middle");
            }
          }
        }
      };
      dessiner();
      return dessiner;
    }

    function ouvrirCiudad(i, depuisListe) {
      const v = CIUDADES[i];
      choisir("v" + i);
      redessinerMini = null;
      const fiche = $("#rev-esp-fiche");
      fiche.innerHTML = "";
      const texte = el("div");
      texte.append(el("h3", { lang: "es" }, v.nombre));
      const dl = el("dl");
      ligne(dl, "Communauté autonome", es(COMUNIDADES.find((c) => c.codigo === v.comunidad).nombre));
      ligne(dl, "Capitale de la communauté", v.capital);
      ligne(dl, "Habitants", `${nombreFr(v.poblacion)} (INE, 2025)`);
      texte.append(dl);
      fiche.append(texte);
      fiche.classList.add("remplie");
      if (depuisListe) fiche.scrollIntoView({ block: "nearest", behavior: mouvementReduit() ? "auto" : "smooth" });
    }

    function initialiser() {
      const carte = Communautes.construireCarte();
      svg = carte.svg;
      zonas = carte.zonas;
      CIUDADES.forEach((v, i) => {
        const p = Communautes.projeter(v.lat, v.lon);
        const point = creerSvg("circle", { class: "ville", cx: p.x, cy: p.y, r: 6 });
        point.dataset.id = "v" + i;
        points["v" + i] = point;
        svg.append(point);
      });
      etiquettes = creerSvg("g", { class: "etiquettes-carte", "aria-hidden": "true" });
      svg.append(etiquettes);
      svg.addEventListener("click", (e) => {
        const ville = e.target.closest(".ville");
        if (ville) { ouvrirCiudad(Number(ville.dataset.id.slice(1)), false); return; }
        const zone = e.target.closest(".zona");
        if (zone) ouvrirComunidad(zone.dataset.code, false);
      });
      $("#rev-esp-carte").append(svg);
      $("#rev-esp-fiche").append(el("p", { class: "aide" }, "Aucun lieu choisi pour l'instant."));

      const comunidades = [...COMUNIDADES].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
      marquerComunidades = pastilles($("#rev-esp-comunidades"),
        comunidades.map((c) => ({ id: "c" + c.codigo, label: c.nombre })), (id) => ouvrirComunidad(id.slice(1), true));
      marquerCiudades = pastilles($("#rev-esp-ciudades"),
        CIUDADES.map((v, i) => ({ id: "v" + i, label: v.nombre })), (id) => ouvrirCiudad(Number(id.slice(1)), true));

      document.querySelectorAll("#rev-esp-noms button").forEach((b) => {
        b.addEventListener("click", () => {
          noms = b.dataset.noms;
          document.querySelectorAll("#rev-esp-noms button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
          dessinerNoms();
        });
      });
      window.addEventListener("resize", () => {
        dessinerNoms();
        if (redessinerMini) redessinerMini();
      });
      creerOnglets($("#partie-espagne"), $("#esp-ecran-quiz"), dessinerNoms);
    }

    return { initialiser };
  })();

  return {
    initialiser() {
      Pays.initialiser();
      Espagne.initialiser();
    },
  };
})();

document.addEventListener("DOMContentLoaded", () => Revision.initialiser());

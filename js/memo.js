"use strict";

/* ================================================================
   MÉMO DE CONJUGAISON
   Onglets de la partie Conjugaison, liste des verbes avec leur fiche,
   tableaux des terminaisons régulières.
   ================================================================ */

const Memo = (() => {
  const NOMS_CATEGORIES = {
    irregulier: "Irrégulier",
    diphtongue: "Diphtongue",
    affaiblissement: "Affaiblissement",
    orthographe: "Orthographe",
    regulier: "Régulier",
  };
  const PERSONNES_COURTES = ["yo", "tú", "él", "nosotros", "vosotros", "ellos"];
  const EXEMPLES = ["hablar", "comer", "vivir"];

  // Règles de formation de chaque temps (en français)
  const REGLES = {
    presente: [
      "Radical (infinitif sans -ar, -er, -ir) + terminaison.",
      "Diphtongue (e > ie, o > ue) et affaiblissement (e > i) : le changement touche yo, tú, él et ellos, jamais nosotros ni vosotros (pienso, pensamos).",
      "Certains verbes ont seulement yo irrégulier : tengo, hago, pongo, salgo, conozco, quepo, sé.",
    ],
    preterito: [
      "Radical + terminaison. Les verbes en -er et en -ir ont les mêmes terminaisons.",
      "Prétérits forts : radical irrégulier + -e, -iste, -o, -imos, -isteis, -ieron, sans accent écrit. tuv- (tener), estuv- (estar), anduv- (andar), hub- (haber), pud- (poder), pus- (poner), sup- (saber), cup- (caber), quis- (querer), vin- (venir), hic- (hacer, avec hizo), dij- (decir), traj- (traer), conduj- (conducir). Après j, ellos prend -eron : dijeron.",
      "Verbes en -ir à diphtongue ou à affaiblissement : e > i et o > u à él et ellos (sintió, pidieron, durmió).",
      "Totalement irréguliers : ser et ir (fui, fuiste, fue...), dar (di, diste, dio...), ver (vi, viste, vio...). Ces monosyllabes s'écrivent sans accent.",
    ],
    imperfecto: [
      "Radical + terminaison. Les verbes en -er et en -ir ont les mêmes terminaisons.",
      "Seulement trois verbes irréguliers : ser (era), ir (iba), ver (veía).",
    ],
    futuro: [
      "Infinitif entier + terminaison. Les terminaisons sont les mêmes pour -ar, -er et -ir.",
      "Radicaux irréguliers : tendr- (tener), vendr- (venir), pondr- (poner), saldr- (salir), valdr- (valer), podr- (poder), sabr- (saber), cabr- (caber), habr- (haber), querr- (querer), har- (hacer), dir- (decir).",
    ],
    condicional: [
      "Infinitif entier + les terminaisons de l'imparfait des verbes en -er et -ir.",
      "Mêmes radicaux irréguliers qu'au futur : tendría, haría, diría...",
    ],
    subjuntivo: [
      "On part de ellos au prétérit, on enlève -ron, puis on ajoute -ra ou -se. Les deux formes sont justes.",
      "ellos tuvieron donne tuviera ou tuviese ; ellos pidieron donne pidiera ou pidiese.",
      "nosotros prend un accent écrit : tuviéramos, habláramos.",
    ],
  };

  const sansAccents = (t) => String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  let filtre = "tous";
  let ongletActuel = "eval";
  const defilement = {}; // position de la page dans chaque onglet

  /* ----- Onglets ----- */

  const verrouille = () => Conjugaison.evaluationEnCours();

  // Pendant une évaluation non corrigée, Verbes et Terminaisons sont bloqués
  function majVerrou() {
    const bloque = verrouille();
    for (const b of document.querySelectorAll(".onglets [role=tab]")) {
      if (b.dataset.onglet !== "eval") b.setAttribute("aria-disabled", String(bloque));
    }
    if (!bloque) $("#onglets-verrou").hidden = true;
  }

  function afficherOnglet(nom) {
    if (nom !== "eval" && verrouille()) {
      $("#onglets-verrou").hidden = false;
      return;
    }
    defilement[ongletActuel] = window.scrollY;
    ongletActuel = nom;
    for (const b of document.querySelectorAll(".onglets [role=tab]")) {
      b.setAttribute("aria-selected", String(b.dataset.onglet === nom));
    }
    $("#onglet-eval").hidden = nom !== "eval";
    $("#onglet-verbes").hidden = nom !== "verbes";
    $("#onglet-terminaisons").hidden = nom !== "terminaisons";
    window.scrollTo(0, defilement[nom] || 0);
  }

  /* ----- Liste des verbes ----- */

  function creerFiltres() {
    const zone = $("#memo-filtres");
    const choix = [
      { id: "tous", label: "Tous" }, { id: "irregulier", label: "Irréguliers" },
      { id: "diphtongue", label: "Diphtongue" }, { id: "affaiblissement", label: "Affaiblissement" },
      { id: "orthographe", label: "Orthographe" }, { id: "regulier", label: "Réguliers" },
    ];
    for (const c of choix) {
      const b = el("button", { type: "button", "aria-pressed": String(c.id === filtre) }, c.label);
      b.addEventListener("click", () => {
        filtre = c.id;
        zone.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        afficherListe();
      });
      zone.append(b);
    }
  }

  function afficherListe() {
    const recherche = sansAccents($("#memo-recherche").value.trim());
    const verbes = VERBOS
      .filter((v) => filtre === "tous" || categoriesVerbe(v).has(filtre))
      .filter((v) => !recherche || sansAccents(v.inf).includes(recherche) || sansAccents(v.fr).includes(recherche))
      .sort((a, b) => a.inf.localeCompare(b.inf, "es"));
    const liste = $("#memo-liste");
    liste.innerHTML = "";
    for (const v of verbes) {
      const bouton = el("button", { type: "button", class: "ligne-verbe" });
      bouton.append(el("b", { lang: "es" }, v.inf), el("span", { class: "traduction" }, v.fr));
      const etiquettes = el("span", { class: "etiquettes" });
      for (const c of categoriesVerbe(v)) etiquettes.append(el("span", { class: "etiquette" }, NOMS_CATEGORIES[c]));
      bouton.append(etiquettes);
      bouton.addEventListener("click", () => ouvrirFiche(v.inf));
      const li = el("li");
      li.append(bouton);
      liste.append(li);
    }
    $("#memo-compte").textContent = verbes.length === 0
      ? "Aucun verbe ne correspond."
      : `${verbes.length} verbe${verbes.length > 1 ? "s" : ""}`;
  }

  /* ----- Fiche d'un verbe ----- */

  // Conjugaison qu'aurait le verbe s'il était parfaitement régulier
  function formesRegulieres(base, temps) {
    const inf = base.replace("í", "i");
    const classe = inf.slice(-2);
    const groupe = classe === "ar" ? "ar" : "er";
    const r = inf.slice(0, -2);
    if (temps === "presente") return TERMINAISONS.presente[classe].map((f) => r + f);
    if (temps === "preterito") return TERMINAISONS.preterito[groupe].map((f) => r + f);
    if (temps === "imperfecto") return TERMINAISONS.imperfecto[groupe].map((f) => r + f);
    if (temps === "futuro" || temps === "condicional") return TERMINAISONS[temps].map((f) => inf + f);
    const b = r + (groupe === "ar" ? "a" : "ie");
    const bNous = b.slice(0, -1) + ACCENTUEE[b.slice(-1)];
    return TERMINAISONS.subjRa.map((f, p) => (p === 3 ? bNous : b) + f);
  }

  // Ce qu'il faut retenir sur le verbe, en une ou deux phrases
  function remarques(base, d) {
    const notes = [];
    if (d.modelo) notes.push(`Se conjugue comme ${d.modelo}.`);
    if (d.dip === "ie" || d.dip === "ue") {
      notes.push(`Diphtongue ${d.dip === "ie" ? "e > ie" : "o > ue"} au présent, sauf nosotros et vosotros.`);
      if (base.endsWith("ir") && !d.pret) notes.push(`Au prétérit, ${d.dip === "ie" ? "e > i" : "o > u"} à él et ellos, puis à tout l'imparfait du subjonctif.`);
    }
    if (d.dip === "i") {
      notes.push(d.pret
        ? "Affaiblissement e > i au présent, sauf nosotros et vosotros."
        : "Affaiblissement e > i au présent (sauf nosotros et vosotros), au prétérit (él, ellos) et à tout l'imparfait du subjonctif.");
    }
    if (d.yo) notes.push(`1re personne irrégulière au présent : ${d.yo}.`);
    if (typeof d.pret === "string") notes.push(`Prétérit fort sur le radical ${d.pret}-.`);
    if (d.fut) notes.push(`Futur et conditionnel sur le radical ${d.fut}-.`);
    return notes;
  }

  function ouvrirFiche(infinitif) {
    const v = BANQUE.get(infinitif);
    if (!v) return;
    const { base, reflechi } = analyserVerbe(v.inf);
    const d = particularites(base, v.inf);
    const fiche = $("#memo-fiche");
    fiche.innerHTML = "";

    const retour = el("button", { type: "button", class: "bouton lien retour" }, "← Retour à la liste");
    retour.addEventListener("click", fermerFiche);
    fiche.append(retour);

    const titre = el("h2", { class: "titre-fiche" });
    titre.append(el("span", { lang: "es" }, v.inf), " ", el("span", { class: "traduction" }, v.fr));
    fiche.append(titre);
    const etiquettes = el("p", { class: "etiquettes" });
    for (const c of categoriesVerbe(v)) etiquettes.append(el("span", { class: "etiquette" }, NOMS_CATEGORIES[c]));
    fiche.append(etiquettes);

    const notes = remarques(base, d);
    if (notes.length) {
      const ul = el("ul", { class: "remarques" });
      notes.forEach((n) => ul.append(el("li", {}, n)));
      fiche.append(ul);
    }
    fiche.append(el("p", { class: "aide" },
      "En couleur : les formes qui s'écartent de la conjugaison régulière. él vaut aussi pour ella et usted, ellos pour ellas et ustedes."));

    const grille = el("div", { class: "grille-temps" });
    for (const t of TEMPS) {
      const formes = conjuguer(base, t.id, d);
      const regulieres = formesRegulieres(base, t.id);
      const carte = el("div", { class: "carte-temps" });
      carte.append(el("h3", {}, t.label));
      const table = el("table", { lang: "es" });
      formes.forEach((alts, p) => {
        const tr = el("tr");
        tr.append(el("th", { scope: "row" }, PERSONNES_COURTES[p]));
        const td = el("td");
        const pronom = reflechi ? REFLECHIS[p] + " " : "";
        const affichees = t.id === "subjuntivo" ? alts : [alts[0]];
        affichees.forEach((f, i) => {
          if (i > 0) td.append(" / ");
          const irr = i === 0 && f !== regulieres[p];
          td.append(pronom, irr ? el("span", { class: "irr" }, f) : f);
        });
        tr.append(td);
        table.append(tr);
      });
      carte.append(table);
      grille.append(carte);
    }
    fiche.append(grille);

    $("#memo-zone-liste").hidden = true;
    fiche.hidden = false;
    window.scrollTo(0, 0);
  }

  function fermerFiche() {
    $("#memo-fiche").hidden = true;
    $("#memo-zone-liste").hidden = false;
    window.scrollTo(0, 0);
  }

  /* ----- Terminaisons ----- */

  function afficherTerminaisons() {
    const zone = $("#memo-terminaisons");
    for (const t of TEMPS) {
      const carte = el("section", { class: "carte-terminaisons" });
      carte.append(el("h3", {}, t.label));
      const table = el("table", { lang: "es" });
      const entete = el("tr");
      entete.append(el("th"));
      EXEMPLES.forEach((v) => entete.append(el("th", { scope: "col" }, `-${v.slice(-2)}`)));
      table.append(entete);
      const conjugues = EXEMPLES.map((v) => conjuguer(v, t.id));
      for (let p = 0; p < 6; p++) {
        const tr = el("tr");
        tr.append(el("th", { scope: "row" }, PERSONNES_COURTES[p]));
        EXEMPLES.forEach((v, k) => {
          // Le radical est l'infinitif entier au futur et au conditionnel
          const coupe = t.id === "futuro" || t.id === "condicional" ? v.length : v.length - 2;
          const td = el("td");
          const formes = t.id === "subjuntivo" ? conjugues[k][p] : [conjugues[k][p][0]];
          formes.forEach((f, i) => {
            if (i > 0) td.append(el("br"));
            td.append(f.slice(0, coupe), el("b", {}, f.slice(coupe)));
          });
          tr.append(td);
        });
        table.append(tr);
      }
      const cadre = el("div", { class: "cadre-table" });
      cadre.append(table);
      carte.append(cadre);
      const regles = el("ul", { class: "remarques" });
      REGLES[t.id].forEach((r) => regles.append(el("li", {}, r)));
      carte.append(regles);
      zone.append(carte);
    }
  }

  return {
    initialiser() {
      for (const b of document.querySelectorAll(".onglets [role=tab]")) {
        b.addEventListener("click", () => afficherOnglet(b.dataset.onglet));
      }
      creerFiltres();
      $("#memo-recherche").addEventListener("input", afficherListe);
      afficherListe();
      afficherTerminaisons();
    },
    majVerrou,
    // Ouvre la fiche d'un verbe depuis une correction
    ouvrirVerbe(infinitif) {
      afficherOnglet("verbes");
      ouvrirFiche(infinitif);
    },
  };
})();

document.addEventListener("DOMContentLoaded", () => Memo.initialiser());

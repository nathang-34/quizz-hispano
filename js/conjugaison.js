"use strict";

/* ================================================================
   MOTEUR DE CONJUGAISON
   Conjugue un verbe à partir des règles et des particularités
   indiquées dans js/verbes.js.
   ================================================================ */

const TEMPS = [
  { id: "presente", label: "Présent de l'indicatif", titre: "Mets au présent de l'indicatif" },
  { id: "preterito", label: "Prétérit", titre: "Mets au prétérit" },
  { id: "imperfecto", label: "Imparfait de l'indicatif", titre: "Mets à l'imparfait de l'indicatif" },
  { id: "futuro", label: "Futur", titre: "Mets au futur" },
  { id: "condicional", label: "Conditionnel", titre: "Mets au conditionnel" },
  { id: "subjuntivo", label: "Imparfait du subjonctif", titre: "Mets à l'imparfait du subjonctif" },
];

const CATEGORIES = [
  { id: "irregulier", label: "Irréguliers" },
  { id: "diphtongue", label: "À diphtongue (e > ie, o > ue)" },
  { id: "affaiblissement", label: "À affaiblissement (e > i, o > u)" },
  { id: "orthographe", label: "Changements d'orthographe (busqué, cojo, leyó)" },
  { id: "regulier", label: "Réguliers" },
];

// Les 6 personnes et les pronoms qui peuvent être demandés pour chacune
const PERSONNES = [
  ["yo"], ["tú"], ["él", "ella", "usted"],
  ["nosotros", "nosotras"], ["vosotros", "vosotras"], ["ellos", "ellas", "ustedes"],
];
const NOMS_PERSONNES = ["yo", "tú", "él, ella, usted", "nosotros, nosotras", "vosotros, vosotras", "ellos, ellas, ustedes"];
const REFLECHIS = ["me", "te", "se", "nos", "os", "se"];
const PRONOMS_OBJET = ["los", "las", "les", "lo", "la", "le"];

const TERMINAISONS = {
  presente: {
    ar: ["o", "as", "a", "amos", "áis", "an"],
    er: ["o", "es", "e", "emos", "éis", "en"],
    ir: ["o", "es", "e", "imos", "ís", "en"],
  },
  preterito: {
    ar: ["é", "aste", "ó", "amos", "asteis", "aron"],
    er: ["í", "iste", "ió", "imos", "isteis", "ieron"],
  },
  fort: ["e", "iste", "o", "imos", "isteis", "ieron"], // tuve, tuviste, tuvo...
  imperfecto: {
    ar: ["aba", "abas", "aba", "ábamos", "abais", "aban"],
    er: ["ía", "ías", "ía", "íamos", "íais", "ían"],
  },
  futuro: ["é", "ás", "á", "emos", "éis", "án"],
  condicional: ["ía", "ías", "ía", "íamos", "íais", "ían"],
  subjRa: ["ra", "ras", "ra", "ramos", "rais", "ran"],
  subjSe: ["se", "ses", "se", "semos", "seis", "sen"],
};

// Verbes en -cer / -cir après une voyelle qui ne prennent PAS -zc- (conozco)
const SANS_ZC = ["hacer", "deshacer", "rehacer", "satisfacer", "decir", "cocer", "mecer"];
const ACCENTUEE = { a: "á", e: "é", i: "í", o: "ó", u: "ú" };
const PERSONNES_FORTES = [0, 1, 2, 5]; // celles où la diphtongue apparaît au présent

const BANQUE = new Map(VERBOS.map((v) => [v.inf, v]));
const enListe = (x) => (Array.isArray(x) ? x : [x]);

// "alabarlo" donne { base: "alabar", objet: "lo" } ; "acostarse" donne { base: "acostar", reflechi: true }
function analyserVerbe(infinitif) {
  let base = infinitif.toLowerCase().trim();
  let objet = null;
  let reflechi = false;
  for (const p of PRONOMS_OBJET) {
    if (base.endsWith(p) && /(ar|er|ir|ír)$/.test(base.slice(0, -p.length))) {
      objet = p;
      base = base.slice(0, -p.length);
      break;
    }
  }
  if (/(ar|er|ir|ír)se$/.test(base)) {
    reflechi = true;
    base = base.slice(0, -2);
  }
  return { base, objet, reflechi };
}

// Particularités du verbe : celles du verbe simple, complétées par celles du pronominal
function particularites(base, complet) {
  const d = { ...(BANQUE.get(base) || {}), ...(BANQUE.get(complet) || {}) };
  delete d.inf;
  delete d.fr;
  return d;
}

const prendZc = (inf) => /[aeiou]c(er|ir)$/.test(inf) && !SANS_ZC.includes(inf);

// Remplace la dernière voyelle "de" du radical : piens-, vuelv-, pid-
function changerVoyelle(radical, de, vers) {
  const i = radical.lastIndexOf(de);
  if (i < 0) return radical;
  let r = radical.slice(0, i) + vers + radical.slice(i + 1);
  if (r.startsWith("ue")) r = "h" + r; // oler : huelo
  if (r.startsWith("ie")) r = "y" + r.slice(1); // errar : yerro
  return r;
}

function diphtonguer(radical, dip) {
  if (dip === "ie") return changerVoyelle(radical, "e", "ie");
  if (dip === "ue") return changerVoyelle(radical, radical.includes("o") ? "o" : "u", "ue"); // jugar : juego
  if (dip === "i") return changerVoyelle(radical, "e", "i");
  return radical;
}

// Colle radical et terminaison en gardant le son : busqué, llegué, empecé, cojo, sigo, conozco, venzo
// brut : colle sans rien changer (sert seulement à repérer les changements d'orthographe)
function joindre(radical, fin, classe, zc, brut) {
  if (brut) return radical + fin;
  let r = radical;
  const devantE = "eé".includes(fin[0]);
  const devantOA = "oaóá".includes(fin[0]);
  if (classe === "ar" && devantE) {
    if (r.endsWith("c")) r = r.slice(0, -1) + "qu";
    else if (r.endsWith("gu")) r = r.slice(0, -2) + "gü";
    else if (r.endsWith("g")) r += "u";
    else if (r.endsWith("z")) r = r.slice(0, -1) + "c";
  }
  if (classe !== "ar" && devantOA) {
    if (r.endsWith("c")) r = r.slice(0, -1) + (zc ? "zc" : "z");
    else if (r.endsWith("gu")) r = r.slice(0, -1);
    else if (r.endsWith("g")) r = r.slice(0, -1) + "j";
    else if (r.endsWith("qu")) r = r.slice(0, -2) + "c";
  }
  return r + fin;
}

/*
  Renvoie les 6 personnes du temps demandé.
  Chaque personne est une liste de formes acceptées (la première est celle affichée) :
  [["tuviera", "tuviese"], ["tuvieras", "tuvieses"], ...]
  Deux réglages servent seulement à trouver la catégorie du verbe à chaque temps :
  d.simple enlève les irrégularités automatiques (conozco, construyo, conduje),
  d.brut enlève en plus les changements d'orthographe (busqué, cojo, leyó).
*/
function conjuguer(base, temps, d = particularites(base, base)) {
  if (d.modelo) {
    const prefixe = base.slice(0, base.length - d.modelo.length);
    return conjuguer(d.modelo, temps).map((formes) => formes.map((f) => prefixe + f));
  }
  const inf = base.replace("í", "i"); // oír, reír
  const classe = inf.slice(-2);
  const groupe = classe === "ar" ? "ar" : "er";
  const radical = inf.slice(0, -2);
  const brut = Boolean(d.brut);
  const zc = !d.simple && prendZc(inf);
  const uir = /[^gq]uir$/.test(inf); // construir : construyo

  if (temps === "presente") {
    if (d.pres) return d.pres.map(enListe);
    return TERMINAISONS.presente[classe].map((fin, p) => {
      if (p === 0 && d.yo) return [d.yo];
      let r = radical;
      if (PERSONNES_FORTES.includes(p)) {
        r = diphtonguer(r, d.dip);
        if (d.tilde && !brut) {
          const i = Math.max(r.lastIndexOf("i"), r.lastIndexOf("u"));
          r = r.slice(0, i) + ACCENTUEE[r[i]] + r.slice(i + 1);
        }
        if (uir && !d.simple) r += "y";
      }
      return [joindre(r, fin, classe, zc, brut)];
    });
  }

  if (temps === "preterito") {
    if (Array.isArray(d.pret)) return d.pret.map(enListe);
    if (d.pret || (!d.simple && /ducir$/.test(inf))) {
      // Prétérit fort : tuve, tuvo, dijeron, condujeron
      const r = d.pret || radical.slice(0, -1) + "j";
      return TERMINAISONS.fort.map((fin, p) => {
        const f = p === 5 && r.endsWith("j") ? "eron" : fin;
        return [joindre(r, f, "er", false)];
      });
    }
    return TERMINAISONS.preterito[groupe].map((fin, p) => {
      let r = radical;
      let f = fin;
      const troisieme = p === 2 || p === 5;
      // Verbes en -ir : sintió, durmió, pidió
      if (classe === "ir" && d.dip && troisieme) {
        r = d.dip === "ue" ? changerVoyelle(r, "o", "u") : changerVoyelle(r, "e", "i");
      }
      if (groupe === "er" && !brut) {
        if (troisieme && (/[aeo]$/.test(r) || (uir && r.endsWith("u")))) f = "y" + f.slice(1); // leyó, construyeron
        else if (troisieme && /(ñ|ll)$/.test(r)) f = f.slice(1); // riñó, riñeron
        if (/[aeo]$/.test(r) && f.startsWith("i")) f = "í" + f.slice(1); // leíste, oímos
      }
      return [joindre(r, f, classe, zc, brut)];
    });
  }

  if (temps === "imperfecto") {
    if (d.imp) return d.imp.map(enListe);
    return TERMINAISONS.imperfecto[groupe].map((fin) => [radical + fin]);
  }

  if (temps === "futuro" || temps === "condicional") {
    const r = d.fut || inf;
    return TERMINAISONS[temps].map((fin) => [r + fin]);
  }

  if (temps === "subjuntivo") {
    // Se forme sur la 3e personne du pluriel du prétérit : tuvieron donne tuviera / tuviese
    const ellos = conjuguer(base, "preterito", d)[5][0];
    const r = ellos.slice(0, -3);
    const rNous = r.slice(0, -1) + ACCENTUEE[r.slice(-1)];
    return [0, 1, 2, 3, 4, 5].map((p) => {
      const rr = p === 3 ? rNous : r;
      return [rr + TERMINAISONS.subjRa[p], rr + TERMINAISONS.subjSe[p]];
    });
  }
  throw new Error("Temps inconnu : " + temps);
}

// Formes attendues pour une question { temps, verbe, pronom, p }
function solution(q) {
  const { base, objet, reflechi } = analyserVerbe(q.verbe);
  const d = particularites(base, reflechi ? base + "se" : base);
  const toutes = conjuguer(base, q.temps, d);
  const avecPronoms = (p, f) => [reflechi ? REFLECHIS[p] : "", objet || "", f].filter(Boolean).join(" ");
  const formes = toutes[q.p].map((f) => avecPronoms(q.p, f));
  return {
    formes,
    // Le pronom sujet est toléré au début : "usted se volvió"
    acceptees: [...formes, ...formes.map((f) => `${q.pronom} ${f}`)],
    tableau: toutes.map((alts, p) => alts.map((f) => avecPronoms(p, f)).join(" / ")),
  };
}

/*
  Catégories d'un verbe à un temps donné. Le verbe est conjugué quatre fois :
  avec ses vraies formes, sans ses irrégularités, sans les changements d'orthographe,
  puis sans changement de voyelle. Chaque différence donne une catégorie.
  Exemple : tener est irrégulier au futur (tendré) mais régulier à l'imparfait (tenía).
*/
const CACHE_CATEGORIES = new Map();
function categoriesTemps(v, temps) {
  const cle = v.inf + "|" + temps;
  if (CACHE_CATEGORIES.has(cle)) return CACHE_CATEGORIES.get(cle);
  const { base } = analyserVerbe(v.inf);
  const d = particularites(base, v.inf);
  let cats;
  if (d.modelo) {
    cats = categoriesTemps(BANQUE.get(d.modelo), temps); // obtener comme tener
  } else {
    // Avec un prétérit fort (vine, dije), le changement de voyelle n'est pas un affaiblissement :
    // viniera et dijera sont irréguliers
    const dip = d.pret && (temps === "preterito" || temps === "subjuntivo") ? undefined : d.dip;
    const complet = conjuguer(base, temps, d);
    const simple = conjuguer(base, temps, { dip, tilde: d.tilde, simple: true });
    const brut = conjuguer(base, temps, { dip, simple: true, brut: true });
    const sansVoyelle = conjuguer(base, temps, { simple: true, brut: true });
    const pareil = (a, b) => a.join("/") === b.join("/");
    cats = new Set();
    // Personne par personne : une forme irrégulière (digo) ne compte pas aussi pour l'orthographe
    for (let p = 0; p < 6; p++) {
      if (!pareil(complet[p], simple[p])) { cats.add("irregulier"); continue; }
      if (!pareil(simple[p], brut[p])) cats.add("orthographe");
      if (!pareil(brut[p], sansVoyelle[p])) {
        // e > ie, o > ue au présent ; e > i et o > u partout (pido, sintió, durmieron)
        cats.add(temps === "presente" && d.dip !== "i" ? "diphtongue" : "affaiblissement");
      }
    }
    if (cats.size === 0) cats.add("regulier");
  }
  CACHE_CATEGORIES.set(cle, cats);
  return cats;
}

// Résumé sur tous les temps (onglet Verbes) : "Réguliers" seulement si le verbe l'est partout
function categoriesVerbe(v) {
  const cats = new Set();
  for (const t of TEMPS) categoriesTemps(v, t.id).forEach((c) => cats.add(c));
  if (cats.size > 1) cats.delete("regulier");
  return cats;
}

/* ================================================================
   ÉCRANS DE LA CONJUGAISON
   ================================================================ */

const Conjugaison = (() => {
  const CLE = "quizHispano.conjugaison";
  const ROMAINS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  const PART_PRONOMS = [0.3, 0.4]; // part des questions avec pronom (minimum, maximum)
  const OBJETS = ["lo", "la", "los", "las"];
  const AVEC_OBJET = new Set(CON_PRONOMBRE_OBJETO);
  const AVEC_SE = new Set(CON_SE);
  let reglages = charger();
  let evaluation = null; // { questions, items, corrigee }

  const premiereMajuscule = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const formaterNote = (n) => String(n).replace(".", ",");
  const sansAccents = (t) => normaliser(t).normalize("NFD").replace(/[́̈]/g, "").normalize("NFC");
  const hasard = (liste) => liste[Math.floor(Math.random() * liste.length)];

  function charger() {
    const defaut = {
      temps: TEMPS.map((t) => t.id),
      categories: CATEGORIES.map((c) => c.id),
      nombre: "20",
    };
    try {
      const sauve = JSON.parse(localStorage.getItem(CLE));
      if (sauve && Array.isArray(sauve.temps) && Array.isArray(sauve.categories)) return { ...defaut, ...sauve };
    } catch (e) { /* valeurs par défaut */ }
    return defaut;
  }

  function sauver() {
    try { localStorage.setItem(CLE, JSON.stringify(reglages)); } catch (e) { /* ignoré */ }
  }

  function afficher(nom) {
    $("#conj-ecran-reglages").hidden = nom !== "reglages";
    $("#conj-ecran-eval").hidden = nom !== "eval";
    window.scrollTo(0, 0);
    if (typeof Memo !== "undefined") Memo.majVerrou();
  }

  /* ----- Réglages ----- */

  // Verbes qui sont, à ce temps, d'un des types cochés
  function verbesPour(temps) {
    return VERBOS.filter((v) => [...categoriesTemps(v, temps)].some((c) => reglages.categories.includes(c)));
  }

  // Temps cochés qui ont au moins un verbe des types cochés
  function tempsUtiles() {
    return TEMPS.map((t) => t.id).filter((t) => reglages.temps.includes(t) && verbesPour(t).length > 0);
  }

  function lire() {
    const form = $("#conj-form");
    reglages = {
      temps: [...form.querySelectorAll("input[name=conj-temps]:checked")].map((i) => i.value),
      categories: [...form.querySelectorAll("input[name=conj-categories]:checked")].map((i) => i.value),
      nombre: form.querySelector("input[name=conj-nombre]:checked").value,
    };
    sauver();
  }

  function mettreAJour() {
    lire();
    const info = $("#conj-info");
    let message;
    let possible = true;
    if (reglages.temps.length === 0) {
      message = "Choisis au moins un temps.";
      possible = false;
    } else if (reglages.categories.length === 0) {
      message = "Choisis au moins un type de verbes.";
      possible = false;
    } else {
      const utiles = tempsUtiles();
      const vides = TEMPS.filter((t) => reglages.temps.includes(t.id) && !utiles.includes(t.id));
      const noms = vides.map((t) => t.label.charAt(0).toLowerCase() + t.label.slice(1)).join(", ");
      if (utiles.length === 0) {
        message = "Aucun verbe de ces types aux temps choisis. Coche un autre temps ou un autre type de verbes.";
        possible = false;
      } else {
        const nb = new Set(utiles.flatMap((t) => verbesPour(t).map((v) => v.inf))).size;
        message = `${nb} verbes disponibles avec ces réglages.`;
        if (vides.length === 1) message += ` Aucun verbe de ces types au temps suivant, qui sera ignoré : ${noms}.`;
        if (vides.length > 1) message += ` Aucun verbe de ces types aux temps suivants, qui seront ignorés : ${noms}.`;
      }
    }
    info.textContent = message;
    info.classList.toggle("erreur", !possible);
    $("#conj-commencer").disabled = !possible;
  }

  function initialiserReglages() {
    creerCases($("#conj-temps"), TEMPS, "conj-temps", reglages.temps);
    creerCases($("#conj-categories"), CATEGORIES, "conj-categories", reglages.categories);
    const form = $("#conj-form");
    (form.querySelector(`input[name=conj-nombre][value="${reglages.nombre}"]`) ||
      form.querySelector("input[name=conj-nombre]")).checked = true;
    form.addEventListener("change", mettreAJour);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      lire();
      nouvelleEvaluation();
    });
    mettreAJour();
  }

  /* ----- Choix des questions ----- */

  function tirerQuestions() {
    const temps = tempsUtiles();
    const verbesParTemps = new Map(temps.map((t) => [t, verbesPour(t)]));
    const n = Number(reglages.nombre);
    // Répartit les questions entre les temps, le reste au hasard
    const parTemps = temps.map(() => Math.floor(n / temps.length));
    melanger(temps.map((_, i) => i)).slice(0, n % temps.length).forEach((i) => { parTemps[i]++; });

    const cases = temps.flatMap((t, i) => Array(parTemps[i]).fill(t));

    // Entre 30 et 40 % des questions portent sur un verbe avec pronom
    const min = Math.ceil(n * PART_PRONOMS[0]);
    const max = Math.floor(n * PART_PRONOMS[1]);
    const nbPronoms = min + Math.floor(Math.random() * (max - min + 1));
    const avecPronom = new Set(melanger(cases.map((_, i) => i)).slice(0, nbPronoms));

    const dejaPris = new Set();
    // Choisit un verbe pas encore utilisé dans cette évaluation (si possible)
    const piocher = (liste) => {
      if (liste.length === 0) return null;
      let libres = liste.filter((v) => !dejaPris.has(v.inf));
      if (libres.length === 0) libres = liste;
      const v = hasard(libres);
      dejaPris.add(v.inf);
      return v;
    };

    return cases.map((t, i) => {
      const verbes = verbesParTemps.get(t);
      let verbe = null;
      if (avecPronom.has(i)) {
        const v = piocher(verbes.filter((x) => variantesPronom(x).length > 0));
        if (v) verbe = hasard(variantesPronom(v));
      }
      if (!verbe) verbe = (piocher(verbes.filter((x) => !analyserVerbe(x.inf).reflechi)) || piocher(verbes)).inf;
      const p = Math.floor(Math.random() * 6);
      return { temps: t, verbe, pronom: hasard(PERSONNES[p]), p };
    });
  }

  // Formes avec pronom possibles pour un verbe : "elegirse", "alabarlo"...
  function variantesPronom(v) {
    if (analyserVerbe(v.inf).reflechi) return [v.inf];
    const formes = [];
    if (AVEC_SE.has(v.inf)) formes.push(v.inf + "se");
    if (AVEC_OBJET.has(v.inf)) formes.push(v.inf + hasard(OBJETS));
    return formes;
  }

  function nouvelleEvaluation() {
    const questions = tirerQuestions();
    lancer(questions, `Évaluation de conjugaison (${questions.length} questions)`);
  }

  /* ----- Feuille d'évaluation ----- */

  function lancer(questions, titre) {
    evaluation = { questions, titre, items: [], corrigee: false, alerte: false };
    const feuille = $("#conj-feuille");
    feuille.innerHTML = "";
    $("#conj-resultat").hidden = true;
    $("#conj-alerte").hidden = true;
    $("#conj-corriger").hidden = false;
    $("#conj-lettres").hidden = false;
    $("#conj-titre").textContent = titre;

    // Regroupe les questions qui se suivent au même temps, comme sur la feuille
    let partie = null;
    let numeroPartie = 0;
    questions.forEach((q, index) => {
      if (!partie || partie.temps !== q.temps) {
        const t = TEMPS.find((x) => x.id === q.temps);
        const section = el("section", { class: "partie-eval" });
        section.append(el("h3", {}, `${ROMAINS[numeroPartie++] || numeroPartie}) ${t.titre} :`));
        const liste = el("ol", {});
        section.append(liste);
        feuille.append(section);
        partie = { temps: q.temps, liste };
      }
      const li = el("li", { class: "item" });
      const id = `conj-q${index}`;
      const label = el("label", { for: id });
      label.append(el("span", { lang: "es" }, `${premiereMajuscule(q.verbe)} (${q.pronom})`), " :");
      const input = el("input", {
        id, type: "text", lang: "es", autocomplete: "off", autocapitalize: "off",
        autocorrect: "off", spellcheck: "false", enterkeyhint: "next",
      });
      const correction = el("div", { class: "corr-item" });
      correction.hidden = true;
      li.append(label, input, correction);
      partie.liste.append(li);
      evaluation.items.push({ q, li, input, correction });
    });

    afficher("eval");
    evaluation.items[0].input.focus({ preventScroll: true });
  }

  // Entrée passe à la question suivante
  function surEntree(e) {
    if (e.key !== "Enter" || !e.target.matches("input")) return;
    e.preventDefault();
    const i = evaluation.items.findIndex((it) => it.input === e.target);
    const suivant = evaluation.items[i + 1];
    if (suivant) suivant.input.focus();
    else $("#conj-corriger").focus();
  }

  function corriger() {
    if (!evaluation || evaluation.corrigee) return;
    const vides = evaluation.items.filter((it) => !it.input.value.trim()).length;
    if (vides > 0 && !evaluation.alerte) {
      evaluation.alerte = true;
      const alerte = $("#conj-alerte");
      alerte.textContent = vides === 1
        ? "Il reste 1 réponse vide. Clique encore sur Corriger pour corriger quand même."
        : `Il reste ${vides} réponses vides. Clique encore sur Corriger pour corriger quand même.`;
      alerte.hidden = false;
      return;
    }
    evaluation.corrigee = true;
    if (typeof Memo !== "undefined") Memo.majVerrou();
    $("#conj-alerte").hidden = true;
    $("#conj-corriger").hidden = true;
    $("#conj-lettres").hidden = true;

    let bonnes = 0;
    evaluation.items.forEach((it, i) => {
      // Les réponses se colorent l'une après l'autre
      const delai = `${Math.min(i * 40, 1200)}ms`;
      it.input.style.animationDelay = delai;
      it.correction.style.animationDelay = delai;
    });
    for (const it of evaluation.items) {
      const sol = solution(it.q);
      const saisie = it.input.value.trim();
      it.juste = verifier(saisie, sol.acceptees);
      it.input.readOnly = true;
      it.input.classList.add(it.juste ? "ok" : "faux");
      if (it.juste) { bonnes++; continue; }
      afficherCorrection(it, sol, saisie);
    }

    const total = evaluation.items.length;
    const note = Math.round((bonnes / total) * 20 * 4) / 4;
    $("#conj-detail").textContent = `${bonnes} bonne${bonnes > 1 ? "s" : ""} réponse${bonnes > 1 ? "s" : ""} sur ${total}.`;
    let message = "Continue à t'entraîner : refais tes erreurs pour les retenir.";
    if (bonnes === total) message = "Parfait, aucune erreur.";
    else if (note >= 16) message = "Très bien, il reste quelques détails à revoir.";
    else if (note >= 10) message = "Pas mal. Regarde les tableaux sous tes erreurs, puis refais-les.";
    $("#conj-message").textContent = message;
    $("#conj-refaire-erreurs").hidden = bonnes === total;
    $("#conj-resultat").hidden = false;
    $("#conj-resultat").scrollIntoView({ behavior: mouvementReduit() ? "auto" : "smooth", block: "start" });
    animerJauge($("#conj-jauge"), note / 20, (a) => {
      $("#conj-note").textContent = formaterNote(a === 1 ? note : Math.round(note * a * 2) / 2);
    });
  }

  function afficherCorrection(it, sol, saisie) {
    const c = it.correction;
    c.innerHTML = "";
    c.append("Correction : ", el("b", { lang: "es" }, sol.formes.join(" ou ")));
    if (saisie && sol.acceptees.some((f) => sansAccents(f) === sansAccents(saisie))) {
      c.append(el("span", { class: "remarque" }, " Attention aux accents."));
    }
    const t = TEMPS.find((x) => x.id === it.q.temps);
    const { base, reflechi } = analyserVerbe(it.q.verbe);
    const entree = BANQUE.get(it.q.verbe) || BANQUE.get(reflechi ? base + "se" : base) || BANQUE.get(base);
    const details = el("details", { class: "tableau-conj" });
    const resume = `Voir ${it.q.verbe} au ${t.label.toLowerCase()}` + (entree ? ` (${entree.fr})` : "");
    details.append(el("summary", {}, resume.replace("au imparfait", "à l'imparfait")));
    const table = el("table", { lang: "es" });
    sol.tableau.forEach((forme, p) => {
      const tr = el("tr", p === it.q.p ? { class: "demandee" } : {});
      tr.append(el("th", { scope: "row" }, NOMS_PERSONNES[p]), el("td", {}, forme));
      table.append(tr);
    });
    details.append(table);
    c.append(details);
    if (entree && typeof Memo !== "undefined") {
      const lien = el("button", { type: "button", class: "bouton lien lien-fiche" }, `Voir la fiche de ${entree.inf}`);
      lien.addEventListener("click", () => Memo.ouvrirVerbe(entree.inf));
      c.append(lien);
    }
    c.hidden = false;
  }

  /* ----- Lettres accentuées ----- */

  function initialiserLettres() {
    const zone = $("#conj-lettres");
    let dernier = null;
    $("#conj-feuille").addEventListener("focusin", (e) => { if (e.target.matches("input")) dernier = e.target; });
    for (const lettre of ["á", "é", "í", "ó", "ú", "ü", "ñ"]) {
      const bouton = el("button", { type: "button", lang: "es" }, lettre);
      bouton.addEventListener("pointerdown", (e) => e.preventDefault());
      bouton.addEventListener("click", () => {
        const champ = dernier || (evaluation && evaluation.items[0].input);
        if (!champ || champ.readOnly) return;
        const debut = champ.selectionStart ?? champ.value.length;
        const fin = champ.selectionEnd ?? champ.value.length;
        champ.setRangeText(lettre, debut, fin, "end");
        champ.focus();
      });
      zone.append(bouton);
    }
  }

  return {
    // Vrai quand une feuille est affichée et pas encore corrigée
    evaluationEnCours() {
      return Boolean(evaluation && !evaluation.corrigee && !$("#conj-ecran-eval").hidden);
    },
    initialiser() {
      initialiserReglages();
      initialiserLettres();
      $("#conj-feuille").addEventListener("keydown", surEntree);
      $("#conj-feuille").addEventListener("submit", (e) => e.preventDefault());
      $("#conj-corriger").addEventListener("click", corriger);
      $("#conj-quitter").addEventListener("click", () => afficher("reglages"));
      $("#conj-refaire-erreurs").addEventListener("click", () => {
        const erreurs = evaluation.items.filter((it) => !it.juste).map((it) => it.q);
        lancer(erreurs, `Tes erreurs à refaire (${erreurs.length} question${erreurs.length > 1 ? "s" : ""})`);
      });
      $("#conj-refaire").addEventListener("click", () => lancer(evaluation.questions, evaluation.titre));
      $("#conj-nouvelle").addEventListener("click", nouvelleEvaluation);
      $("#conj-reglages").addEventListener("click", () => afficher("reglages"));
    },
  };
})();

document.addEventListener("DOMContentLoaded", () => Conjugaison.initialiser());

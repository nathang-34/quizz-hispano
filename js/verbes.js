/*
  BANQUE DE VERBES
  ================
  C'est le fichier à modifier pour ajouter des verbes.

  Le site conjugue tout seul les verbes réguliers. Pour un verbe particulier,
  on indique seulement ce qui change :

    inf     l'infinitif (avec "se" pour un verbe pronominal : "acostarse")
    fr      la traduction en français
    dip     "ie" (pensar : pienso), "ue" (volver : vuelvo) ou "i" (pedir : pido).
            Pour les verbes en -ir, le prétérit et le subjonctif imparfait
            suivent automatiquement (sintió, durmió, pidió).
    yo      la 1re personne du présent si elle est irrégulière (tener : "tengo")
    pres    les 6 formes du présent, si tout le présent est irrégulier
    pret    le radical du prétérit irrégulier (tener : "tuv" donne tuve, tuvo...)
            ou bien les 6 formes du prétérit
    imp     les 6 formes de l'imparfait (seulement ser, ir et ver)
    fut     le radical irrégulier du futur et du conditionnel (tener : "tendr")
    tilde   true si le i ou le u prend un accent au présent (enviar : envío)
    modelo  un verbe qui se conjugue de la même façon (obtener : "tener")

  Le subjonctif imparfait se forme tout seul à partir du prétérit
  (tuvieron donne tuviera et tuviese). Les changements d'orthographe
  (busqué, cojo, conozco, construyo, leyó) sont aussi automatiques.

  Exemples d'ajout (garde les guillemets et la virgule à la fin) :
    { inf: "nadar", fr: "nager" },
    { inf: "cocer", fr: "cuire", dip: "ue" },
*/

const VERBOS = [
  /* ===== Irréguliers ===== */
  { inf: "ser", fr: "être",
    pres: ["soy", "eres", "es", "somos", "sois", "son"],
    pret: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
    imp: ["era", "eras", "era", "éramos", "erais", "eran"] },
  { inf: "ir", fr: "aller",
    pres: ["voy", "vas", "va", "vamos", "vais", "van"],
    pret: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
    imp: ["iba", "ibas", "iba", "íbamos", "ibais", "iban"] },
  { inf: "estar", fr: "être (état, lieu)",
    pres: ["estoy", "estás", "está", "estamos", "estáis", "están"], pret: "estuv" },
  { inf: "haber", fr: "avoir (auxiliaire)",
    pres: ["he", "has", "ha", "hemos", "habéis", "han"], pret: "hub", fut: "habr" },
  { inf: "dar", fr: "donner",
    pres: ["doy", "das", "da", "damos", "dais", "dan"],
    pret: ["di", "diste", "dio", "dimos", "disteis", "dieron"] },
  { inf: "ver", fr: "voir",
    pres: ["veo", "ves", "ve", "vemos", "veis", "ven"],
    pret: ["vi", "viste", "vio", "vimos", "visteis", "vieron"],
    imp: ["veía", "veías", "veía", "veíamos", "veíais", "veían"] },
  { inf: "tener", fr: "avoir, posséder", yo: "tengo", dip: "ie", pret: "tuv", fut: "tendr" },
  { inf: "venir", fr: "venir", yo: "vengo", dip: "ie", pret: "vin", fut: "vendr" },
  { inf: "decir", fr: "dire", yo: "digo", dip: "i", pret: "dij", fut: "dir" },
  { inf: "hacer", fr: "faire", yo: "hago", pret: "hic", fut: "har" },
  { inf: "poder", fr: "pouvoir", dip: "ue", pret: "pud", fut: "podr" },
  { inf: "querer", fr: "vouloir, aimer", dip: "ie", pret: "quis", fut: "querr" },
  { inf: "poner", fr: "mettre", yo: "pongo", pret: "pus", fut: "pondr" },
  { inf: "saber", fr: "savoir", yo: "sé", pret: "sup", fut: "sabr" },
  { inf: "caber", fr: "tenir dans, rentrer", yo: "quepo", pret: "cup", fut: "cabr" },
  { inf: "salir", fr: "sortir", yo: "salgo", fut: "saldr" },
  { inf: "valer", fr: "valoir", yo: "valgo", fut: "valdr" },
  { inf: "traer", fr: "apporter", yo: "traigo", pret: "traj" },
  { inf: "caer", fr: "tomber", yo: "caigo" },
  { inf: "oír", fr: "entendre", pres: ["oigo", "oyes", "oye", "oímos", "oís", "oyen"] },
  { inf: "andar", fr: "marcher", pret: "anduv" },
  { inf: "reír", fr: "rire",
    pres: ["río", "ríes", "ríe", "reímos", "reís", "ríen"],
    pret: ["reí", "reíste", ["rio", "rió"], "reímos", "reísteis", "rieron"] },
  { inf: "conducir", fr: "conduire" },
  { inf: "traducir", fr: "traduire" },
  { inf: "producir", fr: "produire" },
  { inf: "conocer", fr: "connaître" },
  { inf: "parecer", fr: "sembler, paraître" },
  { inf: "ofrecer", fr: "offrir" },
  { inf: "crecer", fr: "grandir, pousser" },
  { inf: "nacer", fr: "naître" },
  { inf: "obedecer", fr: "obéir" },
  { inf: "agradecer", fr: "remercier" },
  { inf: "desaparecer", fr: "disparaître" },
  { inf: "construir", fr: "construire" },
  { inf: "destruir", fr: "détruire" },
  { inf: "incluir", fr: "inclure" },
  { inf: "contribuir", fr: "contribuer" },
  { inf: "distribuir", fr: "distribuer" },
  { inf: "obtener", fr: "obtenir", modelo: "tener" },
  { inf: "mantener", fr: "maintenir", modelo: "tener" },
  { inf: "contener", fr: "contenir", modelo: "tener" },
  { inf: "detener", fr: "arrêter", modelo: "tener" },
  { inf: "sostener", fr: "soutenir", modelo: "tener" },
  { inf: "proponer", fr: "proposer", modelo: "poner" },
  { inf: "suponer", fr: "supposer", modelo: "poner" },
  { inf: "componer", fr: "composer", modelo: "poner" },
  { inf: "deshacer", fr: "défaire", modelo: "hacer" },
  { inf: "intervenir", fr: "intervenir", modelo: "venir" },
  { inf: "convenir", fr: "convenir", modelo: "venir" },
  { inf: "prevenir", fr: "prévenir", modelo: "venir" },
  { inf: "desandar", fr: "revenir sur ses pas", modelo: "andar" },
  { inf: "atraer", fr: "attirer", modelo: "traer" },
  { inf: "distraer", fr: "distraire", modelo: "traer" },
  { inf: "irse", fr: "s'en aller" },

  /* ===== Diphtongue (e > ie, o > ue) ===== */
  { inf: "pensar", fr: "penser", dip: "ie" },
  { inf: "cerrar", fr: "fermer", dip: "ie" },
  { inf: "empezar", fr: "commencer", dip: "ie" },
  { inf: "comenzar", fr: "commencer", dip: "ie" },
  { inf: "despertarse", fr: "se réveiller", dip: "ie" },
  { inf: "sentarse", fr: "s'asseoir", dip: "ie" },
  { inf: "entender", fr: "comprendre", dip: "ie" },
  { inf: "perder", fr: "perdre", dip: "ie" },
  { inf: "defender", fr: "défendre", dip: "ie" },
  { inf: "encender", fr: "allumer", dip: "ie" },
  { inf: "preferir", fr: "préférer", dip: "ie" },
  { inf: "sentir", fr: "sentir, regretter", dip: "ie" },
  { inf: "mentir", fr: "mentir", dip: "ie" },
  { inf: "invertir", fr: "investir, inverser", dip: "ie" },
  { inf: "convertir", fr: "convertir", dip: "ie" },
  { inf: "advertir", fr: "avertir", dip: "ie" },
  { inf: "divertirse", fr: "s'amuser", dip: "ie" },
  { inf: "contar", fr: "compter, raconter", dip: "ue" },
  { inf: "encontrar", fr: "trouver", dip: "ue" },
  { inf: "recordar", fr: "se souvenir de, rappeler", dip: "ue" },
  { inf: "costar", fr: "coûter", dip: "ue" },
  { inf: "mostrar", fr: "montrer", dip: "ue" },
  { inf: "probar", fr: "essayer, goûter", dip: "ue" },
  { inf: "soñar", fr: "rêver", dip: "ue" },
  { inf: "volar", fr: "voler (dans les airs)", dip: "ue" },
  { inf: "almorzar", fr: "déjeuner", dip: "ue" },
  { inf: "acostarse", fr: "se coucher", dip: "ue" },
  { inf: "volver", fr: "revenir, retourner", dip: "ue" },
  { inf: "volverse", fr: "devenir, se retourner" },
  { inf: "devolver", fr: "rendre (un objet)", dip: "ue" },
  { inf: "mover", fr: "bouger, déplacer", dip: "ue" },
  { inf: "resolver", fr: "résoudre", dip: "ue" },
  { inf: "dormir", fr: "dormir", dip: "ue" },
  { inf: "morir", fr: "mourir", dip: "ue" },
  { inf: "jugar", fr: "jouer", dip: "ue" },
  { inf: "oler", fr: "sentir (une odeur)", dip: "ue" },

  /* ===== Affaiblissement (e > i) ===== */
  { inf: "pedir", fr: "demander", dip: "i" },
  { inf: "repetir", fr: "répéter", dip: "i" },
  { inf: "servir", fr: "servir", dip: "i" },
  { inf: "seguir", fr: "suivre, continuer", dip: "i" },
  { inf: "conseguir", fr: "obtenir, réussir à", dip: "i" },
  { inf: "perseguir", fr: "poursuivre", dip: "i" },
  { inf: "vestirse", fr: "s'habiller", dip: "i" },
  { inf: "medir", fr: "mesurer", dip: "i" },
  { inf: "impedir", fr: "empêcher", dip: "i" },
  { inf: "competir", fr: "rivaliser, concourir", dip: "i" },
  { inf: "elegir", fr: "choisir, élire", dip: "i" },
  { inf: "corregir", fr: "corriger", dip: "i" },
  { inf: "reñir", fr: "gronder, se disputer", dip: "i" },
  { inf: "despedirse", fr: "dire au revoir", dip: "i" },
  { inf: "gemir", fr: "gémir", dip: "i" },

  /* ===== Changements d'orthographe ===== */
  { inf: "buscar", fr: "chercher" },
  { inf: "tocar", fr: "toucher, jouer (d'un instrument)" },
  { inf: "sacar", fr: "sortir, retirer" },
  { inf: "explicar", fr: "expliquer" },
  { inf: "practicar", fr: "pratiquer" },
  { inf: "llegar", fr: "arriver" },
  { inf: "pagar", fr: "payer" },
  { inf: "apagar", fr: "éteindre" },
  { inf: "cruzar", fr: "traverser" },
  { inf: "organizar", fr: "organiser" },
  { inf: "alcanzar", fr: "atteindre" },
  { inf: "coger", fr: "prendre, attraper" },
  { inf: "escoger", fr: "choisir" },
  { inf: "recoger", fr: "ramasser" },
  { inf: "proteger", fr: "protéger" },
  { inf: "dirigir", fr: "diriger" },
  { inf: "exigir", fr: "exiger" },
  { inf: "distinguir", fr: "distinguer" },
  { inf: "vencer", fr: "vaincre" },
  { inf: "convencer", fr: "convaincre" },
  { inf: "leer", fr: "lire" },
  { inf: "creer", fr: "croire" },
  { inf: "poseer", fr: "posséder" },
  { inf: "enviar", fr: "envoyer", tilde: true },
  { inf: "continuar", fr: "continuer", tilde: true },

  /* ===== Réguliers ===== */
  { inf: "hablar", fr: "parler" },
  { inf: "cantar", fr: "chanter" },
  { inf: "trabajar", fr: "travailler" },
  { inf: "estudiar", fr: "étudier" },
  { inf: "mirar", fr: "regarder" },
  { inf: "escuchar", fr: "écouter" },
  { inf: "comprar", fr: "acheter" },
  { inf: "llamar", fr: "appeler" },
  { inf: "tomar", fr: "prendre" },
  { inf: "viajar", fr: "voyager" },
  { inf: "ayudar", fr: "aider" },
  { inf: "bailar", fr: "danser" },
  { inf: "preparar", fr: "préparer" },
  { inf: "alabar", fr: "louer, faire l'éloge de" },
  { inf: "ganar", fr: "gagner" },
  { inf: "esperar", fr: "attendre, espérer" },
  { inf: "necesitar", fr: "avoir besoin de" },
  { inf: "olvidar", fr: "oublier" },
  { inf: "dejar", fr: "laisser" },
  { inf: "llevar", fr: "porter, emmener" },
  { inf: "pasar", fr: "passer" },
  { inf: "cambiar", fr: "changer" },
  { inf: "levantarse", fr: "se lever" },
  { inf: "llamarse", fr: "s'appeler" },
  { inf: "quedarse", fr: "rester" },
  { inf: "comer", fr: "manger" },
  { inf: "beber", fr: "boire" },
  { inf: "aprender", fr: "apprendre" },
  { inf: "comprender", fr: "comprendre" },
  { inf: "vender", fr: "vendre" },
  { inf: "correr", fr: "courir" },
  { inf: "temer", fr: "craindre" },
  { inf: "deber", fr: "devoir" },
  { inf: "prometer", fr: "promettre" },
  { inf: "responder", fr: "répondre" },
  { inf: "romper", fr: "casser, rompre" },
  { inf: "vivir", fr: "vivre" },
  { inf: "escribir", fr: "écrire" },
  { inf: "abrir", fr: "ouvrir" },
  { inf: "recibir", fr: "recevoir" },
  { inf: "decidir", fr: "décider" },
  { inf: "subir", fr: "monter" },
  { inf: "permitir", fr: "permettre" },
  { inf: "partir", fr: "partir, couper" },
  { inf: "cubrir", fr: "couvrir" },
  { inf: "asistir", fr: "assister" },
  { inf: "sufrir", fr: "souffrir" },
  { inf: "describir", fr: "décrire" },
];

/*
  VERBES AVEC PRONOM
  Dans les tirages au hasard, 30 à 40 % des questions portent sur un verbe
  avec pronom : "Alabarlo (ella)" donne "lo alababa", "Elegirse (yo)" donne "me elijo".
  Les verbes pronominaux de la banque (acostarse, irse...) comptent dans ces 30 à 40 %.
*/

// Verbes qui peuvent recevoir lo, la, los ou las : alabarlo, impedirlo, leerla
const CON_PRONOMBRE_OBJETO = [
  "tener", "hacer", "decir", "poner", "querer", "saber", "dar", "ver", "traer", "oír",
  "conducir", "traducir", "producir", "conocer", "ofrecer", "obedecer", "agradecer",
  "construir", "destruir", "incluir", "distribuir", "obtener", "mantener", "contener",
  "detener", "sostener", "proponer", "suponer", "componer", "deshacer", "prevenir",
  "atraer", "distraer",
  "pensar", "cerrar", "empezar", "comenzar", "entender", "perder", "defender", "encender",
  "preferir", "sentir", "invertir", "convertir", "advertir", "contar", "encontrar",
  "recordar", "mostrar", "probar", "soñar", "devolver", "mover", "resolver",
  "pedir", "repetir", "servir", "seguir", "conseguir", "perseguir", "medir", "impedir",
  "elegir", "corregir", "reñir",
  "buscar", "tocar", "sacar", "explicar", "practicar", "pagar", "apagar", "cruzar",
  "organizar", "alcanzar", "coger", "escoger", "recoger", "proteger", "dirigir", "exigir",
  "distinguir", "vencer", "convencer", "leer", "creer", "poseer", "enviar", "continuar",
  "cantar", "estudiar", "mirar", "escuchar", "comprar", "llamar", "tomar", "ayudar",
  "preparar", "alabar", "ganar", "esperar", "necesitar", "olvidar", "dejar", "llevar",
  "pasar", "cambiar", "comer", "beber", "aprender", "comprender", "vender", "temer",
  "prometer", "romper", "escribir", "abrir", "recibir", "decidir", "subir", "permitir",
  "cubrir", "describir",
];

// Verbes qui peuvent devenir pronominaux : elegirse, ponerse, dormirse
const CON_SE = [
  "poner", "hacer", "decir", "ver", "dormir", "morir", "caer", "reír", "sentir", "mover",
  "perder", "encontrar", "mantener", "defender", "elegir", "convertir", "cerrar", "abrir",
  "romper", "cambiar", "pasar", "llevar", "comer", "beber", "olvidar", "preparar", "mirar",
  "cruzar", "proteger", "dirigir", "conocer", "parecer", "ofrecer", "detener", "deshacer",
  "distraer", "encender", "apagar", "mostrar", "probar", "servir", "medir", "corregir",
  "sacar", "creer", "decidir", "subir", "cubrir", "escribir", "ayudar", "esperar", "dejar",
];

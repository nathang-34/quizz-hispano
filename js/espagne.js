"use strict";

/*
  DONNÉES DU QUIZ « COMMUNAUTÉS AUTONOMES »

  COMUNIDADES : les 17 communautés autonomes et les 2 villes autonomes (Ceuta, Melilla).
    codigo     code INE, le même que dans js/carte-espagne.js (ne pas changer)
    nombre     nom demandé dans la question (en espagnol)
    articulo   article à mettre devant le nom dans la question (la Región de Murcia), s'il y en a un
    oficial    nom officiel, affiché dans la correction
    situacion  indice en français (sans nommer la communauté)
    etiqueta   où écrire le nom sur la carte de l'onglet Révision : [latitude, longitude]
               (un 3e élément "start" ou "end" aligne le texte à gauche ou à droite du point)

  CIUDADES : 20 grandes villes, au moins une par communauté autonome, assez éloignées
  les unes des autres pour être placées sur la carte. Rangées de la plus peuplée à la moins peuplée.
    nombre     nom de la ville (en espagnol)
    lat, lon   position du centre-ville (latitude, longitude)
    comunidad  code de la communauté autonome (sert pour l'indice)
    poblacion  nombre d'habitants (INE, au 1er janvier 2025)
    capital    ce qu'affiche la fiche de l'onglet Révision à « Capitale de la communauté »
    ancre      (facultatif) "end" pour écrire le nom à gauche du point, "haut" au-dessus,
               "bas" en dessous (pour éviter que deux noms se chevauchent)

  Pour remplacer une ville : change ses champs. Les coordonnées se trouvent
  sur la page Wikipédia de la ville (encadré à droite, « Coordonnées »).
*/

const COMUNIDADES = [
  { codigo: "01", etiqueta: [37.55, -4.6], nombre: "Andalucía", oficial: "Andalucía", situacion: "Tout le sud de la péninsule" },
  { codigo: "02", etiqueta: [41.35, -0.75], nombre: "Aragón", oficial: "Aragón", situacion: "Nord-est, des Pyrénées jusqu'au centre, entre la Navarre et la Catalogne" },
  { codigo: "03", etiqueta: [43.2, -6.1], nombre: "Asturias", oficial: "Principado de Asturias", situacion: "Côte nord, entre la Galice et la Cantabrie" },
  { codigo: "04", etiqueta: [39.05, 2.95], nombre: "Islas Baleares", articulo: "las", oficial: "Illes Balears (Islas Baleares)", situacion: "Îles de la Méditerranée, à l'est de la péninsule" },
  { codigo: "05", etiqueta: [29.25, -15.8], nombre: "Canarias", oficial: "Canarias", situacion: "Archipel de l'Atlantique, au large de l'Afrique (dans l'encadré)" },
  { codigo: "06", etiqueta: [43.66, -4.45], nombre: "Cantabria", oficial: "Cantabria", situacion: "Côte nord, entre les Asturies et le Pays basque" },
  { codigo: "07", etiqueta: [41.8, -4.7], nombre: "Castilla y León", oficial: "Castilla y León", situacion: "Grand plateau du nord-ouest, la plus vaste communauté" },
  { codigo: "08", etiqueta: [39.35, -3.2], nombre: "Castilla-La Mancha", oficial: "Castilla-La Mancha", situacion: "Centre, au sud et à l'est de Madrid" },
  { codigo: "09", etiqueta: [41.8, 1.45], nombre: "Cataluña", oficial: "Catalunya (Cataluña)", situacion: "Nord-est, entre les Pyrénées et la Méditerranée" },
  { codigo: "10", etiqueta: [39.6, -0.65], nombre: "Comunidad Valenciana", articulo: "la", oficial: "Comunitat Valenciana (Comunidad Valenciana)", situacion: "Côte est, au bord de la Méditerranée" },
  { codigo: "11", etiqueta: [39.2, -6.15], nombre: "Extremadura", oficial: "Extremadura", situacion: "Ouest, à la frontière du Portugal" },
  { codigo: "12", etiqueta: [42.75, -7.9], nombre: "Galicia", oficial: "Galicia", situacion: "Nord-ouest, au bord de l'Atlantique" },
  { codigo: "13", etiqueta: [40.5, -3.7], nombre: "Comunidad de Madrid", articulo: "la", oficial: "Comunidad de Madrid", situacion: "Au centre de la péninsule" },
  { codigo: "14", etiqueta: [38.05, -1.5], nombre: "Región de Murcia", articulo: "la", oficial: "Región de Murcia", situacion: "Sud-est, au bord de la Méditerranée" },
  { codigo: "15", etiqueta: [42.88, -1.5], nombre: "Navarra", oficial: "Comunidad Foral de Navarra", situacion: "Nord, à la frontière de la France" },
  { codigo: "16", etiqueta: [43.62, -2.05], nombre: "País Vasco", articulo: "el", oficial: "Euskadi (País Vasco)", situacion: "Côte nord, tout près de la France" },
  { codigo: "17", etiqueta: [42.3, -2.5], nombre: "La Rioja", oficial: "La Rioja", situacion: "Nord, petite communauté sur les rives de l'Èbre" },
  { codigo: "18", etiqueta: [35.45, -5.85, "end"], nombre: "Ceuta", oficial: "Ciudad Autónoma de Ceuta", situacion: "En Afrique, juste en face de Gibraltar" },
  { codigo: "19", etiqueta: [34.85, -2.45, "start"], nombre: "Melilla", oficial: "Ciudad Autónoma de Melilla", situacion: "En Afrique, la plus à l'est des deux villes autonomes" },
];

const CIUDADES = [
  { nombre: "Madrid", lat: 40.4168, lon: -3.7038, comunidad: "13", poblacion: 3506730, capital: "Oui (et capitale de l'Espagne)" },
  { nombre: "Barcelona", ancre: "bas", lat: 41.3874, lon: 2.1686, comunidad: "09", poblacion: 1731649, capital: "Oui" },
  { nombre: "Valencia", lat: 39.4699, lon: -0.3763, comunidad: "10", poblacion: 840792, capital: "Oui" },
  { nombre: "Zaragoza", lat: 41.6488, lon: -0.8891, comunidad: "02", poblacion: 693091, capital: "Oui" },
  { nombre: "Sevilla", lat: 37.3891, lon: -5.9845, comunidad: "01", poblacion: 689423, capital: "Oui" },
  { nombre: "Málaga", lat: 36.7213, lon: -4.4214, comunidad: "01", poblacion: 599063, capital: "Non (capitale : Sevilla)" },
  { nombre: "Murcia", lat: 37.9922, lon: -1.1307, comunidad: "14", poblacion: 479405, capital: "Oui" },
  { nombre: "Palma", lat: 39.5696, lon: 2.6502, comunidad: "04", poblacion: 434786, capital: "Oui" },
  { nombre: "Las Palmas de Gran Canaria", lat: 28.1235, lon: -15.4363, comunidad: "05", poblacion: 381868, capital: "Oui, partagée avec Santa Cruz de Tenerife" },
  { nombre: "Bilbao", lat: 43.2630, lon: -2.9350, comunidad: "16", poblacion: 351124, capital: "Non (capitale : Vitoria-Gasteiz)" },
  { nombre: "Córdoba", lat: 37.8882, lon: -4.7794, comunidad: "01", poblacion: 323262, capital: "Non (capitale : Sevilla)" },
  { nombre: "Valladolid", lat: 41.6523, lon: -4.7245, comunidad: "07", poblacion: 302614, capital: "Oui, en pratique (siège du gouvernement)" },
  { nombre: "Vigo", lat: 42.2406, lon: -8.7207, comunidad: "12", poblacion: 294489, capital: "Non (capitale : Santiago de Compostela)" },
  { nombre: "Granada", lat: 37.1773, lon: -3.5986, comunidad: "01", poblacion: 233975, capital: "Non (capitale : Sevilla)" },
  { nombre: "Oviedo", ancre: "end", lat: 43.3614, lon: -5.8494, comunidad: "03", poblacion: 228119, capital: "Oui" },
  { nombre: "Pamplona", lat: 42.8125, lon: -1.6458, comunidad: "15", poblacion: 209094, capital: "Oui" },
  { nombre: "Santander", ancre: "haut", lat: 43.4623, lon: -3.8100, comunidad: "06", poblacion: 175425, capital: "Oui" },
  { nombre: "Logroño", ancre: "end", lat: 42.4627, lon: -2.4450, comunidad: "17", poblacion: 152150, capital: "Oui" },
  { nombre: "Toledo", lat: 39.8628, lon: -4.0273, comunidad: "08", poblacion: 87216, capital: "Oui" },
  { nombre: "Mérida", lat: 38.9161, lon: -6.3437, comunidad: "11", poblacion: 60225, capital: "Oui" },
];

// Le Fournil des Grès · scripts communs à toutes les pages.
(function () {
  // Horaires en minutes depuis minuit (0 = dimanche). Une seule source pour tout le site.
  var H = { 0: null, 1: [240, 1140], 2: [240, 1140], 3: [240, 1140], 4: [240, 1140], 5: [240, 1140], 6: [240, 750] };
  var JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  function fmt(m) { var h = Math.floor(m / 60), mn = m % 60; return h + " h" + (mn ? " " + String(mn).padStart(2, "0") : ""); }

  // Heure de Paris, même si le visiteur est ailleurs.
  var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  function part(t) { for (var i = 0; i < parts.length; i++) if (parts[i].type === t) return parts[i].value; }
  var j = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(part("weekday"));
  var m = parseInt(part("hour"), 10) * 60 + parseInt(part("minute"), 10);
  var auj = H[j], ouvert = !!(auj && m >= auj[0] && m < auj[1]), texte;

  if (ouvert) {
    texte = "Ouvert maintenant · jusqu'à " + fmt(auj[1]);
  } else {
    var k = j, avant = auj && m < auj[0];
    if (!avant) { do { k = (k + 1) % 7; } while (!H[k]); }
    texte = "Fermé · ouvre " + (avant ? "aujourd'hui" : k === (j + 1) % 7 ? "demain" : JOURS[k]) + " à " + fmt(H[k][0]);
  }
  document.querySelectorAll("[data-statut]").forEach(function (el) {
    el.classList.add(ouvert ? "ouvert" : "ferme");
    el.querySelector("span").textContent = texte;
  });
  document.querySelectorAll("[data-auj]").forEach(function (el) {
    el.textContent = auj ? "Aujourd'hui · " + fmt(auj[0]) + " – " + fmt(auj[1]) : "Fermé aujourd'hui";
  });
  document.querySelectorAll('.horaires li[data-j="' + j + '"]').forEach(function (li) { li.classList.add("auj"); });
  document.querySelectorAll("[data-annee]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Menu mobile
  var b = document.querySelector(".burger"), menu = document.querySelector(".menu");
  if (b && menu) b.addEventListener("click", function () {
    var o = menu.classList.toggle("ouvert");
    b.setAttribute("aria-expanded", o);
  });

  // Onglets de la page produits : défilement vers la famille choisie
  var onglets = document.querySelectorAll(".onglets button");
  onglets.forEach(function (bt) {
    bt.addEventListener("click", function () {
      onglets.forEach(function (x) { x.setAttribute("aria-pressed", x === bt); });
      var cible = document.getElementById(bt.dataset.cible);
      if (cible) cible.scrollIntoView({ behavior: "smooth" });
    });
  });
  if (onglets.length && "IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) onglets.forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.cible === e.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".famille").forEach(function (f) { obs.observe(f); });
  }

  // Apparition douce au défilement
  var rv = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vu"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("vu"); });
})();

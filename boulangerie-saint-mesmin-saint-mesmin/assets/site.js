// sites-kit · scripts communs (horaires et téléphone injectés par generer.py).
(function () {
  "use strict";
  var TEL = "+33688517021";
  // Horaires en minutes depuis minuit (0 = dimanche). Source unique pour tout le site.
  var H = {"0": [[375, 735]], "1": [[375, 735]], "2": [[375, 735]], "3": null, "4": [[375, 735]], "5": [[375, 735]], "6": [[375, 735]]};
  var JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var ABR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  var ORDRE = [1, 2, 3, 4, 5, 6, 0]; // lundi en premier
  function fmt(m) { m = m % 1440; var h = Math.floor(m / 60), mn = m % 60; return h + " h" + (mn ? " " + String(mn).padStart(2, "0") : ""); }
  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Heure de Paris, même pour un visiteur ailleurs.
  function maintenant() {
    var p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    var g = function (t) { for (var i = 0; i < p.length; i++) if (p[i].type === t) return p[i].value; };
    return { j: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday")), m: +g("hour") * 60 + +g("minute") };
  }
  // H[d] = liste de créneaux [debut, fin] (fin > 1440 = après minuit) ou null
  function cr(d) { return H[d] || []; }
  function txt(d, sep) { return cr(d).map(function (c) { return fmt(c[0]) + " – " + fmt(c[1]); }).join(sep || " / "); }
  var aucun = ORDRE.every(function (d) { return !cr(d).length; });
  var now = maintenant(), j = now.j, veille = (j + 6) % 7;
  var enCours = cr(j).filter(function (c) { return now.m >= c[0] && now.m < c[1]; })[0]
    || cr(veille).filter(function (c) { return c[1] > 1440 && now.m + 1440 < c[1]; })[0];
  var ouvert = !!enCours, texte;
  if (aucun) texte = "Horaires à confirmer";
  else if (ouvert) texte = "Ouvert · jusqu'à " + fmt(enCours[1]);
  else {
    var prochain = cr(j).filter(function (c) { return c[0] > now.m; })[0], jour = "aujourd'hui";
    for (var n = 1; !prochain && n <= 7; n++) {
      var k = (j + n) % 7;
      if (cr(k).length) { prochain = cr(k)[0]; jour = n === 1 ? "demain" : JOURS[k]; }
    }
    texte = "Fermé · ouvre " + jour + " à " + fmt(prochain[0]);
  }
  document.querySelectorAll("[data-statut]").forEach(function (el) {
    el.classList.add(aucun ? "inconnu" : ouvert ? "ouvert" : "ferme");
    el.querySelector("span").textContent = texte;
  });
  document.querySelectorAll("[data-auj]").forEach(function (el) {
    el.textContent = aucun ? "Horaires à confirmer" : cr(j).length ? "Aujourd'hui · " + txt(j) : "Fermé aujourd'hui";
  });
  document.querySelectorAll('.horaires li[data-j="' + j + '"]').forEach(function (li) { li.classList.add("auj"); });
  document.querySelectorAll("[data-annee]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Graphique de la semaine : une barre par créneau, échelle calculée sur les horaires réels
  var DEB = 1440, FIN = 0;
  ORDRE.forEach(function (d) { cr(d).forEach(function (c) { DEB = Math.min(DEB, c[0]); FIN = Math.max(FIN, c[1]); }); });
  DEB = Math.floor(DEB / 60) * 60; FIN = Math.ceil(FIN / 60) * 60;
  document.querySelectorAll("[data-semaine]").forEach(function (box) {
    if (aucun) { box.style.display = "none"; return; }
    box.innerHTML = ORDRE.map(function (d) {
      var barres = cr(d).map(function (c) {
        return '<span style="top:' + ((c[0] - DEB) / (FIN - DEB) * 100) + "%;height:" + ((c[1] - c[0]) / (FIN - DEB) * 100) + '%"></span>';
      }).join("");
      return '<div class="jour' + (cr(d).length ? "" : " ferme") + (d === j ? " auj" : "") + '"><b>' + ABR[d] + '</b><div class="barre">' + barres +
        "</div><small>" + (cr(d).length ? txt(d, "<br>") : "Fermé") + "</small></div>";
    }).join("");
  });

  // Variante « bandeau du jour » : les 7 jours en pastilles
  document.querySelectorAll("[data-jourj]").forEach(function (ul) {
    ul.innerHTML = ORDRE.map(function (d) {
      return "<li" + (d === j ? ' class="auj"' : "") + "><b>" + ABR[d] + "</b>" + (cr(d).length ? txt(d, "<br>") : aucun ? "?" : "Fermé") + "</li>";
    }).join("");
  });

  // Menu mobile
  var b = document.querySelector(".burger"), menu = document.querySelector(".menu");
  if (b && menu) b.addEventListener("click", function () {
    var o = menu.classList.toggle("ouvert");
    b.setAttribute("aria-expanded", o);
    b.setAttribute("aria-label", o ? "Fermer le menu" : "Ouvrir le menu");
  });

  // Colombages du héros : se dessinent une seule fois au chargement
  var vit = document.querySelector(".vitrine");
  if (vit && !reduit) {
    vit.querySelectorAll(".motif-svg path, .motif-svg rect, .motif-svg circle").forEach(function (el, i) {
      var l = Math.ceil(el.getTotalLength ? el.getTotalLength() : 1000);
      el.style.setProperty("--l", l);
      el.style.setProperty("--d", (0.08 * i) + "s");
    });
    requestAnimationFrame(function () { vit.classList.add("trace"); });
  }

  // Apparitions : quelques moments choisis, une seule fois, jamais au retour vers le haut
  var rv = document.querySelectorAll(".rv");
  if (!reduit && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vu"); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("vu"); });

  // Filtres de la page produits
  var filtres = document.querySelectorAll(".filtres button");
  filtres.forEach(function (bt) {
    bt.addEventListener("click", function () {
      filtres.forEach(function (x) { x.setAttribute("aria-pressed", x === bt); });
      var f = bt.dataset.f;
      document.querySelectorAll(".fiche").forEach(function (c) { c.hidden = f !== "tout" && c.dataset.cat !== f; });
    });
  });
  // Arrivée depuis l'accueil avec #pains, #viennoiseries… : on filtre directement
  var h = location.hash.slice(1);
  filtres.forEach(function (bt) { if (bt.dataset.f === h) bt.click(); });

  // ---------- Commande par SMS ----------
  var form = document.getElementById("commande");
  if (!form) return;
  var bulle = document.getElementById("bulle");
  var lignes = form.querySelectorAll(".ligne-p");
  var selJour = form.querySelector("#jour"), selHeure = form.querySelector("#heure");
  var btnSms = document.getElementById("envoyer"), btnCopie = document.getElementById("copier");

  // Jours de retrait : les 10 prochains jours ouverts (à partir de demain)
  var fmtDate = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
  var d0 = new Date(), options = [];
  for (var n = 1; options.length < 10 && n < 30; n++) {
    var dt = new Date(d0.getTime() + n * 864e5), dj = (j + n) % 7;
    if (cr(dj).length) options.push({ v: dj, t: fmtDate.format(dt) });
  }
  if (!options.length) for (var n2 = 1; n2 <= 7; n2++) options.push({ v: (j + n2) % 7, t: fmtDate.format(new Date(d0.getTime() + n2 * 864e5)) });
  selJour.innerHTML = options.map(function (o, i) { return '<option value="' + o.v + '"' + (i ? "" : " selected") + ">" + o.t.charAt(0).toUpperCase() + o.t.slice(1) + "</option>"; }).join("");
  function remplirHeures() {
    var opts = [];
    cr(+selJour.value).forEach(function (c) {
      for (var m = c[0]; m <= c[1] - 30; m += 30) opts.push('<option value="' + fmt(m) + '">' + fmt(m) + "</option>");
    });
    if (!opts.length) opts.push('<option value="(heure à convenir)">À convenir</option>');
    selHeure.innerHTML = opts.join("");
    selHeure.selectedIndex = Math.min(2, opts.length - 1);
  }
  remplirHeures();

  // Produit ajouté depuis la page produits (?p=identifiant)
  var param = new URLSearchParams(location.search).get("p");
  lignes.forEach(function (l) {
    var out = l.querySelector("output"), moins = l.querySelector("[data-moins]"), plus = l.querySelector("[data-plus]");
    function maj(v) {
      out.value = out.textContent = v;
      moins.disabled = v === 0;
      if (!reduit) { out.classList.remove("pop"); void out.offsetWidth; out.classList.add("pop"); }
      rendre();
    }
    moins.addEventListener("click", function () { maj(Math.max(0, +out.textContent - 1)); });
    plus.addEventListener("click", function () { maj(Math.min(60, +out.textContent + 1)); });
    out.textContent = l.dataset.id === param ? 1 : 0;
    moins.disabled = +out.textContent === 0;
  });

  function message() {
    var items = [];
    lignes.forEach(function (l) { var q = +l.querySelector("output").textContent; if (q) items.push("- " + q + " " + (q > 1 ? l.dataset.pluriel : l.dataset.nom)); });
    var autre = form.querySelector("#autre").value.trim();
    if (autre) items.push("- " + autre);
    if (!items.length) return null;
    var nom = form.querySelector("#nom").value.trim();
    var jourTxt = selJour.options[selJour.selectedIndex].text.toLowerCase();
    return "Bonjour, " + (nom ? "c'est " + nom + ". " : "") + "Je voudrais commander :\n" + items.join("\n") +
      "\nÀ retirer " + jourTxt + " vers " + selHeure.value + ".\nMerci !";
  }
  function rendre() {
    var m = message();
    bulle.textContent = m || "Choisissez vos produits : votre message apparaît ici.";
    bulle.classList.toggle("vide", !m);
    btnSms.setAttribute("aria-disabled", !m);
    btnSms.href = m ? "sms:" + TEL + "?&body=" + encodeURIComponent(m) : "#";
  }
  form.addEventListener("input", rendre);
  selJour.addEventListener("change", function () { remplirHeures(); rendre(); });
  btnSms.addEventListener("click", function (e) { if (btnSms.getAttribute("aria-disabled") === "true") e.preventDefault(); });

  // Copier : confirmation sur le bouton lui-même
  btnCopie.addEventListener("click", function () {
    var m = message(); if (!m) return;
    var lab = btnCopie.querySelector("span"), avant = lab.textContent;
    var ok = function () { lab.textContent = "Message copié ✓"; setTimeout(function () { lab.textContent = avant; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(m).then(ok, function () {});
  });
  rendre();
})();

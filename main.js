(function () {
  "use strict";

  var LABELS = { plugin: "Plugin", website: "Website", "case-study": "Case study" };

  // Drafts show while you preview locally and stay hidden on the live site.
  var isLive = /\.github\.io$/.test(location.hostname);

  var MOCKS = {
    website:
      '<div class="m m-site m-browser">' +
        '<div class="m-bar"><i></i><i></i><i></i><span class="m-url">smartupweb.com</span></div>' +
        '<div class="m-page">' +
          '<div class="m-hero-row">' +
            '<div><b class="m-line dark w90"></b><b class="m-line dark w70"></b><b class="m-line w80"></b><b class="m-line w60"></b><span class="m-pill"></span></div>' +
            '<div class="m-blob"></div>' +
          "</div>" +
        "</div>" +
      "</div>",
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function visual(p, eager) {
    if (p.image) {
      var cls = p.fit === "logo" ? "is-logo" : p.frame ? "is-framed" : "";
      return '<img' + (cls ? ' class="' + cls + '"' : "") + ' src="' + esc(p.image) + '" alt="' + esc(p.title) + (p.fit === "logo" ? " logo" : " cover") + '"' + (eager ? "" : ' loading="lazy"') + " />";
    }
    if (p.mock && MOCKS[p.mock]) return MOCKS[p.mock];
    return '<p class="m-empty">Add a screenshot:<br />image: "assets/your-project.jpg"</p>';
  }

  // Optional custom background for the image area (e.g. behind a logo)
  function shotStyle(p) {
    return p.bg ? ' style="background:' + esc(p.bg) + '"' : "";
  }

  // A project gets its own page when it has a slug and some detail sections.
  function pageUrl(p) {
    return p.slug && p.sections && p.sections.length ? "project.html?p=" + encodeURIComponent(p.slug) : "";
  }

  // ---- Framed covers: tint the empty space around them with the image's own colours ----
  function coverGradient(img) {
    try {
      var w = 48, h = Math.max(1, Math.round(48 * img.naturalHeight / img.naturalWidth));
      var cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      var ctx = cv.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      var px = ctx.getImageData(0, 0, w, h).data;

      // Bucket the colourful pixels by hue, weighted by saturation
      var buckets = [];
      for (var b = 0; b < 12; b++) buckets.push({ r: 0, g: 0, b: 0, n: 0 });
      for (var i = 0; i < px.length; i += 4) {
        var r = px[i] / 255, g = px[i + 1] / 255, bl = px[i + 2] / 255;
        var max = Math.max(r, g, bl), min = Math.min(r, g, bl), l = (max + min) / 2, d = max - min;
        if (d < 0.08 || l < 0.15 || l > 0.92) continue;          // skip greys, near-black, near-white
        var s = d / (1 - Math.abs(2 * l - 1));
        var hue = max === r ? ((g - bl) / d + 6) % 6 : max === g ? (bl - r) / d + 2 : (r - g) / d + 4;
        var k = Math.floor(hue * 2) % 12;
        buckets[k].r += px[i] * s; buckets[k].g += px[i + 1] * s; buckets[k].b += px[i + 2] * s; buckets[k].n += s;
      }
      var top = buckets.filter(function (x) { return x.n > 0; })
        .sort(function (a, z) { return z.n - a.n; })
        .slice(0, 2)
        .map(function (x) { return [Math.round(x.r / x.n), Math.round(x.g / x.n), Math.round(x.b / x.n)]; });
      if (!top.length) return;
      if (top.length === 1) top.push(top[0]);

      function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
      function tint(c, t) { return "rgb(" + c.map(function (v) { return Math.round(v + (255 - v) * t); }).join(",") + ")"; }

      img.parentNode.style.background =
        "radial-gradient(90% 80% at 0% 0%, " + rgba(top[0], 0.6) + ", transparent 70%)," +
        "radial-gradient(90% 80% at 100% 100%, " + rgba(top[1], 0.6) + ", transparent 70%)," +
        "linear-gradient(135deg, " + tint(top[0], 0.75) + ", " + tint(top[1], 0.75) + ")";
    } catch (e) {
      /* keep the plain grey canvas */
    }
  }

  function tintFramedCovers(scope) {
    scope.querySelectorAll("img.is-framed").forEach(function (img) {
      if (img.complete && img.naturalWidth) coverGradient(img);
      else img.addEventListener("load", function () { coverGradient(img); });
    });
  }

  // Shared with project.js
  window.Site = { LABELS: LABELS, isLive: isLive, esc: esc, visual: visual, shotStyle: shotStyle, pageUrl: pageUrl, tintFramedCovers: tintFramedCovers };

  // ---- Live W × H readouts, like Figma's size label ----
  function fmt(el) {
    var r = el.getBoundingClientRect();
    return Math.round(r.width) + " × " + Math.round(r.height);
  }

  // =====================================================================
  // Home page only
  // =====================================================================
  var grid = document.querySelector("[data-grid]");
  if (grid) {
    var card = function (p) {
      var href = pageUrl(p) || p.link || "";
      var external = !pageUrl(p) && p.link;
      var title = href
        ? '<a href="' + esc(href) + '"' + (external ? ' target="_blank" rel="noopener"' : "") + ">" + esc(p.title) + "</a>"
        : esc(p.title);

      var tags = (p.tags || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");

      return (
        '<article class="card' + (p.wide ? " is-wide" : "") + (p.draft ? " is-draft" : "") +
          '" data-category="' + esc(p.category) + '">' +
          '<div class="shot-wrap">' +
            '<div class="shot" aria-hidden="' + (p.image ? "false" : "true") + '"' + shotStyle(p) + ">" + visual(p) + "</div>" +
            '<span class="shot-size" aria-hidden="true"></span>' +
          "</div>" +
          '<div class="card-meta">' +
            "<span>" + esc(LABELS[p.category] || p.category) + "</span><span>·</span>" +
            "<span>" + esc(p.year) + "</span><span>·</span>" +
            "<span>" + esc(p.role) + "</span>" +
            (p.draft ? '<span class="draft-badge">Draft — hidden on the live site</span>' : "") +
          "</div>" +
          '<h3 class="card-title">' + title + "</h3>" +
          '<p class="card-summary">' + esc(p.summary) + "</p>" +
          (tags ? '<ul class="tags" aria-label="Tools">' + tags + "</ul>" : "") +
        "</article>"
      );
    };

    var empty = document.querySelector("[data-empty]");
    var projects = (window.PROJECTS || []).filter(function (p) { return !(isLive && p.draft); });
    grid.innerHTML = projects.map(card).join("");
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".card"));
    tintFramedCovers(grid);

    var heroFrame = document.querySelector("[data-frame]");
    var heroSize = document.querySelector("[data-size]");
    var frameLabel = document.querySelector(".frame-label");
    var sized = heroFrame ? [[heroFrame, heroSize]] : [];
    cards.forEach(function (c) { sized.push([c.querySelector(".shot"), c.querySelector(".shot-size")]); });

    var updateSizes = function () {
      sized.forEach(function (pair) { pair[1].textContent = fmt(pair[0]); });
      if (frameLabel) {
        var w = window.innerWidth;
        frameLabel.textContent = "Hero / " + (w < 680 ? "Mobile" : w < 1024 ? "Tablet" : "Desktop");
      }
    };
    updateSizes();
    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(updateSizes);
      sized.forEach(function (pair) { ro.observe(pair[0]); });
    } else {
      window.addEventListener("resize", updateSizes);
    }

    // Filters
    var chips = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    cards.forEach(function (c, i) { if (projects[i].wide) c.dataset.wide = "1"; });
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.getAttribute("data-filter");
        chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
        var shown = 0;
        cards.forEach(function (c) {
          var match = f === "all" || c.getAttribute("data-category") === f;
          c.hidden = !match;
          if (match) { shown++; c.classList.add("is-in"); }
          // In a filtered view nothing should span the full row on its own.
          c.classList.toggle("is-wide", match && f === "all" && c.dataset.wide === "1");
        });
        empty.hidden = shown > 0;
        updateSizes();
      });
    });
  }

  // =====================================================================
  // Every page
  // =====================================================================

  // ---- Reveal on scroll ----
  window.Site.reveal = function () {
    var revealables = Array.prototype.slice.call(document.querySelectorAll(".reveal, .card")).filter(function (el) {
      return !el.classList.contains("is-in");
    });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      revealables.forEach(function (el) { io.observe(el); });
    } else {
      revealables.forEach(function (el) { el.classList.add("is-in"); });
    }
  };
  window.Site.reveal();

  // ---- Compact header once the page is scrolled ----
  // Two thresholds so it can't flip back and forth around a single point.
  var header = document.querySelector("[data-header]");
  if (header) {
    var compact = false;
    var ticking = false;
    var applyHeader = function () {
      ticking = false;
      var y = window.scrollY;
      if (!compact && y > 40) compact = true;
      else if (compact && y < 8) compact = false;
      header.classList.toggle("is-scrolled", compact);
    };
    applyHeader();
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(applyHeader); }
    }, { passive: true });
  }

  // ---- Background dots clear around the mouse (eased so it trails a little) ----
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var rootStyle = document.documentElement.style;
    var target = { x: -999, y: -999 };
    var lens = { x: -999, y: -999 };
    var raf = 0;
    var instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var stepLens = function () {
      lens.x += (target.x - lens.x) * (instant ? 1 : 0.18);
      lens.y += (target.y - lens.y) * (instant ? 1 : 0.18);
      rootStyle.setProperty("--mx", lens.x.toFixed(1) + "px");
      rootStyle.setProperty("--my", lens.y.toFixed(1) + "px");
      raf = Math.abs(target.x - lens.x) + Math.abs(target.y - lens.y) > 0.5 ? requestAnimationFrame(stepLens) : 0;
    };

    window.addEventListener("pointermove", function (e) {
      if (lens.x < -900) { lens.x = e.clientX; lens.y = e.clientY; }  // first move: no slide-in from the corner
      target.x = e.clientX;
      target.y = e.clientY;
      if (!raf) raf = requestAnimationFrame(stepLens);
    }, { passive: true });

    document.documentElement.addEventListener("pointerleave", function () {
      target.x = target.y = lens.x = lens.y = -999;
      rootStyle.setProperty("--mx", "-999px");
      rootStyle.setProperty("--my", "-999px");
    });
  }

  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();

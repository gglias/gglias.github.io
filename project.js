/*
 * Project page: project.html?p=<slug>
 * Everything shown here comes from projects.js (summary, notice, actions, facts, sections).
 * A project with `page: false` has no page and never links here.
 */
(function () {
  "use strict";

  var S = window.Site;
  var root = document.querySelector("[data-project]");
  if (!S || !root) return;
  var esc = S.esc;

  // We're inside "Work": light it up in the toolbar
  var workTab = document.querySelector('[data-nav="work"]');
  if (workTab) { workTab.classList.add("is-active"); workTab.setAttribute("aria-current", "true"); }

  var all = (window.PROJECTS || []).filter(function (p) { return S.pageUrl(p) && !(S.isLive && p.draft); });
  var slug = new URLSearchParams(location.search).get("p");
  var index = -1;
  for (var i = 0; i < all.length; i++) if (all[i].slug === slug) index = i;
  var p = all[index];

  var crumbs = document.querySelector("[data-crumbs]");

  if (!p) {
    root.innerHTML =
      '<section class="pj-hero">' +
        '<span class="eyebrow">404</span>' +
        '<h1 class="pj-title">Project not found</h1>' +
        '<p class="pj-lede">This link doesn\'t match any project. Have a look at the full list instead.</p>' +
        '<div class="pj-actions"><a class="pj-btn is-primary" href="work.html">See all work</a></div>' +
      "</section>";
    document.title = "Project not found — Greg Glias";
    return;
  }

  var categoryName = S.LABELS[p.category] || p.category;
  var PLURAL = { plugin: "Plugins", website: "Websites", "case-study": "Case studies" };
  if (crumbs) {
    crumbs.innerHTML =
      '<a href="work.html">Work</a><span aria-hidden="true">/</span>' +
      '<span>' + esc(PLURAL[p.category] || categoryName) + '</span><span aria-hidden="true">/</span>' +
      '<b aria-current="page">' + esc(p.title) + "</b>";
  }

  // Button icons: external link (arrow leaves the corner), download (arrow drops into a tray)
  var EXT_ICON =
    '<svg class="pj-btn-icon" viewBox="0 0 20 20" aria-hidden="true">' +
      '<path d="M8.5 4.5H5.5a1.5 1.5 0 0 0-1.5 1.5v8.5a1.5 1.5 0 0 0 1.5 1.5H14a1.5 1.5 0 0 0 1.5-1.5v-3"/>' +
      '<path class="pj-ext-arrow" d="M9 11l7-7M11.5 4H16v4.5"/>' +
    "</svg>";
  var DL_ICON =
    '<svg class="pj-btn-icon" viewBox="0 0 20 20" aria-hidden="true">' +
      '<path class="pj-dl-arrow" d="M10 3v9M6 8.5l4 4 4-4"/><path d="M3.5 13v3h13v-3"/>' +
    "</svg>";

  function action(a) {
    var external = /^https?:/.test(a.href);
    var isDownload = /\.zip(\?|$)/i.test(a.href);
    return (
      '<a class="pj-btn' + (a.primary ? " is-primary" : "") + (isDownload ? " is-download" : "") + '" href="' + esc(a.href) + '"' +
        (external && !isDownload ? ' target="_blank" rel="noopener"' : "") + ">" +
        (isDownload ? DL_ICON : external ? EXT_ICON : "") + "<span>" + esc(a.label) + "</span>" +
      "</a>"
    );
  }

  function section(s) {
    var body = s.list
      ? "<ul>" + s.list.map(function (li) { return "<li>" + esc(li) + "</li>"; }).join("") + "</ul>"
      : "<p>" + esc(s.p) + "</p>";
    return '<section class="pj-sec reveal"><h2>' + esc(s.h) + "</h2>" + body + "</section>";
  }

  var actions = p.actions && p.actions.length ? p.actions : p.link ? [{ label: "Open project", href: p.link, primary: true }] : [];
  var facts = (p.facts || []).map(function (f) { return "<div><dt>" + esc(f[0]) + "</dt><dd>" + esc(f[1]) + "</dd></div>"; }).join("");
  var tags = (p.tags || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
  var next = all.length > 1 ? all[(index + 1) % all.length] : null;
  var cover = p.image || p.mock
    ? '<figure class="pj-cover"><span class="pj-cover-label" aria-hidden="true">' + esc(p.title) + '</span>' +
        '<div class="shot"' + (p.bg ? ' style="background:' + esc(p.bg) + '"' : "") + ">" + S.visual(p) + "</div>" +
        '<span class="pj-cover-size" aria-hidden="true" data-cover-size></span>' +
      "</figure>"
    : "";

  // Gallery: photos/print as Figma frames; click to open large
  var gallery = (p.gallery || []).filter(function (g) { return g && g.src; });
  var galleryHtml = gallery.length
    ? '<section class="pj-gallery" aria-labelledby="gallery-title">' +
        '<div class="pj-gallery-head reveal"><span class="eyebrow">Gallery</span>' +
          '<h2 id="gallery-title" class="pj-gallery-title">' + esc(p.galleryTitle || "Gallery") + "</h2>" +
          (p.galleryNote ? '<p class="pj-gallery-note">' + esc(p.galleryNote) + "</p>" : "") +
        "</div>" +
        '<div class="pj-gallery-grid">' +
          gallery.map(function (g, i) {
            return '<figure class="pj-shot reveal' + (g.wide ? " is-wide" : "") + (g.tall ? " is-tall" : "") + (g.full ? " is-full" : "") + '">' +
              '<button type="button" class="pj-shot-btn" data-shot="' + i + '" aria-label="Open image: ' + esc(g.caption || g.alt || "") + '">' +
                '<span class="pj-shot-label" aria-hidden="true">' + esc(g.label || "Frame " + (i + 1)) + "</span>" +
                '<img src="' + esc(g.src) + '" alt="' + esc(g.alt || g.caption || "") + '" loading="lazy"' + (g.pos ? ' style="object-position:' + esc(g.pos) + '"' : "") + ' />' +
              "</button>" +
              (g.caption ? "<figcaption>" + esc(g.caption) + "</figcaption>" : "") +
            "</figure>";
          }).join("") +
        "</div>" +
      "</section>"
    : "";

  root.innerHTML =
    '<section class="pj-hero">' +
      '<span class="eyebrow">' + esc(categoryName) + " · " + esc(p.year) + "</span>" +
      '<h1 class="pj-title">' + esc(p.title) + "</h1>" +
      '<p class="pj-lede">' + esc(p.summary) + "</p>" +
      (p.notice ? '<p class="pj-notice" role="note"><i aria-hidden="true"></i>' + esc(p.notice) + "</p>" : "") +
      (actions.length ? '<div class="pj-actions">' + actions.map(action).join("") + "</div>" : "") +
    "</section>" +

    cover +

    '<div class="pj-body">' +
      // "At a glance" as a Figma properties panel
      '<aside class="pj-facts" aria-label="At a glance">' +
        '<div class="pj-facts-head"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 2v12M11 2v12M2 5h12M2 11h12"/></svg>' + esc(p.title) + "</div>" +
        '<div class="pj-facts-sec">' +
          '<h2 class="panel-title">At a glance</h2>' +
          (facts ? '<dl class="props">' + facts + "</dl>" : "") +
        "</div>" +
        (tags ? '<div class="pj-facts-sec"><h2 class="panel-title">Tools</h2><ul class="pj-tags">' + tags + "</ul></div>" : "") +
        (actions.length ? '<div class="pj-facts-sec pj-facts-actions">' + actions.map(action).join("") + "</div>" : "") +
      "</aside>" +
      '<div class="pj-sections">' + (p.sections || []).map(section).join("") + "</div>" +
    "</div>" +

    galleryHtml +

    (next
      ? '<a class="pj-next reveal" href="' + esc(S.pageUrl(next)) + '">' +
          '<span class="eyebrow">Next project</span>' +
          '<span class="pj-next-title">' + esc(next.title) + "</span>" +
          '<span class="arrow-tile" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M6 14 14 6M7.5 6H14v6.5"/></svg></span>' +
        "</a>"
      : "");

  // Lightbox for the gallery (native <dialog>: Esc closes, focus returns)
  if (gallery.length && window.HTMLDialogElement) {
    var box = document.createElement("dialog");
    box.className = "pj-lightbox";
    box.setAttribute("aria-label", "Image viewer");
    box.innerHTML =
      '<figure><img alt="" /><figcaption></figcaption></figure>' +
      '<button type="button" class="pj-lb-close" aria-label="Close">×</button>' +
      (gallery.length > 1 ? '<button type="button" class="pj-lb-prev" aria-label="Previous image">←</button><button type="button" class="pj-lb-next" aria-label="Next image">→</button>' : "");
    document.body.appendChild(box);
    var lbImg = box.querySelector("img"), lbCap = box.querySelector("figcaption"), cur = 0;
    var show = function (i) {
      cur = (i + gallery.length) % gallery.length;
      lbImg.src = gallery[cur].src;
      lbImg.alt = gallery[cur].alt || gallery[cur].caption || "";
      lbCap.textContent = gallery[cur].caption || "";
    };
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-shot]");
      if (!b) return;
      show(+b.getAttribute("data-shot"));
      box.showModal();
    });
    box.addEventListener("click", function (e) {
      if (e.target.closest(".pj-lb-prev")) return show(cur - 1);
      if (e.target.closest(".pj-lb-next")) return show(cur + 1);
      if (e.target === box || e.target.closest(".pj-lb-close")) box.close();
    });
    box.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(cur - 1);
      if (e.key === "ArrowRight") show(cur + 1);
    });
  }

  // Title and description for this project
  document.title = p.title + " — Greg Glias";
  var desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", p.summary);

  // Framed covers sit on a gradient from their own colours (same as the home cards)
  root.querySelectorAll("img.is-framed").forEach(function (img) {
    if (img.complete && img.naturalWidth) S.coverGradient(img);
    else img.addEventListener("load", function () { S.coverGradient(img); });
  });

  // Live W × H on the cover, like a Figma frame
  var shot = root.querySelector(".pj-cover .shot");
  var size = root.querySelector("[data-cover-size]");
  if (shot && size) {
    var showSize = function () {
      var r = shot.getBoundingClientRect();
      size.textContent = Math.round(r.width) + " × " + Math.round(r.height);
    };
    showSize();
    if ("ResizeObserver" in window) new ResizeObserver(showSize).observe(shot);
  }

  // Reveal sections as they scroll in
  var items = Array.prototype.slice.call(root.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }
})();

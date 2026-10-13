/*
 * Project page: project.html?p=<slug>
 * Everything shown here comes from projects.js (actions, facts, sections).
 */
(function () {
  "use strict";

  var S = window.Site;
  var root = document.querySelector("[data-project]");
  if (!S || !root) return;

  var all = (window.PROJECTS || []).filter(function (p) { return S.pageUrl(p) && !(S.isLive && p.draft); });
  var slug = new URLSearchParams(location.search).get("p");
  var index = -1;
  for (var i = 0; i < all.length; i++) if (all[i].slug === slug) index = i;
  var p = all[index];

  var esc = S.esc;

  if (!p) {
    root.innerHTML =
      '<section class="pj-hero wrap">' +
        '<h1 class="pj-title">Project not found</h1>' +
        '<p class="pj-lede">This link doesn\'t match any project. Have a look at the full list instead.</p>' +
        '<div class="pj-actions"><a class="pj-btn is-primary" href="./#work">See all work</a></div>' +
      "</section>";
    document.title = "Project not found — Greg Glias";
    return;
  }

  function section(s) {
    var body = s.list
      ? "<ul>" + s.list.map(function (li) { return "<li>" + esc(li) + "</li>"; }).join("") + "</ul>"
      : "<p>" + esc(s.p) + "</p>";
    return '<section class="pj-sec reveal"><h2>' + esc(s.h) + "</h2>" + body + "</section>";
  }

  function action(a) {
    var external = /^https?:/.test(a.href);
    return (
      '<a class="pj-btn' + (a.primary ? " is-primary" : "") + '" href="' + esc(a.href) + '"' +
        (external ? ' target="_blank" rel="noopener"' : "") + ">" +
        esc(a.label) + (external ? ' <span aria-hidden="true">↗</span>' : "") +
      "</a>"
    );
  }

  var actions = p.actions && p.actions.length ? p.actions : p.link ? [{ label: "Open project", href: p.link, primary: true }] : [];
  var facts = (p.facts || []).map(function (f) { return "<div><dt>" + esc(f[0]) + "</dt><dd>" + esc(f[1]) + "</dd></div>"; }).join("");
  var tags = (p.tags || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
  var next = all.length > 1 ? all[(index + 1) % all.length] : null;

  root.innerHTML =
    '<section class="pj-hero wrap">' +
      '<p class="pj-eyebrow">' + esc(S.LABELS[p.category] || p.category) + " · " + esc(p.year) + "</p>" +
      '<h1 class="pj-title">' + esc(p.title) + "</h1>" +
      '<p class="pj-lede">' + esc(p.summary) + "</p>" +
      (p.notice ? '<p class="pj-notice" role="note">' + esc(p.notice) + "</p>" : "") +
      (actions.length ? '<div class="pj-actions">' + actions.map(action).join("") + "</div>" : "") +
    "</section>" +

    '<div class="wrap"><div class="shot pj-cover"' + S.shotStyle(p) + ">" + S.visual(p, true) + "</div></div>" +

    '<div class="pj-body wrap">' +
      '<aside class="pj-facts" aria-label="At a glance">' +
        '<h2 class="pj-facts-title">At a glance</h2>' +
        (facts ? "<dl>" + facts + "</dl>" : "") +
        (tags ? '<ul class="tags" aria-label="Tools">' + tags + "</ul>" : "") +
        (actions.length ? '<div class="pj-facts-actions">' + actions.map(action).join("") + "</div>" : "") +
      "</aside>" +
      '<div class="pj-sections">' + (p.sections || []).map(section).join("") + "</div>" +
    "</div>" +

    (next
      ? '<nav class="pj-next wrap" aria-label="Next project">' +
          '<span class="pj-next-label">Next project</span>' +
          '<a class="pj-next-link" href="' + esc(S.pageUrl(next)) + '">' + esc(next.title) + ' <span aria-hidden="true">→</span></a>' +
        "</nav>"
      : "");

  // Title and description for this project
  document.title = p.title + " — Greg Glias";
  var desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", p.summary);

  S.tintFramedCovers(root);
  S.reveal();
})();

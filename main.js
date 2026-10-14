(function () {
  "use strict";

  var LABELS = { plugin: "Plugin", website: "Website", "case-study": "Case study" };

  // Drafts show while you preview locally and stay hidden on the live site.
  var isLive = /\.github\.io$/.test(location.hostname);

  // A project gets its own page when it has a slug and some sections, unless it says page: false.
  function pageUrl(p) {
    return p.page !== false && p.slug && p.sections && p.sections.length ? "project.html?p=" + encodeURIComponent(p.slug) : "";
  }

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fmt(el) {
    var r = el.getBoundingClientRect();
    return Math.round(r.width) + " × " + Math.round(r.height);
  }

  // Accent: Ember, set on <html data-accent> (the other accents stay in styles.css)
  // Local preview only: a picker to try other accents. Never shown on github.io.
  if (!isLive) {
    var ACCENTS = [
      ["ember", "Ember", "#ff5b1f"], ["blue", "Blue", "#3d6bff"], ["cyan", "Cyan", "#2ed3f0"], ["green", "Green", "#12c97a"],
      ["lime", "Lime", "#c8f65a"], ["gold", "Gold", "#ffc21a"], ["pink", "Pink", "#ff4fa3"], ["violet", "Violet", "#a259ff"]
    ];
    var pickerEl = document.createElement("div");
    pickerEl.className = "accent-picker";
    pickerEl.setAttribute("role", "group");
    pickerEl.setAttribute("aria-label", "Accent colour (local preview only)");
    pickerEl.innerHTML = '<span class="accent-picker-label" data-accent-name></span>' +
      ACCENTS.map(function (a) {
        return '<button type="button" data-accent-btn="' + a[0] + '" aria-label="' + a[1] + '" title="' + a[1] + " " + a[2] + '" style="--sw:' + a[2] + '"></button>';
      }).join("");
    document.body.appendChild(pickerEl);
    var accentName = pickerEl.querySelector("[data-accent-name]");
    var setAccent = function (key) {
      var found = ACCENTS.filter(function (a) { return a[0] === key; })[0] || ACCENTS[0];
      root.setAttribute("data-accent", found[0]);
      accentName.textContent = "Accent · " + found[1];
      pickerEl.querySelectorAll("[data-accent-btn]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-accent-btn") === found[0])); });
      try { localStorage.setItem("gg-accent", found[0]); } catch (e) { /* private mode */ }
    };
    var saved = null;
    try { saved = localStorage.getItem("gg-accent"); } catch (e) { /* private mode */ }
    setAccent(new URLSearchParams(location.search).get("accent") || saved || "ember");
    pickerEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-accent-btn]");
      if (b) setAccent(b.getAttribute("data-accent-btn"));
    });
  }

  // ---- Local time in Thessaloniki ----
  var clock = document.querySelector("[data-clock] time");
  if (clock) {
    var tick = function () {
      try {
        clock.textContent = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Athens" }).format(new Date());
      } catch (e) { clock.parentNode.hidden = true; }
    };
    tick();
    setInterval(tick, 15000);
  }

  // ---- Copy email ----
  var copyBtn = document.querySelector("[data-copy]");
  var copyTip = document.querySelector("[data-copy-tip]");
  if (copyBtn && copyTip) {
    var tipTimer = 0;
    var showTip = function (text) {
      copyTip.textContent = text;
      copyTip.classList.add("is-on");
      clearTimeout(tipTimer);
      tipTimer = setTimeout(function () { copyTip.classList.remove("is-on"); }, 1600);
    };
    copyBtn.addEventListener("click", function () {
      var value = copyBtn.getAttribute("data-copy");
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(function () { showTip("Copied"); }, function () { showTip(value); });
      } else {
        showTip(value);   // no clipboard access: at least show the address
      }
    });
  }

  // ---- Projects ----
  function visual(p) {
    if (p.image) {
      var cls = p.fit === "logo" ? "is-logo" : p.frame ? "is-framed" : "";
      return '<img' + (cls ? ' class="' + cls + '"' : "") + ' src="' + esc(p.image) + '" alt="' + esc(p.title) + (p.fit === "logo" ? " logo" : " cover") + '" loading="lazy" />';
    }
    return '<p class="m-empty">Add a cover:<br />image: "assets/your-project.jpg"</p>';
  }

  // Framed covers sit on a dark gradient taken from the image's own colours
  function coverGradient(img) {
    try {
      var w = 48, h = Math.max(1, Math.round(48 * img.naturalHeight / img.naturalWidth));
      var cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      var ctx = cv.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      var px = ctx.getImageData(0, 0, w, h).data;
      var buckets = [];
      for (var b = 0; b < 12; b++) buckets.push({ r: 0, g: 0, b: 0, n: 0 });
      for (var i = 0; i < px.length; i += 4) {
        var r = px[i] / 255, g = px[i + 1] / 255, bl = px[i + 2] / 255;
        var max = Math.max(r, g, bl), min = Math.min(r, g, bl), l = (max + min) / 2, d = max - min;
        if (d < 0.08 || l < 0.15 || l > 0.92) continue;
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
      img.parentNode.style.background =
        "radial-gradient(80% 70% at 10% 0%, " + rgba(top[0], 0.42) + ", transparent 70%)," +
        "radial-gradient(80% 70% at 100% 100%, " + rgba(top[1], 0.3) + ", transparent 70%)," +
        "#141416";
    } catch (e) { /* keep the plain dark canvas */ }
  }

  // Shared with project.js
  window.Site = { LABELS: LABELS, isLive: isLive, esc: esc, visual: visual, coverGradient: coverGradient, pageUrl: pageUrl };

  var grid = document.querySelector("[data-grid]");
  var sized = [];
  var heroFrame = document.querySelector("[data-frame]");
  if (heroFrame) sized.push([heroFrame, document.querySelector("[data-size]")]);
  var portrait = document.querySelector("[data-portrait] .portrait-img");
  if (portrait) sized.push([portrait, document.querySelector("[data-portrait-size]")]);
  var frameLabel = document.querySelector(".frame-label");

  if (grid) {
    // data-grid="featured" (home): only featured projects, the first one full width.
    // data-grid="all" (work.html): every project, with the page tabs.
    var allProjects = (window.PROJECTS || []).filter(function (p) { return !(isLive && p.draft); });
    var featuredMode = grid.getAttribute("data-grid") === "featured";
    var projects = featuredMode ? allProjects.filter(function (p) { return p.featured; }) : allProjects;

    var card = function (p, i) {
      var wide = featuredMode ? i === 0 : !!p.wide;
      var page = pageUrl(p);
      var href = page || p.link || "";
      var external = !page && p.link;
      var title = href
        ? '<a href="' + esc(href) + '"' + (external ? ' target="_blank" rel="noopener"' : "") + ">" + esc(p.title) + "</a>"
        : esc(p.title);
      var tags = (p.tags || []).slice(0, 4).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");

      return (
        '<article class="card' + (wide ? " is-wide" : "") + '" data-category="' + esc(p.category) + '"' + (wide ? ' data-wide="1"' : "") + ">" +
          '<div class="shot"' + (p.bg ? ' style="background:' + esc(p.bg) + '"' : "") + ">" + visual(p) + "</div>" +
          '<span class="shot-size" aria-hidden="true"></span>' +
          (p.draft ? '<span class="draft-badge">Draft · hidden on the live site</span>' : "") +
          '<div class="card-panel">' +
            '<div class="card-info">' +
              '<p class="card-cat">' + esc(LABELS[p.category] || p.category) + " · " + esc(p.year) + "</p>" +
              '<h3 class="card-title">' + title + "</h3>" +
              (tags ? '<ul class="card-tags" aria-label="Tools">' + tags + "</ul>" : "") +
            "</div>" +
            (href ? '<span class="arrow-tile" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M6 14 14 6M7.5 6H14v6.5"/></svg></span>' : "") +
          "</div>" +
        "</article>"
      );
    };

    grid.innerHTML = projects.map(card).join("");
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".card"));
    grid.querySelectorAll("img.is-framed").forEach(function (img) {
      if (img.complete && img.naturalWidth) coverGradient(img);
      else img.addEventListener("load", function () { coverGradient(img); });
    });
    cards.forEach(function (c) {
      sized.push([c, c.querySelector(".shot-size")]);
      // The whole card opens the project (the title link stays the accessible target)
      var link = c.querySelector(".card-title a");
      if (link) {
        c.classList.add("is-link");
        c.addEventListener("click", function (e) {
          if (e.target.closest("a") || String(window.getSelection())) return;
          link.click();
        });
      }
    });

    var count = document.querySelector("[data-count]");
    var empty = document.querySelector("[data-empty]");
    var setCount = function (n) {
      if (!count) return;
      count.textContent = featuredMode
        ? n + " of " + allProjects.length + " frames"
        : n + (n === 1 ? " frame" : " frames");
    };
    setCount(cards.length);

    // Frame count on each page tab
    document.querySelectorAll("[data-n]").forEach(function (el) {
      var cat = el.getAttribute("data-n");
      el.textContent = cat === "all" ? projects.length : projects.filter(function (p) { return p.category === cat; }).length;
    });

    var chips = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.getAttribute("data-filter");
        chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
        var shown = 0;
        cards.forEach(function (c) {
          var match = f === "all" || c.getAttribute("data-category") === f;
          c.hidden = !match;
          if (match) { shown++; c.classList.add("is-in"); }
          c.classList.toggle("is-wide", match && f === "all" && c.dataset.wide === "1");
        });
        empty.hidden = shown > 0;
        setCount(shown);
        updateSizes();
      });
    });

    // ---- Home: "More work" list (everything not featured) ----
    var moreList = document.querySelector("[data-more]");
    var allCount = document.querySelector("[data-all-count]");
    if (allCount) allCount.textContent = allProjects.length;
    if (moreList) {
      var rest = allProjects.filter(function (p) { return !p.featured; });
      moreList.innerHTML = rest.map(function (p, i) {
        var page = pageUrl(p);
        var href = page || p.link || "";
        var external = !page && p.link;
        var meta = esc(LABELS[p.category] || p.category) + " · " + esc(p.year);
        var inner =
          '<span class="more-title">' + esc(p.title) + (p.draft ? ' <em class="more-draft">Draft</em>' : "") + "</span>" +
          '<span class="more-role">' + esc(p.role || "") + "</span>" +
          '<span class="more-meta">' + meta + "</span>" +
          '<span class="more-arrow" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M6 14 14 6M7.5 6H14v6.5"/></svg></span>';
        return '<li class="reveal">' + (href
          ? '<a class="more-row" data-more-i="' + i + '" href="' + esc(href) + '"' + (external ? ' target="_blank" rel="noopener"' : "") + ">" + inner + "</a>"
          : '<div class="more-row" data-more-i="' + i + '">' + inner + "</div>") + "</li>";
      }).join("");
      if (!rest.length) moreList.closest(".more").hidden = true;

      // Cover preview that follows the cursor (mouse only)
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        var pv = document.createElement("div");
        pv.className = "more-preview";
        pv.setAttribute("aria-hidden", "true");
        document.body.appendChild(pv);
        var pvX = 0, pvY = 0, pvRaf = 0, shownI = -1;
        var placePv = function () { pvRaf = 0; pv.style.transform = "translate3d(" + pvX + "px," + pvY + "px,0)"; };
        moreList.addEventListener("pointermove", function (e) {
          var pw = pv.offsetWidth || 300, ph = pv.offsetHeight || 188;
          pvX = e.clientX + 24 + pw > innerWidth - 12 ? e.clientX - 24 - pw : e.clientX + 24;
          pvY = Math.max(12, Math.min(e.clientY - ph / 2, innerHeight - ph - 12));
          if (!pvRaf) pvRaf = requestAnimationFrame(placePv);
        });
        moreList.addEventListener("pointerover", function (e) {
          var row = e.target.closest("[data-more-i]");
          if (!row) return;
          var i = +row.getAttribute("data-more-i");
          if (i !== shownI) {
            var p = rest[i];
            pv.innerHTML = '<div class="shot"' + (p.bg ? ' style="background:' + esc(p.bg) + '"' : "") + ">" + visual(p) + "</div>";
            var img = pv.querySelector("img.is-framed");
            if (img) { if (img.complete && img.naturalWidth) coverGradient(img); else img.addEventListener("load", function () { coverGradient(img); }); }
            shownI = i;
          }
          pv.classList.add("is-on");
        });
        moreList.addEventListener("pointerleave", function () { pv.classList.remove("is-on"); });
      }
    }
  }

  // ---- Live W × H readouts, like Figma's size label ----
  function updateSizes() {
    sized.forEach(function (pair) { if (pair[1]) pair[1].textContent = fmt(pair[0]); });
    if (frameLabel) {
      // Resized by hand: name the breakpoint by the frame's own width
      if (heroFrame && heroFrame.style.width) {
        var fw = heroFrame.getBoundingClientRect().width;
        frameLabel.textContent = "Hero / " + (fw < 400 ? "Mobile" : fw < 600 ? "Tablet" : "Desktop");
      } else {
        var w = window.innerWidth;
        frameLabel.textContent = "Hero / " + (w < 680 ? "Mobile" : w < 1100 ? "Tablet" : "Desktop");
      }
    }
  }

  // ---- Hero frame: drag the bottom-right corner to resize, double-click to reset ----
  var corner = heroFrame && heroFrame.querySelector(".h-br");
  if (corner) {
    heroFrame.classList.add("is-resizable");
    var heroTitle = heroFrame.querySelector(".hero-title");
    var startX = 0, startW = 0, resizing = false;
    var MIN_W = 240;
    var baseFont = 0, widest = 0, padX = 0;

    // Like real responsive type: shrink the headline so its longest word always fits
    var fitTitle = function (frameW) {
      var scale = Math.min(1, (frameW - padX) / widest);
      heroTitle.style.fontSize = (baseFont * scale).toFixed(2) + "px";
    };

    // Measure at the natural size: base font and the widest word that can't wrap
    var measure = function () {
      if (heroTitle.style.fontSize) return;
      baseFont = parseFloat(getComputedStyle(heroTitle).fontSize);
      widest = 0;
      heroTitle.querySelectorAll(".brandword").forEach(function (b) {
        widest = Math.max(widest, b.getBoundingClientRect().width);
      });
      var cs = getComputedStyle(heroFrame);
      padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + 4;
    };

    corner.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      stopHint();
      resizing = true;
      startX = e.clientX;
      startW = heroFrame.getBoundingClientRect().width;
      measure();
      heroFrame.classList.remove("is-resetting");
      heroFrame.classList.add("is-resizing");
      root.classList.add("is-resizing-frame");
      corner.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    corner.addEventListener("pointermove", function (e) {
      if (!resizing) return;
      var maxW = heroFrame.parentElement.getBoundingClientRect().width - parseFloat(getComputedStyle(heroFrame).marginLeft);
      var w = Math.max(MIN_W, Math.min(maxW, startW + e.clientX - startX));
      heroFrame.style.width = w + "px";
      fitTitle(w);
      updateSizes();
    });

    var stopResize = function () {
      if (!resizing) return;
      resizing = false;
      heroFrame.classList.remove("is-resizing");
      root.classList.remove("is-resizing-frame");
    };
    corner.addEventListener("pointerup", stopResize);
    corner.addEventListener("pointercancel", stopResize);

    // Double-click the corner: ease back to the original size
    corner.addEventListener("dblclick", function () {
      if (!heroFrame.style.width) return;
      var natural = (function () {
        var current = heroFrame.style.width;
        heroFrame.style.width = "";
        var nw = heroFrame.getBoundingClientRect().width;
        heroFrame.style.width = current;
        return nw;
      })();
      heroFrame.getBoundingClientRect();        // commit the current width before animating
      heroFrame.classList.add("is-resetting");
      heroFrame.style.width = natural + "px";
      heroTitle.style.fontSize = baseFont + "px";
      setTimeout(function () {
        heroFrame.classList.remove("is-resetting");
        heroFrame.style.width = "";
        heroTitle.style.fontSize = "";
        updateSizes();
      }, 520);
    });

    // ---- Hint: a Mac hand grabs the corner, pulls it out and lets go. Plays every time the hero comes into view ----
    var hint = heroFrame.querySelector("[data-resize-hint]");
    var hintHand = hint && hint.querySelector(".hint-hand");
    var hintRun = 0, hintTimer = 0;
    var HINT_PULL = 70;

    function hintWait(ms, id) {
      return new Promise(function (r) { setTimeout(r, ms); }).then(function () { if (id !== hintRun) throw "stop"; });
    }
    // Animate the frame width (and hint hand along with it, since it sits on the corner)
    function tweenWidth(from, to, ms, id) {
      return new Promise(function (resolve, reject) {
        var t0 = performance.now();
        (function step(now) {
          if (id !== hintRun) return reject("stop");
          var p = Math.min(1, (now - t0) / ms);
          var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;   // ease in-out
          var w = from + (to - from) * e;
          heroFrame.style.width = w + "px";
          fitTitle(w);
          updateSizes();
          if (p < 1) requestAnimationFrame(step); else resolve();
        })(t0);
      });
    }

    function stopHint() {
      hintRun++;
      clearTimeout(hintTimer);
      if (hint) hint.classList.remove("is-on", "is-pressed");
    }

    async function playHint() {
      if (!hint || resizing || heroFrame.style.width) return;
      var id = ++hintRun;
      try {
        measure();
        var w0 = heroFrame.getBoundingClientRect().width;
        // Pull outwards when there's room: nothing reflows, so the page doesn't jump.
        // No room (narrow screens): just grab and let go, without resizing.
        var room = heroFrame.parentElement.getBoundingClientRect().width - parseFloat(getComputedStyle(heroFrame).marginLeft) - w0;
        hint.classList.add("is-on");                 // hand + tip fade in on the corner
        await hintWait(700, id);
        hint.classList.add("is-pressed");            // grab
        await hintWait(180, id);
        if (room > 40) {
          var w1 = w0 + Math.min(HINT_PULL, room);
          await tweenWidth(w0, w1, 650, id);
          await hintWait(250, id);
          await tweenWidth(w1, w0, 600, id);
        } else {
          await hintWait(900, id);
        }
        hint.classList.remove("is-pressed");         // let go
        heroFrame.style.width = "";
        heroTitle.style.fontSize = "";
        updateSizes();
        await hintWait(1300, id);
        hint.classList.remove("is-on");
      } catch (err) {
        // stopped: the visitor grabbed the corner, or the hero scrolled away
        if (!resizing) { heroFrame.style.width = ""; heroTitle.style.fontSize = ""; updateSizes(); }
      }
    }

    if (hint) {
      if (reduce) {
        // No motion: just show the tip for a few seconds
        setTimeout(function () { hint.classList.add("is-on", "is-static"); }, 600);
        setTimeout(function () { hint.classList.remove("is-on"); }, 6000);
      } else {
        hintTimer = setTimeout(playHint, 2600);      // after the frame has drawn itself
        // Play again each time the hero comes back into view; stop when it leaves
        if ("IntersectionObserver" in window) {
          var firstCheck = true;
          new IntersectionObserver(function (entries) {
            if (firstCheck) { firstCheck = false; return; }   // the load timer handles the first play
            if (!entries[0].isIntersecting) { stopHint(); }
            else {
              clearTimeout(hintTimer);
              hintTimer = setTimeout(playHint, 900);
            }
          }, { threshold: 0.4 }).observe(heroFrame);
        }
      }
      // The visitor reaches for the corner: get out of the way
      corner.addEventListener("pointerenter", function () { stopHint(); });
    }
  }
  updateSizes();
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(updateSizes);
    sized.forEach(function (pair) { ro.observe(pair[0]); });
  } else {
    window.addEventListener("resize", updateSizes);
  }

  // ---- Reveal on scroll ----
  var revealables = Array.prototype.slice.call(document.querySelectorAll(".reveal, .card"));
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

  // ---- Toolbar: highlight the section in view ----
  var navLinks = {};
  document.querySelectorAll("[data-nav]").forEach(function (a) { navLinks[a.getAttribute("data-nav")] = a; });
  var sections = Array.prototype.slice.call(document.querySelectorAll("[data-section]"));
  function setActive(id) {
    Object.keys(navLinks).forEach(function (k) {
      var on = k === id;
      navLinks[k].classList.toggle("is-active", on);
      if (on) navLinks[k].setAttribute("aria-current", "true");
      else navLinks[k].removeAttribute("aria-current");
    });
  }
  // ---- Placeholder sections never reach the live site ----
  if (isLive) document.querySelectorAll("[data-draft]").forEach(function (el) { el.remove(); });

  // ---- Kind words: pins switch the comment; it moves on by itself until someone takes over ----
  var kw = document.querySelector("[data-kw]");
  if (kw) {
    var kwPins = document.querySelectorAll("[data-kw-pin]");
    var kwItems = kw.querySelectorAll("[data-kw-item]");
    var kwN = kw.querySelector("[data-kw-n]");
    var kwBar = kw.querySelector("[data-kw-bar]");
    var kwCur = 0, kwTimer = 0, kwStopped = false, kwVisible = false;
    var KW_MS = 8000;
    var kwShow = function (i) {
      kwCur = (i + kwItems.length) % kwItems.length;
      kwItems.forEach(function (it, k) { it.classList.toggle("is-on", k === kwCur); });
      kwPins.forEach(function (p, k) { p.classList.toggle("is-on", k === kwCur); p.setAttribute("aria-selected", k === kwCur ? "true" : "false"); p.tabIndex = k === kwCur ? 0 : -1; });
      if (kwN) kwN.textContent = kwCur + 1;
      kwRun();
    };
    var kwRun = function () {
      clearTimeout(kwTimer);
      kwBar.classList.remove("is-run"); void kwBar.offsetWidth;
      if (kwStopped || !kwVisible || reduce || kwItems.length < 2) return;
      kwBar.style.animationDuration = KW_MS + "ms";
      kwBar.classList.add("is-run");
      kwTimer = setTimeout(function () { kwShow(kwCur + 1); }, KW_MS);
    };
    var kwTake = function (i) { kwStopped = true; kwShow(i); };
    kwPins.forEach(function (p, k) {
      p.addEventListener("click", function () { kwTake(k); });
      p.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        kwTake(kwCur + (e.key === "ArrowRight" ? 1 : -1));
        kwPins[kwCur].focus();
      });
    });
    kw.querySelector("[data-kw-prev]").addEventListener("click", function () { kwTake(kwCur - 1); });
    kw.querySelector("[data-kw-next]").addEventListener("click", function () { kwTake(kwCur + 1); });
    kwShow(0);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { kwVisible = en[0].isIntersecting; kwRun(); }, { threshold: 0.5 }).observe(kw);
    }
  }

  if (document.body.classList.contains("is-worklist")) {
    var wl = document.querySelector('[data-nav="work"]');
    if (wl) { wl.classList.add("is-active"); wl.setAttribute("aria-current", "true"); }
  }

  var progressBar = document.querySelector("[data-progress]");
  if (progressBar) {
    // Scroll progress along the toolbar's bottom edge
    var progTick = false;
    var setProgress = function () {
      progTick = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4) + ")";
    };
    setProgress();
    window.addEventListener("scroll", function () { if (!progTick) { progTick = true; requestAnimationFrame(setProgress); } }, { passive: true });
    window.addEventListener("resize", setProgress);
  }
  if (sections.length) {
    var ticking = false;
    var pickSection = function () {
      ticking = false;
      var line = window.innerHeight * 0.35;
      var current = sections[0].id;
      sections.forEach(function (s) { if (s.getBoundingClientRect().top <= line) current = s.id; });
      // At the very bottom, the last section wins
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = sections[sections.length - 1].id;
      setActive(current);
    };
    pickSection();
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(pickSection); }
    }, { passive: true });
    window.addEventListener("resize", function () { requestAnimationFrame(pickSection); });
  }

  // ---- Keyboard shortcuts 1–7 jump to sections, like Figma's tool keys ----
  var keyLinks = {};
  document.querySelectorAll("[data-key]").forEach(function (a) { keyLinks[a.getAttribute("data-key")] = a; });
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var link = keyLinks[e.key];
    if (!link) return;
    e.preventDefault();
    var href = link.getAttribute("href");
    if (href.charAt(0) !== "#") { location.href = href; return; }   // project pages: back to the home section
    var target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", href);
    }
  });

  // ---- Stickers: drag them around, like objects on the canvas ----
  var stickerArea = document.querySelector("[data-stickers]");
  if (stickerArea) {
    var bounds = document.querySelector(".hero") || stickerArea;
    stickerArea.querySelectorAll("[data-sticker]").forEach(function (el) {
      var xy = document.createElement("span");
      xy.className = "sticker-xy";
      xy.setAttribute("aria-hidden", "true");
      el.appendChild(xy);

      var dx = 0, dy = 0, startX = 0, startY = 0, baseX = 0, baseY = 0, drag = false;

      el.addEventListener("pointerdown", function (e) {
        if (e.button !== 0) return;
        drag = true;
        startX = e.clientX; startY = e.clientY;
        baseX = dx; baseY = dy;
        el.setPointerCapture(e.pointerId);
        el.classList.add("is-dragging");
        el.style.animation = "none";   // stop the entrance animation from overriding the transform
        e.preventDefault();
      });

      el.addEventListener("pointermove", function (e) {
        if (!drag) return;
        var nx = baseX + e.clientX - startX;
        var ny = baseY + e.clientY - startY;
        // keep it inside the hero
        var b = bounds.getBoundingClientRect();
        var r = el.getBoundingClientRect();
        var mx = nx - dx, my = ny - dy;
        if (r.left + mx < b.left) nx -= r.left + mx - b.left;
        if (r.right + mx > b.right) nx -= r.right + mx - b.right;
        if (r.top + my < b.top) ny -= r.top + my - b.top;
        if (r.bottom + my > b.bottom) ny -= r.bottom + my - b.bottom;
        dx = nx; dy = ny;
        el.style.setProperty("--dx", dx + "px");
        el.style.setProperty("--dy", dy + "px");
        var rr = el.getBoundingClientRect();
        xy.textContent = "X " + Math.round(rr.left - b.left) + "  Y " + Math.round(rr.top - b.top);
      });

      var end = function () {
        if (!drag) return;
        drag = false;
        el.classList.remove("is-dragging");
      };
      el.addEventListener("pointerup", end);
      el.addEventListener("pointercancel", end);
    });
  }

  // ---- Accordions: Experience and Expertise (one open at a time) ----
  function accordion(container, itemSel, btnSel, keepOne) {
    if (!container) return;
    var items = Array.prototype.slice.call(container.querySelectorAll(itemSel));
    items.forEach(function (item) {
      var btn = item.querySelector(btnSel);
      if (!btn || btn.tagName !== "BUTTON") return;
      btn.addEventListener("click", function () {
        var open = item.classList.contains("is-open");
        if (open && keepOne) return;
        items.forEach(function (other) {
          var ob = other.querySelector(btnSel);
          var on = other === item && !open;
          other.classList.toggle("is-open", on);
          if (ob && ob.tagName === "BUTTON") ob.setAttribute("aria-expanded", String(on));
        });
      });
    });
  }
  accordion(document.querySelector("[data-ex]"), ".ex-item", "button", true);
  accordion(document.querySelector("[data-xp]"), ".xp-item", ".xp-row", false);

  // ---- About: words light up as you scroll past ----
  var lead = document.querySelector("[data-words]");
  if (lead) {
    var words = lead.textContent.trim().split(/\s+/);
    lead.setAttribute("aria-label", words.join(" "));
    lead.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true">' + esc(w) + "</span>"; }).join(" ");
    var spans = Array.prototype.slice.call(lead.querySelectorAll(".w"));
    if (reduce) {
      spans.forEach(function (s) { s.classList.add("is-lit"); });
    } else {
      var lightUp = function () {
        var r = lead.getBoundingClientRect();
        var vh = window.innerHeight;
        // 0 when the paragraph enters at 85% of the screen, 1 when its end reaches 45%
        var t = (vh * 0.85 - r.top) / (r.height + vh * 0.4);
        var n = Math.round(Math.max(0, Math.min(1, t)) * spans.length);
        spans.forEach(function (s, i) { s.classList.toggle("is-lit", i < n); });
      };
      lightUp();
      window.addEventListener("scroll", function () { requestAnimationFrame(lightUp); }, { passive: true });
    }
  }

  // ---- Marquee: duplicate the list so the loop is seamless ----
  document.querySelectorAll("[data-marquee] .marquee-track").forEach(function (track) {
    Array.prototype.slice.call(track.children).forEach(function (li) {
      var copy = li.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      track.appendChild(copy);
    });
  });

  // ---- Figma multiplayer cursor: arrow + name tag that says what a click does ----
  var figCursor = document.querySelector("[data-fig-cursor]");
  if (figCursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var figLabel = figCursor.querySelector("[data-fig-label]");
    var figX = -100, figY = -100, figRaf = 0;
    root.classList.add("has-fig-cursor");

    // What the tag says over each kind of target (most specific first)
    var labelFor = function (el) {
      if (!el || !el.closest) return "You";
      if (el.closest(".frame .h-br")) return "Resize";
      if (el.closest("[data-sticker]")) return "Drag";
      if (el.closest("[data-copy]")) return "Copy";
      if (el.closest("[data-accent-btn]")) return "Recolor";
      if (el.closest(".card.is-link")) return "View";
      if (el.closest(".pj-shot-btn")) return "Zoom";
      var a = el.closest("a, button");
      if (a) {
        var href = a.getAttribute("href") || "";
        if (href.indexOf("mailto:") === 0) return "Say hi";
        if (a.tagName === "A") return href.charAt(0) === "#" ? "Go" : "Open";
        return "Click";
      }
      return "You";
    };

    var place = function () {
      figRaf = 0;
      figCursor.style.transform = "translate3d(" + figX + "px," + figY + "px,0)";
    };

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      figX = e.clientX;
      figY = e.clientY;
      figCursor.classList.add("is-visible");
      if (!figRaf) figRaf = requestAnimationFrame(place);
    }, { passive: true });

    document.addEventListener("pointerover", function (e) {
      var text = labelFor(e.target);
      if (figLabel.textContent !== text) figLabel.textContent = text;
      figCursor.classList.toggle("is-action", text !== "You");
    });

    window.addEventListener("pointerdown", function () { figCursor.classList.add("is-down"); });
    window.addEventListener("pointerup", function () { figCursor.classList.remove("is-down"); });
    root.addEventListener("pointerleave", function () { figCursor.classList.remove("is-visible"); });
    window.addEventListener("blur", function () { figCursor.classList.remove("is-visible"); });
  }

  // ---- Background dots clear around the mouse (eased so it trails a little) ----
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var rootStyle = root.style;
    var target = { x: -999, y: -999 };
    var lens = { x: -999, y: -999 };
    var raf = 0;
    var stepLens = function () {
      lens.x += (target.x - lens.x) * (reduce ? 1 : 0.18);
      lens.y += (target.y - lens.y) * (reduce ? 1 : 0.18);
      rootStyle.setProperty("--mx", lens.x.toFixed(1) + "px");
      rootStyle.setProperty("--my", lens.y.toFixed(1) + "px");
      raf = Math.abs(target.x - lens.x) + Math.abs(target.y - lens.y) > 0.5 ? requestAnimationFrame(stepLens) : 0;
    };
    window.addEventListener("pointermove", function (e) {
      if (lens.x < -900) { lens.x = e.clientX; lens.y = e.clientY; }
      target.x = e.clientX;
      target.y = e.clientY;
      if (!raf) raf = requestAnimationFrame(stepLens);
    }, { passive: true });
    root.addEventListener("pointerleave", function () {
      target.x = target.y = lens.x = lens.y = -999;
      rootStyle.setProperty("--mx", "-999px");
      rootStyle.setProperty("--my", "-999px");
    });
  }

  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();

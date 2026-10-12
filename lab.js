/*
 * LAB: "Designed in Figma, built in WordPress".
 * Left pane: the Figma logo + wordmark as a design. It never changes.
 * Right pane: a cursor drags Elementor widgets onto a WordPress page and
 * rebuilds the same logo piece by piece, then hits Publish. Loops.
 * Self-contained: remove this file + the .lab section to drop it.
 */
(function () {
  "use strict";

  var root = document.querySelector("[data-lab]");
  if (!root || !root.animate) return;

  var builder = root.querySelector("[data-builder]");
  var pieces = Array.prototype.slice.call(builder.querySelectorAll(".build-piece"));
  var cursor = builder.querySelector("[data-cursor]");
  var ghost = builder.querySelector("[data-ghost]");
  var outline = builder.querySelector("[data-outline]");
  var toast = builder.querySelector("[data-toast]");
  var publish = builder.querySelector("[data-publish]");
  var artSel = root.querySelector("[data-art-sel]");
  var artSize = root.querySelector("[data-art-size]");
  var replay = document.querySelector("[data-replay]");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EASE = "cubic-bezier(0.45, 0, 0.2, 1)";
  var SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

  var run = 0;          // bumps on every restart; old loops notice and stop
  var visible = false;
  var pos = { x: 0, y: 0 };

  // ---- helpers ----
  function stopIfStale(id) { if (id !== run) throw "stopped"; }

  function wait(ms, id) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); }).then(function () { stopIfStale(id); });
  }

  function box(el) {
    var b = builder.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height,
             cx: r.left - b.left + r.width / 2, cy: r.top - b.top + r.height / 2 };
  }

  function tr(x, y) { return "translate(" + x + "px," + y + "px)"; }

  // Move the cursor (and the dragged ghost, if it's showing) to x, y
  function move(x, y, ms, id, withGhost) {
    var a = cursor.animate([{ transform: tr(pos.x, pos.y) }, { transform: tr(x, y) }],
      { duration: ms, easing: EASE, fill: "forwards" });
    if (withGhost) {
      ghost.animate([{ transform: tr(pos.x + 12, pos.y + 14) }, { transform: tr(x + 12, y + 14) }],
        { duration: ms, easing: EASE, fill: "forwards" });
    }
    pos = { x: x, y: y };
    return a.finished.then(function () { stopIfStale(id); });
  }

  function click() {
    cursor.animate(
      [{ transform: tr(pos.x, pos.y) + " scale(1)" }, { transform: tr(pos.x, pos.y) + " scale(0.8)" }, { transform: tr(pos.x, pos.y) + " scale(1)" }],
      { duration: 220, easing: "ease-out" }
    );
  }

  function fade(el, from, to, ms, extra) {
    var a = { opacity: from }, b = { opacity: to };
    if (extra) { a.transform = extra[0]; b.transform = extra[1]; }
    return el.animate([a, b], { duration: ms, easing: "ease", fill: "forwards" });
  }

  function reset() {
    builder.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); });
    builder.querySelectorAll(".is-grab").forEach(function (t) { t.classList.remove("is-grab"); });
    pieces.forEach(function (p) { p.style.opacity = ""; });
    toast.style.opacity = "";
  }

  function sizeFigma() {
    var r = artSel.getBoundingClientRect();
    artSize.textContent = Math.round(r.width) + " × " + Math.round(r.height);
  }

  // ---- the loop ----
  async function loop() {
    var id = ++run;
    try {
      while (true) {
        reset();
        var canvas = builder.querySelector(".el-canvas");
        var c = box(canvas);
        pos = { x: c.x + c.w * 0.75, y: c.y + c.h * 0.8 };
        cursor.style.transform = tr(pos.x, pos.y);
        fade(cursor, 0, 1, 250);
        await wait(450, id);

        // Drag one widget per piece
        for (var i = 0; i < pieces.length; i++) {
          var piece = pieces[i];
          var tile = builder.querySelector('.el-tile[data-tile="' + piece.getAttribute("data-tile") + '"]');

          var t = box(tile);
          await move(t.cx - 3, t.cy - 6, 420, id);
          click();
          tile.classList.add("is-grab");
          ghost.textContent = tile.textContent.trim();
          ghost.style.transform = tr(pos.x + 12, pos.y + 14);
          fade(ghost, 0, 1, 120);
          await wait(140, id);

          var p = box(piece);
          await move(p.cx, p.cy, 560, id, true);

          // Drop
          click();
          fade(ghost, 1, 0, 120);
          tile.classList.remove("is-grab");
          piece.animate(
            [{ opacity: 0, transform: "scale(0.6)" }, { opacity: 1, transform: "scale(1)" }],
            { duration: 380, easing: SPRING, fill: "forwards" }
          );
          // the outline lives inside the canvas, so position it relative to that
          outline.style.left = p.x - 4 - c.x + "px";
          outline.style.top = p.y - 4 - c.y + "px";
          outline.style.width = p.w + 8 + "px";
          outline.style.height = p.h + 8 + "px";
          outline.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }],
            { duration: 750, easing: "linear" });
          await wait(220, id);
        }

        // Publish
        var pub = box(publish);
        await move(pub.cx - 4, pub.cy - 4, 600, id);
        click();
        publish.animate([{ transform: "scale(1)" }, { transform: "scale(0.9)" }, { transform: "scale(1)" }], { duration: 240 });
        await wait(200, id);
        fade(toast, 0, 1, 350, ["translate(-50%, 8px)", "translate(-50%, 0)"]);
        fade(cursor, 1, 0, 300);
        await wait(2600, id);

        // Clear the page and build it again
        fade(toast, 1, 0, 300, ["translate(-50%, 0)", "translate(-50%, 8px)"]);
        pieces.forEach(function (pc) { fade(pc, 1, 0, 350); });
        await wait(700, id);
      }
    } catch (e) {
      /* stopped by a restart or by scrolling away */
    }
  }

  function showFinal() {
    reset();
    pieces.forEach(function (p) { p.style.opacity = "1"; });
    toast.style.opacity = "1";
    toast.style.transform = "translate(-50%, 0)";
  }

  function start() { reduce ? showFinal() : loop(); }

  sizeFigma();
  window.addEventListener("resize", sizeFigma);

  // Only animate while it's on screen
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      var on = entries[0].isIntersecting;
      if (on && !visible) start();
      if (!on && visible) run++;
      visible = on;
    }, { threshold: 0.3 }).observe(root);
  } else {
    start();
  }

  replay.addEventListener("click", start);
})();

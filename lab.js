/*
 * LAB: Figma logo is assembled piece by piece, gets "selected",
 * then collapses and is rebuilt as the WordPress logo. Loops.
 * Self-contained: remove this file + the .lab section to drop it.
 */
(function () {
  "use strict";

  var stage = document.querySelector("[data-stage]");
  if (!stage || !stage.animate) return;

  var pieces = Array.prototype.slice.call(stage.querySelectorAll(".fig-piece"));
  var ring = stage.querySelector(".wp-ring");
  var wp = stage.querySelector(".wp-logo");
  var sel = stage.querySelector("[data-sel]");
  var label = stage.querySelector("[data-sel-label]");
  var size = stage.querySelector("[data-sel-size]");
  var replay = document.querySelector("[data-replay]");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var run = 0;       // bumps on every restart so an old loop stops itself
  var visible = false;

  var SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";
  var EASE = "cubic-bezier(0.2, 0.7, 0.1, 1)";

  function nums(el, attr) { return el.getAttribute(attr).split(",").map(Number); }

  function wait(ms, id) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
    });
  }

  function setSize() {
    var r = sel.getBoundingClientRect();
    size.textContent = Math.round(r.width) + " × " + Math.round(r.height);
  }

  function reset() {
    stage.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); });
    sel.classList.remove("is-on", "is-wp");
    label.textContent = "Figma";
  }

  function showFinal() {
    // Reduced motion: just show the WordPress end state.
    reset();
    sel.classList.add("is-on", "is-wp");
    label.textContent = "WordPress";
    wp.style.opacity = "1";
    setTimeout(setSize, 50);
  }

  async function loop() {
    var id = ++run;
    try {
      while (id === run) {
        reset();
        await wait(300, id);

        // 1. Assemble the Figma logo, one piece at a time
        pieces.forEach(function (p, i) {
          var f = nums(p, "data-from");
          p.animate(
            [
              { opacity: 0, transform: "translate(" + f[0] + "px," + f[1] + "px) scale(0.4) rotate(-30deg)" },
              { opacity: 1, transform: "none" }
            ],
            { duration: 600, delay: i * 140, easing: SPRING, fill: "forwards" }
          );
        });
        await wait(5 * 140 + 500, id);

        // 2. Select it
        sel.classList.add("is-on");
        setSize();
        await wait(1300, id);

        // 3. Collapse the pieces into the centre while the frame reshapes
        pieces.forEach(function (p, i) {
          var c = nums(p, "data-c");
          var dx = 19 - c[0], dy = 28.5 - c[1];
          p.animate(
            [
              { opacity: 1, transform: "none" },
              { opacity: 0, transform: "translate(" + dx + "px," + dy + "px) scale(0) rotate(90deg)" }
            ],
            { duration: 520, delay: i * 40, easing: "cubic-bezier(0.5, 0, 0.75, 0)", fill: "forwards" }
          );
        });
        sel.classList.add("is-wp");
        label.textContent = "WordPress";
        await wait(350, id);

        // 4. Draw the WordPress ring, then drop in the W
        ring.animate(
          [{ strokeDashoffset: 1, opacity: 1 }, { strokeDashoffset: 0, opacity: 1 }],
          { duration: 700, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" }
        );
        setTimeout(function () { if (id === run) setSize(); }, 650);
        await wait(600, id);

        wp.animate(
          [{ opacity: 0, transform: "scale(0.85)" }, { opacity: 1, transform: "scale(1)" }],
          { duration: 450, easing: SPRING, fill: "forwards" }
        );
        ring.animate(
          [{ strokeDashoffset: 0, opacity: 1 }, { strokeDashoffset: 0, opacity: 0 }],
          { duration: 450, delay: 150, easing: EASE, fill: "forwards" }
        );
        await wait(2200, id);

        // 5. Fade out and go again
        sel.classList.remove("is-on");
        wp.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" });
        await wait(600, id);
      }
    } catch (e) {
      /* stopped by a restart */
    }
  }

  function start() { reduce ? showFinal() : loop(); }

  // Only run while the stage is on screen
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      var on = entries[0].isIntersecting;
      if (on && !visible) start();
      if (!on && visible) { run++; }
      visible = on;
    }, { threshold: 0.3 }).observe(stage);
  } else {
    start();
  }

  replay.addEventListener("click", function () { wp.style.opacity = ""; start(); });
})();

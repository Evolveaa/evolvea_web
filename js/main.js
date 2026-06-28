/* ===========================================================
   Evolvea — landing prototype interactions
   =========================================================== */
(function () {
  "use strict";

  /* ---- Sticky header: shadow + light/dark over sections ---- */
  var header = document.querySelector(".site-header");
  var demo = document.getElementById("demo");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
    if (demo) {
      var top = demo.getBoundingClientRect().top;
      var bot = demo.getBoundingClientRect().bottom;
      header.classList.toggle("on-dark", top <= 60 && bot >= 60);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ===========================================================
     Phone live demo — state machine
     0 Intro · 1 Read · 2 Do · 3 Reflect · 4 Done
     =========================================================== */
  var phone = document.querySelector(".phone");
  if (phone) {
    var panels = phone.querySelectorAll(".ph-panel");
    var tabs = phone.querySelectorAll(".ph-tab");
    var current = 0;

    function show(i) {
      i = Math.max(0, Math.min(panels.length - 1, i));
      current = i;
      panels.forEach(function (p, idx) {
        p.classList.toggle("is-active", idx === i);
      });
      tabs.forEach(function (t, idx) {
        t.classList.toggle("is-active", idx === i);
        t.classList.toggle("is-done", idx < i);
      });
    }

    // Tabs jump directly
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        show(parseInt(t.getAttribute("data-go"), 10) || 0);
      });
    });

    // Next / Back / Replay
    phone.addEventListener("click", function (e) {
      var el = e.target.closest("[data-next],[data-back],[data-replay]");
      if (!el) return;
      if (el.hasAttribute("data-next")) show(current + 1);
      else if (el.hasAttribute("data-back")) show(current - 1);
      else if (el.hasAttribute("data-replay")) {
        resetSignals();
        resetSays();
        resetFields();
        show(0);
      }
    });

    /* ---- "Feel" step: tappable emotion chips + counter ---- */
    var signals = phone.querySelectorAll("[data-signal]");
    var countEl = phone.querySelector("[data-signal-count]");
    function refreshCount() {
      var n = phone.querySelectorAll("[data-signal].on").length;
      if (countEl) countEl.textContent = String(n);
    }
    function resetSignals() {
      signals.forEach(function (s) {
        s.classList.remove("on");
      });
      refreshCount();
    }
    signals.forEach(function (s) {
      s.addEventListener("click", function () {
        s.classList.toggle("on");
        refreshCount();
      });
    });

    /* ---- "Anchor" step: pick one statement to say aloud ---- */
    var says = phone.querySelectorAll("[data-say]");
    function resetSays() {
      says.forEach(function (s) {
        s.classList.remove("sel");
      });
    }
    says.forEach(function (s) {
      s.addEventListener("click", function () {
        var wasSel = s.classList.contains("sel");
        resetSays();
        if (!wasSel) s.classList.add("sel");
      });
    });

    /* ---- Clear the open-question text fields on replay ---- */
    var fields = phone.querySelectorAll(".ph-input");
    function resetFields() {
      fields.forEach(function (f) {
        f.value = "";
      });
    }

    show(0);
  }

  /* ---- Reveal on scroll ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  }
})();

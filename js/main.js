(function () {
  var bd = window.BD || {};

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function setupNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-nav]");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function setupCountdown() {
    var root = document.querySelector("[data-countdown]");
    if (!root || !bd.releaseISO) return;
    var target = new Date(bd.releaseISO).getTime();
    var units = {
      d: root.querySelector("[data-unit='d']"),
      h: root.querySelector("[data-unit='h']"),
      m: root.querySelector("[data-unit='m']"),
      s: root.querySelector("[data-unit='s']")
    };

    var timer = 0;
    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        window.clearInterval(timer);
        root.innerHTML = "<p>A LP Braços Abertos está na janela de lançamento.</p>";
        return;
      }
      var total = Math.floor(diff / 1000);
      var days = Math.floor(total / 86400);
      var hours = Math.floor((total % 86400) / 3600);
      var minutes = Math.floor((total % 3600) / 60);
      var seconds = total % 60;
      if (units.d) units.d.textContent = pad(days);
      if (units.h) units.h.textContent = pad(hours);
      if (units.m) units.m.textContent = pad(minutes);
      if (units.s) units.s.textContent = pad(seconds);
    }

    tick();
    timer = window.setInterval(tick, 1000);
  }

  function setupFilters() {
    var bar = document.querySelector("[data-filters]");
    if (!bar) return;
    var buttons = bar.querySelectorAll("button");
    var items = document.querySelectorAll("[data-kind]");
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var kind = button.getAttribute("data-filter");
        buttons.forEach(function (item) {
          item.setAttribute("aria-pressed", item === button ? "true" : "false");
        });
        items.forEach(function (item) {
          var show = kind === "todos" || item.getAttribute("data-kind") === kind;
          item.hidden = !show;
        });
      });
    });
  }

  function setupLightbox() {
    var dialog = document.getElementById("lightbox");
    if (!dialog) return;
    var img = dialog.querySelector("img");
    var cap = dialog.querySelector("[data-lightbox-cap]");
    var shots = Array.prototype.slice.call(document.querySelectorAll("[data-full]"));
    var index = 0;

    function show(nextIndex) {
      index = (nextIndex + shots.length) % shots.length;
      var shot = shots[index];
      img.src = shot.getAttribute("data-full");
      img.alt = shot.getAttribute("data-alt") || "";
      cap.textContent = shot.getAttribute("data-cap") || "";
      if (!dialog.open && typeof dialog.showModal === "function") dialog.showModal();
    }

    shots.forEach(function (shot, shotIndex) {
      shot.addEventListener("click", function () { show(shotIndex); });
    });

    var prev = dialog.querySelector("[data-lightbox-prev]");
    var next = dialog.querySelector("[data-lightbox-next]");
    if (prev) prev.addEventListener("click", function () { show(index - 1); });
    if (next) next.addEventListener("click", function () { show(index + 1); });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
  }

  function setupCopy() {
    document.querySelectorAll("[data-copy]").forEach(function (button) {
      button.addEventListener("click", function () {
        var target = document.querySelector(button.getAttribute("data-copy"));
        if (!target) return;
        var text = target.innerText.trim();
        var original = button.textContent;
        function done() {
          button.textContent = "Copiado";
          window.setTimeout(function () { button.textContent = original; }, 1600);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () {
            button.textContent = "Selecione o texto";
          });
          return;
        }
        button.textContent = "Selecione o texto";
      });
    });
  }

  function fieldError(form) {
    var note = form.querySelector("[data-form-note]");
    if (!note) return;
    note.dataset.state = "err";
    note.textContent = "Revise os campos marcados antes de enviar.";
  }

  function setupForms() {
    document.querySelectorAll("form[data-netlify='true']").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var note = form.querySelector("[data-form-note]");
        if (!form.reportValidity()) {
          fieldError(form);
          return;
        }
        var bot = form.querySelector("[name='bot-field']");
        if (bot && bot.value) {
          if (note) {
            note.dataset.state = "ok";
            note.textContent = "Recebido.";
          }
          form.reset();
          return;
        }
        var data = new URLSearchParams(new FormData(form));
        var button = form.querySelector("[type='submit']");
        if (button) button.disabled = true;
        fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: data.toString()
        }).then(function (response) {
          if (!response.ok) throw new Error("status");
          if (note) {
            note.dataset.state = "ok";
            note.textContent = "Pedido registrado. A dupla responde por e-mail.";
          }
          form.reset();
        }).catch(function () {
          if (note) {
            note.dataset.state = "err";
            note.textContent = "Este ambiente ainda não grava o formulário. Escreva para " + (bd.email || "booking@brothersdance.com.br") + ".";
          }
        }).finally(function () {
          if (button) button.disabled = false;
        });
      });
    });
  }

  function setupReveal() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!nodes.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach(function (node) { node.classList.add("is-in"); });
      return;
    }
    function check() {
      var view = window.innerHeight || document.documentElement.clientHeight;
      nodes.forEach(function (node) {
        if (node.classList.contains("is-in")) return;
        var rect = node.getBoundingClientRect();
        if (rect.top < view * 0.92 && rect.bottom > 40) node.classList.add("is-in");
      });
    }
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
  }

  function setupSentFlag() {
    if (window.location.search.indexOf("enviado=1") === -1 && window.location.hash !== "#enviado") return;
    var note = document.querySelector("[data-form-note]");
    if (!note) return;
    note.dataset.state = "ok";
    note.textContent = "Mensagem enviada. O retorno chega no e-mail informado.";
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupNav();
    setupCountdown();
    setupFilters();
    setupLightbox();
    setupCopy();
    setupForms();
    setupSentFlag();
    setupReveal();
  });
})();

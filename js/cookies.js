(function () {
  var bd = window.BD || {};
  var key = bd.consentKey || "bd-consent-v1";
  var version = bd.consentVersion || "2026-10-27";

  function read() {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.version !== version) return null;
      return data;
    } catch (error) {
      return null;
    }
  }

  function write(choice) {
    var data = {
      version: version,
      necessary: true,
      analytics: Boolean(choice.analytics),
      marketing: Boolean(choice.marketing),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(data));
    apply(data);
    return data;
  }

  function apply(data) {
    document.documentElement.dataset.analytics = data.analytics ? "on" : "off";
    document.documentElement.dataset.marketing = data.marketing ? "on" : "off";
    window.bdConsent = data;
    document.dispatchEvent(new CustomEvent("bd:consent", { detail: data }));
  }

  function banner() {
    var bar = document.createElement("div");
    bar.className = "cookie-banner";
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-label", "Cookies e privacidade");
    bar.innerHTML =
      "<p>Este site guarda só o que você autorizar. Os cookies necessários lembram esta escolha. Audiência e campanha ficam desligados até um sim explícito. Leia a <a href=\"cookies.html\">política de cookies</a>.</p>" +
      "<div class=\"cookie-actions\">" +
      "<button type=\"button\" class=\"btn btn-solid\" data-accept>Aceitar tudo</button>" +
      "<button type=\"button\" class=\"btn btn-line\" data-reject>Recusar opcionais</button>" +
      "<button type=\"button\" class=\"btn btn-line\" data-custom>Personalizar</button>" +
      "</div>";
    document.body.appendChild(bar);
    bar.querySelector("[data-accept]").addEventListener("click", function () {
      write({ analytics: true, marketing: true });
      bar.remove();
    });
    bar.querySelector("[data-reject]").addEventListener("click", function () {
      write({ analytics: false, marketing: false });
      bar.remove();
    });
    bar.querySelector("[data-custom]").addEventListener("click", function () {
      openDialog();
    });
    return bar;
  }

  function ensureDialog() {
    var existing = document.getElementById("cookie-dialog");
    if (existing) return existing;
    var dialog = document.createElement("dialog");
    dialog.id = "cookie-dialog";
    dialog.className = "cookie-dialog";
    dialog.innerHTML =
      "<form method=\"dialog\">" +
      "<h2>Preferências de cookies</h2>" +
      "<p>Versão " + version + ". Nada de pixel, fonte externa de anúncio ou medição entra no navegador sem a chave correspondente.</p>" +
      "<div class=\"switch\"><div><strong>Necessários</strong><p>Guardam esta escolha no seu navegador. Sempre ativos.</p></div><input type=\"checkbox\" checked disabled aria-label=\"Cookies necessários, sempre ativos\"></div>" +
      "<div class=\"switch\"><div><strong>Audiência</strong><p>Medição de visita, se um dia for instalada. Hoje nenhum script de audiência é carregado.</p></div><input id=\"consent-analytics\" type=\"checkbox\"></div>" +
      "<div class=\"switch\"><div><strong>Campanha</strong><p>Pixels de anúncio e remarketing. Hoje nenhum pixel é carregado.</p></div><input id=\"consent-marketing\" type=\"checkbox\"></div>" +
      "<div class=\"cookie-actions\">" +
      "<button type=\"submit\" class=\"btn btn-solid\" value=\"save\">Salvar escolha</button>" +
      "<button type=\"submit\" class=\"btn btn-line\" value=\"cancel\">Fechar</button>" +
      "</div></form>";
    document.body.appendChild(dialog);
    dialog.querySelector("form").addEventListener("submit", function (event) {
      if (!event.submitter || event.submitter.value !== "save") return;
      write({
        analytics: dialog.querySelector("#consent-analytics").checked,
        marketing: dialog.querySelector("#consent-marketing").checked
      });
      var bar = document.querySelector(".cookie-banner");
      if (bar) bar.remove();
    });
    return dialog;
  }

  function openDialog() {
    var dialog = ensureDialog();
    var current = read() || { analytics: false, marketing: false };
    dialog.querySelector("#consent-analytics").checked = Boolean(current.analytics);
    dialog.querySelector("#consent-marketing").checked = Boolean(current.marketing);
    if (typeof dialog.showModal === "function") dialog.showModal();
  }

  document.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-cookie-settings]");
    if (!trigger) return;
    event.preventDefault();
    openDialog();
  });

  document.addEventListener("DOMContentLoaded", function () {
    var saved = read();
    if (saved) {
      apply(saved);
      return;
    }
    apply({ analytics: false, marketing: false, necessary: true, version: version });
    banner();
  });
})();

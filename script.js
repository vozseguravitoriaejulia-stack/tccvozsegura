/* ============================================================
   Voz Segura — interações
   Menu mobile · rolagem suave · navegação ativa · modal de denúncia
   · área restrita (senha) para consulta das denúncias
   ============================================================ */
(function () {
  "use strict";

  const header = document.querySelector(".site-header");
  const nav = document.getElementById("primary-nav");
  const menuToggle = document.getElementById("menu-toggle");

  /* ----------------------------------------------------------
     Configuração da área restrita
     ---------------------------------------------------------- */
  const STORAGE_KEY = "vozsegura.denuncias";
  const AUTH_KEY = "vozsegura.autenticado";

  // Hash SHA-256 da senha padrão "vozsegura2024".
  // Para trocar a senha, substitua este valor pelo hash da nova senha
  // (veja o README). A senha em texto puro NÃO fica no código.
  const ACCESS_HASH = "574167af28916952c6bf65831e0cc6864c602458cfe23a343804fc31d7106d60";

  /* ----------------------------------------------------------
     Utilidades
     ---------------------------------------------------------- */
  const headerOffset = () => (header ? header.offsetHeight : 0);

  function smoothScrollTo(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset() + 1;
    window.scrollTo({ top, behavior: "smooth" });
  }

  /* ----------------------------------------------------------
     1. Menu mobile
     ---------------------------------------------------------- */
  function closeMenu() {
    if (!nav) return;
    nav.classList.remove("is-open");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
  }

  function toggleMenu() {
    if (!nav) return;
    const isOpen = nav.classList.toggle("is-open");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", String(isOpen));
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleMenu();
    });
  }

  document.addEventListener("click", function (event) {
    if (!nav || !nav.classList.contains("is-open")) return;
    if (!nav.contains(event.target) && event.target !== menuToggle) closeMenu();
  });

  /* ----------------------------------------------------------
     2. Rolagem suave + link ativo
     ---------------------------------------------------------- */
  const scrollTriggers = document.querySelectorAll("[data-scroll]");

  scrollTriggers.forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      smoothScrollTo(trigger.dataset.scroll);
      closeMenu();
    });
  });

  const navLinks = Array.prototype.slice.call(
    document.querySelectorAll(".nav__link[data-scroll]")
  );

  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      link.classList.toggle("is-active", link.dataset.scroll === id);
    });
  }

  if ("IntersectionObserver" in window && navLinks.length) {
    const sections = navLinks
      .map(function (link) {
        return document.getElementById(link.dataset.scroll);
      })
      .filter(Boolean);

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActiveLink(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ----------------------------------------------------------
     3. Animação de entrada das seções
     ---------------------------------------------------------- */
  const revealItems = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && revealItems.length) {
    const revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  /* ----------------------------------------------------------
     Armazenamento local das denúncias
     ---------------------------------------------------------- */
  function loadReports() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function saveReports(reports) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch (error) {
      /* armazenamento indisponível: a denúncia ainda é confirmada ao usuário */
    }
  }

  function makeProtocol() {
    const stamp = Date.now().toString(36).toUpperCase();
    const random = Math.floor(Math.random() * 1679616)
      .toString(36)
      .toUpperCase()
      .padStart(4, "0");
    return "VZ-" + stamp + "-" + random;
  }

  /* ----------------------------------------------------------
     4. Controle genérico dos modais
     ---------------------------------------------------------- */
  let activeModal = null;
  let lastFocused = null;

  function firstVisibleFocusable(container) {
    const nodes = container.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    for (let i = 0; i < nodes.length; i += 1) {
      if (nodes[i].offsetParent !== null) return nodes[i];
    }
    return null;
  }

  function openModal(modalEl) {
    if (!modalEl) return;
    lastFocused = document.activeElement;
    activeModal = modalEl;
    modalEl.hidden = false;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(function () {
      const first = firstVisibleFocusable(modalEl);
      if (first) first.focus();
    });
  }

  function closeModal() {
    if (!activeModal) return;
    activeModal.hidden = true;
    activeModal = null;
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  document
    .querySelectorAll("[data-close-modal], [data-close-access]")
    .forEach(function (button) {
      button.addEventListener("click", closeModal);
    });

  document.addEventListener("keydown", function (event) {
    if (!activeModal) return;

    if (event.key === "Escape") {
      closeModal();
      return;
    }

    // Mantém o foco dentro do modal aberto.
    if (event.key === "Tab") {
      const dialog = activeModal.querySelector(".modal__dialog");
      if (!dialog) return;
      const focusable = dialog.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const visible = Array.prototype.filter.call(focusable, function (el) {
        return el.offsetParent !== null;
      });
      if (!visible.length) return;

      const first = visible[0];
      const last = visible[visible.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  /* ----------------------------------------------------------
     5. Modal de denúncia
     ---------------------------------------------------------- */
  const reportModal = document.getElementById("report-modal");
  const reportForm = document.getElementById("report-form");
  const reportError = document.getElementById("report-error");
  const formView = reportModal && reportModal.querySelector('[data-report-view="form"]');
  const successView = reportModal && reportModal.querySelector('[data-report-view="success"]');

  function showReportView(view) {
    if (formView) formView.hidden = view !== "form";
    if (successView) successView.hidden = view !== "success";
  }

  function openReportModal() {
    showReportView("form");
    if (reportError) reportError.hidden = true;
    if (reportForm) reportForm.reset();
    openModal(reportModal);
  }

  document.querySelectorAll("[data-report]").forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      closeMenu();
      openReportModal();
    });
  });

  if (reportForm) {
    reportForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const type = reportForm.querySelector("#report-type");
      const description = reportForm.querySelector("#report-description");
      const place = reportForm.querySelector("#report-place");
      const valid = type.value !== "" && description.value.trim().length > 0;

      if (!valid) {
        if (reportError) reportError.hidden = false;
        (type.value === "" ? type : description).focus();
        return;
      }

      if (reportError) reportError.hidden = true;

      // Protótipo: aqui entraria a chamada real ao backend.
      // No protótipo, a denúncia fica salva neste navegador.
      const reports = loadReports();
      reports.unshift({
        id: makeProtocol(),
        data: new Date().toISOString(),
        tipo: type.value,
        descricao: description.value.trim(),
        local: place && place.value.trim() ? place.value.trim() : "",
      });
      saveReports(reports);

      reportForm.reset();
      showReportView("success");
      const successButton = successView && successView.querySelector("button");
      if (successButton) successButton.focus();
    });
  }

  /* ----------------------------------------------------------
     6. Área restrita — senha e consulta das denúncias
     ---------------------------------------------------------- */
  const accessModal = document.getElementById("access-modal");
  const accessForm = document.getElementById("access-form");
  const accessError = document.getElementById("access-error");
  const loginView = accessModal && accessModal.querySelector('[data-access-view="login"]');
  const listView = accessModal && accessModal.querySelector('[data-access-view="list"]');

  function isAuthenticated() {
    try {
      return sessionStorage.getItem(AUTH_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function setAuthenticated(value) {
    try {
      if (value) sessionStorage.setItem(AUTH_KEY, "1");
      else sessionStorage.removeItem(AUTH_KEY);
    } catch (error) {
      /* sessão indisponível */
    }
  }

  async function sha256(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.prototype.map
      .call(new Uint8Array(digest), function (byte) {
        return byte.toString(16).padStart(2, "0");
      })
      .join("");
  }

  function formatDate(iso) {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }

  function renderReports() {
    const listEl = document.getElementById("reports-list");
    const countEl = document.getElementById("reports-count");
    if (!listEl) return;

    const reports = loadReports();

    if (countEl) {
      countEl.textContent =
        reports.length === 0
          ? "Nenhuma denúncia registrada neste navegador."
          : reports.length === 1
          ? "1 denúncia registrada neste navegador."
          : reports.length + " denúncias registradas neste navegador.";
    }

    listEl.textContent = "";

    if (!reports.length) {
      const empty = document.createElement("p");
      empty.className = "reports__empty";
      empty.textContent = "As denúncias enviadas aparecerão aqui.";
      listEl.appendChild(empty);
      return;
    }

    reports.forEach(function (report, index) {
      const card = document.createElement("article");
      card.className = "report";

      const head = document.createElement("div");
      head.className = "report__head";

      const protocol = document.createElement("span");
      protocol.className = "report__protocol";
      protocol.textContent = report.id || "—";

      const date = document.createElement("time");
      date.className = "report__date";
      if (report.data) date.dateTime = report.data;
      date.textContent = formatDate(report.data);

      head.appendChild(protocol);
      head.appendChild(date);
      card.appendChild(head);

      const type = document.createElement("h4");
      type.className = "report__type";
      type.textContent = report.tipo || "Não informado";
      card.appendChild(type);

      if (report.local) {
        const place = document.createElement("p");
        place.className = "report__place";
        place.textContent = "Local: " + report.local;
        card.appendChild(place);
      }

      const description = document.createElement("p");
      description.className = "report__desc";
      description.textContent = report.descricao || "";
      card.appendChild(description);

      const remove = document.createElement("button");
      remove.className = "report__delete";
      remove.type = "button";
      remove.textContent = "Excluir denúncia";
      remove.addEventListener("click", function () {
        const current = loadReports();
        current.splice(index, 1);
        saveReports(current);
        renderReports();
      });
      card.appendChild(remove);

      listEl.appendChild(card);
    });
  }

  function showAccessView(view) {
    if (loginView) loginView.hidden = view !== "login";
    if (listView) listView.hidden = view !== "list";
  }

  function openAccessModal() {
    closeMenu();
    if (!accessModal) return;
    if (accessError) accessError.hidden = true;
    if (accessForm) accessForm.reset();

    if (isAuthenticated()) {
      renderReports();
      showAccessView("list");
    } else {
      showAccessView("login");
    }

    openModal(accessModal);
  }

  document.querySelectorAll("[data-access]").forEach(function (trigger) {
    trigger.addEventListener("click", openAccessModal);
  });

  if (accessForm) {
    accessForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const passwordInput = accessForm.querySelector("#access-password");
      const submitButton = accessForm.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;

      let unlocked = false;
      try {
        unlocked = (await sha256(passwordInput.value)) === ACCESS_HASH;
      } catch (error) {
        unlocked = false;
      }

      if (submitButton) submitButton.disabled = false;

      if (!unlocked) {
        if (accessError) accessError.hidden = false;
        passwordInput.focus();
        return;
      }

      if (accessError) accessError.hidden = true;
      setAuthenticated(true);
      renderReports();
      showAccessView("list");
      const firstButton = listView && listView.querySelector("button");
      if (firstButton) firstButton.focus();
    });
  }

  document.querySelectorAll("[data-logout]").forEach(function (button) {
    button.addEventListener("click", function () {
      setAuthenticated(false);
      if (accessForm) accessForm.reset();
      showAccessView("login");
      const passwordInput = document.getElementById("access-password");
      if (passwordInput) passwordInput.focus();
    });
  });

  /* ----------------------------------------------------------
     7. PWA — instalação, modo offline e service worker
     ---------------------------------------------------------- */
  const installButton = document.getElementById("install-btn");
  let installPrompt = null;

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    installPrompt = event;
    if (installButton) installButton.hidden = false;
  });

  if (installButton) {
    installButton.addEventListener("click", async function () {
      if (!installPrompt) return;
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice && choice.outcome === "accepted") installButton.hidden = true;
      installPrompt = null;
    });
  }

  window.addEventListener("appinstalled", function () {
    if (installButton) installButton.hidden = true;
    installPrompt = null;
  });

  const offlineBadge = document.getElementById("offline-badge");

  function updateOnlineStatus() {
    if (offlineBadge) offlineBadge.hidden = navigator.onLine !== false;
  }

  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function (error) {
        console.warn("Não foi possível registrar o service worker:", error);
      });
    });
  }
})();

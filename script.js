/* ============================================================
   Voz Segura — interações
   Menu mobile · rolagem suave · navegação ativa · modal de denúncia
   ============================================================ */
(function () {
  "use strict";

  const header = document.querySelector(".site-header");
  const nav = document.getElementById("primary-nav");
  const menuToggle = document.getElementById("menu-toggle");

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
     4. Modal de denúncia
     ---------------------------------------------------------- */
  const modal = document.getElementById("report-modal");
  if (!modal) return;

  const dialog = modal.querySelector(".modal__dialog");
  const formView = modal.querySelector('[data-report-view="form"]');
  const successView = modal.querySelector('[data-report-view="success"]');
  const form = document.getElementById("report-form");
  const errorBox = document.getElementById("report-error");
  const closeButtons = modal.querySelectorAll("[data-close-modal]");
  let lastFocused = null;

  function showView(view) {
    formView.hidden = view !== "form";
    successView.hidden = view !== "success";
  }

  function openModal() {
    lastFocused = document.activeElement;
    showView("form");
    if (errorBox) errorBox.hidden = true;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    const firstField = modal.querySelector("select, input, textarea, button");
    if (firstField) firstField.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (form) form.reset();
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  document.querySelectorAll("[data-report]").forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      closeMenu();
      openModal();
    });
  });

  closeButtons.forEach(function (button) {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", function (event) {
    if (modal.hidden) return;

    if (event.key === "Escape") {
      closeModal();
      return;
    }

    // Mantém o foco dentro do modal
    if (event.key === "Tab" && dialog) {
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
     5. Envio do formulário
     ---------------------------------------------------------- */
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const type = form.querySelector("#report-type");
      const description = form.querySelector("#report-description");
      const valid = type.value !== "" && description.value.trim().length > 0;

      if (!valid) {
        if (errorBox) errorBox.hidden = false;
        (type.value === "" ? type : description).focus();
        return;
      }

      if (errorBox) errorBox.hidden = true;

      // Protótipo: aqui entraria a chamada real ao backend.
      form.reset();
      showView("success");
    });
  }
})();

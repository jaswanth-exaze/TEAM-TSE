// TSE Learning Hub — shared site behavior

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  setFooterYear();
});

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  const setOpen = (isOpen) => {
    const mobileNavigation = window.matchMedia?.("(max-width: 900px)").matches ?? false;
    links.classList.toggle("is-open", isOpen);
    links.inert = mobileNavigation && !isOpen;
    links.setAttribute("aria-hidden", String(mobileNavigation && !isOpen));
    toggle.setAttribute("aria-expanded", String(isOpen));
  };

  toggle.setAttribute("aria-label", "Open navigation menu");
  setOpen(false);

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") !== "true";
    setOpen(isOpen);
    toggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  });

  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      setOpen(false);
      toggle.setAttribute("aria-label", "Open navigation menu");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || toggle.getAttribute("aria-expanded") !== "true") return;
    setOpen(false);
    toggle.setAttribute("aria-label", "Open navigation menu");
    toggle.focus();
  });

  document.addEventListener("pointerdown", (event) => {
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    if (links.contains(event.target) || toggle.contains(event.target)) return;
    setOpen(false);
    toggle.setAttribute("aria-label", "Open navigation menu");
  });

  const desktopViewport = window.matchMedia("(min-width: 901px)");
  const closeOnDesktop = (event) => {
    if (!event.matches) return;
    setOpen(false);
    toggle.setAttribute("aria-label", "Open navigation menu");
  };
  if (desktopViewport.addEventListener) desktopViewport.addEventListener("change", closeOnDesktop);
  else desktopViewport.addListener(closeOnDesktop);
}

function setFooterYear() {
  const el = document.querySelector("[data-year]");
  if (el) el.textContent = new Date().getFullYear();
}

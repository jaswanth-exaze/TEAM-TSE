// Interactive touches for the profile page.
// Everything here is optional polish — the page works fine without it.

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none)").matches;

document.addEventListener("DOMContentLoaded", () => {
  initScrollReveal();
  if (!prefersReducedMotion && !isTouch) {
    initCursorGlow();
    initAvatarTilt();
  }
});

// Fade + rise each section in as it enters the viewport.
function initScrollReveal() {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((el) => observer.observe(el));
}

// A soft glow that trails the pointer around the page.
function initCursorGlow() {
  const glow = document.querySelector(".cursor-glow");
  if (!glow) return;

  let targetX = 0, targetY = 0, x = 0, y = 0;

  window.addEventListener("pointermove", (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    glow.style.opacity = "1";
  });

  window.addEventListener("pointerleave", () => {
    glow.style.opacity = "0";
  });

  function tick() {
    x += (targetX - x) * 0.12;
    y += (targetY - y) * 0.12;
    glow.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Tilts the avatar slightly toward the pointer, like it's magnetic.
function initAvatarTilt() {
  const wrap = document.querySelector("[data-tilt]");
  if (!wrap) return;

  wrap.addEventListener("mousemove", (e) => {
    const rect = wrap.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    wrap.style.transform = `rotateY(${relX * 24}deg) rotateX(${relY * -24}deg)`;
  });

  wrap.addEventListener("mouseleave", () => {
    wrap.style.transform = "rotateY(0deg) rotateX(0deg)";
  });
}
// Keeps the supplied Exaze-to-TSE SVG morph self-contained and lightweight.
export function attachLogoMorph(stage, { interactive = false, idPrefix = "" } = {}) {
  const L = (a, b, c, d) => [a + (c - a) / 3, b + (d - b) / 3, a + (c - a) * 2 / 3, b + (d - b) * 2 / 3, c, d];
  const mid = (a, b) => (a + b) / 2;

  function split(x, y, segment) {
    const [a1, a2, b1, b2, x1, y1] = segment;
    const A = [mid(x, a1), mid(y, a2)];
    const B = [mid(a1, b1), mid(a2, b2)];
    const C = [mid(b1, x1), mid(b2, y1)];
    const D = [mid(A[0], B[0]), mid(A[1], B[1])];
    const E = [mid(B[0], C[0]), mid(B[1], C[1])];
    const F = [mid(D[0], E[0]), mid(D[1], E[1])];
    return [[...A, ...D, ...F], [...E, ...C, x1, y1]];
  }

  function four(points) {
    let x = points[0];
    let y = points[1];
    const output = [x, y];
    for (let i = 2; i < points.length; i += 6) {
      const segment = points.slice(i, i + 6);
      const [first, second] = split(x, y, segment);
      output.push(...first, ...second);
      x = segment[4];
      y = segment[5];
    }
    return output;
  }

  const shiftX = (points, dx) => points.map((value, index) => index % 2 ? value : value + dx);
  const dots = [165, 355, 165, 355, 165, 355, 165, 355];
  const shapes = {
    logo: {
      b: [325, 75, 250, 150, 170, 230, 95, 305, 55, 345, 45, 400, 70, 480],
      g: [445, 285, 385, 345, 300, 420, 255, 465, 195, 525, 215, 620, 300, 655, 360, 675, 410, 650, 450, 610, 490, 570, 520, 530, 550, 490],
      m: dots,
      w: [118, 132, 0],
    },
    T: {
      // The crossbar rises through the centre, with softly dropped ends.
      b: [130, 164, 190, 153, 252, 145, 312, 145, 375, 145, 435, 153, 495, 164],
      g: [312, 215, ...L(312, 215, 312, 310), ...L(312, 310, 312, 405), ...L(312, 405, 312, 500), ...L(312, 500, 312, 595)],
      m: dots,
      w: [96, 96, 0],
    },
    S: {
      b: shiftX([440, 170, 395, 92, 175, 92, 160, 222, 152, 305, 250, 322, 300, 352], 14),
      g: shiftX(four([300, 352, 385, 385, 465, 418, 450, 508, 432, 610, 200, 622, 140, 545]), 14),
      m: dots,
      w: [88, 88, 0],
    },
    E: {
      b: [140, 166, 195, 153, 250, 150, 305, 150, 360, 150, 415, 153, 470, 166],
      g: [165, 225, ...L(165, 225, 165, 355), ...L(165, 355, 165, 490), 165, 535, 190, 566, 235, 566, ...L(235, 566, 470, 566)],
      m: [165, 357, 245, 343, 345, 343, 425, 357],
      w: [92, 92, 92],
    },
  };

  const pathData = (points) => {
    let path = `M${points[0]} ${points[1]}`;
    for (let i = 2; i < points.length; i += 6) path += `C${points.slice(i, i + 6).join(" ")}`;
    return path;
  };
  const lerp = (from, to, amount) => from.map((value, index) => value + (to[index] - value) * amount);
  const ease = (value) => value * value * value * (value * (value * 6 - 15) + 10);
  const clamp = (value) => Math.min(1, Math.max(0, value));
  const get = (id) => stage.querySelector(`#${idPrefix}${id}`);
  const wordmark = stage.querySelector("[data-wordmark]");
  const meanings = stage.querySelector("[data-meanings]");
  const meaningItems = [...stage.querySelectorAll("[data-morph-letter]")];
  function updatePaths(ids, points, width) {
    ids.forEach((id) => {
      get(id).setAttribute("d", pathData(points));
      get(id).setAttribute("stroke-width", Math.max(width, 0));
    });
  }

  function draw(from, to, progress, direction = 1) {
    const blue = ease(clamp(progress));
    const green = ease(clamp((progress - 0.035) / 0.965));
    const middle = ease(clamp((progress - 0.07) / 0.93));
    updatePaths(["b", "b2", "b3"], lerp(from.b, to.b, blue), from.w[0] + (to.w[0] - from.w[0]) * blue);
    updatePaths(["g", "g2", "g3"], lerp(from.g, to.g, green), from.w[1] + (to.w[1] - from.w[1]) * green);
    updatePaths(["m", "m2", "m3"], lerp(from.m, to.m, middle), from.w[2] + (to.w[2] - from.w[2]) * middle);
    const pulse = Math.sin(Math.PI * progress);
    get("root").setAttribute("transform", `translate(312 360) rotate(${(direction * 1.2 * pulse * pulse).toFixed(2)}) scale(${(1 + 0.015 * pulse).toFixed(3)}) translate(-312 -360)`);
  }

  function showOriginalBrand() {
    get("s").style.opacity = "1";
    if (wordmark) wordmark.style.opacity = "1";
    if (meanings) meanings.style.opacity = "0";
    meaningItems.forEach((item) => item.classList.remove("is-active"));
  }

  function presentStage(from, to, progress, logoHold) {
    if (!wordmark || !meanings) return
    const wordmarkOpacity = logoHold
      ? 1
      : from === "logo"
        ? 1 - ease(clamp(progress / 0.52))
        : to === "logo"
          ? ease(clamp((progress - 0.55) / 0.45))
          : 0;
    get("s").style.opacity = "1";
    wordmark.style.opacity = String(wordmarkOpacity);

    const labelOpacity = logoHold
      ? 0
      : from === "logo"
        ? ease(clamp((progress - 0.26) / 0.24))
        : to === "logo"
          ? 1 - ease(clamp((progress - 0.62) / 0.38))
          : 1;
    meanings.style.opacity = String(labelOpacity);

    const activeLetter = from === "logo"
      ? (progress > 0.26 ? to : "")
      : to === "logo"
        ? (progress < 0.8 ? from : "")
        : (progress > 0.52 ? to : from);
    meaningItems.forEach((item) => {
      item.classList.toggle("is-active", item.dataset.morphLetter === activeLetter);
    });
  }

  const sequence = ["logo", "T", "S", "E", "logo"];
  const hold = 650;
  const move = 900;
  const step = hold + move;
  const total = step * (sequence.length - 1);
  const lastTransition = sequence.length - 2;
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let elapsed = 0;
  let startedAt = 0;
  let animationFrame = null;
  let animationGeneration = 0;
  let motionRunning = false;
  let pointerActive = false;
  let focusActive = false;
  let inViewport = !("IntersectionObserver" in window);
  let pageVisible = !document.hidden;

  function wrapTime(value) {
    if (!Number.isFinite(value)) return 0;
    return ((value % total) + total) % total;
  }

  function stop() {
    if (!motionRunning && animationFrame === null) return;
    motionRunning = false;
    animationGeneration += 1;
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    animationFrame = null;
    elapsed = wrapTime(elapsed + Math.max(0, performance.now() - startedAt));
  }

  function frame(timestamp, generation) {
    // A canceled animation callback can still be queued in a browser. Ignore
    // callbacks from an earlier visibility/intersection lifecycle.
    if (!motionRunning || generation !== animationGeneration) return;
    animationFrame = null;
    const now = Number.isFinite(timestamp) ? timestamp : performance.now();
    const time = wrapTime(elapsed + now - startedAt);
    const index = Math.min(Math.floor(time / step), lastTransition);
    const localTime = time - index * step;
    const inHold = localTime < hold;
    const progress = inHold ? 0 : clamp((localTime - hold) / move);
    const from = sequence[index] || "logo";
    const to = sequence[index + 1] || "logo";
    // Keep the render loop safe if the sequence is edited later or timing
    // data becomes invalid. The brand mark is the stable visual fallback.
    const fromShape = shapes[from] || shapes.logo;
    const toShape = shapes[to] || shapes.logo;
    draw(fromShape, toShape, progress, index % 2 ? -1 : 1);
    presentStage(from, to, progress, from === "logo" && inHold);
    animationFrame = requestAnimationFrame((nextTimestamp) => frame(nextTimestamp, generation));
  }

  function syncMotion() {
    const isActive = pointerActive || focusActive;
    const shouldAnimate = !motionPreference.matches && pageVisible && inViewport && (!interactive || isActive);
    if (shouldAnimate && !motionRunning) {
      motionRunning = true;
      animationGeneration += 1;
      startedAt = performance.now();
      const generation = animationGeneration;
      animationFrame = requestAnimationFrame((timestamp) => frame(timestamp, generation));
    } else if (!shouldAnimate) {
      stop();
      if (motionPreference.matches || interactive) {
        draw(shapes.logo, shapes.logo, 0);
        showOriginalBrand();
      }
    }
  }

  draw(shapes.logo, shapes.logo, 0);
  syncMotion();

  let observer = null;
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      syncMotion();
    }, { threshold: 0.05 });
    observer.observe(stage);
  }

  const onVisibilityChange = () => {
    pageVisible = !document.hidden;
    syncMotion();
  };
  const onPageShow = () => {
    pageVisible = !document.hidden;
    syncMotion();
  };
  const onPageHide = () => stop();
  const onPointerEnter = () => {
    pointerActive = true;
    if (interactive) elapsed = 0;
    syncMotion();
  };
  const onPointerLeave = () => {
    pointerActive = false;
    syncMotion();
  };
  const onFocusIn = () => {
    focusActive = true;
    if (interactive) elapsed = 0;
    syncMotion();
  };
  const onFocusOut = (event) => {
    if (event.relatedTarget && stage.contains(event.relatedTarget)) return;
    focusActive = false;
    syncMotion();
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pageshow", onPageShow);
  window.addEventListener("pagehide", onPageHide);
  if (interactive) {
    stage.addEventListener("pointerenter", onPointerEnter);
    stage.addEventListener("pointerleave", onPointerLeave);
    stage.addEventListener("focusin", onFocusIn);
    stage.addEventListener("focusout", onFocusOut);
  }

  if (motionPreference.addEventListener) motionPreference.addEventListener("change", syncMotion);
  else motionPreference.addListener(syncMotion);

  return () => {
    stop();
    observer?.disconnect();
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pageshow", onPageShow);
    window.removeEventListener("pagehide", onPageHide);
    if (interactive) {
      stage.removeEventListener("pointerenter", onPointerEnter);
      stage.removeEventListener("pointerleave", onPointerLeave);
      stage.removeEventListener("focusin", onFocusIn);
      stage.removeEventListener("focusout", onFocusOut);
    }
    if (motionPreference.removeEventListener) motionPreference.removeEventListener("change", syncMotion);
    else motionPreference.removeListener(syncMotion);
  };
}

document.querySelectorAll("[data-logo-morph]").forEach((stage) => {
  attachLogoMorph(stage, {
    interactive: stage.hasAttribute("data-logo-morph-hover"),
    idPrefix: stage.dataset.logoMorphPrefix || "",
  });
});

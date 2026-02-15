/**
 * Vanilla JS port of DecryptedText: scramble then sequential reveal.
 * Use data-decrypt-text on an element; optional data-decrypt-options (JSON).
 * Options: speed, sequential, revealDirection ('start'|'end'|'center'),
 * useOriginalCharsOnly, characters, animateOn ('hover'|'view'|'both'), revealedClass, encryptedClass.
 */
(() => {
  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;

  const defaultChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+";

  function getNextIndex(textLength, revealedSet, revealDirection) {
    switch (revealDirection) {
      case "end":
        return textLength - 1 - revealedSet.size;
      case "center": {
        const middle = Math.floor(textLength / 2);
        const offset = Math.floor(revealedSet.size / 2);
        const nextIndex =
          revealedSet.size % 2 === 0 ? middle + offset : middle - offset - 1;
        if (
          nextIndex >= 0 &&
          nextIndex < textLength &&
          !revealedSet.has(nextIndex)
        ) {
          return nextIndex;
        }
        for (let i = 0; i < textLength; i++) {
          if (!revealedSet.has(i)) return i;
        }
        return 0;
      }
      default:
        return revealedSet.size;
    }
  }

  function shuffleText(originalText, revealedSet, options) {
    const useOriginal = options.useOriginalCharsOnly !== false;
    const characters = options.characters || defaultChars;
    const availableChars = useOriginal
      ? Array.from(new Set(originalText.split(""))).filter((c) => c !== " ")
      : characters.split("");

    if (useOriginal) {
      const positions = originalText.split("").map((char, i) => ({
        char,
        isSpace: char === " ",
        index: i,
        isRevealed: revealedSet.has(i),
      }));
      const nonSpaceChars = positions
        .filter((p) => !p.isSpace && !p.isRevealed)
        .map((p) => p.char);
      for (let i = nonSpaceChars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nonSpaceChars[i], nonSpaceChars[j]] = [
          nonSpaceChars[j],
          nonSpaceChars[i],
        ];
      }
      let charIndex = 0;
      return positions
        .map((p) => {
          if (p.isSpace) return " ";
          if (p.isRevealed) return originalText[p.index];
          return nonSpaceChars[charIndex++];
        })
        .join("");
    }

    return originalText
      .split("")
      .map((char, i) => {
        if (char === " ") return " ";
        if (revealedSet.has(i)) return originalText[i];
        return availableChars[
          Math.floor(Math.random() * availableChars.length)
        ];
      })
      .join("");
  }

  function runDecryptedText(el, text, options) {
    if (!text || (prefersReducedMotion && options.animateOn !== "hover")) {
      el.textContent = text;
      return;
    }

    const speed = Math.max(20, Number(options.speed) || 50);
    const sequential = options.sequential !== false;
    const revealDirection = options.revealDirection || "start";
    const revealedClass = options.revealedClass || "decrypted-revealed";
    const encryptedClass = options.encryptedClass || "decrypted-encrypted";
    const animateOn = options.animateOn || "view";

    let revealedIndices = new Set();
    let displayText = text;
    let intervalId = null;
    let hasAnimated = false;
    let isHovering = false;

    const srOnly = document.createElement("span");
    srOnly.setAttribute("aria-hidden", "false");
    srOnly.className = "decrypted-sr-only";
    srOnly.textContent = text;

    const visibleWrap = document.createElement("span");
    visibleWrap.setAttribute("aria-hidden", "true");

    function renderChars() {
      visibleWrap.textContent = "";
      const chars = displayText.split("");
      chars.forEach((char, index) => {
        const span = document.createElement("span");
        const isRevealed = revealedIndices.has(index) || !isScrambling;
        span.className = isRevealed ? revealedClass : encryptedClass;
        span.textContent = char;
        visibleWrap.appendChild(span);
      });
    }

    let isScrambling = false;

    function tick() {
      if (sequential) {
        if (revealedIndices.size < text.length) {
          const nextIndex = getNextIndex(
            text.length,
            revealedIndices,
            revealDirection,
          );
          revealedIndices = new Set(revealedIndices);
          revealedIndices.add(nextIndex);
          displayText = shuffleText(text, revealedIndices, options);
          srOnly.textContent = displayText;
          renderChars();
        } else {
          if (intervalId) clearInterval(intervalId);
          intervalId = null;
          isScrambling = false;
          displayText = text;
          srOnly.textContent = text;
          renderChars();
        }
      } else {
        let iter = (options._iter = (options._iter || 0) + 1);
        const maxIterations = Math.max(1, Number(options.maxIterations) || 10);
        displayText = shuffleText(text, revealedIndices, options);
        srOnly.textContent = displayText;
        renderChars();
        if (iter >= maxIterations) {
          if (intervalId) clearInterval(intervalId);
          intervalId = null;
          isScrambling = false;
          displayText = text;
          srOnly.textContent = text;
          renderChars();
        }
      }
    }

    function startAnimation() {
      if (animateOn === "view" && hasAnimated) return;
      if (animateOn === "view") hasAnimated = true;
      isScrambling = true;
      revealedIndices = new Set();
      if (sequential) {
        intervalId = setInterval(tick, speed);
      } else {
        options._iter = 0;
        intervalId = setInterval(tick, speed);
      }
    }

    function stopAnimation() {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      isScrambling = false;
      revealedIndices = new Set();
      displayText = text;
      srOnly.textContent = text;
      renderChars();
    }

    el.textContent = "";
    el.appendChild(srOnly);
    el.appendChild(visibleWrap);

    if (animateOn === "hover" || animateOn === "both") {
      el.addEventListener("mouseenter", () => {
        isHovering = true;
        startAnimation();
      });
      el.addEventListener("mouseleave", () => {
        isHovering = false;
        stopAnimation();
      });
    }

    if (animateOn === "view" || animateOn === "both") {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimated) startAnimation();
          });
        },
        { root: null, rootMargin: "0px", threshold: 0.1 },
      );
      observer.observe(el);
    }

    if (prefersReducedMotion) {
      srOnly.textContent = text;
      renderChars();
    } else if (animateOn === "view") {
      isScrambling = true;
      displayText = shuffleText(text, new Set(), options);
      srOnly.textContent = displayText;
      renderChars();
    }
  }

  function init() {
    const nodes = document.querySelectorAll("[data-decrypt-text]");
    nodes.forEach((el) => {
      const text = (el.getAttribute("data-decrypt-text") || "").trim();
      let options = {};
      try {
        const raw = el.getAttribute("data-decrypt-options");
        if (raw) options = JSON.parse(raw);
      } catch (_) {}
      runDecryptedText(el, text, options);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

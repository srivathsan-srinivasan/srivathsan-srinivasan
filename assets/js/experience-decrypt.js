(() => {
  const source = document.getElementById("decrypt-source");
  const output = document.getElementById("decrypt-output");
  if (!source || !output) return;

  const modal = document.getElementById("decrypt-modal");
  const bar = document.getElementById("decrypt-bar");
  const messageEl = modal?.querySelector("[data-message]");
  const primaryBtn = modal?.querySelector("[data-primary]");
  const secondaryBtn = modal?.querySelector("[data-secondary]");
  const backdrop = modal?.querySelector("[data-close]");
  const barLink = bar?.querySelector("a");

  const CONTACT_PATH = "contact/";
  const SESSION_KEY = "experience_decrypt_complete";
  const messages = [
    "Signal confirmed. If you're still reading, we should probably talk.",
    "You made it to the end. Most don't. Let's continue this conversation.",
    "Full context received. I work best with people who care enough to read.",
    "You weren’t skimming. That already puts you in the top 5%.",
    "Now you actually know how I think. Want to see how I work?",
    "If you read 100%, you're exactly the kind of person I like working with.",
    "You read the details. That's how good systems get built.",
    "Thanks for taking the time. Let's see if we're a good fit.",
    "People who read this far usually have a problem worth solving.",
    "Access granted. Collaboration available.",
  ];

  const track = (event, props) => {
    if (typeof window.trackEngagement === "function") {
      window.trackEngagement(event, props);
    }
  };

  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;

  const getSourceText = () => {
    if (source.content) return source.content.textContent || "";
    return source.textContent || "";
  };

  const originalText = getSourceText()
    .replace(/^\s*\n/, "")
    .replace(/\s+$/g, "");
  const originalChars = Array.from(originalText);
  const totalChars = originalChars.length;
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*(){}[]<>/\\";

  let seed = 1337;
  const encryptedChars = originalChars.map((char) => {
    if (char === "\n" || char === "\r" || /\s/.test(char)) return char;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return charset[seed % charset.length];
  });

  const outputChars = encryptedChars.slice();
  output.textContent = prefersReducedMotion ? originalText : outputChars.join("");

  let lastVisibleCount = 0;
  let rafId = null;
  let started = false;
  let milestones = {
    half: false,
    ninety: false,
    complete: false,
  };
  let popupTimer = null;

  const getProgress = () => {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || window.pageYOffset || 0;
    const total = Math.max(1, doc.scrollHeight - window.innerHeight);
    return Math.min(1, Math.max(0, scrollTop / total));
  };

  const updateOutput = (visibleCount) => {
    const clamped = Math.max(0, Math.min(totalChars, visibleCount));
    if (clamped === lastVisibleCount) return;

    if (clamped > lastVisibleCount) {
      for (let i = lastVisibleCount; i < clamped; i += 1) {
        outputChars[i] = originalChars[i];
      }
    } else {
      for (let i = clamped; i < lastVisibleCount; i += 1) {
        outputChars[i] = encryptedChars[i];
      }
    }

    lastVisibleCount = clamped;
    output.textContent = outputChars.join("");
  };

  const showBar = () => {
    if (!bar) return;
    bar.classList.add("is-visible");
    bar.setAttribute("aria-hidden", "false");
  };

  const hideModal = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    showBar();
  };

  const pickMessage = () => {
    if (!window.crypto?.getRandomValues) return messages[0];
    const buffer = new Uint32Array(1);
    window.crypto.getRandomValues(buffer);
    return messages[buffer[0] % messages.length];
  };

  const showModal = () => {
    if (!modal || !messageEl) return;
    messageEl.textContent = pickMessage();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    track("popup_shown");
    window.sessionStorage.setItem(SESSION_KEY, "true");
  };

  const handleComplete = () => {
    if (window.sessionStorage.getItem(SESSION_KEY) === "true") {
      showBar();
      return;
    }
    popupTimer = window.setTimeout(showModal, 1000);
  };

  const updateFrame = () => {
    rafId = null;
    const progress = getProgress();
    const visibleCount = Math.floor(progress * totalChars);

    if (!prefersReducedMotion) {
      updateOutput(visibleCount);
    }

    if (progress >= 0.5 && !milestones.half) {
      milestones.half = true;
      track("decrypt_50");
    }

    if (progress >= 0.9 && !milestones.ninety) {
      milestones.ninety = true;
      track("decrypt_90");
    }

    if (progress >= 1 && !milestones.complete) {
      milestones.complete = true;
      track("decrypt_complete");
      handleComplete();
    }
  };

  const schedule = () => {
    if (rafId !== null) return;
    rafId = window.requestAnimationFrame(updateFrame);
  };

  const onScroll = () => {
    if (!started) {
      started = true;
      track("decrypt_started");
    }
    schedule();
  };

  if (prefersReducedMotion) {
    started = true;
    track("decrypt_started");
  }

  updateFrame();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });

  if (primaryBtn) {
    primaryBtn.addEventListener("click", () => {
      track("contact_click");
      window.location.href = CONTACT_PATH;
    });
  }

  if (secondaryBtn) {
    secondaryBtn.addEventListener("click", () => {
      track("contact_click");
      window.location.href = CONTACT_PATH;
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", hideModal);
  }

  if (barLink) {
    barLink.addEventListener("click", () => {
      track("contact_click");
    });
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal?.classList.contains("is-open")) {
      hideModal();
    }
  });
})();

/* global THREE, anime */
(() => {
  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;

  const canvasContainer = document.getElementById("canvas-container");
  const sections = Array.from(document.querySelectorAll(".section"));

  let scene;
  let camera;
  let renderer;
  let particles;
  let coreMesh;
  let rafId = null;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let hasThree = false;

  function setAccent(hex) {
    if (!hex) return;
    document.documentElement.style.setProperty("--accent", hex);
  }

  function safeScrollPercent() {
    const winHeight = window.innerHeight || 1;
    const total = Math.max(1, document.body.offsetHeight - winHeight);
    return Math.max(0, Math.min(1, window.scrollY / total));
  }

  function pickParticleCount() {
    const area = (window.innerWidth || 0) * (window.innerHeight || 0);
    const base = Math.floor(area / 900);
    return Math.max(700, Math.min(2000, base));
  }

  function initThree() {
    if (!canvasContainer) return;
    if (!window.THREE) return;
    hasThree = true;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    canvasContainer.appendChild(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(1.8, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0x3eff8b,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    coreMesh = new THREE.Mesh(geometry, material);
    scene.add(coreMesh);

    const particlesGeom = new THREE.BufferGeometry();
    const count = pickParticleCount();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 15;
    particlesGeom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.015,
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
    });
    particles = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particles);

    window.addEventListener("resize", onWindowResize, { passive: true });
    window.addEventListener(
      "pointermove",
      (e) => {
        lastPointerX = (e.clientX / window.innerWidth) - 0.5;
        lastPointerY = (e.clientY / window.innerHeight) - 0.5;
      },
      { passive: true },
    );

    if (!prefersReducedMotion) animate();
    else renderOnce();

    // Sync core color with current accent (observer may have run before THREE loaded).
    const currentAccent =
      getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() ||
      "#3eff8b";
    applyAccentToCore(currentAccent);
  }

  function onWindowResize() {
    if (!hasThree) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderOnce();
  }

  function renderOnce() {
    if (!hasThree) return;
    renderer.render(scene, camera);
  }

  function animate() {
    rafId = window.requestAnimationFrame(animate);
    if (!hasThree) return;

    coreMesh.rotation.y += 0.003;
    coreMesh.rotation.x += 0.001;
    particles.rotation.y += 0.0005 + lastPointerX * 0.01;
    particles.rotation.x += lastPointerY * 0.01;
    renderer.render(scene, camera);
  }

  function updateThreeForScroll() {
    if (!hasThree) return;
    const scrollPercent = safeScrollPercent();
    coreMesh.scale.setScalar(1 + scrollPercent * 0.5);
    if (prefersReducedMotion) renderOnce();
  }

  function getSectionAccent(section) {
    const hex = section?.getAttribute?.("data-accent");
    return typeof hex === "string" && hex.trim().startsWith("#") ? hex.trim() : null;
  }

  function applyAccentToCore(hex) {
    if (!hex) return;
    setAccent(hex);
    if (!hasThree) return;
    try {
      const target = new THREE.Color(hex);
      coreMesh.material.color.lerp(target, 0.18);
      if (prefersReducedMotion) renderOnce();
    } catch {
      // ignore invalid color strings
    }
  }

  function initReveal() {
    if (!sections.length) return;

    // Initial accent from the first visible/hero section.
    const initialAccent = getSectionAccent(sections[0]) || "#3eff8b";
    setAccent(initialAccent);

    if (!("IntersectionObserver" in window)) {
      for (const section of sections) section.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const section = entry.target;
          section.classList.add("is-visible");
          applyAccentToCore(getSectionAccent(section));
        }
      },
      { threshold: 0.35 },
    );

    for (const section of sections) observer.observe(section);
  }

  function initHeroIntro() {
    const hero = document.querySelector(".hero-section");
    if (!hero) return;
    if (!window.anime || prefersReducedMotion) return;

    anime({
      targets: ".hero-section *",
      opacity: [0, 1],
      translateY: [16, 0],
      delay: anime.stagger(120),
      duration: 1400,
      easing: "easeOutExpo",
    });
  }

  function initScrollHandlers() {
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          updateThreeForScroll();
          ticking = false;
        });
      },
      { passive: true },
    );
  }

  function init() {
    initReveal();
    initHeroIntro();
    initScrollHandlers();
    initThree();
    updateThreeForScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.addEventListener("beforeunload", () => {
    if (rafId) window.cancelAnimationFrame(rafId);
  });
})();

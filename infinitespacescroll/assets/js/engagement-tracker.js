(() => {
  const trackEngagement = (event, props) => {
    if (typeof window === "undefined") return;

    const plausible = window.plausible;
    if (typeof plausible === "function") {
      plausible(event, props ? { props } : undefined);
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`[engagement] ${event}`, props || {});
  };

  window.trackEngagement = trackEngagement;
})();


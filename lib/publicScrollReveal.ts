/** Arm scroll reveals (Executra `.exec-reveal`, legacy `.biz-fade` / `.wsi-reveal`) after first paint. */
export function armPublicScrollReveal(root: HTMLElement | null) {
  if (typeof window === "undefined" || !root) return () => undefined;

  const html = document.documentElement;
  let execObserver: IntersectionObserver | null = null;

  const revealLegacy = () => {
    const viewport = window.innerHeight * 0.94;
    root.querySelectorAll<HTMLElement>(".biz-team-grid .biz-fade").forEach((node, index) => {
      node.style.setProperty("--biz-stagger", String(index));
    });
    root.querySelectorAll<HTMLElement>(".biz-fade, .wsi-reveal").forEach((node) => {
      const top = node.getBoundingClientRect().top;
      if (top < viewport) {
        node.classList.add("is-visible");
      }
    });
  };

  const revealExecInView = () => {
    const viewport = window.innerHeight * 1.05;
    root.querySelectorAll<HTMLElement>(".exec-reveal").forEach((node) => {
      if (node.classList.contains("is-in")) return;
      if (node.getBoundingClientRect().top < viewport) {
        node.classList.add("is-in");
      }
    });
  };

  const armExecObserver = () => {
    if (!("IntersectionObserver" in window)) {
      root.querySelectorAll<HTMLElement>(".exec-reveal").forEach((node) => {
        node.classList.add("is-in");
      });
      return;
    }

    execObserver?.disconnect();
    execObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            execObserver?.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );

    root.querySelectorAll<HTMLElement>(".exec-reveal").forEach((node) => {
      if (!node.classList.contains("is-in")) {
        execObserver?.observe(node);
      }
    });
  };

  const primeInView = () => {
    revealLegacy();
    revealExecInView();
  };

  /** Mark above-the-fold blocks before arming hide rules — avoids refresh flash. */
  const arm = () => {
    primeInView();
    window.requestAnimationFrame(() => {
      primeInView();
      html.classList.add("biz-anim-armed");
      html.classList.add("exec-anim-armed");
      html.classList.remove("public-booting");
      armExecObserver();
    });
  };

  primeInView();
  const frame = window.requestAnimationFrame(arm);
  const t1 = window.setTimeout(primeInView, 50);
  const t2 = window.setTimeout(arm, 120);
  const t3 = window.setTimeout(armExecObserver, 280);

  const onLoad = () => {
    primeInView();
    armExecObserver();
  };
  if (document.readyState === "complete") {
    onLoad();
  } else {
    window.addEventListener("load", onLoad, { once: true });
  }

  const onScroll = () => revealExecInView();
  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    window.cancelAnimationFrame(frame);
    window.clearTimeout(t1);
    window.clearTimeout(t2);
    window.clearTimeout(t3);
    window.removeEventListener("load", onLoad);
    window.removeEventListener("scroll", onScroll);
    execObserver?.disconnect();
  };
}

/** Run Executra page behaviors inside the Grapes canvas iframe (match public site). */

export function bootExecutraCanvas(root: ParentNode | Document = document, win: Window = window) {
  const scope = root instanceof Document ? root : root;
  const homeRoot =
    scope.querySelector?.("#wsi-home-cms") ||
    scope.querySelector?.(".exec-tpl") ||
    scope;

  initApproachTabs(homeRoot);
  initServiceTabs(homeRoot);
  initCarousel(homeRoot);
  initReveal(homeRoot, win);
}

function qsa<T extends Element>(sel: string, root: ParentNode) {
  return Array.from(root.querySelectorAll<T>(sel));
}

function initApproachTabs(root: ParentNode) {
  const tabs = qsa<HTMLElement>("[data-exec-approach-tab]", root);
  if (!tabs.length) return;
  tabs.forEach((tab) => {
    tab.onclick = () => {
      tabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
    };
  });
  tabs[0]?.classList.add("is-active");
}

function initServiceTabs(root: ParentNode) {
  const pills = qsa<HTMLElement>("[data-exec-service-tab]", root);
  const panels = qsa<HTMLElement>("[data-exec-service-panel]", root);
  if (!pills.length || !panels.length) return;

  const show = (id: string | null) => {
    if (!id) return;
    pills.forEach((p) => {
      p.classList.toggle("is-active", p.getAttribute("data-exec-service-tab") === id);
    });
    panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.getAttribute("data-exec-service-panel") === id);
    });
  };

  pills.forEach((pill) => {
    pill.onclick = () => show(pill.getAttribute("data-exec-service-tab"));
  });
  show(pills[0]?.getAttribute("data-exec-service-tab") ?? null);
}

function initCarousel(root: ParentNode) {
  const track = root.querySelector<HTMLElement>("[data-exec-carousel-track]");
  const slides = qsa<HTMLElement>("[data-exec-carousel-slide]", root);
  const prev = root.querySelector<HTMLElement>("[data-exec-carousel-prev]");
  const next = root.querySelector<HTMLElement>("[data-exec-carousel-next]");
  if (!track || slides.length < 2) return;

  let index = 0;
  const go = (i: number) => {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(${-index * 100}%)`;
  };

  if (prev) prev.onclick = () => go(index - 1);
  if (next) next.onclick = () => go(index + 1);
  go(0);
}

function initReveal(root: ParentNode, win: Window) {
  const doc = root instanceof Document ? root : root.ownerDocument;
  const html = doc?.documentElement;
  html?.classList.remove("exec-anim-armed");

  const nodes = qsa<HTMLElement>(".exec-reveal", root);
  nodes.forEach((n) => n.classList.add("is-in"));

  if (!("IntersectionObserver" in win)) return;

  html?.classList.add("exec-anim-armed");
  const io = new win.IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        obs.unobserve(e.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );
  nodes.forEach((n) => {
    if (!n.classList.contains("is-in")) io.observe(n);
  });
}

export function runExecutraCanvasInFrame(frameWindow: Window | null | undefined) {
  if (!frameWindow) return;
  try {
    bootExecutraCanvas(frameWindow.document, frameWindow);
  } catch {
    // ignore canvas boot errors
  }
}

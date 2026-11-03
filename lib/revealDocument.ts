/** Next.js injects `body{display:none}` until hydration; if hydration stalls, the page stays blank. */
export function revealAppDocument() {
  if (typeof document === "undefined") return;

  document.querySelectorAll("style").forEach((node) => {
    const text = (node.textContent || "").replace(/\s/g, "");
    if (text === "body{display:none}" || text.includes("body{display:none}")) {
      node.remove();
    }
  });

  document.body.style.removeProperty("display");
  document.body.classList.add("page-loaded");
}

/** Shown when the footer API is unavailable or cache is empty (still uses Executra footer CSS). */
export const DEFAULT_PUBLIC_FOOTER_HTML = `
<footer id="wsi-site-footer" class="exec-footer">
  <div class="exec-footer-inner">
    <div class="exec-footer-top">
      <div class="exec-footer-brand">
        <a href="/" class="exec-footer-logo">WebFocus <mark>CMS</mark></a>
        <p class="exec-footer-tagline">Hosting, web design, and a visual CMS your team can edit—built for Philippine businesses since 2001.</p>
      </div>
      <div class="exec-footer-col">
        <h5>Explore</h5>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/about-us">About</a></li>
          <li><a href="/services">Services</a></li>
          <li><a href="/articles">News</a></li>
        </ul>
      </div>
      <div class="exec-footer-col">
        <h5>Company</h5>
        <ul>
          <li><a href="/contact-us">Contact</a></li>
          <li><a href="/login">CMS Sign In</a></li>
        </ul>
      </div>
      <div class="exec-footer-col">
        <h5>Connect</h5>
        <div class="exec-footer-social">
          <a href="/contact-us" aria-label="Contact">✉</a>
        </div>
      </div>
    </div>
    <div class="exec-footer-bar">
      <span>© ${new Date().getFullYear()} WebFocus Solutions, Inc.</span>
      <div class="exec-footer-bar-actions">
        <a class="exec-btn exec-btn--line" href="/contact-us">Contact</a>
        <a class="exec-btn exec-btn--primary" href="/contact-us">Book a call</a>
      </div>
    </div>
  </div>
</footer>
`.trim();

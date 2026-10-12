/*
 * Portfolio content. Edit this file to add or change projects.
 *
 * category : "plugin" | "website" | "case-study"
 * image    : path to a screenshot, e.g. "assets/smartupweb.jpg" (optional)
 * mock     : built-in illustration when there is no image:
 *            "banner" | "inquiry" | "consent" | "booking" | "website"
 * frame    : true = show the whole image as a framed screenshot on the grey
 *            canvas instead of filling (and cropping) the card
 * link     : URL for "View project" (optional)
 * wide     : true = card spans the full width
 * draft    : true = shown when you preview locally, hidden on github.io
 */
window.PROJECTS = [
  {
    title: "smartupweb.com",
    category: "website",
    year: "2026",
    role: "Design & WordPress build",
    summary:
      "The Smartup website, in English and Greek. Built on Elementor with WPML, self-hosted fonts and Cloudflare in front, plus a looping 3D hero made in Blender.",
    tags: ["Figma", "WordPress", "Elementor", "WPML", "Blender"],
    mock: "website",
    image: "",
    link: "https://smartupweb.com",
    wide: true,
  },
  {
    title: "TokenFlow",
    category: "plugin",
    year: "2026",
    role: "Figma plugin · Design & development",
    summary:
      "A Figma plugin that organizes design tokens and smooths design-to-development handoff: scan colors and type, generate color scales, assign semantic roles, create Light/Dark variables and export tokens for developers.",
    tags: ["Figma plugin", "Design tokens", "Variables"],
    image: "assets/tokenflow-cover.jpg",
    frame: true,
    link: "https://www.figma.com/community/plugin/1645934997243256853/tokenflow",
  },
  {
    title: "SmartBanner",
    category: "plugin",
    year: "2026",
    role: "Design & development",
    summary:
      "A floating announcement banner for WordPress. Editors write the message once per language and visitors see the one that matches the page.",
    tags: ["WordPress plugin", "PHP", "WPML"],
    mock: "banner",
  },
  {
    title: "SmartInquiry",
    category: "plugin",
    year: "2026",
    role: "Design & development",
    summary:
      "A project-inquiry form in a modal. When someone sends it, the server turns their answers into a PDF brief the team can work from.",
    tags: ["WordPress plugin", "PHP", "PDF"],
    mock: "inquiry",
  },
  {
    title: "SmartConsent",
    category: "plugin",
    year: "2026",
    role: "Design & development",
    summary:
      "A cookie consent banner with per-category choices. Policy pages stay linked to the right translation in every language.",
    tags: ["WordPress plugin", "GDPR", "WPML"],
    mock: "consent",
  },
  {
    title: "Simple Booking",
    category: "plugin",
    year: "2026",
    role: "Design & development · in progress",
    summary:
      "Appointment booking for small businesses: pick a day, pick a time, get a confirmation.",
    tags: ["WordPress plugin", "PHP", "JavaScript"],
    mock: "booking",
  },

  /* ---- Fill these in, then delete `draft: true` to publish them ---- */
  {
    title: "Client website — name",
    category: "website",
    year: "2026",
    role: "Design & WordPress build",
    summary: "One or two sentences: who the client is and what changed for them after launch.",
    tags: ["Figma", "WordPress"],
    image: "",
    link: "",
    draft: true,
  },
  {
    title: "Client website — name",
    category: "website",
    year: "2026",
    role: "Design & WordPress build",
    summary: "One or two sentences: who the client is and what changed for them after launch.",
    tags: ["Figma", "Elementor"],
    image: "",
    link: "",
    draft: true,
  },
  {
    title: "Case study — product name",
    category: "case-study",
    year: "2026",
    role: "UX & UI design",
    summary: "The problem, what you tried in Figma, and what you shipped. Link to the prototype or a write-up.",
    tags: ["Figma", "Prototype", "UX research"],
    image: "",
    link: "",
    draft: true,
  },
  {
    title: "Case study — product name",
    category: "case-study",
    year: "2026",
    role: "UX & UI design",
    summary: "The problem, what you tried in Figma, and what you shipped. Link to the prototype or a write-up.",
    tags: ["Figma", "Design system"],
    image: "",
    link: "",
    draft: true,
  },
];

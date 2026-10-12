# gglias.github.io

My portfolio — live at **https://gglias.github.io**

Plain HTML, CSS and JavaScript. No build step.

## Editing

- **Projects** → `projects.js`. Each project is one object.
  Entries with `draft: true` show up when you preview locally and are hidden on github.io.
- **Screenshots** → put them in `assets/` and set `image: "assets/name.jpg"` on the project
  (1600 × 1200 for normal cards, 1600 × 700 for `wide: true`).
- **Text** (hero, about, contact) → `index.html`.
- **Colours & fonts** → the tokens at the top of `styles.css`.

Push to `main` and GitHub Pages updates the site in about a minute.

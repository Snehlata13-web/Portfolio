# Portfolio — Snehlata Sharma

A portfolio site with a WebGL particle system that changes shape as you scroll. Built with **Three.js** (custom GLSL shaders + bloom), **GSAP ScrollTrigger** and **Lenis** smooth scrolling. There is no build step: it is plain HTML/CSS/JS loaded from CDNs.

## Run locally

ES modules need to be served over HTTP, so opening the file directly won't work:

```bash
python3 -m http.server 5173
# open http://localhost:5173
```

(or `npx serve .` if you have Node)

## Make it yours

**Your photo:** save it as `assets/me.png`. It is drawn as a 3D particle portrait in the hero, and the particles swirl away from the cursor.
For the best result, use a **cut-out PNG with a transparent background** (for example from remove.bg), as a portrait shot of your head and shoulders.
A photo on a plain background also works. If there's no photo, the hero shows a particle sphere instead.

**All text lives in `js/data.js`**: name, roles, tagline, stats, skills, experience, projects, email and social links. Edit that file and the whole site updates.

- Résumé: put `resume.pdf` in the root folder and set `resume: '/resume.pdf'`.
- Project colors: each project has a `color` that drives the glowing orb and the code highlight.
- 3D choreography: see the `configs` object in `js/main.js` (`initAnimations`). Each section picks a particle shape (`morph`: 0 sphere, 1 torus knot, 2 DNA helix, 3 galaxy, 4 wave field), plus position, scale and opacity.
- Theme colors: the CSS variables at the top of `css/style.css` and the `violet/cyan/pink` colors in the vertex shader in `js/scene.js`.

## Deploy (Vercel)

```bash
npx vercel        # or drag the folder into vercel.com/new
```

No framework preset is needed, because it is a static site. Netlify and GitHub Pages work too.

## Features

- A preloader with a counter, then the particles burst outward on intro
- 24k GPU particles that change shape for each section (staggered per particle), with simplex-noise flow, mouse repulsion and bloom
- Custom cursor with labels, magnetic buttons, 3D-tilt cards and spotlight bento cards
- Split-text reveals, a typing terminal, animated counters, and a marquee that speeds up with scroll velocity
- Pinned horizontal project gallery on desktop; stacked layout on mobile
- Timeline with a progress line that fills as you scroll, a live local clock, copy-email button and toast
- Responsive, uses fewer particles on mobile, and respects `prefers-reduced-motion`

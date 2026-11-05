import { profile as P } from './data.js';
import { createScene } from './scene.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const isDesktop = () => window.matchMedia('(min-width: 901px)').matches;

/* ────────────────────────── 1. Fill content ────────────────────────── */
function fill() {
  const full = `${P.firstName} ${P.lastName}`;
  document.title = `${full} — ${P.role}`;
  $$('[data-fullname]').forEach((el) => (el.textContent = full));
  $$('[data-firstname]').forEach((el) => (el.textContent = P.firstName.toLowerCase()));
  $('[data-name]').textContent = full;
  $('[data-bigname]').textContent = P.firstName;
  $('[data-lastname]').textContent = P.lastName + '.';
  P.polaroids.forEach((ph, i) => {
    const img = $(`[data-polaroid="${i}"]`);
    if (img) { img.src = ph.src; $(`[data-polaroidcap="${i}"]`).textContent = ph.caption; }
  });
  Object.entries(P.stickers).forEach(([k, v]) => ($(`[data-sticker="${k}"]`).textContent = v));
  $('[data-ringtext]').textContent = `${P.role} ✦ ${P.location} ✦ open to work ✦ `.repeat(2);
  $('#heroSocials').innerHTML = P.socials.map((s) => `<a href="${s.url}" target="_blank" rel="noopener" data-cursor="Visit">${s.label}</a>`).join('');
  $('[data-availability]').textContent = P.availabilityText;
  $('[data-tagline]').textContent = P.tagline;
  $('[data-about]').textContent = P.about;
  $('[data-email]').textContent = P.email;
  $('[data-resume]').href = P.resume;
  $('#year').textContent = new Date().getFullYear();

  // marquee
  const words = [...new Set(P.skills.flatMap((s) => s.items.map((i) => i[0])))].slice(0, 14);
  const row = words.map((w) => `<span class="marquee__item">${w}</span>`).join('');
  $('#marquee').innerHTML = row + row;

  // stats
  $('#stats').innerHTML = P.stats
    .map((s) => `<div class="stat reveal"><div class="stat__num"><span data-count="${s.value}" data-dec="${s.decimals || 0}">0</span><sup>${s.suffix}</sup></div><div class="stat__label">${s.label}</div></div>`)
    .join('');

  // skills legend
  $('#legend').innerHTML = P.skills
    .map((c, i) => `<button data-cat="${i}" style="--c:var(--${c.color === 'pink' ? 'hot' : c.color === 'white' ? 'fg' : c.color})" data-cursor="Filter"><i></i>${c.title} <span class="muted">${c.items.length}</span></button>`)
    .join('');

  // timeline
  $('#timeline').insertAdjacentHTML('beforeend', P.experience
    .map((j) => `
      <article class="job">
        <div class="job__period mono">${j.period}</div>
        <div>
          <h3 class="job__company">${j.company}</h3>
          <div class="job__role">${j.role}</div>
          <ul>${j.points.map((p) => `<li>${p}</li>`).join('')}</ul>
          <div class="chips">${j.stack.map((t) => `<span class="chip">${t}</span>`).join('')}</div>
        </div>
      </article>`)
    .join(''));

  // projects
  $('#workTotal').textContent = String(P.projects.length).padStart(2, '0');
  $('#workTrack').innerHTML = P.projects
    .map((p, i) => {
      const [fn, ...rest] = p.code.split('(');
      return `
      <article class="project" style="--c:${p.color}" data-cursor="Open">
        <div class="project__art">
          <span class="project__num">${String(i + 1).padStart(2, '0')}</span>
          <span class="project__year">${p.year}</span>
          <div class="project__orb"></div>
          <code class="project__code"><b>${fn}</b>(${rest.join('(')}</code>
        </div>
        <div class="project__body">
          <span class="project__kind mono">${p.kind}</span>
          <h3 class="project__title">${p.title}</h3>
          <p class="project__desc">${p.description}</p>
          <div class="project__foot">
            <div class="chips">${p.stack.map((t) => `<span class="chip">${t}</span>`).join('')}</div>
            <div class="project__links">
              <a class="icon-btn" href="${p.github}" target="_blank" rel="noopener" aria-label="Source code" data-cursor="Code">&lt;/&gt;</a>
              <a class="icon-btn" href="${p.live}" target="_blank" rel="noopener" aria-label="Live demo" data-cursor="Live">↗</a>
            </div>
          </div>
        </div>
      </article>`;
    })
    .join('');

  // socials
  $('#socials').innerHTML = P.socials
    .map((s) => `<a class="btn magnetic" href="${s.url}" target="_blank" rel="noopener" data-cursor="Visit"><span>${s.label}</span><i>↗</i></a>`)
    .join('');
}

/* ────────────────────────── 2. Text splitting ────────────────────────── */
function splitChars(el) {
  el.innerHTML = [...el.textContent].map((c) => `<span class="ch">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
}

function splitWords(root) {
  const walk = (node, gradient) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(document.createTextNode(' '));
          const w = document.createElement('span');
          w.className = 'w';
          const inner = document.createElement('span');
          if (gradient) inner.className = 'grad';
          inner.textContent = part;
          w.append(inner);
          frag.append(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') {
        const g = gradient || child.classList.contains('grad');
        child.classList.remove('grad');
        walk(child, g);
      }
    });
  };
  walk(root, false);
}

/* ────────────────────────── 3. Smooth scroll ────────────────────────── */
let lenis;
function initScroll() {
  lenis = new window.Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();

  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2 && id !== '#') return;
      e.preventDefault();
      closeMenu();
      lenis.scrollTo(id === '#' || id === '#top' ? 0 : id, { offset: 0, duration: 1.6 });
    })
  );
}

/* ────────────────────────── 4. Cursor & magnetic ────────────────────────── */
function initCursor() {
  if (isTouch) return;
  const cursor = $('.cursor');
  const dot = $('.cursor__dot');
  const ring = $('.cursor__ring');
  const label = $('.cursor__label');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { ...pos };
  window.addEventListener('pointermove', (e) => {
    pos.x = e.clientX; pos.y = e.clientY;
    dot.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
  });
  gsap.ticker.add(() => {
    ringPos.x += (pos.x - ringPos.x) * 0.16;
    ringPos.y += (pos.y - ringPos.y) * 0.16;
    ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px)`;
  });
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor]');
    if (t) { label.textContent = t.dataset.cursor; cursor.classList.add('is-hover'); }
  });
  document.addEventListener('pointerout', (e) => {
    const t = e.target.closest('[data-cursor]');
    if (t && !t.contains(e.relatedTarget)) cursor.classList.remove('is-hover');
  });
}

function initMagnetic() {
  if (isTouch) return;
  $$('.magnetic').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.35);
      yTo((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

function initTilt() {
  if (isTouch) return;
  $$('.tilt, .project').forEach((el) => {
    el.style.transformPerspective = '1000px';
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.8, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.8, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      rx(-py * 10); ry(px * 12);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });

}

function initHeroVisual(scene) {
  const orb = $('#heroOrb');
  const coords = $('#hudCoords');

  // stickers float and can be dragged around
  $$('.sticker').forEach((st, i) => gsap.to(st, { y: '+=10', duration: 2.4 + i * 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
  if (window.Draggable) {
    window.Draggable.create('[data-drag]', {
      type: 'x,y', zIndexBoost: true,
      onPress(e) { e.stopPropagation?.(); gsap.to(this.target, { scale: 1.08, duration: 0.2 }); },
      onRelease() { gsap.to(this.target, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.4)' }); },
      onDrag() { gsap.set(this.target, { rotation: gsap.utils.clamp(-25, 25, this.deltaX * 2) }); },
      onDragEnd() { gsap.to(this.target, { rotation: gsap.utils.random(-8, 8), duration: 0.8, ease: 'elastic.out(1,0.3)' }); },
    });
  }

  // first name lights up letter by letter under the cursor
  if (!isTouch) {
    window.addEventListener('pointermove', (e) => {
      if (window.scrollY > innerHeight) return;
      $$('[data-bigname] .ch').forEach((c) => {
        const r = c.getBoundingClientRect();
        c.classList.toggle('is-lit', e.clientX > r.left - 10 && e.clientX < r.right + 10 && e.clientY > r.top - 30 && e.clientY < r.bottom + 30);
      });
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      coords.textContent = `x ${nx.toFixed(2)} · y ${(-ny).toFixed(2)}`;
    });
    // the two name lines drift in opposite directions with the mouse
    const l1 = gsap.quickTo('.hero__line--1 .hero__word', 'x', { duration: 1.4, ease: 'power3.out' });
    const l2 = gsap.quickTo('.hero__line--2 .hero__word', 'x', { duration: 1.4, ease: 'power3.out' });
    window.addEventListener('pointermove', (e) => { const nx = e.clientX / innerWidth - 0.5; l1(nx * -40); l2(nx * 40); });
  }

  // click the orb → shockwave explosion, then it re-forms
  orb.addEventListener('click', (e) => {
    if (e.target.closest('.sticker')) return;
    const u = scene.uniforms.uExplode;
    gsap.killTweensOf(u);
    gsap.timeline()
      .to(u, { value: 1, duration: 0.45, ease: 'expo.out' })
      .to(u, { value: 0, duration: 2.2, ease: 'elastic.out(1, 0.35)' });
    gsap.fromTo('.hero__ring', { scale: 0.92 }, { scale: 1, duration: 1.4, ease: 'elastic.out(1,0.3)' });
    gsap.fromTo('.hero__title', { x: -6 }, { x: 0, duration: 0.6, ease: 'elastic.out(1,0.2)' });
  });
}

/* ────────────────────────── Skills: physics playground ────────────────────────── */
function initPlayground() {
  const M = window.Matter;
  const box = $('#playground');
  if (!M || !box) return;
  const { Engine, Runner, Bodies, Composite, Body, Mouse, MouseConstraint, Events } = M;
  const engine = Engine.create({ gravity: { y: 1 } });
  const W = () => box.clientWidth, H = () => box.clientHeight;
  let walls = [];
  const buildWalls = () => {
    Composite.remove(engine.world, walls);
    const t = 200;
    walls = [
      Bodies.rectangle(W() / 2, H() + t / 2, W() * 3, t, { isStatic: true }),
      Bodies.rectangle(-t / 2, H() / 2, t, H() * 4, { isStatic: true }),
      Bodies.rectangle(W() + t / 2, H() / 2, t, H() * 4, { isStatic: true }),
      Bodies.rectangle(W() / 2, -H() * 1.5 - t / 2, W() * 3, t, { isStatic: true }),
    ];
    Composite.add(engine.world, walls);
  };
  buildWalls();

  const items = [];
  P.skills.forEach((cat, ci) => cat.items.forEach(([label, big]) => items.push({ label, big, ci, color: cat.color })));
  items.push({ label: '+ always learning', ring: true, ci: -1 });
  const pills = items.map((it) => {
    const el = document.createElement('div');
    el.className = `pill-body pill-body--${it.ring ? 'ring' : it.color}${it.big ? ' pill-body--big' : ''}`;
    el.textContent = it.label;
    el.dataset.cat = it.ci;
    box.append(el);
    return { el, it, body: null };
  });

  let dropped = false;
  const drop = () => {
    if (dropped) return;
    dropped = true;
    pills.forEach((p, i) => {
      const w = p.el.offsetWidth, h = p.el.offsetHeight;
      const x = gsap.utils.random(w / 2 + 10, W() - w / 2 - 10);
      p.body = Bodies.rectangle(x, -100 - i * 55, w, h, { chamfer: { radius: h / 2 }, restitution: 0.55, friction: 0.08, frictionAir: 0.012, density: 0.002 });
      Body.setAngle(p.body, gsap.utils.random(-0.5, 0.5));
      p.w = w; p.h = h;
      Composite.add(engine.world, p.body);
    });
  };

  // mouse drag (desktop); skip on touch so the page can still scroll
  if (!isTouch) {
    const mouse = Mouse.create(box);
    mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
    mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
    mouse.element.removeEventListener('wheel', mouse.mousewheel);
    const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
    Composite.add(engine.world, mc);
    // repel pills near the cursor even without dragging
    Events.on(engine, 'beforeUpdate', () => {
      if (mc.body) return;
      const m = mouse.position;
      pills.forEach((p) => {
        if (!p.body) return;
        const dx = p.body.position.x - m.x, dy = p.body.position.y - m.y;
        const d = Math.hypot(dx, dy);
        if (d < 90 && d > 0) Body.applyForce(p.body, p.body.position, { x: (dx / d) * 0.012 * p.body.mass, y: (dy / d) * 0.012 * p.body.mass });
      });
    });
  } else {
    box.addEventListener('click', (e) => {
      const r = box.getBoundingClientRect();
      pills.forEach((p) => {
        if (!p.body) return;
        const dx = p.body.position.x - (e.clientX - r.left), dy = p.body.position.y - (e.clientY - r.top);
        const d = Math.hypot(dx, dy) || 1;
        if (d < 200) Body.setVelocity(p.body, { x: (dx / d) * 14, y: -12 });
      });
    });
  }

  const runner = Runner.create();
  let running = false;
  const render = () => {
    pills.forEach((p) => {
      if (!p.body) return;
      const { x, y } = p.body.position;
      p.el.style.transform = `translate(${x - p.w / 2}px, ${y - p.h / 2}px) rotate(${p.body.angle}rad)`;
    });
  };
  Events.on(engine, 'afterUpdate', render);
  ScrollTrigger.create({
    trigger: box, start: 'top 75%', end: 'bottom top',
    onToggle: (st) => {
      if (st.isActive) { drop(); if (!running) { Runner.run(runner, engine); running = true; } }
      else if (running) { Runner.stop(runner); running = false; }
    },
  });

  // controls
  $('#shakeBtn').addEventListener('click', () => {
    pills.forEach((p) => p.body && Body.setVelocity(p.body, { x: gsap.utils.random(-18, 18), y: gsap.utils.random(-28, -14) }));
    gsap.fromTo(box, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1,0.2)' });
  });
  const gBtn = $('#gravityBtn');
  gBtn.addEventListener('click', () => {
    const zero = engine.gravity.y !== 0;
    engine.gravity.y = zero ? 0 : 1;
    gBtn.classList.toggle('is-on', zero);
    gBtn.textContent = zero ? '🌍 Gravity' : '🪐 Zero-G';
    if (zero) pills.forEach((p) => p.body && Body.setVelocity(p.body, { x: gsap.utils.random(-4, 4), y: gsap.utils.random(-8, -3) }));
  });
  let active = null;
  $$('#legend button').forEach((b) => b.addEventListener('click', () => {
    active = active === b.dataset.cat ? null : b.dataset.cat;
    $$('#legend button').forEach((x) => x.classList.toggle('is-on', x.dataset.cat === active));
    pills.forEach((p) => {
      const on = active === null || String(p.it.ci) === active;
      p.el.classList.toggle('is-dim', !on);
      if (on && active !== null && p.body) Body.setVelocity(p.body, { x: gsap.utils.random(-3, 3), y: -16 });
    });
  }));

  window.addEventListener('resize', () => { buildWalls(); });
}

/* ────────────────────────── 5. Small widgets ────────────────────────── */
function initTyped() {
  const el = $('#typed');
  let i = 0, j = 0, deleting = false;
  const loop = () => {
    const word = P.roles[i];
    j += deleting ? -1 : 1;
    el.textContent = word.slice(0, j);
    let delay = deleting ? 35 : 70;
    if (!deleting && j === word.length) { deleting = true; delay = 1800; }
    else if (deleting && j === 0) { deleting = false; i = (i + 1) % P.roles.length; delay = 300; }
    setTimeout(loop, delay);
  };
  loop();
}

function initClock() {
  const el = $('#clock');
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: P.timezone });
  const update = () => (el.textContent = `Noida · ${fmt.format(new Date())}`);
  update();
  setInterval(update, 1000);
}

function initTerminal() {
  const el = $('#terminal');
  const lines = [
    `<span class="t-p">➜</span> <span class="t-n">~</span> <span data-type>whoami</span>`,
    `${P.firstName.toLowerCase()}_${P.lastName.toLowerCase()} <span class="t-c">— ${P.role.toLowerCase()}</span>`,
    ``,
    `<span class="t-p">➜</span> <span class="t-n">~</span> <span data-type>cat profile.json</span>`,
    `{`,
    `  <span class="t-k">"role"</span>: <span class="t-s">"SDE"</span>,`,
    `  <span class="t-k">"location"</span>: <span class="t-s">"${P.location}"</span>,`,
    `  <span class="t-k">"focus"</span>: [<span class="t-s">"scalable systems"</span>, <span class="t-s">"clean APIs"</span>, <span class="t-s">"great UX"</span>],`,
    `  <span class="t-k">"coffee"</span>: <span class="t-n">Infinity</span>,`,
    `  <span class="t-k">"available"</span>: <span class="t-x">${P.available}</span>`,
    `}`,
    ``,
    `<span class="t-p">➜</span> <span class="t-n">~</span> <span data-type>git log --oneline -3</span>`,
    `<span class="t-s">a1f9c2e</span> perf: p99 latency ↓ 40%`,
    `<span class="t-s">7d3b8aa</span> feat: event-driven pipeline`,
    `<span class="t-s">3c2e119</span> ship: portfolio v2 ✦`,
    ``,
    `<span class="t-p">➜</span> <span class="t-n">~</span> <span class="caret"></span>`,
  ];
  el.innerHTML = lines.map((l) => `<span class="t-line" style="display:block;min-height:1.75em">${l}</span>`).join('');
  const rows = $$('.t-line', el);
  const typed = $$('[data-type]', el).map((s) => { const t = s.textContent; s.textContent = ''; return [s, t]; });
  gsap.set(rows, { opacity: 0 });

  ScrollTrigger.create({
    trigger: el, start: 'top 75%', once: true,
    onEnter: () => {
      const tl = gsap.timeline();
      rows.forEach((row) => {
        const cmd = typed.find(([s]) => row.contains(s));
        tl.set(row, { opacity: 1 });
        if (cmd) {
          const o = { n: 0 };
          tl.to(o, { n: cmd[1].length, duration: cmd[1].length * 0.045, ease: 'none', onUpdate: () => (cmd[0].textContent = cmd[1].slice(0, Math.round(o.n))) });
          tl.to({}, { duration: 0.25 });
        } else {
          tl.from(row, { x: -8, duration: 0.25, ease: 'power2.out' }, '<').to({}, { duration: 0.05 });
        }
      });
    },
  });
}

function initCopy() {
  const btn = $('#copyEmail');
  const toast = $('#toast');
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(P.email); } catch { window.location.href = `mailto:${P.email}`; return; }
    $('#copyState').textContent = 'Copied ✓';
    toast.classList.add('is-show');
    setTimeout(() => { toast.classList.remove('is-show'); $('#copyState').textContent = 'Copy ⧉'; }, 2200);
  });
}

const menu = () => $('#mobileMenu');
function closeMenu() { menu().classList.remove('is-open'); $('#burger').classList.remove('is-open'); lenis?.start(); }
function initMenu() {
  $('#burger').addEventListener('click', () => {
    const open = !menu().classList.contains('is-open');
    menu().classList.toggle('is-open', open);
    $('#burger').classList.toggle('is-open', open);
    open ? lenis.stop() : lenis.start();
  });
}

function initNav() {
  const nav = $('#nav');
  let last = 0;
  lenis.on('scroll', ({ scroll }) => {
    nav.classList.toggle('is-scrolled', scroll > 40);
    nav.classList.toggle('is-hidden', scroll > last && scroll > 500 && !menu().classList.contains('is-open'));
    last = scroll;
  });
  const ind = $('#navIndicator');
  const moveTo = (a) => {
    if (!a) { ind.style.opacity = 0; return; }
    ind.style.opacity = 1;
    ind.style.width = `${a.offsetWidth}px`;
    ind.style.transform = `translateX(${a.offsetLeft}px)`;
  };
  $$('.nav__links a').forEach((a) => {
    const sec = $(a.getAttribute('href'));
    ScrollTrigger.create({
      trigger: sec, start: 'top center', end: 'bottom center',
      onToggle: (s) => {
        a.classList.toggle('is-active', s.isActive);
        moveTo($('.nav__links a.is-active'));
      },
    });
  });
}

/* ────────────────────────── 6. Scroll animations ────────────────────────── */
function initAnimations(scene) {
  // section headings
  $$('.split').forEach((h) => {
    splitWords(h);
    gsap.from($$('.w > span', h), {
      yPercent: 110, rotate: 4, duration: 1.2, ease: 'expo.out', stagger: 0.06,
      scrollTrigger: { trigger: h, start: 'top 85%' },
    });
  });

  $$('.reveal').forEach((el) =>
    gsap.from(el, { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } })
  );


  // counters
  $$('[data-count]').forEach((el) => {
    const o = { v: 0 };
    const dec = +el.dataset.dec;
    gsap.to(o, {
      v: +el.dataset.count, duration: 2.2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
      onUpdate: () => (el.textContent = o.v.toFixed(dec)),
    });
  });

  // marquee — speed reacts to scroll velocity
  const track = $('#marquee');
  let mx = 0, dir = 1;
  gsap.ticker.add(() => {
    const v = lenis.velocity || 0;
    if (Math.abs(v) > 0.5) dir = Math.sign(v);
    mx -= (0.6 + Math.min(Math.abs(v) * 0.4, 18)) * dir;
    const w = track.scrollWidth / 2;
    if (mx <= -w) mx += w;
    if (mx > 0) mx -= w;
    track.style.transform = `translate3d(${mx}px,0,0)`;
  });

  // timeline
  gsap.to('#timelineProgress', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#timeline', start: 'top 70%', end: 'bottom 70%', scrub: true } });
  $$('.job').forEach((job) => {
    ScrollTrigger.create({ trigger: job, start: 'top 70%', onEnter: () => job.classList.add('is-active'), onLeaveBack: () => job.classList.remove('is-active') });
    gsap.from(job.children, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: job, start: 'top 85%' } });
  });

  // horizontal projects (desktop) — must be created before the scene triggers below
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const trackEl = $('#workTrack');
    const cards = $$('.project', trackEl);
    const dist = () => Math.max(0, trackEl.scrollWidth - (window.innerWidth - trackEl.offsetLeft));
    const tween = gsap.to(trackEl, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.work__pin', pin: true, scrub: 1, start: 'top top',
        end: () => '+=' + dist(),
        invalidateOnRefresh: true,
        onUpdate: (s) => ($('#workCount').textContent = String(Math.min(cards.length, Math.floor(s.progress * cards.length) + 1)).padStart(2, '0')),
      },
    });
    cards.forEach((c) => gsap.from($('.project__orb', c), { scale: 0.3, ease: 'none', scrollTrigger: { trigger: c, containerAnimation: tween, start: 'left right', end: 'center center', scrub: true } }));
  });
  mm.add('(max-width: 900px)', () => {
    $$('.project').forEach((c) => gsap.from(c, { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 90%' } }));
  });

  // hero parallax out
  gsap.to('.hero__line--1', { xPercent: -25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__line--2', { xPercent: 25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__orb', { scale: 0.7, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '10% top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__left, .hero__right', { y: -60, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });

  // 3D scene choreography
  const d = isDesktop();
  // the particle orb sits inside .hero__orb
  const heroCfg = () => {
    const r = $('#heroOrb').getBoundingClientRect();
    const w = scene.rectToWorld({ left: r.left, top: r.top + window.scrollY, width: r.width, height: r.height });
    return { morph: 0, x: w.x, y: w.y, scale: (w.h * 0.8) / 4.6, opacity: 1, rotSpeed: 1.6 };
  };
  const configs = {
    hero:       heroCfg(),
    about:      { morph: 1, x: d ? 2.6 : 0, y: 0, scale: d ? 0.85 : 0.7, opacity: 0.6, rotSpeed: 0.8 },
    skills:     { morph: 2, x: 0, y: d ? 2.2 : 0, scale: d ? 1.1 : 0.7, opacity: 0.22, rotSpeed: 0.6 },
    experience: { morph: 3, x: d ? 3 : 0, y: 0, scale: d ? 0.9 : 0.7, opacity: 0.5, rotSpeed: 0.5 },
    work:       { morph: 3, x: d ? -1 : 0, y: 0, scale: d ? 1.25 : 0.8, opacity: 0.75, rotSpeed: 1.2 },
    contact:    { morph: 4, x: 0, y: 0, scale: 1, opacity: 1, rotSpeed: 0 },
  };
  $$('[data-scene]').forEach((sec) => {
    const name = sec.dataset.scene;
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: (s) => s.isActive && gsap.to(scene.state, { ...(name === 'hero' ? heroCfg() : configs[name]), duration: 2.2, ease: 'power3.inOut', overwrite: true }),
    });
  });
  Object.assign(scene.state, configs.hero);
  window.addEventListener('resize', () => { if (window.scrollY < window.innerHeight * 0.5) Object.assign(scene.state, heroCfg()); });
  lenis.on('scroll', ({ scroll }) => (scene.state.scroll = scroll));
}

/* ────────────────────────── 7. Loader & intro ────────────────────────── */
function intro(scene) {
  const counter = { v: 0 };
  const count = $('#loaderCount');
  const bar = $('#loaderBar');
  splitChars($('[data-name]'));
  splitChars($('[data-bigname]'));
  splitChars($('[data-lastname]'));

  gsap.set('.hero__title .ch', { yPercent: 110, rotate: 6 });
  gsap.set('.hero__ring', { scale: 0.5, opacity: 0, rotate: -120 });
  gsap.set('.sticker', { scale: 0, opacity: 0 });
  gsap.set('.reveal-fade, .hero__role, .hero__scroll', { opacity: 0, y: 20 });
  gsap.from('[data-name] .ch', { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.03 });

  const tl = gsap.timeline({ delay: 0.2 });
  tl.to(counter, {
    v: 100, duration: 2.2, ease: 'power2.inOut',
    onUpdate: () => { count.textContent = String(Math.round(counter.v)).padStart(3, '0'); bar.style.width = counter.v + '%'; },
  })
    .to('[data-name] .ch', { yPercent: -110, duration: 0.6, ease: 'expo.in', stagger: 0.02 })
    .to('#loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=0.2')
    .to(scene.uniforms.uIntro, { value: 1, duration: 3, ease: 'expo.out' }, '-=0.6')
    .to('.hero__title .ch', { yPercent: 0, rotate: 0, duration: 1.4, ease: 'expo.out', stagger: 0.035 }, '<')
    .to('.hero__ring', { scale: 1, opacity: 1, rotate: 0, duration: 2, ease: 'expo.out' }, '<0.3')
    .to('.sticker', { scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(2)', stagger: 0.12 }, '<0.3')
    .to('.reveal-fade, .hero__role, .hero__scroll', { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08 }, '<')
    .add(() => {
      $('#loader').remove();
      document.body.classList.remove('is-loading');
      lenis.start();
      ScrollTrigger.refresh();
    }, '<');
}

/* ────────────────────────── Boot ────────────────────────── */
fill();
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const scene = createScene($('#webgl'));
initScroll();
initCursor();
initMagnetic();
initTilt();
initHeroVisual(scene);
initPlayground();
initTyped();
initClock();
initTerminal();
initCopy();
initMenu();
initAnimations(scene);
initNav();
intro(scene);
window.scrollTo(0, 0);

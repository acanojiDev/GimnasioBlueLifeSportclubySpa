import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Water } from './water.js';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- Scroll suave ---------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id.length > 1 && $(id);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.2 });
    else target.scrollIntoView();
  });
});

/* ---------- Hero: entrada inmediata ---------- */
const hero = $('.hero');
if (!reduced) {
  gsap.timeline({ delay: 0.05 })
    .fromTo('.hero__title .line__in', { y: 0, yPercent: 105 }, { y: 0, yPercent: 0, duration: 1, stagger: 0.08, ease: 'expo.out' })
    .fromTo(['.hero__place', '.hero__lede', '.hero__actions'], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out' }, 0.2);

  gsap.to('.hero__water', { scale: 1.1, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { yPercent: -14, autoAlpha: 0.3, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
}

/* ---------- Hero: el agua (WebGL, después del primer pintado) ---------- */
let water = null;
function startWater() {
  try {
    water = new Water($('.hero__canvas'), { reduced });
    water.start();
    document.documentElement.classList.add('is-live');
  } catch {
    water = null;   // sin WebGL se queda el degradado azul del CSS
  }
}
const whenIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 120));
if (document.readyState === 'complete') whenIdle(startWater);
else window.addEventListener('load', () => whenIdle(startWater), { once: true });

// ondas: al mover el cursor (suaves) y al tocar o hacer clic (más fuertes)
let lastRipple = 0;
hero.addEventListener('pointermove', (e) => {
  if (!water || reduced || e.pointerType === 'touch') return;
  const now = performance.now();
  if (now - lastRipple < 110) return;
  lastRipple = now;
  const r = hero.getBoundingClientRect();
  water.ripple(e.clientX - r.left, e.clientY - r.top, 0.45);
});
hero.addEventListener('pointerdown', (e) => {
  if (!water || reduced || e.target.closest('a, button')) return;
  const r = hero.getBoundingClientRect();
  water.ripple(e.clientX - r.left, e.clientY - r.top, 1.2);
});

/* ---------- Navegación ---------- */
const nav = $('[data-nav]');
let lastY = 0;
function onScrollNav(y) {
  nav.classList.toggle('is-solid', y > hero.offsetHeight - 80);
  if (!document.body.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > lastY && y > 200);
  lastY = y;
}
if (lenis) lenis.on('scroll', ({ scroll }) => onScrollNav(scroll));
else window.addEventListener('scroll', () => onScrollNav(scrollY), { passive: true });

const toggle = $('.nav__toggle');
const menu = $('#menu-movil');
function closeMenu() {
  if (menu.hidden) return;
  menu.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
  lenis && lenis.start();
}
toggle.addEventListener('click', () => {
  const open = menu.hidden;
  menu.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('menu-open', open);
  if (open) {
    lenis && lenis.stop();
    if (!reduced) gsap.from($$('a', menu), { y: 24, autoAlpha: 0, stagger: 0.05, duration: 0.45, ease: 'power3.out' });
  } else {
    lenis && lenis.start();
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

/* ---------- Fotos: se cargan si existen; si no, queda el hueco marcado ---------- */
$$('img[data-src]').forEach((img) => {
  const probe = new Image();
  probe.onload = () => {
    img.src = img.dataset.src;
    img.closest('.ph')?.classList.add('has-img');
  };
  probe.src = img.dataset.src;
});

/* ---------- Espacios: recorrido horizontal (escritorio) ---------- */
const mm = gsap.matchMedia();
mm.add('(min-width: 881px) and (prefers-reduced-motion: no-preference)', () => {
  const track = $('.spaces__track');
  const distance = () => track.scrollWidth - window.innerWidth;
  gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: '.spaces',
      pin: '.spaces__pin',
      start: 'top top',
      end: () => `+=${distance()}`,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => gsap.set('.spaces__bar', { scaleX: self.progress }),
    },
  });
});

/* ---------- Clases: filtro ---------- */
const filters = $$('.filter');
const classes = $$('.class-list li');
filters.forEach((btn) => {
  btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filters.forEach((b) => {
      const on = b === btn;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    const shown = [];
    classes.forEach((li) => {
      const show = f === 'todas' || li.dataset.cat === f;
      li.hidden = !show;
      if (show) shown.push(li);
    });
    if (!reduced) gsap.fromTo(shown, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.03, ease: 'power2.out' });
    ScrollTrigger.refresh();
  });
});

/* ---------- Pádel: la foto se desplaza un poco más lenta que el scroll ---------- */
if (!reduced) {
  gsap.fromTo('.padel__bg', { yPercent: -8 }, {
    yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: '.padel', start: 'top bottom', end: 'bottom top', scrub: true },
  });
}

/* ---------- Visita por WhatsApp ---------- */
const form = $('.visit__form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const nombre = $('#f-nombre');
  const err = $('.form-error', form);
  const intereses = $$('input[name="interes"]:checked', form).map((i) => i.value);
  if (!nombre.value.trim()) {
    nombre.setAttribute('aria-invalid', 'true');
    err.hidden = false;
    err.textContent = 'Escribe tu nombre para reservar la visita.';
    nombre.focus();
    return;
  }
  nombre.removeAttribute('aria-invalid');
  if (!intereses.length) {
    err.hidden = false;
    err.textContent = 'Marca al menos una cosa que te interese.';
    return;
  }
  err.hidden = true;
  const msg = [
    `Hola, soy ${nombre.value.trim()}. Me gustaría visitar BlueLife y que me informéis.`,
    `Me interesa: ${intereses.join(', ')}.`,
    `Me viene bien: ${$('#f-dia').value.toLowerCase()}.`,
  ].join('\n');
  window.open(`https://wa.me/34661621755?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
});

window.addEventListener('load', () => ScrollTrigger.refresh());

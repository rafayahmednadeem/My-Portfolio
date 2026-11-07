/* =========================================================
   Rafay Ahmed Nadeem, portfolio
   Vanilla JS, no dependencies.
   ========================================================= */

(function () {
  'use strict';

  const root = document.documentElement;
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Footer year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Hero: page-load text reveal ---------- */
  // CSS handles the animation; adding this class starts it.
  requestAnimationFrame(() => root.classList.add('is-loaded'));

  /* ---------- Hero: showreel loads after the page ---------- */
  // The video src is only set once the window has loaded, so it never blocks first paint.
  const heroVideo = $('.hero__video');
  const saveData = navigator.connection && navigator.connection.saveData;

  if (heroVideo && !prefersReducedMotion && !saveData) {
    window.addEventListener('load', () => {
      heroVideo.src = heroVideo.dataset.src;
      heroVideo.addEventListener('playing', () => heroVideo.classList.add('is-playing'), { once: true });
      heroVideo.play().catch(() => { /* file missing or autoplay blocked: hero stays black */ });
    });
  }

  /* ---------- Scroll progress bar (bottom) + timecode ---------- */
  const bar = $('.progress__bar');
  const tcEl = $('.timecode');
  const FPS = 24;
  const TOTAL_SECONDS = 180; // the page is a 3-minute "timeline"

  const pad = (n) => String(n).padStart(2, '0');

  function toTimecode(progress) {
    const totalFrames = Math.round(progress * TOTAL_SECONDS * FPS);
    const frames = totalFrames % FPS;
    const secs = Math.floor(totalFrames / FPS);
    return `${pad(Math.floor(secs / 3600))}:${pad(Math.floor((secs % 3600) / 60))}:${pad(secs % 60)}:${pad(frames)}`;
  }

  let ticking = false;
  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    if (bar) bar.style.transform = `scaleX(${progress})`;
    if (tcEl) tcEl.textContent = toTimecode(progress);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(updateProgress); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  /* ---------- Scroll-triggered reveal ---------- */
  const revealEls = $$('[data-reveal]');

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    // Slight stagger for project cards so they don't all land at once
    $$('.card').forEach((card, i) => { card.style.transitionDelay = `${(i % 3) * 80}ms`; });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Custom cursor: iOS / iPadOS style ---------- */
  // Default: small translucent dot that trails the pointer.
  // Over a link or button: the dot morphs into a rounded shape that wraps the element.
  // Over a video card: it grows into a larger disc with a "Play" label.
  const cursor = $('.cursor');

  if (cursor && hasFinePointer) {
    const DOT = 16;       // resting size in px
    const DISC = 76;      // size over video cards
    const ease = prefersReducedMotion ? 1 : 0.22;

    let px = -100, py = -100;          // real pointer position
    let cx = px, cy = py;              // cursor centre (eased)
    let cw = DOT, ch = DOT, cr = DOT / 2; // cursor width, height, radius (eased)
    let snapEl = null;                 // element the cursor is wrapped around
    let mode = 'dot';                  // 'dot' | 'snap' | 'card'

    window.addEventListener('mousemove', (e) => {
      px = e.clientX;
      py = e.clientY;
      cursor.classList.add('is-visible');
    });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));

    document.addEventListener('mouseover', (e) => {
      const card = e.target.closest('.card__media');
      const clickable = e.target.closest('a, button');

      if (card) { mode = 'card'; snapEl = card; }
      else if (clickable) { mode = 'snap'; snapEl = clickable; }
      else { mode = 'dot'; snapEl = null; }

      cursor.classList.toggle('is-card', mode === 'card');
      cursor.classList.toggle('is-snap', mode === 'snap');
    });

    (function frame() {
      let tx = px, ty = py, tw = DOT, th = DOT, tr = DOT / 2;

      if (mode === 'snap' && snapEl) {
        // Wrap the element, and drift very slightly toward the pointer
        const r = snapEl.getBoundingClientRect();
        const mx = r.left + r.width / 2;
        const my = r.top + r.height / 2;
        tx = mx + (px - mx) * 0.12;
        ty = my + (py - my) * 0.12;
        tw = r.width + 16;
        th = r.height + 10;
        tr = (parseFloat(getComputedStyle(snapEl).borderRadius) || 0) + 6;
      } else if (mode === 'card') {
        tw = th = DISC;
        tr = DISC / 2;
      }

      cx += (tx - cx) * ease;
      cy += (ty - cy) * ease;
      cw += (tw - cw) * ease;
      ch += (th - ch) * ease;
      cr += (tr - cr) * ease;

      cursor.style.width = `${cw}px`;
      cursor.style.height = `${ch}px`;
      cursor.style.borderRadius = `${Math.min(cr, cw / 2, ch / 2)}px`;
      cursor.style.transform = `translate3d(${cx - cw / 2}px, ${cy - ch / 2}px, 0)`;

      requestAnimationFrame(frame);
    })();
  }

  /* ---------- Project cards ---------- */
  const cards = $$('.card');

  // If a thumbnail file is missing, fall back to the plain numbered frame
  $$('.card__media img').forEach((img) => {
    const markMissing = () => img.closest('.card__media').classList.add('is-missing');
    img.addEventListener('error', markMissing);
    if (img.complete && img.naturalWidth === 0) markMissing();
  });

  // Same idea for the About photo
  const aboutImg = $('.about__photo img');
  if (aboutImg) {
    const markMissing = () => aboutImg.parentElement.classList.add('is-missing');
    aboutImg.addEventListener('error', markMissing);
    if (aboutImg.complete && aboutImg.naturalWidth === 0) markMissing();
  }

  // Hover to preview (mouse devices only). The preview file loads on first hover.
  if (hasFinePointer && !prefersReducedMotion) {
    cards.forEach((card) => {
      const media = $('.card__media', card);
      const preview = $('video', card);
      if (!preview) return;

      const start = () => {
        if (!preview.src) preview.src = preview.dataset.src;
        preview.play().catch(() => { /* preview file missing: thumbnail stays */ });
      };
      const stop = () => {
        preview.pause();
        preview.currentTime = 0;
        preview.classList.remove('is-playing');
      };

      preview.addEventListener('playing', () => preview.classList.add('is-playing'));
      media.addEventListener('mouseenter', start);
      media.addEventListener('mouseleave', stop);
      media.addEventListener('focus', start);
      media.addEventListener('blur', stop);
    });
  }

  /* ---------- Category filters ---------- */
  const chips = $$('.chip');

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;

      chips.forEach((c) => {
        const active = c === chip;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-pressed', String(active));
      });

      cards.forEach((card) => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.hidden = !show;
        if (show) card.classList.add('is-visible'); // don't leave a filtered-in card invisible
      });
    });
  });

  /* ---------- Video modal ---------- */
  const dialog = $('#player');
  const modalVideo = $('#player-video');
  const modalTitle = $('#player-title');
  const modalNote = $('#player-note');
  const closeBtn = $('#player-close');
  let lastTrigger = null;

  function openPlayer(trigger) {
    lastTrigger = trigger;
    modalTitle.textContent = `${trigger.dataset.num} / ${trigger.dataset.title}`;
    modalNote.hidden = true;
    modalVideo.src = trigger.dataset.full;

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', ''); // very old browsers
    }
    document.body.classList.add('modal-open');
    modalVideo.play().catch(() => { /* user can press play */ });
  }

  function cleanUpPlayer() {
    modalVideo.pause();
    modalVideo.removeAttribute('src');
    modalVideo.load();
    document.body.classList.remove('modal-open');
    if (lastTrigger) lastTrigger.focus();
  }

  $$('.card__media').forEach((btn) => btn.addEventListener('click', () => openPlayer(btn)));

  closeBtn.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', cleanUpPlayer);          // fires on Esc as well
  dialog.addEventListener('click', (e) => {                 // click on the dark backdrop
    if (e.target === dialog) dialog.close();
  });
  modalVideo.addEventListener('error', () => { modalNote.hidden = false; });
})();

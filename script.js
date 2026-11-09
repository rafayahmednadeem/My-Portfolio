/* ==========================================================
   Portfolio script – vanilla JS, no dependencies
   ========================================================== */
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Hero text reveal on load */
  window.addEventListener('load', () => document.body.classList.add('is-loaded'));
  document.body.classList.toggle('is-loaded', reduceMotion);

  /* 2. Footer year */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* 3. Timeline playhead + timecode that follow the scroll position */
  const playhead = document.querySelector('.timeline-playhead');
  const timecode = document.getElementById('timecode');
  const TOTAL_SECONDS = 180; // the "length" of the page: 3 minutes
  const FPS = 30;
  const pad = (n) => String(n).padStart(2, '0');

  function updateTimeline() {
    const max = root.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    playhead.style.transform = `translateX(${progress * (window.innerWidth - 2)}px)`;

    const frames = Math.round(progress * TOTAL_SECONDS * FPS);
    const f = frames % FPS;
    const s = Math.floor(frames / FPS) % 60;
    const m = Math.floor(frames / FPS / 60) % 60;
    timecode.textContent = `00:${pad(m)}:${pad(s)}:${pad(f)}`;
  }
  window.addEventListener('scroll', updateTimeline, { passive: true });
  window.addEventListener('resize', updateTimeline);
  updateTimeline();

  /* 4. Fade / slide-up on scroll */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* 5. Project thumbnails (set data-thumb on each card in the HTML) */
  document.querySelectorAll('.project').forEach((card) => {
    const thumb = card.dataset.thumb;
    if (thumb) card.querySelector('.project-thumb').style.backgroundImage = `url("${thumb}")`;
  });

  /* 6. Video modal (YouTube). data-video holds the YouTube video ID. */
  const modal = document.getElementById('modal');
  const frame = document.getElementById('modalFrame');

  function openVideo(id) {
    frame.innerHTML = '';
    if (!id || id.startsWith('REPLACE')) {
      // Placeholder card: tell the owner what to change
      frame.innerHTML = '<p class="modal-note">This is a placeholder. Add a YouTube video ID in the data-video attribute of this card in index.html.</p>';
    } else {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.title = 'Video player';
      frame.appendChild(iframe);
    }
    modal.showModal();
  }

  function closeVideo() {
    modal.close();
    frame.innerHTML = ''; // stops playback
  }

  document.querySelectorAll('.project').forEach((card) => {
    card.addEventListener('click', () => openVideo(card.dataset.video));
  });
  document.getElementById('modalClose').addEventListener('click', closeVideo);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeVideo(); }); // click outside
  modal.addEventListener('close', () => { frame.innerHTML = ''; });                  // Esc key
})();

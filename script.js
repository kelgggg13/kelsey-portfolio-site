// Rotating word in the hero, tied to Kelsey's practice.
// Swaps a single word/phrase on a timer with a short fade+rise transition.
document.addEventListener('DOMContentLoaded', () => {
  const el = document.querySelector('[data-rotator]');
  if (!el) return;

  const line = document.querySelector('.rotator-line');

  // Shrinks the rotator line's font-size just enough that the current
  // phrase fits on one line, so it never wraps regardless of length.
  // Runs a couple of measure/adjust passes (with a safety margin) since
  // font metrics can shift slightly once a shrunk size is applied.
  const fitRotatorLine = () => {
    if (!line) return;
    line.style.fontSize = '';
    for (let pass = 0; pass < 3; pass++) {
      const available = line.clientWidth;
      const needed = line.scrollWidth;
      if (available <= 0 || needed <= available) break;
      const base = parseFloat(getComputedStyle(line).fontSize);
      line.style.fontSize = (base * (available / needed) * 0.94) + 'px';
    }
  };

  const list = [
    "designing for social good.",
    "a product designer.",
    "a researcher at heart.",
    "obsessed with the details."
  ];

  let i = 0;
  fitRotatorLine();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitRotatorLine);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fitRotatorLine, 100);
  });

  setInterval(() => {
    i = (i + 1) % list.length;
    el.classList.remove('swap');
    // force reflow so the animation can restart
    void el.offsetWidth;
    el.textContent = list[i];
    fitRotatorLine();
    el.classList.add('swap');
  }, 2600);
});

// Hero glow follows the cursor, easing toward it each frame instead of
// snapping straight there.
document.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.home-hero');
  const glow = document.querySelector('.hero-glow');
  if (!hero || !glow) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let targetX = null;
  let targetY = null;
  let currentX = 0;
  let currentY = 0;
  let raf = null;

  const tick = () => {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    glow.style.left = currentX + 'px';
    glow.style.top = currentY + 'px';
    glow.style.bottom = 'auto';
    glow.style.transform = 'translate(-50%, -50%)';
    if (Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = null;
    }
  };

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
    if (currentX === 0 && currentY === 0) {
      currentX = targetX;
      currentY = targetY;
    }
    if (!raf) raf = requestAnimationFrame(tick);
  });
});

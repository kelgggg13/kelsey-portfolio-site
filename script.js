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
    "a Sr. Product Designer.",
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

// Glow follows the cursor across the whole page (fixed to the viewport),
// easing toward it each frame, and drifts through the color wheel as the
// cursor travels (purple, pink, orange, yellow, green, blue, ...).
document.addEventListener('DOMContentLoaded', () => {
  const glow = document.querySelector('.hero-glow');
  if (!glow) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const HUE_PER_PX = 0.22;
  let targetX = null;
  let targetY = null;
  let currentX = 0;
  let currentY = 0;
  let lastX = null;
  let lastY = null;
  let hue = 285;
  let targetHue = 285;
  let raf = null;

  const tick = () => {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    hue += (targetHue - hue) * 0.05;
    glow.style.left = currentX + 'px';
    glow.style.top = currentY + 'px';
    glow.style.bottom = 'auto';
    glow.style.transform = 'translate(-50%, -50%)';
    glow.style.setProperty('--hue', hue.toFixed(1));
    const moving = Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5;
    const shifting = Math.abs(targetHue - hue) > 0.2;
    raf = moving || shifting ? requestAnimationFrame(tick) : null;
  };

  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    if (lastX !== null) {
      targetHue += Math.hypot(e.clientX - lastX, e.clientY - lastY) * HUE_PER_PX;
    }
    lastX = e.clientX;
    lastY = e.clientY;
    if (currentX === 0 && currentY === 0) {
      currentX = targetX;
      currentY = targetY;
    }
    if (!raf) raf = requestAnimationFrame(tick);
  });
});

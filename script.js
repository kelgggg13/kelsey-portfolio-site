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

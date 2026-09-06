// Rotating word in the hero, tied to Kelsey's practice.
// Swaps a single word/phrase on a timer with a short fade+rise transition.
document.addEventListener('DOMContentLoaded', () => {
  const el = document.querySelector('[data-rotator]');
  if (!el) return;

  const list = [
    "a product designer.",
    "a researcher at heart.",
    "obsessed with the details.",
    "designing for social good."
  ];

  let i = 0;
  setInterval(() => {
    i = (i + 1) % list.length;
    el.classList.remove('swap');
    // force reflow so the animation can restart
    void el.offsetWidth;
    el.textContent = list[i];
    el.classList.add('swap');
  }, 2600);
});

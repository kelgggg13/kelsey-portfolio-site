// Click any case-study figure image to view it enlarged over a dark scrim.
document.addEventListener('DOMContentLoaded', () => {
  const imgs = document.querySelectorAll('.cs-figure img');
  if (!imgs.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'lb';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Enlarged image');
  overlay.innerHTML =
    '<button class="lb-close" type="button" aria-label="Close enlarged image">&times;</button>' +
    '<img class="lb-img" alt="">';
  document.body.appendChild(overlay);

  const big = overlay.querySelector('.lb-img');
  const closeBtn = overlay.querySelector('.lb-close');
  let lastFocus = null;

  const open = (img) => {
    lastFocus = document.activeElement;
    big.alt = img.alt;
    big.src = img.dataset.full || img.currentSrc || img.src;
    overlay.classList.add('open');
    document.documentElement.classList.add('lb-lock');
    closeBtn.focus();
  };

  const close = () => {
    overlay.classList.remove('open');
    document.documentElement.classList.remove('lb-lock');
    if (lastFocus) lastFocus.focus();
  };

  imgs.forEach((img) => {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Enlarge image: ' + img.alt);
    img.addEventListener('click', () => open(img));
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(img);
      }
    });
  });

  overlay.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });
});

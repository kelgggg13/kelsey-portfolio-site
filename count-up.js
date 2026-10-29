// Outcomes stats: each number counts up and its rule draws in as it scrolls into view.
(function () {
  var grid = document.querySelector('.stat-grid');
  if (!grid) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  grid.classList.add('js-reveal');

  function count(card) {
    var n = card.querySelector('.n');
    var to = n ? parseFloat(n.getAttribute('data-to')) : 0;
    var dec = n ? parseInt(n.getAttribute('data-dec') || '0', 10) : 0;
    if (!to) return;
    var start = null;
    var duration = 1100;
    n.textContent = '0';
    function step(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / duration, 1);
      n.textContent = (to * (1 - Math.pow(1 - p, 3))).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      entry.target.classList.add('in-view');
      count(entry.target);
    });
  }, { threshold: 0.4 });

  grid.querySelectorAll('.stat-card').forEach(function (card) { io.observe(card); });
})();

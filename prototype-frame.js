// Embedded prototypes: show the prototype at its design width, and scale it down to fit narrower cards.
(function () {
  var figures = [].slice.call(document.querySelectorAll('.cs-proto'));
  if (!figures.length) return;

  function fit(fig) {
    var box = fig.querySelector('.cs-proto-frame');
    var frame = box.querySelector('iframe');
    // a little extra width so the prototype's own vertical scrollbar doesn't force a sideways one
    var designWidth = (parseFloat(fig.getAttribute('data-design-width')) || 1100) + 24;
    var height = parseFloat(fig.getAttribute('data-height')) || 760;
    var width = box.clientWidth;
    if (!width) return;
    if (width >= designWidth) {
      frame.style.width = '100%';
      frame.style.height = height + 'px';
      frame.style.transform = 'none';
      box.style.height = height + 'px';
    } else {
      var scale = width / designWidth;
      frame.style.width = designWidth + 'px';
      frame.style.height = height + 'px';
      frame.style.transform = 'scale(' + scale + ')';
      box.style.height = Math.round(height * scale) + 'px';
    }
  }

  figures.forEach(function (fig) {
    fit(fig);
    if ('ResizeObserver' in window) {
      var last = 0;
      new ResizeObserver(function (entries) {
        var w = Math.round(entries[0].contentRect.width);
        if (w !== last) { last = w; fit(fig); }
      }).observe(fig.querySelector('.cs-proto-frame'));
    } else {
      window.addEventListener('resize', function () { fit(fig); });
    }
  });
})();

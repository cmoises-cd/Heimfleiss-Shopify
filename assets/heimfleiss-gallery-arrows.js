/**
 * planenfux-gallery-arrows.js v7
 * Wrapper-Div direkt um den Viewer – position:absolute, scrollt mit dem Bild
 */

(function () {
  'use strict';

  var style = document.createElement('style');
  style.textContent = [
    '.pf-gallery-wrap {',
    '  position: relative;',
    '  display: block;',
    '}',
    '.pf-arrow {',
    '  position: absolute;',
    '  top: 50%;',
    '  transform: translateY(-50%);',
    '  z-index: 100;',
    '  width: 46px;',
    '  height: 46px;',
    '  border-radius: 50%;',
    '  border: none;',
    '  background: rgba(255,255,255,0.92);',
    '  box-shadow: 0 2px 10px rgba(0,0,0,0.18);',
    '  cursor: pointer;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  opacity: 0;',
    '  transition: opacity 0.2s ease;',
    '  pointer-events: none;',
    '}',
    '.pf-gallery-wrap:hover .pf-arrow {',
    '  opacity: 1;',
    '  pointer-events: auto;',
    '}',
    '.pf-arrow:hover { background: #fff; }',
    '.pf-arrow--prev { left: 14px; }',
    '.pf-arrow--next { right: 14px; }',
    '@media (max-width: 749px) { .pf-arrow { display: none !important; } }'
  ].join('\n');
  document.head.appendChild(style);

  function makeArrow(dir) {
    var btn = document.createElement('button');
    btn.className = 'pf-arrow pf-arrow--' + dir;
    btn.type = 'button';
    btn.setAttribute('aria-label', dir === 'prev' ? 'Vorheriges Bild' : 'Nächstes Bild');
    btn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2.5" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' +
      '<polyline points="' +
      (dir === 'prev' ? '15 18 9 12 15 6' : '9 18 15 12 9 6') +
      '"></polyline></svg>';
    return btn;
  }

  function getVisibleThumbs() {
    var allThumbs = Array.from(document.querySelectorAll(
      '[id^="GalleryThumbnails-"] li button,' +
      '.thumbnail-list li button,' +
      '.thumbnail-slider li button'
    ));
    return allThumbs.filter(function (btn) {
      var li = btn.closest('li');
      if (!li) return false;
      if (li.style.display === 'none') return false;
      if (li.clientWidth === 0) return false;
      return true;
    });
  }

  function navigate(dir) {
    var thumbs = getVisibleThumbs();
    if (!thumbs.length) return;
    var current = 0;
    for (var i = 0; i < thumbs.length; i++) {
      if (thumbs[i].getAttribute('aria-current') === 'true') { current = i; break; }
    }
    var next = current + dir;
    if (next < 0) next = 0;
    if (next >= thumbs.length) next = thumbs.length - 1;
    thumbs[next].click();
  }

  function init() {
    // Viewer finden
    var viewer = document.querySelector('[id^="GalleryViewer-"]');
    if (!viewer) return;

    // Wrapper-Div um den Viewer legen
    var wrapper = document.createElement('div');
    wrapper.className = 'pf-gallery-wrap';
    viewer.parentNode.insertBefore(wrapper, viewer);
    wrapper.appendChild(viewer);

    // Pfeile in den Wrapper einfügen
    var prev = makeArrow('prev');
    var next = makeArrow('next');
    wrapper.appendChild(prev);
    wrapper.appendChild(next);

    prev.addEventListener('click', function () { navigate(-1); });
    next.addEventListener('click', function () { navigate(1); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
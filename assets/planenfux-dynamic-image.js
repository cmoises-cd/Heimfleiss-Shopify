/**
 * planenfux-dynamic-image.js v6
 * - Multi-Option Support (optionKey + optionKey2)
 * - Abwärtskompatibel: funktioniert weiterhin mit nur einer Option
 */

(function () {
  'use strict';

  var cfg = window.PlanenfuxDynamicImage;
  if (!cfg || !cfg.position || !cfg.images || !cfg.variants) return;

  var position  = cfg.position;
  var optKey    = cfg.optionKey  || 'option1';
  var optKey2   = cfg.optionKey2 || '';
  var variants  = cfg.variants;

  function getMatchKey(variant) {
    var val1 = variant[optKey]  ? variant[optKey].trim()  : '';
    var val2 = optKey2 && variant[optKey2] ? variant[optKey2].trim() : '';
    return val2 ? val1 + ' ' + val2 : val1;
  }

  var allMatchKeys = variants
    .map(function (v) { return getMatchKey(v).toLowerCase(); })
    .filter(Boolean);

  function isMeasurementItem(item) {
    var img = item.querySelector('img');
    if (!img || !img.alt) return false;
    return allMatchKeys.indexOf(img.alt.trim().toLowerCase()) !== -1;
  }

  function setVisibility(mainItem, visible) {
    mainItem.style.display = visible ? '' : 'none';
    if (mainItem.id) {
      var targetId = mainItem.id.replace(/^Slide-/, '');
      var thumbBtn = document.querySelector('[data-target="' + targetId + '"]');
      if (thumbBtn) {
        var li = thumbBtn.closest('li');
        if (li) li.style.display = visible ? '' : 'none';
      }
    }
  }

  function reinitSliders() {
    document.querySelectorAll('slider-component').forEach(function (sc) {
      if (typeof sc.initPages === 'function') sc.initPages();
    });
  }

  function jumpToFirstImage() {
    var gallery   = document.querySelector('product-media-gallery');
    var firstItem = document.querySelector(
      '.product__media-list > .product__media-item:not([style*="display: none"])'
    );
    if (gallery && firstItem && typeof gallery.setActiveMedia === 'function') {
      var mediaId = firstItem.dataset.mediaId;
      if (mediaId) { gallery.setActiveMedia(mediaId, false); return; }
    }

    var firstThumb = document.querySelector(
      '[id*="Thumbnails"] li:not([style*="display: none"]) button,' +
      '.thumbnail-list li:not([style*="display: none"]) button'
    );
    if (firstThumb) { firstThumb.click(); return; }

    var mainSlider = document.querySelector('.product__media-list');
    if (mainSlider) mainSlider.scrollTo({ left: 0, behavior: 'smooth' });
  }

  var lastVariantId = null;

  function update() {
    var input = document.querySelector(
      'form[action="/cart/add"] input[name="id"]:not([disabled])'
    );
    if (!input) return;

    var variantId = parseInt(input.value, 10);
    if (variantId === lastVariantId) return;
    lastVariantId = variantId;

    var variant = variants.find(function (v) { return v.id === variantId; });
    if (!variant) return;

    var matchKey = getMatchKey(variant).toLowerCase();
    if (!matchKey) return;

    var mediaList = document.querySelector('.product__media-list');
    if (!mediaList) return;

    var allItems = Array.from(
      mediaList.querySelectorAll(':scope > .product__media-item')
    );

    var staticItems      = allItems.filter(function (i) { return !isMeasurementItem(i); });
    var measurementItems = allItems.filter(function (i) { return isMeasurementItem(i); });

    measurementItems.forEach(function (item) { setVisibility(item, false); });

    var matchingItem = null;
    measurementItems.forEach(function (item) {
      var img = item.querySelector('img');
      if (img && img.alt && img.alt.trim().toLowerCase() === matchKey) {
        matchingItem = item;
      }
    });

    if (matchingItem) {
      setVisibility(matchingItem, true);
      var referenceItem = staticItems[position - 1];
      if (referenceItem) {
        mediaList.insertBefore(matchingItem, referenceItem);
      } else {
        mediaList.appendChild(matchingItem);
      }
    }

    setTimeout(function () {
      jumpToFirstImage();
      reinitSliders();
    }, 50);
  }

  setInterval(update, 200);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(update, 300); });
  } else {
    setTimeout(update, 300);
  }

})();
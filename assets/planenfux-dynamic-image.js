/**
 * planenfux-dynamic-image.js v5
 * - Polling für zuverlässige Variantenerkennung
 * - Slider-Reinitialisierung für Pfeil-Navigation
 * - Automatisch zu Bild 1 springen bei Variantenwechsel
 */

(function () {
  'use strict';

  var cfg = window.PlanenfuxDynamicImage;
  if (!cfg || !cfg.position || !cfg.images || !cfg.variants) return;

  var position = cfg.position;
  var optKey   = cfg.optionKey || 'option1';
  var variants = cfg.variants;

  var allOptionValues = variants
    .map(function (v) { return v[optKey] ? v[optKey].trim().toLowerCase() : null; })
    .filter(Boolean);

  function isMeasurementItem(item) {
    var img = item.querySelector('img');
    if (!img || !img.alt) return false;
    return allOptionValues.indexOf(img.alt.trim().toLowerCase()) !== -1;
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

  // Zu Bild 1 springen
  function jumpToFirstImage() {
    // Versuch 1: Dawn's eingebaute setActiveMedia Methode
    var gallery = document.querySelector('product-media-gallery');
    var firstItem = document.querySelector(
      '.product__media-list > .product__media-item:not([style*="display: none"])'
    );
    if (gallery && firstItem && typeof gallery.setActiveMedia === 'function') {
      var mediaId = firstItem.dataset.mediaId;
      if (mediaId) {
        gallery.setActiveMedia(mediaId, false);
        return;
      }
    }

    // Versuch 2: Erstes sichtbares Thumbnail anklicken
    var firstThumb = document.querySelector(
      '[id*="Thumbnails"] li:not([style*="display: none"]) button,' +
      '.thumbnail-list li:not([style*="display: none"]) button'
    );
    if (firstThumb) {
      firstThumb.click();
      return;
    }

    // Versuch 3: Hauptslider auf 0 scrollen
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

    var optionValue = variant[optKey];
    if (!optionValue) return;

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
      if (img && img.alt && img.alt.trim().toLowerCase() === optionValue.trim().toLowerCase()) {
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

    // Zu Bild 1 springen + Slider neu initialisieren
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
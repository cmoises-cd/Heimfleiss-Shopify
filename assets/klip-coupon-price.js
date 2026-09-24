class KlipCouponPrice {
  constructor(section) {
    this.section = section;
    this.percentage = null;
    this.renderState = null;
    this.updateQueued = false;
    this.moneyFormat = section.getAttribute('data-money-format') || '{{amount}}';

    this.onSectionChange = () => {
      this.queueUpdate();
    };

    this.observer = new MutationObserver(() => {
      this.queueUpdate();
    });

    this.observer.observe(section, {
      childList: true,
      subtree: true,
      characterData: true
    });

    section.addEventListener('change', this.onSectionChange);
    this.queueUpdate();
  }

  queueUpdate() {
    if (this.updateQueued) {
      return;
    }

    this.updateQueued = true;

    requestAnimationFrame(() => {
      this.updateQueued = false;
      this.update();
    });
  }

  findCouponBoxes() {
    return this.section.querySelectorAll('.elsklip-coupon-box, .elsklip-coupon__container');
  }

  readPercentage(couponBox) {
    const text = couponBox.textContent || '';
    const match = text.match(/(\d+(?:[.,]\d+)?)\s*%/);

    if (!match) {
      return null;
    }

    return parseFloat(match[1].replace(',', '.'));
  }

  isCouponChecked(couponBoxes) {
    for (let index = 0; index < couponBoxes.length; index++) {
      const checkbox = couponBoxes[index].querySelector('input[type="checkbox"]');

      if (checkbox && checkbox.checked) {
        return true;
      }
    }

    return false;
  }

  update() {
    const couponBoxes = this.findCouponBoxes();

    if (couponBoxes.length === 0) {
      this.percentage = null;
      this.removeCustomPrice();
      return;
    }

    for (let index = 0; index < couponBoxes.length; index++) {
      const detectedPercentage = this.readPercentage(couponBoxes[index]);

      if (detectedPercentage !== null) {
        this.percentage = detectedPercentage;
      }
    }

    const priceElement = this.section.querySelector('[id^="price-"] .price[data-price-cents]');
    const checkboxIsChecked = this.isCouponChecked(couponBoxes);

    if (!checkboxIsChecked || this.percentage === null || !priceElement) {
      this.removeCustomPrice();
      return;
    }

    const originalPrice = parseInt(priceElement.getAttribute('data-price-cents'), 10);

    if (Number.isNaN(originalPrice)) {
      this.removeCustomPrice();
      return;
    }

    const discountAmount = Math.floor(originalPrice * this.percentage / 100);
    const discountedPrice = originalPrice - discountAmount;

    this.renderCustomPrice(priceElement, originalPrice, discountedPrice, this.percentage);
  }

  renderCustomPrice(priceElement, originalPrice, discountedPrice, percentage) {
    const nextState = originalPrice + '|' + discountedPrice + '|' + percentage;
    const existingPrice = priceElement.querySelector('.klip-coupon-price');

    if (existingPrice && this.renderState === nextState) {
      priceElement.classList.add('price--klip-coupon');
      return;
    }

    this.renderState = nextState;
    priceElement.classList.add('price--klip-coupon');

    let customPrice = existingPrice;

    if (!customPrice) {
      customPrice = document.createElement('div');
      customPrice.className = 'klip-coupon-price';

      const originalPriceElement = document.createElement('s');
      originalPriceElement.className = 'price-item klip-coupon-price__original';

      const discountedPriceElement = document.createElement('span');
      discountedPriceElement.className = 'price-item klip-coupon-price__discounted';

      customPrice.appendChild(originalPriceElement);
      customPrice.appendChild(discountedPriceElement);
      priceElement.appendChild(customPrice);
    }

    const originalPriceElement = customPrice.querySelector('.klip-coupon-price__original');
    const discountedPriceElement = customPrice.querySelector('.klip-coupon-price__discounted');

    originalPriceElement.textContent = this.formatMoney(originalPrice);
    discountedPriceElement.textContent = 'Von ' + this.formatMoney(discountedPrice);
  }

  removeCustomPrice() {
    this.renderState = null;

    const priceElements = this.section.querySelectorAll('.price.price--klip-coupon');

    for (let index = 0; index < priceElements.length; index++) {
      const priceElement = priceElements[index];
      const customPrice = priceElement.querySelector('.klip-coupon-price');

      priceElement.classList.remove('price--klip-coupon');

      if (customPrice) {
        customPrice.remove();
      }
    }
  }

  formatMoney(cents) {
    const placeholderMatch = this.moneyFormat.match(/\{\{\s*(\w+)\s*\}\}/);

    if (!placeholderMatch) {
      return this.formatAmount(cents, 2, ',', '.');
    }

    const placeholder = placeholderMatch[1];
    let formattedAmount = '';

    if (placeholder === 'amount') {
      formattedAmount = this.formatAmount(cents, 2, ',', '.');
    } else if (placeholder === 'amount_no_decimals') {
      formattedAmount = this.formatAmount(cents, 0, ',', '.');
    } else if (placeholder === 'amount_with_comma_separator') {
      formattedAmount = this.formatAmount(cents, 2, '.', ',');
    } else if (placeholder === 'amount_no_decimals_with_comma_separator') {
      formattedAmount = this.formatAmount(cents, 0, '.', ',');
    } else if (placeholder === 'amount_with_apostrophe_separator') {
      formattedAmount = this.formatAmount(cents, 2, "'", '.');
    } else {
      formattedAmount = this.formatAmount(cents, 2, ',', '.');
    }

    return this.moneyFormat.replace(placeholderMatch[0], formattedAmount);
  }

  formatAmount(cents, precision, thousandsSeparator, decimalSeparator) {
    const fixedAmount = (cents / 100).toFixed(precision);
    const amountParts = fixedAmount.split('.');
    const wholeWithSeparators = this.addThousandsSeparator(amountParts[0], thousandsSeparator);

    if (precision === 0 || !amountParts[1]) {
      return wholeWithSeparators;
    }

    return wholeWithSeparators + decimalSeparator + amountParts[1];
  }

  addThousandsSeparator(wholeNumber, thousandsSeparator) {
    const isNegative = wholeNumber.charAt(0) === '-';
    const digits = isNegative ? wholeNumber.slice(1) : wholeNumber;
    let formattedDigits = '';
    let digitsCounted = 0;

    for (let index = digits.length - 1; index >= 0; index--) {
      if (digitsCounted > 0 && digitsCounted % 3 === 0) {
        formattedDigits = thousandsSeparator + formattedDigits;
      }

      formattedDigits = digits.charAt(index) + formattedDigits;
      digitsCounted = digitsCounted + 1;
    }

    if (isNegative) {
      return '-' + formattedDigits;
    }

    return formattedDigits;
  }
}

function initKlipCouponPrice() {
  const sections = document.querySelectorAll('[data-klip-coupon-price]');

  for (let index = 0; index < sections.length; index++) {
    const section = sections[index];

    if (section.klipCouponPrice) {
      continue;
    }

    section.klipCouponPrice = new KlipCouponPrice(section);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initKlipCouponPrice);
} else {
  initKlipCouponPrice();
}

document.addEventListener('shopify:section:load', initKlipCouponPrice);

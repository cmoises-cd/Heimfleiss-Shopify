/*
  <cart-recommendations> ... </cart-recommendations>

  The recommendation items are rendered server-side (inside the cart drawer)
  by the `cart-recommendations-list` snippet, which picks one product from
  each different category collection than the cart's current product.

  This script just wires up the variant select + add-to-cart button for each
  rendered item. It runs again automatically every time the cart drawer is
  re-rendered, because Shopify replaces the drawer's innerHTML and the
  custom element fires `connectedCallback` again.
*/

class CartRecommendations extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.bindEvents();
  }

  bindEvents() {
    const items = this.querySelectorAll('.cart-rec');

    items.forEach((item) => {
      const select = item.querySelector('[data-variant-select]');
      const button = item.querySelector('[data-add-button]');
      const priceEl = item.querySelector('[data-price-target]');

      if (select && button) {
        select.addEventListener('change', () => {
          const selectedOption = select.options[select.selectedIndex];
          button.dataset.variantId = selectedOption.value;

          if (priceEl && selectedOption.dataset.price) {
            this.animatePriceChange(priceEl, selectedOption.dataset.price);
          }

          if (selectedOption.disabled) {
            button.setAttribute('disabled', '');
          } else {
            button.removeAttribute('disabled');
          }
        });
      }

      if (button) {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          this.addToCart(button);
        });
      }
    });
  }

  animatePriceChange(priceEl, newPrice) {
    priceEl.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
    priceEl.style.opacity = '0';
    priceEl.style.transform = 'translateY(-3px)';

    setTimeout(() => {
      priceEl.innerHTML = newPrice;
      priceEl.style.transform = 'translateY(3px)';
      requestAnimationFrame(() => {
        priceEl.style.opacity = '1';
        priceEl.style.transform = 'translateY(0)';
      });
    }, 150);
  }

  addToCart(button) {
    const variantId = button.dataset.variantId;
    if (!variantId || button.hasAttribute('disabled') || button.classList.contains('is-loading')) {
      return;
    }

    button.classList.add('is-loading');

    const cartDrawer = document.querySelector('cart-drawer');
    const sections = cartDrawer
      ? cartDrawer.getSectionsToRender().map((s) => s.id)
      : [];

    const formData = new FormData();
    formData.append('id', variantId);
    formData.append('quantity', '1');

    if (sections.length) {
      formData.append('sections', sections.join(','));
      formData.append('sections_url', window.location.pathname);
    }

    fetch(window.routes.cart_add_url, {
      method: 'POST',
      headers: {
        Accept: 'application/javascript',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: formData,
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.status) {
          console.error('Add to cart error:', response.description);
          button.classList.remove('is-loading');
          return;
        }

        button.classList.remove('is-loading');
        button.classList.add('is-success');

        setTimeout(() => {
          if (cartDrawer && response.sections) {
            cartDrawer.renderContents(response);
          } else if (typeof publish === 'function') {
            publish(PUB_SUB_EVENTS.cartUpdate, {
              source: 'cart-recommendations',
              cartData: response,
            });
          }
        }, 350);
      })
      .catch((e) => {
        console.error('Failed to add recommended product:', e);
        button.classList.remove('is-loading');
      });
  }
}

customElements.define('cart-recommendations', CartRecommendations);

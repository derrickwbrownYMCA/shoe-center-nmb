/**
 * assets/theme.js
 * ShoeCenterNMB Premium — Main JavaScript (ES Module)
 * ─────────────────────────────────────────────────────────────────────────────
 * No build step. No external dependencies. Plain ES modules loaded via
 * <script type="module"> in layout/theme.liquid.
 *
 * Architecture:
 *   1. Utilities: formatMoney, escapeHtml, debounce
 *   2. CartAPI — thin fetch wrapper for Shopify Cart AJAX API
 *   3. CartDrawer — custom element: open/close, refresh items, qty/remove
 *   4. ProductForm — custom element: intercept add-to-cart, open drawer
 *   5. VariantSelector — custom element: option selects → variant ID
 *   6. PredictiveSearch — custom element: debounced search → results dropdown
 *   7. Header scroll shadow — IntersectionObserver sentinel
 *   8. Init — wire up non-custom-element DOM (cart trigger, mobile nav toggle)
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   § 1 — Utilities
═══════════════════════════════════════════════════════════════════════════ */

/**
 * Format a Shopify price integer (cents) into a display string.
 * Uses window.ShoeCenter.moneyFormat if set by theme.liquid, otherwise
 * falls back to a simple USD formatter.
 *
 * @param {number} cents — price in cents (e.g. 8995 → "$89.95")
 * @returns {string}
 */
function formatMoney(cents) {
  const moneyFormat = window.ShoeCenter?.moneyFormat || '${{amount}}';
  const amount = (cents / 100).toFixed(2);
  // Shopify money format uses {{amount}}, {{amount_no_decimals}}, etc.
  return moneyFormat
    .replace('{{amount}}', amount)
    .replace('{{amount_no_decimals}}', Math.round(cents / 100))
    .replace('{{amount_with_comma_separator}}', amount.replace('.', ','))
    .replace('{{amount_no_decimals_with_comma_separator}}', String(Math.round(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
}

/**
 * Escape HTML special characters to prevent XSS when inserting
 * user-supplied or API-returned strings into innerHTML.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Debounce: delays fn execution until `wait` ms have passed since the last call.
 * Used by PredictiveSearch to avoid firing on every keystroke.
 *
 * @param {Function} fn
 * @param {number} wait — milliseconds
 * @returns {Function}
 */
function debounce(fn, wait = 300) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

function getThemeRoute(key, fallback) {
  return window.ShoeCenter?.routes?.[key] || fallback;
}

/**
 * Focus trap: keeps keyboard focus inside `container` while active.
 * Returns a cleanup function.
 *
 * @param {HTMLElement} container
 * @returns {Function} cleanup
 */
function trapFocus(container) {
  const focusable = () =>
    Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.closest('[inert]'));

  function handleKeydown(e) {
    if (e.key !== 'Tab') return;
    const els = focusable();
    if (els.length === 0) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  document.addEventListener('keydown', handleKeydown);
  // Move focus into the container
  const firstEl = focusable()[0];
  if (firstEl) firstEl.focus();

  return () => document.removeEventListener('keydown', handleKeydown);
}


/* ═══════════════════════════════════════════════════════════════════════════
   § 2 — CartAPI
   Thin wrapper around Shopify's AJAX Cart API.
   All methods return a Promise<object> (the cart JSON or an error).
═══════════════════════════════════════════════════════════════════════════ */

const CartAPI = {
  /**
   * Fetch the current cart state.
   * @returns {Promise<object>} Shopify cart object
   */
  async get() {
    const res = await fetch(`${getThemeRoute('cart', '/cart')}.js`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`CartAPI.get failed: ${res.status}`);
    return res.json();
  },

  /**
   * Add one or more items to the cart.
   * @param {Array<{id: number, quantity: number, properties?: object}>} items
   * @returns {Promise<object>} Shopify cart object
   */
  async addItems(items) {
    const res = await fetch(`${getThemeRoute('cartAdd', '/cart/add')}.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.description || `CartAPI.addItems failed: ${res.status}`);
    }
    // /cart/add.js returns the added items, not the full cart; fetch cart state
    return this.get();
  },

  /**
   * Update a line item's quantity. Use quantity: 0 to remove.
   * @param {number} line — 1-indexed line item number
   * @param {number} quantity
   * @returns {Promise<object>} Shopify cart object
   */
  async change(line, quantity) {
    const res = await fetch(`${getThemeRoute('cartChange', '/cart/change')}.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line, quantity }),
    });
    if (!res.ok) throw new Error(`CartAPI.change failed: ${res.status}`);
    return res.json();
  },

  /**
   * Update cart attributes / note.
   * @param {object} updates — e.g. { note: 'Please gift wrap' }
   * @returns {Promise<object>} Shopify cart object
   */
  async update(updates) {
    const res = await fetch(`${getThemeRoute('cartUpdate', '/cart/update')}.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`CartAPI.update failed: ${res.status}`);
    return res.json();
  },
};


/* ═══════════════════════════════════════════════════════════════════════════
   § 3 — CartDrawer Custom Element
   <cart-drawer id="CartDrawer" aria-hidden="true">
   Controls: overlay + sliding panel. Items populated from CartAPI.
═══════════════════════════════════════════════════════════════════════════ */

class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this._releaseFocusTrap = null;
    this._previouslyFocused = null;
  }

  connectedCallback() {
    this._panel = this.querySelector('.cart-drawer__panel');
    this._overlay = this.querySelector('.cart-drawer__overlay');
    this._itemsRegion = this.querySelector('.cart-drawer__items');
    this._emptyMsg = this.querySelector('.cart-drawer__empty');
    this._footer = this.querySelector('.cart-drawer__footer');
    this._subtotalEl = this.querySelector('[data-cart-subtotal]');
    this._closeBtn = this.querySelector('[data-cart-drawer-close]');

    // Close on overlay click
    this._overlay?.addEventListener('click', () => this.close());

    // Close on close button click
    this._closeBtn?.addEventListener('click', () => this.close());

    // Close on Escape key
    this._onKeydown = (e) => {
      if (e.key === 'Escape' && !this.isHidden) this.close();
    };
    document.addEventListener('keydown', this._onKeydown);

    // Listen for cart:open events dispatched by other elements (e.g. ProductForm)
    document.addEventListener('cart:open', () => this.open());

    // Listen for cart:updated to refresh the drawer contents
    document.addEventListener('cart:updated', (e) => {
      if (e.detail?.cart) this._render(e.detail.cart);
    });
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onKeydown);
  }

  get isHidden() {
    return this.getAttribute('aria-hidden') !== 'false';
  }

  /** Open the drawer and refresh cart contents. */
  async open() {
    this._previouslyFocused = document.activeElement;

    // Show drawer
    this.setAttribute('aria-hidden', 'false');
    this._panel.removeAttribute('inert');
    document.body.style.overflow = 'hidden'; // Prevent body scroll

    // Fetch latest cart state
    try {
      const cart = await CartAPI.get();
      this._render(cart);
    } catch (err) {
      console.error('[CartDrawer] Failed to fetch cart:', err);
    }

    // Trap focus inside panel
    this._releaseFocusTrap = trapFocus(this._panel);
  }

  /** Close the drawer and restore focus. */
  close() {
    this.setAttribute('aria-hidden', 'true');
    this._panel.setAttribute('inert', '');
    document.body.style.overflow = '';

    // Release focus trap
    if (this._releaseFocusTrap) {
      this._releaseFocusTrap();
      this._releaseFocusTrap = null;
    }

    // Return focus to the trigger element
    if (this._previouslyFocused && typeof this._previouslyFocused.focus === 'function') {
      this._previouslyFocused.focus();
      this._previouslyFocused = null;
    }
  }

  /**
   * Render cart items and update subtotal.
   * @param {object} cart — Shopify cart object from AJAX API
   */
  _render(cart) {
    const hasItems = cart.item_count > 0;

    // Toggle empty/filled states
    if (this._emptyMsg) this._emptyMsg.hidden = hasItems;
    if (this._footer) this._footer.hidden = !hasItems;

    // Update subtotal
    if (this._subtotalEl) {
      this._subtotalEl.textContent = formatMoney(cart.total_price);
    }

    // Update cart count badge(s) in the header
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = cart.item_count;
      el.hidden = cart.item_count === 0;
    });

    // Render line items
    if (!this._itemsRegion) return;

    if (!hasItems) {
      this._itemsRegion.innerHTML = '';
      return;
    }

    this._itemsRegion.innerHTML = cart.items.map((item, index) => {
      const lineNumber = index + 1; // Shopify lines are 1-indexed
      const imgSrc = item.image
        ? item.image.replace(/(\.[a-z]+)$/, '_80x80$1')
        : '';
      const imgHtml = imgSrc
        ? `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(item.title)}" width="80" height="80" class="cart-drawer__item-img" loading="lazy">`
        : `<div class="cart-drawer__item-img" style="background:var(--color-card,#FFFFFF)"></div>`;

      const variantTitle =
        item.variant_title && item.variant_title !== 'Default Title'
          ? `<p class="cart-drawer__item-variant">${escapeHtml(item.variant_title)}</p>`
          : '';

      return `
        <div class="cart-drawer__item" data-line="${lineNumber}">
          <a href="${escapeHtml(item.url)}" tabindex="-1" aria-hidden="true">
            ${imgHtml}
          </a>
          <div class="cart-drawer__item-details">
            ${item.vendor ? `<p class="cart-drawer__item-vendor">${escapeHtml(item.vendor)}</p>` : ''}
            <p class="cart-drawer__item-title">
              <a href="${escapeHtml(item.url)}">${escapeHtml(item.product_title)}</a>
            </p>
            ${variantTitle}
            <div class="cart-drawer__item-actions">
              <div class="cart-drawer__qty" role="group" aria-label="Quantity for ${escapeHtml(item.product_title)}">
                <button
                  class="cart-drawer__qty-btn"
                  data-qty-change="${lineNumber}"
                  data-qty-delta="-1"
                  aria-label="Decrease quantity"
                  type="button"
                >−</button>
                <input
                  class="cart-drawer__qty-input"
                  type="number"
                  value="${item.quantity}"
                  min="0"
                  data-qty-input="${lineNumber}"
                  aria-label="Quantity"
                >
                <button
                  class="cart-drawer__qty-btn"
                  data-qty-change="${lineNumber}"
                  data-qty-delta="1"
                  aria-label="Increase quantity"
                  type="button"
                >+</button>
              </div>
              <span class="cart-drawer__item-price">${formatMoney(item.line_price)}</span>
              <button
                class="cart-drawer__remove"
                data-remove-line="${lineNumber}"
                aria-label="Remove ${escapeHtml(item.product_title)} from cart"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"
                  aria-hidden="true" focusable="false">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Wire up qty and remove buttons after render
    this._bindItemControls();
  }

  /** Attach event listeners to dynamically rendered item controls. */
  _bindItemControls() {
    // Quantity stepper buttons (+/−)
    this._itemsRegion.querySelectorAll('[data-qty-change]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const line = parseInt(btn.dataset.qtyChange, 10);
        const delta = parseInt(btn.dataset.qtyDelta, 10);
        const input = this._itemsRegion.querySelector(`[data-qty-input="${line}"]`);
        if (!input) return;
        const newQty = Math.max(0, parseInt(input.value, 10) + delta);
        await this._updateLine(line, newQty);
      });
    });

    // Quantity text inputs (on blur / enter)
    this._itemsRegion.querySelectorAll('[data-qty-input]').forEach(input => {
      input.addEventListener('change', async () => {
        const line = parseInt(input.dataset.qtyInput, 10);
        const newQty = Math.max(0, parseInt(input.value, 10) || 0);
        await this._updateLine(line, newQty);
      });
    });

    // Remove buttons
    this._itemsRegion.querySelectorAll('[data-remove-line]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const line = parseInt(btn.dataset.removeLine, 10);
        await this._updateLine(line, 0);
      });
    });
  }

  /**
   * Update a line item quantity and re-render.
   * @param {number} line — 1-indexed
   * @param {number} quantity — 0 = remove
   */
  async _updateLine(line, quantity) {
    try {
      const cart = await CartAPI.change(line, quantity);
      this._render(cart);
      // Dispatch so other page elements (mini-cart badges) can update
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }));
    } catch (err) {
      console.error('[CartDrawer] Failed to update line item:', err);
    }
  }
}

customElements.define('cart-drawer', CartDrawer);


/* ═══════════════════════════════════════════════════════════════════════════
   § 4 — ProductForm Custom Element
   <product-form>
     <form> ... </form>
   </product-form>

   Intercepts the add-to-cart form submit:
     - Calls CartAPI.addItems
     - If cart_type is 'drawer': opens the cart drawer
     - Otherwise: redirects to /cart (fallback / accessibility)
═══════════════════════════════════════════════════════════════════════════ */

class ProductForm extends HTMLElement {
  connectedCallback() {
    this._form = this.querySelector('form');
    if (!this._form) return;
    this._submitBtn = this._form.querySelector('[type="submit"]');
    this._form.addEventListener('submit', this._handleSubmit.bind(this));
  }

  async _handleSubmit(e) {
    // Only intercept if the cart drawer feature is active
    const cartType = window.ShoeCenter?.cartType || 'page';
    if (cartType !== 'drawer') return; // Let native form submit proceed

    e.preventDefault();

    const idInput = this._form.querySelector('[name="id"]');
    const qtyInput = this._form.querySelector('[name="quantity"]');
    if (!idInput) return;

    const variantId = parseInt(idInput.value, 10);
    const quantity = qtyInput ? parseInt(qtyInput.value, 10) : 1;

    if (!variantId) return;

    // Loading state
    this._setLoading(true);

    try {
      const cart = await CartAPI.addItems([{ id: variantId, quantity }]);

      // Dispatch update event (drawer listens for this)
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }));
      // Open the drawer
      document.dispatchEvent(new CustomEvent('cart:open'));
    } catch (err) {
      console.error('[ProductForm] Failed to add to cart:', err);
      this._showError(err.message || 'Something went wrong. Please try again.');
    } finally {
      this._setLoading(false);
    }
  }

  _setLoading(loading) {
    if (!this._submitBtn) return;
    this._submitBtn.disabled = loading;
    this._submitBtn.setAttribute('aria-busy', loading ? 'true' : 'false');

    const originalText = this._submitBtn.dataset.originalText;
    if (loading) {
      if (!originalText) {
        this._submitBtn.dataset.originalText = this._submitBtn.textContent.trim();
      }
      this._submitBtn.textContent = 'Adding…';
    } else {
      if (originalText) {
        this._submitBtn.textContent = originalText;
      }
    }
  }

  _showError(message) {
    let errEl = this.querySelector('.product-form__error');
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.className = 'product-form__error';
      errEl.setAttribute('role', 'alert');
      errEl.style.cssText = 'color:#A83232;font-size:14px;margin-top:8px;';
      this._form.appendChild(errEl);
    }
    errEl.textContent = message;
  }
}

customElements.define('product-form', ProductForm);


/* ═══════════════════════════════════════════════════════════════════════════
   § 5 — VariantSelector Custom Element
   <variant-selector data-section="{{ section.id }}" data-url="{{ product.url }}">
     <select name="options[Color]" data-option-index="0"> ... </select>
     <select name="options[Size]" data-option-index="1"> ... </select>
   </variant-selector>

   On change, finds the matching variant, updates:
     - Hidden #ProductVariantId input
     - Add-to-cart button state (sold out / available)
     - Dispatches variant:change event with full variant object
═══════════════════════════════════════════════════════════════════════════ */

class VariantSelector extends HTMLElement {
  connectedCallback() {
    this._variantData = this._parseVariantData();
    this.querySelectorAll('select').forEach(select => {
      select.addEventListener('change', this._onOptionChange.bind(this));
    });
  }

  /** Parse the JSON variant data embedded by main-product.liquid */
  _parseVariantData() {
    const scriptEl = this.closest('[data-section-id]')?.querySelector('[data-variant-json]')
      || document.querySelector('[data-variant-json]');
    if (!scriptEl) return [];
    try {
      return JSON.parse(scriptEl.textContent);
    } catch {
      return [];
    }
  }

  _onOptionChange() {
    const selectedOptions = Array.from(this.querySelectorAll('select')).map(s => s.value);
    const matchingVariant = this._findVariant(selectedOptions);

    // Update the hidden variant ID input
    const sectionId = this.dataset.sectionId;
    const idInput = document.querySelector(
      `#ProductVariantId${sectionId ? '-' + sectionId : ''}`
    ) || document.querySelector('[name="id"]');

    if (idInput && matchingVariant) {
      idInput.value = matchingVariant.id;
    }

    // Dispatch custom event — price.liquid and other elements listen for this
    this.dispatchEvent(
      new CustomEvent('variant:change', {
        bubbles: true,
        detail: { variant: matchingVariant, selectedOptions },
      })
    );
  }

  /**
   * Find the variant whose options array matches selectedOptions.
   * @param {string[]} selectedOptions
   * @returns {object|null}
   */
  _findVariant(selectedOptions) {
    return this._variantData.find(variant =>
      variant.options.every((opt, i) => opt === selectedOptions[i])
    ) || null;
  }
}

customElements.define('variant-selector', VariantSelector);

// Listen for variant:change to update price and availability displays
document.addEventListener('variant:change', (e) => {
  const { variant } = e.detail;
  const scope =
    e.target?.closest?.('[data-section-id]') ||
    e.target?.closest?.('.shopify-section') ||
    document;

  // Update price display
  const priceEl = scope.querySelector('.js-variant-price');
  if (priceEl && variant) {
    const isOnSale = variant.compare_at_price > variant.price;
    priceEl.innerHTML = isOnSale
      ? `<span class="price__current price__current--sale">${formatMoney(variant.price)}</span>
         <s class="price__compare">${formatMoney(variant.compare_at_price)}</s>`
      : `<span class="price__current">${formatMoney(variant.price)}</span>`;
  }

  // Update add-to-cart button
  const addBtn = scope.querySelector('.js-add-to-cart');
  if (addBtn) {
    if (!variant) {
      addBtn.disabled = true;
      addBtn.textContent = 'Unavailable';
    } else if (!variant.available) {
      addBtn.disabled = true;
      addBtn.textContent = 'Sold Out';
    } else {
      addBtn.disabled = false;
      addBtn.textContent = addBtn.dataset.addText || 'Add to Cart';
    }
  }

  // Update featured image if variant has one
  if (variant?.featured_image) {
    const mainImg = scope.querySelector('.js-main-product-img');
    if (mainImg) {
      const newSrc = variant.featured_image.src.replace(/(\.[a-z]+)(\?.*)?$/, '_800x800$1');
      mainImg.src = newSrc;
      mainImg.alt = variant.featured_image.alt || '';
    }
  }
});


/* ═══════════════════════════════════════════════════════════════════════════
   § 6 — Cart Trigger (header bag icon)
   The header renders a button/link with data-cart-trigger.
   Clicking it opens the cart drawer.
═══════════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-cart-trigger]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      const cartType = window.ShoeCenter?.cartType || 'page';
      if (cartType === 'drawer') {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('cart:open'));
      }
      // If cartType is 'page', the default link to /cart proceeds
    });
  });
});


/* ═══════════════════════════════════════════════════════════════════════════
   § 7 — PredictiveSearch Custom Element
   <predictive-search>
     <form action="/search" method="get">
       <input type="text" name="q" ...>
       <div class="predictive-search__results" hidden></div>
     </form>
   </predictive-search>

   Debounced fetch from Shopify Predictive Search API.
   Shows results below the input; hides on blur / Escape.
═══════════════════════════════════════════════════════════════════════════ */

class PredictiveSearch extends HTMLElement {
  connectedCallback() {
    this._input = this.querySelector('input[name="q"]');
    this._results = this.querySelector('.predictive-search__results');
    if (!this._input || !this._results) return;

    this._abortController = null;

    // Debounce: wait 280ms after last keystroke before fetching
    this._debouncedFetch = debounce(this._fetch.bind(this), 280);

    this._input.addEventListener('input', () => {
      const q = this._input.value.trim();
      if (q.length < 2) {
        this._hide();
        return;
      }
      this._debouncedFetch(q);
    });

    // Hide on Escape
    this._input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this._hide();
    });

    // Hide on blur (with a small delay to allow result clicks)
    this._input.addEventListener('blur', () => {
      setTimeout(() => this._hide(), 200);
    });
  }

  async _fetch(query) {
    // Cancel any in-flight request
    if (this._abortController) this._abortController.abort();
    this._abortController = new AbortController();

    try {
      const predictiveSearchUrl = getThemeRoute('predictiveSearch', '/search/suggest');
      const res = await fetch(
        `${predictiveSearchUrl}.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=6`,
        { signal: this._abortController.signal }
      );
      if (!res.ok) return;
      const data = await res.json();
      this._render(data.resources?.results?.products || []);
    } catch (err) {
      if (err.name !== 'AbortError') console.error('[PredictiveSearch]', err);
    }
  }

  _render(products) {
    if (products.length === 0) {
      this._hide();
      return;
    }

    this._results.innerHTML = `
      <ul class="predictive-search__list" role="listbox" aria-label="Search suggestions">
        ${products.map(p => `
          <li class="predictive-search__item" role="option">
            <a href="${escapeHtml(p.url)}" class="predictive-search__link">
              ${p.image
                ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" width="48" height="48" class="predictive-search__img" loading="lazy">`
                : `<div class="predictive-search__img predictive-search__img--placeholder"></div>`
              }
              <span class="predictive-search__info">
                ${p.vendor ? `<span class="predictive-search__vendor">${escapeHtml(p.vendor)}</span>` : ''}
                <span class="predictive-search__title">${escapeHtml(p.title)}</span>
                ${p.price ? `<span class="predictive-search__price">${formatMoney(p.price)}</span>` : ''}
              </span>
            </a>
          </li>
        `).join('')}
        <li class="predictive-search__all">
          <a href="${getThemeRoute('search', '/search')}?q=${encodeURIComponent(this._input.value)}" class="predictive-search__see-all">
            See all results for "${escapeHtml(this._input.value)}"
          </a>
        </li>
      </ul>
    `;

    this._results.hidden = false;
    this._results.setAttribute('aria-expanded', 'true');
  }

  _hide() {
    if (this._results) {
      this._results.hidden = true;
      this._results.setAttribute('aria-expanded', 'false');
    }
  }
}

customElements.define('predictive-search', PredictiveSearch);


/* ═══════════════════════════════════════════════════════════════════════════
   § 8 — Header Scroll Shadow
   Adds .is-scrolled class to <header> when the user scrolls past the
   top sentinel element. CSS in header.liquid handles the shadow transition.
   Uses IntersectionObserver — zero scroll event overhead.
═══════════════════════════════════════════════════════════════════════════ */

(function initHeaderScrollShadow() {
  const sentinel = document.getElementById('HeaderSentinel');
  const header = document.querySelector('.site-header') || document.querySelector('header');
  if (!sentinel || !header) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      // When sentinel leaves viewport (scrolled past top), add shadow class
      header.classList.toggle('is-scrolled', !entry.isIntersecting);
    },
    { threshold: 0 }
  );

  observer.observe(sentinel);
})();


/* ═══════════════════════════════════════════════════════════════════════════
   § 9 — Product Image Gallery (main-product.liquid)
   Thumbnail strip → swap main image. Plain JS, no library.
   Activated only when .product-gallery exists on the page.
═══════════════════════════════════════════════════════════════════════════ */

(function initProductGallery() {
  const gallery = document.querySelector('.product-gallery');
  if (!gallery) return;

  const mainImg = gallery.querySelector('.product-gallery__main-img');
  const thumbnails = gallery.querySelectorAll('.product-gallery__thumb');

  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const src = thumb.dataset.imageSrc;
      const alt = thumb.dataset.imageAlt || '';
      if (!src || !mainImg) return;
      mainImg.src = src;
      mainImg.alt = alt;
      // Update active state
      thumbnails.forEach(t => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
    });

    // Keyboard activation
    thumb.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        thumb.click();
      }
    });
  });
})();


/* ═══════════════════════════════════════════════════════════════════════════
   § 10 — Mobile Navigation Toggle
   The header renders a <button data-nav-toggle> and a <nav data-mobile-nav>.
   Clicking the button toggles aria-expanded and a CSS class.
═══════════════════════════════════════════════════════════════════════════ */

(function initMobileNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-mobile-nav]');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open', !expanded);
    document.body.classList.toggle('nav-open', !expanded);
  });
})();


/* ═══════════════════════════════════════════════════════════════════════════
   § 11 — Announcement Bar Auto-dismiss (optional)
   If the announcement bar has a data-dismiss-id, show a dismiss button
   and remember the dismissed state in localStorage.
═══════════════════════════════════════════════════════════════════════════ */

(function initAnnouncementBar() {
  const bar = document.querySelector('[data-announcement-bar]');
  if (!bar) return;

  const dismissId = bar.dataset.announcementBar;
  if (dismissId && localStorage.getItem(`announcement-dismissed-${dismissId}`)) {
    bar.hidden = true;
    return;
  }

  const dismissBtn = bar.querySelector('[data-announcement-dismiss]');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      bar.hidden = true;
      if (dismissId) {
        localStorage.setItem(`announcement-dismissed-${dismissId}`, '1');
      }
    });
  }
})();


/* ═══════════════════════════════════════════════════════════════════════════
   § 12 — Quantity Input Stepper (main-product.liquid / main-cart.liquid)
   Handles +/− buttons around <input type="number"> for quantity selection.
   Wired via data attributes: data-qty-up, data-qty-down target an input
   with data-qty-target matching the same key.
═══════════════════════════════════════════════════════════════════════════ */

(function initLaunchOverlay() {
  const overlay = document.querySelector('[data-launch-overlay]');
  if (!overlay) return;

  const homeOnly = overlay.dataset.homeOnly === 'true';
  if (homeOnly && window.location.pathname !== '/') return;

  const frequencyDays = parseInt(overlay.dataset.frequencyDays || '7', 10);
  const storageKey = 'shoecenter-launch-overlay-dismissed-at';
  const dismissedAt = parseInt(localStorage.getItem(storageKey) || '0', 10);
  const lockout = Math.max(frequencyDays, 1) * 24 * 60 * 60 * 1000;
  if (dismissedAt && Date.now() - dismissedAt < lockout) return;

  const dialog = overlay.querySelector('.launch-overlay__dialog');
  const closeButtons = overlay.querySelectorAll('[data-launch-overlay-close]');
  const actionLinks = overlay.querySelectorAll('[data-launch-overlay-action]');
  let releaseFocusTrap = null;
  const previousOverflow = document.body.style.overflow;

  function rememberDismissal() {
    localStorage.setItem(storageKey, String(Date.now()));
  }

  function closeOverlay() {
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = previousOverflow;
    if (releaseFocusTrap) {
      releaseFocusTrap();
      releaseFocusTrap = null;
    }
    document.removeEventListener('keydown', onKeydown);
  }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      rememberDismissal();
      closeOverlay();
    }
  }

  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      rememberDismissal();
      closeOverlay();
    });
  });

  actionLinks.forEach(link => {
    link.addEventListener('click', rememberDismissal);
  });

  window.requestAnimationFrame(() => {
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (dialog) {
      releaseFocusTrap = trapFocus(dialog);
    }
    document.addEventListener('keydown', onKeydown);
  });
})();

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-qty-up], [data-qty-down]');
  if (!btn) return;

  const key = btn.dataset.qtyUp || btn.dataset.qtyDown;
  const input = document.querySelector(`[data-qty-target="${key}"]`);
  if (!input) return;

  const current = parseInt(input.value, 10) || 1;
  const min = parseInt(input.min, 10) || 1;
  const max = parseInt(input.max, 10) || Infinity;

  if (btn.dataset.qtyUp !== undefined) {
    input.value = Math.min(current + 1, max);
  } else {
    input.value = Math.max(current - 1, min);
  }

  // Trigger change event so any listeners (e.g. cart forms) update
  input.dispatchEvent(new Event('change', { bubbles: true }));
});

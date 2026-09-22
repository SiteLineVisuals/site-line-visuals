(function () {
  'use strict';

  var STORAGE_KEY = 'slv-package-build-v1';
  var CHECKOUT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdfyVzEH4rQ9DJoji-khWjBGFOPi9KXJO91Yjs8beuOJoo_ZjtH3p_YUXi6MG8SnaYbA/exec';
  var PAYABLE_ADDONS = {
    'alternate-decor-style': true,
    'additional-room-image': true,
    'interior-exterior-visualization': true,
    'home-intelligence-record': true,
    'home-intelligence-plus': true,
    'model-standard': true,
    'model-detailed': true
  };
  var VISUALIZATION_ID = 'interior-exterior-visualization';
  var RETIRED_ADDONS = ['home-care-warranty', 'photo-still', 'room-visualization-4', 'premium-room-visualization', 'whole-home-visualization', 'additional-room', 'exterior-visualization', 'photo-walkthrough'];
  var state = { package: null, addons: [] };

  function isVisualizationExtra(id) {
    return id === 'alternate-decor-style' || id === 'additional-room-image';
  }

  function quantity(item) {
    return isVisualizationExtra(item.id) ? Math.max(1, Math.floor(Number(item.quantity) || 1)) : 1;
  }

  function lineTotal(item) { return item.price * quantity(item); }

  function removeAddon(id) {
    state.addons = state.addons.filter(function (item) {
      return item.id !== id && !(id === VISUALIZATION_ID && isVisualizationExtra(item.id));
    });
  }

  function money(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
  }

  function readState() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === 'object') {
        state.package = saved.package || null;
        state.addons = (Array.isArray(saved.addons) ? saved.addons : []).filter(function (item) {
          return item && RETIRED_ADDONS.indexOf(item.id) === -1;
        });
        state.addons.forEach(function (item) {
          if (item.id === 'annual-home-health-expanded') {
            item.name = 'Expanded Annual Home Checkup & Maintenance'; item.price = 995;
            item.starting = false; item.quote = false; item.group = 'annual-checkup';
          }
          if (item.id === VISUALIZATION_ID) {
            item.name = 'Interior + Exterior Visualization Package'; item.price = 2995;
            item.starting = false; item.quote = false;
          }
          if (isVisualizationExtra(item.id)) {
            item.price = item.id === 'alternate-decor-style' ? 250 : 120;
            item.name = item.id === 'alternate-decor-style' ? 'Alternate Décor Style' : 'Additional Room or Image';
            item.quantity = item.id === 'alternate-decor-style' ? Math.min(2, quantity(item)) : quantity(item);
            item.starting = false; item.quote = false;
          }
        });
        if (addonIndex(VISUALIZATION_ID) < 0) {
          state.addons = state.addons.filter(function (item) { return !isVisualizationExtra(item.id); });
        }
      }
    } catch (e) {}
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function itemFromButton(button) {
    return {
      id: button.dataset.builderId,
      name: button.dataset.builderName,
      price: Number(button.dataset.builderPrice || 0),
      starting: button.dataset.builderStarting === 'true',
      quote: button.dataset.builderQuote === 'true',
      group: button.dataset.builderGroup || '',
      quantity: 1
    };
  }

  function addonIndex(id) {
    return state.addons.findIndex(function (item) { return item.id === id; });
  }

  function setPackage(button) {
    state.package = itemFromButton(button);
    saveState();
    render();
  }

  function showAddedMessage(name) {
    var existing = document.getElementById('builderAddedToast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'builderAddedToast';
    toast.className = 'builder-added-toast';
    toast.textContent = name + ' added — keep shopping or review your build when ready.';
    document.body.appendChild(toast);
    window.setTimeout(function () { toast.classList.add('is-visible'); }, 10);
    window.setTimeout(function () {
      toast.classList.remove('is-visible');
      window.setTimeout(function () { toast.remove(); }, 250);
    }, 3200);
  }

  function toggleAddon(button) {
    var item = itemFromButton(button);
    if (isVisualizationExtra(item.id) && addonIndex(VISUALIZATION_ID) < 0) return;
    var index = addonIndex(item.id);
    if (index >= 0) {
      removeAddon(item.id);
    } else {
      if (item.group) {
        state.addons = state.addons.filter(function (existing) { return existing.group !== item.group; });
      }
      state.addons.push(item);
    }
    saveState();
    render();
  }

  function renderLine(item, type) {
    var qty = quantity(item);
    var price = item.quote ? 'Quote required' : (item.starting ? 'From ' : '') + money(lineTotal(item));
    var controls = isVisualizationExtra(item.id)
      ? '<span class="builder-quantity"><button type="button" data-quantity-id="' + item.id + '" data-quantity-delta="-1" aria-label="Decrease ' + item.name + '">−</button>' +
        '<span aria-live="polite">' + qty + '</span>' +
        '<button type="button" data-quantity-id="' + item.id + '" data-quantity-delta="1" aria-label="Increase ' + item.name + '"' + (item.id === 'alternate-decor-style' && qty >= 2 ? ' disabled' : '') + '>+</button></span>'
      : '';
    return '<li><span>' + item.name + (isVisualizationExtra(item.id) ? ' (' + money(item.price) + ' each)' : '') + '</span>' + controls + '<strong>' + price + '</strong>' +
      '<button type="button" class="builder-remove" data-remove-type="' + type + '" data-remove-id="' + item.id + '" aria-label="Remove ' + item.name + '">Remove</button></li>';
  }

  function render() {
    document.querySelectorAll('[data-builder-type="package"]').forEach(function (button) {
      var selected = state.package && state.package.id === button.dataset.builderId;
      button.classList.toggle('is-selected', !!selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      button.textContent = selected ? 'SELECTED' : (button.dataset.defaultLabel || 'ADD TO BUILD');
    });

    document.querySelectorAll('[data-builder-type="addon"]').forEach(function (button) {
      var selected = addonIndex(button.dataset.builderId) >= 0;
      var needsVisualization = isVisualizationExtra(button.dataset.builderId) && addonIndex(VISUALIZATION_ID) < 0;
      button.disabled = needsVisualization;
      button.title = needsVisualization ? 'Add the visualization package first.' : '';
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      var label = button.querySelector('b');
      if (label) label.textContent = selected ? 'ADDED ✓' : (button.dataset.defaultLabel || 'ADD');
      else button.textContent = selected ? 'ADDED ✓' : (button.dataset.defaultLabel || 'ADD');
    });

    var list = document.getElementById('builderSelections');
    var empty = document.getElementById('builderEmpty');
    var totalEl = document.getElementById('builderTotal');
    var noteEl = document.getElementById('builderEstimateNote');
    var countEl = document.getElementById('builderCount');
    var paymentAmountEl = document.getElementById('builderPaymentAmount');
    var paymentTermsEl = document.getElementById('builderPaymentTerms');
    var payButton = document.getElementById('builderPayNow');
    if (!list || !empty || !totalEl) return;

    var html = '';
    var total = 0;
    var hasStarting = false;
    var hasQuote = false;
    var count = 0;

    if (state.package) {
      html += renderLine(state.package, 'package');
      if (!state.package.quote) total += state.package.price;
      hasStarting = hasStarting || state.package.starting;
      hasQuote = hasQuote || state.package.quote;
      count += 1;
    }

    state.addons.forEach(function (item) {
      html += renderLine(item, 'addon');
      if (!item.quote) total += lineTotal(item);
      hasStarting = hasStarting || item.starting;
      hasQuote = hasQuote || item.quote;
      count += 1;
    });

    list.innerHTML = html;
    empty.hidden = count > 0;
    totalEl.textContent = (hasStarting ? 'Starting estimate: ' : 'Estimated total: ') + money(total);
    noteEl.textContent = hasQuote
      ? 'One or more selections require a custom quote and are not included in the total.'
      : 'This is a planning estimate. Your written proposal will confirm final scope, taxes and price.';
    if (countEl) countEl.textContent = count;

    var addonsDue = state.addons.reduce(function (sum, item) {
      return item.quote ? sum : sum + lineTotal(item);
    }, 0);
    var isCustom = state.package && state.package.id === 'level-4';
    var paymentDue = state.package ? (isCustom ? 4200 : state.package.price) + addonsDue : 0;

    if (paymentAmountEl) {
      paymentAmountEl.textContent = state.package ? money(paymentDue) : '$0';
    }
    if (paymentTermsEl) {
      if (!state.package) {
        paymentTermsEl.textContent = 'Choose a package to see the payment amount.';
      } else if (isCustom) {
        paymentTermsEl.textContent = '$4,200 custom-project deposit (equal to Level 3)' +
          (addonsDue ? ' plus selected add-ons paid in full.' : '. Final balance is invoiced after the custom scope is approved.');
      } else {
        paymentTermsEl.textContent = 'Package and selected add-ons are paid in full.';
      }
    }
    if (payButton) {
      payButton.disabled = !state.package;
      payButton.setAttribute('aria-disabled', !state.package ? 'true' : 'false');
    }
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-builder-type]');
    if (button) {
      event.preventDefault();
      var wasSelected = button.classList.contains('is-selected');
      if (button.dataset.builderType === 'package') setPackage(button);
      else toggleAddon(button);
      if (!wasSelected) showAddedMessage(button.dataset.builderName || 'Item');
      return;
    }

    var quantityButton = event.target.closest('[data-quantity-id]');
    if (quantityButton) {
      var quantityIndex = addonIndex(quantityButton.dataset.quantityId);
      if (quantityIndex < 0) return;
      var quantityItem = state.addons[quantityIndex];
      var nextQuantity = quantity(quantityItem) + Number(quantityButton.dataset.quantityDelta);
      if (nextQuantity <= 0) removeAddon(quantityItem.id);
      else quantityItem.quantity = quantityItem.id === 'alternate-decor-style' ? Math.min(2, nextQuantity) : nextQuantity;
      saveState(); render(); return;
    }

    var remove = event.target.closest('.builder-remove');
    if (remove) {
      if (remove.dataset.removeType === 'package') state.package = null;
      else removeAddon(remove.dataset.removeId);
      saveState();
      render();
      return;
    }

    if (event.target.closest('#builderClear')) {
      state = { package: null, addons: [] };
      saveState();
      render();
      return;
    }

    if (event.target.closest('#builderContinueShopping')) {
      var upgrades = document.getElementById('upgrades');
      if (upgrades) upgrades.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (event.target.closest('#builderPayNow')) {
      var status = document.getElementById('builderPaymentStatus');
      if (!state.package) return;

      var quoteItems = state.addons.filter(function (item) {
        return item.quote || item.starting || !PAYABLE_ADDONS[item.id];
      });
      if (quoteItems.length) {
        if (status) {
          status.hidden = false;
          status.textContent = 'One or more selected add-ons needs a written quote before payment. Remove the quoted item to check out now, or contact Site Line Visuals for the final total.';
        }
        return;
      }

      var query = new URLSearchParams({
        action: 'checkout',
        package: state.package.id
      });
      if (state.addons.length) {
        var addonIds = [];
        state.addons.forEach(function (item) {
          for (var i = 0; i < quantity(item); i += 1) addonIds.push(item.id);
        });
        query.set('addons', addonIds.join(','));
      }
      window.location.assign(CHECKOUT_ENDPOINT + '?' + query.toString());
    }
  });

  readState();
  saveState();
  render();
})();

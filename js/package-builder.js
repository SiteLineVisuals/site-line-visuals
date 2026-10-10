(function () {
  'use strict';

  var STORAGE_KEY = 'slv-package-build-v2';
  var VISUALIZATION_ID = 'interior-exterior-visualization';
  var RETIRED_ADDONS = ['model-reprint', 'home-care-warranty', 'photo-still', 'room-visualization-4', 'premium-room-visualization', 'whole-home-visualization', 'additional-room', 'exterior-visualization', 'photo-walkthrough'];
  var state = { package: null, addons: [] };

  function isVisualizationExtra(id) {
    return id === 'alternate-decor-style' || id === 'additional-room-image';
  }

  function quantity(item) {
    return isVisualizationExtra(item.id) ? Math.max(1, Math.floor(Number(item.quantity) || 1)) : 1;
  }


  function removeAddon(id) {
    state.addons = state.addons.filter(function (item) {
      return item.id !== id && !(id === VISUALIZATION_ID && isVisualizationExtra(item.id));
    });
  }


  function readState() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === 'object') {
        state.package = saved.package || null;
        state.addons = Array.isArray(saved.addons) ? saved.addons : [];
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
    var controls = isVisualizationExtra(item.id)
      ? '<span class="builder-quantity"><button type="button" data-quantity-id="' + item.id + '" data-quantity-delta="-1" aria-label="Decrease ' + item.name + '">−</button>' +
        '<span aria-live="polite">' + qty + '</span>' +
        '<button type="button" data-quantity-id="' + item.id + '" data-quantity-delta="1" aria-label="Increase ' + item.name + '"' + (item.id === 'alternate-decor-style' && qty >= 2 ? ' disabled' : '') + '>+</button></span>'
      : '';
    return '<li><span>' + item.name + '</span>' + controls +
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
    var payButton = document.getElementById('builderPayNow');
    if (!list || !empty || !totalEl) return;

    var html = '';
    var count = 0;

    if (state.package) {
      html += renderLine(state.package, 'package');
      count += 1;
    }

    state.addons.forEach(function (item) {
      html += renderLine(item, 'addon');
      count += 1;
    });

    list.innerHTML = html;
    empty.hidden = count > 0;
    totalEl.textContent = count ? 'Your selections are ready for a quote' : 'Select services to request a quote';
    noteEl.textContent = 'We will confirm scope and pricing in a written proposal.';
    if (countEl) countEl.textContent = count;
    if (payButton) {
      payButton.disabled = !count;
      payButton.setAttribute('aria-disabled', !count ? 'true' : 'false');
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
      var selected = [];
      if (state.package) selected.push(state.package.name);
      state.addons.forEach(function (item) {
        selected.push(item.name + (isVisualizationExtra(item.id) ? ' x' + quantity(item) : ''));
      });
      if (!selected.length) return;
      window.location.assign('mailto:info@sitelinevisuals3d.com?subject=' + encodeURIComponent('Project quote request') +
        '&body=' + encodeURIComponent('Please quote these selections:\n' + selected.join('\n')));
    }
  });

  readState();
  saveState();
  render();
})();

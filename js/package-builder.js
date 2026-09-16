(function () {
  'use strict';

  var STORAGE_KEY = 'slv-package-build-v1';
  var state = { package: null, addons: [] };

  function money(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
  }

  function readState() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === 'object') {
        state.package = saved.package || null;
        state.addons = Array.isArray(saved.addons) ? saved.addons : [];
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
      group: button.dataset.builderGroup || ''
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

  function toggleAddon(button) {
    var item = itemFromButton(button);
    var index = addonIndex(item.id);
    if (index >= 0) {
      state.addons.splice(index, 1);
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
    var price = item.quote ? 'Quote required' : (item.starting ? 'From ' : '') + money(item.price);
    return '<li><span>' + item.name + '</span><strong>' + price + '</strong>' +
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
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      button.textContent = selected ? 'ADDED ✓' : (button.dataset.defaultLabel || 'ADD');
    });

    var list = document.getElementById('builderSelections');
    var empty = document.getElementById('builderEmpty');
    var totalEl = document.getElementById('builderTotal');
    var noteEl = document.getElementById('builderEstimateNote');
    var countEl = document.getElementById('builderCount');
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
      if (!item.quote) total += item.price;
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
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-builder-type]');
    if (button) {
      event.preventDefault();
      if (button.dataset.builderType === 'package') setPackage(button);
      else toggleAddon(button);
      document.getElementById('package-builder').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    var remove = event.target.closest('.builder-remove');
    if (remove) {
      if (remove.dataset.removeType === 'package') state.package = null;
      else state.addons = state.addons.filter(function (item) { return item.id !== remove.dataset.removeId; });
      saveState();
      render();
      return;
    }

    if (event.target.closest('#builderClear')) {
      state = { package: null, addons: [] };
      saveState();
      render();
    }
  });

  readState();
  render();
})();
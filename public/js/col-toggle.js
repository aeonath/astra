// Copyright (c) 2026 MiraNova Studios
document.addEventListener('DOMContentLoaded', function () {
  var btn = document.getElementById('col-toggle-btn');
  var menu = document.getElementById('col-toggle-menu');
  if (!btn || !menu) return;

  var STORAGE_KEY = 'astra_col_visibility';
  var colMap = { priority: 'col-priority', status: 'col-status', assignee: 'col-assignee', date: 'col-date' };

  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { return {}; }
  }

  function savePrefs(prefs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }

  function applyVisibility(col, visible) {
    var cls = colMap[col];
    if (!cls) return;
    document.querySelectorAll('.' + cls).forEach(function (el) {
      el.style.display = visible ? '' : 'none';
    });
  }

  // Initialize from saved prefs
  var prefs = loadPrefs();
  menu.querySelectorAll('input[data-col]').forEach(function (cb) {
    var col = cb.dataset.col;
    if (prefs[col] === false) {
      cb.checked = false;
      applyVisibility(col, false);
    }
  });

  // Toggle dropdown
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    menu.classList.toggle('open');
  });

  document.addEventListener('click', function (e) {
    if (!menu.contains(e.target)) {
      menu.classList.remove('open');
    }
  });

  // Handle checkbox changes
  menu.addEventListener('change', function (e) {
    var cb = e.target;
    if (!cb.dataset.col) return;
    var col = cb.dataset.col;
    applyVisibility(col, cb.checked);
    var prefs = loadPrefs();
    prefs[col] = cb.checked;
    savePrefs(prefs);
  });
});

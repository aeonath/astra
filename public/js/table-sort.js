// Copyright (c) 2026 MiraNova Studios
(function () {
  var STATUS_ORDER = { in_progress: 0, open: 1, closed: 2, resolved: 3, wontfix: 4 };
  var PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + encodeURIComponent(name) + '=([^;]*)'));
    if (!match) return null;
    try { return JSON.parse(decodeURIComponent(match[1])); } catch (e) { return null; }
  }

  function setCookie(name, value) {
    document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(JSON.stringify(value)) + '; path=/; max-age=' + (365 * 24 * 3600);
  }

  function compareValues(a, b, col, dir) {
    var valA, valB;
    if (col === 'status') {
      valA = STATUS_ORDER[a] !== undefined ? STATUS_ORDER[a] : 99;
      valB = STATUS_ORDER[b] !== undefined ? STATUS_ORDER[b] : 99;
    } else if (col === 'priority') {
      valA = PRIORITY_ORDER[a] !== undefined ? PRIORITY_ORDER[a] : 99;
      valB = PRIORITY_ORDER[b] !== undefined ? PRIORITY_ORDER[b] : 99;
    } else if (col === 'id') {
      valA = parseInt(a) || 0;
      valB = parseInt(b) || 0;
    } else {
      valA = a;
      valB = b;
    }
    var result = typeof valA === 'number' ? valA - valB : (valA < valB ? -1 : valA > valB ? 1 : 0);
    return dir === 'desc' ? -result : result;
  }

  function sortTable(table, col, dir) {
    var tbody = table.querySelector('tbody');
    if (!tbody) return;
    var rows = Array.from(tbody.querySelectorAll('tr'));

    rows.sort(function (a, b) {
      var cellA = a.querySelector('td[data-col="' + col + '"]');
      var cellB = b.querySelector('td[data-col="' + col + '"]');
      if (!cellA || !cellB) return 0;
      return compareValues(cellA.dataset.sort || '', cellB.dataset.sort || '', col, dir);
    });

    rows.forEach(function (row) { tbody.appendChild(row); });

    table.querySelectorAll('th[data-sort]').forEach(function (th) {
      th.classList.remove('sort-asc', 'sort-desc');
    });
    var active = table.querySelector('th[data-sort="' + col + '"]');
    if (active) active.classList.add(dir === 'asc' ? 'sort-asc' : 'sort-desc');
  }

  function initTable(tableId, cookieKey) {
    var table = document.getElementById(tableId);
    if (!table) return;

    var saved = getCookie(cookieKey);
    if (saved && saved.col && saved.dir) {
      sortTable(table, saved.col, saved.dir);
    }

    table.querySelectorAll('th[data-sort]').forEach(function (th) {
      th.addEventListener('click', function () {
        var col = this.dataset.sort;
        var current = getCookie(cookieKey);
        var dir = (current && current.col === col && current.dir === 'asc') ? 'desc' : 'asc';
        sortTable(table, col, dir);
        setCookie(cookieKey, { col: col, dir: dir });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTable('bugs-table', 'astra_sort_bug');
    initTable('features-table', 'astra_sort_feature');
    initTable('todos-table', 'astra_sort_todo');
    initTable('manage-projects-table', 'astra_sort_manage_projects');
  });
})();

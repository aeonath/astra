// Copyright (c) 2026 MiraNova Studios
(function () {
  var STORAGE_KEY = 'astra_open_tabs';

  function getTabs() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function saveTabs(tabs) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs)); }
    catch (e) {}
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderTabs() {
    var container = document.getElementById('project-tabs');
    if (!container) return;
    var tabs = getTabs();
    var currentPath = window.location.pathname;

    container.innerHTML = tabs.map(function (tab) {
      var isActive = currentPath.startsWith('/projects/' + tab.slug) ||
                     (window.__currentProjectSlug === tab.slug);
      return '<div class="project-tab' + (isActive ? ' project-tab-active' : '') + '">' +
        '<a href="/projects/' + tab.slug + '" class="project-tab-link" title="' + escapeHtml(tab.name) + '">' + escapeHtml(tab.name) + '</a>' +
        '<button class="project-tab-close" data-slug="' + escapeHtml(tab.slug) + '" title="Close">&times;</button>' +
        '</div>';
    }).join('');

    container.querySelectorAll('.project-tab-close').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var slug = this.dataset.slug;
        var tabs = getTabs().filter(function (t) { return t.slug !== slug; });
        saveTabs(tabs);
        renderTabs();
        if (window.location.pathname.startsWith('/projects/' + slug)) {
          window.location.href = '/projects';
        }
      });
    });
  }

  window.__openProjectTab = function (slug, name) {
    var tabs = getTabs();
    var existing = tabs.find(function (t) { return t.slug === slug; });
    if (!existing) {
      tabs.push({ slug: slug, name: name });
      saveTabs(tabs);
    } else if (existing.name !== name) {
      existing.name = name;
      saveTabs(tabs);
    }
    window.__currentProjectSlug = slug;
    renderTabs();
  };

  document.addEventListener('DOMContentLoaded', function () {
    renderTabs();
  });
})();

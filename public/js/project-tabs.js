// Copyright (c) 2026 MiraNova Studios
(function () {
  var STORAGE_KEY = 'astra_open_tabs';
  var USER_KEY = 'astra_user_id';

  function clearTabsIfUserChanged() {
    var meta = document.querySelector('meta[name="astra-user-id"]');
    var currentUserId = meta ? meta.getAttribute('content') : null;
    var storedUserId = localStorage.getItem(USER_KEY);
    if (currentUserId !== storedUserId) {
      localStorage.removeItem(STORAGE_KEY);
      if (currentUserId) {
        localStorage.setItem(USER_KEY, currentUserId);
      } else {
        localStorage.removeItem(USER_KEY);
      }
    }
  }

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

  document.addEventListener('DOMContentLoaded', function () {
    clearTabsIfUserChanged();
    var el = document.getElementById('current-project');
    if (el && el.dataset.slug) {
      var tabs = getTabs();
      var existing = tabs.find(function (t) { return t.slug === el.dataset.slug; });
      if (!existing) {
        tabs.push({ slug: el.dataset.slug, name: el.dataset.name });
        saveTabs(tabs);
      } else if (existing.name !== el.dataset.name) {
        existing.name = el.dataset.name;
        saveTabs(tabs);
      }
      window.__currentProjectSlug = el.dataset.slug;
    }
    renderTabs();
  });
})();

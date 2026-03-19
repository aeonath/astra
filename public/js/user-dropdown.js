// Copyright (c) 2026 MiraNova Studios
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.user-dropdown-toggle');
  var dropdown = document.querySelector('.user-dropdown');
  if (!toggle || !dropdown) return;

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', function () {
    dropdown.classList.remove('open');
  });

  // Mobile menu toggle
  var menuToggle = document.getElementById('mobile-menu-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      mobileNav.classList.toggle('open');
    });

    document.addEventListener('click', function (e) {
      if (!mobileNav.contains(e.target) && e.target !== menuToggle) {
        mobileNav.classList.remove('open');
      }
    });

    // Sync project tabs into mobile drawer
    var desktopTabs = document.getElementById('project-tabs');
    var mobileTabs = document.getElementById('mobile-project-tabs');
    if (desktopTabs && mobileTabs) {
      var sync = function () {
        mobileTabs.innerHTML = '';
        desktopTabs.querySelectorAll('.project-tab').forEach(function (tab) {
          var link = tab.querySelector('.project-tab-link');
          var closeBtn = tab.querySelector('.project-tab-close');
          if (link) {
            var wrapper = document.createElement('div');
            wrapper.className = 'project-tab';
            if (tab.classList.contains('project-tab-active')) wrapper.classList.add('project-tab-active');
            var a = document.createElement('a');
            a.href = link.href;
            a.className = 'project-tab-link';
            a.textContent = link.textContent;
            wrapper.appendChild(a);
            if (closeBtn) {
              var close = document.createElement('button');
              close.type = 'button';
              close.className = 'project-tab-close';
              close.textContent = '\u00d7';
              close.addEventListener('click', function (e) {
                e.stopPropagation();
                closeBtn.click();
              });
              wrapper.appendChild(close);
            }
            mobileTabs.appendChild(wrapper);
          }
        });
      };
      sync();
      var observer = new MutationObserver(sync);
      observer.observe(desktopTabs, { childList: true, subtree: true });
    }
  }
});

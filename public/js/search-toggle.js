// Copyright (c) 2026 MiraNova Studios
(function () {
  var panel  = document.getElementById('advanced-panel');
  var toggle = document.getElementById('advanced-toggle');
  var open   = false;

  function show() {
    if (!panel) return;
    panel.style.display = '';
    if (toggle) toggle.textContent = 'Advanced \u25b4';
    open = true;
  }
  function hide() {
    if (!panel) return;
    panel.style.display = 'none';
    if (toggle) toggle.textContent = 'Advanced \u25be';
    open = false;
  }

  if (toggle) {
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      open ? hide() : show();
    });
  }
})();

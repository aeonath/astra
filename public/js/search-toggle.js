// Copyright (c) 2026 MiraNova Studios
(function () {
  var panel  = document.getElementById('advanced-panel');
  var toggle = document.getElementById('advanced-toggle');
  var advInput = document.getElementById('adv-input');
  var open   = advInput && advInput.value === '1';

  function show() {
    if (!panel) return;
    panel.style.display = '';
    if (toggle) toggle.textContent = 'Advanced \u25b4';
    if (advInput) advInput.value = '1';
    open = true;
  }
  function hide() {
    if (!panel) return;
    panel.style.display = 'none';
    if (toggle) toggle.textContent = 'Advanced \u25be';
    if (advInput) advInput.value = '0';
    open = false;
  }

  if (open) show();

  if (toggle) {
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      open ? hide() : show();
    });
  }
})();

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
});

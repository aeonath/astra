// Copyright (c) 2026 MiraNova Studios
document.addEventListener('DOMContentLoaded', function () {
  var rows = document.querySelectorAll('.clickable-row');
  rows.forEach(function (row) {
    row.addEventListener('click', function () {
      var href = row.getAttribute('data-href');
      if (href) window.location.href = href;
    });
  });
});

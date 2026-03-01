// Copyright (c) 2026 MiraNova Studios
document.addEventListener('DOMContentLoaded', function () {
  var rows = document.querySelectorAll('.submission-row');
  rows.forEach(function (row) {
    row.addEventListener('click', function (e) {
      if (e.target.closest('.no-row-click')) return;
      var detailId = row.getAttribute('data-detail');
      var detailRow = document.getElementById(detailId);
      if (detailRow) {
        detailRow.style.display = detailRow.style.display === 'none' ? '' : 'none';
      }
    });
  });
});

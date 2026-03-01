// Copyright (c) 2026 MiraNova Studios
document.addEventListener('DOMContentLoaded', function () {
  var categorySelect = document.getElementById('category');
  var projectSelect = document.getElementById('project_id');
  var allOptions = Array.from(projectSelect.querySelectorAll('option[data-category]'));

  categorySelect.addEventListener('change', function () {
    var catId = categorySelect.value;

    // Remove all project options except the placeholder
    allOptions.forEach(function (opt) {
      opt.remove();
    });

    // Filter and re-add matching options
    var filtered = catId
      ? allOptions.filter(function (opt) { return opt.dataset.category === catId; })
      : allOptions;

    filtered.forEach(function (opt) {
      projectSelect.appendChild(opt);
    });

    // Reset selection
    projectSelect.value = '';
  });
});

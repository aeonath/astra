// Copyright (c) 2026 MiraNova Studios
document.addEventListener('DOMContentLoaded', function () {
  var categorySelect = document.getElementById('category');
  var projectSelect = document.getElementById('project_id');

  categorySelect.addEventListener('change', function () {
    var catId = categorySelect.value;

    // Clear existing project options
    projectSelect.innerHTML = '';

    if (!catId) {
      projectSelect.disabled = true;
      projectSelect.appendChild(new Option('Select a category first', ''));
      return;
    }

    projectSelect.disabled = true;
    projectSelect.appendChild(new Option('Loading...', ''));

    fetch('/projects/submit/projects?category_id=' + encodeURIComponent(catId))
      .then(function (res) { return res.json(); })
      .then(function (projects) {
        projectSelect.innerHTML = '';
        projectSelect.appendChild(new Option('Select a project', ''));
        projects.forEach(function (p) {
          projectSelect.appendChild(new Option(p.name, p.id));
        });
        projectSelect.disabled = false;
      })
      .catch(function () {
        projectSelect.innerHTML = '';
        projectSelect.appendChild(new Option('Failed to load projects', ''));
      });
  });
});

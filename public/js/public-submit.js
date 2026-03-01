// Copyright (c) 2026 MiraNova Studios
document.addEventListener('DOMContentLoaded', function () {
  var categorySelect = document.getElementById('category');
  var projectSelect = document.getElementById('project_id');
  var preselectCategory = document.getElementById('preselect-category');
  var preselectProject = document.getElementById('preselect-project');

  function loadProjects(catId, selectProjectId) {
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
          var opt = new Option(p.name, p.id);
          if (selectProjectId && String(p.id) === String(selectProjectId)) {
            opt.selected = true;
          }
          projectSelect.appendChild(opt);
        });
        projectSelect.disabled = false;
      })
      .catch(function () {
        projectSelect.innerHTML = '';
        projectSelect.appendChild(new Option('Failed to load projects', ''));
      });
  }

  categorySelect.addEventListener('change', function () {
    loadProjects(categorySelect.value);
  });

  // Auto-load projects if category is pre-selected
  if (preselectCategory && preselectCategory.value) {
    loadProjects(preselectCategory.value, preselectProject ? preselectProject.value : '');
  }
});

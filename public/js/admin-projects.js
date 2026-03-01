// Copyright (c) 2026 MiraNova Studios
document.addEventListener('DOMContentLoaded', function () {
  // Stop clicks on action buttons from triggering row edit
  var actionCells = document.querySelectorAll('.no-row-click');
  actionCells.forEach(function (cell) {
    cell.addEventListener('click', function (e) { e.stopPropagation(); });
  });

  var rows = document.querySelectorAll('tr[data-project-id]');
  rows.forEach(function (row) {
    row.addEventListener('click', function () {
      var id = row.dataset.projectId;
      var name = row.dataset.name;
      var description = row.dataset.description;
      var categoryId = row.dataset.categoryId;
      var defaultAssigneeId = row.dataset.defaultAssigneeId;
      var isPublic = row.dataset.public;

      document.getElementById('form-title').textContent = 'Edit Project';
      document.getElementById('form-submit').textContent = 'Save Changes';
      document.getElementById('cancel-edit').style.display = '';
      document.getElementById('edit-id').value = id;
      document.getElementById('name').value = name;
      document.getElementById('name').readOnly = true;
      document.getElementById('description').value = description;
      document.getElementById('category_id').value = categoryId;
      document.getElementById('default_assignee_id').value = defaultAssigneeId;
      document.getElementById('public').checked = isPublic === '1';
      document.getElementById('project-form-card').scrollIntoView({ behavior: 'smooth' });
    });
  });

  var cancelBtn = document.getElementById('cancel-edit');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      document.getElementById('form-title').textContent = 'Add Project';
      document.getElementById('form-submit').textContent = 'Create Project';
      cancelBtn.style.display = 'none';
      document.getElementById('edit-id').value = '';
      document.getElementById('name').value = '';
      document.getElementById('name').readOnly = false;
      document.getElementById('description').value = '';
      document.getElementById('category_id').value = '';
      document.getElementById('default_assignee_id').value = '';
      document.getElementById('public').checked = true;
    });
  }
});

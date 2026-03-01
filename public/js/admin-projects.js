// Copyright (c) 2026 MiraNova Studios
document.addEventListener('DOMContentLoaded', function () {
  var formCard = document.getElementById('project-form-card');
  var table = document.querySelector('.table');
  var addBtn = document.getElementById('add-project-btn');

  function showForm() {
    formCard.style.display = '';
    formCard.scrollIntoView({ behavior: 'smooth' });
  }

  function hideForm() {
    formCard.style.display = 'none';
    resetForm();
  }

  function resetForm() {
    document.getElementById('form-title').textContent = 'Add Project';
    document.getElementById('form-submit').textContent = 'Create Project';
    document.getElementById('edit-id').value = '';
    document.getElementById('name').value = '';
    document.getElementById('name').readOnly = false;
    document.getElementById('description').value = '';
    document.getElementById('category_id').value = '';
    document.getElementById('default_assignee_id').value = '';
    document.getElementById('homepage_url').value = '';
    document.getElementById('github_url').value = '';
    document.getElementById('github_private').checked = false;
    document.getElementById('public').checked = true;
  }

  // Add Project button — show form above table
  addBtn.addEventListener('click', function () {
    resetForm();
    formCard.style.marginTop = '';
    table.insertAdjacentElement('beforebegin', formCard);
    showForm();
    addBtn.style.display = 'none';
  });

  // Stop clicks on action buttons from triggering row edit
  var actionCells = document.querySelectorAll('.no-row-click');
  actionCells.forEach(function (cell) {
    cell.addEventListener('click', function (e) { e.stopPropagation(); });
  });

  // Click row to edit — show form above table
  var rows = document.querySelectorAll('tr[data-project-id]');
  rows.forEach(function (row) {
    row.addEventListener('click', function () {
      var id = row.dataset.projectId;
      var name = row.dataset.name;
      var description = row.dataset.description;
      var categoryId = row.dataset.categoryId;
      var defaultAssigneeId = row.dataset.defaultAssigneeId;
      var isPublic = row.dataset.public;
      var homepageUrl = row.dataset.homepageUrl;
      var githubUrl = row.dataset.githubUrl;
      var githubPrivate = row.dataset.githubPrivate;

      document.getElementById('form-title').textContent = 'Edit Project';
      document.getElementById('form-submit').textContent = 'Save Changes';
      document.getElementById('edit-id').value = id;
      document.getElementById('name').value = name;
      document.getElementById('name').readOnly = true;
      document.getElementById('description').value = description;
      document.getElementById('category_id').value = categoryId;
      document.getElementById('default_assignee_id').value = defaultAssigneeId;
      document.getElementById('homepage_url').value = homepageUrl;
      document.getElementById('github_url').value = githubUrl;
      document.getElementById('github_private').checked = githubPrivate === '1';
      document.getElementById('public').checked = isPublic === '1';

      formCard.style.marginTop = '';
      table.insertAdjacentElement('beforebegin', formCard);
      showForm();
      addBtn.style.display = '';
    });
  });

  // Cancel button — hide form, show Add button
  var cancelBtn = document.getElementById('cancel-edit');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      hideForm();
      addBtn.style.display = '';
    });
  }
});

// Copyright (c) 2026 MiraNova Studios
document.addEventListener('DOMContentLoaded', function () {
  var scriptTag = document.querySelector('script[data-base-path]');
  var projectBasePath = scriptTag ? scriptTag.getAttribute('data-base-path') : '/admin/projects';
  var formCard = document.getElementById('project-form-card');
  var projectForm = document.getElementById('project-form');
  var table = document.querySelector('.table');
  var addBtn = document.getElementById('add-project-btn');
  var internallyVisibleCb = document.getElementById('internally_visible');
  var publicGroup = document.getElementById('public-group');
  var publicCb = document.getElementById('public');
  var archiveBtn = document.getElementById('archive-btn');
  var deleteBtn = document.getElementById('delete-project-btn');
  var deleteArchivedBtn = document.getElementById('delete-archived-btn');
  var activeActions = document.getElementById('active-actions');
  var archivedActions = document.getElementById('archived-actions');
  var archivedNotice = document.getElementById('archived-notice');
  var reactivateForm = document.getElementById('reactivate-form');
  var deleteModal = document.getElementById('delete-project-modal');
  var archiveModal = document.getElementById('archive-project-modal');

  var editProjectId = null;
  var editProjectName = '';

  // Editable fields that get disabled when archived
  var editableFields = ['description', 'category_id', 'default_assignee_id', 'homepage_url', 'github_url'];

  function updatePublicVisibility() {
    if (internallyVisibleCb.checked) {
      publicGroup.style.display = '';
    } else {
      publicGroup.style.display = 'none';
      publicCb.checked = false;
    }
  }

  internallyVisibleCb.addEventListener('change', function () {
    if (internallyVisibleCb.checked) {
      publicCb.checked = true;
    }
    updatePublicVisibility();
  });

  function setFieldsDisabled(disabled) {
    editableFields.forEach(function (id) {
      document.getElementById(id).disabled = disabled;
    });
    internallyVisibleCb.disabled = disabled;
    publicCb.disabled = disabled;
  }

  function showForm() {
    formCard.style.display = '';
    formCard.scrollIntoView({ behavior: 'smooth' });
  }

  function hideForm() {
    formCard.style.display = 'none';
    resetForm();
  }

  function resetForm() {
    editProjectId = null;
    editProjectName = '';
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
    internallyVisibleCb.checked = true;
    publicCb.checked = true;
    updatePublicVisibility();
    setFieldsDisabled(false);
    projectForm.style.display = '';
    activeActions.style.display = '';
    archivedActions.style.display = 'none';
    archivedNotice.style.display = 'none';
    archiveBtn.style.display = 'none';
    deleteBtn.style.display = 'none';
  }

  // Add Project button
  addBtn.addEventListener('click', function () {
    resetForm();
    formCard.style.marginTop = '';
    table.insertAdjacentElement('beforebegin', formCard);
    showForm();
    addBtn.style.display = 'none';
  });

  // Click row to edit
  var rows = document.querySelectorAll('tr[data-project-id]');
  rows.forEach(function (row) {
    row.addEventListener('click', function () {
      editProjectId = row.dataset.projectId;
      editProjectName = row.dataset.name;
      var description = row.dataset.description;
      var categoryId = row.dataset.categoryId;
      var defaultAssigneeId = row.dataset.defaultAssigneeId;
      var isInternallyVisible = row.dataset.internallyVisible;
      var isPublic = row.dataset.public;
      var homepageUrl = row.dataset.homepageUrl;
      var githubUrl = row.dataset.githubUrl;
      var isActive = row.dataset.active === '1';

      if (isActive) {
        // Active project — show edit form
        document.getElementById('form-title').textContent = 'Edit Project';
        document.getElementById('form-submit').textContent = 'Save Changes';
        document.getElementById('edit-id').value = editProjectId;
        document.getElementById('name').value = editProjectName;
        document.getElementById('name').readOnly = true;
        document.getElementById('description').value = description;
        document.getElementById('category_id').value = categoryId;
        document.getElementById('default_assignee_id').value = defaultAssigneeId;
        document.getElementById('homepage_url').value = homepageUrl;
        document.getElementById('github_url').value = githubUrl.replace('https://github.com/', '');
        internallyVisibleCb.checked = isInternallyVisible === '1';
        publicCb.checked = isPublic === '1';
        updatePublicVisibility();
        setFieldsDisabled(false);
        projectForm.style.display = '';
        activeActions.style.display = '';
        archivedActions.style.display = 'none';
        archivedNotice.style.display = 'none';
        archiveBtn.style.display = '';
        deleteBtn.style.display = '';
      } else {
        // Archived project — show read-only with reactivate
        document.getElementById('form-title').textContent = editProjectName;
        document.getElementById('name').value = editProjectName;
        document.getElementById('description').value = description;
        document.getElementById('category_id').value = categoryId;
        document.getElementById('default_assignee_id').value = defaultAssigneeId;
        document.getElementById('homepage_url').value = homepageUrl;
        document.getElementById('github_url').value = githubUrl.replace('https://github.com/', '');
        internallyVisibleCb.checked = isInternallyVisible === '1';
        publicCb.checked = isPublic === '1';
        updatePublicVisibility();
        setFieldsDisabled(true);
        document.getElementById('name').readOnly = true;
        projectForm.style.display = 'none';
        activeActions.style.display = 'none';
        archivedActions.style.display = '';
        archivedNotice.style.display = '';
        reactivateForm.action = projectBasePath + '/' + editProjectId + '/toggle';
      }

      formCard.style.marginTop = '';
      table.insertAdjacentElement('beforebegin', formCard);
      showForm();
      addBtn.style.display = '';
    });
  });

  // Archive button — show confirmation modal
  archiveBtn.addEventListener('click', function () {
    if (!editProjectId) return;
    document.getElementById('archive-project-name').textContent = editProjectName;
    document.getElementById('archive-project-form').action = projectBasePath + '/' + editProjectId + '/toggle';
    archiveModal.style.display = 'flex';
  });

  document.getElementById('close-archive-modal').addEventListener('click', function () {
    archiveModal.style.display = 'none';
  });
  archiveModal.addEventListener('click', function (e) {
    if (e.target === archiveModal) archiveModal.style.display = 'none';
  });

  // Delete button — show confirmation modal
  function showDeleteModal() {
    if (!editProjectId) return;
    document.getElementById('delete-project-name').textContent = editProjectName;
    document.getElementById('delete-project-form').action = projectBasePath + '/' + editProjectId + '/delete';
    deleteModal.style.display = 'flex';
  }

  deleteBtn.addEventListener('click', showDeleteModal);
  deleteArchivedBtn.addEventListener('click', showDeleteModal);

  document.getElementById('close-delete-modal').addEventListener('click', function () {
    deleteModal.style.display = 'none';
  });
  deleteModal.addEventListener('click', function (e) {
    if (e.target === deleteModal) deleteModal.style.display = 'none';
  });

  // Cancel buttons
  var cancelBtn = document.getElementById('cancel-edit');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      hideForm();
      addBtn.style.display = '';
    });
  }

  var cancelArchivedBtn = document.getElementById('cancel-archived');
  if (cancelArchivedBtn) {
    cancelArchivedBtn.addEventListener('click', function () {
      hideForm();
      addBtn.style.display = '';
    });
  }
});

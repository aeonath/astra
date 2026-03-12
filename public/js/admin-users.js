// Copyright (c) 2026 MiraNova Studios
document.addEventListener('DOMContentLoaded', function () {
  // Clear form fields to prevent browser autofill
  document.getElementById('username').value = '';
  document.getElementById('display_name').value = '';
  document.getElementById('email').value = '';
  document.getElementById('password').value = '';
  document.getElementById('role').value = 'user';
  document.getElementById('can_manage_submissions').checked = false;
  document.getElementById('can_manage_projects').checked = false;

  var removeBtn = document.getElementById('remove-user-btn');
  var cancelBtn = document.getElementById('cancel-edit');
  var modal = document.getElementById('remove-user-modal');
  var editUserId = null;
  var editDisplayName = '';

  var rows = document.querySelectorAll('tr[data-user-id]');
  rows.forEach(function (row) {
    row.addEventListener('click', function () {
      editUserId = row.dataset.userId;
      editDisplayName = row.dataset.displayName;
      var username = row.dataset.username;
      var email = row.dataset.email;
      var role = row.dataset.role;
      var canManageSubs = row.dataset.canManageSubmissions === '1';
      var canManageProjs = row.dataset.canManageProjects === '1';

      document.getElementById('form-title').textContent = 'Edit User';
      document.getElementById('form-submit').textContent = 'Save Changes';
      cancelBtn.style.display = '';
      document.getElementById('edit-id').value = editUserId;
      document.getElementById('username').value = username;
      document.getElementById('username').readOnly = true;
      document.getElementById('display_name').value = editDisplayName;
      document.getElementById('email').value = email;
      document.getElementById('role').value = role;
      document.getElementById('can_manage_submissions').checked = canManageSubs;
      document.getElementById('can_manage_projects').checked = canManageProjs;
      document.getElementById('password').removeAttribute('required');
      document.getElementById('password').placeholder = 'Leave blank to keep current';

      // Show remove button only for non-admin users
      if (role !== 'admin') {
        removeBtn.style.display = '';
      } else {
        removeBtn.style.display = 'none';
      }

      document.getElementById('user-form-card').scrollIntoView({ behavior: 'smooth' });
    });
  });

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      editUserId = null;
      editDisplayName = '';
      document.getElementById('form-title').textContent = 'Add User';
      document.getElementById('form-submit').textContent = 'Create User';
      cancelBtn.style.display = 'none';
      removeBtn.style.display = 'none';
      document.getElementById('edit-id').value = '';
      document.getElementById('username').value = '';
      document.getElementById('username').readOnly = false;
      document.getElementById('display_name').value = '';
      document.getElementById('email').value = '';
      document.getElementById('role').value = 'user';
      document.getElementById('can_manage_submissions').checked = false;
      document.getElementById('can_manage_projects').checked = false;
      document.getElementById('password').value = '';
      document.getElementById('password').setAttribute('required', '');
      document.getElementById('password').placeholder = '';
    });
  }

  // Remove user — show confirmation modal
  if (removeBtn) {
    removeBtn.addEventListener('click', function () {
      if (!editUserId) return;
      document.getElementById('remove-user-name').textContent = editDisplayName;
      document.getElementById('remove-user-form').action = '/admin/users/' + editUserId + '/delete';
      modal.style.display = 'flex';
    });
  }

  document.getElementById('close-remove-modal').addEventListener('click', function () {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.style.display = 'none';
  });
});

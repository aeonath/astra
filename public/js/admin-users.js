// Copyright (c) 2026 MiraNova Studios
document.addEventListener('DOMContentLoaded', function () {
  // Clear form fields to prevent browser autofill
  document.getElementById('username').value = '';
  document.getElementById('display_name').value = '';
  document.getElementById('email').value = '';
  document.getElementById('password').value = '';
  document.getElementById('role').value = 'user';

  // Stop clicks on action buttons/inputs from triggering row edit
  var actionCells = document.querySelectorAll('.no-row-click');
  actionCells.forEach(function (cell) {
    cell.addEventListener('click', function (e) { e.stopPropagation(); });
  });

  var rows = document.querySelectorAll('tr[data-user-id]');
  rows.forEach(function (row) {
    row.addEventListener('click', function () {
      var id = row.dataset.userId;
      var username = row.dataset.username;
      var displayName = row.dataset.displayName;
      var email = row.dataset.email;
      var role = row.dataset.role;

      document.getElementById('form-title').textContent = 'Edit User';
      document.getElementById('form-submit').textContent = 'Save Changes';
      document.getElementById('cancel-edit').style.display = '';
      document.getElementById('edit-id').value = id;
      document.getElementById('username').value = username;
      document.getElementById('username').readOnly = true;
      document.getElementById('display_name').value = displayName;
      document.getElementById('email').value = email;
      document.getElementById('role').value = role;
      document.getElementById('password').removeAttribute('required');
      document.getElementById('password').placeholder = 'Leave blank to keep current';
      document.getElementById('user-form-card').scrollIntoView({ behavior: 'smooth' });
    });
  });

  var cancelBtn = document.getElementById('cancel-edit');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      document.getElementById('form-title').textContent = 'Add User';
      document.getElementById('form-submit').textContent = 'Create User';
      cancelBtn.style.display = 'none';
      document.getElementById('edit-id').value = '';
      document.getElementById('username').value = '';
      document.getElementById('username').readOnly = false;
      document.getElementById('display_name').value = '';
      document.getElementById('email').value = '';
      document.getElementById('role').value = 'user';
      document.getElementById('password').value = '';
      document.getElementById('password').setAttribute('required', '');
      document.getElementById('password').placeholder = '';
    });
  }
});

// Copyright (c) 2026 MiraNova Studios
document.addEventListener('DOMContentLoaded', function () {
  var editBtn = document.getElementById('edit-btn');
  var cancelBtn = document.getElementById('cancel-edit-btn');
  var displayEl = document.getElementById('bug-display');
  var formEl = document.getElementById('bug-edit-form');

  editBtn.addEventListener('click', function () {
    displayEl.style.display = 'none';
    formEl.style.display = '';
    editBtn.style.display = 'none';
  });

  cancelBtn.addEventListener('click', function () {
    displayEl.style.display = '';
    formEl.style.display = 'none';
    editBtn.style.display = '';
  });
});

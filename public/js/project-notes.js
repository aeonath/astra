// Copyright (c) 2026 MiraNova Studios
document.addEventListener('DOMContentLoaded', function () {
  var editBtn = document.getElementById('notes-edit-btn');
  var cancelBtn = document.getElementById('notes-cancel-btn');
  var display = document.getElementById('notes-display');
  var form = document.getElementById('notes-form');

  if (!editBtn) return;

  editBtn.addEventListener('click', function () {
    display.style.display = 'none';
    editBtn.style.display = 'none';
    form.style.display = '';
    document.getElementById('notes-textarea').focus();
  });

  cancelBtn.addEventListener('click', function () {
    form.style.display = 'none';
    display.style.display = '';
    editBtn.style.display = '';
  });
});

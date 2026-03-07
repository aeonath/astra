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

  // Comment inline edit toggle
  document.querySelectorAll('.comment-edit-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = this.dataset.commentId;
      document.getElementById('comment-display-' + id).style.display = 'none';
      document.getElementById('comment-edit-form-' + id).style.display = '';
      this.style.display = 'none';
    });
  });

  document.querySelectorAll('.comment-cancel-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = this.dataset.commentId;
      document.getElementById('comment-display-' + id).style.display = '';
      document.getElementById('comment-edit-form-' + id).style.display = 'none';
      document.querySelector('.comment-edit-btn[data-comment-id="' + id + '"]').style.display = '';
    });
  });
});

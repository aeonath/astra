// Copyright (c) 2026 MiraNova Studios
document.addEventListener('DOMContentLoaded', function () {
  function makeToggle(displayId, formId, editBtnId, cancelBtnId) {
    var display = document.getElementById(displayId);
    var form = document.getElementById(formId);
    var editBtn = document.getElementById(editBtnId);
    var cancelBtn = document.getElementById(cancelBtnId);
    if (!display || !form || !editBtn || !cancelBtn) return;
    editBtn.addEventListener('click', function () {
      display.style.display = 'none';
      form.style.display = '';
    });
    cancelBtn.addEventListener('click', function () {
      display.style.display = '';
      form.style.display = 'none';
    });
  }

  makeToggle('description-display', 'description-edit-form', 'description-edit-btn', 'description-cancel-btn');
  makeToggle('notes-display', 'notes-edit-form', 'notes-edit-btn', 'notes-cancel-btn');

  // Closed-state: dim headings/text, hide edit buttons, disable priority+assignee
  var statusSelect = document.getElementById('status');
  var bugLayout = document.querySelector('.bug-layout');
  var prioritySelect = document.getElementById('priority');
  var assigneeSelect = document.getElementById('assignee_id');

  if (statusSelect && bugLayout) {
    statusSelect.addEventListener('change', function () {
      var isClosed = this.value === 'closed';
      bugLayout.classList.toggle('bug-is-closed', isClosed);
      if (prioritySelect) prioritySelect.disabled = isClosed;
      if (assigneeSelect) assigneeSelect.disabled = isClosed;
    });
  }

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

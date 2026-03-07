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

  // Status/priority badges and closed-state lockdown
  var statusSelect = document.getElementById('status');
  var prioritySelect = document.getElementById('priority');
  var assigneeSelect = document.getElementById('assignee_id');
  var bugLayout = document.querySelector('.bug-layout');
  var statusBadge = document.getElementById('status-badge');
  var priorityBadge = document.getElementById('priority-badge');

  var statusClasses = ['badge-status-open', 'badge-status-in_progress', 'badge-status-closed', 'badge-status-resolved', 'badge-status-wontfix'];
  var priorityClasses = ['badge-low', 'badge-medium', 'badge-high', 'badge-critical'];

  if (statusSelect && bugLayout) {
    statusSelect.addEventListener('change', function () {
      var val = this.value;
      var isClosed = val === 'closed';
      bugLayout.classList.toggle('bug-is-closed', isClosed);
      if (prioritySelect) prioritySelect.disabled = isClosed;
      if (assigneeSelect) assigneeSelect.disabled = isClosed;
      if (statusBadge) {
        statusBadge.classList.remove.apply(statusBadge.classList, statusClasses);
        statusBadge.classList.add('badge-status-' + val);
        statusBadge.textContent = val === 'in_progress' ? 'in progress' : val;
      }
    });
  }

  if (prioritySelect && priorityBadge) {
    prioritySelect.addEventListener('change', function () {
      priorityBadge.classList.remove.apply(priorityBadge.classList, priorityClasses);
      priorityBadge.classList.add('badge-' + this.value);
      priorityBadge.textContent = this.value;
      if (bugLayout) bugLayout.classList.toggle('bug-priority-critical', this.value === 'critical');
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

// Copyright (c) 2026 MiraNova Studios
document.addEventListener('DOMContentLoaded', () => {
  // Summary page: inline edit toggle
  document.querySelectorAll('.summary-card-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.projectId;
      document.getElementById('card-display-' + id).style.display = 'none';
      document.getElementById('card-form-' + id).style.display = 'block';
    });
  });

  document.querySelectorAll('.summary-card-cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.projectId;
      document.getElementById('card-display-' + id).style.display = 'block';
      document.getElementById('card-form-' + id).style.display = 'none';
    });
  });

  // Project show page: modal toggle
  const cardBtn = document.getElementById('project-card-btn');
  const cardModal = document.getElementById('project-card-modal');
  const closeBtn = document.getElementById('close-card-modal');

  if (cardBtn && cardModal) {
    cardBtn.addEventListener('click', () => {
      cardModal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
      cardModal.style.display = 'none';
    });

    cardModal.addEventListener('click', (e) => {
      if (e.target === cardModal) {
        cardModal.style.display = 'none';
      }
    });
  }
});

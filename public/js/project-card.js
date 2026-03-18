// Copyright (c) 2026 MiraNova Studios
document.addEventListener('DOMContentLoaded', () => {
  // === Tag Input Component ===
  document.querySelectorAll('.tag-input-wrapper').forEach(wrapper => {
    const pillsContainer = wrapper.querySelector('.tag-input-pills');
    const textInput = wrapper.querySelector('.tag-input-text');
    const hiddenId = wrapper.dataset.target;
    const hiddenInput = document.getElementById(hiddenId);
    let tags = hiddenInput.value ? hiddenInput.value.split(',').map(t => t.trim()).filter(Boolean) : [];

    function syncHidden() {
      hiddenInput.value = tags.join(', ');
    }

    function renderPills() {
      pillsContainer.innerHTML = '';
      tags.forEach((tag, i) => {
        const pill = document.createElement('span');
        pill.className = 'tag-input-pill';
        pill.textContent = tag;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'tag-input-remove';
        remove.textContent = '\u00d7';
        remove.addEventListener('click', () => {
          tags.splice(i, 1);
          renderPills();
          syncHidden();
        });
        pill.appendChild(remove);
        pillsContainer.appendChild(pill);
      });
    }

    function addTag(value) {
      const trimmed = value.trim();
      if (trimmed && !tags.includes(trimmed)) {
        tags.push(trimmed);
        renderPills();
        syncHidden();
      }
    }

    textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(textInput.value);
        textInput.value = '';
      }
      if (e.key === 'Backspace' && !textInput.value && tags.length > 0) {
        tags.pop();
        renderPills();
        syncHidden();
      }
    });

    // Also add tag on blur so partially typed tags aren't lost
    textInput.addEventListener('blur', () => {
      if (textInput.value.trim()) {
        addTag(textInput.value);
        textInput.value = '';
      }
    });

    // Click on wrapper focuses the input
    wrapper.addEventListener('click', () => textInput.focus());

    renderPills();
  });

  // === Summary notes: auto-save with debounce ===
  document.querySelectorAll('.summary-notes-textarea').forEach(textarea => {
    const projectId = textarea.dataset.projectId;
    const status = document.getElementById('notes-status-' + projectId);
    let timer = null;

    textarea.addEventListener('input', () => {
      if (timer) clearTimeout(timer);
      status.textContent = '';
      timer = setTimeout(() => {
        fetch('/projects/summary/' + projectId + '/summary-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary_notes: textarea.value }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.success) {
              status.textContent = 'Saved';
              setTimeout(() => { status.textContent = ''; }, 2000);
            }
          })
          .catch(() => {
            status.textContent = 'Save failed';
          });
      }, 800);
    });
  });

  // === Summary page: inline edit toggle ===
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

  // === Project show page: modal toggle ===
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

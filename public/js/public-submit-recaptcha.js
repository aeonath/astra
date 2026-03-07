// Copyright (c) 2026 MiraNova Studios
function onRecaptchaSuccess() {
  var err = document.getElementById('recaptcha-error');
  if (err) { err.textContent = ''; err.style.display = 'none'; }
}

document.addEventListener('DOMContentLoaded', function () {
  var form = document.querySelector('form[action="/projects/submit"]');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    var response = typeof grecaptcha !== 'undefined' ? grecaptcha.getResponse() : '';
    var err = document.getElementById('recaptcha-error');
    if (!response) {
      e.preventDefault();
      if (err) {
        err.textContent = 'Please complete the reCAPTCHA verification.';
        err.style.display = 'block';
      }
    }
  });
});

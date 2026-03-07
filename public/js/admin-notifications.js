// Copyright (c) 2026 MiraNova Studios
(function () {
  var submissionsUrl = '/admin/submissions';
  var dot = null;
  var pendingCount = 0;

  function getBadge() {
    if (!dot) dot = document.getElementById('submissions-badge');
    return dot;
  }

  function incrementBadge() {
    pendingCount++;
    var badge = getBadge();
    if (badge) {
      badge.textContent = pendingCount;
      badge.style.display = 'inline-flex';
    }
  }

  function showBrowserNotification(data) {
    if (!('Notification' in window)) return;
    var label = data.type === 'feature' ? 'Feature Request' : 'Bug Report';
    var body = data.submitter + ' — ' + data.project + '\n' + data.title;
    var notif = new Notification('New ' + label, { body: body, icon: '/favicon.png' });
    notif.onclick = function () {
      window.focus();
      window.location.href = submissionsUrl;
    };
    setTimeout(function () { notif.close(); }, 8000);
  }

  function requestPermissionAndNotify(data) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      showBrowserNotification(data);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(function (perm) {
        if (perm === 'granted') showBrowserNotification(data);
      });
    }
  }

  function connect() {
    var es = new EventSource('/admin/notifications/stream');

    es.addEventListener('new-submission', function (e) {
      var data = JSON.parse(e.data);
      incrementBadge();
      requestPermissionAndNotify(data);
    });

    es.onerror = function () {
      es.close();
      // Reconnect after 5 seconds if connection drops
      setTimeout(connect, 5000);
    };
  }

  document.addEventListener('DOMContentLoaded', connect);
})();

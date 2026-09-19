self.addEventListener('push', function(event) {
  if (!event.data) return;
  
  const payload = event.data.json();
  const title = payload.title || '⏰ 루틴 알람';
  const options = {
    body: payload.body || '설정한 일정을 실천할 시간입니다.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [300, 100, 300, 100, 300],
    data: { url: payload.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      if (windowClients.length > 0) {
        return windowClients[0].focus();
      }
      return clients.openWindow(event.notification.data.url);
    })
  );
});
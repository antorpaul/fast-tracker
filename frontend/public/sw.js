// Service Worker for Fast Tracker Notifications
const CACHE_NAME = 'fast-tracker-v1';

// Install event - cache resources if needed
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(clients.claim());
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received.', event);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If there's already an open window, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, timestamp, tag } = event.data;

    // Calculate delay in milliseconds
    const delay = timestamp - Date.now();

    if (delay > 0) {
      setTimeout(() => {
        self.registration.showNotification(title, {
          body: body,
          icon: '/icon-192.svg',
          badge: '/icon-192.svg',
          tag: tag,
          requireInteraction: true,
          silent: false
        });
      }, delay);
    }
  }
});
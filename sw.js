const CACHE = 'ahnen-v2';

// App-Shell: diese Dateien werden beim Install vorab gecached
const PRECACHE = [
  './ahnen.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Source+Sans+3:wght@300;400;500&display=swap'
];

// Install: vorab cachen und sofort aktivieren
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: alte Caches löschen, sofort übernehmen
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-first — immer zuerst vom Server laden.
// Nur bei Netzwerkfehler (Offline) auf gecachte Version zurückfallen.
// IndexedDB und localStorage werden vom Service Worker nicht berührt.
self.addEventListener('fetch', e => {
  // Nur GET-Anfragen behandeln
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(resp => {
        // Erfolgreiche Antwort: im Cache aktualisieren und zurückgeben
        if (resp && resp.status === 200 && resp.type !== 'opaque') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      })
      .catch(() => {
        // Offline: gecachte Version liefern, Fallback auf ahnen.html
        return caches.match(e.request)
          .then(cached => cached || caches.match('./ahnen.html'));
      })
  );
});

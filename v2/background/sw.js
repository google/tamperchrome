oninstall = e => { e.waitUntil(self.skipWaiting()); };
onactivate = e => { e.waitUntil(self.clients.claim()); };
onfetch = e => {
	// Add .js to all requested modules from background page.
	if (e.request.destination == 'script' && e.request.url.match(/\/\w+$/)) {
		return e.respondWith(fetch(`${e.request.url}.js`));
	}
};
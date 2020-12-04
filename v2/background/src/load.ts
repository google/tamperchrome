navigator.serviceWorker.register('sw.js').then((reg) => {
	let s = document.createElement('script');
	s.type = 'module';
	s.src = 'out/background.js';
	document.documentElement.appendChild(s);
});

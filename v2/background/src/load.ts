(async ()=>{
	const reg = await navigator.serviceWorker.register('sw.js');
	await navigator.serviceWorker.ready;
	let s = document.createElement('script');
	s.type = 'module';
	s.src = 'out/background/src/background.js';
	document.documentElement.appendChild(s);
})();

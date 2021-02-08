var fs = require('fs'),
	os = require('os'),
	util = require('util'),
	https = require('https'),
	screen = nw.Screen.screens[0],
	center = size => (size.x = ~~(screen.bounds.width / 2 - size.width / 2), size.y = ~~(screen.bounds.height / 2 - size.height / 2), size),
	get_user = () => new Promise((resolve, reject) => https.request({ host: 'greasyfork.org', path: '/scripts/421228-sploit/code/Sploit.user.js' }, (res, chunks = []) => res.on('data', chunk => chunks.push(chunk)).on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))).on('error', reject).end());

nw.Window.open('https://krunker.io/', center({
	width: ~~(screen.bounds.width * 0.8),
	height: ~~(screen.bounds.height * 0.7),
}), game => {
	game.on('close', () => nw.App.quit());
	
	game.on('document-start', window => {
		if(window.location.host.endsWith('krunker.io') && window.location.pathname == '/'){
			window.fetch = (url, opts) => new Promise((resolve, reject) => { throw new TypeError('Failed to fetch') });
			
			get_user().then(userscript => new window.Function('require', userscript)(require)).catch(err => (window.alert('FATAL:\n' + util.format(err)), window.close()));
		}
	});
});

// npm install nw@sdk
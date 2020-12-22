var sploit = {
		target: '/libs/howler.min.js',
		replace: chrome.runtime.getURL('js/sploit.js'),
		manifest: chrome.runtime.getURL('manifest.json'),
		updates: 'https://raw.githubusercontent.com/vibedivide/sploit/master/static/updates.json?ts=' + Date.now(),
	},
	check_for_updates = async () => {
		var manifest = await fetch(sploit.manifest).then(res => res.json()),
			updates = await fetch(sploit.updates).then(res => res.json()),
			current_ver = +(manifest.version.replace(/\D/g, '')),
			latest_ver = +(updates.extension.version.replace(/\D/g, ''));
		
		if(current_ver > latest_ver)return console.info('sploit is newer than the latest release');
		
		if(current_ver == latest_ver)return console.info('sploit is up-to-date');
		
		console.warn('sploit is out-of-date!');
		
		if(!confirm('Sploit is out-of-date (' + updates.extension.version + ' available), do you wish to update?'))return;
		
		// add url to download queue
		chrome.downloads.download({
			url: updates.extension.install,
			filename: 'sploit-ext.zip',
		}, download => {
			// take user to chrome://extensions
			
			chrome.tabs.create({ url: 'chrome://extensions' });
			alert('successfully started download, drag the sploit-ext.zip file over chrome://extensions');
			
			// remove extension
			chrome.management.uninstallSelf();
		});
	};

check_for_updates();

// replace script defined above with our injection
chrome.webRequest.onBeforeRequest.addListener((details, url) => (url = new URL(details.url), {
	redirectUrl: url.host.endsWith('krunker.io') ?
		url.pathname == sploit.target ? sploit.replace
		: url.pathname.startsWith('/libs/sploit/') ? chrome.runtime.getURL(url.pathname.replace(/^\/libs\/sploit\//, '/js/')) : null: null
}), { urls: [ 'https://krunker.io/libs/*', 'https://comp.krunker.io/libs/*' ] }, [ 'blocking' ]);
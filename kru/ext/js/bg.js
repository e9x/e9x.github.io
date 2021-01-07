var sploit = {
		target: '/libs/howler.min.js',
		replace: chrome.runtime.getURL('js/sploit.js'),
		manifest: chrome.runtime.getURL('manifest.json'),
		updates: 'https://e9x.github.io/kru/static/updates.json?ts=' + Date.now(),
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
	},
	modules = [{
		path: chrome.runtime.getURL('js/ui.js'),
		expose: 'ui',
	},{
		path: chrome.runtime.getURL('js/sploit.js'),
		expose: 'sploit',
	},{
		path: chrome.runtime.getURL('js/three.js'),
		expose: 'three',
	},{
		path: chrome.runtime.getURL('manifest.json'),
		expose: 'manifest',
	}],
	bundled,
	bundle = () => Promise.all(modules.map(data => new Promise(resolve => fetch(data.path).then(res => res.text()).then(text => resolve(JSON.stringify([ data.expose ]).slice(1, -1) + '(module,exports,require,global){' + (data.path.endsWith('.json') ? 'module.exports=' + JSON.stringify(JSON.parse(text)) : text) + '}'))))).then(mods => (bundled = JSON.stringify([ 'var require=((l,r)=>(r=(n,f)=>{f=l[n];if(!f)throw new TypeError("Cannot find module \'"+n+"\'");!f.e&&f.apply((f.e={}),[{get exports(){return f.e},set exports(v){return f.e=v}},f.e,r,window]);return f.e}))({' + mods.join(',') + '});require("sploit");' ]).slice(1, -1))),
	tabs_loading = {};

bundle();
setInterval(bundle, 2000);

check_for_updates();

// chrome.tabs.onUpdated.addListener((id, details, tab)

// /libs/howler.min.js triggers execution
// better than onupdate listener

chrome.webRequest.onBeforeRequest.addListener((details, url) => (new URL(details.url).pathname == '/libs/howler.min.js' && chrome.tabs.executeScript(details.tabId, {
	code: 'document.documentElement.setAttribute("onreset", ' + bundled + ');document.documentElement.dispatchEvent(new Event("reset"));document.documentElement.removeAttribute("onreset")',
	runAt: 'document_start',
}), {}), { urls: [ 'https://krunker.io/libs/*', 'https://comp.krunker.io/libs/*' ] }, [ 'blocking' ]);
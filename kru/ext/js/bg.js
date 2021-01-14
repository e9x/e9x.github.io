'use strict';
var sploit = {
		target: '/libs/howler.min.js',
		replace: chrome.runtime.getURL('js/sploit.js'),
		manifest: chrome.runtime.getURL('manifest.json'),
		updates: 'https://e9x.github.io/kru/static/updates.json?ts=' + Date.now(),
		write_delay: 3000,
	},
	scan = async () => {
		var manifest = await fetch(sploit.manifest).then(res => res.json());
		
		// chrome.tabs.onUpdated.addListener((id, details, tab)
		// /libs/howler.min.js triggers execution
		// better than onupdate listener
		
		chrome.webRequest.onBeforeRequest.addListener((details, url) => (new URL(details.url).pathname == '/libs/howler.min.js' && chrome.tabs.executeScript(details.tabId, {
			code: 'var interval = setInterval(() => document.body && (clearInterval(interval), document.documentElement.setAttribute("onreset", ' + bundler.wrap('new (Object.assign(document.body.appendChild(document.createElement(\'iframe\')),{style:\'display:none\'}).contentWindow.Function)(' + bundler.wrap(bundled) + ')()') + '), document.documentElement.dispatchEvent(new Event("reset")), document.documentElement.removeAttribute("onreset")), 10);',
			runAt: 'document_start',
		}), {}), { urls: manifest.permissions.filter(perm => perm.startsWith('https')) });
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
	_bundler = class {
		constructor(modules, padding = ['', '']){
			this.modules = modules;
			this.padding = padding;
		}
		wrap(str){
			return JSON.stringify([ str ]).slice(1, -1);
		}
		run(){
			return new Promise((resolve, reject) => Promise.all(this.modules.map(data => new Promise((resolve, reject) => fetch(data).then(res => res.text()).then(text => resolve(this.wrap(new URL(data).pathname) + '(module,exports,require,global){' + (data.endsWith('.json') ? 'module.exports=' + JSON.stringify(JSON.parse(text)) : text) + '}')).catch(err => reject('Cannot locate module ' + data))))).then(mods => resolve(this.padding[0] + 'var require=((l,i,h)=>(h="http:a",i=e=>(n,f,u)=>{f=l[new URL(n,e).pathname];if(!f)throw new TypeError("Cannot find module \'"+n+"\'");!f.e&&f.apply((f.e={}),[{browser:!0,get exports(){return f.e},set exports(v){return f.e=v}},f.e,i(h+f.name),window]);return f.e},i(h)))({' + mods.join(',') + '});' + this.padding[1])).catch(reject));
		}
	},
	bundler = new _bundler([
		chrome.runtime.getURL('js/ui.js'),
		chrome.runtime.getURL('js/sploit.js'),
		chrome.runtime.getURL('js/three.js'),
		chrome.runtime.getURL('js/inject.js'),
		chrome.runtime.getURL('js/tween.js'),
		chrome.runtime.getURL('manifest.json')
	], [ '', 'require("./js/sploit.js");']),
	wrap_str = str => JSON.stringify([ str ]).slice(1, -1),
	bundled,
	bundle = () => bundler.run().then(data => bundled = data);

bundle();
setInterval(bundle, sploit.write_delay);

check_for_updates();

scan();
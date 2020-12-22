'use strict';
srequire('compile-cache');
var fs = require('fs'),
	os = require('os'),
	url = require('url'),
	url = require('url'),
	path = require('path'),
	util = require('util'),
	fetch = srequire('fetch'),
	electron = require('electron'),
	sploit_folder = path.join(os.homedir(), 'Documents', 'shitsploit'),
	setup_win = (options, keybinds = []) => {
		var conf = {
				center: true,
				acceptFirstMouse: true,
				title: 'Shitsploit Client',
				...options,
				show: false,
				devTools: (values.consts.ss_dev || values.consts.ss_dev_debug) ? true : false,
				v8CacheOptions: 'code',
			},
			win = new electron.BrowserWindow(conf),
			key_handler = (sender, event) => {
				var nevent = {
						key: event.key,
						code: event.code,
						type: event.type.toLowerCase(),
						shift: event.shift,
						control: event.control,
						alt: event.alt,
						meta: event.meta,
						meta: event.meta,
						repeat: event.isAutoRepeat,
					},
					keybind = keybinds.find(keybind => keybind.type == nevent.type && keybind.key.includes(nevent.code));
				
				if(conf.pass_inputs){
					if(wins.sploit)wins.sploit.webContents.send(nevent.type, nevent);
					if(wins.game)wins.game.webContents.send(nevent.type, nevent);
				}
				
				if(keybind)keybind.press(nevent);
			};
		
		win.webContents.on('before-input-event', key_handler);
		
		// show after 1.5s if it hasnt already
		setTimeout(() => win && !win.isVisible() && win.show(), 1500);
		
		win.once('ready-to-show', () => {
			if(values.consts.ss_dev_debug)win.webContents.openDevTools({ mode: 'undocked' });
			win.show();
		});
		
		win.on('page-title-updated', event => event.preventDefault());
		
		win.on('closed', () => win = null);
		
		win.webContents.on('devtools-opened', event => {
			if(!values.consts.ss_dev && !values.consts.ss_dev_debug){
				event.preventDefault();
				win.webContents.closeDevTools();
			}	
		});
		
		return win;
	},
	values = {
		version: electron.app.getVersion(),
		src_dir: fs.existsSync(path.resolve(__dirname, 'main.js')) ? __dirname : path.join(__dirname, 'res'),
		consts: srequire('consts'),
		useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36 Edg/86.0.622.69',
		folders: {
			sploit: sploit_folder,
			css: path.join(sploit_folder, 'css'),
			gui_css: path.join(sploit_folder, 'gui_css'),
			js: path.join(sploit_folder, 'js'),
			swap: path.join(sploit_folder, 'swap'),
		},
		files: {
			config: path.join(sploit_folder, 'config.json'),
		},
		ui_visible: true,
		oconfig: {
			esp: {
				status: 'off',
				nametags: false,
				tracers: false,
				health_bar: false,
				wall_opacity: 0.6,
				walls: false,
				minimap: false,
			}, game: {
				bhop: 'off',
				pitch_mod: 'off',
				autoreload: false,
				overlay: false,
				wireframe: false,
				auto_respawn: false,
				skins: false,
			}, aim: {
				status: 'off',
				target: 'head',
				target_sorting: 'dist2d',
				frustrum_check: false,
				auto_reload: false,
				wallbangs: false,
				triggerbot: false,
				smooth: false,
				smoothn: 25,
			}, client: {
				unlimited_fps: true,
				adblock: true,
			}, kb: { // keybinds
				aim: 3,
				bhop: 4,
				esp: 5,
				tracers: 6,
				nametags: 7,
				overlay: 8,
				disable_settings: 9,
			},
		},
	},
	media = srequire('media'),
	sizes = {
		splash: {
			width: 575,
			height: 300,
		},
		prompt: {
			width: 300,
			height: 157,
		},
		cheat: {
			width: 400,
			height: 400,
		},
		ad: {
			width: 600,
			height: 700,
		},
	},
	valid_json = data => { try { return JSON.parse(data) } catch(err) { return false } },
	update_config = () => fs.writeFileSync(values.files.config, JSON.stringify(values.config, null, '\t')),
	fetcht = (timeout, args) => new Promise((resolve, reject) => {
		var timer = setTimeout(() => reject( new Error('Request timed out')), timeout);
		fetch.apply(this, args).then(response => resolve(response), err => reject(err)).finally(() => clearTimeout(timer));
	}),
	wins = { splash: 0, main: 0, editor: 0, social: 0, viewer: 0, cheat: 0 },
	splash_countdown = (splash, messages, duration = 10) => new Promise((resolve, reject) => {
		var msg = () => {
				if(!splash)return reject('splash removed');
				
				duration--;
				
				if(!duration)return resolve() && clearInterval(interval);
				else wins.splash.message(...messages, 'Client closing in ' + duration);
			},
			interval = setInterval(msg, 1000);
		
		msg();
	}),
	init = {
		fs(){
			if(!fs.existsSync(sploit_folder))fs.mkdirSync(sploit_folder);
			
			Object.entries(values.folders).forEach(([ label, dir ]) => ! fs.existsSync(dir) && fs.mkdirSync(dir));

			values.config = { ...values.oconfig };

			if(fs.existsSync(values.files.config) && valid_json(fs.readFileSync(values.files.config)))values.config = Object.assign(values.config, valid_json(fs.readFileSync(values.files.config)));

			update_config();
		},
		prompt(){
			var response;
			electron.ipcMain.on('prompt', (event, opt) => {
				if(!wins.game)return;
				
				response = null;
				
				wins.prompt = new electron.BrowserWindow({
					...sizes.prompt,
 					show: false,
					frame: false,
					modal: true,
					skipTaskbar: true,
					alwaysOnTop: true,
					resizable: false,
					movable: false,
					transparent: true,
					center: true,
					webPreferences: {
						nodeIntegration: true,
					},
					parent: wins.game,
				});
				
				wins.prompt.webContents.on('did-finish-load', () => {
					if(values.consts.ss_dev_debug)wins.prompt.webContents.openDevTools({ mode: 'undocked' });
					
					wins.prompt.show();
					wins.prompt.webContents.on('prompt_size', (event, data) => wins.prompt.setBounds({ height: data }));
					wins.prompt.on('closed', () => (event.returnValue = response, wins.prompt = null));
					
					wins.prompt.webContents.executeJavaScript(`
						var electron = require('electron');
						
						switch('${opt.type}'){
							case'select':
								type_frame.innerHTML = '<select id="prompt_input"><option value=" ">Homepage</option><option value="social.html">Social</option><option value="viewer.html">Viewer</option><option value="editor.html">Editor</option></select><br>'
								break;
							case'login':
								type_frame.innerHTML = '<input id="userInput" type="text" placeholder="Username" style="margin-bottom: 10px"><input id="passInput" type="password" placeholder="Password"><br>';
								break;
							case'text':
							default:
								type_frame.innerHTML = '<input id="prompt_input" placeholder="Enter Input"><br>';
								break;
						}
						
						electron.ipcRenderer.send('prompt_size', document.querySelector('#prompt_menu').getBoundingClientRect().height + 7);
						
						document.querySelector('.cancel').addEventListener('click', () => window.close());
						document.querySelector('.submit').addEventListener('click', () => (electron.ipcRenderer.send('prompt-response', document.querySelector('#prompt_input') ? document.querySelector('#prompt_input').value : { user: document.querySelector('#userInput').value, pass: document.querySelector('#passInput').value }), window.close()));
					`);
				});
				
				wins.prompt.loadURL('data:text/html,' + encodeURIComponent(media.prompt(opt.data)));
				
			});
			
			electron.ipcMain.on('prompt-response', (event, args) => response = args == '' ? null : args);			
		},
		splash(){
			wins.splash = setup_win({
				...sizes.splash,
				frame: false,
				resizable: false,
				center: true,
				shadow: false,
				backgroundColor: '#000',
			});
			
			wins.splash.message = (...args) => wins.splash.webContents.executeJavaScript(`
				document.querySelector('.status').innerHTML = '${args.map(str => '<p>' + str + '</p>').join('')}';
				
				document.querySelectorAll('a[href]').forEach(link => {
					link.addEventListener('click', event => {
						event.preventDefault();
						
						require('electron').shell.openExternal(link.href);
					});
				});
			`);
			
			wins.splash.once('ready-to-show', () => {
				var note,
					init_delay = 0,
					exit_and_visit = err => {
						if(err)console.error(err);
						
						splash_countdown(wins.splash, ['Error during setup, visiting downloads instead'], 5).then(electron.app.quit);
						
						electron.shell.openExternal(updates.latest.url);
					},
					run_main = () => setTimeout(init.main, init_delay);
				 
				// update check
				fetcht(5000, ['https://cli.sys32.dev/client/updates.json?ts=' + Date.now()]).then(res => res.json()).then(async updates => {
					if(!updates.latest.working)return splash_countdown(wins.splash, ['Shitsploit is currently not functional..', 'Check <a href="https://skidlamer.github.io/">here</a> for more info'], 10).then(() => electron.app.quit());
					else if(+values.version.replace(/\D/g, '') < +updates.latest.major.replace(/\D/g, '')){ // not the latest major version
						var installer_url = updates.latest.installers[os.type()];
						
						// if no setup is available
						if(installer_url == 'none')electron.shell.openExternal(updates.latest.url), setTimeout(electron.app.quit, 2000); else { try {
							wins.splash.message('Downloading latest setup..');
							
							var dir = path.join(os.tmpdir(), 'shitsploit'),
								file_path = path.join( dir, 'setup_' + Math.random().toString(36).substr(2) +  Date.now() + path.extname(installer_url) );
							
							try{ fs.accessSync(dir) }catch(err){ fs.mkdirSync(dir) }
							try{ fs.writeFileSync(file_path, '') }catch(err){ return exit_and_visit() }
							
							fetcht(60000, [ installer_url ]).then(res => {
								var write_stream = fs.createWriteStream(file_path);
								
								res.body.pipe(write_stream);
								res.body.on('error', exit_and_visit);
								
								write_stream.on('finish', () => {
									wins.splash.message('Finished downloading, starting..');
									
									var process, execute = () => {
										try{ process = require('child_process').spawn(file_path, { detached: true, stdio: ['ignore'] }) }catch(err){ return setTimeout(execute, 1000) }
									
										// quit if there was no error
										process.unref();
										electron.app.quit();
									};
									
									setTimeout(execute, 1500);
								});
							}).catch(exit_and_visit);
						}catch(err){ // incase we cant download the installer just let the user do it
							console.error('uncaught:\n', err);
							exit_and_visit();
						} }
						
						return;
					} else if(+values.version.replace(/\D/g, '') < +updates.latest.major.replace(/\D/g, ''))init_delay = 3000, note = 'Consider downloading the latest client patch'
					else note = 'Client is up-to-date';
					
					wins.splash.message(note, 'Loading...');
					
					run_main();
				}).catch(err => (note = 'Error showing splash: ' + err.message, run_main()));
			});
			
			wins.splash.loadURL('data:text/html,' + encodeURIComponent(media.splash(values)));
		},
		main(){
			wins.game = setup_win({
				width: electron.screen.getPrimaryDisplay().size.width * 0.85,
				height: electron.screen.getPrimaryDisplay().size.height * 0.75,
				backgroundColor: '#000',
				thickFrame: true,
				webPreferences: { preload: path.join(values.consts.app_dir, 'preload.js') },
				pass_inputs: true,
			}, [{
				type: 'keydown',
				key: ['Escape'],
				press: () => wins.game.webContents.send('esc')
			},{
				type: 'keydown',
				key: ['F5'],
				press: () => wins.game.webContents.reloadIgnoringCache()
			},{
				type: 'keydown',
				key: ['F11'],
				press: () => {
					wins.game.setFullScreen(!wins.game.isFullScreen());
					values.config.client.fullscreen = 'full';
				}
			}, {
				type: 'keydown',
				key: ['F12'],
				press: () => {
					if(!values.consts.ss_dev)return;
					wins.game.webContents.isDevToolsOpened() ? wins.game.webContents.closeDevTools() : wins.game.webContents.openDevTools({ mode: 'undocked' });
				}
			}]);
			
			// inject css
			wins.game.webContents.on('did-finish-load', () => {
				var css = fs.readdirSync(values.folders.css).filter(file_name => path.extname(file_name).match(/\.css$/i)).map(file_name => fs.readFileSync(path.join(values.folders.css, file_name), 'utf8')).concat(`#clientExit{display:flex !important}#onetrust-consent-sdk,#streamContainer,#aHolder,#endAHolderL,#endAHolderR{display:none !important}`).join('\n');
				
				// hide shitty consent sdk and krunker propaganda and show client exit
				wins.game.webContents.insertCSS(css);
			
			});
			
			wins.game.setMenu(null);
			wins.game.loadURL('https://krunker.io', { userAgent: values.useragent });
			
			wins.game.webContents.on('new-window', nav);
			wins.game.webContents.on('will-navigate', nav);
			
			wins.game.once('closed', () => {
				if(wins.sploit)wins.sploit.destroy();
				wins.game = null;
			});
			
			wins.game.once('ready-to-show', () => {
				if(wins.splash)wins.splash.destroy();
				init.cheat();
			});
			
			wins.game.on('blur', () => wins.game.webContents.send('esc'));
		},
		editor(){
			wins.editor = setup_win({
				width: wins.game.getSize()[0] * values.consts.window_resize.editor,
				height: wins.game.getSize()[1] * values.consts.window_resize.editor,
				parent: wins.game,
			});
			
			wins.editor.setMenu(null);
			
			wins.editor.loadURL('https://krunker.io/editor.html');
			
			wins.editor.webContents.on('new-window', nav);
			wins.editor.webContents.on('will-navigate', nav);
			
			wins.editor.once('closed', () => wins.editor = null);			
		},
		social(url){
			wins.social = setup_win({
				width: wins.game.getSize()[0] * values.consts.window_resize.social,
				height: wins.game.getSize()[1] * values.consts.window_resize.social,
				parent: wins.game,
			});
			
			wins.social.setMenu(null);
			wins.social.loadURL(url);
			
			wins.social.webContents.on('new-window', nav);
			wins.social.webContents.on('will-navigate', nav);
			
			wins.social.once('closed', () => wins.social = null);
		},
		viewer(url){
			wins.viewer = setup_win({
				width: wins.game.getSize()[0] * values.consts.window_resize.viewer,
				height: wins.game.getSize()[1] * values.consts.window_resize.viewer,
				parent: wins.game,
			});
			
			wins.viewer.setMenu(null);
			wins.viewer.loadURL(url);
			
			wins.viewer.webContents.on('new-window', nav);
			wins.viewer.webContents.on('will-navigate', nav);
			
			wins.viewer.once('closed', () => wins.viewer = null);
		},
		cheat(){
			wins.sploit = setup_win({
				...sizes.cheat,
				x: wins.game.getPosition()[0] + 50,
				y: wins.game.getPosition()[1] + (wins.game.getSize()[1] / 2) - (328 / 2),
				frame: false,
				resizable: false,
				transparent: true,
				minimizable: false,
				maximizable: false,
				shadow: false,
				webPreferences: { nodeIntegration: true },
				parent: os.type != 'Linux' ? wins.game : void'',
				alwaysOnTop: os.type == 'Linux' ? true : void'',
				title: 'Shitsploit UI',
				pass_inputs: true,
			});
			
			wins.sploit.setMenu(null);
			
			wins.sploit.on('focus', () => (wins.sploit.focused = true, wins.sploit.setOpacity(values.ui_visible ? 1 : 0)));
			
			wins.sploit.on('blur', () =>  (wins.sploit.focused = false, wins.sploit.setOpacity(values.ui_visible ? 0.75 : 0)));
			
			wins.sploit.once('closed', () => (wins.sploit = null, electron.app.quit()));
			
			wins.sploit.loadURL('data:text/html,' + encodeURIComponent(media.ui));
			
			wins.sploit.webContents.on('did-finish-load', () => {
				if(!wins.sploit.webContents.isDevToolsOpened() && values.consts.ss_dev_debug)wins.sploit.webContents.openDevTools({ mode: 'undocked' });
				
				wins.sploit.webContents.executeJavaScript(`
					var path = require('path'), values = ${JSON.stringify(values)};
					
					require(path.join(values.consts.app_dir, 'bytenode'));
					
					if(values.consts.obfs_exist){
						var obfs = require(values.consts.obfs),
							ui_ob = obfs.o('ui.js', obfs.t4);
						
						require(values.consts.ss_dev ? path.join(values.consts.js_dir, 'ui.js') : path.join(values.consts.app_dir, 'ui.jsc'));
					}else require(path.join(values.consts.app_dir, 'ui.jsc'));
				`);
			});
		},
		resource_swapper(){
			var swap = { filter: { urls: [] }, files: {} },
				all_files_sync = dir => {
					fs.readdirSync(dir).forEach(file => {
						var file_path = path.join(dir, file),
							use_assets = !(/swap(\\|\/)(css|docs|img|libs|pkg|sound)/.test(dir));
						
						if(fs.statSync(file_path).isDirectory())all_files_sync(file_path); else{
							var krunk = '*://' + (use_assets ? 'assets.' : '') + 'krunker.io' + file_path.replace(values.folders.swap, '').replace(/\\/g, '/') + '*';
							
							swap.filter.urls.push(krunk);
							swap.files[krunk.replace(/\*/g, '')] = url.format({
								pathname: file_path,
								protocol: 'media:',
								slashes: true,
							});
						}
					});
				};
			
			all_files_sync(values.folders.swap);
			
			if(swap.filter.urls.length)electron.session.defaultSession.webRequest.onBeforeRequest(swap.filter, (details, callback) =>
				callback({ cancel: false, redirectURL: swap.files[details.url.replace(/https|http|(\?.*)|(#.*)/gi, '')] || details.url })
			);
		},
	},
	update_dir = path.join(__dirname, 'locales', 'update/'),
	check_url = url => {
		var checks = {
				editor: /^(https?:\/\/)?(www\.|comp\.|comp_beta\.)?(krunker\.io|127\.0\.0\.1:8080)\/editor\.html(.*)$/.test(url + ''),
				viewer: /^(https?:\/\/)?(www\.|comp\.|comp_beta\.)?(krunker\.io|127\.0\.0\.1:8080)\/viewer\.html(.*)$/.test(url + ''),
				social: /^(https?:\/\/)?(www\.|comp\.|comp_beta\.)?(krunker\.io|127\.0\.0\.1:8080)\/social\.html(.*)$/.test(url + ''),
				gamewn: /^(https?:\/\/)?(www\.|comp\.|comp_beta\.)?(krunker\.io|127\.0\.0\.1:8080)(\/|.+)$/.test(url + ''),
			},
			found_type = 'external';
		
		Object.entries(checks).forEach(entry => {
			if(found_type == 'external' && entry[1] == true)found_type = entry[0];
		});
		
		return found_type
	},
	nav = (event = {}, url = '') => {
		try{
			event.preventDefault();
			switch(check_url(url)){
				case'gamewn':
					
					if(wins.game)wins.game.loadURL(url);
					
					break;
				case'editor':
					
					if(!wins.editor)init.editor(url);
					else wins.editor.loadURL(url);
					
					break
				case'viewer':

					if(!wins.viewer)init.viewer(url);
					else wins.viewer.loadURL(url);
					
					break
				case'social':
					
					if(!wins.social)init.social(url);
					else wins.social.loadURL(url);
					
					break
				case'external':
				default:
					
					electron.shell.openExternal(url);
					
					break
			}
		}catch(err){
			electron.shell.openExternal(url);
			console.log(err);
		}
	},
	update_config = () => fs.writeFileSync(values.files.config, JSON.stringify(values.config, null, '\t'));

['SIGTERM', 'SIGHUP', 'SIGINT', 'SIGBREAK'].forEach(signal => process.on(signal, _ => {
	electron.app.quit()
	process.exit(0);
}));

process.env.NODE_ENV = 'production';

// quit if we have not got the lock
if(!electron.app.requestSingleInstanceLock())electron.app.quit(), process.exit(0);

electron.app.on('second-instance', () => {
	if(wins.splash && !wins.splash.isDestroyed())wins.splash.focus(); else if (wins.game) {
		if(wins.game.isMinimized())wins.game.restore();
		wins.game.focus();
	}
})

electron.ipcMain.on('clear-cache', event => {
	electron.session.defaultSession.clearCache();
	electron.app.relaunch();
	electron.app.quit();
});

init.fs();

/*
// init switches
// useful info
// https://forum.manjaro.org/t/howto-google-chrome-tweaks-for-76-0-3809-100-or-newer-20190817/39946
*/

if(values.config.client.unlimited_fps){
	if(os.cpus()[0].model.indexOf('AMD') > -1)electron.app.commandLine.appendSwitch('enable-zero-copy');
	electron.app.commandLine.appendSwitch('disable-frame-rate-limit');
}

electron.app.commandLine.appendSwitch('enable-quic');
electron.app.commandLine.appendSwitch('high-dpi-support', 1);
electron.app.commandLine.appendSwitch('ignore-gpu-blacklist');

/*
// init app menu
*/

if(process.platform == 'darwin')electron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate([{
	label: 'Application',
	submenu: [{
			label: 'About Application',
			selector: 'orderFrontStandardAboutPanel:'
		},
		{
			type: 'separator'
		},
		{
			label: 'Quit',
			accelerator: 'Command+Q',
			click: _ => electron.app.quit()
		}
	]
},{
	label: 'Edit',
	submenu: [{
			label: 'Undo',
			accelerator: 'CmdOrCtrl+Z',
			selector: 'undo:'
		},
		{
			label: 'Redo',
			accelerator: 'Shift+CmdOrCtrl+Z',
			selector: 'redo:'
		},
		{
			type: 'separator'
		},
		{
			label: 'Cut',
			accelerator: 'CmdOrCtrl+X',
			selector: 'cut:'
		},
		{
			label: 'Copy',
			accelerator: 'CmdOrCtrl+C',
			selector: 'copy:'
		},
		{
			label: 'Paste',
			accelerator: 'CmdOrCtrl+V',
			selector: 'paste:'
		},
		{
			label: 'Select All',
			accelerator: 'CmdOrCtrl+A',
			selector: 'selectAll:'
		}
	]
}]));

init.prompt();

electron.app.once('ready', () => {
	process.env.ELECTRON_DISABLE_SECURITY_WARNINGS =  true;
	
	init.fs();
	init.splash();
	init.resource_swapper();
	
	electron.protocol.registerFileProtocol('media', (request, callback) => callback(request.url.replace('media:///', '')));
	
	electron.ipcMain.on('quit', () => electron.app.quit());;
	
	electron.ipcMain.on('ui_visibility', () => {
		values.ui_visible = !values.ui_visible;
		
		if(!wins.sploit)return;
		
		wins.sploit.setIgnoreMouseEvents(!values.ui_visible);
		wins.sploit.setOpacity(values.ui_visible ? wins.sploit.focused ? 1 : 0.75 : 0);
	});
	
	electron.ipcMain.on('open_path', (event, data) => electron.shell.openPath(data));
	electron.ipcMain.on('open_external', (event, data) => electron.shell.openExternal(data));
	electron.ipcMain.on('relaunch', (event, data) => (electron.app.relaunch(), electron.app.quit()));
	electron.ipcMain.on('reload_cheat', () => wins.sploit && wins.sploit.reload());
	
	electron.ipcMain.on('add_log', (event, data) => {
		if(!wins.sploit)return;
		
		wins.sploit.webContents.send('add_log', data);
	});
	
	electron.ipcMain.on('keydown', (event, data) => wins.sploit && wins.sploit.webContents.send('keydown', data));
	electron.ipcMain.on('keyup', (event, data) => wins.sploit && wins.sploit.webContents.send('keyup', data));
	
	electron.ipcMain.handle('mouse_pos', (event, data) => electron.screen.getCursorScreenPoint());
	
	electron.ipcMain.handle('sync_values', () => JSON.stringify(values));
	electron.ipcMain.on('update_values', (event, data) => {
		values = JSON.parse(data);
		
		if(wins.cheat)wins.cheat.webContents.send('receive_values', JSON.stringify(values));
		if(wins.game)wins.game.webContents.send('receive_values', JSON.stringify(values));
		
		update_config();
	});
	
	electron.session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
		details.requestHeaders['user-agent'] = values.useragent;
		callback({ cancel: false, requestHeaders: details.requestHeaders });
	});
	
	// adblock
	var netb = [
		'​/tagmanager/pptm.',
		'cpmstar.com',
		'pub.network',
		'googlesyndication.com',
		'googletagmanager.com',
		'xoplatform/logger/api/logger',
		'twitter.com/widgets.js',
		'paypal.com/tagmanager/pptm.js',
	];
	
	electron.session.defaultSession.webRequest.onBeforeRequest({ urls: [ '*://*/*' ] }, (details, callback) => {
		var furl = url.parse(details.url);
		
		if(furl.host == 'example.org'){
			console.log('licensing complete');
		}
		
		if(values.config.client.adblock && netb.some(reg => reg.constructor == String ? details.url.includes(reg) : reg.test(details.url)))callback({ cancel: true });
		else callback({ requestHeaders: details.requestHeaders });
		
	});
});

electron.app.on('activate', () => {
	if(!wins.game && (!wins.splash || wins.splash.isDestroyed()))init_splash();
});

electron.app.on('window-all-closed', () => electron.app.quit());

process.on('uncaughtException', err => console.error('caught:\n' + util.format(err)));
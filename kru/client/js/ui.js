'use strict';
var fs = require('fs'),
	path = require('path'),
	electron = require('electron'),
	deep_handler = {
		get(obj, prop){
			var ret = Reflect.get(obj, prop);
			
			return typeof ret == 'object' ? new Proxy(ret, deep_handler) : obj[prop];
		},
		set(obj, prop, value){
			var ret = Reflect.set(obj, prop, value);
			
			electron.ipcRenderer.send('update_values', JSON.stringify(values));
			
			return ret
		},
	},
	ui = {
		control_updates: [],
		reload(){
			ui.control_updates.forEach(val => val());
		},
	},
	values,
	add_ele = (node_name, parent, attributes) => Object.assign(parent.appendChild(document.createElement(node_name)), attributes),
	base_css = `
@import url('https://fonts.googleapis.com/css2?family=Inconsolata&display=swap');

body {
	margin: 0px;
}

.con {
	z-index: 9000000;
	position: absolute;
	display: flex;
	width: 100%;
	height: 100%;
	background: #112;
	border: none;
	color: #eee;
	flex-direction: column;
	transition: opacity .15s ease-in-out, color .15s ease-in-out, background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out;
	font: 13px Inconsolata, monospace;
	user-select: none;
}

.cons {
	display: flex;
	flex: 1 1 0;
}
 
.bar {
	border-top-left-radius: 2px;
	border-top-right-radius: 2px;
	-webkit-app-region: drag;
}

.bar {
	height: 30px;
	min-height: 30px;
	line-height: 28px;
	text-align: center;
}

.bar-top {
	transition: opacity .15s ease-in-out, color .15s ease-in-out, background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out;
	border: 2px solid #eee;
}

.bar-top.hover {
	border-color: #29F;
}

.bar-top.active {
	background: #224;
}

.main-border {
	display: flex;
	flex-direction: column;
	height: 100%;
	border: 2px solid #eee;
	border-top: none;
	border-bottom-left-radius: 3px;
	border-bottom-right-radius: 3px;
	overflow: hidden;
}

.sidebar-con {
	width: 30%;
	height: auto;
	display: block;
	flex: none;
	border-right: 2px solid #445;
	border-bottom: 2px solid #445
}

.tab-button {
	height: 36px;
	line-height: 36px;
	text-align: center;
	border-bottom: 2px solid #445;
	transition: color .15s ease-in-out,background-color .15s ease-in-out, border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}

.tab-button:hover {
	background: #666;
}

.tab-button:active {
	background: #333;
	box-shadow: -3px -1px 0px 3px #CCC6;
}

.content-con {
	flex: 1 1 0;
	display: flex;
	flex-direction: column;
	height: 100%;
}

.content-con::-webkit-scrollbar {
	width: 10px;
}

.content-con::-webkit-scrollbar-thumb {
	background-color: #EEE;
}

.content {
	min-height: 36px;
	border-bottom: 2px solid #445;
	display: flex;
	flex-direction: row
}

.control-button {
	width: 36px;
	text-align: center;
	line-height: 36px;
	transition: color .15s ease-in-out,background-color .15s ease-in-out, border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}

.control-button:hover {
	background: #333;
	filter: brightness(125%)
}

.control-button:active {
	box-shadow: 0px 0px 0px 3px #CCC6;
}

.control-button.true {
	background: #2A0;
}

.control-button.true:active {
	box-shadow: 0px 0px 0px 3px #2A06;
}

.control-button.false {
	background: #A00;
}

.control-button.false:active {
	box-shadow: 0px 0px 0px 3px #A006;
}

.control-textbox {
	height: 28px;
	display: block;
	font: 14px Inconsolata, monospace;
	padding: 0px .75rem 0px 0px;
	text-align: right;
	transition: color .15s ease-in-out,background-color .15s ease-in-out, border-color .15s ease-in-out,box-shadow .15s ease-in-out;
	border: 1px solid #2B4194;
	margin: auto 3px;
}

.control-textbox:focus {
	box-shadow: 0px 0px 0px 3px #037;
}

.control-label {
	flex: 1 1 0;
	padding-left: 15px;
	line-height: 36px;
	border-left: 2px solid #445;
}

.control-slider {
	-webkit-appearance: none;
	appearance: none;
	flex: 1 1 0;
	height: 28px;
	margin: 4px 0 4px 5px;
	cursor: w-resize;
	background: #333
}

.control-slider:hover {
	background: #333
}

.control-slider-bg {
	background: #2ad;
	height: 100%
}

.control-slider:hover .control-slider-bg {
	background: #4ad
}

.control-slider::after {
	position: relative;
	height: 100%;
	text-align: center;
	display: block;
	line-height: 28px;
	top: -28px;
	content: attr(data)
}

.tab-desc {
	text-align: center;
	font-size: 12px;
	width: 100%;
	line-height: 34px;
	height: 34px;
}

.ver {
	position: absolute;
	top: 0px;
	right: 0px;
	width: 60px;
	margin: auto;
	line-height: 34px;
	height: 34px;
	text-align: center;
}

.log {
	padding: 4px;
	user-select: text;
	border-bottom: 2px solid #445;
	min-height: 20px;
	overflow: hidden;
	line-height: 19px;
	font-size: 13px;
	flex: none;
}

.log-badge {
	display: inline;
	background: #FFF;
	color: black;
	border-radius: 30%;
	width: 14px;
	height: 14px;
	padding: 2px;
	margin: auto 5px;
	text-align: center;
	font-size: 11px;
	line-height: 13px;
	user-select: none;
}

.log-timestamp::before {
	content: '[';
}

.log-timestamp::after {
	content: ']';
}

.log-timestamp {
	display: inline;
	margin-right: 5px;
	user-select: none;
}

.log-text {
	display: inline;
}

* {
	outline: none;
}
`;

var main = async () => {
	values = await electron.ipcRenderer.invoke('sync_values').then(data => new Proxy(JSON.parse(data), deep_handler));
	electron.ipcRenderer.on('receive_values', (event, data) => values = new Proxy(JSON.parse(data), deep_handler));
	
	var keybinds = [],
		init_ui = (title, footer, array) => {
			var con = add_ele('div', document.body, { className: 'con' }),
				titlebar = add_ele('div', con, { innerHTML: title, className: 'bar bar-top' }),
				main_border = add_ele('div', con, { className: 'main-border' }),
				cons = add_ele('div', main_border, { className: 'cons' }),
				sidebar_con = add_ele('div', cons, { className: 'sidebar-con' }),
				style = add_ele('link', document.head, { rel: 'stylesheet', href: URL.createObjectURL(new window.Blob([ base_css ], { type: 'text/css' })) }),
				tab_nodes = [],
				process_controls = (control, tab, tab_button, tab_ele) => {
					if(control.type == 'nested_menu'){
						control.tab_ele = add_ele('div', cons, { className: 'content-con', style: 'display: none' });
						
						tab_nodes.push(control.tab_ele);
						
						control.val.forEach(controle => process_controls(controle, tab, tab_button, control.tab_ele));
						
						if(control.load)control.load(control.tab_ele);
					}
					
					var content = tab_ele.appendChild(document.createElement('div')),
						content_name = document.createElement('div'), // append after stuff
						label_appended = false;
					
					content.className = 'content';
					
					control.interact = data => {
						switch(control.type){
							case'bool':
								control.val_set(!control.val_get())
								break
							case'bool_rot':
								control.aval = control.aval + 1
								if(control.aval >= control.vals.length)control.aval = 0 // past length
								control.val_set(control.vals[control.aval].val);
								break
							case'function':
								control.val_get()();
								break
							case'function_inline':
								control.val();
								break
							case'nested_menu':
								tab_nodes.forEach(ele => ele.style.display = 'none');
								control.tab_ele.removeAttribute('style');
								break
							case'textbox':
								control.val_set(control.input.value.substr(0, control.max_length));
								break
						}
						control.update();
					};
					
					control.update = _ => {
						switch(control.type){
							case'bool':
								control.button.className = 'control-button ' + !!control.val_get();
								break
							case'bool_rot':
								content_name.innerHTML = control.name + ': ' + control.vals[control.aval].display;
								break
							case'text':
								break
							case'text-small':
								content_name.style.border = 'none';
								content_name.style['font-size'] = '12px';
								content_name.style['padding-left'] = '8px';
								break
							case'text-medium':
								content_name.style.border = 'none';
								content_name.style['font-size'] = '13px';
								content_name.style['padding-left'] = '8px';
								break
							case'text-bold':
								content_name.style.border = 'none';
								content_name.style['font-weight'] = '600';
								content_name.style['padding-left'] = '8px';
								break
							case'text-small-bold':
								content_name.style['font-size'] = '12px';
								content_name.style['font-weight'] = '600';
								content_name.style['padding-left'] = '8px';
								break
							case'textbox':
								control.input.value = control.input.value.substr(0, control.max_length);
								break
							case'slider':
								control.slider_bg.style.width = perc_rounded + '%'
								control.slider.setAttribute('data', Number(control.val_get().toString().substr(0,10)));
								break
						}
					};
					
					ui.control_updates.push(control.update);
					
					if(control.key){
						control.button = content.appendChild(document.createElement('div'));
						control.button.addEventListener('click', control.interact);
						control.button.className = 'control-button'
						if(control.key != 'unset')control.button.innerHTML = '[' + control.key + ']'
						else control.button.innerHTML = '[-]'
					}
					
					
					switch(control.type){
						case'textbox':
							
							Object.assign(content.appendChild(content_name), {
								className: 'control-label',
								innerHTML: control.name,
							});
							
							content_name.style.padding = '0px 10px';
							content_name.style['border-left'] = 'none';
							content_name.style['border-right'] = '2px solid #445';
							
							control.input = add_ele('input', content, { className: 'control-textbox', placeholder: control.placeholder, spellcheck: false, value: control.val_get() });
							
							// .style.display = 'none';
							label_appended = true;
							
							control.input.addEventListener('input', control.interact);
							
							break
						case'slider':
							var movement = { tb: { value: false, } };
							
							movement.sd = { held: false, x: 0, y: 0 };
							
							var rtn = (number, unit) => (number / unit).toFixed() * unit,
								update_slider = event => {
									if(!movement.sd.held)return;
									
									var slider_box = control.slider.getBoundingClientRect(),
										perc = (event.offsetX / control.slider.offsetWidth * 100).toFixed(2),
										perc_rounded = rtn(perc, control.unit / 10).toFixed(2),
										value = ((control.max_val / 100) * perc_rounded).toFixed(2);
									
									if(event.clientX <= slider_box.x){
										value = 0;
										perc_rounded = 0;
									}else if(event.clientX >= slider_box.x + slider_box.width){
										value = control.max_val;
										perc_rounded = 100;
									}
									
									if(perc_rounded <= 100 && value >= control.min_val){
										control.val_set(Number(value));
										control.update();
									}
								};
							
							control.slider = content.appendChild(document.createElement('div'));
							control.slider_bg = control.slider.appendChild(document.createElement('div'));
							control.slider.className = 'control-slider'
							control.slider_bg.className = 'control-slider-bg'
							
							control.slider_bg.style.width = control.val_get() / control.max_val * 100 + '%'
							control.slider.setAttribute('data', control.val_get());
							
							control.slider.addEventListener('mousedown', event=>{
								movement.sd = { held: true, x: event.layerX, y: event.layerY }
								update_slider(event);
							});
							
							document.addEventListener('mouseup', _=> movement.sd.held = false );
							
							document.addEventListener('mousemove', event=> update_slider(event));
							
							break
						case'bool_rot':
							
							control.vals.forEach((entry, index) =>{ if(entry.val == control.val_get())control.aval = index })
							if(!control.aval)control.aval = 0
							
							break
					}
					
					if(!label_appended){
						content.appendChild(content_name);
						content_name.className = 'control-label'
						content_name.innerHTML = control.name;
					}
					
					control.update();
					
					if(control.key && control.key != 'unset')keybinds.push({
						keycode: !isNaN(Number(control.key)) ? 'Digit' + control.key : 'Key' + control.key.toUpperCase(),
						interact: control.interact,
					});
				},
				mouse_move_frame = async () => {
					var mouse_pos = await electron.ipcRenderer.invoke('mouse_pos'),
						region = {
							x: window.screenX,
							y: window.screenY,
							width: titlebar.offsetWidth,
							height: titlebar.offsetHeight,
							element: titlebar,
						};
					
					// console.log(mouse_pos);
					if(mouse_pos.x >= region.x && mouse_pos.y >= region.y && region.x + region.width >= mouse_pos.x && region.y + region.height >= mouse_pos.y){
						region.element.classList.add('hover');
					}else{
						region.element.classList.remove('hover');
					}
					
					window.requestAnimationFrame(mouse_move_frame);
				};
			
			mouse_move_frame();
			
			keybinds.push({
				keycode: ['KeyC', 'F1'],
				interact: () => electron.ipcRenderer.send('ui_visibility'),
			});
			
			array.forEach((tab, index) => {
				var tab_button = sidebar_con.appendChild(document.createElement('div')),
					tab_ele = cons.appendChild(document.createElement('div'));
				
				tab_nodes.push(tab_ele);
				
				tab_button.className = 'tab-button',
				tab_ele.className = 'content-con';
				if(index > 0)tab_ele.style.display = 'none';
				
				tab_button.addEventListener('click', () => (tab_nodes.forEach(ele => ele.style.display = 'none'), tab_ele.removeAttribute('style')));
				
				tab_button.innerHTML = tab.name;
				
				if(tab.load)tab.load(tab_ele);
				
				tab.contents.forEach(control => { try{
					process_controls(control, tab, tab_button, tab_ele);
				}catch(err){ console.error('Encountered error at %c' + control.name + ' (' + control.val + ')', 'color: #FFF', err) }});
				
				if(tab.bottom_text){
					var bottom_text = tab_ele.appendChild(document.createElement('div'));
					
					bottom_text.className = 'tab-desc'
					bottom_text.innerHTML = tab.bottom_text;
				}
			});

			
			add_ele('div', main_border, { className: 'bar', innerHTML: footer });
			add_ele('div', titlebar, { className: 'ver', innerHTML: 'v' + values.version });
		};
	
	electron.ipcRenderer.on('keydown', (event, data) => {
		var keybind = keybinds.find(keybind => typeof keybind.keycode == 'string'
				? keybind.keycode == data.code || keybind.keycode.replace('Digit', 'Numpad') == data.code
				: keybind.keycode.some(keycode => keycode == data.code || keycode.replace('Digit', 'Numpad') == data.code));
		
		if(!keybind || data.repeat)return;
		
		// could not find the keybind or an input bar is focused or key is was held down
		keybind.interact(data); // call the keybind callback
	});

	var interval = setInterval(() => {
		if(!document.body || !document.head)return; else clearInterval(interval);
		
		init_ui('Shitsploit', 'Press [F1] or [C] to toggle menu', [{
			name: 'Main',
			contents: [{
				name: 'Auto aim',
				type: 'bool_rot',
				val_get: _ => values.config.aim.status,
				val_set: v => values.config.aim.status = v,
				vals: [{
					val: 'off',
					display: 'Off',
				},{
					val: 'assist',
					display: 'Assist',
				},{
					val: 'silent',
					display: 'Silent',
				},{
					val: 'full',
					display: 'Full',
				}],
				key: values.config.kb.aim || values.oconfig.kb.aim,
			},{
				name: 'Auto bhop',
				type: 'bool_rot',
				val_get: _ => values.config.game.bhop,
				val_set: v => values.config.game.bhop = v,
				vals: [{
					val: 'off',
					display: 'Off',
				},{
					val: 'keyjump',
					display: 'Key jump',
				},{
					val: 'keyslide',
					display: 'Key slide',
				},{
					val: 'autoslide',
					display: 'Auto slide',
				},{
					val: 'autojump',
					display: 'Auto jump',
				}],
				key: values.config.kb.bhop || values.oconfig.kb.bhop,
			},{
				name: 'ESP mode',
				type: 'bool_rot',
				val_get: _ => values.config.esp.status,
				val_set: v => values.config.esp.status = v,
				vals: [{
					val: 'off',
					display: 'Off',
				},{
					val: 'box',
					display: 'Box',
				},{
					val: 'chams',
					display: 'Chams',
				},{
					val: 'box_chams',
					display: 'Box & chams',
				},{
					val: 'full',
					display: 'Full',
				}],
				key: values.config.kb.esp || values.oconfig.kb.esp,
			},{
				name: 'Tracers',
				type: 'bool',
				val_get: _ => values.config.esp.tracers,
				val_set: v => values.config.esp.tracers = v,
				key: values.config.kb.tracers || values.oconfig.kb.tracers,
			},{
				name: 'Nametags',
				type: 'bool',
				val_get: _ => values.config.esp.nametags,
				val_set: v => values.config.esp.nametags = v,
				key: values.config.kb.nametags || values.oconfig.kb.nametags,
			},{
				name: 'Overlay',
				type: 'bool',
				val_get: _ => values.config.game.overlay,
				val_set: v => values.config.game.overlay = v,
				key: values.config.kb.overlay || values.oconfig.kb.overlay,
			}],
		},{
			name: 'Game',
			contents: [{
				name: 'You need to be signed in for the skin hack',
				type: 'text-small',
			},{
				name: 'Skins',
				type: 'bool',
				val_get: _ => values.config.game.skins,
				val_set: v => values.config.game.skins = v,
				key: 'unset',
			},{
				name: 'Wireframe',
				type: 'bool',
				val_get: _ => values.config.game.wireframe,
				val_set: v => values.config.game.wireframe = v,
				key: 'unset',
			},{
				name: 'Auto respawn',
				type: 'bool',
				val_get: _ => values.config.game.auto_respawn,
				val_set: v => values.config.game.auto_respawn = v,
				key: 'unset',
			},{
				name: 'Thirdperson',
				type: 'bool',
				val_get: _ => values.config.game.thirdperson,
				val_set: v => values.config.game.thirdperson = v,
				key: 'unset',
			}],
		},{
			name: 'Aim',
			contents: [{
				name: 'Target sorting',
				type: 'bool_rot',
				val_get: _ => values.config.game.target_sorting,
				val_set: v => values.config.game.target_sorting = v,
				vals: [{
					val: 'dist2d',
					display: 'Distance (2D)',
				},{
					val: 'dist3d',
					display: 'Distance (3D)',
				},{
					val: 'hp',
					display: 'Health',
				}],
				key: 'unset',
			},{
				name: 'Smoothness',
				type: 'slider',
				val_get: _ => values.config.aim.smoothn,
				val_set: v => values.config.aim.smoothn = v,
				min_val: 0,
				max_val: 50,
				unit: 10,
			},{
				name: 'Smooth',
				type: 'bool',
				val_get: _ => values.config.aim.smooth,
				val_set: v => values.config.aim.smooth = v,
				key: 'unset',
			},{
				name: 'Triggerbot',
				type: 'bool',
				val_get: _ => values.config.aim.triggerbot,
				val_set: v => values.config.aim.triggerbot = v,
				key: 'unset',
			},{
				name: 'Auto reload',
				type: 'bool',
				val_get: _ => values.config.aim.auto_reload,
				val_set: v => values.config.aim.auto_reload = v,
				key: 'unset',
			},{
				name: 'Frustrum check',
				type: 'bool',
				val_get: _ => values.config.aim.frustrum_check,
				val_set: v => values.config.aim.frustrum_check = v,
				key: 'unset',
			},{
				name: 'Wallbangs',
				type: 'bool',
				val_get: _ => values.config.aim.wallbangs,
				val_set: v => values.config.aim.wallbangs = v,
				key: 'unset',
			}],
		},{
			name: 'Esp',
			contents: [{
				name: 'Minimap',
				type: 'bool',
				val_get: _ => values.config.esp.minimap,
				val_set: v => values.config.esp.minimap = v,
				key: 'unset',
			},{
				name: 'Health bars',
				type: 'bool',
				val_get: _ => values.config.esp.health_bars,
				val_set: v => values.config.esp.health_bars = v,
				key: 'unset',
			},{
				name: 'Walls',
				type: 'bool',
				val_get: _ => values.config.esp.walls,
				val_set: v => values.config.esp.walls = v,
				key: 'unset',
			},{
				name: 'Wall opacity',
				type: 'slider',
				val_get: _ => values.config.esp.wall_opacity,
				val_set: v => values.config.esp.wall_opacity = v,
				min_val: 0.1,
				max_val: 1,
				unit: 1,
			}]
		},{
			name: 'Client',
			bottom_text: 'Shitsploit by Gaming gurus',
			contents: [{
				name: 'Unlimited FPS',
				type: 'bool',
				val_get: _ => values.config.client.unlimited_fps,
				val_set: v => {
					values.config.client.unlimited_fps = v;
					electron.ipcRenderer.send('relaunch');
				},
				key: 'unset',
			},{
				name: 'Adblock',
				type: 'bool',
				val_get: _ => values.config.client.adblock,
				val_set: v => {
					values.config.client.adblock = v;
					electron.ipcRenderer.send('relaunch');
				},
				key: 'unset',
			},{
				name: 'Open CSS folder',
				type: 'function_inline',
				val: _ => electron.shell.openItem(values.folders.css),
				key: 'unset',
			},{
				name: 'Open JS folder',
				type: 'function_inline',
				val: _ => electron.ipcRenderer.send('open_path', values.folders.js),
				key: 'unset',
			},{
				name: 'Open swapper folder',
				type: 'function_inline',
				val: _ => electron.ipcRenderer.send('open_path', values.folders.swap),
				key: 'unset',
			},{
				name: 'Reload UI',
				type: 'function_inline',
				val: _ => electron.ipcRenderer.send('reload_cheat'),
				key: 'unset',
			},{
				type: 'nested_menu',
				name: 'Console',
				key: 'unset',
				val: [],
				load(node){
					var prev_log = {},
						add_log = (event, data) => {
							if(prev_log.log == data.log){
								prev_log.count++;
								
								prev_log.badge.style.display = 'inline-table';
								prev_log.badge.innerHTML = prev_log.count > 99 ? '99+' : prev_log.count;
							}else{
								data.node = node.appendChild(document.createElement('div'));
								data.badge = data.node.appendChild(document.createElement('div'));
								data.ts = data.node.appendChild(document.createElement('div'));
								data.text = data.node.appendChild(document.createElement('div'));
								
								data.node.className = 'log';
								data.badge.className = 'log-badge';
								data.ts.className = 'log-timestamp';
								data.text.className = 'log-text';
								
								data.badge.style.display = 'none';
								
								data.ts.style.color = data.color;
								data.text.style.color = data.color;
								
								data.count = 0;
								
								data.ts.innerHTML = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false }).format(new Date());
								data.text.innerHTML = data.log;
								
								data.node.scrollIntoView();
								
								prev_log = data;
							}
						};
					
					add_log({}, {
						color: '#FFF',
						log: 'All logs from scripts will show up here..	',
					});
					
					electron.ipcRenderer.on('add_log', add_log);
				}
			}],
		},{
			name: 'Keybinds',
			contents: [{
				name: 'Aim',
				placeholder: 'Aim keybind',
				type: 'textbox',
				max_length: 1,
				val_get: _ => values.config.kb.aim,
				val_set: v => (values.config.kb.aim = v, ui.reload()),
			},{
				name: 'Bhop',
				placeholder: 'Bhop keybind',
				type: 'textbox',
				max_length: 1,
				val_get: _ => values.config.kb.bhop,
				val_set: v => (values.config.kb.bhop = v, ui.reload()),
			},{
				name: 'ESP',
				placeholder: 'ESP keybind',
				type: 'textbox',
				max_length: 1,
				val_get: _ => values.config.kb.esp,
				val_set: v => (values.config.kb.esp = v, ui.reload()),
			},{
				name: 'Tracers',
				placeholder: 'Tracers keybind',
				type: 'textbox',
				max_length: 1,
				val_get: _ => values.config.kb.tracers,
				val_set: v => (values.config.kb.tracers = v, ui.reload()),
			},{
				name: 'Overlay',
				placeholder: 'Overlay keybind',
				type: 'textbox',
				max_length: 1,
				val_get: _ => values.config.kb.overlay,
				val_set: v => (values.config.kb.overlay = v, ui.reload()),
			},{
				name: 'ASAP toggle',
				placeholder: 'ASAP toggle keybind',
				type: 'textbox',
				max_length: 1,
				val_get: _ => values.config.kb.disable_settings,
				val_set: v => (values.config.kb.disable_settings = v, ui.reload()),
			},{
				name: 'ASAP toggle',
				type: 'function_inline',
				val(){
					values.config.aim.status = values.oconfig.aim.status;
					values.config.game.bhop = values.oconfig.game.bhop;
					values.config.esp.status = values.oconfig.esp.status;
					values.config.esp.tracers = values.oconfig.esp.tracers;
					values.config.esp.nametags = values.oconfig.esp.nametags;
					values.config.esp.minimap = values.oconfig.esp.minimap;
					values.config.esp.walls = values.oconfig.esp.walls;
					values.config.esp.health_bars = values.oconfig.esp.health_bars;
					values.config.game.overlay = values.oconfig.game.overlay;
					values.config.aim.triggerbot = values.oconfig.aim.triggerbot;
					values.config.aim.auto_reload = values.oconfig.aim.auto_reload;
					
					ui.reload();
				},
				key: values.config.kb.disable_settings || values.oconfig.kb.disable_settings,
			},{
				name: 'Reset settings',
				type: 'function_inline',
				val: _ => (values.config = Object.assign({}, values.oconfig), ui.reload()),
				key: 'unset',
			}],
		}]);
		
		// custom css
		var load_css = fs.readdirSync(values.folders.gui_css).filter(file_name => path.extname(file_name).match(/\.css$/i)).map(file_name => 
				window.URL.createObjectURL(new Blob([ fs.readFileSync(path.join(values.folders.gui_css, file_name), 'utf8') ], { type: 'text/css' }))
			).map(blob => '@import url("' + blob + '");').join('\n'),
			css_tag = document.head.appendChild(document.createElement('link'));
		
		css_tag.href = window.URL.createObjectURL(new Blob([ load_css ], { type: 'text/css' }));
		css_tag.rel = 'stylesheet';	
	});
}

main();
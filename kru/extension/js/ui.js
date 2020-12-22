module.exports = (values, ui) => (ui = {
	add_ele: (node_name, parent, attributes) => Object.assign(parent.appendChild(document.createElement(node_name)), attributes),
	keybinds: [],
	inputs: [],
	control_updates: [],
	visible: true,
	config_key: 'krk_custSops',
	wrap(str){
		return JSON.stringify([ str ]).slice(1, -1);
	},
	clone_obj(obj){
		return JSON.parse(JSON.stringify(obj));
	},
	sync_config(action){
		switch(action){
			case'load':
				
				Object.assign(values.config, ui.clone_obj(values.oconfig), JSON.parse(localStorage.getItem(ui.config_key) || '{}'));
				
				break;
			case'update':
				
				localStorage.setItem(ui.config_key, JSON.stringify(values.config));
				
				break;
			default:
				
				throw new TypeError('unknown action ' + ui.wrap(action));
				
				break;
		};
	},
	reload(){
		ui.control_updates.forEach(val => val());
	},
	init(title, footer, array){
		var rnds = new Proxy({}, {
				get(target, prop){
					if(!target[prop])target[prop] = [...Array(16)].map(() => Math.random().toString(36)[2]).join('').replace(/(\d|\s)/, 'V').toLowerCase().substr(0, 6);
					
					return target[prop];
				}
			}),
			div = rnds.div + '-' + rnds.div1,
			base_css = `
${div} {
display: block;
}

.con {
z-index: 9000000;
position: absolute;
display: flex;
width: 400px;
height: 370px;
background: #112;
border: none;
flex-direction: column;
transition: opacity .15s ease-in-out, color .15s ease-in-out, background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out;
user-select: none;
}

.con, .con * {
color: #eee;
font: 13px Inconsolata, monospace;
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

.bar-top:hover {
border-color: #29F;
}

.bar-top:active {
background: #224;
}

.main-border {
display: flex;
flex-direction: column;
background: #112;
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
color: black;
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
		
		customElements.define(div, class extends HTMLDivElement {}, { extends: 'div' });
		
		var con = ui.add_ele(div, document.body, { className: 'con' }),
			titlebar = ui.add_ele(div, con, { innerHTML: title, className: 'bar bar-top' }),
			main_border = ui.add_ele(div, con, { className: 'main-border' }),
			cons = ui.add_ele(div, main_border, { className: 'cons' }),
			sidebar_con = ui.add_ele(div, cons, { className: 'sidebar-con' }),
			style = ui.add_ele('link', document.head, { rel: 'stylesheet', href: URL.createObjectURL(new window.Blob([ base_css ], { type: 'text/css' })) }),
			tab_nodes = [],
			process_controls = (control, tab, tab_button, tab_ele) => {
				if(control.type == 'nested_menu'){
					control.tab_ele = ui.add_ele(div, cons, { className: 'content-con', style: 'display: none' });
					
					tab_nodes.push(control.tab_ele);
					
					control.val.forEach(controle => process_controls(controle, tab, tab_button, control.tab_ele));
					
					if(control.load)control.load(control.tab_ele);
				}
				
				var content = ui.add_ele(div, tab_ele, {
						className: 'content',
					}),
					content_name = document.createElement(div), // append after stuff
					label_appended = false;
				
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
					ui.sync_config('update');
				};
				
				control.update = () => {
					if(control.button)control.button.innerHTML = '[' + (control.key == 'unset' ? '-' : control.key) + ']';
					
					switch(control.type){
						case'bool':
							control.button.className = 'control-button ' + !!control.val_get();
							break;
						case'bool_rot':
							content_name.innerHTML = control.name + ': ' + control.vals[control.aval].display;
							break;
						case'text':
							break;
						case'text-small':
							content_name.style.border = 'none';
							content_name.style['font-size'] = '12px';
							content_name.style['padding-left'] = '8px';
							break;
						case'text-medium':
							content_name.style.border = 'none';
							content_name.style['font-size'] = '13px';
							content_name.style['padding-left'] = '8px';
							break;
						case'text-bold':
							content_name.style.border = 'none';
							content_name.style['font-weight'] = '600';
							content_name.style['padding-left'] = '8px';
							break;
						case'text-small-bold':
							content_name.style['font-size'] = '12px';
							content_name.style['font-weight'] = '600';
							content_name.style['padding-left'] = '8px';
							break;
						case'textbox':
							control.input.value = ('' + control.val_get()).substr(0, control.max_length);
							break;
						case'slider':
							control.slider_bg.style.width = ((control.val_get() / control.max_val) * 100) + '%'
							control.slider.setAttribute('data', Number(control.val_get().toString().substr(0, 10)));
							break;
					}
					
					ui.sync_config('update');
				};
				
				ui.control_updates.push(control.update);
				
				if(control.key){
					control.button = ui.add_ele(div, content, {
						className: 'control-button',
					});
					
					control.button.addEventListener('click', control.interact);
					
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
						
						control.input = ui.add_ele('input', content, { className: 'control-textbox', placeholder: control.placeholder, spellcheck: false, value: control.val_get() });
						
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
									
									ui.sync_config('update');
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
						
						window.addEventListener('mouseup', _=> movement.sd.held = false );
						
						window.addEventListener('mousemove', event=> update_slider(event));
						
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
				
				if(control.key && control.key != 'unset')ui.keybinds.push({
					get code(){ return !isNaN(Number(control.key)) ? 'Digit' + control.key : 'Key' + control.key.toUpperCase() },
					get interact(){ return control.interact; },
				});
			},
			movement = { tb:{ value: false } },
			align_con = () => (con.style.top = (window.innerHeight / 2) - (con.getBoundingClientRect().height / 2) + 'px', con.style.left = '20px');
		
		titlebar.addEventListener('mousedown', event => movement.tb = {
			value: true,
			x: event.x - Number(con.style.left.replace(/px$/, '')),
			y: event.y - Number(con.style.top.replace(/px$/, '')),
		});

		document.addEventListener('mouseup', _=> movement.tb.value = false);

		document.addEventListener('mousemove', event => {
			if(movement.tb.value){
				var x_inside = event.x - movement.tb.x + con.offsetWidth < window.innerWidth,
					y_inside = event.y - movement.tb.y + con.offsetHeight < window.innerHeight;
				// check if element will be outside of window
				if(x_inside && event.x - movement.tb.x >= 0)con.style.left = event.x - movement.tb.x + 'px'
				if(y_inside && event.y - movement.tb.y >= 0)con.style.top = event.y - movement.tb.y + 'px'
			}
		});
		
		window.addEventListener('keydown', event => {
			if(document.activeElement && document.activeElement.tagName == 'INPUT')return;
			
			ui.inputs[event.code] = true;
			
			var keybind = ui.keybinds.find(keybind => typeof keybind.code == 'string'
					? keybind.code == event.code || keybind.code.replace('Digit', 'Numpad') == event.code
					: keybind.code.some(keycode => keycode == event.code || keycode.replace('Digit', 'Numpad') == event.code));
			
			if(!keybind || event.repeat)return;
			
			keybind.interact(event); // call the keybind callback
		});
		
		window.addEventListener('keyup', event => {
			ui.inputs[event.code] = false;
		});
		
		ui.keybinds.push({
			code: ['KeyC', 'F1'],
			interact(){
				event.preventDefault();
				con.style.display = (ui.visible ^= 1) ? 'block' : 'none';
			},
		});
		
		array.forEach((tab, index) => {
			var tab_button = ui.add_ele(div, sidebar_con, {
					className: 'tab-button',
				}),
				tab_ele = ui.add_ele(div, cons, {
					className: 'content-con',
					style: index > 0 ? 'display:none' : '',
				});
			
			tab_nodes.push(tab_ele);
			
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
		
		ui.add_ele(div, main_border, { className: 'bar', innerHTML: footer });
		ui.add_ele(div, titlebar, { className: 'ver', innerHTML: 'v' + values.version });
		
		// clear all inputs when window is not focused
		window.addEventListener('blur', () => ui.inputs = []);
		
		setTimeout(align_con);
	},
});
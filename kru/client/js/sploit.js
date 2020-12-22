'use strict';
var fs = require('fs'),
	path = require('path'),
	events = require('events'),
	electron = require('electron'),
	cheat = {
		// wait for promise
		wf: (check, timeout = 5000) => new Promise((resolve, reject) => {
			var interval = setInterval(() => {
				var checked = check();
				
				if(checked)clearInterval(interval); else return;
				
				resolve(checked);
				interval = null;
			}, 15);
			
			setTimeout(() => {
				if(interval)return clearInterval(interval), reject('timeout');
			}, timeout);
		}),
	},
	// natives
	n = { CanvasRenderingContext2D_prototype: Object.defineProperties({}, Object.getOwnPropertyDescriptors(CanvasRenderingContext2D.prototype)), Function_prototype: Object.defineProperties({}, Object.getOwnPropertyDescriptors(Function.prototype)), Object: Object.defineProperties({}, Object.getOwnPropertyDescriptors(Object)), Reflect: Object.defineProperties({}, Object.getOwnPropertyDescriptors(Reflect)), Proxy: Proxy.bind() },
	// experimental hook
	uhook = (orig_func, handler) => {
		var func = n.Object.defineProperties(function(...args){ return n.Reflect.apply(handler, this, [orig_func, this, args]) }, n.Object.getOwnPropertyDescriptors(orig_func));
		
		n.Reflect.defineProperty(func, 'length', { value: orig_func.length, configurable: true, enumerable: false, writable: false });
		n.Reflect.defineProperty(func, 'name', { value: orig_func.name, configurable: true, enumerable: false, writable: false });
		func.toString = n.Reflect.apply(n.Function_prototype.bind, orig_func.toString, [orig_func]);
		func.toString.toString = orig_func.toString.toString;
		
		// function prototype usually undefined or void
		func.prototype = orig_func.prototype;
		
		return func
	},
	init = async () => {
		var values = await electron.ipcRenderer.invoke('sync_values').then(JSON.parse),
			config = values.config; // assign it too lazy to rewrite all stuff
		
		electron.ipcRenderer.on('receive_values', (event, data) => {
			values = JSON.parse(data);
			config = values.config;
		});
		
		// addon for game objects
		var add = Symbol();
		
		cheat = n.Object.assign(cheat, {
			syms: new n.Proxy({}, {
				get(target, prop){
					if(!target[prop])target[prop] = Symbol();
					
					return target[prop];
				}
			}),
			rnds: new n.Proxy({}, {
				get(target, prop){
					if(!target[prop])target[prop] = [...Array(16)].map(() => Math.random().toString(36)[2]).join('').replace(/(\d|\s)/, 'V').toLowerCase().substr(0, 6);
					
					return target[prop];
				}
			}),
			objs: new n.Proxy({}, {
				get(target, prop){
					if(!target[prop])target[prop] = cheat.object_list[~~(Math.random() * cheat.object_list.length)];
					
					return target[prop];
				}
			}),
			object_list: n.Object.keys(window).filter(label => window[label] && typeof window[label] == 'function' && String(window[label]) == 'function ' + label + '() { [native code] }'),
			vars_not_found: [],
			vars: {},
			materials_esp: new Proxy({}, {
				get(target, prop){
					if(!target[prop])target[prop] = new cheat.three.MeshBasicMaterial({
						transparent: true,
						fog: false,
						depthTest: false,
						color: prop,
					});
					
					return target[prop];
				},
			}),
			key_press: (keycode, keyname, keycode2, keyud) => document.dispatchEvent(new KeyboardEvent(keyud,{altKey:false,bubbles:true,cancelBubble:false,cancelable:true,charCode:0,code:keyname,composed:true,ctrlKey:false,currentTarget:null,defaultPrevented:true,detail:0,eventPhase:0,explicitOriginalTarget:document.body,isComposing:false,isTrusted:true,key:keyname,keyCode:keycode,layerX:0,layerY:0,location:0,metaKey:false,originalTarget:document.body,rangeOffset:0,rangeParent:null,repeat:false,returnValue:false,shiftKey:false,srcElement:document.body,target:document.body,timeStamp:Date.now(),type:keyud,view:parent,which:keycode})),
			log(...args){
				if(values.consts.ss_dev)console.log('%cShitsploit', 'background: #27F; color: white; border-radius: 3px; padding: 3px 2px; font-weight: 600', ...args);
				else console.log('%cDEBUG', 'background: #F72; color: white; border-radius: 3px; padding: 3px 2px; font-weight: 600', ...args);
				return true;
			},
			err(...args){
				if(values.consts.ss_dev)console.error('%cShitsploit', 'background: #F22; color: white; border-radius: 3px; padding: 3px 2px; font-weight: 600', '\n', ...args);
				else console.error('%cDEBUG', 'background: #F62; color: white; border-radius: 3px; padding: 3px 2px; font-weight: 600', '\n', ...args);
				return true;
			},
			wrld2scrn(pos, aY = 0){
				if(!cheat.cas)return { x: 0, y: 0 };
				
				var pos = Object.assign({}, pos, { y: pos.y + aY });
				
				cheat.world.camera.updateMatrix();
				cheat.world.camera.updateMatrixWorld();
				
				pos.project(cheat.world.camera);
				
				return {
					x: (pos.x + 1) / 2 * cheat.cas.width,
					y: (-pos.y + 1) / 2 * cheat.cas.height,
				}
			},
			util: {
				canSee(player, target, offset = 0){
					if(!player)return false;
					
					var d3d = cheat.util.getD3D(player.x, player.y, player.z, target.x, target.y, target.z),
						dir = cheat.util.getDir(player.z, player.x, target.z, target.x),
						dist_dir = cheat.util.getDir(cheat.util.getDistance(player.x, player.z, target.x, target.z), target.y, 0, player.y),
						ad = 1 / (d3d * Math.sin(dir - Math.PI) * Math.cos(dist_dir)),
						ae = 1 / (d3d * Math.cos(dir - Math.PI) * Math.cos(dist_dir)),
						af = 1 / (d3d * Math.sin(dist_dir)),
						height = player.y + (player.height || 0) - 1.15; // 1.15 = config.cameraHeight
					
					// iterate through game objects
					for(var ind in cheat.game.map.manager.objects){
						var obj = cheat.game.map.manager.objects[ind];
						
						if(
							!obj.noShoot &&
							obj.active &&
							(!obj.transparent || obj.penetrable && cheat.player.weapon.pierce)
						){
							var in_rect = cheat.util.lineInRect(player.x, player.z, height, ad, ae, af, obj.x - Math.max(0, obj.width - offset), obj.z - Math.max(0, obj.length - offset), obj.y - Math.max(0, obj.height - offset), obj.x + Math.max(0, obj.width - offset), obj.z + Math.max(0, obj.length - offset), obj.y + Math.max(0, obj.height - offset));
							
							if(in_rect && 1 > in_rect)return in_rect;
						}
					}
					
					// iterate through game terrain
					if(cheat.game.map.terrain){
						var al = cheat.game.map.terrain.raycast(player.x, -player.z, height, 1 / ad, -1 / ae, 1 / af);
						if(al)return cheat.util.getD3D(player.x, player.y, player.z, al.x, al.z, -al.y);
					}
					return null;
				},
				getDistance(x1, y1, x2, y2){
					return Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2);
				},
				getD3D(x1, y1, z1, x2, y2, z2){
					var dx = x1 - x2,
						dy = y1 - y2,
						dz = z1 - z2;
					
					return Math.sqrt(dx * dx + dy * dy + dz * dz);
				},
				getXDire: (x1, y1, z1, x2, y2, z2) => Math.asin(Math.abs(y1 - y2) / cheat.util.getD3D(x1, y1, z1, x2, y2, z2)) * ((y1 > y2) ? -1 : 1),
				getDir: (x1, y1, x2, y2) => Math.atan2(y1 - y2, x1 - x2),
				lineInRect(lx1, lz1, ly1, dx, dz, dy, x1, z1, y1, x2, z2, y2){
					var t1 = (x1 - lx1) * dx,
						t2 = (x2 - lx1) * dx,
						t3 = (y1 - ly1) * dy,
						t4 = (y2 - ly1) * dy,
						t5 = (z1 - lz1) * dz,
						t6 = (z2 - lz1) * dz,
						tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6)),
						tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
					
					return (tmax < 0 || tmin > tmax) ? false : tmin;
				},
			},
			round: (n, r) => Math.round(n * Math.pow(10, r)) / Math.pow(10, r),
			ctr(label, args = []){ // ctx raw
				if(!cheat.ctx)return;
				
				try{ return n.Reflect.apply(n.CanvasRenderingContext2D_prototype[label], cheat.ctx, args) }catch(err){ cheat.err(err); return {} }
			},
			find_match: async () => {
				if(cheat.finding_match)return;
				cheat.finding_match = true;
				
				var new_match,
					region = ({
						SYD: 'au-syd',
						TOK: 'jb-hnd',
						MIA: 'us-fl',
						SV: 'us-ca-sv',
						FRA: 'de-fra',
						SIN: 'sgp',
						NY: 'us-nj',
					})[('' + window.location.search).match(/\?game=(\w+)/)[1]],
					data = await fetch('https://matchmaker.krunker.io/game-list?hostname=' + window.location.host, { headers: { 'user-agent': navigator.userAgent } }),
					body = await data.text();
				
				try{
					data = JSON.parse(body);
				}catch(err){
					data.error = err
				}
				
				if(data.error)return cheat.err(data, body, data.error);
				
				new_match = data.games.map(([ match_id, match_region, match_players, match_max_players, gamemode ]) => ({
					id: match_id,
					region: match_region,
					players: match_players,
					max_players: match_max_players,
					gamemode: { name: gamemode.i, game_id: gamemode.v, custom: gamemode.cs }
				}))
				.sort((prev_match, match) => ((match.players >= 6 ? 4 : match.players) / match.max_players) * 100 - ((prev_match.players >= 6 ? 4 : prev_match.players) / prev_match.max_players) * 100)
				.find(match => !match.gamemode.custom && match.region == region && (match.players <= match.max_players - 2 || match.players <= match.max_players - 1));
				
				return new_match ? window.location.href = 'https://krunker.io?game=' +  new_match.id : 'could not find match';
			},
			process_interval: async () => { // run every 1000 ms
				if(!document.querySelector('#instructions'))return;
				
				var intxt = document.querySelector('#instructions').textContent;
				
				if(config.game.auto_respawn){
					if(/(disconnected|game is full|banned|kicked)/gi.test(intxt))cheat.find_match()
					else if(cheat.controls && (!cheat.player || !cheat.player[add].active) && /click to play/gi.test(intxt))cheat.controls.toggle(true);
				}
				
				document.querySelectorAll('.streamItem *').forEach(node => node.src = '');
			},
			find_target(){
				var targets = cheat.game.players.list.filter(ent => ent[add] && !ent[add].is_you && ent[add].canSee && ent[add].active && ent[add].enemy && (config.aim.frustrum_check ? ent[add].frustum : true)),
					target;
				
				switch(config.aim.target_sorting){
					case'dist3d':
						target = targets.sort((ent_1, ent_2) => ent_1[add].pos.distanceTo(ent_2) * (ent_1[add].frustum == ent_2[add].frustum ? 1 : 0.5) )[0];
						break
					case'hp':
						target = targets.sort((ent_1, ent_2) => (ent_1.health - ent_2.health) * (ent_1.inFrustrum == ent_2[add].frustum ? 1 : 0.5) )[0];
						break
					case'dist2d':
					default:
						target = targets.sort((ent_1, ent_2) => (cheat.center_vec.distanceTo(ent_1[add].pos2D) - cheat.center_vec.distanceTo(ent_2[add].pos2D)) * (ent_1[add].frustum == ent_2[add].frustum ? 1 : 0.5) )[0];
						break
				}
				
				return target;
			},
			procInputs(data){
				if(!cheat.controls || !cheat.player || !cheat.player[add])return;
				
				var keys = {frame: 0, delta: 1, xdir: 2, ydir: 3, moveDir: 4, shoot: 5, scope: 6, jump: 7, reload: 8, crouch: 9, weaponScroll: 10, weaponSwap: 11, moveLock: 12},
					move_dirs = { idle: -1, forward: 1, back: 5, left: 7, right: 3 },
					target = cheat.target = cheat.find_target();
				
				cheat.game.config.inc_deltaMlt = 0;
				cheat.moving_camera = false;
				
				// skid bhop
				if(config.game.bhop != 'off' && (cheat.inputs.Space || config.game.bhop == 'autojump' || config.game.bhop == 'autoslide')){
					cheat.controls.keys[cheat.controls.binds.jumpKey.val] ^= 1;
					if(cheat.controls.keys[cheat.controls.binds.jumpKey.val])cheat.controls.didPressed[cheat.controls.binds.jumpKey.val] = 1;
					
					if((document.activeElement.nodeName != 'INPUT' && config.game.bhop == 'keyslide' && cheat.inputs.Space || config.game.bhop == 'autoslide') && cheat.player[cheat.vars.yVel] < -0.02 && cheat.player.canSlide){
						setTimeout(() => cheat.controls.keys[cheat.controls.binds.crouchKey.val] = 0, 325);
						cheat.controls.keys[cheat.controls.binds.crouchKey.val] = 1;
					}
				}
				
				// auto reload, currentAmmo set earlier
				if(cheat.player && !cheat.player[cheat.vars.ammos][cheat.player[cheat.vars.weaponIndex]] && config.aim.auto_reload)data[keys.reload] = 1;
				
				if(config.aim.triggerbot && cheat.player[add].aiming){
					cheat.mid = new cheat.three.Vector2(0, 0);
					var pm = cheat.game.players.list.filter(ent => ent[add] && ent[add].obj && ent[add].enemy && ent[add].canSee && ent.health).map(ent => ent[add].obj);
					
					cheat.raycaster.setFromCamera(cheat.mid, cheat.world.camera), cheat.raycaster.intersectObjects(pm, true).length && (data[keys.shoot] = cheat.player[cheat.vars.didShoot] ? 0 : 1);
				}
				
				// aiming
				if(cheat.target && cheat.player.health && !data[keys.reload]){
					var yVal = target.y
							+ (target[cheat.syms.isAI] ? -(target.dat.mSize / 2) : (target.jumpBobY * cheat.gconfig.jumpVel) + 1 - target[add].crouch * 3),
						yDire = cheat.util.getDir(cheat.player[add].pos.z, cheat.player[add].pos.x, target.z, target.x),
						xDire = cheat.util.getXDire(cheat.player[add].pos.x, cheat.player[add].pos.y, cheat.player[add].pos.z, target.x, yVal, target.z),
						xv = xDire - cheat.player[cheat.vars.recoilAnimY] * 0.27,
						rot = {
							x: cheat.round(Math.max(-Math.PI / 2, Math.min(Math.PI / 2, xv )) % (Math.PI * 2), 3) || 0,
							y: cheat.round(yDire % (Math.PI * 2), 3) || 0,
						};
					
					// if fully aimed or weapon cant even be aimed or weapon is melee and nearby, shoot
					if(
						(config.aim.status == 'silent' || config.aim.status == 'full') && cheat.player[add].aiming
					)(cheat.player[cheat.vars.ammos][cheat.player[cheat.vars.weaponIndex]] || cheat.player.weapon.ammo == null) ? data[keys.shoot] = 1 : data[keys.reload] = 1;
					
					if(config.aim.smooth)switch(config.aim.status){
						case'assist':
							
							if(cheat.controls[cheat.vars.mouseDownR] || cheat.controls.keys[cheat.controls.binds.aimKey.val])cheat.moving_camera = {
								xD: rot.x,
								yD: rot.y,
							}
							
							break
						case'full':
						case'silent':
							
							if(cheat.player.weapon.nAuto && cheat.player[add].did_shoot)data[keys.shoot] = data[keys.scope] = 0;
							else data[keys.scope] = 1;
							
							if(data[keys.shoot] || cheat.player.weapon.melee)cheat.moving_camera = {
								xD: rot.x,
								yD: rot.y,
							}
							
							break
					}else switch(config.aim.status){
						case'silent':
							// dont shoot if weapon is on shoot cooldown
							if(cheat.player.weapon.nAuto && cheat.player[cheat.vars.didShoot])data[keys.shoot] = data[keys.scope] = 0;
							else data[keys.scope] = 1;
							
							// wait until we are shooting to look at enemy
							if(!data[keys.reload] && (data[keys.shoot] || cheat.player.weapon.melee)){
								data[keys.xdir] = rot.x * 1000;
								data[keys.ydir] = rot.y * 1000;
							}
							
							break
						case'assist':
							
							if(cheat.controls[cheat.vars.mouseDownR] || cheat.controls.keys[cheat.controls.binds.aimKey.val]){
								cheat.controls[cheat.vars.pchObjc].rotation.x = rot.x
								cheat.controls.object.rotation.y = rot.y
								
								data[keys.xdir] = rot.x * 1000;
								data[keys.ydir] = rot.y * 1000;
							}
							
							break
						case'full':
							if(cheat.player.weapon.nAuto && cheat.player[cheat.vars.didShoot])data[keys.scope] = data[keys.shoot] = 0;
							else data[keys.scope] = 1;
							
							if(data[keys.shoot] || cheat.player.weapon.melee){
								cheat.controls[cheat.vars.pchObjc].rotation.x = rot.x
								cheat.controls.object.rotation.y = rot.y
								data[keys.xdir] = rot.x * 1000
								data[keys.ydir] = rot.y * 1000
							}
							
							break
					}
				}
			},
			process(){ try{
				if(!cheat.game)return;
				
				if(!cheat.game.config.deltaMlt_hooked){
					cheat.game.config.deltaMlt_hooked = 1;
					
					setTimeout(() => {
						var orig_delta = cheat.game.config.deltaMlt || 1;
						Object.defineProperty(cheat.game.config, 'deltaMlt', {
							get: _ => orig_delta + (cheat.game.config.inc_deltaMlt ? cheat.game.config.inc_deltaMlt : 0),
							set: n => orig_delta = n,
						});
					}, 1000);
				}
				
				cheat.controls[cheat.vars.pchObjc].rotation.x -= cheat.inputs.ArrowDown ? 0.006 : 0;
				cheat.controls[cheat.vars.pchObjc].rotation.x += cheat.inputs.ArrowUp ? 0.006 : 0;
				
				cheat.controls.object.rotation.y -= cheat.inputs.ArrowRight ? 0.00675 : 0;
				cheat.controls.object.rotation.y += cheat.inputs.ArrowLeft ? 0.00675 : 0;
				
				cheat.controls.idleTimer = 0;
				
				cheat.game.config.thirdPerson = config.game.thirdperson ? true : false;
				
				if(!cheat.controls || !cheat.world || !cheat.player)return;
				
				cheat.game.players.list.forEach(ent => {
					if(!ent[add])ent[add] = {
						pos: {
							distanceTo(p2){return Math.hypot(this.x - p2.x, this.y - p2.y, this.z - p2.z)},
							get x(){ return ent.x || 0 },
							get y(){ return ent.y || 0 },
							get z(){ return ent.z || 0 },
							project(t){ return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)},
							applyMatrix4: function(t){var e=this.x,n=this.y,r=this.z,i=t.elements,a=1/(i[3]*e+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*e+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*e+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*e+i[6]*n+i[10]*r+i[14])*a,this},
						},
						get aiming(){
							return !ent[cheat.vars.aimVal] || ent.weapon.noAim || cheat.target && cheat.target[add] && ent.weapon.melee && ent[add].pos.distanceTo(cheat.target[add].pos) <= 18;
						},
						get crouch(){ return ent[cheat.vars.crouchVal] },
						get obj(){ return ent?.lowerBody?.parent?.parent },
						// [cheat.vars.objInstances] },
						get max_health(){ return ent[cheat.vars.maxHealth] },
						get pos2D(){ return ent.x != null ? cheat.wrld2scrn(ent[add].pos) : { x: 0, y: 0 } },
						get canSee(){
							return ent[add].active && cheat.util.canSee(cheat.player, ent) == null ? true : false;
						},
						get frustum(){ return ent[add].active && n.Reflect.apply(cheat.three.Frustum.prototype.containsPoint, cheat.world.frustum, [ ent[add].pos ]); },
						get active(){ return ent.x != null && cheat.ctx && ent[add].obj && ent.health > 0 },
						get enemy(){ return !ent.team || ent.team != cheat.player.team },
						get did_shoot(){ return ent[cheat.vars.didShoot] },
						risk: ent.isDev || ent.isMod || ent.isMapMod || ent.canGlobalKick || ent.canViewReports || ent.partnerApp || ent.canVerify || ent.canTeleport || ent.isKPDMode || ent.level >= 30,
						is_you: ent[cheat.vars.isYou],
						get inview(){
							return ent[cheat.vars.inView];
						},
						set inview(v){
							ent[cheat.vars.inView] = v;
						},
					}
					
					if(!ent[add].active)return;
					
					// we are at fastest tick so we can do this
					if(ent[add].obj)ent[add].obj.visible = true;
					
					ent[add].inview = cheat.hide_nametags ? false : config.esp.nametags ? ent[add].frustum : ent[add].enemy ? ent[add].canSee : true;
				});
			}catch(err){ cheat.err('CAUGHT:', err) }},
			render(){ try{ // rendering tasks
				if(!cheat.cas || !cheat.ctx){
					cheat.cas = document.querySelector('#game-overlay');
					cheat.ctx = cheat.cas ? cheat.cas.getContext('2d', { alpha: true }) : {};
					
					cheat.center_vec = {
						x: window.innerWidth / 2,
						y: window.outerHeight / 2,
						distanceTo(p2){return Math.hypot(this.x - p2.x, this.y - p2.y)}
					}
				}
				
				cheat.ctr('resetTransform');
				
				if(config.esp.minimap){
					var cm = cheat.game.map.maps[cheat.game.map.lastGen];
					
					if(!cm)return;
					
					if(!cm.mm || !cm.dims){
						cm.mm = {
							scale: 6,
							offset: {
								x: 100,
								y: 75,
							},
							player_size: {
								w: 5,
								h: 5
							},
						};
						
						cm.objs = cm.objects.map(obj => ({ collision: !(obj.l || obj.col), pos: { x: obj.p[0], y: obj.p[1], z: obj.p[2] }, size: { x: obj.s[0], y: obj.s[1], z: obj.s[2] }, color: obj.c, opacity: obj.o == null ? 1 : obj.o  })).filter(obj =>
							obj.collision &&
							obj.opacity &&
							obj.color &&
							obj.size.x &&
							obj.size.y && 
							obj.size.z &&
							obj.pos.y);
						
						cm.dims = { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } };
						
						cm.objs.forEach(obj => {
							cm.dims.min.x = obj.pos.x < cm.dims.min.x ? obj.pos.x : cm.dims.min.x;
							cm.dims.max.x = obj.pos.x > cm.dims.min.x ? obj.pos.x : cm.dims.min.x;
							
							cm.dims.min.z = obj.pos.z < cm.dims.min.z ? obj.pos.z : cm.dims.min.z;
							cm.dims.max.z = obj.pos.z > cm.dims.min.z ? obj.pos.z : cm.dims.min.z;
						});
						
						cm.dims.size = {
							w: Math.abs(cm.dims.min.x) + Math.abs(cm.dims.max.x),
							h: Math.abs(cm.dims.min.z) + Math.abs(cm.dims.max.z),
						};
						
						cm.dims.min.x_abs = Math.abs(cm.dims.min.x);
						cm.dims.min.z_abs = Math.abs(cm.dims.min.z);
						
						cm.objs = cm.objs.sort((pobj, obj) => (pobj.pos.y + pobj.size.y) - (obj.pos.y + obj.size.y));
						
						cm.obj_calc = cm.objs.map(obj => {
							var cth = c => ((~~c).toString(16) + '').padStart(2, '0'),
								htc = h => {
									var [r, g, b] = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h).slice(1).map(n => parseInt(n, 16));
									
									return { r: r, g: g, b: b };
								},
								color = htc(obj.color.length == 4 ? '#' + obj.color.substr(1).split('').map(e => e+e).join('') : obj.color),
								inc = (obj.pos.y + obj.size.y) / 3;
							
							return [
								'#' + cth(color.r - inc) + cth(color.g - inc) + cth(color.b - inc),
								[
									~~(cm.mm.offset.x + ((cm.dims.min.x_abs + obj.pos.x) / cm.mm.scale)),
									~~(cm.mm.offset.y + ((cm.dims.min.z_abs + obj.pos.z) / cm.mm.scale)),
									~~(obj.size.x / cm.mm.scale),
									~~(obj.size.z / cm.mm.scale)
								],
							];
						});
					}
					
					cm.obj_calc.forEach(calculated => (cheat.ctx.fillStyle = calculated[0], cheat.ctr('fillRect', calculated[1])));
					
					cheat.game.players.list.filter(ent => ent[add] && ent[add].active).forEach(ent => {
						var wp = cm.dims.min.x_abs + ent[add].pos.x,
							hp = cm.dims.min.z_abs + ent[add].pos.z,
							cham_color = ent[add].is_you ? '#FFF' : (ent[add].enemy ? ent[add].risk ? '#F70' : '#F00' : '#0F0');
						
						cheat.ctx.fillStyle = cheat.ctx.strokeStyle = cham_color;
						
						cheat.ctr('beginPath');
						cheat.ctr('arc', [ cm.mm.offset.x + (wp / cm.mm.scale), cm.mm.offset.y + (hp / cm.mm.scale), 3, 0, 2 * Math.PI ]);
						cheat.ctr('fill');
						
						if(ent[add].is_you){
							cheat.ctr('beginPath');
							cheat.ctr('moveTo', [ cm.mm.offset.x + (wp / cm.mm.scale), cm.mm.offset.y + (hp / cm.mm.scale) ]);
							
							var scalar = -250,
								x = 0,
								y = 0,
								z = 1,
								qx = ent[add].obj.quaternion.x,
								qy = ent[add].obj.quaternion.y,
								qz = ent[add].obj.quaternion.z,
								qw = ent[add].obj.quaternion.w, // calculate quat * vector
								ix = qw * x + qy * z - qz * y,
								iy = qw * y + qz * x - qx * z,
								iz = qw * z + qx * y - qy * x,
								iw = -qx * x - qy * y - qz * z, // calculate result * inverse quat
								nwp = cm.dims.min.x_abs + ent[add].pos.x + (ix * qw + iw * -qx + iy * -qz - iz * -qy) * scalar,
								nhp = cm.dims.min.z_abs + ent[add].pos.z + (iz * qw + iw * -qz + ix * -qy - iy * -qx) * scalar;
							
							cheat.ctx.strokeStyle = cham_color;
							cheat.ctx.lineWidth = 1.75;
							cheat.ctx.lineCap = 'round';
							
							cheat.ctr('lineTo', [ cm.mm.offset.x + (nwp / cm.mm.scale) - cm.mm.player_size.w / 2, cm.mm.offset.y + (nhp / cm.mm.scale) - cm.mm.player_size.h / 2 ]);
							cheat.ctr('stroke');
						}
					});
				}
				
				// draw overlay stuff
				if(config.game.overlay && cheat.game && cheat.ctx){
					cheat.ctx.strokeStyle = '#000'
					cheat.ctx.font = 'Bold 14px Inconsolata, monospace';
					cheat.ctx.textAlign = 'start';
					cheat.ctx.lineWidth = 2.6;
					
					[
						[['#BBB', 'Player: '], ['#FFF', cheat.player && cheat.player[add] && cheat.player[add].pos ? ['x', 'y', 'z'].map(axis => axis + ': ' + cheat.player[add].pos[axis].toFixed(2)).join(', ') : 'N/A']],
						[['#BBB', 'Target: '], ['#FFF', cheat.target && cheat.target.isActive ? cheat.target.alias + ', ' + ['x', 'y', 'z'].map(axis => axis + ': ' + cheat.target.pos[axis].toFixed(2)).join(', ') : 'N/A']],
						[['#BBB', 'Hacker: '], [window.activeHacker ? '#0F0' : '#F00', window.activeHacker ? 'TRUE' : 'FALSE']],
						[['#BBB', 'Aiming: '], [cheat.player && cheat.player[add] && cheat.player[add].aiming ? '#0F0' : '#F00', cheat.player && cheat.player[add] && cheat.player[add].aiming ? 'TRUE' : 'FALSE']],
					].forEach((line, index, lines) => {
						var text_xoffset = 0;
						
						line.forEach(([ color, string ], text_index) => {
							var textX = 12 + text_xoffset + text_index * 2,
								textY = (cheat.cas.height / 2) - ((lines.length * 30) / 2) + index * 20;
							
							cheat.ctx.fillStyle = color;
							
							cheat.ctr('strokeText', [string, textX, textY]);
							cheat.ctr('fillText', [string, textX, textY]);
							
							text_xoffset += cheat.ctr('measureText', [string]).width;
						});
					});
				}
				
				if(!cheat.game || !cheat.controls || !cheat.world)return;
				
				cheat.world.scene.children.forEach(item => {
					// return if item is not what we are looking for
					if(item.type != 'Mesh' || !item.dSrc)return;
					
					// store original material data
					if(!item.orig_mat)item.orig_mat = { ... item.material };
					
					item.material.transparent = config.esp.walls ? true : item.orig_mat.transparent;
					item.material.opacity = config.esp.walls ? item.orig_mat.opacity * config.esp.wall_opacity : item.orig_mat.opacity;
				});
				
				cheat.game.players.list.filter(ent => ent[add] && ent[add].active && ent[add].frustum && !ent[add].is_you).forEach(ent => {
					var src_pos = cheat.wrld2scrn(ent[add].pos),
						src_pos_crouch = cheat.wrld2scrn(ent[add].pos, ent.height - ent[add].crouch * 3),
						esp_width = ~~((src_pos.y - cheat.wrld2scrn(ent[add].pos, ent.height).y) * 0.7),
						esp_height = src_pos.y - src_pos_crouch.y,
						esp_box_y = src_pos.y - esp_height,
						// teammate = green, enemy = red, risk + enemy = orange
						cham_color = ent[add].is_you ? '#FFF' : ent[add].enemy ? ent[add].risk ? '#F70' : '#F00' : '#0F0',
						cham_color_full = parseInt(cham_color.substr(1).split('').map(e => e+e).join(''), 16), // turn #FFF into #FFFFFF
						chams_enabled = config.esp.status == 'chams' || config.esp.status == 'box_chams' || config.esp.status == 'full';
					
					if(ent[add].obj)ent[add].obj.traverse(obj => {
						if(obj.type != 'Mesh')return;
						
						obj.material.wireframe = !!config.game.wireframe;
						
						if(ent[add].is_you)return;
						
						if(chams_enabled && obj.material.type != 'MeshBasicMaterial'){ // set material
							if(!obj.orig_mat)obj.orig_mat = Object.assign(Object.create(Object.getPrototypeOf(obj.material)), obj.material);
							
							obj.material = cheat.materials_esp[cham_color];
						// update color
						}else if(chams_enabled && obj.material.type == 'MeshBasicMaterial')obj.material.color.setHex(cham_color_full)
						// remove material
						else if(!chams_enabled && obj.orig_mat && obj.material.type == 'MeshBasicMaterial')obj.material = obj.orig_mat
					});
					
					// box ESP
					if(config.esp.status == 'box' || config.esp.status == 'box_chams' || config.esp.status == 'full'){
						cheat.ctx.strokeStyle = cham_color
						cheat.ctx.lineWidth = 1.5;
						cheat.ctr('strokeRect', [src_pos.x - esp_width / 2,  esp_box_y, esp_width, esp_height]);
					}
					
					// health bar, red - yellow - green gradient
					var hp_perc = (ent.health / ent[add].max_health) * 100;
					
					if(config.esp.status == 'full' || config.esp.health_bars){
						var hp_grad = cheat.ctr('createLinearGradient', [0, src_pos.y - esp_height, 0, src_pos.y - esp_height + esp_height]),
							box_ps = [src_pos.x - esp_width, src_pos.y - esp_height, esp_width / 4, esp_height];
						
						if(typeof hp_grad.addColorStop != 'function')return;
						
						hp_grad.addColorStop(0, '#F00');
						hp_grad.addColorStop(0.5, '#FF0');
						hp_grad.addColorStop(1, '#0F0');
						
						// background of thing
						cheat.ctx.strokeStyle = '#000';
						cheat.ctx.lineWidth = 2;
						cheat.ctx.fillStyle = '#666';
						cheat.ctr('strokeRect', box_ps);
						
						// inside of it
						cheat.ctr('fillRect', box_ps);
						
						// colored part
						cheat.ctx.fillStyle = hp_grad
						cheat.ctr('fillRect', [box_ps[0], box_ps[1], box_ps[2], (hp_perc / 100) * esp_height]);
					}
					
					// full ESP
					cheat.hide_nametags = config.esp.status == 'full'
					if(config.esp.status == 'full'){
						// text stuff
						var hp_red = hp_perc < 50 ? 255 : Math.round(510 - 5.10 * hp_perc),
							hp_green = hp_perc < 50 ? Math.round(5.1 * hp_perc) : 255,
							hp_color = '#' + ('000000' + (hp_red * 65536 + hp_green * 256 + 0 * 1).toString(16)).slice(-6),
							player_dist = cheat.player[add].pos.distanceTo(ent[add].pos),
							text_x = src_pos_crouch.x + 12 + (esp_width / 2),
							text_y = src_pos.y - esp_height,
							yoffset = 0,
							font_size = 11 - (player_dist * 0.005);
						
						cheat.ctx.textAlign = 'middle';
						cheat.ctx.font = 'Bold ' + font_size + 'px Tahoma';
						cheat.ctx.strokeStyle = '#000';
						cheat.ctx.lineWidth = 2.5;
						
						[
							[['#FB8', ent.alias], ent.clan ? ['#FFF', ' [' + ent.clan + ']'] : null],
								[[hp_color, ent.health + '/' + ent[add].max_health + ' HP']],
							// player weapon & ammo
							[['#FFF', ent.weapon.name ],
								['#BBB', '['],
								['#FFF', (ent.weapon.ammo || 'N') + '/' + (ent.weapon.ammo || 'A') ],
								['#BBB', ']']],
							[['#BBB', 'Risk: '], [(ent[add].risk ? '#0F0' : '#F00'), ent[add].risk]],
							[['#BBB', 'Shootable: '], [(ent[add].canSee ? '#0F0' : '#F00'), ent[add].canSee]],
							[['#BBB', '['], ['#FFF', ~~(player_dist / 10) + 'm'], ['#BBB', ']']],
						].forEach((line, text_index) => {
							var texts = line.filter(entry => entry),
								xoffset = 0;
							
							texts.forEach(([ color, text ]) => {
								cheat.ctx.fillStyle = color;
								
								cheat.ctr('strokeText', [text, text_x + xoffset, text_y + yoffset]);
								cheat.ctr('fillText', [text, text_x + xoffset, text_y + yoffset]);
								
								xoffset += cheat.ctr('measureText', [ text ]).width + 2;
							});
							
							yoffset += font_size + 2;
						});
					}
					
					// tracers
					if(config.esp.tracers){
						cheat.ctx.strokeStyle = cham_color;
						cheat.ctx.lineWidth = 1.75;
						cheat.ctx.lineCap = 'round';
						
						cheat.ctr('beginPath');
						cheat.ctr('moveTo', [cheat.cas.width / 2, cheat.cas.height]);
						cheat.ctr('lineTo', [src_pos.x, src_pos.y - esp_height / 2]);
						cheat.ctr('stroke');
					}
				});
			}catch(err){ cheat.err(err) }},
			find_vars: [
				['isYou', /this\['accid'\]=0x0,this\['(\w+)'\]=\w+,this\['isPlayer'\]/, 1],
				// ['objInstances', /continue;if\(\S+\['\S+']\|\|!U\['(\S+)']\)continue;if\(!\S+\['(\S+)']\)continue/, 1],
				['inView', /&&!\w\['\w+']&&\w\['\w+'\]&&\w\['(\w+)']\){/, 1],
				['pchObjc', /0x0,this\['(\w+)']=new \w+\['Object3D']\(\),this/, 1],
				['aimVal', /this\['(\w+)']-=0x1\/\(this\['weapon']\['aimSpd']/, 1],
				['crouchVal', /this\['(\w+)']\+=\w\['crouchSpd']\*\w+,0x1<=this\['\w+']/, 1],
				// ['canSee', /\w+\['(\w+)']\(\w+,\w+\['x'],\w+\['y'],\w+\['z']\)\)&&/, 1],
				['didShoot', /--,\w+\['(\w+)']=!0x0/, 1],
				['ammos', /\['length'];for\(\w+=0x0;\w+<\w+\['(\w+)']\['length']/, 1],
				['weaponIndex', /\['weaponConfig']\[\w+]\['secondary']&&\(\w+\['(\w+)']==\w+/, 1],
				['maxHealth', /\['regenDelay'],this\['(\w+)']=\w+\['mode'\]&&\w+\['mode']\['\1']/, 1],
				['yVel', /this\['y']\+=this\['(\w+)']\*\w+\['map']\['config']\['speedY']/, 1],
				['mouseDownR', /this\['(\w+)']=0x0,this\['keys']=/, 1], 
				['recoilAnimY', /this\['reward']=0x0,this\['\w+']=0x0,this\['(\w+)']=0x0,this\['\w+']=0x0,this\['\w+']=0x1,this\['slideLegV']/, 1],
				/*
				['reloadTimer', /this\['(\w+)']-=\w+,\w+\['reloadUIAnim']/, 1],
				['recoilAnimY', /this\['(\w+)']=0x0,this\['recoilForce'\]=0x0/, 1],
				['noclip', /Noclip\\x20-\\x20'\+\(\w+\['(\w+)']\?'Enabled/, 1],
				['nAuto', /!this\['doingInter']\){var \w+=this\['\w+']\|\|!this\['weapon']\['(\w+)']&&a0\[0x5];/, 1],
				['xVel', /this\['x']\+=this\['(\w+)']\*\w+\['map']\['config']\['speedX']/, 1],
				['zVel', /this\['z']\+=this\['(\w+)']\*\w+\['map']\['config']\['speedZ']/, 1],
				['xDire', /this\['(\w+)']=\w+\['round']\(0x3\),this\['(\w+)']=\w+\['round']/, 1],
				['yDire', /this\['(\w+)']=\w+\['round']\(0x3\),this\['(\w+)']=\w+\['round']/, 2],
				*/
			],
			patches: new Map([
				// wallbangs
				// [/\['noShoot']&&(\w+)\['active']&&\(!\1\['transparent']\|\|(\w+)\)/, '.noShoot && $1.active && ($1.transparent || $2 || (ssd.config.aim.wallbangs && ssd.player && ssd.player.weapon) ? (!$1.penetrable || !ssd.player.weapon.pierce) : true)'],
				
				// get vars
				[/(this\['moveObj']=func)/, 'ssd.game = this, $1'],
				[/(this\['backgroundScene']=)/, 'ssd.world = this, $1'],
				[/(this\['\w+']=function\(\w+,\w+,\w+,\w+\){)(this\['recon'])/, '$1 { ssd.procInputs(...arguments) }; $2'],
				
				// have a proper interval for rendering
				[/requestAnimFrame\(/g, 'ssd.frame(requestAnimFrame, '],
				[/requestAnimFrameF\(/g, 'ssd.frame(requestAnimFrameF, '],
				
				[/function \w+\(\w+\){if\(\w+\[\w+]\)return \w+\[\w+]\['exp/, 'ssd.__webpack_require__ = c; $&'],
				
				[/^/, 'ssd.info("injected"), '],
				
				[/(\w+)\['skins'](?!=)/g, 'ssd.skin($1)'],
				
				[/aHolder\['style']\['display']/, 'aHolder.style.piss'],
			]),
			storage: {
				skins: [...new Uint8Array(5e2)].map((e, i) => ({ ind: i, cnt: 1 })),
				get config(){ return config },
				get player(){ return cheat.player || { weapon: {} } },
				get target(){ return cheat.target || {} },
				set __webpack_require__(nv){
					cheat.__webpack_require__ = nv;
					
					cheat.wf(() => cheat.__webpack_require__.c).then(exports => n.Object.entries({
						// util: ['hexToRGB', 'keyboardMap'],
						gconfig: [ 'isNode', 'isComp', 'isProd' ],
						ws: ['ahNum', 'connected', 'socketId', 'send', 'trackPacketStats'],
						overlay: ['render', 'canvas'],
						colors: ['challLvl', 'getChallCol', 'premium', 'partner'],
						shop: ['purchases', 'previews', 'premium', 'events'],
					}).forEach(([ label, entries ]) => Object.values(exports).filter(mod => mod && mod.exports).forEach(mod => (!entries.some(entry => !n.Reflect.apply(n.Object.prototype.hasOwnProperty, mod.exports, [ entry ])) && (cheat[label] = mod.exports)))));
				},
				set game(nv){
					cheat.game = nv;
				},
				set world(nv){
					cheat.world = nv;
				},
				skin(player){
					return config.game.skins ? Object.assign(cheat.storage.skins, player.skins) : player.skins;
				},
				frame(frame, func){
					cheat.player = cheat.game ? cheat.game.players.list.find(player => player[cheat.vars.isYou]) : null;
					cheat.controls = cheat.game ? cheat.game.controls : null;
					
					if(cheat.world)cheat.world.scene.onBeforeRender = cheat.process;
					
					if(cheat.ws && !cheat.ws[cheat.syms.hooked]){
						cheat.ws[cheat.syms.hooked] = true;
						
						cheat.ws.send = uhook(cheat.ws.send, (target, that, [label, ...data]) => {
							if(label == 'ent' && config.game.skins)cheat.skin_conf = {
								weapon: data[0][2],
								hat: data[0][3],
								body: data[0][4],
								knife: data[0][9],
								dye: data[0][14],
								waist: data[0][17],
							};
							
							return n.Reflect.apply(target, that, [label, ...data]);
						});
						
						cheat.ws._dispatchEvent = uhook(cheat.ws._dispatchEvent, (target, that, [ label, data ]) => {
							if(config.game.skins && label[0] == 0 && cheat.skin_conf){
								// sending server player data
								var player_size = 38,
									pd = data[0];
								
								for(;pd.length % player_size != 0;)player_size++;
								
								for(var i = 0; i < pd.length; i += player_size)if(pd[i] == cheat.ws.socketId){
									pd[i + 12] = cheat.skin_conf.weapon;
									pd[i + 13] = cheat.skin_conf.hat;
									pd[i + 14] = cheat.skin_conf.body;
									pd[i + 19] = cheat.skin_conf.knife;
									pd[i + 25] = cheat.skin_conf.dye;
									pd[i + 33] = cheat.skin_conf.waist;
								}
							}
							
							return n.Reflect.apply(target, that, [ label, data ]);
						});
					}
					
					if(cheat.controls && cheat.gconfig && !cheat.gconfig[cheat.syms.hooked]){
						cheat.gconfig[cheat.syms.hooked] = true;
						
						var orig_camChaseTrn = cheat.gconfig.camChaseTrn,
							orig_target = cheat.controls.target;
						
						// 0.025
						
						n.Reflect.defineProperty(cheat.gconfig, 'camChaseTrn', {
							get: _ => cheat.moving_camera ? ((50 - config.aim.smoothn) / 1000) : orig_camChaseTrn,
							set: v => orig_camChaseTrn = v,
						});
						
						n.Reflect.defineProperty(cheat.controls, 'target', {
							get: _ => cheat.moving_camera ? cheat.moving_camera : orig_target,
							set: v => orig_target = v,
						});
					}
					
					cheat.render();
					
					return n.Reflect.apply(frame, window, [ func ]);
				},
				proxy: class {
					constructor(input){
						return input;
					}
				},
				get log(){ return cheat.log },
				get err(){ return cheat.err },
				info(data){
					switch(data){
						case'injected':
							
							cheat.log('injected to game');
							
							cheat.log('hiding: ' + cheat.objs.storage + '.' + cheat.rnds.storage, window[cheat.objs.storage][cheat.rnds.storage]);
							window[cheat.objs.storage][cheat.rnds.storage] = void 0;
							
							break
					}
				},
			},
			inputs: [],
		}); 
		
		// pass storage object to game
		cheat.patches.set(/^/, '((ssd, Proxy) => { return ');
		cheat.patches.set(/$/g, '})(' + cheat.objs.storage + '.' + cheat.rnds.storage + '(), ' + cheat.objs.storage + '.' + cheat.rnds.storage + '().proxy,)');
		
		setInterval(cheat.process_interval, 1000);
		
		cheat.storage.procInputs = cheat.procInputs;
		
		electron.ipcRenderer.on('keydown', (event, data) => (document.activeElement ? document.activeElement.nodeName != 'INPUT' : true) && (cheat.inputs[data.code] = true));
		electron.ipcRenderer.on('keyup', (event, data) => cheat.inputs[data.code] = false);
		
		electron.ipcRenderer.on('esc', () => {
			document.exitPointerLock();
			
			cheat.key_press(18, 'Alt', 'AltLeft', 'keydown');
			cheat.key_press(18, 'Alt', 'AltLeft', 'keyup');
		});
		
		// remove later
		window.cheese = cheat;
		
		window.prompt = text => electron.ipcRenderer.sendSync('prompt', { type: 'text', data: text });
		
		// clear all inputs when window is not focused
		window.addEventListener('blur', () => cheat.inputs = []);
		
		cheat.raycaster = new cheat.three.Raycaster();
		
		cheat.wf(() => document && document.head).then(() => { try{
			// load cheat font
			new window.FontFace('Inconsolata', 'url("https://fonts.gstatic.com/s/inconsolata/v20/QldgNThLqRwH-OJ1UHjlKENVzkWGVkL3GZQmAwLYxYWI2qfdm7Lpp4U8WR32lw.woff2")', {
				family: 'Inconsolata',
				style: 'normal',
				weight: 400,
				stretch: '100%',
				unicodeRange: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
			}).load().then(font => document.fonts.add(font));
			
			cheat.wf(() => document.querySelector('#subLogoButtons')).then(() => {
				// safer to use queryselectorall incase the element does not exist
				document.querySelectorAll('.menuItemIcon').forEach(node => node.style.height = '60px');
				document.querySelectorAll('.downloadClient, #merchImg').forEach(node => node.remove());
				
				var button = document.querySelector('#subLogoButtons').appendChild(document.createElement('div'));
				button.setAttribute('class', 'button small buttonB');
				button.addEventListener('mouseenter', window.playTick);
				button.addEventListener('click', () => window.location.href = 'https://krunker.io');
				button.innerHTML = 'Find game';
			}, 7500);
			
			var clean_func = func => new Proxy(()=>{}, { apply: (bad_func, ...args) => n.Reflect.apply(func, ...args) }),
				sanitize = str => [...str].map(char => '&#' + char.charCodeAt() + ';').join(''),
				util = require('util'),
				log_func = (...args) => electron.ipcRenderer.send('add_log', {
					log: sanitize(util.format(...args)),
					color: '#FFF',
				}),
				err_func = (...args) => electron.ipcRenderer.send('add_log', {
					log: sanitize(util.format(...args)),
					color: '#F33',
				});
			
			// load js
			fs.readdirSync(values.folders.js).filter(file_name => path.extname(file_name).match(/\.js$/i)).map(file_name => fs.readFileSync(path.join(values.folders.js, file_name), 'utf8')).forEach(data => { try{
				n.Reflect.apply(n.Reflect.construct(window.Function, ['unsafeWindow', 'sploit', 'console', data]), window, [
					window,
					sploit_safe, 
					{ log: clean_func(log_func), error: clean_func(err_func) },
				]);
			}catch(err){ err_func(err) }});
		}catch(err){ console.trace(err) } });
	},
	inject = () => window.HTMLBodyElement.prototype.appendChild = uhook(window.HTMLBodyElement.prototype.appendChild, (target, that, [ node ]) => {
		var ret = n.Reflect.apply(target, that, [node]);
		
		if(node.nodeName == 'IFRAME' && node.style.display == 'none'){
			/*
			// webassembly ran in an iframe while electron uses
			// a preload throws an error in later versions
			*/
			node.contentWindow.WebAssembly = window.WebAssembly;
			node.contentWindow.Response.prototype.arrayBuffer = uhook(node.contentWindow.Response.prototype.arrayBuffer, (target_buf, that, args) => n.Reflect.apply(target_buf, that, args).then(ret => {
				var arr = new Uint8Array(ret),
					// first character of game is !
					xor_key = arr[0] ^ '!'.charCodeAt(),
					code = Array.from(arr).map(chr => String.fromCharCode(chr ^ xor_key)).join('');
				
				// if another piece of code is fetched
				if(!code.includes('isProd'))return ret;
				
				// restore functions
				node.contentWindow.Response.prototype.arrayBuffer = target_buf;
				window.HTMLBodyElement.prototype.appendChild = target;
				
				// find stuff and patch stuff
				cheat.patches.forEach((replacement, regex) => code = code.replace(regex, replacement));
				cheat.find_vars.forEach(([ label, regex, pos ]) => {
					var match = code.match(regex);
					
					if(match && match[pos])cheat.vars[label] = match[pos];
					else cheat.vars_not_found.push(label), cheat.vars[label] = label;
				});
				
				if(cheat.vars_not_found.length)cheat.err('Could not find: ' + cheat.vars_not_found.join(', '));
				
				window[cheat.objs.storage][cheat.rnds.storage] = uhook(window[cheat.objs.storage], () => cheat.storage);
				
				return new Promise((resolve, reject) => resolve(Uint8Array.from([...code].map(char => char.charCodeAt() ^ xor_key))));
			}));
		}
		
		return ret;
	});

// sploit module is called with (three), only exposed part is threejs
module.exports = three => cheat.three = three;

init();
inject();
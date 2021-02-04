module.exports = (cheat, data) => {
	var keys = {frame: 0, delta: 1, xdir: 2, ydir: 3, moveDir: 4, shoot: 5, scope: 6, jump: 7, reload: 8, crouch: 9, weaponScroll: 10, weaponSwap: 11, moveLock: 12},
		move_dirs = { idle: -1, forward: 1, back: 5, left: 7, right: 3 },
		target = cheat.target = cheat.game.players.list.filter(ent => ent[cheat.add] && !ent[cheat.add].is_you && ent[cheat.add].canSee && ent[cheat.add].active && ent[cheat.add].enemy && (cheat.config.aim.frustrum_check ? ent[cheat.add].frustum : true)).sort(cheat.sorts.norm)[0],
		pm = cheat.game.players.list.filter(ent => ent && ent[cheat.add] && ent[cheat.add].active && ent[cheat.add].enemy && ent[cheat.add].canSee).map(ent => ent[cheat.add].obj);
	
	// bhop
	if(cheat.config.game.bhop != 'off' && (cheat.ui.inputs.Space || cheat.config.game.bhop == 'autojump' || cheat.config.game.bhop == 'autoslide')){
		cheat.controls.keys[cheat.controls.binds.jumpKey.val] ^= 1;
		if(cheat.controls.keys[cheat.controls.binds.jumpKey.val])cheat.controls.didPressed[cheat.controls.binds.jumpKey.val] = 1;
		
		if((parent.document.activeElement.nodeName != 'INPUT' && cheat.config.game.bhop == 'keyslide' && cheat.ui.inputs.Space || cheat.config.game.bhop == 'autoslide') && cheat.player[cheat.vars.yVel] < -0.02 && cheat.player.canSlide){
			setTimeout(() => cheat.controls.keys[cheat.controls.binds.crouchKey.val] = 0, 325);
			cheat.controls.keys[cheat.controls.binds.crouchKey.val] = 1;
		}
	}
	
	// auto reload, currentAmmo set earlier
	if(cheat.player && !cheat.player[cheat.vars.ammos][cheat.player[cheat.vars.weaponIndex]] && cheat.config.aim.auto_reload)data[keys.reload] = 1;
	
	cheat.moving_camera = false;
	
	if(cheat.config.aim.status == 'triggerbot' && cheat.player[cheat.add].aiming){
		cheat.raycaster.setFromCamera({ x: 0, y: 0 }, cheat.world.camera);
		if(cheat.raycaster.intersectObjects(pm, true).length)data[keys.shoot] = cheat.player[cheat.vars.didShoot] ? 0 : 1;
	}else if(cheat.target && cheat.player.health && !data[keys.reload]){
		var yVal = target.y + (target[cheat.syms.isAI] ? -(target.dat.mSize / 2) : (target.jumpBobY * 0.072) + 1 - target[cheat.add].crouch * 3),
			yDire = cheat.util.getDir(cheat.player[cheat.add].pos.z, cheat.player[cheat.add].pos.x, target.z, target.x),
			xDire = cheat.util.getXDire(cheat.player[cheat.add].pos.x, cheat.player[cheat.add].pos.y, cheat.player[cheat.add].pos.z, target.x, yVal, target.z),
			xv = xDire - cheat.player[cheat.vars.recoilAnimY] * 0.27,
			rot = {
				x: cheat.round(Math.max(-cheat.util.halfpi, Math.min(cheat.util.halfpi, xv )) % cheat.util.pi2, 3) || 0,
				y: cheat.util.normal_radian(cheat.round(yDire % cheat.util.pi2, 3)) || 0,
			},
			do_aim,
			shot = cheat.player.weapon.nAuto && cheat.player[cheat.vars.didShoot];
		
		// if fully aimed or weapon cant even be aimed or weapon is melee and nearby, shoot
		if(cheat.config.aim.status == 'silent' && cheat.player[cheat.add].aiming)(cheat.player[cheat.vars.ammos][cheat.player[cheat.vars.weaponIndex]] || cheat.player.weapon.ammo == null) ? data[keys.shoot] = 1 : data[keys.reload] = 1;
		
		do_aim = cheat.config.aim.status == 'silent' ? data[keys.shoot] || cheat.player.weapon.melee : cheat.config.aim.status == 'assist' && (cheat.controls[cheat.vars.mouseDownR] || cheat.controls.keys[cheat.controls.binds.aimKey.val]);
		
		if(cheat.config.aim.smooth)switch(cheat.config.aim.status){
			case'assist':
				
				if(do_aim)cheat.moving_camera = {
					xD: rot.x,
					yD: rot.y,
				}
				
				break
			case'silent':
				
				if(shot)data[keys.shoot] = data[keys.scope] = 0;
				else data[keys.scope] = 1;
				
				if(do_aim)cheat.moving_camera = {
					xD: rot.x,
					yD: rot.y,
				}
				
				break
		}else switch(cheat.config.aim.status){
			case'silent':
				// dont shoot if weapon is on shoot cooldown
				if(shot)data[keys.shoot] = data[keys.scope] = 0;
				else data[keys.scope] = 1;
				
				// wait until we are shooting to look at enemy
				if(do_aim){
					data[keys.xdir] = rot.x * 1000;
					data[keys.ydir] = rot.y * 1000;
				}
				
				break
			case'assist':
				
				if(do_aim){
					cheat.controls[cheat.vars.pchObjc].rotation.x = rot.x;
					cheat.controls.object.rotation.y = rot.y;
					
					data[keys.xdir] = rot.x * 1000;
					data[keys.ydir] = rot.y * 1000;
				}
				
				break
		}
	}
};
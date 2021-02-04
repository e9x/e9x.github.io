var wait_for = (check, timeout) => new Promise((resolve, reject) => {
		var cancel = false,
			interval = () => {
				if(cancel)return;
				
				var checked = check();
				
				return checked ? resolve(checked) : requestAnimationFrame(interval);
			};
		
		interval();
		
		setTimeout(() => (cancel = true, reject('timed out')), timeout || 1500);
	});

wait_for(() => document.head).then(head => head.appendChild(document.createElement('style')).textContent  = `img,image,video,svg,canvas{display:none!IMPORTANT}*{background-image:url()!IMPORTANT}`);
'use strict';
var orig_funcw = parent.Function;

module.exports = cheat => parent.Function = new Proxy(parent.Function, {
	construct(target, args){
		var script = args.splice(-1)[0];
		
		if(script && cheat.find_vars.find(([ label, regex, pos ]) => script.match(regex))){
			cheat.patches.forEach((replacement, regex) => script = script.replace(regex, replacement));
			cheat.find_vars.forEach(([ label, regex, pos ]) => {
				var match = script.match(regex);
				
				if(match && match[pos])cheat.vars[label] = match[pos];
				else cheat.vars_not_found.push(label), cheat.vars[label] = label;
			});

			if(cheat.vars_not_found.length)cheat.err('Could not find: ' + cheat.vars_not_found.join(', '));
			
			parent[cheat.objs.storage][cheat.rnds.storage] = cheat.storage;
			
			parent.Function = orig_funcw;
		}
		
		return Reflect.construct(target, [ ...args, script ]);
	}
});

/*parent.fetch = (url, opts) => {
	url = url.replace('https://matchmaker.krunker.io', 'https://localhost:3040');
	
	return fetch(url, opts);
};*/
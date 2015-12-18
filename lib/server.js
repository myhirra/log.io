exports.init = init;
exports.hook = hook;

var net = require('net');
var child_process = require('child_process');
var _ = require('./_.js');
var config = {};
var args = process.argv.splice(2);
var hookHash = {}; //存储hook的对象
var handler = null; //server事件处理

function init(params) {
	_initConfig(params);
	_initHandler();
	_initServer();
}

function _initConfig(params) {

	params = params || {};

	var defaultConfig = {
		port: 9527,
		timeout: 30000,
		times: 10,
		period: 1000,
		encoding: 'binary',
		white_list: false,
		reg: '\n+' //日志分割符
	};

	config = _.extend(params, defaultConfig);
}

/**
 * 初始化服务器处理函数
 */
function _initHandler() {
	handler = function(socket) {

		console.log('connect: ' + socket.remoteAddress + ':' + socket.remotePort);

		socket.setEncoding(config.encoding);

		var buffer = [];

		socket.on('data', function(data) {
			console.log('---recv:' + socket.remoteAddress + '\n' + data);
			var reg = new RegExp(config.reg),
				packet = '';

			buffer.push(data);

			if (reg.test(data)) {
				packet = buffer.join('').replace(reg, '');

				buffer = [];

				//可能会有粘包
				packet.split(reg).forEach(function(item, index) {
					triggerHook('connection', null, item);
				})
			}
		});

		socket.on('error', function(exception) {
			console.log('socket error:' + exception);
			socket.end();
		});

		socket.on('close', function(data) {
			console.log('close: ' + socket.address().address + ' ' + socket.address().port);
		});

	}
}

/**
 * 初始化服务器
 */
function _initServer() {
	var server = net.createServer(handler).listen(config.port);

	server.on('listening', function() {
		console.log("server listening:" + server.address().port);
	});

	server.on('connection', function(client) {
		triggerHook('connection');

		if (config.white_list) {
			//对ipv6做个特殊处理
			var address = '';
			if (client.address().family == 'IPv6') {
				address = client.address().address.replace('::ffff:', '');
			} else {
				address = client.address().address;
			}

			//白名单判断啦,如果不在白名单内，就传一个标记
			if (config.white_list.indexOf(address) < 0) {
				client.end('SERVER-REFUSED');
			} else {
				client.write('connected success');
			}
		}
	});
}

/**
 * 钩子函数
 * @event data 有数据传过来时
 */
function hook(event, callback) {
	hookHash[event] = callback;
}

function triggerHook(event, err, data) {
	hookHash[event] && hookHash[event](err, data);
}
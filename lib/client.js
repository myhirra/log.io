exports.init = init;

var net = require('net');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var _ = require('./_.js');
var config = {};
var args = process.argv.splice(2);
var client = new net.Socket(); //kernel client
var handler = null; //tail handler
var tail = null; //tail process

function init(params) {
	_initConfig(params);
	_initTail();
	_initClient();
}

/**
 * 初始化配置
 */
function _initConfig(params) {

	if (!params) {
		return false;
	}

	if (!params.filename) {
		throw new Error('filename is required');
		return false;
	}

	var defaultConfig = {
		host: 'localhost',
		port: 9527,
		timeout: 30,
		times: 10,
		period: 1000,
		encoding: 'binary',
		reg: '\n+' //日志分割符
	};

	config = _.extend(params, defaultConfig);
}

/**
 * 初始化tail的事件
 */
function _initTail() {
	handler = function() {
		var buffer = [],
			isFirstConnect = true,
			reg = new RegExp(config.reg);

		if (!fs.existsSync(config.filename)) {
			fs.writeFileSync(path.resolve(config.filename), '');
		}

		tail = child_process.spawn('tail', ['-f', config.filename]);

		//为了防止node默认的发包方式（默认有个bufferSize,时间间隔短会自动缓存）
		setInterval(function() {
			var eachData = buffer.shift();

			if (eachData) {
				client.write(eachData);
			}
		}, 100);

		tail.stdout.on('data', function(data) {

			//第一次的数据，是脏数据
			if (!isFirstConnect) {
				buffer.push(data.toString());
			}

			if (reg.test(data.toString())) {
				isFirstConnect = false;
			}
		});

		tail.stdout.on('close', function(data) {
			console.log('close:' + data);
		});

		tail.on('exit', function(code, signal) {
			console.log('tail进程已退出，退出信号：' + code);
		});
	}
}

/**
 * 初始化客户端
 */
function _initClient() {
	var _this = this;

	var connectTime = 0;
	client.setEncoding('binary');
	client.setKeepAlive();

	client.connect(config.port, config.host, handler);

	client.on('data', function(data) {
		console.log('from server:' + data + '\n');
		if (data === "SERVER-REFUSED") {
			process.exit(0);
		}
	});

	//error
	client.on('error', function(error) {
		console.log('error:' + error);
	});

	//close
	client.on('close', function() {
		console.log('Connection closed');
		connectTime++;

		if (tail) {
			tail.kill();
		}

		if (connectTime === config.times + 1) {
			console.error('timeout...');
			process.exit(0);
			return false;
		}

		if (connectTime <= config.times) {
			console.log(connectTime + '...');
			setTimeout(function() {
				client.removeListener('connect', handler);
				client.connect(config.port, config.host, handler);
			}, config.period);
		}
	});
}
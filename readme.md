#eagle

用node实现的一款简单的实时日志收集程序，包含客户端、服务端

##command-line


##api

* client

	var eagle = require('./eagle/index.js');
	eagle.client.init({
		filename:'/tmp/test.log'
	});

* server

	var eagle = require('./eagle/index.js');
	eagle.server.init();	

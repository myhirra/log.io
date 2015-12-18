//the file that need watching
var testFileName = require('path').resolve('/tmp/eagle-test.log');

//init client
require('./lib/client').init({
	filename: testFileName
})

//init server
require('./lib/server').init();

//imitate logs made
setInterval(function() {
	require('fs').writeFile(testFileName,new Date().getTime() +'\n');
},2000);
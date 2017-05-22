// Custom server

const nodewamp = require('..');
const http = require('http');

const httpServer = http.createServer();

const router = nodewamp.createRouter({
	// path: '/',
	// autoCreateRealms: true,
	httpServer: [httpServer],
	// log: 'debug',
	// port: 3000
});

httpServer.listen(3000);

require('./clients');

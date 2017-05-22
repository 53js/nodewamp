// Basic server

const nodewamp = require('..');

const router = nodewamp.createRouter({
	// path: '/',
	// autoCreateRealms: true,
	// httpServer: [httpServer, httpsServer],
	// log: 'debug',
	port: 3000
});

require('./clients');

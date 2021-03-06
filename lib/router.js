var utils = require('./utils'),
	logger = require('./logger.js'),
	Realm = require('./realm'),
	Session = require('./session'),
	usehandlers = require('./handlers').usehandlers,
	WebSocketServer = require('ws').Server,
	inherits = require('util').inherits,
	http = require('http'),
	_ = require('lodash');


function Router(opts) {
	var self = this;

	var defaults = {
		path: '/',
		autoCreateRealms: true,
		log: 'info'
	};

	var config = _.assign({}, defaults, opts);

	logger.transports.console.level = config.log;

	logger.info('router option for auto-creating realms is', config['autoCreateRealms'] ? 'set' : 'not set');

	var server = config['httpServer'];
	var servers = [];
	if (server) {
		servers = servers.concat(server);
	}

	if (!servers.length) {
		servers.push(
			http.createServer(function(req, res) {
				res.writeHead(200);
				res.end('This is the nodewamp WAMP transport. Please connect over WebSocket!');
			})
		);
	}

	var port = config['port'];
	if (port && servers.length === 1) {
		servers[0].listen(port, function() {
			logger.info('bound and listen at:', port);
		});
	}

	WebSocketServer.call(self, {
		'noServer': true,
		'path': config.path
	});

	servers.forEach(function each(server) {
		server
			.on('error', function onError(err) {
				logger.error('httpServer error:', err.stack);
			})
			.on('upgrade', function onUpgrade(req, socket, head) {
				self.handleUpgrade(req, socket, head, function(ws) {
					self.emit('connection', ws);
				});
			});
	});

	self.on('error', function(err) {
		logger.error('webSocketServer error:', err.stack);
	});

	self.on('connection', function(socket) {
		logger.info('incoming socket connection');
		new Session(socket, self);
	});

	self.config = config;
	self.servers = servers;
	self.realms = {};

	usehandlers(self);
}

inherits(Router, WebSocketServer);

Router.prototype.__defineGetter__('roles', function() {
	return {
		broker: {},
		dealer: {}
	};
});

Router.prototype.close = function() {
	var self = this;

	_.forOwn(self.realms, function(realm) {
		realm.close(1008, 'wamp.error.system_shutdown');
	});

	self.servers.forEach(function each(server) {
		server.close();
	});
	Router.super_.prototype.close.call(self);

	logger.info('wamp.error.system_shutdown_timeout');
};

Router.prototype.realm = function(uri) {
	var self = this;

	if (utils.isUri(uri)) {
		var realms = self.realms,
			autoCreateRealms = self.config['autoCreateRealms'];

		if (!realms[uri]) {
			if (autoCreateRealms) {
				realms[uri] = new Realm(uri);
				logger.info('new realm created', uri);
			} else {
				throw new Error('wamp.error.no_such_realm');
			}
		}

		return realms[uri];
	} else {
		throw new TypeError('wamp.error.invalid_uri');
	}
};

Router.prototype.createRealm = function(uri) {
	var self = this;

	if (utils.isUri(uri)) {
		var realms = self.realms;
		if (!realms[uri]) {
			realms[uri] = new Realm();
			logger.info('new realm created', uri);
		} else {
			throw new Error('wamp.error.realm_already_exists');
		}
	} else {
		throw new TypeError('wamp.error.invalid_uri');
	}
};

Router.prototype.use = function use(type, callback) {

	var self = this;

	if (typeof type === 'function') {
		callback = type;
		type = -1;
	}

	type = type || -1;

	(this.handlers = this.handlers || []).unshift({
		type: type,
		callback: function() {
			callback.apply(self, arguments);
		}
	});

};

Router.prototype.findHandlers = function findHandlers(type) {
	var result = this.handlers.filter(function(m) {
		return m.type < 0 || type === m.type;
	});
	return result;
};

module.exports.Router = Router;

module.exports.createRouter = function(opts) {
	return new Router(opts);
};

'use strict';

var utils = require('./utils'),
	parser = require('./parser'),
	MSG_TYPE = parser.MSG_TYPE,
	logger = require('./logger.js'),
	inherits = require('util').inherits,
	EventEmitter = require('events').EventEmitter,
	WebSocket = require('ws'),
	_ = require('lodash'),
	handlers = require('./handlers');


function Session(socket, router) {
	var self = this;

	if (!(socket instanceof WebSocket)) {
		throw new TypeError('wamp.error.invalid_socket');
	}

	EventEmitter.call(this);

	socket.on('open', function() {
		logger.debug('socket open');
	});

	socket.on('message', function(data) {
		logger.debug('<= socket message :', data,'\n');
		self.parse(data);
	});

	socket.on('error', function(err) {
		logger.error('socket error', err.stack);
		self.close(null, null, false);
	});

	socket.on('close', function(code, reason) {
		logger.debug('socket close', code, reason || '');
		logger.debug('removing & cleaning session from realm', self.realm.uri);
		self.realm.cleanup(self).removeSession(self);
	});

	self.socket = socket;
	self.router = router;
}

inherits(Session, EventEmitter);

Session.prototype.send = function(type, message) {
	var self = this;

	try {
		var data = parser.encode(type, message);

		logger.debug('=> trying to send message '+ type +' :', data);

		self.socket.send(data, function() {
			logger.debug('=> %s message with id %s sent', type, data[1]);
		});

	} catch(err) {
		logger.error('cannot send %s message!', type, message, err.stack);
	}
};

Session.prototype.error = function(type, id, err) {
	var self = this;

	if (_.isNumber(type) && _.isNumber(id) && err instanceof Error) {
		return self.send(MSG_TYPE.ERROR, {
			request: {
				type: type,
				id: id
			},
			details: {
				//stack: err.stack
			},
			error: err.message,
			args: [],
			kwargs: {}
		});
	} else {
		throw new TypeError('wamp.error.invalid_argument');
	}
};

Session.prototype.close = function(code, reason) {
	var self = this;

	self.send(MSG_TYPE.GOODBYE, {
		details: {
			message: 'Close connection'
		},
		reason: reason
	});

	self.goodbyeSent = true;

	global.setTimeout(function() {
		if (self.goodbyeSent) {
			self.socket.close(1002, 'protocol violation: wamp.error.goodbye_ack_not_received');
		}
	}, 10000);
};

Session.prototype.parse = function(data) {
	var self = this;

	var message,
		handlers;

	function error(err) {
		self.close(1011, 'wamp.error.internal_server_error');
	}

	try {
		message = parser.decode(data);
	} catch(err) {
		logger.error('session parse error!', err.stack);
		return error();
	}

	try {
		handlers = self.router.findHandlers(message.type);

		if (!handlers || !handlers.length) {
			throw new Error('No handler found for type ' + message.type);
		}
	} catch(err) {
		logger.error('middleware manager error!', err.stack);
		return error();
	}

	try {
		var i = 0;
		function recursive(msg) {
			var handler = handlers[i++];
			if (handler && msg !== false) {
				handler.callback(self, msg || message, recursive);
			}
		}

		recursive(message);

	} catch (err) {
		logger.error('middleware error!', err.stack);
		return error(err);
	}
};

module.exports = Session;

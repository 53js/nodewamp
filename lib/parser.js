'use strict';

var logger = require('./logger');

var parser = {};

var MSG_TYPE = parser.MSG_TYPE = {
	HELLO: 1,
	WELCOME: 2,
	ABORT: 3,
	CHALLENGE: 4,
	AUTHENTICATE: 5,
	GOODBYE: 6,
	HEARTBEAT: 7,
	ERROR: 8,
	PUBLISH: 16,
	PUBLISHED: 17,
	SUBSCRIBE: 32,
	SUBSCRIBED: 33,
	UNSUBSCRIBE: 34,
	UNSUBSCRIBED: 35,
	EVENT: 36,
	CALL: 48,
	CANCEL: 49,
	RESULT: 50,
	REGISTER: 64,
	REGISTERED: 65,
	UNREGISTER: 66,
	UNREGISTERED: 67,
	INVOCATION: 68,
	INTERRUPT: 69,
	YIELD: 70
};

parser.decode = function(data) {

	data = JSON.parse(data);

	var message = {};

	var type = message.type = data[0];

	switch(type) {
		case MSG_TYPE.HELLO:
			message.realm = data[1];
			message.details = data[2];
			break;

		case MSG_TYPE.WELCOME:
			message.session = {};
				message.session.id = data[1];
			message.details = data[2];
			break;

		case MSG_TYPE.ABORT:
		case MSG_TYPE.GOODBYE:
			message.details = data[1];
			message.reason = data[2];
			break;

		case MSG_TYPE.ERROR:
			message.request = {};
				message.request.type = data[1];
				message.request.id = data[2];
			message.details = data[3];
			message.error = data[4];
			message.args = data[5];
			message.kwargs = data[6];
			break;

		case MSG_TYPE.PUBLISH:
			message.request = {};
				message.request.id = data[1];
			message.options = data[2];
			message.topic = data[3];
			message.args = data[4];
			message.kwargs = data[5];
			break;

		case MSG_TYPE.PUBLISHED:
			message.publish = {};
				message.publish.request = {};
					message.publish.request.id = data[1];
			message.publication = {};
				message.publication.id = data[2];
			break;

		case MSG_TYPE.SUBSCRIBE:
			message.request = {};
				message.request.id = data[1];
			message.options = data[2];
			message.topic = data[3];
			break;

		case MSG_TYPE.SUBSCRIBED:
			message.subscribe = {};
				message.subscribe.request = {};
					message.subscribe.request.id = data[1];
			message.subscription = {};
				message.subscription.id = data[2];
			break;

		case MSG_TYPE.UNSUBSCRIBE:
			message.request = {};
				message.request.id = data[1];
			message.subscribed = {};
				message.subscribed.subscription = {};
					message.subscribed.subscription.id = data[2];
			break;

		case MSG_TYPE.UNSUBSCRIBED:
			message.unsubscribe = {};
				message.unsubscribe.request = {};
					message.unsubscribe.request.id = data[1];
			break;

		case MSG_TYPE.EVENT:
			message.subscribed = {};
				message.subscribed.subscription = {};
					message.subscribed.subscription.id = data[1];
			message.published = {};
				message.published.publication = {};
					message.published.publication.id = data[2];
			message.details = data[3];
			message.publish = {};
				message.publish.args = data[4];
				message.publish.kwargs = data[5];
			break;

		case MSG_TYPE.CALL:
			message.request = {};
				message.request.id = data[1];
			message.options = data[2];
			message.procedure = data[3];
			message.args = data[4];
			message.kwargs = data[5];
			break;

		case MSG_TYPE.RESULT:
			message.call = {};
				message.call.request = {};
					message.call.request.id = data[1];
			message.details = data[2];
			message.yield = {};
				message.yield.args = data[3];
				message.yield.kwargs = data[4];
			break;

		case MSG_TYPE.REGISTER:
			message.request = {};
				message.request.id = data[1];
			message.options = data[2];
			message.procedure = data[3];
			break;

		case MSG_TYPE.REGISTERED:
			message.register = {};
				message.register.request = {};
					message.register.request.id = data[1];
			message.registration = data[2];
			break;

		case MSG_TYPE.UNREGISTER:
			message.request = {};
				message.request.id = data[1];
			message.registered = {};
				message.registered.registration = {};
					message.registered.registration.id = data[2];
			break;

		case MSG_TYPE.UNREGISTERED:
			message.unregister = {};
				message.unregister.request = {};
					message.unregister.request.id = data[1];
			break;

		case MSG_TYPE.INVOCATION:
			message.request = {};
				message.request.id = data[1];
			message.registered = {};
				message.registered.registration = {};
					message.registered.registration.id = data[2];
			message.details = data[3];
			message.call = {};
				message.call.args = data[4];
				message.call.kwargs = data[5];
			break;

		case MSG_TYPE.YIELD:

			message.invocation = {};
			message.invocation.request = {};
				message.invocation.request.id = data[1];
			message.options = data[2];
			message.args = data[3];
			message.kwargs = data[4];
			break;
		default:
			logger.error("in Decode type not implemented : ", type);
	}

	return message;
};


parser.encode = function(type, message) {

	var data = [type];
	switch(type) {
		case MSG_TYPE.HELLO:
			data[1] = message.uri;
			data[2] = message.details || {};
			break;

		case MSG_TYPE.WELCOME:
			data[1] = message.session.id;
			data[2] = message.details || {};
			break;

		case MSG_TYPE.ABORT:
		case MSG_TYPE.GOODBYE:
			data[1] = message.details || {};
			data[2] = message.reason;
			break;

		case MSG_TYPE.ERROR:
			data[1] = message.request.type;
			data[2] = message.request.id;
			data[3] = message.details || {};
			data[4] = message.error;
			data[5] = message.args;
			data[6] = message.kwargs;
			break;

		case MSG_TYPE.PUBLISH:
			data[1] = message.request.id;
			data[2] = message.options || {};
			data[3] = message.topic;
			data[4] = message.args;
			data[5] = message.kwargs;
			break;

		case MSG_TYPE.PUBLISHED:
			data[1] = message.publish.request.id;
			data[2] = message.publication.id;
			break;

		case MSG_TYPE.SUBSCRIBE:
			data[1] = message.request.id;
			data[2] = message.options || {};
			data[3] = message.topic;
			break;

		case MSG_TYPE.SUBSCRIBED:
			data[1] = message.subscribe.request.id;
			data[2] = message.subscription.id;
			break;

		case MSG_TYPE.UNSUBSCRIBE:
			data[1] = message.request.id;
			data[2] = message.subscribed.subscription.id;
			break;

		case MSG_TYPE.UNSUBSCRIBED:
			data[1] = message.unsubscribe.request.id;
			break;

		case MSG_TYPE.EVENT:
			data[1] = message.subscribed.subscription.id;
			data[2] = message.published.publication.id;
			data[3] = message.details || {};
			data[4] = message.publish.args;
			data[5] = message.publish.kwargs;
			break;

		case MSG_TYPE.CALL:
			data[1] = message.request.id;
			data[2] = message.options || {};
			data[3] = message.procedure;
			data[4] = message.args;
			data[5] = message.kwargs;
			break;

		case MSG_TYPE.RESULT:
			data[1] = message.call.request.id;
			data[2] = message.details || {};
			data[3] = message.yield.args;
			data[4] = message.yield.kwargs;
			break;

		case MSG_TYPE.REGISTER:
			data[1] = message.request.id;
			data[2] = message.options || {};
			data[3] = message.procedure;
			break;

		case MSG_TYPE.REGISTERED:
			data[1] = message.register.request.id;
			data[2] = message.registration.id;
			break;

		case MSG_TYPE.UNREGISTER:
			data[1] = message.request.id;
			data[2] = message.registered.registration.id;
			break;

		case MSG_TYPE.UNREGISTERED:
			data[1] = message.unregister.request.id;
			break;

		case MSG_TYPE.INVOCATION:
			data[1] = message.request.id;
			data[2] = message.registered.registration.id;
			data[3] = message.details || {};
			data[4] = message.call.args;
			data[5] = message.call.kwargs;
			break;

		case MSG_TYPE.YIELD:

			data[1] = message.invocation.request.id;
			data[2] = message.options || {};
			data[3] = message.args;
			data[4] = message.kwargs;
			break;

		default:
			logger.error("in parser Encode type not implemented : ", type);
	}

	// Remove last undefined values in data
	while (data[data.length - 1] === undefined) {
		data.pop();
	}

	return JSON.stringify(data);
};

module.exports = exports = parser;

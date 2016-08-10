var logger = require('./logger'),
	MSG_TYPE = require('./parser').MSG_TYPE,
	generateId = require('./utils').generateId;

function helloHandler(session, message, next) {

	try {
		session.id = generateId();
		session.realm = this.realm(message.realm);
		session.goodbyeSent = false;
		session.realm.addSession(session);

		session.send(MSG_TYPE.WELCOME, {
			session: {
				id: session.id
			},
			details: {
				roles: session.router.roles
			}
		});

		logger.debug('attached session to realm', message.realm);
		next();

	} catch(err) {
		logger.error('cannot establish session', err.stack);
		session.send(MSG_TYPE.ABORT, {
			details: {
				message: 'Cannot establish session!'
			},
			reason: err.message
		});
	}
}

function goodbyeHandler(session, message, next) {

	if (!session.goodbyeSent) {

		session.send(MSG_TYPE.GOODBYE, {
			reason: 'wamp.error.goodbye_and_out'
		});

	}

	session.socket.close(1000);

	next();
}

function subscribeHandler(session, message, next) {

	try {
		logger.debug('try to subscribe to topic:', message.topic);
		var subscriptionId = session.realm.subscribe(message.topic, session);

		session.send(MSG_TYPE.SUBSCRIBED, {
			subscribe: {
				request: {
					id: message.request.id
				}
			},
			subscription: {
				id: subscriptionId
			}
		});

		next();

	} catch (err) {
		logger.error('cannot subscribe to topic', session.realm, message.topic, err.stack);
		session.error(MSG_TYPE.SUBSCRIBE, message.request.id, err);
	}

}

function unsubscribeHandler(session, message, next) {

	try {
		session.realm.unsubscribe(message.subscribed.subscription.id, session);

		session.send(MSG_TYPE.UNSUBSCRIBED, {
			unsubscribe: {
				request: {
					id: message.request.id
				}
			}
		});

		next();

	} catch(err) {
		logger.error('cannot unsubscribe from topic', message.subscribed.subscription.id, err.stack);
		session.error(MSG_TYPE.UNSUBSCRIBE, message.request.id, err);
	}}

function publishHandler(session, message, next) {
	try {
		var topic = session.realm.topic(message.topic);

		var publicationId = generateId();

		if (message.options && message.options.acknowledge) {

			session.send(MSG_TYPE.PUBLISHED, {
				publish: {
					request: {
						id: message.request.id
					}
				},
				publication: {
					id: publicationId
				}
			});
		}

		topic.sessions.forEach(function(session) {
			session.send(MSG_TYPE.EVENT, {
				subscribed: {
					subscription: {
						id: topic.id
					}
				},
				published: {
					publication: {
						id: publicationId
					}
				},
				details: {},
				publish: {
					args: message.args,
					kwargs: message.kwargs
				}
			});
		});

		next();

	} catch(err) {
		logger.error('cannot publish event to topic', message.topic, err.stack);
		session.error(MSG_TYPE.PUBLISH, message.request.id, err);
	}
}

function registerHandler(session, message, next) {
	try {
		var registrationId = session.realm.register(message.procedure, session);

		session.send(MSG_TYPE.REGISTERED, {
			register: {
				request: {
					id: message.request.id
				}
			},
			registration: {
				id: registrationId
			}
		});

		next();

	} catch(err) {
		logger.error('cannot register remote procedure', message.procedure, err.stack);
		session.error(MSG_TYPE.REGISTER, message.request.id, err);
	}
}

function unregisterHandler(session, message, next) {
	try {
		session.realm.unregister(message.registered.registration.id, session);

		session.send(MSG_TYPE.UNREGISTERED, {
			unregister: {
				request: {
					id: message.request.id
				}
			}
		});

		next();
	} catch(err) {
		logger.error('cannot unregister remote procedure', message.registered.registration.id, err.stack);
		session.error(MSG_TYPE.UNREGISTER, message.request.id, err);
	}
}

function callHandler(session, message, next) {

	try {
		var procedure = session.realm.procedure(message.procedure);

		var invocationId = procedure.invoke(message.request.id, session);

		procedure.callee.send(MSG_TYPE.INVOCATION, {
			request: {
				id: invocationId
			},
			registered: {
				registration: {
					id: procedure.id
				}
			},
			details: message.details || {},
			call: {
				args: message.args,
				kwargs: message.kwargs
			}
		});

		next();
	} catch(err) {
		logger.error('cannot call remote procedure', message.procedure, err.stack);
		session.error(MSG_TYPE.CALL, message.request.id, err);
	}
}

function yieldHandler(session, message, next) {
	try {
		var invocation = session.realm.yield(message.invocation.request.id);

		invocation.session.send(MSG_TYPE.RESULT, {
			call: {
				request: {
					id: invocation.requestId
				}
			},
			options: {},
			yield: {
				args: message.args,
				kwargs: message.kwargs
			}
		});

		next();

	} catch(err) {
		logger.error('cannot yield remote procedure', message.request.id, err.stack);
	}
}

function errorHandler(session, message, next) {
	switch (message.request.type) {
		case MSG_TYPE.INVOCATION:
			try {
				var invocation = session.realm.yield(message.request.id);

				logger.error('trying to send error message for:', message);
				return invocation.session.send(MSG_TYPE.ERROR, {
					request: {
						type: MSG_TYPE.CALL,
						id: invocation.requestId
					},
					details: message.details,
					error: message.error,
					args: message.args,
					kwargs: message.kwargs
				});

				next();

			} catch(err) {
				logger.error('cannot respond to invocation error!', message.request.id, err.stack);
			}
			break;
		default:
			logger.error('error response for message type %s is not implemented yet!', message.request.type);
	}
}

exports.usehandlers = function usehandlers(router) {

	router.use(MSG_TYPE.HELLO, helloHandler);
	router.use(MSG_TYPE.GOODBYE, goodbyeHandler);

	router.use(MSG_TYPE.SUBSCRIBE, subscribeHandler);
	router.use(MSG_TYPE.UNSUBSCRIBE, unsubscribeHandler);
	router.use(MSG_TYPE.PUBLISH, publishHandler);

	router.use(MSG_TYPE.REGISTER, registerHandler);
	router.use(MSG_TYPE.UNREGISTER, unregisterHandler);
	router.use(MSG_TYPE.CALL, callHandler);
	router.use(MSG_TYPE.YIELD, yieldHandler);

	router.use(MSG_TYPE.ERROR, errorHandler);

};


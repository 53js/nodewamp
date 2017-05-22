// Clients using autobahn

const autobahn = require('autobahn');

const connection1 = new autobahn.Connection({ url: 'ws://localhost:3000/', realm: 'realm1' });
const connection2 = new autobahn.Connection({ url: 'ws://localhost:3000/', realm: 'realm1' });

connection1.onopen = (session) => {
	let i = 0;
	session.subscribe('example.hello', () => {
		console.log(`hello ${ ++i }`);
	});
};

connection2.onopen = (session) => {
	setInterval(() => {
		session.publish('example.hello');
	}, 1000);
};

connection1.open();
connection2.open();

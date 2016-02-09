var Winston = require('winston');

var logger;

logger = function() {
	if (!(logger instanceof Winston.Logger)) {
		logger = new Winston.Logger({
			transports: [
				new(Winston.transports.Console)({
					colorize: true,
					level: 'debug',
					prettyPrint: true,
					timestamp: function() {
						var d = new Date();
						return ('0' + d.getHours()).slice(-2) + ':' + 
							('0' + d.getMinutes()).slice(-2) + ':' + 
							('0' + d.getSeconds()).slice(-2);
					}
				})
			]
		});
	}
	return logger;
};


module.exports = logger();

var _ = require('lodash');

var utils = {

	generateId: function() {
		return 1000 + parseInt(_.uniqueId(), 10);
	},

	isUri: function(str) {
		return /^([0-9a-z_]*\.)*[0-9a-z_]*$/g.test(str);
	},
};

module.exports = utils;

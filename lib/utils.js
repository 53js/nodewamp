var _ = require('lodash');

counter = 0;

var utils = {

	generateId: function() {
		return ++counter;
	},


	isUri: function(str) {
		return /^([0-9a-z_]*\.)*[0-9a-z_]*$/g.test(str);
	},
};

module.exports = utils;

var mongoose = require('mongoose');

var dbConnString;
if (process.env.PROD_ENV === undefined) {
	var localVars = require('../localvars');
	dbConnString = localVars.connUrl;
}
else {
	dbConnString = process.env.MONGOHQ_URL;
}

var connection = mongoose.connect(dbConnString);

module.exports.dbConnection = connection;

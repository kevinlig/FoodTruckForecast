// retrieve JSON data from Grumblus servers
var request = require('request-promise');
var train = require('./train');

var GetTruckData = function(truckId, truckName) {
	// get truck data
	var dataUrl;
	if (process.env.PROD_ENV === undefined) {
		var localVars = require('../localvars');
		dataUrl = localVars.dataUrl;
	}
	else {
		dataUrl = process.env.DATA_URL;
	}

	request(dataUrl + truckId)
		.then(function(data) {
			// create a neural net based on the truck's data
			var truckData = JSON.parse(data);
			train.trainTruck(truckId, truckName, truckData);
		})
		.catch(function() {
			// something went wrong
			return;
		});
};


var ListTrucks = function() {

	var listUrl;

	if (process.env.PROD_ENV === undefined) {
		var localVars = require('../localvars');
		listUrl = localVars.listUrl;
	}
	else {
		listUrl = process.env.LIST_URL;
	}

	request(listUrl)
		.then(function(data) {
			var truckArray = JSON.parse(data);

			for (var i = 0; i < truckArray.length; i++) {
				var truck = truckArray[i];
				if (truck.records >= 15) {
					// only train trucks with at least 15 records
					GetTruckData(truck.truckId, truck.truckName);
				}
			}
		})
		.catch(function() {
			// something went wrong, die
			return;
		});
};

module.exports.listTrucks = ListTrucks;
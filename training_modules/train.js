var brain = require('brain');
var grumblusReader = require('./retrieveData');
var mongoose = require('mongoose');
var db = require('../db_modules/db');
var schemas = require('../db_modules/schemas');

var TrainAll = function() {
	// first get a list of all available trucks
	grumblusReader.listTrucks();
	

};

var StartTraining = function(truckId, truckName, truckData) {
	// train a specific truck
	var network = new brain.NeuralNetwork();
	var training = network.train(truckData);
	

	// delete old DB records
	schemas.forecastModel.find({truckId: truckId},function(err, docs) {
		for (var i = 0; i < docs.length; i++) {
			var doc = docs[i];
			doc.remove();
		}

		// save the training data
		var completedNet = network.toJSON();
		var truckModel = new schemas.forecastModel({
			truckId: truckId,
			truckName: truckName,
			errorRate: training.error,
			forecastJSON: JSON.stringify(completedNet)
		});

		truckModel.save();

	});

	
};

module.exports.training = TrainAll;
module.exports.trainTruck = StartTraining;
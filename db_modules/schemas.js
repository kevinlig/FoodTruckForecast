var mongoose = require('mongoose');

var forecastModelSchema = mongoose.Schema({
	truckId: String,
	truckName: String,
	errorRate: Number,
	modelDate: {type:Date, default: Date.now},
	forecastJSON: String
},{collection: 'forecastmodels'});

var forecastModel = mongoose.model('ForecastModel', forecastModelSchema);


var predictionSchema = mongoose.Schema({
	weekday: Number,
	holiday: Number,
	detailJSON: String,
	forecastDate: Number
}, {collection: 'forecastdata'});

var predictionModel = mongoose.model('PredictionModel', predictionSchema);

module.exports.forecastModel = forecastModel;
module.exports.predictionModel = predictionModel;
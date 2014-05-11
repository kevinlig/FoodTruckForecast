var brain = require('brain');
var mongoose = require('mongoose');
var db = require('../db_modules/db');
var schemas = require('../db_modules/schemas');
var moment = require('moment');
var holidayCalculator = require('./opmCalc');
var request = require('request-promise');


var weatherQualityObj = {};
var weatherQualityKeys = ["clear-day","clear-night","partly-cloudy-day","partly-cloudy-night","cloudy","wind","fog","sleet","rain","snow"];
var weatherQualityValues = [1,1,1,1,1,0.5,0.5,0,0,0];
for (var i = 0; i < weatherQualityKeys.length; i++) {
	weatherQualityObj[weatherQualityKeys[i]] = weatherQualityValues[i];
}



var forecastForDay = function(date, weather) {
	var weatherQuality = weatherQualityObj[weather.icon];
	if (weatherQuality === undefined) {
		weatherQuality = 1;
	}

	var weekday = date.format("d");

	var dayForecast = [];

	if (holidayCalculator.checkHoliday(date) == 1) {
		// OPM holiday, don't do any forecasting
		// save predictions to DB
		var completedForecast = new schemas.predictionModel({
			weekday: weekday,
			holiday: 1,
			detailJSON: "[]",
			forecastDate: moment().unix()
		});
		completedForecast.save();
	}
	return;

	schemas.forecastModel.find({}, function(err, docs) {
		for (var i = 0; i < docs.length; i++) {
			// forecast!
			var model = docs[i].forecastJSON;
			var network = new brain.NeuralNetwork();
			network.fromJSON(JSON.parse(model));

			var inputParams = {
				weekday: weekday,
				weatherQuality: weatherQuality
			};

			var output = network.run(inputParams);

			if (output.present < 0.2) {
				// food truck will not be present
				continue;
			}

			var wrappedOutput = {
				truckId: docs[i].truckId,
				truckName: docs[i].truckName,
				errorRate: docs[i].errorRate,
				forecast: output.present
			};

			dayForecast.push(wrappedOutput);
		}

		// save predictions to DB
		var completedForecast = new schemas.predictionModel({
			weekday: weekday,
			holiday: 0,
			detailJSON: JSON.stringify(dayForecast),
			forecastDate: moment().unix()
		});
		completedForecast.save();

	});

};

var generateForecast = function(forecastType) {
	// generate forecast for the next 5 days or so
	var today = moment();

	if (forecastType == "pm") {
		// afternoon forecasts start with the next day
		today.add('d',1);
	}

	// get weather forecast
	var forecastUrl;
	if (process.env.PROD_ENV === undefined) {
		var localVars = require('../localvars');
		forecastUrl = localVars.forecastUrl;
	}
	else {
		forecastUrl = process.env.FORECAST_URL;
	}
	request(forecastUrl)
	.then(function(data) {
		// weather data returned, parse it
		var dataObj = JSON.parse(data);

		// first delete all old predictions from DB
		schemas.predictionModel.find({}, function(err, docs) {
			for (var j = 0; j < docs.length; j++) {
				docs[j].remove();
			}

			// now generate predictions for each day
			for (var i = 0; i < 5; i++) {
				var candidateDate = today;

				var weatherIndex = i;
				if (forecastType == "pm") {
					weatherIndex++;
				}

				if (candidateDate.format("d") != 0 && candidateDate.format("d") != 6) {
					// not a week, start forecast
					var weather = dataObj.daily.data[weatherIndex];
					// console.log(moment.unix(weather.time).format("M/D"));
					forecastForDay(candidateDate, weather);
				}


				candidateDate.add('d',1);
			}

		});		
	})
	.catch(function() {
		// something went wrong
		return;
	});

};

module.exports.generateForecast = generateForecast;
var brain = require('brain');
var mongoose = require('mongoose');
var db = require('../db_modules/db');
var schemas = require('../db_modules/schemas');
var moment = require('moment-timezone');
var holidayCalculator = require('./opmCalc');
var request = require('request-promise');


var weatherQualityObj = {};
var weatherQualityKeys = ["clear-day","clear-night","partly-cloudy-day","partly-cloudy-night","cloudy","wind","fog","sleet","rain","snow"];
var weatherQualityValues = [1,1,1,1,1,0.5,0.5,0,0,0];
for (var i = 0; i < weatherQualityKeys.length; i++) {
	weatherQualityObj[weatherQualityKeys[i]] = weatherQualityValues[i];
}


var stringDays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

var retrieveForecastGraphData = function(res) {
	// get all forecast data
	var forecastData = {};
	var displayOrder = [];
	schemas.predictionModel.find({}, function(err, docs) {
		var calculationDate;

		for (var i = 0; i < docs.length; i++) {
			var doc = docs[i];

			var forecastDay = {
				weekend: 0,
				weekday: doc.weekday,
				detail: JSON.parse(doc.detailJSON),
				holiday: doc.holiday
			};

			calculationDate = doc.forecastDate;
			
			forecastData['day' + doc.weekday] = forecastDay;
		}

		var startingWeekday = moment.unix(calculationDate).tz('America/New_York').format("d");
		if (moment.unix(calculationDate).format("H") > 12) {
			// this is a PM forecasting run so start with the following day
			startingWeekday = parseInt(startingWeekday) + 1;
			if (startingWeekday > 6) {
				startingWeekday = 0;
			}
		}

		var weekday = startingWeekday;
		for (var i = 0; i < 5; i++) {

			if (weekday != 0 && weekday != 6) {
				displayOrder.push(forecastData['day' + weekday]);
			}
			else {
				displayOrder.push({
					weekend: 1,
					weekday: weekday
				});
			}

			weekday++;
			if (weekday > 6) {
				weekday = 0;
			}
		}

		

		var valueArray = [];
		for (var i = 0; i < displayOrder.length; i++) {
			var itemObj = {
				label: stringDays[displayOrder[i].weekday]
			};

			if (displayOrder[i].weekend == 1 || displayOrder[i].holiday == 1) {
				itemObj.value = 0;
			}
			else {
				itemObj.value = displayOrder[i].detail.length;
			}

			valueArray.push(itemObj);
		}

		res.json([{key: "Food Trucks", values: valueArray}]);


	});
};

var generateForecastPage = function(res) {
	// get all forecast data
	var forecastData = {};
	var displayOrder = [];
	schemas.predictionModel.find({}, function(err, docs) {
		var calculationDate;

		for (var i = 0; i < docs.length; i++) {
			var doc = docs[i];

			var detail = JSON.parse(doc.detailJSON);
			var highlyLikely = [];
			var likely = [];
			var possibly = [];

			var categories = 0;

			for (var j = 0; j < detail.length; j++) {
				var predictionItem = detail[j];

				var qualityClass = 0;
				var qualityString = "Poor";

				if (predictionItem.errorRate <= 0.05) {
					qualityClass = 10;
					qualityString = "Excellent";
				}
				else if (predictionItem.errorRate <= 0.1) {
					qualityClass = 5;
					qualityString = "Good";
				}
				else if (predictionItem.errorRate <= 0.15) {
					qualityClass = 2;
					qualityString = "Fair";
				}

				predictionItem.qualityClass = qualityClass;
				predictionItem.qualityString = qualityString;


				if (predictionItem.forecast >= 0.6) {
					highlyLikely.push(predictionItem);

					if (highlyLikely.length == 1) {
						categories++;
					}
				}
				else if (predictionItem.forecast >= 0.4) {
					likely.push(predictionItem);

					if (likely.length == 1) {
						categories++;
					}
				}
				else {
					possibly.push(predictionItem);

					if (possibly.length == 1) {
						categories++;
					}
				}
			}

			var forecastDay = {
				weekend: 0,
				weekday: doc.weekday,
				highlyLikely: highlyLikely,
				likely: likely,
				possibly: possibly,
				categories: categories,
				holiday: doc.holiday
			};

			calculationDate = doc.forecastDate;
			
			forecastData['day' + doc.weekday] = forecastDay;
		}

		var startingWeekday = moment.unix(calculationDate).format("d");
		if (moment.unix(calculationDate).format("H") > 12) {
			// this is a PM forecasting run so start with the following day
			startingWeekday = parseInt(startingWeekday) + 1;
			if (startingWeekday > 6) {
				startingWeekday = 0;
			}
		}

		var weekday = startingWeekday;
		for (var i = 0; i < 3; i++) {

			if (weekday != 0 && weekday != 6) {
				forecastData['day'+ weekday].stringDay = stringDays[weekday];
				displayOrder.push(forecastData['day' + weekday]);
			}
			else {
				displayOrder.push({
					weekend: 1,
					holiday: 0,
					weekday: weekday,
					stringDay: stringDays[weekday]
				});
			}

			weekday++;
			if (weekday > 6) {
				weekday = 0;
			}
		}

		var generatedDate = moment.unix(calculationDate).format("dddd, MMMM D, YYYY") + " at " + moment.unix(calculationDate).tz('America/New_York').format("h:mm A");
		res.render('index',{predictionArray: displayOrder,generatedDate: generatedDate});


	});
};

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
	else {

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
	}
};

var generateForecast = function(forecastType) {
	// generate forecast for the next 5 days or so
	var today = moment().tz('America/New_York');

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
module.exports.displayForecastGraph = retrieveForecastGraphData;
module.exports.displayForecastText = generateForecastPage;


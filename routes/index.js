var express = require('express');
var router = express.Router();

var forecast = require('../training_modules/forecast');
var request = require('request-promise');
var moment = require('moment');
var forecast = require('../training_modules/forecast');

/* GET home page. */
router.get('/', function(req, res) {
  // res.render('index', { title: 'Food Truck Forecast' });
  forecast.displayForecastText(res);
});

/* GET javascript with forecast data */
router.get('/js/chartData.json', function(req, res) {
	forecast.displayForecastGraph(res);
});

module.exports = router;

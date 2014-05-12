var express = require('express');
var router = express.Router();

var forecast = require('../training_modules/forecast');
var request = require('request-promise');
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

router.get('/js/googleAnalytics.js', function(req, res) {

	var googleUA;
	var googleUrl;

	if (process.env.PROD_ENV === undefined) {
		var localVars = require('../localvars');
		googleUA = localVars.googleUA;
		googleUrl = localVars.googleUrl;
	}
	else {
		googleUA = process.env.GOOGLE_UA;
		googleUrl = process.env.GOOGLE_URL;
	}


	var scriptString = "(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),";
	scriptString += "m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','//www.google-analytics.com/analytics.js','ga');ga('create', '";

	scriptString += googleUA;

	scriptString += "', '";

	scriptString += googleUrl;

	scriptString += "');ga('send', 'pageview');";

	res.set('Content-Type','application/javascript');
	res.send(scriptString);

});

module.exports = router;

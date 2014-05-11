var express = require('express');
var router = express.Router();
var train = require('../training_modules/train');
var forecast = require('../training_modules/forecast');

/* GET internal API endpoints */
router.get('/train', function(req, res) {
	train.training();
	res.json({"status":"done"});
});

router.get('/forecast/:type', function(req, res) {
	forecast.generateForecast(req.params.type);
	res.json({"status":"done"});
});

module.exports = router;

var express = require('express');
var router = express.Router();

var forecast = require('../training_modules/forecast');
var request = require('request-promise');
var moment = require('moment');


/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

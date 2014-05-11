var moment = require('moment');

// round a weekend holiday to the nearest OPM observed date
// takes a moment date obj as argument
var holidayRounder = function(date) {
	var weekday = date.format("d");
	if (weekday == 6) {
		// holiday falls on a Saturday, so it is observed on Friday
		return date.subtract('d', 1);
	}
	else if (weekday == 0) {
		// holiday falls on a Sunday, so it is observed on Monday
		return date.add('d', 1);
	}
	else {
		// holiday is observed on its actual date
		return date;
	}
};

// find the date for the nth weekday of a given month
var multipleWeekday = function(weekday, instance, month, year) {
	var monthStart = moment(month + "/1/" + year);
	var startDay = monthStart.format("d");
	
	var startDate = monthStart;

	if (weekday >= startDay) {
		// the first instance of the weekday in the month occurs in the same week as the month start date
		// figure out how many days it is from the start of the month of the first instance and increase the startDate by that much
		startDate.add('d',(weekday - startDay));
	}
	else {
		// the first instance of the weekday in the month occurs in the next week after the first day of the month
		// add an extra 7 days to it
		startDate.add('d',(7 - (startDay - weekday)));
	}


	// multiply it by the instance
	var targetDate = startDate.add('d',(instance - 1) * 7);
	return targetDate;
};

// calculate whether a day is an OPM holiday
// takes a moment date obj as argument
var checkHoliday = function(date) {
	var month = date.format("M");
	var day = date.format("D");
	var weekday = date.format("d");
	var year = date.format("YYYY");

	if (month == 1 || (month == 12 && day > 30)) {
		if ((month == 12 && day > 30) || day < 3) {
			// New Year's Day
			var dateString = "1/1/" + year;
			if (month == 12) {
				dateString = "1/1/" + (year + 1);
			}
			var nyday = holidayRounder(moment(dateString));
			if (nyday.unix() == date.unix()) {
				return 1;
			}
		}

		else if (day >= 16 && day <= 21) {
			// MLK Day is the third Monday of January
			if (multipleWeekday(1,3,1,year).unix() == date.unix()) {
				return 1;
			}
		}
	}
	else if (month == 2) {
		// Washington's Birthday is the third Monday
		if (multipleWeekday(1,3,2,year).unix() == date.unix()) {
			return 1;
		}
	}
	else if (month == 5) {
		// Memorial Day is the last Monday of May
		// shortcut: get first Monday of June
		var juneMonday = multipleWeekday(1,1,6,year);
		// go back a week
		var observed = juneMonday.subtract('d',7);
		if (observed.unix() == date.unix()) {
			return 1;
		}
	}
	else if (month == 7) {
		// Independence Day
		var actual = moment("7/4/" + year);
		var observed = holidayRounder(actual);
		if (observed.unix() == date.unix()) {
			return 1;
		}
	}
	else if (month == 9) {
		// Labor Day is first Monday
		if (multipleWeekday(1,1,9,year).unix() == date.unix()) {
			return 1;
		}
	}
	else if (month == 10) {
		// Columbus Day is second Monday
		if (multipleWeekday(1,2,10,year).unix() == date.unix()) {
			return 1;
		}
	}
	else if (month == 11) {
		if (day >= 10 && day <= 12) {
			// Veteran's Day is November 11
			var actual = moment("11/11/" + year);
			var observed = holidayRounder(actual);
			if (observed.unix() == date.unix()) {
				return 1;
			}
		}
		else if (day >= 22 && day <= 28) {
			// Thanksgiving is the fourth Thursday
			if (multipleWeekday(4,4,11,year).unix() == date.unix()) {
				return 1;
			}
		}
	}
	else if (month == 12) {
		// Christmas is December 25
		var actual = moment("12/25/" + year);
		var observed = holidayRounder(actual);
		if (observed.unix() == date.unix()) {
			return 1;
		}
	}
	return 0;
};

module.exports.checkHoliday = checkHoliday;
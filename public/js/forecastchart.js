$(document).ready(function() {

	$.getJSON("/js/chartData.json", function(data) {
		nv.addGraph(function() {

			var chartColor = "rgba(151,187,205,1)";

			var chart = nv.models.discreteBarChart()
			    .x(function(d) { return d.label })
		    	.y(function(d) { return d.value })
		    	.staggerLabels(false)
		    	.tooltips(false)
		    	.showValues(false)
		    	.color([chartColor]);

		  	d3.select('#chart svg')
		    	.datum(data)
		    	.transition().duration(500)
		    	.call(chart);

		  	nv.utils.windowResize(chart.update);
		  	return chart;
		});
	});

	// $(".hoverTip").tooltipster({
	// 	contentAsHTML: true
	// });
	$(".hoverTip").popover({
		trigger: "hover",
		html: true
	});
});
/*  This visualization was made possible by modifying code provided by:

Scott Murray, Choropleth example from "Interactive Data Visualization for the Web" 
https://github.com/alignedleft/d3-book/blob/master/chapter_12/05_choropleth.html   
		
Malcolm Maclean, tooltips example tutorial
http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html

Mike Bostock, Pie Chart Legend
http://bl.ocks.org/mbostock/3888852  */

		
//Width and height of map
var width = 960;
var height = 500;

// D3 Projection
var projection = d3.geo.albersUsa()
				   .translate([width/2, height/2])    // translate to center of screen
				   .scale([1000]);          // scale things down so see entire US
        
// Define path generator
var path = d3.geo.path()               // path generator that will convert GeoJSON to SVG paths
		  	 .projection(projection);  // tell path generator to use albersUsa projection
		
// Define linear scale for output
var color = d3.scale.linear()
			  .range(["rgb(213,222,217)","rgb(69,173,168)","rgb(84,36,55)","rgb(217,91,67)"]);

//Create SVG element and append map to the SVG
var svg = d3.select("body")
			.append("svg")
			.attr("width", width)
			.attr("height", height);
        
// Append Div for tooltip to SVG
var div = d3.select("body")
		    .append("div")
    		.attr("class", "tooltip")            
    		.style("opacity", 0);

var tweetDisplay = d3.select("body")
					 .append("p")
					 .style("font-size", "16px");

// var url = 'https://newsapi.org/v2/top-headlines?' +
// 	'country=us&' +
// 	'apiKey=664519e8bb6249439872b39dde950086';

// var req = new Request(url);

// fetch(req)
// 	.then(function(response) {
// 		console.log(response.json());
// });

var dateToMillis = d3.time.format("%a %b %d %H:%M:%S %Z %Y");

// Load GeoJSON data and merge with states data
d3.json("data/us-states.json", function(json) {
		
	// Bind the data to the SVG and create one path per GeoJSON feature
	svg.selectAll("path")
		.data(json.features)
		.enter()
		.append("path")
		.attr("d", path)
		.style("stroke", "#fff")
		.style("stroke-width", "1")
		.style("fill", function(d) {

		// Get data value
		var value = d.properties.visited;

		if (value) {
		//If value exists…
		return color(value);
		} else {
		//If value is undefined…
		return "rgb(213,222,217)";
		}
	});

	var allTweetData = [];
	var currentTweetData = [];

	d3.json("data/data.json", function(error, data) {
		if (error) {
			return console.warn(error);
		}
		allTweetData = data;
		// for (var i = 0; i < allTweetData.length; ++i)
		// {
		// 	console.log(allTweetData[i][7] + " in millis " + dateToMillis.parse(allTweetData[i][7]).getTime());
		// }
		timer = d3.timer(timerCallback);
	});

	function createCircles() {
		svg.selectAll("circle")
		.data(currentTweetData)
		.enter()
		.append("circle")
		.attr("cx", function(d) {
			// console.log("PROJECTING");
			// console.log(d[0] + " " + d[1]);
			// console.log(projection([d[1], d[0]]));
			if (projection([d[1], d[0]]) != null)
				return projection([d[1], d[0]])[0];
			else
				return 0;
		})
		.attr("cy", function(d) {
			if (projection([d[1], d[0]]) != null)
				return projection([d[1], d[0]])[1];
			else
				return 0;
		})
		.attr("r", 10)
			.style("fill", "steelblue")	
			.style("opacity", 0.85)	

		// Modification of custom tooltip code provided by Malcolm Maclean, "D3 Tips and Tricks" 
		// http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html
		.on("mouseover", function(d) {
	    	div.transition()        
	      	   .duration(200)      
	           .style("opacity", .9);   
	        div.text(d[5])
	           .style("left", (d3.event.pageX) + "px")
	           .style("top", (d3.event.pageY - 28) + "px")
	           .style("width", (d[5].length * 8) + "px")
	           .style("height", "20px");
		})   

	    // fade out tooltip on mouse out               
	    .on("mouseout", function(d) {       
	        div.transition()        
	           .duration(500)      
	           .style("opacity", 0);   
	    })

	    .on("click", function(d) {
	    	tweetDisplay.text(d[6]);
	    });
	}

	function updateCircles() {
		svg.selectAll("circle")
		.data(currentTweetData)
		.transition()
		.duration(500)
		.attr("cx", function(d) {
			if (projection([d[4], d[3]]) != null)
				return projection([d[4], d[3]])[0];
			else
				return 0;
		})
		.attr("cy", function(d) {
			if (projection([d[4], d[3]]) != null)
				return projection([d[4], d[3]])[1];
			else
				return 0;
		});
	}

	var counter = 0;
	var index = 0;
	function timerCallback(elapsed) {
		counter++;
		if (counter > 40) {
			counter = 0;
			if (index < allTweetData.length - 1) {
				currentTweetData.push(allTweetData[index]);
				index++;
				createCircles();
				updateCircles();
			}
		}
	}
});
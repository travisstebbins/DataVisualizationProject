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
var projection = d3.geoAlbersUsa()
				   .translate([width/2, height/2])    	// translate to center of screen
				   .scale([1000]);          			// scale things down so see entire US
        
// Define path generator
var path = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
		  	 .projection(projection);  // tell path generator to use albersUsa projection
		
// Define linear scale for output
var color = d3.scaleLinear()
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

// append paragraph for displaying tweet content
var tweetDisplay = d3.select("body")
					 .append("p")
					 .style("font-size", "16px");

// news api code
// var url = 'https://newsapi.org/v2/top-headlines?' +
// 	'country=us&' +
// 	'apiKey=664519e8bb6249439872b39dde950086';

// var req = new Request(url);

// fetch(req)
// 	.then(function(response) {
// 		console.log(response.json());
// });

var parseTime = d3.timeParse("%a %b %d %H:%M:%S %Z %Y");
//var timeSecs = d3.timeMinute
var currentTime;
var minTime;
var maxTime;

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

	// holds all of the loaded tweet data
	var allTweetData = [];
	// holds the tweet data tweeted up to currentTime
	var currentTweetData = [];

	// load in tweet data
	d3.json("data/data.json", function(error, data) {
		var formatTime = d3.timeFormat("%Q");
		console.log(d3.timeSecond(new Date)); // "June 30, 2015"
		if (error) {
			return console.warn(error);
		}
		for (var i = 0; i < data.length; i++) {
			data[i][7] = parseTime(data[i][7]);
		}
		allTweetData = data;
		currentTime = allTweetData[0][7].getTime() - 1;
		minTime = currentTime;
		maxTime = allTweetData[allTweetData.length - 1][7].getTime() + 1;

		timer = d3.timer(timerCallback);
	});

	// creates and animates the circles based on currentTwitterData array
	function createCircles() {
		svg.selectAll("circle")
		.data(currentTweetData)
		.enter()
		.append("circle")
		.attr("cx", function(d) {
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
	    })

	    // handle animation of circle
	    .transition()
		.duration(500)
		.attr("cx", function(d) {
			console.log("animating " + d[2] + " to " + d[5]);
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

		// delete circle if it is removed from currentTwitterData
		svg.selectAll("circle")
			.data(currentTweetData)
			.exit()
			.remove();
	}

	// keeps track of current position in allTwitterData
	var tweetCounter = 0;

	function timerCallback(elapsed) {

		// remove tweets that are after the current time
		while (tweetCounter >= 0 && currentTweetData.length > 0 && tweetCounter - 1 <= currentTweetData.length && currentTweetData[tweetCounter - 1][7].getTime() > currentTime) {
			console.log("deleting element " + (tweetCounter - 1));
			currentTweetData.splice(tweetCounter - 1, 1);
			tweetCounter--;
		}

		// add tweets that are before the current time
		while (tweetCounter < allTweetData.length && allTweetData[tweetCounter][7].getTime() < currentTime) {
			currentTweetData.push(allTweetData[tweetCounter]);
			tweetCounter++;
		}

		createCircles();
	}
});

document.addEventListener('keydown', function(event) {
    if(event.keyCode == 37) {
        if (currentTime > minTime) {
        	currentTime -= 3000;
        }
    }
    else if(event.keyCode == 39) {
        if (currentTime < maxTime) {
        	currentTime += 3000;
        }
    }
});
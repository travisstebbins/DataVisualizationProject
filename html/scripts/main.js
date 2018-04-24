/*  This visualization was made possible by modifying code provided by:

Scott Murray, Choropleth example from "Interactive Data Visualization for the Web" 
https://github.com/alignedleft/d3-book/blob/master/chapter_12/05_choropleth.html   
		
Malcolm Maclean, tooltips example tutorial
http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html

Mike Bostock, Pie Chart Legend
http://bl.ocks.org/mbostock/3888852  */

		
//Width and height of map
var width = 960;
var height = 540;
var sliderHeight = 50;



//Radius of circles
var initialRad = 100;
var globalRad = Math.sqrt(initialRad);


// D3 Projection
var projection = d3.geoAlbersUsa();
				   //.translate([width/2, height/2])    	// translate to center of screen
				   //.scale([1000]);          			// scale things down so see entire US
        
// Define path generator
var path = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
		  	 .projection(projection);  // tell path generator to use albersUsa projection

//Create SVG element and append map to the SVG
var svg = d3.select("body")
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g");


var e= d3.select(".selection");

var brush = d3.brush();

function visFilter(d){
e = d3.select(".selection");
if(e["_groups"][0][0]==null )
{
	return "visible";
}
if( e.attr("x")==null)
	return "visible";


	if(d3.select(this).attr("fx")> e.attr("x")&&
		d3.select(this).attr("fy")>e.attr("y")&&
		d3.select(this).attr("fx")<parseInt(e.attr("x"))+parseInt(e.attr("width"))&&
		d3.select(this).attr("fy")<parseInt(e.attr("y"))+parseInt(e.attr("height"))) 
		return "visible";
	else 
		return "hidden";
}

	


function endbrush(d)
{
	
			svg.selectAll("circle").attr("visibility", visFilter);}
 brush.on("end", endbrush);

function zoomed() {
	

   svg.attr("transform",d3.event.transform);


	var a=d3.event.transform.k;
	//console.log(a);
	if(a>0)
		globalRad=Math.sqrt(initialRad/a);
	svg.selectAll("circle").attr("r" , globalRad);
}

var zoom = d3.zoom()
    .scaleExtent([.75, 20])
    .on("zoom", zoomed);



d3.select("body").append("br");





var sliderSvg = d3.select("body")
					.append("svg")
					.attr("width", width)
					.attr("height", sliderHeight);

var slider;
var sliderX;
var handle;
var draggingHandle = false;
        
// Append Div for tooltip to SVG
var div = d3.select("body")
		    .append("div")
    		.attr("class", "tooltip")            
    		.style("opacity", 0);

// append paragraph for displaying tweet content
d3.select("body").append("br");
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
var formatDate = d3.timeFormat("%b %d %H:%M:%S");
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
		if (error) {
			return console.warn(error);
		}
		for (var i = 0; i < data.length; i++) {
			data[i][7] = parseTime(data[i][7]);
		}
		allTweetData = data;
		currentTime = allTweetData[0][7].getTime();
		minTime = currentTime;
		maxTime = allTweetData[allTweetData.length - 1][7].getTime();

		// append slider for timeline
		var sliderMargin = {right: 50, left: 50},
		    sliderWidth = width - sliderMargin.left - sliderMargin.right;

		sliderX = d3.scaleTime()
		    .domain([new Date(d3.extent(allTweetData, function(d) { return d[7]; })[0].getTime() - 10), new Date(d3.extent(allTweetData, function(d) { return d[7]; })[1].getTime() + 10)])
		    .range([0, sliderWidth])
		    .clamp(true);

		slider = sliderSvg.append("g")
		    .attr("class", "slider")
		    .attr("transform", "translate(" + sliderMargin.left + "," + sliderHeight / 4 + ")");

		slider.append("line")
		    .attr("class", "track")
		    .attr("x1", sliderX.range()[0])
		    .attr("x2", sliderX.range()[1])
		  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
		    .attr("class", "track-inset")
		  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
		    .attr("class", "track-overlay")
		    .call(d3.drag()
		        .on("start.interrupt", function() { slider.interrupt(); })
		        .on("start", function() { draggingHandle = true; })
		        .on("start drag", function() { draggingHandle = true; currentTime = sliderX.invert(d3.event.x).getTime(); handle.attr("cx", sliderX(currentTime)); })
		    	.on("end", function() { draggingHandle = false; currentTime = sliderX.invert(d3.event.x).getTime(); handle.attr("cx", sliderX(currentTime)); }));

		slider.insert("g", ".track-overlay")
		    .attr("class", "ticks")
		    .attr("transform", "translate(0," + 18 + ")")
		  .selectAll("text")
		  .data(sliderX.ticks(10))
		  .enter().append("text")
		    .attr("x", sliderX)
		    .attr("text-anchor", "middle")
		    .text(function(d) { return formatDate(d); });

		handle = slider.insert("circle", ".track-overlay")
				    .attr("class", "handle")
				    .attr("r", 9);

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
		.attr("r", globalRad)
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
	

			tweetDisplay.text(d[6]);
		})   

	    // fade out tooltip on mouse out               
	    	.on("mouseout", function(d) {       
	        div.transition()        
	           .duration(500)      
	           .style("opacity", 0);   
	    })
		.attr("fx", function(d) {
			if (projection([d[4], d[3]]) != null)
				return projection([d[4], d[3]])[0];
			else
				return 0;
		})
		.attr("fy", function(d) {
			if (projection([d[4], d[3]]) != null)
				return projection([d[4], d[3]])[1];
			else
				return 0;
		})


		.attr("visibility", visFilter)
		.attr("destination", function(d){return d[5]})





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

		if (!draggingHandle && currentTime < maxTime) {
			currentTime += 1000;
			if (currentTime > maxTime) {
				currentTime = maxTime;
			}
			//currentTime = minTime;
			handle.attr("cx", sliderX(currentTime));
		}

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

	svg.append("g").attr("class", "overlay").call(brush);
	svg.call(zoom);

});
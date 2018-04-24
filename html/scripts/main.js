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
var sliderHeight = 100;



//Radius of circles
var initialRad = 100;
var globalRad = Math.sqrt(initialRad);


// D3 Projection
var projection = d3.geoAlbersUsa();
        
// Define path generator
var path = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
		  	 .projection(projection);  // tell path generator to use albersUsa projection

//Create SVG element and append map to the SVG
var svg = d3.select("body")
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g");

var forBrush;

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
var sliderMargin;
var sliderWidth;
var sliderX;
var handle;
var draggingHandle = false;
var sliderSpeed = 1000;
        
// Append Div for tweet tooltip to svg
d3.select("body").append("br");
var tweetTooltip = d3.select("body")
		    .append("div")
    		.attr("class", "tweetTooltip")            
    		.style("opacity", 0);

// append div for news tooltip to svg
var newsTooltip = d3.select("body")
			.append("div")
			.attr("class", "newsTooltip")
			.style("opacity", 0);

// append paragraph for displaying tweet content
var tweetDisplay = d3.select("body")
					 .append("p")
					 .style("font-size", "16px");

// data arrays
// holds all of the loaded tweet data
var allTweetData = [];
// holds the tweet data tweeted up to currentTime
var currentTweetData = [];
// holds the news data
var newsArticles = [];

// keeps track of current position in allTwitterData
var tweetCounter = 0;

var parseTweetTime = d3.timeParse("%a %b %d %H:%M:%S %Z %Y");
var parseNewsTime = d3.timeParse("%Y-%m-%dT%H:%M:%SZ");
var formatDate = d3.timeFormat("%b %d %H:%M:%S");
var formatDateForNews = d3.timeFormat("%Y-%m-%dT%H:%M:%S");

var currentTime;
var minTime;
var maxTime;
var timeRange = 20000000;

loadMapData();

function loadMapData() {
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
				return "rgb(213,222,217)";
			});
			forBrush = svg.append("g");

		loadTweetData();
	});
}

function loadTweetData() {
	// load in tweet data
	d3.json("data/newdata.json", function(error, data) {
		if (error) {
			return console.warn(error);
		}
		for (var i = 0; i < data.length; i++) {
			data[i].time = parseTweetTime(data[i].time);
		}

		allTweetData = data;

		var oldestTweetTime = formatDateForNews(new Date(allTweetData[0].time.getTime() - 300000));
		var newestTweetTime = formatDateForNews(new Date(allTweetData[allTweetData.length - 1].time.getTime() + 300000));

		loadNewsData(oldestTweetTime, newestTweetTime);
	});
}

function loadNewsData(oldestTweetTime, newestTweetTime) {
	console.log("oldestTweetTime = " + oldestTweetTime);
	console.log("newestTweetTime = " + newestTweetTime);
	//news api code
	var url = 'https://newsapi.org/v2/everything?' +
				//'country=us&' +
				'q=united states&' +
				'lang=en&' +
				'from=' + oldestTweetTime + '&' +
				'to=' + newestTweetTime + '&' +
				'apiKey=664519e8bb6249439872b39dde950086';

	console.log(url);

	var req = new Request(url);

	fetch(req)
		.then(function(response) {
			response.json().then(function(data) {
				newsArticles = data.articles;
				newsArticles.forEach(function (element) {
					element.publishedAt = parseNewsTime(element.publishedAt);
				});

				newsArticles.sort(function (a, b) {
					return a.publishedAt - b.publishedAt;
				});

				console.log(newsArticles);

				currentTime = newsArticles[0].publishedAt.getTime();
				minTime = currentTime - 1;
				maxTime = currentTime + timeRange;

				createTimeline();
				timer = d3.timer(timerCallback);
			})
	});
}

function createTimeline() {
	// append slider for timeline
	sliderMargin = {right: 50, left: 50};
	sliderWidth = width - sliderMargin.left - sliderMargin.right;

	sliderX = d3.scaleTime()
	    //.domain([new Date(currentTime), new Date(currentTime + timeRange)])
	   	.domain([new Date(d3.extent(newsArticles, function(d) { return d.publishedAt; })[0].getTime() - 10), new Date(d3.extent(newsArticles, function(d) { return d.publishedAt; })[1].getTime() + 10)])
	    .range([0, sliderWidth])
	    .clamp(true);

	slider = sliderSvg.append("g")
	    .attr("class", "slider")
	    .attr("transform", "translate(" + sliderMargin.left + "," + sliderHeight / 2 + ")")
	    .attr("height", 75);

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
	  .data(sliderX.ticks(8))
	  .enter().append("text")
	    .attr("x", sliderX)
	    .attr("text-anchor", "middle")
	    .text(function(d) { return formatDate(d); });

	handle = slider.insert("circle", ".track-overlay")
			    .attr("class", "handle")
			    .attr("r", 9);

	var newsIconPoints = [[0, 0], [-10, -10], [-20, -10], [-20, -40], [20, -40], [20, -10], [10, -10], [0, 0]];

	slider.selectAll("path")
		.data(newsArticles)
		.enter()
		.append("svg:path")
			.attr("d", d3.line()(newsIconPoints))
			.attr("transform", function(d) {
				return "translate(" + sliderX(d.publishedAt.getTime()) + ", " + -5 + ")";
			})
			.attr("class", "newsIcon")
			.attr("stroke", "black")
			.on("mouseover", function(d) {
		    	newsTooltip.transition()        
		      	   .duration(200)      
		           .style("opacity", .9);   
		        newsTooltip.text(d.title)
		           .style("left", (d3.event.pageX) + "px")
		           .style("top", (d3.event.y - d.title.length) + "px")
		           .style("width", (d.title.length * 3) + "px")
		           .style("height", (d.title.length) + "px");
			})

		    // fade out tooltip on mouse out               
		    .on("mouseout", function(d) {       
		        newsTooltip.transition()        
		           .duration(500)      
		           .style("opacity", 0);   
		    });
}

function updateTimeline()
{
	sliderX = d3.scaleTime()
	    .domain([new Date(currentTime), new Date(currentTime + timeRange)])
	    .range([0, sliderWidth])
	    .clamp(true);

	slider.selectAll("text")
	  .data(sliderX.ticks(10))
	  .enter().append("text")
	    .attr("x", sliderX)
	    .attr("text-anchor", "middle")
	    .text(function(d) { return formatDate(d); })
	slider.exit()
	  	.remove();

	//var newsIconPoints = [[0, 0], [-10, -10], [-20, -10], [-20, -40], [20, -40], [20, -10], [10, -10], [0, 0]];
}

function timerCallback(elapsed) {
	if (!draggingHandle && currentTime < maxTime) {
		currentTime += sliderSpeed;
		if (currentTime > maxTime) {
			currentTime = maxTime;
		}
		handle.attr("cx", sliderX(currentTime));
	}

	// remove tweets that are after the current time
	while (tweetCounter >= 0 && currentTweetData.length > 0 && tweetCounter - 1 <= currentTweetData.length && currentTweetData[tweetCounter - 1].time.getTime() > currentTime) {
		console.log("deleting element " + (tweetCounter - 1));
		currentTweetData.splice(tweetCounter - 1, 1);
		tweetCounter--;
	}

	// add tweets that are before the current time
	while (tweetCounter < allTweetData.length && allTweetData[tweetCounter].time.getTime() < currentTime) {
		currentTweetData.push(allTweetData[tweetCounter]);
		tweetCounter++;
	}

	//updateTimeline();

	createCircles();
}

// creates and animates the circles based on currentTwitterData array
function createCircles() {
	svg.selectAll("circle")
	.data(currentTweetData)
	.enter()
	.append("circle")
	.attr("cx", function(d) {
		if (projection([d.source.lng, d.source.lat]) != null)
			return projection([d.source.lng, d.source.lat])[0];
		else
			return 0;
	})
	.attr("cy", function(d) {
		if (projection([d.source.lng, d.source.lat]) != null)
			return projection([d.source.lng, d.source.lat])[1];
		else
			return 0;
	})
	.attr("r", globalRad)
		.style("fill", "steelblue")	
		.style("opacity", 0.85)	

	// Modification of custom tooltip code provided by Malcolm Maclean, "D3 Tips and Tricks" 
	// http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html
	.on("mouseover", function(d) {
		var cityState;
		if (d.destination.city.length > 0 && d.destination.state.length > 0) {
			cityState = d.destination.city + ", " + d.destination.state;
		}
		else if (d.destination.city.length > 0) {
			cityState = d.destination.city;
		}
		else if (d.destination.state.length > 0) {
			cityState = d.destination.state;
		}
		else
		{
			cityState = d.destination.name;
		}
    	tweetTooltip.transition()        
      	   .duration(200)      
           .style("opacity", .9);   
        tweetTooltip.text(cityState)
           .style("left", (d3.event.pageX) + "px")
           .style("top", (d3.event.pageY - 28) + "px")
           .style("width", (cityState.length * 5) + "px")
           .style("height", (cityState.length * 3) + "px");
		tweetDisplay.text(d.text);
	})

    // fade out tooltip on mouse out               
    .on("mouseout", function(d) {       
        tweetTooltip.transition()        
           .duration(500)      
           .style("opacity", 0);   
    })

		.attr("fx", function(d) {
			if (projection([d.destination.lng, d.destination.lat]) != null)
				return projection([d.destination.lng, d.destination.lat])[0];
			else
				return 0;
		})
		.attr("fy", function(d) {
			if (projection([d.destination.lng, d.destination.lat]) != null)
				return projection([d.destination.lng, d.destination.lat])[1];
			else
				return 0;
		})
		
		.attr("visibility", visFilter)
		.attr("destination", function(d){return d.destination.name})

		
    // handle animation of circle
    .transition()
	.duration(500)
	.attr("cx", function(d) {
		if (projection([d.destination.lng, d.destination.lat]) != null)
			return projection([d.destination.lng, d.destination.lat])[0];
		else
			return 0;
	})
	.attr("cy", function(d) {
		if (projection([d.destination.lng, d.destination.lat]) != null)
			return projection([d.destination.lng, d.destination.lat])[1];
		else
			return 0;
	});

	// delete circle if it is removed from currentTwitterData
	svg.selectAll("circle")
		.data(currentTweetData)
		.exit()
		.remove();


	
	forBrush.attr("class", "overlay").call(brush);
	svg.call(zoom);

}
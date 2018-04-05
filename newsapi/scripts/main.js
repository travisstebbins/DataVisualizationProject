var url = 'https://newsapi.org/v2/top-headlines?' +
	'country=us&' +
	'apiKey=664519e8bb6249439872b39dde950086';

// var url = 'https://newsapi.org/v2/everything?' +
//         'q=Apple&' +
//         'from=2018-04-01&' +
//         'sortBy=popularity&' +
//         'apiKey=664519e8bb6249439872b39dde950086';

var req = new Request(url);

fetch(req)
	.then(function(response) {
		console.log(response.json());
});

var dictionary = {};

d3.csv("../data/uscitiesv1.3.csv", function(data) {
	data.forEach(function(d) {
		dictionary[d.city_ascii + "," + d.state_id] = d;
		if (d.population > 350000)
		{
			dictionary[d.city_ascii] = d;
		}
	});
	console.log(dictionary["Drayton,ND"]);
	console.log(dictionary["Houston"]);
});
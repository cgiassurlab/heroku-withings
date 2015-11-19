
    for (var i = 0; i < data.length; i++ ) {
	var point = data[i];
	var result = JSON.stringify(point.measures[0].value*0.01)
	}
	var buyerData = {
	labels : ["1","2","3","4"],
	datasets : [
		{
			fillColor : "rgba(172,194,132,0.4)",
			strokeColor : "#ACC26D",
			pointColor : "#fff",
			pointStrokeColor : "#9DB86D",
			data : result
		}
	]
}

	var buyers = document.getElementById('buyers').getContext('2d');
    new Chart(buyers).Line(buyerData);

 
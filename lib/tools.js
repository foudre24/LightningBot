exports.decodeURL = function(url, tag){

	tag = tag.replace(/[\[\]]/g, "\\$&");
	
	let regexp = new RegExp("[?&]" + tag + "(=([^&#]*)|&|#|$)"), results = regexp.exec(url);
	
	if (results === null) return null;
	
	return decodeURIComponent(results[2].replace(/\+/g, " "));

}

exports.convertTime = function(time){

	let timeUnits = {s: 1, m: 60, h: 3600};

	let total = 0;
	let regexp = /(\d+)(ms|s|m|h)/g;
	let results;

	while ((results = regexp.exec(time)) !== null){
		total = total + results[1] * timeUnits[results[2]];
	}
	
	return total;
}
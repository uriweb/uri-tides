(function(){
    
    'use strict';
    
    /* Set parameters for data retrieval 
     * See API documentation at https://tidesandcurrents.noaa.gov/api/
     */
    var parameters = {
        product: 'water_level', // use 'predictions' for predicted data
        date: 'recent',
        datum: 'MLLW',
        station: '8454049',
        time_zone: 'GMT',
        units: 'english'
    };  
    
    window.addEventListener('load', function(){
        uriTidesInit();
    });
             
    
    /*
     * Initiate tides widget
     */
    function uriTidesInit() {
        var els;
        
        els = document.querySelectorAll('.uri-tides-widget');
        
        els.forEach(function(el){
            el.innerHTML = 'JS is working...';
            getTides(el, getWaterLevels);
        });
    }
    
    
    /*
     * Get tide data from https://tidesandcurrents.noaa.gov/
     * @param el obj the tide widget element
     * @param success func the function to handle the response
     */
    function getTides(el, success) {
        var url, x, p = '', xmlhttp = new XMLHttpRequest();
        
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == XMLHttpRequest.DONE && xmlhttp.status == 200) {
				success(el, JSON.parse(xmlhttp.responseText), buildChart);
			}
		};
        
        url = 'https://tidesandcurrents.noaa.gov/api/datagetter?product=predictions&application=NOS.COOPS.TAC.WL&date=today&datum=MLLW&station=8454049&time_zone=gmt&units=english&interval=hilo&format=json';
		xmlhttp.open('GET', url, true);
		xmlhttp.send();
    
	}
    
    
    /*
     * Get water level data from https://tidesandcurrents.noaa.gov/
     * @param el obj the tide widget element
     * @param tides obj the tides data
     * @param success func the function to handle the response
     */
    function getWaterLevels(el, tides, success) {
        var url, x, p = '', xmlhttp = new XMLHttpRequest();
        
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == XMLHttpRequest.DONE && xmlhttp.status == 200) {
				success(el, tides, JSON.parse(xmlhttp.responseText));
			}
		};
        
        for (x in parameters) {
            p += '&' + x + '=' + parameters[x];
        }
		
        url = "https://tidesandcurrents.noaa.gov/api/datagetter?application=NOS.COOPS.TAC.WL&format=json" + p;
		xmlhttp.open('GET', url, true);
		xmlhttp.send();
    
	}
    
    
    /*
     * Build chart and display
     * @param el obj the tide widget element
     * @param raw json the returned data
     */
    function buildChart(el, tides, data) {
		data = data.data; // Use data.predictions when fetching prediction data
        
        //console.log(data);
        
        var current, previous, tide, output, n = data.length;
                
        current = data[n - 1].v;
        previous = data[n - 2].v;
        
        tide = (current - previous > 0) ?  'rising' : 'falling';
        
        output = 'height: ' + current;
        output += '<br />tide: ' + tide;
        
        
        // Build the Plot SVG
        output += '<svg height="100px" width="240px" class="tidechart">';
        
        for (var i=n-240; i<n; i=i+2) {
            if (data[i].v) {
                output += '<circle cx="' + (i - (n - 240)) + '" cy="' + (80 - data[i].v * 10) + '" r="1" stroke="black" stroke-width="0" fill="#267ce0"" />';
            }
        }
            
        output += '</svg>';
        
        
        
        // Build the Graphic SVG
        
        var predictions = tides.predictions,
            diff = Math.abs(predictions[0].v - predictions[1].v),
            h = 30; // the SVG height
                
        output += '<svg height="' + h + 'px" width="100px" class="tidechart">';
        output += '<g transform="matrix(0.830841,0,0,0.872634,-11809.4,-4442.24)">';
        output += '<path d="M14215,5107.81C14215,5107.81 14226.3,5091.67 14245,5091.8C14263.7,5091.94 14284.2,5123.99 14305,5123.81C14325.7,5123.62 14333,5107.81 14333,5107.81" style="fill:none;stroke:black;stroke-width:2.36px;"/>';
        output += '</g>'
        
        output += '<circle cx="50" cy="' + (h - h / diff * current) + '" r="5" stroke="black" stroke-width="0" fill="#000"" />';
        
        output += '</svg>';
        
        // Display
        el.innerHTML = output;
        
    }
    
})();
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
    
    /* Set the height of the graphic in pixels.
     * The graphic will scale proportionally.
     */
    var height = 20;
    
    
    // Wait for the window to load...
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
            el.innerHTML = 'Initiating tides...';
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
        
        url = 'https://tidesandcurrents.noaa.gov/api/datagetter?product=predictions&application=NOS.COOPS.TAC.WL&begin_date=20170921&end_date=20170922&datum=MLLW&station=8454049&time_zone=GMT&units=english&interval=hilo&format=json';
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
        
        console.log(tides);
        
        var current, previous, tide, output, n = data.length;
                
        current = Math.round(data[n - 1].v * 10) / 10;
        previous = data[n - 2].v;
        
        tide = (current - previous > 0) ?  'rising' : 'falling';
        
        output = '<div class="uri-tides">'
        output += '<span class="height">' + current + '</span>';
        output += '<div class="specs">';
        output += '<span class="units">ft</span>';
        output += '<span class="tide ' + tide + '"></span>';
        output += '</div>';   
        output += '</div>';
        
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
            now = new Date(),
            times = [];
        
        for (var i=0; i<predictions.length; i++) {
            var t = predictions[i].t.replace(' ', 'T') + 'Z';
            times.push(new Date(t));
            
            var delta = now.getTime() - times[i].getTime();
            if(delta >= 0) {
                var deltaX = delta;
                var cycles = i;
                var previous = predictions[i].type;
            }
        }
        
        var SVGw = times[2] - times[0];
                        
        var cycle = SVGw / 2;
        
        if (previous == 'L' && deltaX >= cycle / 2) {
            deltaX = deltaX;
        } else if (previous == 'L' && deltaX < cycle / 2) {
            deltaX = deltaX + cycle;
        } else {
            deltaX = deltaX + cycle / 2;
        }
        
        var h = height, // the SVG height
            w = h*3.5, // the SVG width
            p = h/4; // padding
            
        var x = (2 * Math.PI) / SVGw * deltaX;
        var deltaY = Math.sin(x) + 1;
                        
        output += '<svg height="' + (h + p * 2) + 'px" width="' + (w + p * 2) + 'px" class="tidegraphic">';
        output += '<circle cx="' + (w / SVGw * deltaX + p) + '" cy="' + (h - h / 2 * deltaY + p) + '" r="' + p + '" stroke="black" stroke-width="0" fill="#000"" />';
        output += '</svg>';
        
        
        // Display
        el.innerHTML = output;
        
    }
    
})();
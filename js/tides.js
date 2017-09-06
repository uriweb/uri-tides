(function(){
    
    'use strict';
    
    var parameters = {
        product: 'water_level',
        date: 'today',
        datum: 'MLLW',
        station: '8454049',
        time_zone: 'LST',
        units: 'english'
    };  
    
    window.addEventListener('load', function(){
        uriTidesInit();
    });
                            
    function uriTidesInit() {
        var els;
        
        els = document.querySelectorAll('.uri-tides-widget');
        
        els.forEach(function(el){
            el.innerHTML = 'JS is working...';
            fetch(el, handleResponse);
        });
    }
    
    
    function fetch(el, success) {
        var url, x, p = '', xmlhttp = new XMLHttpRequest();
        
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
				if (xmlhttp.status == 200) {
					success(el, xmlhttp.responseText);
				}
	 			else if (xmlhttp.status == 404) {
					console.log('error 404 was returned');
					setStatus('error', 'There was an error retrieving results.');
					clearResults();
	 			}
				else {
					console.log('something else other than 200 or 404 was returned');
				}
			}
		};
        
        for (x in parameters) {
            p += '&' + x + '=' + parameters[x];
        }
		
        url = "https://tidesandcurrents.noaa.gov/api/datagetter?application=NOS.COOPS.TAC.WL&format=json" + p;
		xmlhttp.open('GET', url, true);
		xmlhttp.send();
	}
    
    
    function handleResponse(el, raw) {
		var parsed = JSON.parse(raw),
            data = parsed.data,
            n = data.length;
        
        console.log(data);
        
        var current, previous, tide, output, i;
                
        current = data[n - 1].v;
        previous = data[n - 2].v;
        
        tide = (current - previous > 0) ?  'rising' : 'falling';
        
        output = 'height: ' + current;
        output += '<br />tide: ' + tide;
        
        output += '<svg height="100px" width="300px" class="tidechart">';
        
        for (i=0; i<n; i=i+5) {
            output += '<circle cx="' + i + '" cy="' + (100 - data[i].v * 10) + '" r="2" stroke="black" stroke-width="0" fill="#267ce0"" />'
        }
        
        output += '</svg>';
        
        el.innerHTML = output;
        
    }
    
})();
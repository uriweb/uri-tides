(function(){
    
    'use strict';
    
    /*
     * See CO-OPS JSON API documentation at https://tidesandcurrents.noaa.gov/api/
     */ 
    
    var parameters = {
        'station' : '8454049',
        'timezone' : 'GMT',
        'baseURL' : 'https://tidesandcurrents.noaa.gov/api/datagetter?'
    }
        
    
    /* 
     * Set the dimensions of the sine curve
     * This is the dimension of the curve itself, not necessarily
     * the size of the image (unless the padding is 0).
     */
    var curve = {
            'height' : 20,
            'width' : 70,
            'padding' : 5
        };
    
    
    // Wait for the window to load...
    window.addEventListener('load', function(){
        uriTidesInit();
    });
             
    
    /*
     * Initiate tides widget
     */
    function uriTidesInit() {
        var els, i;
        
        els = document.querySelectorAll('.uri-tides-widget');
        
        for(i=0; i<els.length; i++) {
            els[i].innerHTML = '<div class="status">Initiating tides...</div>';
            getTides(els[i], getWaterLevels);
        };
            
    }
    
    
    /*
     * Set, get, and check cookie for metric/imperial display
     */
    class cookie {
        static set(cname, cvalue, exdays) {
            var d = new Date();
            d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
            var expires = 'expires='+d.toUTCString();
            document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
        }

        static get(cname) {
            var name = cname + '=';
            var ca = document.cookie.split(';');
            for(var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return '';
        }
    }

    
    /*
     * Get tide data from https://tidesandcurrents.noaa.gov/
     * @param el obj the tide widget element
     * @param success func the function to handle the response
     */
    function getTides(el, success) {
        var url, xmlhttp = new XMLHttpRequest();
        
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == XMLHttpRequest.DONE && xmlhttp.status == 200) {
				success(el, JSON.parse(xmlhttp.responseText), getWaterTemp);
			}
		};
        
        url = parameters.baseURL + 'product=predictions&application=NOS.COOPS.TAC.WL&date=recent&datum=MLLW&station=' + parameters.station + '&time_zone=' + parameters.timezone + '&units=english&interval=hilo&format=json';
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
        var url, xmlhttp = new XMLHttpRequest();
        
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == XMLHttpRequest.DONE && xmlhttp.status == 200) {
				success(el, tides, JSON.parse(xmlhttp.responseText), buildChart);
			}
		};
		
        url = parameters.baseURL + 'product=water_level&application=NOS.COOPS.TAC.WL&date=latest&datum=MLLW&station=' + parameters.station + '&time_zone=' + parameters.timezone + '&units=english&format=json';
		xmlhttp.open('GET', url, true);
		xmlhttp.send();
    
	}
    
    /*
     * Get water level data from https://tidesandcurrents.noaa.gov/
     * @param el obj the tide widget element
     * @param tides obj the tides data
     * @param success func the function to handle the response
     */
    function getWaterTemp(el, tides, data, success) {
        var url, xmlhttp = new XMLHttpRequest();
        
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == XMLHttpRequest.DONE && xmlhttp.status == 200) {
				success(el, tides, data, JSON.parse(xmlhttp.responseText));
			}
		};
		
        url = parameters.baseURL + 'product=water_temperature&application=NOS.COOPS.TAC.PHYSOCEAN&date=latest&station=' + parameters.station + '&time_zone=' + parameters.timezone + '&units=english&interval=6&format=json';
		xmlhttp.open('GET', url, true);
		xmlhttp.send();
    
	}
    
    
    /*
     * Build chart and display
     * @param el obj the tide widget element
     * @param raw json the returned data
     */
    function buildChart(el, tides, data, temp) {
		tides = tides.predictions;
        data = data.data;
        temp = temp.data;
                
        var tideHeight,
            output,
            display = {
                'imperial' : 'block',
                'metric' : 'none'
            }, 
            cname = 'uri-tides-water-temp';
        
        tideHeight = Math.round(data[data.length - 1].v * 10) / 10;
        
        if (cookie.get(cname)== 'metric') {
            display.imperial = 'none';
            display.metric = 'block';
        }
                                
        output = '<div class="uri-tides-metrics">';
        output += '<span class="label">WATER TEMP</span>';
        output += '<div style="display: ' + display.imperial + '" title="Switch to celcius">';
        output += temp[0].v + '&#176;<em>F</em>';
        //output += tideHeight + '<em>FT</em>';
        output += '</div><div style="display: ' + display.metric + '" title="Switch to fahrenheit">';
        output += Math.round((temp[0].v - 32) * 5 / 9 * 10) / 10 + '&#176;<em>C</em>';
        //output += Math.round(tideHeight * 3.048) / 10 + '<em>M</em>';
        output += '</div>';
        output += '</div>';
        
        /*
         * Build the SVG
         */
        
        // Initialize
        var now = new Date(),
            times = [],
            m = {};
               
        
        // Convert and push tide times to new array for use in next step
        for (var i=0; i<tides.length; i++) {
            var t = tides[i].t.replace(' ', 'T') + 'Z';
            times.push(new Date(t));
        }
        
        
        // Calculate the length of one tidal cycle based on the average of the last several cycles
        m.cycle = 0;
        for (var i=0; i<times.length - 2; i++) {
            m.cycle += times[i+2] - times[i];
        }
        m.cycle = m.cycle / (times.length - 2);
                   
        // Determine the amount of time that has elapsed since the last tide
        m.x = now - times[times.length-1];
        m.last = tides[tides.length-1].type;
              
        
        // Determine the position of the current tide in time along the displayed cycle
        m.quarter = m.cycle / 4;             
        if (m.last == 'L') {
            m.x = (m.x >= m.quarter) ? m.x - m.quarter : m.x + m.quarter * 3;
        } else {
            m.x = m.x + m.quarter;
        }
        
        
        // Use the x position to calculate the y position on a sine curve
        var x = (2 * Math.PI) / m.cycle * m.x;
        m.y = Math.sin(x) + 1;
        
        console.log(m);
                        
        // Put it all together, converting the x and y positions to proportions of the SVG dimensions
        output += '<div class="uri-tides-tide">';
        output += '<span class="label">TIDE</span>';
        output += '<svg height="' + (curve.height + curve.padding * 2) + 'px" width="' + (curve.width + curve.padding * 2) + 'px" class="uri-tides-graphic">';
        output += '<circle cx="' + (curve.width / m.cycle * m.x + curve.padding) + '" cy="' + (curve.height - curve.height / 2 * m.y + curve.padding) + '" r="' + curve.padding + '" stroke="black" stroke-width="0" fill="#555"" />';
        output += '</svg>';
        output += '</div>';
        
        output += '<div class="uri-tides-source">Source: <a href="https://tidesandcurrents.noaa.gov/stationhome.html?id=' + parameters.station + '" title="NOAA Center for Operational Oceanographic Producs and Services">NOAA/NOS/CO-OPS</a></div>';
        
        
        // Display
        el.innerHTML = output;
        
        el.querySelector('.uri-tides-metrics').addEventListener('click', function() {
            var divs = this.getElementsByTagName('div');
            if (divs[0].style.display == 'block' ) {
                divs[0].style.display = 'none';
                divs[1].style.display = 'block';
                cookie.set(cname, 'metric', 365);
            } else {
                divs[0].style.display = 'block';
                divs[1].style.display = 'none';
                cookie.set(cname, 'imperial', 365);
            }
        });
        
    }
    
})();
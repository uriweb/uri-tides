(function(){
    
    'use strict';
    
    /*
     * See CO-OPS JSON API documentation at https://tidesandcurrents.noaa.gov/api/
     */
    var parameters = {
        'station' : '8454049',
        'timezone' : 'GMT',
        'baseURL' : 'https://tidesandcurrents.noaa.gov/api/datagetter?'
    };
    
    
    // Wait for the window to load...
    window.addEventListener('load', function(){
        uriTidesInit();
    });
    
    
    /*
     * Helpers
     */
    class helpers {
        
        static setCookie(cname, cvalue, exdays) {
            var d = new Date();
            d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
            var expires = 'expires='+d.toUTCString();
            document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
        }

        static getCookie(cname) {
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
        
        static unitControl(el, s, cname) {
            el.querySelector(s).addEventListener('click', function() {
                var divs = this.getElementsByTagName('div');
                if (divs[0].style.display == 'block' ) {
                    divs[0].style.display = 'none';
                    divs[1].style.display = 'block';
                    helpers.setCookie(cname, 'metric', 365);
                } else {
                    divs[0].style.display = 'block';
                    divs[1].style.display = 'none';
                    helpers.setCookie(cname, 'imperial', 365);
                }
            });
        }
        
    } // End helpers
             
    
    /*
     * Initiate tides widget
     */
    function uriTidesInit() {
        var els, i;
        
        els = document.querySelectorAll('.uri-tides-widget');
        
        for(i=0; i<els.length; i++) {
            
            /* 
             * Set the dimensions of the sine curve
             * This is the dimension of the curve itself, not necessarily
             * the size of the image (unless the padding is 0).
             */
            var h = els[i].getAttribute('data-height');
            var curve = {
                'bound' : h,
                'height' : h * (2/3),
                'width' : h * (7/3),
                'padding' : h * (1/6)
            };
            
            els[i].innerHTML = '<div class="status">Initiating tides...</div>';
            getTides(els[i], curve, getWaterTemp);
        };
            
    }

    
    /*
     * Get tide data from https://tidesandcurrents.noaa.gov/
     * @param el el the tide widget element
     * @param curve obj the curve dimensions
     * @param success func the function to handle the response
     */
    function getTides(el, curve, success) {
        var d, date, url, xmlhttp = new XMLHttpRequest();
        
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == XMLHttpRequest.DONE && xmlhttp.status == 200) {
				success(el, curve, JSON.parse(xmlhttp.responseText), buildChart);
			}
		};
        
        // Get 3 days of predictions, centered on the current date
        d = new Date();
        date = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
        
        url = parameters.baseURL + 'product=predictions&application=NOS.COOPS.TAC.WL&begin_date=' + (parseInt(date) - 1) + '&end_date=' + (parseInt(date) + 1) + '&datum=MLLW&station=' + parameters.station + '&time_zone=' + parameters.timezone + '&units=english&interval=hilo&format=json';
        xmlhttp.open('GET', url, true);
		xmlhttp.send();
    
	}

    
    /*
     * Get water level data from https://tidesandcurrents.noaa.gov/
     * @param el el the tide widget element
     * @param curve obj the curve dimensions
     * @param tides obj the tides data
     * @param success func the function to handle the response
     */
    function getWaterTemp(el, curve, tides, success) {
        var url, xmlhttp = new XMLHttpRequest();
        
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == XMLHttpRequest.DONE && xmlhttp.status == 200) {
				success(el, curve, tides, JSON.parse(xmlhttp.responseText));
			}
		};
		
        url = parameters.baseURL + 'product=water_temperature&application=NOS.COOPS.TAC.PHYSOCEAN&date=latest&station=' + parameters.station + '&time_zone=' + parameters.timezone + '&units=english&interval=6&format=json';
		xmlhttp.open('GET', url, true);
		xmlhttp.send();
    
	}
    
    
    /*
     * Build chart and display
     * @param el el the tide widget element
     * @param curve obj the curve dimensions
     * @param tides obj the parsed tides data
     * @param temp obj the parsed temperature data
     */
    function buildChart(el, curve, tides, temp) {
		tides = tides.predictions;
        temp = temp.data;
                
        var tideHeight,
            output,
            display = {
                'imperial' : 'block',
                'metric' : 'none'
            }, 
            cname = 'uri-tides-water-temp';
                
        if (helpers.getCookie(cname)== 'metric') {
            display.imperial = 'none';
            display.metric = 'block';
        }
                                
        output = '<div class="uri-tides-metrics">';
        output += '<span class="label">WATER TEMP</span>';
        output += '<div style="display: ' + display.imperial + '; font-size: ' + curve.bound + 'px" title="Switch to celcius">';
        output += temp[0].v + '&#176;<em>F</em>';
        output += '</div><div style="display: ' + display.metric + '; font-size: ' + curve.bound + 'px" title="Switch to fahrenheit">';
        output += Math.round((temp[0].v - 32) * 5 / 9 * 10) / 10 + '&#176;<em>C</em>';
        output += '</div>';
        output += '</div>';
        
        
        /*
         * Build the SVG
         */
        
        // Initialize
        var now = new Date(),
            times = [],
            m = {},
            i;
                             
        // Convert and push tide times to new array for use in next step
        for (i=0; i<tides.length; i++) {
            var t = tides[i].t.replace(' ', 'T') + 'Z';
            times.push(new Date(t));
                        
            if (now < times[i]) {
                m.x = now - times[i-1];
                m.last = tides[i-1].type;
                break;
            }
        }
         
        
        // Calculate the duration of one quarter and one whole tidal cycle, based on time between last and next slack
        m.quarter = (times[i] - times[i-1]) / 2;
        m.cycle = m.quarter * 4;
       
        
        // Determine the position of the current tide in time along the displayed cycle
        if (m.last == 'L') {
            m.x = (m.x >= m.quarter) ? m.x - m.quarter : m.x + m.quarter * 3;
        } else {
            m.x = m.x + m.quarter;
        }
        
        
        // Use the x position to calculate the y position on a sine curve
        var x = (2 * Math.PI) / m.cycle * m.x;
        m.y = Math.sin(x) + 1;
        
        var fillcolor = el.classList.contains('darkmode') ? '#fff' : '#555';
        
        // Put it all together, converting the x and y positions to proportions of the SVG dimensions
        output += '<div class="uri-tides-tide">';
        output += '<span class="label">TIDE</span>';
        output += '<svg height="' + (curve.height + curve.padding * 2) + 'px" width="' + (curve.width + curve.padding * 2) + 'px" class="uri-tides-graphic">';
        output += '<circle cx="' + (curve.width / m.cycle * m.x + curve.padding) + '" cy="' + (curve.height - curve.height / 2 * m.y + curve.padding) + '" r="' + curve.padding + '" stroke="black" stroke-width="0" fill="' + fillcolor + '" />';
        output += '</svg>';
        output += '</div>';
        
        output += '<div class="uri-tides-source">Source: <a href="https://tidesandcurrents.noaa.gov/stationhome.html?id=' + parameters.station + '" title="NOAA Center for Operational Oceanographic Producs and Services">NOAA/NOS/CO-OPS</a></div>';
        
        
        // Display
        el.innerHTML = output;
        
        helpers.unitControl(el, '.uri-tides-metrics', cname);
        
    }
    
})();
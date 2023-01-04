(function(){
    
    'use strict';
    
    /*
     * See CO-OPS JSON API documentation at https://tidesandcurrents.noaa.gov/api/
     */
    var parameters = {
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
        
        static formatDate(d, offset) {
            d.setDate( d.getDate() + offset );
            return d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
        }
        
        static status(el, m) {
            var s = el.querySelector('.status');
            s.innerHTML = m;
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
            
            // Set the station id
            var station = els[i].getAttribute('data-station');
            
            if ( tides ) {
                helpers.status(els[i], 'Initiating tide data...');
                buildChart(els[i], curve, station, );
            }
        };
            
    }

    /*
     * Build chart and display
     * @param el el the tide widget element
     * @param curve obj the curve dimensions
     */
		function buildChart(el, curve, station) {

			var tideHeight,
					output,
					tide = tides.tide.predictions,
					temp = tides.temperature.data,
					display = {
							'imperial' : 'block',
							'metric' : 'none'
					}, 
					cname = 'uri-tides-water-temp';
							
			if (helpers.getCookie(cname) == 'metric') {
					display.imperial = 'none';
					display.metric = 'block';
			}
															
			output = '<div class="uri-tides-metrics">';
			output += '<span class="label">WATER</span>';
			output += '<div style="display: ' + display.imperial + '; font-size: ' + curve.bound + 'px" title="Switch to celsius">';
			output += parseFloat(temp[0].v).toFixed(1) + '&#176;<em>F</em>';
			output += '</div><div style="display: ' + display.metric + '; font-size: ' + curve.bound + 'px" title="Switch to fahrenheit">';
			output += parseFloat(Math.round((temp[0].v - 32) * 5 / 9 * 10) / 10).toFixed(1) + '&#176;<em>C</em>';
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
        for (i=0; i<tide.length; i++) {
            var t = tide[i].t.replace(' ', 'T') + 'Z';
            times.push(new Date(t));
                        
            if (now < times[i]) {
                m.x = now - times[i-1];
                m.last = tide[i-1].type;
                break;
            }
        }
         
        
        // Calculate the duration of one quarter and one whole tidal cycle, based on time between last and next slack
        m.quarter = (times[i] - times[i-1]) / 2;
        m.cycle = m.quarter * 4;
       
        
        // Determine the position of the current tide in time along the displayed cycle
        if (m.last == 'L') {
            m.status = 'Tide is rising';
            m.x = (m.x >= m.quarter) ? m.x - m.quarter : m.x + m.quarter * 3;
        } else {
            m.status = 'Tide is falling';
            m.x = m.x + m.quarter;
        }
        
        
        // Use the x position to calculate the y position on a sine curve
        var x = (2 * Math.PI) / m.cycle * m.x;
        m.y = Math.sin(x) + 1;
        
		// prepare the date of tide retrieval for display
        var retrieved = new Date(tides.date * 1000);
		var options = { year: 'numeric', month: 'short', day: 'numeric', hour: "2-digit", minute: "2-digit" };
        
        var fillcolor = el.classList.contains('darkmode') ? '#fff' : '#555';
        
        // Put it all together, converting the x and y positions to proportions of the SVG dimensions
        output += '<div class="uri-tides-tide">';
        output += '<span class="label">TIDE</span>';
        output += '<div class="screenreader">' + m.status + '</div>';
        output += '<svg height="' + (curve.height + curve.padding * 2) + 'px" width="' + (curve.width + curve.padding * 2) + 'px" class="uri-tides-graphic">';
        output += '<circle cx="' + (curve.width / m.cycle * m.x + curve.padding) + '" cy="' + (curve.height - curve.height / 2 * m.y + curve.padding) + '" r="' + curve.padding + '" stroke="black" stroke-width="0" fill="' + fillcolor + '" />';
        output += '</svg>';
        output += '</div>';
        
        output += '<div class="uri-tides-source">Source: <a href="https://tidesandcurrents.noaa.gov/stationhome.html?id=' + station + '" title="NOAA Center for Operational Oceanographic Producs and Services; tide data retrieved: ' + retrieved.toLocaleDateString("en-US", options) + '">NOAA/NOS/CO-OPS</a></div>';
        
        
        // Display
        el.innerHTML = output;
        
        helpers.unitControl(el, '.uri-tides-metrics', cname);
        
    }
    
})();
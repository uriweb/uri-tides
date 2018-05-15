# URI Tides Widget

Add the `[uri-tides]` shortcode to a page and a tides widget appears.

The widget pulls in live water temp and tide prediction data from NOAA and graphically displays the current position of the tide.  By default, data is pulled from the station at Quonset Point, RI, but a different station or buoy can be set if desired.

## Attributes

The tides widget is somewhat configurable by adding attributes to the shortcode:

**`station`** (num)(optional)  
The NOAA station ID from which to retrieve data. The default is Quonset Point, RI. (default: `8454049`)  
Find a station on NOAA's [tides and currents website](https://tidesandcurrents.noaa.gov/stations.html).

**`height`** (num)(optional)  
Set a height in pixels for the tide chart (do not include units). The water temp will scale accordingly. (default: `30`)

**`darkmode`** (bool)(optional)  
Toggle a light display for placement on dark backgrounds (default: `false`)

**`class`** (string)(optional)  
Set custom CSS class(s) (default: none)

## Plugin Details

Contributors: Brandon Fuller, John Pennypacker  
Tags: widgets  
Requires at least: 4.0  
Tested up to: 4.8  
Stable tag: 1.1.0  
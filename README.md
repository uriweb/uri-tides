# URI Tides Widget

Add the `[uri-tides]` shortcode to a page and a tides widget appears.  Requires the [URI Tides Updater](https://github.com/uriweb/uri-tides-updater) plugin to be installed and activated on at least one site in a multisite network.

## How do I get set up?

1. Install [URI Tides Updater](https://github.com/uriweb/uri-tides-updater). For multisite networks, activate it only on one site (e.g. the homepage) to avoid cron job duplication.
2. Install [URI Tides](https://github.com/uriweb/uri-tides/archive/refs/heads/master.zip) and activate it where you intend to use it.  Network-activation may be appropriate.
3. Configure the shortcode to taste.

## Attributes

The tides widget is somewhat configurable by adding attributes to the shortcode:

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
Tested up to: 6.0  
Stable tag: 2.0  

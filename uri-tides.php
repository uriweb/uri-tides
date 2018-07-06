<?php
/*
Plugin Name: URI Tides
Plugin URI: http://www.uri.edu
Description: Live tide data from NOAA
Version: 1.1.1
Author: URI Web Communications
Author URI: 
@author: Brandon Fuller <bjcfuller@uri.edu>
@author: John Pennypacker <jpennypacker@uri.edu>
*/

// Block direct requests
if ( !defined('ABSPATH') )
	die('-1');


/**
 * Loads up the javascript
 */
function uri_tides_scripts() {
	wp_register_script( 'uri-tides', plugins_url( '/js/tides.js', __FILE__ ) );
	wp_enqueue_script( 'uri-tides' );
	$tides = uri_tides_get_data();
	wp_localize_script( 'uri-tides', 'tides', $tides);
}


/**
 * Loads up the css
 */
function uri_tides_styles() {
	wp_register_style( 'uri-tides-css', plugins_url( '/css/tides.css', __FILE__ ) );    
	wp_enqueue_style( 'uri-tides-css' );
}


/**
 * Shortcode callback
 */
function uri_tides_shortcode($attributes, $content, $shortcode) {
   
	uri_tides_scripts();
	uri_tides_styles();


	// Attributes
	extract( shortcode_atts(
		array(
			'station' => '8454049',
			'darkmode' => false,
			'height' => '30',
			'class' => ''
		), $attributes )
	);

	$output = '<div class="uri-tides-widget';

	if ($darkmode) {
			$output .= ' darkmode';
	}

	if (!empty($class)) {
			$output .= ' ' . $class;
	}
		
	$output .= '" data-station="' . $station . '" " data-height="' . $height . '"><span class="status"></span></div>';

	return $output;

}
add_shortcode( 'uri-tides', 'uri_tides_shortcode' );






/**
 * WP CRON SETTINGS
 * Set up a cron interval to run every 10 minutes
 */
function uri_tides_add_cron_interval( $schedules ) {
	$schedules['ten_minutes'] = array(
		'interval' => 60 * 10,
		'display' => esc_html__( 'Every Ten Minutes' ),
	);
	return $schedules;
}
add_filter( 'cron_schedules', 'uri_tides_add_cron_interval' );

// set us up the cron hook
// https://developer.wordpress.org/plugins/cron/scheduling-wp-cron-events/
add_action( 'uri_tides_cron_hook', 'uri_tides_query_buoy' );

// finally, make sure that get tides is going run during the next 10 minute cron run
if ( ! wp_next_scheduled( 'uri_tides_cron_hook' ) ) {
	wp_schedule_event( time(), 'ten_minutes', 'uri_tides_cron_hook' );
}

 
/**
 * Deactivate the cron setting if the plugin is shut off
 */
function uri_tides_deactivate() {
	$timestamp = wp_next_scheduled( 'uri_tides_cron_hook' );
	wp_unschedule_event( $timestamp, 'uri_tides_cron_hook' );
}
register_deactivation_hook( __FILE__, 'uri_tides_deactivate' );


/**
 * Controller of the tides data for the plugin.
 * Checks for a cache
 * if we have a good cache, we use that.
 * otherwise, we query new tides data, and if it's good, we cache it.
 *
 * This is likely redundant due to the cron activity, but the code's here, and it 
 * won't run if there's a recent cache
 * @see uri_tides_add_cron_interval()
 * 
 * Why not a transient?  Because I'm a control freak 
 * who would rather have stale data than no data
 */
function uri_tides_get_data() {

	$refresh_cache = FALSE;
	
	// 1. load all cached tide data
	$tides_data = get_site_option( 'uri_tides_cache', FALSE);
	if ( empty( $tides_data ) ) {
		$tides_data = array();
	}

	// 2. check if we have a cache for this resource
	if ( $tides_data !== FALSE ) {
		// we've got cached data!
		// 3. check if the cache has sufficient recency
		if ( uri_tides_is_expired( $tides_data['date'] ) ) {
			// cache is older than the specified recency, refresh it
			// 4. refresh tides / update cache if needed
			$refresh_cache = TRUE;
		}

	} else { // no cache data
		$refresh_cache = TRUE;
	}
	
	if( $refresh_cache ) {
		//echo '<pre>Pull fresh tides and cache them</pre>';
		
		$tides_data = uri_tides_query_buoy();
		
		if($tides_data !== FALSE) {
			uri_tides_write_cache($tides_data);
		}
		
	}
	
	return $tides_data;

}

/**
 * Query the NOAA buoy
 * @return mixed; arr on success, bool false on failure
 */
function uri_tides_query_buoy() {
	$station = '8454049';
	$tides_data = array();
	$tides_data['temperature'] = _uri_tides_query( _uri_tides_build_url ( 'temperature', $station ) );
	$tides_data['tide'] = _uri_tides_query( _uri_tides_build_url ( 'tide', $station ) );
	
	if ( $tides_data['temperature'] !== FALSE && $tides_data['tide'] !== FALSE ) {
		return $tides_data;
	}	else {
		return FALSE;
	}
}

/**
 * Build the URL for the tides request
 * @param str $subject is the three letter subject code
 * @return str
 */
function _uri_tides_build_url( $q='temperature', $station='8454049' ) {
	$base = 'https://tidesandcurrents.noaa.gov/api/datagetter?';
	$application = 'NOS.COOPS.TAC.' . ($q == 'temperature') ? 'PHYSOCEAN' : 'WL';
	
	if($q == 'temperature' ) {
		$url = $base . 'product=water_temperature&application=' . $application . 
					'&date=latest&station=' . $station . 
					'&time_zone=GMT&units=english&interval=6&format=json';
	} else {
		$start_date = date( 'Ymd', strtotime( 'yesterday' ) );
		$end_date = date( 'Ymd', strtotime( '+2 days' ) );

		$url = $base . 'product=predictions&application=' .
					$application . '&begin_date=' . $start_date . '&end_date=' . $end_date . 
					'&datum=MLLW&station=' . $station . 
					'&time_zone=GMT&units=english&interval=hilo&format=json';
					
	}
	
	return $url;
}

/**
 * Save the data retrieved from the NOAA buoy as a WordPress site-wide option
 * @param arr $tides_data is an array of tides data [temperature, tide]
 */
function uri_tides_write_cache( $tides_data ) {
	$tides_data['date'] = strtotime('now');
	update_site_option( 'uri_tides_cache', $tides_data, TRUE );
}


/**
 * check if a date has recency
 * @param int date
 * @return bool
 */
function uri_tides_is_expired( $date ) {
	$recency = get_site_option( 'uri_tides_recency', '5 minutes' );
	$expiry = strtotime( '-'.$recency, strtotime('now') );
	return ( $date < $expiry );
}



/**
 * Query the buoy for tide level
 * @return mixed arr on success; FALSE on failure
 */
function _uri_tides_query( $url ) {

	$args = array(
		'user-agent' => 'URI Tides WordPress Plugin', // So api.uri.edu can easily figure out who we are
		'headers' => [ ]
	);
	
	
	$response = wp_safe_remote_get ( $url, $args );
	
	if ( isset( $response['body'] ) && !empty( $response['body'] ) && wp_remote_retrieve_response_code($response) == '200' ) {
		// hooray, all is well!
		return json_decode ( wp_remote_retrieve_body ( $response ) );

	} else {

		// still here?  Then we have an error condition
	
		if ( is_wp_error ( $response ) ) {
			$error_message = $response->get_error_message();
			echo 'There was an error with the URI Tides Plugin: ' . $error_message;
			return FALSE;
		}
		if ( wp_remote_retrieve_response_code($response) != '200' ) {
			echo $response;
			return FALSE;
		}

		// still here?  the error condition is indeed unexpected
		echo "Empty response from server?";
		return FALSE;
	}
}


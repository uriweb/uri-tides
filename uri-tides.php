<?php
/*
Plugin Name: URI Tides
Plugin URI: http://www.uri.edu
Description: Display live tide data from NOAA (requires URI Tides Updater as a controller)
Version: 2.1.0
Author: URI Web Communications
Author URI: 
@author: Brandon Fuller <bjcfuller@uri.edu>
@author: John Pennypacker <jpennypacker@uri.edu>
@author: Alexandra Gauss <alexandra_gauss@uri.edu>
*/

// Block direct requests
if ( !defined('ABSPATH') )
	die('-1');

/**
 * Returns version to be used for cache busting
 *
 * @return str
 */
function uri_tides_cache_buster() {
	static $cache_buster;
	if ( empty( $cache_buster ) && function_exists( 'get_plugin_data' ) ) {
		$values = get_plugin_data( plugin_dir_path( __FILE__ ) . 'uri-tides.php', false );
		$cache_buster = $values['Version'];
	} else {
		$cache_buster = gmdate( 'Ymd', strtotime( 'now' ) );
	}
	return $cache_buster;
}

/**
 * Loads up the javascript and styles
 */
function uri_tides_enqueues() {
	wp_register_script( 'uri-tides', plugins_url( '/js/tides.js', __FILE__ ), array(), uri_tides_cache_buster(), true );
	wp_enqueue_script( 'uri-tides' );

	$tides = get_site_option( 'uri_tides_updater_cache', FALSE );
	wp_localize_script( 'uri-tides', 'tides', $tides);

	wp_register_style( 'uri-tides-css', plugins_url( '/css/tides.css', __FILE__ ) );    
	wp_enqueue_style( 'uri-tides-css' );
}
add_action( 'wp_enqueue_scripts', 'uri_tides_enqueues' );


/**
 * Shortcode callback
 */
function uri_tides_shortcode($attributes, $content, $shortcode) {

	// Attributes
	extract( shortcode_atts(
		array(
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
		
	$output .= '" data-height="' . $height . '"><span class="status"></span></div>';

	return $output;

}
add_shortcode( 'uri-tides', 'uri_tides_shortcode' );

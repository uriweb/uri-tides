<?php
/*
Plugin Name: URI Tides
Plugin URI: http://www.uri.edu
Description: Live tide data from NOAA
Version: 0.1
Author: URI Web Communications
Author URI: 
@author: Brandon Fuller <bjcfuller@uri.edu>
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
        
    $output .= '" data-height="' . $height . '"><span class="status">Water data is unavailable</span></div>';
    
    return $output;
    
}
add_shortcode( 'uri-tides', 'uri_tides_shortcode' );


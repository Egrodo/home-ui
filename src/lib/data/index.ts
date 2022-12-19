import { PUBLIC_SERVER_URL as SERVER_URL, PUBLIC_WEATHER_ENTITY_ID } from '$env/static/public';
import { lightStore, weatherStore } from './stores';
import { connect } from './ws';

/**
 * I will build this app operating on the assumption that all lights will support both hs and color_temp modes:
 *
 * hs: In HS mode the light's brightness can be set and read using the `brightness`
 *     property. The light's color can be set and read using the `hs_color` property.
 *     `hs_color` is an (h, s) tuple (no brightness).
 */

// TODO: area map
// TODO: interface scene
// TODO: interface switch

// TODO: calendar?

export async function init() {
	connect();
}

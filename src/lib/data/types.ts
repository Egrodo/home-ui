export type ColorMode = 'hs' | 'xy' | 'rgb' | 'color_temp';

interface LightEntityAttributes {
	min_color_temp_kelvin: string;
	max_color_temp_kelvin: string;
	supported_color_modes: ColorMode[]; // Stored for sanity check
	effect_list: string[];
	effect: string;
	friendly_name: string;
	icon?: string; // string in form of `mdi:${kebab-case-material-icon-name}`
	// ... the data we get from the API might have more properties not included here and I will
	//     still store them in my localStorage & memory, but I will only *access* the
	//     properties indicated here.

	// These depend on whether the state is on or not
	color_mode?: ColorMode;
	color_temp_kelvin?: number; // between `min_color_temp_kelvin` and `max_color_temp_kelvin`
	brightness?: number; // 0-255
	rgb_color?: [number, number, number]; // [0-255, 0-255, 0-255]
	rate_limit_remaining?: number;
	rate_limit_reset_seconds?: number;
}

type EntityTypes = 'light' | 'switch' | 'scene' | 'weather';

export type WeatherStates =
	| 'clear-night'
	| 'cloudy'
	| 'exceptional'
	| 'fog'
	| 'hail'
	| 'lightning'
	| 'lightning-rainy'
	| 'partycloudy'
	| 'pouring'
	| 'rainy'
	| 'snowy'
	| 'snowy-rainy'
	| 'sunny'
	| 'windy'
	| 'windy-variant';

interface PrimitiveEntity<EntityAttributes = void> {
	entity_id: `${EntityTypes}.${string}`;
	state: 'off' | 'on' | 'unavailable' | WeatherStates;
	attributes: EntityAttributes;
	context?: {
		id: string;
	};
	last_changed?: string; // Date string
	last_updated?: string; // Date string
}

interface ForecastType {
	condition: WeatherStates;
	datetime: string;
	temperature: number;
	templow: number;
}

interface WeatherEntityAttributes {
	temperature: number;
	temperature_unit: '°C' | '°F';
	humidity: 75;
	forecast: ForecastType[];
	friendly_name: 'Forecast Home';
}

interface SwitchEntityAttributes {
	friendly_name: string;
	icon?: string;
}

interface SceneEntityAttributes {
	entity_id: string[]; // This is actually an array of entity_id('s), referring to the devices involved in that scene
	friendly_name: string;
	icon: string;
	id: string;
}

export type LightEntity = PrimitiveEntity<LightEntityAttributes>;
export type WeatherEntity = PrimitiveEntity<WeatherEntityAttributes>;
export type SwitchEntity = PrimitiveEntity<SwitchEntityAttributes>;
export type SceneEntity = PrimitiveEntity<SceneEntityAttributes>;

export enum Rooms {
	AllRooms = 'All Rooms',
	LivingRoom = 'Living Room',
	Bedroom = 'Bedroom',
	Office = 'Office'
}

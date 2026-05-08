export type ColorMode = 'hs' | 'xy' | 'rgb' | 'color_temp';

interface LightEntityAttributes {
	min_color_temp_kelvin: number;
	max_color_temp_kelvin: number;
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

type EntityTypes = 'light' | 'switch' | 'scene' | 'weather' | 'sun';

export type WeatherStates =
	| 'clear-night'
	| 'cloudy'
	| 'exceptional'
	| 'fog'
	| 'hail'
	| 'lightning'
	| 'lightning-rainy'
	| 'partlycloudy'
	| 'pouring'
	| 'rainy'
	| 'snowy'
	| 'snowy-rainy'
	| 'sunny'
	| 'windy'
	| 'windy-variant';

interface PrimitiveEntity<EntityAttributes = void> {
	entity_id: `${EntityTypes}.${string}`;
	state: 'off' | 'on' | 'unavailable' | 'above_horizon' | 'below_horizon' | WeatherStates;
	attributes: EntityAttributes;
	context?: {
		id: string;
	};
	last_changed?: string; // Date string
	last_updated?: string; // Date string
}

export interface ForecastType {
	condition: WeatherStates;
	datetime: string;
	temperature: number;
	templow?: number; // only present in daily forecasts
}

interface SunEntityAttributes {
	next_rising: string;
	next_setting: string;
	elevation: number;
	azimuth: number;
	rising: boolean;
	friendly_name: string;
}

export type SunEntity = PrimitiveEntity<SunEntityAttributes>;

interface WeatherEntityAttributes {
	temperature: number;
	temperature_unit: '°C' | '°F';
	humidity: number;
	forecast?: ForecastType[];
	friendly_name: string;
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
	Office = 'Office',
	Den = 'Den',
	Hallway = 'Hallway'
}

export interface DeviceInfo {
	area_id: string | null;
	id: string;
	name: string;
	name_by_user: string;
	model: string | null;
	manufacturer: string | null;
}

export type DeviceInfoLookupTable = Record<string, DeviceInfo>;

export interface EntityRegistryEntry {
	entity_id: string;
	device_id: string | null;
	area_id: string | null;
	hidden_by: string | null;
	disabled_by: string | null;
	entity_category: string | null;
}

/** Maps entity_id → effective area_id (entity-level override, falling back to device area) */
export type EntityAreaMap = Record<string, string | null>;

export interface StockData {
	ticker: string;
	price: number;
	change: number;
	changePercent: number;
	sparkline: number[];
}

export interface CalendarEvent {
	summary: string;
	start: string;
	end: string;
	description?: string;
	location?: string;
}

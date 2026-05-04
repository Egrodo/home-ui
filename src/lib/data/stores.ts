import { writable } from 'svelte/store';
import { Rooms } from './types';

export const selectedRoomStore = writable<Rooms>(Rooms.AllRooms);
export const showFahrenheitStore = writable<boolean>(false);

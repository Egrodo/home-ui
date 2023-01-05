import { Rooms } from '$lib/data/types';

export default function stripRoomNames(roomName: string): string {
	let strippedRoomName = roomName;
	Object.values(Rooms).forEach((room) => {
		strippedRoomName = strippedRoomName.replace(room, '');
	});
	return strippedRoomName;
}

import { $ } from "aberdeen"
import { StatefulElement } from "./types"

const RoomList: StatefulElement = (render, state, client) => {
    $('ol', () => {
        for (const room of client.getRooms()) {
            $('li', () => {
                $('button', ':' + (room.name ?? 'invalid'), {
                    click: () => state.current_room = room,
                    disabled: state.current_room?.roomId == room.roomId,
                })
            })
        }
    })
}
export default RoomList
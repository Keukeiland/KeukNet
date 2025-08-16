import { $ } from "aberdeen"
import RoomList from "./RoomList"
import { StatefulElement } from "./types"
import RoomView from "./RoomView"

const App: StatefulElement = (render, state, client) => {
    $('div.TopBar', () => {
        $('span.StatusIndicator', {'$color': state.connected ? 'green' : 'red'}, `:⬤`)
        if (!state.connected) {
            return
        }
    
        render(RoomList)
    })

    render(RoomView(state.current_room))
}
export default App

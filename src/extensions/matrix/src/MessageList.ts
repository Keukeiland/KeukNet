import { $, clean, observe, proxy, unproxy } from "aberdeen"
import { StatefulElement } from "./types"
import { MatrixEvent, Room, RoomEvent } from "matrix-js-sdk"

const MessageList: (room: Room) => StatefulElement = (room) => function MessageList(render, state, client) {
    function load_room_messages() {
        const result: Array<MatrixEvent> = []

        for (const event of room.getLiveTimeline().getEvents()) {
            if (event.event.type == "m.room.message") {
                result.push(event)
            }
        }

        return result
    }

    let messages = proxy(load_room_messages())
    let all_messages_loaded = proxy(false)
    let loading_more_messages = false

    observe(() => {
        const listener = (event: MatrixEvent, event_room?: Room) => {
            if (event_room?.roomId == room.roomId) {
                if (event.event.type == "m.room.message") {
                    messages.push(event)
                    console.log("gid")
                }
            }
        }
        
        client.addListener(RoomEvent.Timeline, listener)
        clean(() => {
            client.removeListener(RoomEvent.Timeline, listener)
        })
    })

    $('div.scroller', {
        "$overflow-y": "scroll",
        "$height": "100%",
        "$display": "flex",
        "$flex-direction": "column-reverse",
        "$overflow-anchor": "auto !important",
    }, () => {
        $('div.scroller-content', {
            "$transform": "translateZ(0)",
        }, () => {
            if (!all_messages_loaded.value) {
                observe(() => {
                    const top_detector = $('hr', {"$width": "100%"}) as Element
                    
                    const observer = new IntersectionObserver(async (entries) => {
                        const should_get_more_messages = (() => {
                            for (const entry of entries) {
                                if (entry.isIntersecting) return true
                            }
                            return false
                        })()
        
                        if (should_get_more_messages && !loading_more_messages) {
                            loading_more_messages = true

                            const more_messages_available = await client.paginateEventTimeline(unproxy(room).getLiveTimeline(), {backwards: true})
                            if (!more_messages_available) {
                                console.log("All messages loaded")
                                all_messages_loaded.value = true
                            }
        
                            messages = load_room_messages()

                            loading_more_messages = false
                        }
                    })
                    observer.observe(top_detector)

                    clean(() => {
                        observer.unobserve(top_detector)
                    })
                })
            }

            for (const message of messages) {
                const body: string = message.event.content?.body ?? 'ERROR'
                const sender = client.getUser(message.event.sender as string)
        
                $('p', () => $('b:' + sender?.displayName + ': '), ':' + body)
            }

            console.log(unproxy(room.getLiveTimeline().getEvents().map((e) => unproxy(e.event))))
        })
    })
}
export default MessageList
import { $, unproxy } from "aberdeen"
import { StatefulElement } from "./types"
import { MsgType, Room } from "matrix-js-sdk"
import MessageList from "./MessageList"

const RoomView: (room: Room|null) => StatefulElement = (room) => function RoomView(render, state, client) {
    if (room == null) {
        $('p:No room selected!')
        return
    }

    const onSend = (e: any) => {
        e.preventDefault()

        const message_input = e.target.elements.message
        const message = message_input.value.trim() as string
        if (message == '') return

        client.sendMessage(room.roomId, {
            msgtype: MsgType.Text,
            body: message,
        })

        message_input.value = ''

        return false
    }

    $('div.left', () => {
        render(MessageList(room))
        $('form', () => {
            $('input', {name: 'message'})
            $('input', {type: 'submit'})
        }, {
            submit: onSend
        })
    })
    $('div.right', () => {
        const members = room.getMembers()
        for (const member of members) {
            console.log(unproxy(member))

            $('p', () => {
                $('b:' + member.name)
                $('br')
                $('i:LVL: ' + member.powerLevel)
            })
            $('hr')
        }
    })
}
export default RoomView

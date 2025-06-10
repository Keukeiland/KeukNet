/** @type {string} Currently selected channel */
var current_channel = null

var peer_audio = new Map()

function join_channel(new_channel) {
    if (current_channel) {
        part_channel()
    }
    current_channel = new_channel
    local_user.con.emit('join', {'channel': current_channel, 'userdata': {name: USERNAME, style: USERSTYLE}})
    update_displays()
}
function part_channel() {
    if (current_channel) {
        local_user.con.emit('part', current_channel)
    }
    current_channel = null
    update_displays()
}

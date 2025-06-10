/**
 * @typedef {{name: string, style: string}} user
 */

/** @type {Object.<string, Map<string, user>>} All channels and their users */
const channel_users = JSON.parse(CHANNEL_USERS_STUFF, (k, v) => {
    if (typeof v === 'object' && v !== null) {
        if (v.dataType === 'Map') {
            return new Map(v.value)
        }
    }
    return v
})

/**
 * @param {string} name
 * @returns {HTMLDivElement}
 */
function new_channel(name) {
    const channel = document.createElement('div')
    channel.id = name
    channel.classList = ['channel']

    const channel_title = document.createElement('b')
    channel_title.innerText = name.substring(8)

    const toggle_button = document.createElement('a')
    toggle_button.classList = ['button']
    toggle_button.textContent = current_channel == name ? "Leave" : "Join"
    toggle_button.onclick = (e) => {
        if (current_channel == name) {
            toggle_button.innerText = "Join"
            part_channel()
        }
        else {
            toggle_button.innerText = "Leave"
            join_channel(name)
        }
    }

    const users_div = document.createElement('div')
    users_div.classList = ['users']
    const users = channel_users[name]
    for (const [id, user] of users.entries()) {
        const user_div = document.createElement('div')
        user_div.classList = ['user']

        const icon = new Image()
        icon.src = DICEBEAR_HOST + "?" + user.style

        const text = document.createElement('h3')
        text.innerText = user.name

        user_div.append(icon, text)

        if (peer_audio.has(id) || (user.name == USERNAME && peer_audio.has('local'))) {
            /** @type {HTMLAudioElement} */
            let audio = peer_audio.get(id)
            if (!audio && user.name == USERNAME) {
                audio = peer_audio.get('local')
            }

            const slider = document.createElement('input')
            slider.type = 'range'
            slider.min = 0.0
            slider.max = 1.0
            slider.step = 0.01

            slider.value = audio.volume
            slider.addEventListener('input', (e) => {
                audio.volume = parseFloat(e.target.value)
            })

            user_div.append(slider)
        }

        users_div.append(user_div)
    }

    channel.append(channel_title, toggle_button, users_div)
    return channel
}

function update_displays() {
    let channels_div = document.getElementById('channels')
    for (const child of channels_div.children) {
        child.replaceWith(new_channel(child.id))
    }
    
    if (current_channel)
        document.getElementById('channel_display').innerText = current_channel
    else
        document.getElementById('channel_display').innerText = 'none yet'
}

window.onload = update_displays

const subscription = new EventSource('/webrtc/user_channel_event')

subscription.addEventListener('open', () => {
    console.log('[DISPLAY] Connected')
})

subscription.addEventListener('error', () => {
    console.log('[DISPLAY] Connection error')
})

subscription.addEventListener('user_join', (e) => {
    console.log('[DISPLAY] User join')
    const data = JSON.parse(e.data)
    const {id, channel, user} = data
    channel_users[channel].set(id, user)
    update_displays()
})

subscription.addEventListener('user_part', (e) => {
    console.log('[DISPLAY] User part')
    const data = JSON.parse(e.data)
    const {id, channel} = data
    channel_users[channel].delete(id)
    update_displays()
})

/** @type {HTMLTableElement} */
let messages

window.onload = function() {
    const send = document.getElementById('sendmessage')
    send.removeAttribute('action')
    send.onsubmit = sendMessage

    messages = document.getElementById('messages')
    getHistory()
}

function sendMessage (e) {
    e.preventDefault()
    const msg = e.target.message.value
    
    if (msg !== '') {
        var http = new XMLHttpRequest()
        http.open('POST', window.location.href, true)
        http.send('message='+encodeURIComponent(msg))
    }

    e.target.message.value = ''
}

function addMessage(msg) {
    function field(c) {
        let f = document.createElement('span')
        f.textContent = c
        return f
    }
    const row = messages.insertRow(-1)
    const img_col = row.insertCell(-1)
    img_col.innerHTML = '<img src="'+msg.user.pfp_code+'" class="pfp">'
    const col = row.insertCell(-1)
    const info_col = col.appendChild(document.createElement('div'))
    info_col.appendChild(field(msg.user.name))
    info_col.appendChild(field(msg.time))
    const msg_col = col.appendChild(document.createElement('div'))
    msg_col.appendChild(field(msg.content))
}

function getHistory() {
    const http = new XMLHttpRequest()
    http.open('GET', window.location.href+'/history', true)
    http.responseType = 'json'

    http.onreadystatechange = () => {
        if (http.readyState == 4 && http.status == 200) {
            data = http.response.messages
            if (data) {
                for (var i=0; i<data.length; i++) {
                    addMessage(data[i])
                }
            }
        }
    }

    http.send(null)
}

const subscription = new EventSource('/chat/new_message_event')

subscription.addEventListener('open', () => {
    console.log('Connected')
})

subscription.addEventListener('error', () => {
    console.log('Connection error')
})

subscription.addEventListener('message', (e) => {
    console.log('Received message')
    const message = JSON.parse(e.data)
    addMessage(message)
})

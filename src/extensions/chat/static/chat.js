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

let lastMessageDate
function addMessage(msg) {
    function field(c) {
        let f = document.createElement('span')
        f.textContent = c
        return f
    }

    const messageDate = new Date(msg.created_at); // Convert UNIX timestamp to Date
    const messageDay = messageDate.toISOString().split('T', 1).at(0)

    //ADD DAY SEPARATOR
    if (messageDay !== lastMessageDate) {
        const separator_row = messages.insertRow(-1)
        separator_row.insertCell(-1)
        const separator_col = separator_row.insertCell(-1)
        const date_col = separator_col.appendChild(document.createElement('div'))
        date_col.classList.add('separator')
        date_col.appendChild(field(messageDay))
    }
    

    const row = messages.insertRow(-1)
    const img_col = row.insertCell(-1)
    img_col.innerHTML = `<img src="${dicebear_host}?${msg.pfp_code}" class="pfp">`
    const col = row.insertCell(-1)
    const info_col = col.appendChild(document.createElement('div'))
    info_col.appendChild(field(msg.name))
    info_col.appendChild(field(messageDate.toLocaleTimeString('en-US', {hour12: false})))
    const msg_col = col.appendChild(document.createElement('div'))
    msg_col.appendChild(field(msg.content))

    lastMessageDate = messageDay
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

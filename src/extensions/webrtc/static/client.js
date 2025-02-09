var local_user = {audio: null, stream: null, con: null}

/** @type {Map<string, RTCPeerConnection>} */
let peers = new Map()

const sounds = {
    'join': "join.mp3",
    'leave': "leave.mp3",
}

document.addEventListener('DOMContentLoaded', init, false)

function play(url) {
    new Audio('/webrtc/'+url).play()
}

function new_audio(stream, peer_id) {
    let audio = new Audio()
    audio.autoplay = "autoplay"
    audio.controls = ""
    audio.preload = "none"
    audio.crossOrigin = "anonymous"
    audio.id = peer_id
    
    document.body.append(audio)
    audio.srcObject = stream

    return audio
}

function remove(id) {
    const peer = peers.get(id)
    peer.close()
    peers.delete(id)

    peer_audio.get(id).remove()
    peer_audio.delete(id)
}

function init() {
    set_status("connecting to server")
    console.log("Connecting to signaling server")
    let connection = io(SIGNALING_SERVER, {transports: ["websocket", "polling"]})
    local_user.con = connection

    connection.on('connect', async () => {
        set_status("connected to server")
        console.log("Connected to signaling server")
        await setup_local_media()
        set_status("ready to join")
        update_displays()
    })

    connection.on('disconnect', () => {
        set_status("disconnected from server")
        update_displays()
        console.log("Disconnected from signaling server")

        for (const peer of peers.values()) {
            remove(peer)
        }
    })

    connection.on('connect_error', (err) => {
        set_status("error whilst connecting to server: "+err.message)
    })

    connection.on('connect_failed', (err) => {
        set_status("failed to connect to server")
    })

    connection.on('addPeer', async (config) => {
        console.log('Signaling server said to add peer:', config)
        const peer_id = config.peer_id

        if (peer_id in peers) {
            console.log("Already connected to peer ", peer_id)
            return
        }

        const peer_connection = new RTCPeerConnection({
            "optional": [{"DtlsSrtpKeyAgreement": true}],
            iceServers: [
                {
                  urls: "stun:stun.relay.metered.ca:80",
                },
                {
                  urls: "turn:global.relay.metered.ca:80",
                  username: "f73a3cd0408ad7d03bf58707",
                  credential: "AuH9kjSoj6Ps8IJ0",
                },
                {
                  urls: "turn:global.relay.metered.ca:80?transport=tcp",
                  username: "f73a3cd0408ad7d03bf58707",
                  credential: "AuH9kjSoj6Ps8IJ0",
                },
                {
                  urls: "turn:global.relay.metered.ca:443",
                  username: "f73a3cd0408ad7d03bf58707",
                  credential: "AuH9kjSoj6Ps8IJ0",
                },
                {
                  urls: "turns:global.relay.metered.ca:443?transport=tcp",
                  username: "f73a3cd0408ad7d03bf58707",
                  credential: "AuH9kjSoj6Ps8IJ0",
                },
            ],
        })

        peers.set(peer_id, peer_connection)

        peer_connection.onicecandidate = (event) => {
            if (event.candidate) {
                connection.emit('relayICECandidate', {
                    'peer_id': peer_id, 
                    'ice_candidate': {
                        'sdpMLineIndex': event.candidate.sdpMLineIndex,
                        'candidate': event.candidate.candidate
                    }
                })
            }
        }
        peer_connection.ontrack = (event) => {
            console.log("ontrack", event)
            const audio = new_audio(event.streams[0], peer_id)
            peer_audio.set(peer_id, audio)
            update_displays()
            play(sounds.join)
        }

        /* Add our local stream */
        peer_connection.addStream(local_user.stream)

        /* Only one side of the peer connection should create the
            * offer, the signaling server picks one to be the offerer. 
            * The other user will get a 'sessionDescription' event and will
            * create an offer, then send back an answer 'sessionDescription' to us
            */
        if (config.should_create_offer) {
            console.log("Creating RTC offer to ", peer_id)
            const local_description = await peer_connection.createOffer({offerToReceiveAudio: true})
            await peer_connection.setLocalDescription(local_description).catch(() => {
                alert("Offer setLocalDescription failed!")
            })
            connection.emit('relaySessionDescription', {'peer_id': peer_id, 'session_description': local_description})
            console.log("Offer setLocalDescription succeeded")
        }
    })

    connection.on('sessionDescription', async (config) => {
        const peer_id = config.peer_id
        const peer = peers.get(peer_id)
        const remote_description = config.session_description

        const desc = new RTCSessionDescription(remote_description)
        await peer.setRemoteDescription(desc).catch((error) => {
            console.log("setRemoteDescription error: ", error)
        })

        console.log("setRemoteDescription succeeded")
        if (remote_description.type == "offer") {
            console.log("Creating answer")
            const local_description = await peer.createAnswer().catch((error) => {
                console.log("Error creating answer: ", error)
            })

            await peer.setLocalDescription(local_description).catch(() => {
                Alert("Answer setLocalDescription failed!")
            })

            connection.emit('relaySessionDescription', {'peer_id': peer_id, 'session_description': local_description})
            console.log("Answer setLocalDescription succeeded")
        }
    })

    connection.on('iceCandidate', (config) => {
        const peer = peers.get(config.peer_id)
        const ice_candidate = config.ice_candidate
        peer.addIceCandidate(new RTCIceCandidate(ice_candidate))
    })

    connection.on('removePeer', (config) => {
        console.log('Signaling server said to remove peer:', config)
        const peer_id = config.peer_id
        if (peers.has(peer_id)) {
            remove(peer_id)
        }
        play(sounds.leave)
    })
}

async function setup_local_media() {
    if (local_user.stream != null)
        return

    set_status("Obtaining microphone access")
    console.log("Requesting access to local audio inputs")

    navigator.getUserMedia = ( navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia)

    const stream = await navigator.mediaDevices.getUserMedia({"audio":true}).catch((err) => {
        /* user denied access to microphone */
        set_status("failed to obtain microphone access")
        throw Error(`Access denied for audio: ${err}`)
    })

    /* user accepted access to microphone */
    set_status("successfully obtained microphone access")
    console.log("Access granted to audio")
    local_user.stream = stream
    local_user.audio = new_audio(stream)
    local_user.audio.volume = 0.0
    peer_audio.set('local', local_user.audio)
}

function set_status(text) {
    document.getElementById('status').value = text
}

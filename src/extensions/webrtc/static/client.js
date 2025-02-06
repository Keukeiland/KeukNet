/* our socket.io connection to our webserver */
let signaling_socket = null
/* our own microphone */
let local_media_stream = null
/* keep track of our peer connections, indexed by peer_id (aka socket.io id) */
let peers = {}
/* keep track of our <audio> tags, indexed by peer_id */
let peer_media_elements = {'audio': {}, 'channel': {}}

let channels = null
const user_data = {'name': USERNAME, 'style': USERSTYLE}

const sounds = {
    'join': "join.ogg",
    'leave': "leave.mp3",
}

document.addEventListener('DOMContentLoaded', init, false)

function play(url) {
    new Audio('/webrtc/'+url).play()
}

function attachMediaStream(element, stream) {
    element.srcObject = stream
}

function new_audio(stream) {
    console.log(stream)
    let audio = new Audio()
    audio.autoplay = "autoplay"
    audio.controls = ""
    audio.preload = "none"
    audio.crossOrigin = "anonymous"
    audio.id = stream.id
    
    document.body.append(audio)
    attachMediaStream(audio, stream)

    peer_media_elements.audio[stream.id] = audio
    return audio
}

function remove(id) {
    peer_media_elements.audio[id].remove()
    delete peer_media_elements.audio[id]
    peer_media_elements.channel[id].remove()
    delete peer_media_elements.channel[id]
}

function add_channel(audio, stream, name, style) {
    let div = document.createElement('div')
    div.classList = ['channel']
    div.id = name

    let icon = new Image()
    icon.src = DICEBEAR_HOST + "?" + style
    let text = document.createElement('h3')
    text.innerText = name
    let slider = document.createElement('input')
    slider.type = 'range'
    slider.min = 0.0
    slider.max = 1.0
    slider.step = 0.01
    slider.value = 1.0
    slider.addEventListener('input', (e) => {
        audio.volume = parseFloat(e.target.value)
    })

    div.append(icon, text, slider)
    channels.append(div)

    peer_media_elements.channel[stream.id] = div
    return [div, slider]
}

function join_channel(channel) {
    signaling_socket.emit('join', {'channel': channel, 'userdata': user_data})
    set_channel(channel)
}
function part_channel(channel) {
    signaling_socket.emit('part', channel)
    set_channel()
}

function init() {
    channels = document.getElementById('channels')

    set_status("connecting to server")
    console.log("Connecting to signaling server")
    signaling_socket = io(SIGNALING_SERVER, {transports: ["websocket"]})

    signaling_socket.on('connect', () => {
        set_status("connected to server")
        console.log("Connected to signaling server")
        setup_local_media(() => {
            set_status("ready to join")
            set_channel()
        })
    })

    signaling_socket.on('disconnect', () => {
        set_status("disconnected from server")
        set_channel()
        console.log("Disconnected from signaling server")
        /* Tear down all of our peer connections and remove all the
            * media divs when we disconnect */
        for (peer_id in peers) {
            peers[peer_id].close()
            remove(peer_id)
        }

        peers = {}
        peer_media_elements = {}
    })

    signaling_socket.on('connect_error', err => set_status("error whilst connecting to server: "+err.message))
    signaling_socket.on('connect_failed', err => set_status("failed to connect to server"))


    /** 
    * When we join a group, our signaling server will send out 'addPeer' events to each pair
    * of users in the group (creating a fully-connected graph of users, ie if there are 6 people
    * in the channel you will connect directly to the other 5, so there will be a total of 15 
    * connections in the network). 
    */
    signaling_socket.on('addPeer', async (config) => {
        console.log('Signaling server said to add peer:', config)
        var peer_id = config.peer_id
        var peerdata = config.userdata
        if (peer_id in peers) {
            /* This could happen if the user joins multiple channels where the other peer is also in. */
            console.log("Already connected to peer ", peer_id)
            return
        }
        var peer_connection = new RTCPeerConnection({
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
        peers[peer_id] = peer_connection

        peer_connection.onicecandidate = (event) => {
            if (event.candidate) {
                signaling_socket.emit('relayICECandidate', {
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
            let audio = new_audio(event.streams[0])
            console.log(audio, peerdata)
            add_channel(audio, event.streams[0], peerdata.name, peerdata.style)
            play(sounds.join)
        }

        /* Add our local stream */
        peer_connection.addStream(local_media_stream)

        /* Only one side of the peer connection should create the
            * offer, the signaling server picks one to be the offerer. 
            * The other user will get a 'sessionDescription' event and will
            * create an offer, then send back an answer 'sessionDescription' to us
            */
        if (config.should_create_offer) {
            console.log("Creating RTC offer to ", peer_id)
            let local_description = await peer_connection.createOffer({offerToReceiveAudio: true})
            console.log("Local offer description is: ", local_description)
            peer_connection.setLocalDescription(local_description, () => { 
                    signaling_socket.emit('relaySessionDescription', 
                        {'peer_id': peer_id, 'session_description': local_description})
                    console.log("Offer setLocalDescription succeeded")
                }, () => {
                    alert("Offer setLocalDescription failed!")
                }
            )
        }
    })


    /** 
     * Peers exchange session descriptions which contains information
     * about their audio / video settings and that sort of stuff. First
     * the 'offerer' sends a description to the 'answerer' (with type
     * "offer"), then the answerer sends one back (with type "answer").  
     */
    signaling_socket.on('sessionDescription', (config) => {
        console.log('Remote description received: ', config)
        var peer_id = config.peer_id
        var peer = peers[peer_id]
        var remote_description = config.session_description

        var desc = new RTCSessionDescription(remote_description)
        peer.setRemoteDescription(desc, () => {
                console.log("setRemoteDescription succeeded")
                if (remote_description.type == "offer") {
                    console.log("Creating answer")
                    peer.createAnswer((local_description) => {
                            console.log("Answer description is: ", local_description)
                            peer.setLocalDescription(local_description, () => {
                                    signaling_socket.emit('relaySessionDescription', 
                                        {'peer_id': peer_id, 'session_description': local_description, 'userdata': {'name': USERNAME, 'style': USERSTYLE}})
                                    console.log("Answer setLocalDescription succeeded")
                                }, () => {
                                    Alert("Answer setLocalDescription failed!")
                                }
                            )
                        }, (error) => {
                            console.log("Error creating answer: ", error)
                            console.log(peer)
                        }
                    )
                }
            }, (error) => {
                console.log("setRemoteDescription error: ", error)
            }
        )
        console.log("Description Object: ", desc)
    })

    /**
     * The offerer will send a number of ICE Candidate blobs to the answerer so they 
     * can begin trying to find the best path to one another on the net.
     */
    signaling_socket.on('iceCandidate', (config) => {
        var peer = peers[config.peer_id]
        var ice_candidate = config.ice_candidate
        peer.addIceCandidate(new RTCIceCandidate(ice_candidate))
    })


    /**
     * When a user leaves a channel (or is disconnected from the
     * signaling server) everyone will recieve a 'removePeer' message
     * telling them to trash the media channels they have open for
     * that peer. If it was this client that left a channel, they'll also
     * receive the removePeers. If this client was disconnected, they
     * wont receive removePeers, but rather the
     * signaling_socket.on('disconnect') code will kick in and tear down
     * all the peer sessions.
     */
    signaling_socket.on('removePeer', (config) => {
        console.log('Signaling server said to remove peer:', config)
        var peer_id = config.peer_id
        if (peer_id in peers) {
            remove(peer_id)
            peers[peer_id].close()
        }

        delete peers[peer_id]
        play(sounds.leave)
    })
}




/***********************/
/** Local media stuff **/
/***********************/
function setup_local_media(callback, errorback) {
    if (local_media_stream != null) {  /* ie, if we've already been initialized */
        if (callback) callback()
        return
    }
    /* Ask user for permission to use the computers microphone, 
        * attach it to an <audio> tag if they give us access. */
    set_status("Obtaining microphone access")
    console.log("Requesting access to local audio inputs")


    navigator.getUserMedia = ( navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia)

    navigator.mediaDevices.getUserMedia({"audio":true})
        .then((stream) => { /* user accepted access to microphone */
            set_status("successfully obtained microphone access")
            console.log("Access granted to audio")
            local_media_stream = stream
            var local_media = new_audio(stream)
            var [div, slider] = add_channel(local_media, stream, USERNAME, USERSTYLE)
            slider.value = 0.0
            local_media.volume = 0.0

            console.log(RTCRtpSender.getCapabilities("audio"))

            if (callback) callback()
        })
        .catch((err) => { /* user denied access to microphone */
            console.error(err)
            set_status("failed to obtain microphone access")
            console.log("Access denied for audio")
            if (errorback) errorback()
        })
}

function set_status(text) {
    document.getElementById('status').value = text
}
function set_channel(channel) {
    if (!(channel===undefined)) {
        document.getElementById('channel_display').innerText = channel
    }
    else {
        document.getElementById('channel_display').innerText = 'none yet'
    }
}

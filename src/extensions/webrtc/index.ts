import { ExtensionBase } from "../../modules.js"
import fs from "fs"
import http from "http"
import https from "https"
import {Server, Socket} from "socket.io"

export default class extends ExtensionBase {
    override name = 'webrtc'
    override title = 'Voice Chat'

    port = 0
    domain = ""

    override init: Extension['init'] = async (context) => {
        const PORT = 8080
        this.port = 8080
        this.domain = context.modules.config.domain


        let server
        if (context.modules.config.nginx) {
            server = http.createServer(() => {})
        }
        else {
            let privateKey = fs.readFileSync(context.modules.config.private_key_path, "utf8")
            let certificate = fs.readFileSync(context.modules.config.server_cert_path, "utf8")
            let credentials = { key: privateKey, cert: certificate }
            server = https.createServer(credentials, () => {})
        }

        server.listen(PORT, undefined, function() {
            console.log("Listening on port " + PORT)
        })

        const io = new Server(server, {
            cors: {
                origin: `https://${this.domain}:8080`,
                // origin: "*",
                credentials: true,
            }
        })


        /*************************/
        /*** INTERESTING STUFF ***/
        /*************************/
        var channels: {[channel: string]: any} = {}
        var sockets: {[id: string]: Socket} = {}
        var socket_channels: {[id: string]: any} = {}

        /**
         * Users will connect to the signaling server, after which they'll issue a "join"
         * to join a particular channel. The signaling server keeps track of all sockets
         * who are in a channel, and on join will send out 'addPeer' events to each pair
         * of users in a channel. When clients receive the 'addPeer' even they'll begin
         * setting up an RTCPeerConnection with one another. During this process they'll
         * need to relay ICECandidate information to one another, as well as SessionDescription
         * information. After all of that happens, they'll finally be able to complete
         * the peer connection and will be streaming audio/video between eachother.
         */
        io.sockets.on('connection', function (socket) {
            socket_channels[socket.id] = {}
            sockets[socket.id] = socket

            console.log("["+ socket.id + "] connection accepted")
            socket.on('disconnect', function () {
                for (var channel in socket_channels[socket.id]) {
                    part(channel)
                }
                console.log("["+ socket.id + "] disconnected")
                delete sockets[socket.id]
            })


            socket.on('join', function (config) {
                console.log("["+ socket.id + "] join ", config)
                var channel = config.channel
                var userdata = config.userdata

                if (channel in socket_channels[socket.id]) {
                    console.log("["+ socket.id + "] ERROR: already joined ", channel)
                    return
                }

                if (!(channel in channels)) {
                    channels[channel] = {}
                }

                for (let id in channels[channel]) {
                    channels[channel][id].emit('addPeer', {'peer_id': socket.id, 'should_create_offer': false, 'userdata': userdata})
                    socket.emit('addPeer', {'peer_id': id, 'should_create_offer': true, 'userdata': userdata})
                }

                channels[channel][socket.id] = socket
                socket_channels[socket.id][channel] = channel
            });

            function part(channel: any) {
                console.log("["+ socket.id + "] part ")

                if (!(channel in socket_channels[socket.id])) {
                    console.log("["+ socket.id + "] ERROR: not in ", channel)
                    return
                }

                delete socket_channels[socket.id][channel]
                delete channels[channel][socket.id]

                for (let id in channels[channel]) {
                    channels[channel][id].emit('removePeer', {'peer_id': socket.id})
                    socket.emit('removePeer', {'peer_id': id})
                }
            }
            socket.on('part', part)

            socket.on('relayICECandidate', function(config) {
                var peer_id = config.peer_id
                var ice_candidate = config.ice_candidate
                console.log("["+ socket.id + "] relaying ICE candidate to [" + peer_id + "] ")

                if (peer_id in sockets) {
                    /** @ts-ignore */
                    sockets[peer_id].emit('iceCandidate', {'peer_id': socket.id, 'ice_candidate': ice_candidate})
                }
            })

            socket.on('relaySessionDescription', function(config) {
                var peer_id = config.peer_id
                var session_description = config.session_description
                console.log("["+ socket.id + "] relaying session description to [" + peer_id + "] ")

                if (peer_id in sockets) {
                    /** @ts-ignore */
                    sockets[peer_id].emit('sessionDescription', {'peer_id': socket.id, 'session_description': session_description})
                }
            })
        })

        return ExtensionBase.init(this, context)
    }


    override requires_login: Extension['requires_login'] = (path) => {
        if (path.at(0) == 'client.js') return false
        return true
    }

    override handle: Extension['handle'] = (ctx) => {
        var location = ctx.path.shift()

        switch (location) {
            case '':
            case undefined: {
                ctx.context.domain = this.domain
                ctx.context.port = this.port
                return this.return_html(ctx, 'client')
            }
            default: {
                this.return_file(ctx, location)
            }
        }
    }
}

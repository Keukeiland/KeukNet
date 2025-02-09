import { ExtensionBase } from "../../modules.js"
import fs from "fs"
import http from "http"
import https from "https"
import {Server, Socket} from "socket.io"

type user = {style: string, name: string}
type data = {channel: string, user?: user, id: string}

export default class extends ExtensionBase {
    override name = 'webrtc'
    override title = 'Voice Chat'

    port = 0
    domain = ""
    channels = ['1', '2', '3', 'exile']

    private DataStore = class {
        data: {[channel: string]: Map<string, user>} = {}
        onJoinListeners: Set<(data: data) => void> = new Set()
        onPartListeners: Set<(data: data) => void> = new Set()

        constructor(channels: string[]) {
            channels.forEach(channel => {
                this.data[`channel-${channel}`] = new Map()
            })
        }

        join(id: string, channel: string, user: user) {
            const data: data = {
                user: {
                    name: user.name,
                    style: user.style,
                },
                channel: channel,
                id: id,
            }
            this.data[channel]?.set(id, user)
            this.onJoinListeners.forEach((listener) => listener(data))
        }

        part(id: string, channel: string) {
            const data: data = {
                channel: channel,
                id: id,
            }
            this.data[channel]?.delete(id)
            this.onPartListeners.forEach((listener) => listener(data))
        }
    }
    data_store = new this.DataStore(this.channels)

    override init: Extension['init'] = async (context) => {
        // Port of Socket.IO server
        const PORT = 8080
        // Port that is sent to clients, can differ for reverse-proxied services
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
                credentials: true,
            }
        })

        let channels: {[channel: string]: any} = {}
        let sockets: {[id: string]: Socket} = {}
        let socket_channels: {[id: string]: any} = {}

        io.sockets.on('connection', (socket) => {
            socket_channels[socket.id] = {}
            sockets[socket.id] = socket

            console.log(`RTC [${socket.id}] connection accepted`)
            socket.on('disconnect', () => {
                for (const channel in socket_channels[socket.id]) {
                    part(channel)
                }
                console.log(`RTC [${socket.id}] disconnected`)
                delete sockets[socket.id]
            })


            socket.on('join', (config) => {
                console.log(`RTC [${socket.id}] join '${config.channel}'`)
                const channel = config.channel
                const userdata = config.userdata

                if (channel in socket_channels[socket.id]) {
                    console.log(`RTC [${socket.id}] ERROR: already joined '${channel}'`)
                    return
                }

                if (!(channel in channels)) {
                    channels[channel] = {}
                }

                this.data_store.join(socket.id, channel, userdata)

                for (const id in channels[channel]) {
                    channels[channel][id].emit('addPeer', {peer_id: socket.id, should_create_offer: false})
                    socket.emit('addPeer', {peer_id: id, should_create_offer: true})
                }

                channels[channel][socket.id] = socket
                socket_channels[socket.id][channel] = channel
            });

            const part = (channel: string) => {
                console.log(`RTC [${socket.id}] part`)

                if (!(channel in socket_channels[socket.id])) {
                    console.log(`RTC [${socket.id}] ERROR: not in '${channel}'`)
                    return
                }

                delete socket_channels[socket.id][channel]
                delete channels[channel][socket.id]

                this.data_store.part(socket.id, channel)

                for (const id in channels[channel]) {
                    channels[channel][id].emit('removePeer', {'peer_id': socket.id})
                    socket.emit('removePeer', {'peer_id': id})
                }
            }
            socket.on('part', part)

            socket.on('relayICECandidate', (config) => {
                const peer_id = config.peer_id
                const ice_candidate = config.ice_candidate
                console.log(`[${socket.id}] relaying ICE candidate to [${peer_id}]`)

                if (peer_id in sockets) {
                    sockets[peer_id]?.emit('iceCandidate', {peer_id: socket.id, ice_candidate: ice_candidate})
                }
            })

            socket.on('relaySessionDescription', (config) => {
                const peer_id = config.peer_id
                const session_description = config.session_description
                console.log(`[${socket.id}] relaying session description to [${peer_id}]`)

                if (peer_id in sockets) {
                    sockets[peer_id]?.emit('sessionDescription', {peer_id: socket.id, session_description: session_description})
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
                ctx.context.channels = this.channels
                ctx.context.channel_users = JSON.stringify(this.data_store.data, (k, v) => {
                    if (v instanceof Map) {
                        return {
                            dataType: 'Map',
                            value: Array.from(v.entries()),
                        }
                    }
                    else {
                        return v
                    }
                })
                return this.return_html(ctx, 'client')
            }
            case 'user_channel_event': {
                const {req, res} = ctx

                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                })
                
                let counter = 0
                
                // Send a message on connection
                res.write('event: connected\n')
                res.write(`data: null\n`)
                res.write(`id: ${counter}\n\n`)
                counter += 1
                
                const onJoinListener = (data: data) => {
                    res.write('event: user_join\n')
                    res.write(`data: ${JSON.stringify(data)}\n`)
                    res.write(`id: ${counter}\n\n`)
                    counter += 1
                }
                const onPartListener = (data: data) => {
                    res.write('event: user_part\n')
                    res.write(`data: ${JSON.stringify(data)}\n`)
                    res.write(`id: ${counter}\n\n`)
                    counter += 1
                }
                this.data_store.onJoinListeners.add(onJoinListener)
                this.data_store.onPartListeners.add(onPartListener)
                
                // Close the connection when the client disconnects
                req.on('close', () => {
                    this.data_store.onJoinListeners.delete(onJoinListener)
                    this.data_store.onPartListeners.delete(onPartListener)
                    res.end('OK')
                })
                return
            }
            default: {
                this.return_file(ctx, location)
            }
        }
    }
}

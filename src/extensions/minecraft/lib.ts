import { Rcon } from "rcon-client"
import { LibraryBase } from "../../classes/library.ts"

export default class Minecraft extends LibraryBase {
    is_connected = false
    
    rcon = new Rcon({
        host: '127.0.0.1',
        port: 25575,
        password: '1234',
    })
    raw = this.rcon

    override init: Library['init'] = () => {
        this.rcon.on('connect', () => {
            this.is_connected = true
            this.log("connected")
        })
        this.rcon.on('end', () => {
            this.is_connected = false
            this.log("disconnected")
        })
        this.rcon.on('error', (err) => {
            this.log("err: ", err)
        })
        this.rcon.on('authenticated', () => {
            this.log("authenticated")
        })
    }

    log(...args: any[]) {
        console.log("[MINECRAFT]:",...args)
    }
    
    
    async send(command: string) {
        await this.connected()
        return this.rcon.send(command).catch(() => '')
    }
    async sendRaw(buffer: Buffer) {
        await this.connected()
        return this.rcon.sendRaw(buffer).catch(() => '')
    }
    
    async connected() {
        new Promise<void>((resolve) => {
            const loop = setInterval(async () => {
                if (!this.is_connected) {
                    await this.rcon.connect().then(
                        () => {
                            this.is_connected = true
                            clearInterval(loop)
                            resolve()
                        },
                        (err: Error) => {
                            this.is_connected = false
                            // this.log("Failed connecting:", err.message)
                        }
                    )
                }
                else {
                    clearInterval(loop)
                    resolve()
                }
            }, 5000)
        })
    }
}

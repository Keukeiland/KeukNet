import { Rcon } from "rcon-client"

function log(...args: any[]) {
    console.log("[MINECRAFT]:",...args)
}

let is_connected = false

const rcon = new Rcon({
    host: '127.0.0.1',
    port: 25575,
    password: '1234',
})
export const raw = rcon

export const send = async (command: string) => {
    await connected()
    return rcon.send(command).catch(() => '')
}
export const sendRaw = async (buffer: Buffer) => {
    await connected()
    return rcon.sendRaw(buffer).catch(() => '')
}

export const connected = async (): Promise<void> => new Promise((resolve) => {
    const loop = setInterval(async () => {
        if (!is_connected) {
            await rcon.connect().then(
                () => {
                    is_connected = true
                    clearInterval(loop)
                    resolve()
                },
                (err: Error) => {
                    is_connected = false
                    log("Failed connecting:", err.message)
                }
            )
        }
        else {
            clearInterval(loop)
            resolve()
        }
    }, 5000)
})

rcon.on('connect', () => {
    is_connected = true
    log("connected")
})
rcon.on('end', () => {
    is_connected = false
    log("disconnected")
})
rcon.on('error', (err) => {
    log("err: ", err)
})
rcon.on('authenticated', () => {
    log("authenticated")
})

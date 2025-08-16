import * as sdk from "matrix-js-sdk"
import { mount, proxy } from "aberdeen"
import { logger } from "./logger"
import App from "./App"
import { State } from "./types"
import { Renderer } from "./renderer"

const state: State = proxy({
    connected: false,
    current_room: null,
})

async function obtain_token(user_id: string): Promise<string | null> {
    // Create temporary anonymous client
    const client = sdk.createClient({
        baseUrl: "http://localhost:8008",
        logger,
    })
    await client.startClient()

    // Request client access token
    const response = await client.loginRequest({
        "type": "m.login.password",
        "password": "test",
        "identifier": {
            "type": "m.id.user",
            "user": user_id,
        },
    }).catch(() => null)
    
    client.stopClient()

    return response?.access_token ?? null
}

async function init_client() {
    const myUserId = "@test:localhost"
    
    // Get access token
    const access_token = await obtain_token(myUserId)
    if (access_token === null) throw new Error('Failed to obtain token!')
        
    const client = sdk.createClient({
        baseUrl: "http://localhost:8008",
        accessToken: access_token,
        userId: myUserId,
        logger,
    })
        
    client.once(sdk.ClientEvent.Sync, function (client_state, prevState, res) {
        if (client_state == sdk.SyncState.Prepared) {
            state.connected = true
        } else {
            throw new Error(`Invalid client state: ${client_state}`)
        }
    })
    
    await client.startClient()

    return client
}

window.onload = async () => {
    const app = document.getElementById('content')
    if (app === null) throw new Error('no app found!')

    // Ugly & Stinky
    const client = await init_client().catch(() => {console.error("Failed to connect!")}) as sdk.MatrixClient

    mount(app, () => new Renderer(state, client).render(App))
}

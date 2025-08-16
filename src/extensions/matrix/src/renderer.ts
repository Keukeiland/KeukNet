import { MatrixClient } from "matrix-js-sdk"
import { Render, State } from "./types"
import { $ } from "aberdeen"

export class Renderer {
    state: State
    client: MatrixClient

    constructor (state: State, client: MatrixClient) {
        this.state = state
        this.client = client
    }

    render: Render = (target) => {
        if (target.name) {
            $('div.' + target.name, () => target(this.render, this.state, this.client))
        }
        else {
            target(this.render, this.state, this.client)
        }
    }
}

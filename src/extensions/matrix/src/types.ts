import { MatrixClient, Room } from "matrix-js-sdk"

export type State = {
    connected: boolean,
    current_room: Room | null,
}

export type StatefulElement = (render: Render, state: State, client: MatrixClient) => void | Element

export type Render = (self: Function) => void

import { ExtensionBase } from '../../modules.ts'
import { readdir, stat } from "fs/promises"

type Game = {
    name: string,
    pack_size: number,
    wasm_size: number,
}

export default class extends ExtensionBase {
    override name = 'nobacon'
    override title = 'Games'
    games: Map<string, Game> = new Map()


    override init: Extension['init'] = async (context) => {
        const raw_dir = await readdir(`${import.meta.dirname}/static`, {withFileTypes: true})
        const game_names = raw_dir
            .filter((v) => v.isDirectory())
            .map((v) => v.name)

        for (const name of game_names) {
            const pack_file = await stat(`${import.meta.dirname}/static/${name}/${name}.pck`)
            const wasm_file = await stat(`${import.meta.dirname}/static/${name}/${name}.pck`)

            this.games.set(name, {
                name,
                pack_size: pack_file.size,
                wasm_size: wasm_file.size,
            })
        }

        return ExtensionBase.init(this, context)
    }

    override handle: Extension['handle'] = async (ctx) => {
        const game_name = ctx.path.at(0)

        // Main page
        if (!game_name) {
            ctx.context.games = this.games
            return this.return_html(ctx, 'index')
        }
        if (this.games.has(game_name)) {
            // Game asset
            if (ctx.path.at(1)) {
                return this.return_file(ctx, ctx.path.join('/'))
            }
            // Game page
            ctx.context.game = this.games.get(game_name)
            return this.return_html(ctx, 'game')
        }
        // Page asset
        return this.return_file(ctx, ctx.path.join('/'))
    }
}

import { ExtensionBase } from "../../modules.js"

export default class extends ExtensionBase {
    override name = 'minecraft'
    override title = 'Minecraft'

    override init: Extension['init'] = async (context) => {
        return ExtensionBase.init(this, context)
    }

    override handle: Extension['handle'] = (ctx) => {
        var location = ctx.path.shift()

        switch (location) {
            case '':
            case undefined: {
                return this.return_html(ctx, 'index')
            }
        }
    }
}

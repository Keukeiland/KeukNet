import { ExtensionBase } from "../../modules.ts"

export default class extends ExtensionBase {
    override name = 'matrix'
    override title = 'Matrix'

    override init: Extension['init'] = async (context) => {
        return ExtensionBase.init(this, context)
    }

    override handle: Extension['handle'] = (ctx) => {
        var location = ctx.path.shift()

        switch (location) {
            case '':
            case undefined: {
                return this.return_html(ctx, 'client')
            }
            default: {
                this.return_file(ctx, location)
            }
        }
    }
}

import { ExtensionBase } from "../../modules.ts"

export default class extends ExtensionBase {
    override name = 'nothing'
    override title = 'Nothing'

    override handle: Extension['handle'] = (ctx) => {
        this.return_html(ctx, 'index')
    }
}

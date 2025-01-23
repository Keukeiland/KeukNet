import { ExtensionBase } from "../../modules.ts"

export default class extends ExtensionBase {
    override name = 'admin'
    override title = 'Admin'
    override admin_only = true

    override handle: Extension['handle'] = (ctx) => {
        this.return_html(ctx, 'index')
    }
}

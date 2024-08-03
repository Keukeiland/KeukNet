import { ExtensionBase } from "../../modules"

export default class extends ExtensionBase {
    name = 'nothing'
    title = 'Nothing'
    dependencies = ['content','nj']

    init = (context) => {
        return ExtensionBase.init(this, context)
    }

    handle(ctx, deps) {
        this.return_html(ctx, 'index')
    }
}
